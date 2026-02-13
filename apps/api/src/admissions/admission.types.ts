export type AdmissionStatus = "pending" | "active" | "completed" | "cancelled";

export type DiscountType = "percent" | "amount" | "none";

export type WeeklySlotInput = {
  timeSlotId: string;
  dayOfWeek?: number;
};

export type WalkInStudentInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};

export type AdmissionListFilters = {
  search?: string;
  status?: AdmissionStatus;
  coursePlanId?: string;
  ownerId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type AdmissionCreateInput = {
  leadId?: string;
  studentId?: string;
  walkInStudent?: WalkInStudentInput;
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
  price: number;
  durationMonths: number;
  classesPerWeek?: number;
  isActive?: boolean;
};

export type CoursePlanUpdateInput = Partial<CoursePlanCreateInput>;
