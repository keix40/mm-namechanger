import { normalizeRomanToken } from "../normalize";
import { SpellingCandidate } from "../types";
import { assertUnicodeMyanmar } from "../unicode";
import { composeSyllable, ONSETS, RHYMES } from "./compose";

const VOWEL_INITIAL: Record<string, string> = {
  a: "\u1021\u102c",
  e: "\u1021\u1031",
  i: "\u1021\u102d",
  o: "\u1021\u102c",
  u: "\u1021\u102f",
};

/** Standalone syllable overrides for common name fragments. */
const WHOLE_SYLLABLE: Record<string, SpellingCandidate[]> = {
  aung: [{ text: "\u1021\u1031\u102c\u1004\u103a", weight: 1 }],
  o: [{ text: "\u1029", weight: 0.7 }],
  u: [{ text: "\u1025", weight: 0.85 }],
};

function score(weight: number, coverage: number): number {
  return Math.min(1, weight * coverage);
}

function parseWithRules(normalized: string): SpellingCandidate[] {
  if (WHOLE_SYLLABLE[normalized]) {
    return WHOLE_SYLLABLE[normalized]!.map((s) => ({ ...s }));
  }

  if (VOWEL_INITIAL[normalized]) {
    return [{ text: VOWEL_INITIAL[normalized]!, weight: 0.75 }];
  }

  const results: SpellingCandidate[] = [];

  for (const onset of ONSETS) {
    if (!normalized.startsWith(onset.roman)) continue;
    let rest = normalized.slice(onset.roman.length);
    const medials: string[] = [];
    while (rest.length && "yrwh".includes(rest[0]!)) {
      medials.push(rest[0]!);
      rest = rest.slice(1);
    }
    const medialStr = medials.join("");

    const rhymeCandidates = RHYMES.filter((r) => rest === r.roman || (r.roman === "" && rest === ""));
    if (rhymeCandidates.length === 0 && rest.length > 0) continue;

    for (const rhyme of rhymeCandidates.length ? rhymeCandidates : RHYMES.filter((r) => r.roman === "")) {
      const text = composeSyllable(onset, medialStr, rhyme);
      const coverage = normalized.length / Math.max(normalized.length, onset.roman.length + medialStr.length + rhyme.roman.length);
      const weight = (rhyme.weight ?? 0.5) * (onset.roman.length >= 2 ? 1 : 0.92);
      try {
        assertUnicodeMyanmar(text, "rules");
      } catch {
        continue;
      }
      results.push({ text, weight: score(weight, coverage) });
    }
  }

  if (results.length === 0) {
    // Last resort: spell letter-by-letter (very low confidence)
    const letters = normalized.split("").filter((c) => /[a-z]/.test(c));
    if (letters.length) {
      const mapped = letters
        .map((l) => ONSETS.find((o) => o.roman === l)?.consonant ?? "\u1021\u102c")
        .join("");
      try {
        assertUnicodeMyanmar(mapped, "rules-fallback");
        results.push({ text: mapped, weight: 0.15 });
      } catch {
        /* ignore */
      }
    }
  }

  results.sort((a, b) => b.weight - a.weight);
  const dedup = new Map<string, SpellingCandidate>();
  for (const r of results) {
    if (!dedup.has(r.text) || (dedup.get(r.text)!.weight < r.weight)) {
      dedup.set(r.text, r);
    }
  }
  return [...dedup.values()].slice(0, 6);
}

export function convertTokenByRules(rawToken: string): SpellingCandidate[] {
  const normalized = normalizeRomanToken(rawToken);
  if (!normalized) return [];
  return parseWithRules(normalized);
}
