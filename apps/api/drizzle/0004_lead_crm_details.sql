ALTER TABLE "leads"
ADD COLUMN IF NOT EXISTS "area" text,
ADD COLUMN IF NOT EXISTS "community" text,
ADD COLUMN IF NOT EXISTS "address" text,
ADD COLUMN IF NOT EXISTS "guardian_name" text,
ADD COLUMN IF NOT EXISTS "age" integer,
ADD COLUMN IF NOT EXISTS "expected_budget" integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "number_of_contact_attempts" integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_contacted_date" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "next_followup" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "walkin_date" date,
ADD COLUMN IF NOT EXISTS "assigned_teacher_id" uuid,
ADD COLUMN IF NOT EXISTS "demo_date" date,
ADD COLUMN IF NOT EXISTS "demo_conducted" boolean NOT NULL DEFAULT false;

DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_teacher_id_users_id_fk" FOREIGN KEY ("assigned_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "lead_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"label" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
