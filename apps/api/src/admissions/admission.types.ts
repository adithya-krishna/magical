export type AdmissionStatus = "pending" | "active" | "completed" | "cancelled";

export type DiscountType = "percent" | "amount" | "none";

export type WeeklySlotInput = {
  timeSlotId: string;
  dayOfWeek?: number;
};

export type AdmissionListFilters = {
  status?: AdmissionStatus;
  coursePlanId?: string;
  ownerId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type AdmissionCreateInput = {
  leadId: string;
  studentId?: string;
  coursePlanId: string;
  courseId: string;
  startDate: string;
  weeklySlots: WeeklySlotInput[];
  extraClasses?: number;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
  status?: AdmissionStatus;
};

export type AdmissionUpdateInput = Partial<
  Pick<AdmissionCreateInput, "extraClasses" | "discountType" | "discountValue" | "notes" | "status">
>;

export type CoursePlanCreateInput = {
  name: string;
  durationMonths: number;
  classesPerWeek?: number;
  isActive?: boolean;
};

export type CoursePlanUpdateInput = Partial<CoursePlanCreateInput>;
