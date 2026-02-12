import { parse } from "csv-parse/sync";
import { AppError } from "../common/errors";
import { leadBulkRowSchema } from "./lead.schemas";

type BulkParseResult = {
  rows: Array<ReturnType<typeof leadBulkRowSchema.parse>>;
  errors: Array<{ row: number; message: string }>;
};

export function parseLeadCsv(input: string): BulkParseResult {
  let records: Record<string, string>[] = [];

  try {
    records = parse(input, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];
  } catch (error) {
    throw new AppError(400, "Invalid CSV format");
  }

  const rows = [] as BulkParseResult["rows"];
  const errors: BulkParseResult["errors"] = [];

  records.forEach((record, index) => {
    const normalized = {
      firstName: record.firstName || record.firstname || record.first_name,
      lastName: record.lastName || record.lastname || record.last_name,
      phone: record.phone,
      email: record.email,
      interest: record.interest,
      source: record.source,
      notes: record.notes,
      followUpDate: record.followUpDate || record.follow_up_date
    };

    const parsed = leadBulkRowSchema.safeParse(normalized);
    if (!parsed.success) {
      errors.push({
        row: index + 2,
        message: parsed.error.flatten().fieldErrors
          ? JSON.stringify(parsed.error.flatten().fieldErrors)
          : "Invalid row"
      });
      return;
    }

    rows.push(parsed.data);
  });

  return { rows, errors };
}
