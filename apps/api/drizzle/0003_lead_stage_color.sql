ALTER TABLE "lead_stages"
ADD COLUMN IF NOT EXISTS "color" text NOT NULL DEFAULT 'bg-slate-500';

UPDATE "lead_stages"
SET "color" = CASE "name"
  WHEN 'Due for validation' THEN 'bg-sky-400'
  WHEN 'Call not connected' THEN 'bg-orange-500'
  WHEN 'Walkin Expected' THEN 'bg-yellow-500'
  WHEN 'Walked in' THEN 'bg-indigo-500'
  WHEN 'Converted' THEN 'bg-emerald-500'
  WHEN 'Cold' THEN 'bg-cyan-500'
  WHEN 'Hot' THEN 'bg-red-500'
  WHEN 'Prospective' THEN 'bg-violet-500'
  ELSE 'bg-slate-500'
END;
