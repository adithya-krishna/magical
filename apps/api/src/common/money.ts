import { AppError } from "./errors";

export function normalizeMinorAmount(value: number, fieldName = "amount") {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new AppError(400, `${fieldName} must be an integer in minor units`);
  }

  if (value < 0) {
    throw new AppError(400, `${fieldName} must be >= 0`);
  }

  return value;
}

export function minorToMajor(value: number) {
  return Number((value / 100).toFixed(2));
}
