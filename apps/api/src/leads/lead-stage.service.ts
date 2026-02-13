import { AppError } from "../common/errors";
import {
  countActiveStages,
  createLeadStage,
  deleteLeadStage,
  getMaxLeadStageOrdering,
  listLeadStages,
  updateLeadStage
} from "./lead-stage.repo";
import type { LeadStageColor } from "./lead-stage-colors";

export async function listLeadStagesService() {
  return listLeadStages();
}

export async function createLeadStageService(input: {
  name: string;
  color: LeadStageColor;
  isOnboarded?: boolean;
  isActive?: boolean;
}) {
  const maxOrdering = await getMaxLeadStageOrdering();

  return createLeadStage({
    ...input,
    ordering: maxOrdering + 1
  });
}

export async function updateLeadStageService(
  id: string,
  patch: Partial<{
    name: string;
    color: LeadStageColor;
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
