import { getPrerequisitesService, updatePrerequisitesService } from "../prerequisites/prerequisites.service";

export async function getSettingsConfigService() {
  return getPrerequisitesService();
}

export async function updateSettingsConfigService(
  days: Array<{ dayOfWeek: number; isOpen: boolean; startTime?: string; endTime?: string }>
) {
  return updatePrerequisitesService(days);
}
