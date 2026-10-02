import { describe, expect, it } from "vitest";
import { neutralizeFormula, parseCsv, toCsv } from "@/lib/csv";

describe("csv helpers", () => {
  it("neutralizes formula-injection prefixes", () => {
    for (const c of ["=HYPERLINK(\"x\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd"]) {
      expect(neutralizeFormula(c).startsWith("'")).toBe(true);
    }
    expect(neutralizeFormula("Mg Mg")).toBe("Mg Mg");
  });

  it("serializes with quotes, BOM and neutralized cells", () => {
    const out = toCsv([["name", "myanmar"], ['=cmd|"/c calc"!A1', "မောင်"]]);
    expect(out.startsWith("\uFEFF")).toBe(true);
    expect(out).toContain(`"'=cmd|""/c calc""!A1"`);
  });

  it("parses quoted fields containing commas and blank cells", () => {
    const { headers, rows } = parseCsv('name,city\n"Aung, Kyaw",Yangon\n,Mandalay\r\nSu Su,\n');
    expect(headers).toEqual(["name", "city"]);
    expect(rows).toEqual([["Aung, Kyaw", "Yangon"], ["", "Mandalay"], ["Su Su", ""]]);
  });
});
