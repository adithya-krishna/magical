import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "super_admin",
  "admin",
  "staff",
  "teacher",
  "student"
]);

export const accessRequestStatus = pgEnum("access_request_status", [
  "pending",
  "approved",
  "rejected"
]);

export const accessRequestRole = pgEnum("access_request_role", [
  "admin",
  "staff",
  "teacher",
  "student"
]);

export const leadFollowUpStatus = pgEnum("lead_follow_up_status", [
  "open",
  "done"
]);

export const difficultyLevel = pgEnum("course_difficulty", [
  "beginner",
  "intermediate",
  "advanced"
]);

export const admissionStatus = pgEnum("admission_status", [
  "pending",
  "active",
  "completed",
  "cancelled"
]);

export const discountType = pgEnum("discount_type", [
  "percent",
  "amount",
  "none"
]);

export const enrollmentStatus = pgEnum("enrollment_status", [
  "active",
  "paused",
  "ended"
]);

export const attendanceStatus = pgEnum("attendance_status", [
  "scheduled",
  "present",
  "absent",
  "late",
  "excused"
]);

export const rescheduleStatus = pgEnum("reschedule_status", [
  "pending",
  "approved",
  "rejected"
]);

export const notificationSeverity = pgEnum("notification_severity", [
  "info",
  "warning",
  "critical"
]);

export const paymentStatus = pgEnum("payment_status", ["paid", "unpaid"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  role: userRole("role").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const accessRequests = pgTable("access_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  roleRequested: accessRequestRole("role_requested").notNull(),
  status: accessRequestStatus("status").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: uuid("user_id").notNull().references(() => users.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  timeZone: text("time_zone").notNull().default("system"),
  timeFormat: text("time_format").notNull(),
  weekStart: text("week_start").notNull(),
  theme: text("theme").notNull(),
  rememberLastPage: boolean("remember_last_page").notNull().default(true),
  autoLogoutMinutes: integer("auto_logout_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const leadStages = pgTable("lead_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  ordering: integer("ordering").notNull(),
  isOnboarded: boolean("is_onboarded").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true)
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  interest: text("interest"),
  source: text("source"),
  stageId: uuid("stage_id").notNull().references(() => leadStages.id),
  ownerId: uuid("owner_id").references(() => users.id),
  notes: text("notes"),
  followUpDate: date("follow_up_date").notNull(),
  followUpStatus: leadFollowUpStatus("follow_up_status").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),
  body: text("body").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const leadAuditEvents = pgTable("lead_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),
  eventType: text("event_type").notNull(),
  meta: jsonb("meta"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const instruments = pgTable("instruments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  name: text("name").notNull(),
  difficulty: difficultyLevel("difficulty").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const courseTeachers = pgTable(
  "course_teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").notNull().references(() => courses.id),
    teacherId: uuid("teacher_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    uniqueCourseTeacher: uniqueIndex("course_teachers_unique").on(
      table.courseId,
      table.teacherId
    )
  })
);

export const coursePlans = pgTable("course_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  durationMonths: integer("duration_months").notNull(),
  classesPerWeek: integer("classes_per_week").notNull().default(2),
  totalClasses: integer("total_classes").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

export const admissions = pgTable("admissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  studentId: uuid("student_id").references(() => users.id),
  coursePlanId: uuid("course_plan_id").notNull().references(() => coursePlans.id),
  courseId: uuid("course_id").notNull().references(() => courses.id),
  startDate: date("start_date").notNull(),
  weeklySlots: jsonb("weekly_slots").notNull(),
  baseClasses: integer("base_classes").notNull(),
  extraClasses: integer("extra_classes").notNull().default(0),
  discountType: discountType("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  finalClasses: integer("final_classes").notNull(),
  status: admissionStatus("status").notNull(),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const admissionSlots = pgTable("admission_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissions.id),
  timeSlotId: uuid("time_slot_id").notNull().references(() => timeSlotTemplates.id)
});

export const admissionPayments = pgTable("admission_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().unique().references(() => admissions.id),
  status: paymentStatus("status").notNull(),
  notes: text("notes"),
  updatedBy: uuid("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const operatingDays = pgTable(
  "operating_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dayOfWeek: integer("day_of_week").notNull(),
    isOpen: boolean("is_open").notNull().default(true)
  },
  (table) => ({
    uniqueDay: uniqueIndex("operating_days_unique").on(table.dayOfWeek)
  })
);

export const timeSlotTemplates = pgTable("time_slot_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

export const classroomSlots = pgTable("classroom_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  timeSlotId: uuid("time_slot_id").notNull().references(() => timeSlotTemplates.id),
  courseId: uuid("course_id").notNull().references(() => courses.id),
  teacherId: uuid("teacher_id").notNull().references(() => users.id),
  capacity: integer("capacity").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

export const classroomEnrollments = pgTable(
  "classroom_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull().references(() => users.id),
    classroomSlotId: uuid("classroom_slot_id")
      .notNull()
      .references(() => classroomSlots.id),
    admissionId: uuid("admission_id").notNull().references(() => admissions.id),
    startDate: date("start_date").notNull(),
    status: enrollmentStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    activeEnrollmentUnique: uniqueIndex("classroom_enrollments_active_unique").on(
      table.studentId,
      table.classroomSlotId
    )
      .where(sql`${table.status} = 'active'`)
  })
);

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id),
  classroomSlotId: uuid("classroom_slot_id")
    .notNull()
    .references(() => classroomSlots.id),
  classDate: date("class_date").notNull(),
  status: attendanceStatus("status").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const rescheduleRequests = pgTable("reschedule_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id),
  originalAttendanceId: uuid("original_attendance_id")
    .notNull()
    .references(() => attendance.id),
  requestedDate: date("requested_date").notNull(),
  requestedSlotId: uuid("requested_slot_id").references(() => classroomSlots.id),
  status: rescheduleStatus("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  severity: notificationSeverity("severity").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  ctaUrl: text("cta_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true })
});

export const notificationEvents = pgTable("notification_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});
