import { describe, expect, it } from "vitest";
import { convertName } from "@/lib/converter";
import { GOLDEN, GOLDEN_SYLLABLES } from "@/lib/converter/golden-expected";

describe("golden name conversions", () => {
  for (const [input, expected] of Object.entries(GOLDEN)) {
    it(`"${input}" → expected Myanmar`, () => {
      const result = convertName(input);
      expect(result.best.myanmar).toBe(expected);
      expect(result.best.confidence).toBeGreaterThanOrEqual(0.85);
    });
  }
});

describe("golden Yint alternatives", () => {
  it("offers ယဉ့် as alternative for Yint", () => {
    const r = convertName("Yint");
    expect(r.best.myanmar).toBe(GOLDEN_SYLLABLES.Yint);
    expect(r.alternatives.some((a) => a.myanmar === "ယဉ့်")).toBe(true);
  });
});

describe("golden syllable dictionary hits", () => {
  for (const [roman, expected] of Object.entries(GOLDEN_SYLLABLES)) {
    it(`"${roman}"`, () => {
      const result = convertName(roman);
      expect(result.best.myanmar).toBe(expected);
      expect(result.tokens[0]?.source).toBe("dictionary");
    });
  }
});
