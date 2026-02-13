import { AppError } from "../common/errors";
import {
  archiveInstrument,
  createInstrument,
  getInstrumentById,
  getInstrumentByName,
  listInstruments,
  updateInstrument
} from "./instruments.repo";
import type {
  InstrumentCreateInput,
  InstrumentFilters,
  InstrumentUpdateInput
} from "./courses.types";

export async function listInstrumentsService(filters: InstrumentFilters) {
  return listInstruments(filters);
}

export async function createInstrumentService(input: InstrumentCreateInput) {
  const existing = await getInstrumentByName(input.name);
  if (existing) {
    throw new AppError(409, "Instrument with this name already exists");
  }

  return createInstrument(input);
}

export async function updateInstrumentService(id: string, patch: InstrumentUpdateInput) {
  const existing = await getInstrumentById(id);
  if (!existing) {
    throw new AppError(404, "Instrument not found");
  }

  if (patch.name && patch.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await getInstrumentByName(patch.name);
    if (duplicate) {
      throw new AppError(409, "Instrument with this name already exists");
    }
  }

  const updated = await updateInstrument(id, patch);
  if (!updated) {
    throw new AppError(404, "Instrument not found");
  }

  return updated;
}

export async function archiveInstrumentService(id: string) {
  const existing = await getInstrumentById(id);
  if (!existing) {
    throw new AppError(404, "Instrument not found");
  }

  return archiveInstrument(id);
}
