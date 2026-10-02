/** Minimal RFC 4180-style CSV helpers for the batch converter. */

/** Parse CSV text (quoted fields, escaped quotes, CRLF) into a header row and data rows. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"' && field.trim() === "") {
      inQuotes = true;
      field = "";
    } else if (ch === ",") {
      record.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      record.push(field.trim());
      records.push(record);
      record = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || record.length) {
    record.push(field.trim());
    records.push(record);
  }
  const nonEmpty = records.filter((r) => r.some((c) => c !== ""));
  if (!nonEmpty.length) return { headers: [], rows: [] };
  return { headers: nonEmpty[0]!, rows: nonEmpty.slice(1) };
}

/** Prefix cells that spreadsheet apps would evaluate as formulas (CSV/formula injection). */
export function neutralizeFormula(cell: string): string {
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}

/** Serialize rows to CSV with quoting, formula neutralization and a UTF-8 BOM for Excel. */
export function toCsv(rows: string[][]): string {
  const body = rows
    .map((row) => row.map((c) => `"${neutralizeFormula(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  return `\uFEFF${body}\r\n`;
}
