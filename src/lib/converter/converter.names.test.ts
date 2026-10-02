import { describe, expect, it } from "vitest";
import { convertName, getDictionaryEntryCount } from "@/lib/converter";
import { GOLDEN, GOLDEN_SYLLABLES } from "@/lib/converter/golden-expected";

describe("convertName regression", () => {
  it("dictionary has 300+ curated entries", () => {
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

describe("segmentation fallback", () => {
  it("splits unknown multi-syllable tokens into known syllables", () => {
    const r = convertName("Kyawswa");
    expect(r.best.myanmar).toBe("ကျော်စွာ");
    expect(r.tokens[0]?.source).toBe("rules");
  });

  it("never emits malformed Myanmar for romanized input", async () => {
    const { validateMyanmarOrthography } = await import("@/lib/converter/unicode");
    for (const name of ["Hninsi", "Thandar Win", "Swe Zin Htet", "Myintzu", "Lwin Moe Aung", "Zawgyi", "Kyawt"]) {
      const r = convertName(name);
      for (const alt of r.alternatives) {
        if (/[a-z]/i.test(alt.myanmar)) continue;
        expect(validateMyanmarOrthography(alt.myanmar)).toEqual([]);
      }
    }
  });
});

describe("Myanmar passthrough", () => {
  it("keeps well-formed Myanmar tokens in mixed input", () => {
    const r = convertName("မောင် Aung");
    expect(r.best.myanmar).toBe("မောင်အောင်");
    expect(r.best.confidence).toBeGreaterThan(0.9);
  });
});
