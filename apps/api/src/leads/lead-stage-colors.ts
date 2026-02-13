export const LEAD_STAGE_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-400",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-slate-500",
  "bg-gray-400"
] as const;

export type LeadStageColor = (typeof LEAD_STAGE_COLORS)[number];
