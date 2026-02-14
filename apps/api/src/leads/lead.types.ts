export type LeadListFilters = {
  search?: string;
  stageId?: string;
  excludeOnboarded?: boolean;
  ownerId?: string;
  assignedTeacherId?: string;
  source?: string;
  followUpStatus?: "open" | "done";
  followUpFrom?: string;
  followUpTo?: string;
};

export type LeadCreateInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  area?: string;
  community?: string;
  address?: string;
  guardianName?: string;
  age?: number;
  expectedBudget?: number;
  numberOfContactAttempts?: number;
  lastContactedDate?: string;
  nextFollowUp?: string;
  walkInDate?: string;
  assignedTeacherId?: string;
  demoDate?: string;
  demoConducted?: boolean;
  interest?: string;
  source?: string;
  stageId?: string;
  ownerId?: string;
  notes?: string;
  followUpDate: string;
  followUpStatus?: "open" | "done";
};

export type LeadUpdateInput = Partial<Omit<LeadCreateInput, "stageId">> & {
  stageId?: string;
};

export type LeadWorkflowPatchInput = {
  stageId?: string;
  ownerId?: string;
  assignedTeacherId?: string;
  walkInDate?: string | null;
  followUpDate?: string;
  nextFollowUp?: string | null;
  demoDate?: string | null;
  demoConducted?: boolean;
  numberOfContactAttempts?: number;
  lastContactedDate?: string | null;
};

export type LeadProfilePatchInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  area?: string;
  community?: string;
  address?: string;
  guardianName?: string;
  age?: number;
  source?: string;
  interest?: string;
  expectedBudget?: number;
  notes?: string;
};

export type LeadBulkRow = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  interest?: string;
  source?: string;
  notes?: string;
  followUpDate?: string;
};
