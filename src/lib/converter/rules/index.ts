import { normalizeRomanToken } from "../normalize";
import { SpellingCandidate } from "../types";
import { isPlausibleNameSyllable } from "../unicode";
import { composeSyllable, ONSETS, RHYMES } from "./compose";

const MIN_RULE_WEIGHT = 0.4;

function parseSyllable(normalized: string): SpellingCandidate[] {
  const results = new Map<string, number>();
  for (const onset of ONSETS) {
    if (!normalized.startsWith(onset.roman)) continue;
    let rest = normalized.slice(onset.roman.length);
    let extra = "";
    // Optional wa-hswe medial ("lwin", "swa"); not after a bare vowel onset.
    if (onset.roman && rest.length > 1 && rest[0] === "w" && !(onset.medials ?? "").includes("ွ")) {
      extra = "ွ";
      rest = rest.slice(1);
    }
    for (const rhyme of RHYMES) {
      if (rhyme.roman !== rest) continue;
      if (extra && rhyme.medial) continue;
      const text = composeSyllable(onset, extra, rhyme);
      const weight = (rhyme.weight ?? 0.5) * (onset.weight ?? 1) * (onset.roman.length >= 2 ? 1 : 0.95);
      if (weight < MIN_RULE_WEIGHT || !isPlausibleNameSyllable(text)) continue;
      if ((results.get(text) ?? 0) < weight) results.set(text, weight);
    }
  }
  return [...results.entries()]
    .map(([text, weight]) => ({ text, weight: Math.round(weight * 1000) / 1000 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
}

/** Convert a single romanized syllable by rules; returns [] when it cannot be parsed. */
export function convertTokenByRules(rawToken: string): SpellingCandidate[] {
  const normalized = normalizeRomanToken(rawToken);
  if (!normalized || !/^[a-z]+$/.test(normalized)) return [];
  return parseSyllable(normalized);
}
