import { AppError } from "../common/errors";
import { normalizeMinorAmount } from "../common/money";
import {
  createCoursePlan,
  deleteCoursePlan,
  getCoursePlanById,
  listCoursePlans,
  updateCoursePlan
} from "./course-plan.repo";
import type { CoursePlanCreateInput, CoursePlanUpdateInput } from "./admission.types";

function computeTotalClasses(durationMonths: number, classesPerWeek: number) {
  return durationMonths * 4 * classesPerWeek;
}

export async function listCoursePlansService(isActive?: boolean) {
  return listCoursePlans(isActive);
}

export async function getCoursePlanService(id: string) {
  const plan = await getCoursePlanById(id);
  if (!plan) {
    throw new AppError(404, "Course plan not found");
  }
  return plan;
}

export async function createCoursePlanService(input: CoursePlanCreateInput) {
  const classesPerWeek = input.classesPerWeek ?? 2;
  const price = normalizeMinorAmount(input.price, "price");
  if (classesPerWeek < 1) {
    throw new AppError(400, "classesPerWeek must be >= 1");
  }

  const totalClasses = computeTotalClasses(input.durationMonths, classesPerWeek);

  return createCoursePlan({
    name: input.name,
    price,
    durationMonths: input.durationMonths,
    classesPerWeek,
    totalClasses,
    isActive: input.isActive ?? true
  });
}

export async function updateCoursePlanService(id: string, patch: CoursePlanUpdateInput) {
  const existing = await getCoursePlanById(id);
  if (!existing) {
    throw new AppError(404, "Course plan not found");
  }

  const durationMonths = patch.durationMonths ?? existing.durationMonths;
  const classesPerWeek = patch.classesPerWeek ?? existing.classesPerWeek;
  const price = patch.price === undefined ? existing.price : normalizeMinorAmount(patch.price, "price");

  if (classesPerWeek < 1) {
    throw new AppError(400, "classesPerWeek must be >= 1");
  }

  const totalClasses = computeTotalClasses(durationMonths, classesPerWeek);

  const updated = await updateCoursePlan(id, {
    name: patch.name ?? existing.name,
    price,
    durationMonths,
    classesPerWeek,
    totalClasses,
    isActive: patch.isActive ?? existing.isActive
  });

  if (!updated) {
    throw new AppError(404, "Course plan not found");
  }

  return updated;
}

export async function deleteCoursePlanService(id: string) {
  const existing = await getCoursePlanById(id);
  if (!existing) {
    throw new AppError(404, "Course plan not found");
  }

  return deleteCoursePlan(id);
}
