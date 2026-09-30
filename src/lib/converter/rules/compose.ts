import { MYANMAR } from "../unicode";

export interface OnsetMatch {
  roman: string;
  consonant: string;
  /** Optional stacked/kinzi prefix before base consonant. */
  prefix?: string;
}

/** Longest-match consonant onsets (romanized Burmese name style). */
export const ONSETS: OnsetMatch[] = [
  { roman: "nth", consonant: "\u1009" },
  { roman: "mth", consonant: "\u1019\u103c\u1010" },
  { roman: "htw", consonant: "\u101e\u103c\u1010" },
  { roman: "thw", consonant: "\u1011\u103c\u1010" },
  { roman: "shw", consonant: "\u1015\u103c\u1010" },
  { roman: "kyw", consonant: "\u1015\u103b\u103c\u1010" },
  { roman: "khw", consonant: "\u1001\u103c\u1010" },
  { roman: "khy", consonant: "\u1001\u103b" },
  { roman: "khm", consonant: "\u1001\u103b\u1019" },
  { roman: "ky", consonant: "\u1015\u103b" },
  { roman: "gy", consonant: "\u1002\u103b" },
  { roman: "kh", consonant: "\u1001" },
  { roman: "gh", consonant: "\u1003" },
  { roman: "ng", consonant: "\u1004" },
  { roman: "ch", consonant: "\u1006" },
  { roman: "jh", consonant: "\u1008" },
  { roman: "ny", consonant: "\u1009" },
  { roman: "th", consonant: "\u1011" },
  { roman: "dh", consonant: "\u1013" },
  { roman: "ph", consonant: "\u1016" },
  { roman: "bh", consonant: "\u1018" },
  { roman: "sh", consonant: "\u1015\u103c" },
  { roman: "ht", consonant: "\u101e" },
  { roman: "hw", consonant: "\u101e\u103d" },
  { roman: "tw", consonant: "\u1010\u103d" },
  { roman: "sw", consonant: "\u1010\u103c" },
  { roman: "nw", consonant: "\u1014\u103d" },
  { roman: "mw", consonant: "\u1019\u103d" },
  { roman: "k", consonant: "\u1000" },
  { roman: "g", consonant: "\u1002" },
  { roman: "c", consonant: "\u1005" },
  { roman: "j", consonant: "\u1007" },
  { roman: "t", consonant: "\u1010" },
  { roman: "d", consonant: "\u1012" },
  { roman: "n", consonant: "\u1014" },
  { roman: "p", consonant: "\u1015" },
  { roman: "b", consonant: "\u1017" },
  { roman: "m", consonant: "\u1019" },
  { roman: "y", consonant: "\u101a" },
  { roman: "r", consonant: "\u101c" },
  { roman: "l", consonant: "\u101e" },
  { roman: "w", consonant: "\u101d" },
  { roman: "h", consonant: "\u101f" },
  { roman: "s", consonant: "\u1010" },
  { roman: "f", consonant: "\u1016" },
];

export interface RhymePattern {
  roman: string;
  /** Suffix appended after consonant + medials (may include vowel signs). */
  suffix: string;
  weight?: number;
}

/** Rhyme tails matched after onset (and optional medials y/r/w/h). */
export const RHYMES: RhymePattern[] = [
  { roman: "aung", suffix: "\u1031\u102c\u1004\u103a", weight: 1 },
  { roman: "oung", suffix: "\u1031\u102c\u1004\u103a", weight: 0.95 },
  { roman: "ing", suffix: "\u102d\u1036\u1037", weight: 1 },
  { roman: "eing", suffix: "\u1031\u102d\u1036\u1037", weight: 1 },
  { roman: "ung", suffix: "\u102f\u1036\u1037", weight: 1 },
  { roman: "ong", suffix: "\u102f\u1036\u1038", weight: 1 },
  { roman: "int", suffix: "\u102d\u1036\u1037\u103a", weight: 1 },
  { roman: "yint", suffix: "\u103b\u102d\u1036\u1037\u103a", weight: 1 },
  { roman: "ein", suffix: "\u1031\u102d\u1036\u1037", weight: 1 },
  { roman: "ain", suffix: "\u1031\u102d\u1036\u1037", weight: 0.95 },
  { roman: "eik", suffix: "\u1031\u102d\u1036\u103a", weight: 1 },
  { roman: "auk", suffix: "\u102c\u1036\u103a", weight: 1 },
  { roman: "out", suffix: "\u102f\u1036\u103a", weight: 1 },
  { roman: "it", suffix: "\u102d\u1036\u103a", weight: 1 },
  { roman: "at", suffix: "\u102c\u1036\u103a", weight: 1 },
  { roman: "ut", suffix: "\u102f\u1036\u103a", weight: 1 },
  { roman: "aw", suffix: "\u102c", weight: 1 },
  { roman: "o", suffix: "\u102c", weight: 0.85 },
  { roman: "aw", suffix: "\u102c\u103a", weight: 0.7 },
  { roman: "e", suffix: "\u1031", weight: 0.9 },
  { roman: "i", suffix: "\u102d", weight: 1 },
  { roman: "ii", suffix: "\u102e", weight: 1 },
  { roman: "u", suffix: "\u102f", weight: 1 },
  { roman: "uu", suffix: "\u1030", weight: 1 },
  { roman: "a", suffix: "\u102c", weight: 0.95 },
  { roman: "ar", suffix: "\u102c\u1038", weight: 0.8 },
  { roman: "in", suffix: "\u102d\u1036\u1037", weight: 0.95 },
  { roman: "an", suffix: "\u102c\u1036\u1037", weight: 0.95 },
  { roman: "un", suffix: "\u102f\u1036\u1037", weight: 0.95 },
  { roman: "n", suffix: "\u1036\u1037", weight: 0.6 },
  { roman: "ng", suffix: "\u1036\u1038", weight: 0.7 },
  { roman: "m", suffix: "\u1036", weight: 0.55 },
  { roman: "t", suffix: "\u103a", weight: 0.5 },
  { roman: "", suffix: "\u102c", weight: 0.4 },
];

export function applyMedials(consonant: string, medials: string): string {
  let out = consonant;
  for (const m of medials) {
    if (m === "y") out += MYANMAR.YA_PIN;
    else if (m === "r") out += MYANMAR.YA_YIT;
    else if (m === "w") out += MYANMAR.WA_HSWE;
    else if (m === "h") out += MYANMAR.HA_HTOE;
  }
  return out;
}

export function composeSyllable(onset: OnsetMatch, medials: string, rhyme: RhymePattern): string {
  const base = (onset.prefix ?? "") + applyMedials(onset.consonant, medials);
  return base + rhyme.suffix;
}
