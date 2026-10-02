import { describe, expect, it } from "vitest";
import { convertName, getDictionaryEntryCount } from "@/lib/converter";
import {
  EXTENDED_GOLDEN_SYLLABLES,
  VERIFIED_EXTENDED_SYLLABLES,
} from "@/lib/converter/extended-syllables";
import { EXTENDED_ONLY_KEYS, GOLDEN, GOLDEN_SYLLABLES } from "@/lib/converter/golden-expected";

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

describe("romanized r and loan-name segmentation", () => {
  it("defaults r to ရ with ယ only as a lower-ranked rule alternative", async () => {
    const { convertTokenByRules } = await import("@/lib/converter/rules");
    const ra = convertTokenByRules("ra");
    expect(ra[0]!.text).toBe("ရ");
    const ya = ra.find((c) => c.text === "ယ");
    expect(ya).toBeDefined();
    expect(ya!.weight).toBeLessThan(ra[0]!.weight);
    expect(convertName("Ra").best.myanmar).toBe("ရ");
  });

  it("keeps an r before a vowel as the next syllable's onset", () => {
    expect(convertName("Tara").best.myanmar).toBe("တရ");
    expect(convertName("Tharaphyu").best.myanmar).toBe("သာရဖြူ");
  });

  it("segments unknown joined loan names without mixing in Latin", () => {
    for (const name of ["Cherrythin", "Winttharaphe", "Marylwin", "Cherrie Phyu"]) {
      const best = convertName(name).best.myanmar;
      expect(best).not.toMatch(/[a-z]/i);
    }
    expect(convertName("Cherrythin").best.myanmar).toBe("ချယ်ရီသင်း");
    expect(convertName("Winttharaphe").best.myanmar).toBe("ဝင့်သရဖီ");
  });
});

describe("Myanmar passthrough", () => {
  it("keeps well-formed Myanmar tokens in mixed input", () => {
    const r = convertName("မောင် Aung");
    expect(r.best.myanmar).toBe("မောင်အောင်");
    expect(r.best.confidence).toBeGreaterThan(0.9);
  });
});

describe("extended syllable confidence", () => {
  it("keeps verified extended syllables as full-confidence hits", () => {
    for (const key of VERIFIED_EXTENDED_SYLLABLES) {
      const r = convertName(key);
      expect(r.best.myanmar).toBe(EXTENDED_GOLDEN_SYLLABLES[key]);
      expect(r.best.confidence).toBe(1);
    }
  });

  it("never returns an unverified extended syllable at high confidence", () => {
    for (const key of EXTENDED_ONLY_KEYS) {
      if (VERIFIED_EXTENDED_SYLLABLES.has(key)) continue;
      expect(convertName(key).best.confidence).toBeLessThanOrEqual(0.5);
    }
    for (const name of ["Dae", "Day", "De", "Thway", "Tway", "Thway Thway"]) {
      expect(convertName(name).best.confidence).toBeLessThan(0.85);
    }
  });

  it("maps the single syllable Swan to စွမ်း and composes full names", () => {
    expect(convertName("Swan").best.myanmar).toBe("စွမ်း");
    expect(convertName("Swan Htet").best.myanmar).toBe("စွမ်းထက်");
    expect(convertName("Swan Yee").best.myanmar).toBe("စွမ်းရည်");
    expect(convertName("Swan Pyae").best.myanmar).toBe("စွမ်းပြည့်");
  });
});
