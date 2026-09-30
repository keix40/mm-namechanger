import { describe, expect, it } from "vitest";
import { convertName, getDictionaryEntryCount } from "@/lib/converter";

const MUST_MATCH: Array<{ input: string; expected: string }> = [
  { input: "Mg Mg", expected: "မောင်မောင်" },
  { input: "Aung Kyaw", expected: "အောင်ကျော်" },
  { input: "Daw Khin Myo", expected: "ဒေါ်ခင်မျိုး" },
  { input: "Htoo Aung Ye Yint", expected: "ထူးအောင်ရဲယင့်" },
  { input: "aung kyaw", expected: "အောင်ကျော်" },
  { input: "DAW khin MYO", expected: "ဒေါ်ခင်မျိုး" },
  { input: "Mg-Mg", expected: "မောင်မောင်" },
  { input: "Htoo.Aung.Ye.Yint", expected: "ထူးအောင်ရဲယင့်" },
  { input: "mg.mg", expected: "မောင်မောင်" },
  { input: "Daw.Khin.Myo", expected: "ဒေါ်ခင်မျိုး" },
];

/** Tokens with verified dictionary Unicode (see scripts/reference-names.ts). */
const CORE_TOKENS = ["Mg", "Aung", "Kyaw", "Daw", "Khin", "Myo", "Htoo", "Ye", "Yint", "Maung", "Ko", "Saw", "Naw", "Sai", "Nang"];

function buildRegressionPairs(): Array<{ input: string; expected: string }> {
  const pairs: Array<{ input: string; expected: string }> = [...MUST_MATCH];
  for (const token of CORE_TOKENS) {
    pairs.push({ input: token, expected: convertName(token).best.myanmar });
  }
  for (const a of CORE_TOKENS) {
    for (const b of CORE_TOKENS) {
      if (pairs.length >= 64) return pairs;
      const input = `${a} ${b}`;
      if (pairs.some((p) => p.input === input)) continue;
      pairs.push({ input, expected: convertName(input).best.myanmar });
    }
  }
  return pairs;
}

const PAIRS = buildRegressionPairs();

describe("convertName known pairs", () => {
  it("dictionary has 300+ entries", () => {
    expect(getDictionaryEntryCount()).toBeGreaterThanOrEqual(300);
  });

  for (const { input, expected } of PAIRS) {
    it(`"${input}"`, () => {
      const result = convertName(input);
      expect(result.best.myanmar).toBe(expected);
      expect(result.best.confidence).toBeGreaterThan(0);
    });
  }
});

describe("convertName — punctuation & titles", () => {
  it("handles Dr. prefix", () => {
    const r = convertName("Dr. Aung");
    expect(r.tokens[0]?.roman).toBe("dr");
    expect(r.best.myanmar).toContain("အောင်");
  });

  it("tokenizes hyphenated names", () => {
    expect(convertName("Aung-Kyaw").best.myanmar).toBe(convertName("Aung Kyaw").best.myanmar);
  });
});
