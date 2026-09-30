import { describe, expect, it } from "vitest";
import dictionary from "@data/dictionary.json";
import { convertTokenByRules } from "@/lib/converter/rules";
import { assertUnicodeMyanmar, isLikelyZawgyi } from "@/lib/converter/unicode";
import type { DictionaryFile } from "@/lib/converter/types";

const dict = dictionary as DictionaryFile;

const FUZZ = ["Aung", "Mg", "xyz", "Kyawgyi", "Thant", "Myintmyat", "Phone", "Nyein", "Htun", "Shwe"];

describe("Unicode well-formedness", () => {
  for (const entry of dict.entries) {
    for (const sp of entry.spellings) {
      it(`dictionary ${entry.variants[0]}`, () => {
        expect(isLikelyZawgyi(sp.text)).toBe(false);
        assertUnicodeMyanmar(sp.text, entry.variants[0] ?? "entry");
      });
    }
  }

  for (const sample of FUZZ) {
    it(`rules output for ${sample}`, () => {
      for (const cand of convertTokenByRules(sample)) {
        assertUnicodeMyanmar(cand.text, sample);
      }
    });
  }
});
