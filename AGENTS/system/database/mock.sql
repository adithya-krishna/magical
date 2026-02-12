CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','admin','staff','teacher','student')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  ban_expires timestamptz,
  blocked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role_requested text NOT NULL CHECK (role_requested IN ('admin','staff','teacher','student')),
  status text NOT NULL CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  impersonated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  account_id text NOT NULL,
  provider_id text NOT NULL,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  id_token text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE verifications (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  time_zone text NOT NULL DEFAULT 'system',
  time_format text NOT NULL CHECK (time_format IN ('12h','24h')),
  week_start text NOT NULL CHECK (week_start IN ('mon','sun')),
  theme text NOT NULL CHECK (theme IN ('light','dark','system')),
  remember_last_page boolean NOT NULL DEFAULT true,
  auto_logout_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE lead_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  ordering int NOT NULL,
  is_onboarded boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  interest text,
  source text,
  stage_id uuid NOT NULL REFERENCES lead_stages(id),
  owner_id uuid REFERENCES users(id),
  notes text,
  follow_up_date date NOT NULL,
  follow_up_status text NOT NULL CHECK (follow_up_status IN ('open','done')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  body text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  event_type text NOT NULL,
  meta jsonb,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Courses
CREATE TABLE instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id),
  name text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE course_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  teacher_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, teacher_id)
);

-- Admissions
CREATE TABLE course_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_months int NOT NULL,
  classes_per_week int NOT NULL DEFAULT 2,
  total_classes int NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  student_id uuid REFERENCES users(id),
  course_plan_id uuid NOT NULL REFERENCES course_plans(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  start_date date NOT NULL,
  weekly_slots jsonb NOT NULL,
  base_classes int NOT NULL,
  extra_classes int NOT NULL DEFAULT 0,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount','none')),
  discount_value numeric NOT NULL DEFAULT 0,
  final_classes int NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','active','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admission_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES admissions(id),
  time_slot_id uuid NOT NULL
);

CREATE TABLE admission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL UNIQUE REFERENCES admissions(id),
  status text NOT NULL CHECK (status IN ('paid','unpaid')),
  notes text,
  updated_by uuid NOT NULL REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Classroom scheduling
CREATE TABLE operating_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT true,
  UNIQUE (day_of_week)
);

CREATE TABLE time_slot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes int NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE classroom_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id uuid NOT NULL REFERENCES time_slot_templates(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  teacher_id uuid NOT NULL REFERENCES users(id),
  capacity int NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE classroom_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  classroom_slot_id uuid NOT NULL REFERENCES classroom_slots(id),
  admission_id uuid NOT NULL REFERENCES admissions(id),
  start_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active','paused','ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX classroom_enrollments_active_uq
  ON classroom_enrollments (student_id, classroom_slot_id)
  WHERE status = 'active';

CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  classroom_slot_id uuid NOT NULL REFERENCES classroom_slots(id),
  class_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled','present','absent','late','excused')),
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  original_attendance_id uuid NOT NULL REFERENCES attendance(id),
  requested_date date NOT NULL,
  requested_slot_id uuid REFERENCES classroom_slots(id),
  status text NOT NULL CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  entity_type text NOT NULL,
  entity_id uuid,
  cta_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz
);

CREATE TABLE notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX notifications_dedup_uq
  ON notifications (recipient_user_id, type, entity_id, date_trunc('day', created_at));

-- Indexes
CREATE INDEX leads_followup_idx ON leads (follow_up_date, follow_up_status);
CREATE INDEX enrollments_slot_status_idx ON classroom_enrollments (classroom_slot_id, status);
CREATE INDEX attendance_slot_date_idx ON attendance (classroom_slot_id, class_date);
CREATE INDEX attendance_student_date_idx ON attendance (student_id, class_date);
CREATE INDEX notifications_unread_idx ON notifications (recipient_user_id, read_at);
CREATE INDEX reschedule_status_idx ON reschedule_requests (status, created_at);

-- Seed data
INSERT INTO users (id, name, role, first_name, last_name, email) VALUES
  ('00000000-0000-0000-0000-000000000001','Super Admin','super_admin','Super','Admin','super@school.test'),
  ('00000000-0000-0000-0000-000000000002','Asha Admin','admin','Asha','Admin','admin@school.test'),
  ('00000000-0000-0000-0000-000000000003','Ravi Teacher','teacher','Ravi','Teacher','teacher@school.test'),
  ('00000000-0000-0000-0000-000000000004','Neha Staff','staff','Neha','Staff','staff@school.test'),
  ('00000000-0000-0000-0000-000000000005','Arjun Student','student','Arjun','Student','student@school.test');

INSERT INTO lead_stages (id, name, ordering, is_onboarded, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001','New',1,false,true),
  ('10000000-0000-0000-0000-000000000002','Contacted',2,false,true),
  ('10000000-0000-0000-0000-000000000003','Trial Scheduled',3,false,true),
  ('10000000-0000-0000-0000-000000000004','Trial Completed',4,false,true),
  ('10000000-0000-0000-0000-000000000005','Onboarded',5,true,true);

INSERT INTO leads (id, first_name, last_name, phone, email, interest, stage_id, owner_id, follow_up_date, follow_up_status)
VALUES
  ('20000000-0000-0000-0000-000000000001','Priya','Shah','+911234567890','priya@example.com','Piano',
   '10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',current_date,'open');

INSERT INTO instruments (id, name) VALUES
  ('30000000-0000-0000-0000-000000000001','Piano');

INSERT INTO courses (id, instrument_id, name, difficulty) VALUES
  ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Piano Basics','beginner');

INSERT INTO course_teachers (course_id, teacher_id) VALUES
  ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003');

INSERT INTO course_plans (id, name, duration_months, classes_per_week, total_classes) VALUES
  ('50000000-0000-0000-0000-000000000001','3 months',3,2,24);

INSERT INTO operating_days (day_of_week, is_open) VALUES
  (0,false),(1,true),(2,true),(3,true),(4,true),(5,true),(6,true);

INSERT INTO time_slot_templates (id, day_of_week, start_time, end_time, duration_minutes) VALUES
  ('60000000-0000-0000-0000-000000000001',2,'16:00','17:00',60),
  ('60000000-0000-0000-0000-000000000002',5,'17:00','18:00',60);

INSERT INTO classroom_slots (id, time_slot_id, course_id, teacher_id, capacity) VALUES
  ('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',6),
  ('70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',6);

INSERT INTO admissions (id, lead_id, student_id, course_plan_id, course_id, start_date, weekly_slots, base_classes, final_classes, discount_type, discount_value, status)
VALUES
  ('80000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005',
   '50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',current_date,
   '[{"day":2,"time":"16:00"},{"day":5,"time":"17:00"}]',24,24,'none',0,'active');

INSERT INTO admission_slots (admission_id, time_slot_id) VALUES
  ('80000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002');

INSERT INTO classroom_enrollments (student_id, classroom_slot_id, admission_id, start_date, status)
VALUES
  ('00000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001',current_date,'active'),
  ('00000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001',current_date,'active');

INSERT INTO attendance (student_id, classroom_slot_id, class_date, status)
VALUES
  ('00000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000001',current_date + interval '2 days','scheduled'),
  ('00000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000002',current_date + interval '5 days','scheduled');

INSERT INTO admission_payments (admission_id, status, notes, updated_by)
VALUES
  ('80000000-0000-0000-0000-000000000001','unpaid','Initial payment pending','00000000-0000-0000-0000-000000000002');
