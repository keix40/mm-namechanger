import { describe, expect, it } from "vitest";
import dictionary from "@data/dictionary.json";
import { GOLDEN, GOLDEN_SYLLABLES } from "@/lib/converter/golden-expected";
import { convertTokenByRules } from "@/lib/converter/rules";
import { assertUnicodeMyanmar, isLikelyZawgyi, validateMyanmarOrthography } from "@/lib/converter/unicode";
import type { DictionaryFile } from "@/lib/converter/types";

const dict = dictionary as DictionaryFile;
const FUZZ = ["Aung", "Mg", "xyz", "Kyawgyi", "Thant", "Myintmyat", "Phone", "Nyein", "Htun", "Shwe", "Lwin", "Hlaing", "Tun"];

describe("strict orthography validator", () => {
  const malformed = [
    "ကိ့", // dot below after vowel i
    "ကိး", // visarga after vowel i
    "ဧ်", // asat after independent vowel
    "မိံ့", // i + anusvara + dot below
    "မာ်", // asat on aa (only ော်/ေါ် are valid)
    "ျာ", // medial with no consonant
    "ေမ", // vowel sign E stored before its consonant
    "မိိ", // doubled diacritic
    "ကြျ", // medials out of order
    "ပာ", // short aa where tall aa is required
    "\u1019\u1060", // Zawgyi-range code point
  ];
  for (const s of malformed) {
    it(`rejects ${JSON.stringify(s)}`, () => {
      expect(validateMyanmarOrthography(s).length).toBeGreaterThan(0);
    });
  }
  const wellFormed = ["မောင်မောင်", "ဦးသန့်", "ရွှေ", "မြင့်", "ဒေါ်", "ကျော်", "စန္ဒာ", "မင်္ဂလာ", "ဗိုလ်", "ယဉ့်", "ညွန့်"];
  for (const s of wellFormed) {
    it(`accepts ${s}`, () => {
      expect(validateMyanmarOrthography(s)).toEqual([]);
    });
  }
});

describe("Unicode well-formedness", () => {
  for (const entry of dict.entries) {
    for (const sp of entry.spellings) {
      it(`dictionary ${entry.variants[0]} ${sp.text}`, () => {
        expect(isLikelyZawgyi(sp.text)).toBe(false);
        expect(validateMyanmarOrthography(sp.text)).toEqual([]);
      });
    }
  }
  for (const [k, v] of Object.entries({ ...GOLDEN, ...GOLDEN_SYLLABLES })) {
    it(`golden ${k}`, () => {
      assertUnicodeMyanmar(v, k);
    });
  }
  for (const sample of FUZZ) {
    it(`rules output for ${sample}`, () => {
      for (const cand of convertTokenByRules(sample)) {
        assertUnicodeMyanmar(cand.text, sample);
      }
    });
  }
});
