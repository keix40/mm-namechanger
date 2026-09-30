/** Normalize romanized tokens for dictionary lookup and rule parsing. */

const ROMAN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\./g, ""],
  [/’|'/g, ""],
  [/oo/g, "u"],
  [/uu/g, "u"],
  [/ee/g, "i"],
  [/ay/g, "e"],
  [/ai/g, "e"],
  [/ei/g, "e"],
  [/aw(?![a-z])/g, "o"],
  [/ky/g, "ky"],
  [/gy/g, "gy"],
  [/htw/g, "htw"],
  [/thw/g, "thw"],
  [/shw/g, "shw"],
  [/sw/g, "sw"],
  [/tw/g, "tw"],
  [/nw/g, "nw"],
  [/mw/g, "mw"],
];

export function normalizeRomanToken(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (!s) return s;
  for (const [re, rep] of ROMAN_REPLACEMENTS) {
    s = s.replace(re, rep);
  }
  return s;
}

export function normalizeRomanInput(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** Expand common honorific / title abbreviations before tokenization. */
const ABBREV: Record<string, string> = {
  mg: "mg",
  ma: "ma",
  ko: "ko",
  u: "u",
  daw: "daw",
  dr: "dr",
  saw: "saw",
  naw: "naw",
  sai: "sai",
  nang: "nang",
  maung: "maung",
};

export function expandAbbreviation(token: string): string {
  const n = normalizeRomanToken(token);
  return ABBREV[n] ?? n;
}
