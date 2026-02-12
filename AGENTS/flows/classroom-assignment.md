# Classroom Assignment and Attendance Flow

This flow defines how admissions create classroom assignments, how attendance is pre-generated, and how rescheduling works.

## Default configuration
- Operating days: Tue-Sun (Mon closed)
- Slot duration: 60 minutes
- Daily slots: 6 slots from 15:00 to 21:00

## Core entities
- OperatingDay: dayOfWeek, isOpen
- TimeSlotTemplate: dayOfWeek, startTime, endTime, durationMinutes
- ClassroomSlot: timeSlotId, courseId, teacherId, capacity
- ClassroomEnrollment: studentId, classroomSlotId, startDate, status
- Attendance: studentId, classroomSlotId, classDate, status

## Flow A: Admission creates classroom assignments
1. Student selects course plan + weekly slots (day/time) + start date.
2. System validates each selected slot:
   - day is open in OperatingDay
   - time slot exists in TimeSlotTemplate for that day/time
   - ClassroomSlot exists for course + time slot
   - ClassroomSlot capacity is not full
3. If any selected slot is full, admission is blocked and returns a slot-specific error.
4. Assign a fixed teacher per selected ClassroomSlot (no load balancing in v1).
5. Create ClassroomEnrollment records for each selected slot.
6. Pre-generate Attendance rows for every class date across the plan duration.

## Flow B: Classroom dashboard
1. For a given day, return TimeSlotTemplates and ClassroomSlots.
2. For each ClassroomSlot, compute occupancy from active ClassroomEnrollment.
3. Classroom card displays course, teacher, occupancy, capacity.
4. Clicking a card opens a sheet with attendance rows for the selected date range.

## Flow C: Student-initiated reschedule
1. Student requests a change for a future class date.
2. System creates a pending reschedule request and notifies admin.
3. Admin reviews available slots (same course + same teacher).
4. If approved, attendance rows are updated to the new class date and slot.
5. Student is notified of approval or rejection.

## Flow D: Admin-initiated reschedule
1. Admin selects any available slot on any day (same course + same teacher).
2. Capacity is checked.
3. Attendance rows are updated to the new class date and slot.

## Alerts and completion
- When remaining classes = 4, notify student + admin (in-app).
- When remaining classes = 0, admission stays active but admin is prompted to remove/complete.

## Example
Plan: 3 months (24 classes), Tue 16:00 and Fri 17:00, start date 2026-03-03.
- Validate Tue 16:00 + Fri 17:00 slots.
- Create 2 ClassroomEnrollment records (one per slot).
- Pre-generate 24 Attendance rows (12 Tue + 12 Fri).
- When remaining classes reaches 4, show alerts.
