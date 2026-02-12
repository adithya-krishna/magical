import { AppError } from "../common/errors";
import {
  countActiveStages,
  createLeadStage,
  deleteLeadStage,
  listLeadStages,
  updateLeadStage
} from "./lead-stage.repo";

export async function listLeadStagesService() {
  return listLeadStages();
}

export async function createLeadStageService(input: {
  name: string;
  ordering: number;
  isOnboarded?: boolean;
  isActive?: boolean;
}) {
  return createLeadStage(input);
}

export async function updateLeadStageService(
  id: string,
  patch: Partial<{
    name: string;
    ordering: number;
    isOnboarded: boolean;
    isActive: boolean;
  }>
) {
  return updateLeadStage(id, patch);
}

export async function deleteLeadStageService(id: string) {
  const activeCount = await countActiveStages();
  if (activeCount <= 1) {
    throw new AppError(400, "Cannot delete the only active stage");
  }

  return deleteLeadStage(id);
}
