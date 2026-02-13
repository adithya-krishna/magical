import { AppError } from "../common/errors";
import {
  deactivateTimeSlotsForDay,
  listDayTimeWindow,
  listPrerequisites,
  upsertOperationalTimeSlot,
  updateOperatingDaysState
} from "./prerequisites.repo";

function toMinutes(timeValue: string) {
  const [hour, minute] = timeValue.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new AppError(400, "Invalid time format");
  }
  return hour * 60 + minute;
}

function toDatabaseTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

function generateHourlyTimeRanges(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const duration = end - start;

  if (duration < 60) {
    throw new AppError(400, "Daily time window must be at least 60 minutes");
  }

  if (duration % 60 !== 0) {
    throw new AppError(400, "Daily time window must align to 60-minute classes");
  }

  const ranges: Array<{ startTime: string; endTime: string; durationMinutes: number }> = [];
  for (let current = start; current < end; current += 60) {
    ranges.push({
      startTime: toDatabaseTime(current),
      endTime: toDatabaseTime(current + 60),
      durationMinutes: 60
    });
  }

  return ranges;
}

export async function getPrerequisitesService() {
  const [{ days, slots }, windows] = await Promise.all([listPrerequisites(), listDayTimeWindow()]);

  const slotsByDay = new Map<number, Array<{ id: string; startTime: string; endTime: string }>>();
  for (const slot of slots) {
    const existing = slotsByDay.get(slot.dayOfWeek) ?? [];
    existing.push({ id: slot.id, startTime: slot.startTime, endTime: slot.endTime });
    slotsByDay.set(slot.dayOfWeek, existing);
  }

  const windowByDay = new Map(windows.map((item) => [item.dayOfWeek, item]));

  const dayByWeekday = new Map(days.map((day) => [day.dayOfWeek, day]));

  const data = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const day = dayByWeekday.get(dayOfWeek);
    const window = windowByDay.get(dayOfWeek);
    return {
      dayOfWeek,
      isOpen: day?.isOpen ?? false,
      startTime: window?.startTime ?? null,
      endTime: window?.endTime ?? null,
      slots: slotsByDay.get(dayOfWeek) ?? []
    };
  });

  return { data };
}

export async function updatePrerequisitesService(
  days: Array<{ dayOfWeek: number; isOpen: boolean; startTime?: string; endTime?: string }>
) {
  for (const day of days) {
    if (day.isOpen) {
      if (!day.startTime || !day.endTime) {
        throw new AppError(400, `startTime and endTime required for day ${day.dayOfWeek}`);
      }

      if (toMinutes(day.endTime) <= toMinutes(day.startTime)) {
        throw new AppError(400, `endTime must be after startTime for day ${day.dayOfWeek}`);
      }
    }
  }

  await updateOperatingDaysState(days.map((item) => ({ dayOfWeek: item.dayOfWeek, isOpen: item.isOpen })));

  for (const day of days) {
    await deactivateTimeSlotsForDay(day.dayOfWeek);

    if (!day.isOpen || !day.startTime || !day.endTime) {
      continue;
    }

    const ranges = generateHourlyTimeRanges(day.startTime, day.endTime);
    for (const range of ranges) {
      await upsertOperationalTimeSlot({
        dayOfWeek: day.dayOfWeek,
        startTime: range.startTime,
        endTime: range.endTime,
        durationMinutes: range.durationMinutes
      });
    }
  }

  return getPrerequisitesService();
}
