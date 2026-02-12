export type LeadListFilters = {
  search?: string;
  stageId?: string;
  ownerId?: string;
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
  interest?: string;
  source?: string;
  stageId: string;
  ownerId?: string;
  notes?: string;
  followUpDate: string;
  followUpStatus?: "open" | "done";
};

export type LeadUpdateInput = Partial<Omit<LeadCreateInput, "stageId">> & {
  stageId?: string;
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
