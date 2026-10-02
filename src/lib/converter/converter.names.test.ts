import { describe, expect, it } from "vitest";
import { convertName, getDictionaryEntryCount } from "@/lib/converter";
import { GOLDEN, GOLDEN_SYLLABLES } from "@/lib/converter/golden-expected";

describe("convertName regression", () => {
  it("dictionary has 300+ entries", () => {
    expect(getDictionaryEntryCount()).toBeGreaterThanOrEqual(300);
  });

  it("tokenizes hyphenated and dotted names like spaced names", () => {
    expect(convertName("Aung-Kyaw").best.myanmar).toBe(GOLDEN["Aung Kyaw"]);
    expect(convertName("mg.mg").best.myanmar).toBe(GOLDEN["Mg Mg"]);
  });

  it("handles Dr. prefix", () => {
    const r = convertName("Dr. Aung");
    expect(r.tokens[0]?.roman).toBe("dr");
    expect(r.best.myanmar).toContain(GOLDEN_SYLLABLES.Aung);
  });
});
