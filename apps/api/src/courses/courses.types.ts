export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

export type CourseListFilters = {
  search?: string;
  instrumentId?: string;
  difficulty?: CourseDifficulty;
  isActive?: boolean;
  sortBy?: "instrument" | "difficulty" | "name";
  sortOrder?: "asc" | "desc";
};

export type CourseCreateInput = {
  instrumentId: string;
  name: string;
  difficulty: CourseDifficulty;
  description?: string;
  isActive?: boolean;
};

export type CourseUpdateInput = Partial<CourseCreateInput>;

export type InstrumentFilters = {
  search?: string;
  isActive?: boolean;
};

export type InstrumentCreateInput = {
  name: string;
  isActive?: boolean;
};

export type InstrumentUpdateInput = Partial<InstrumentCreateInput>;
