/** Normalize romanized tokens for dictionary lookup and rule parsing. */

const ROMAN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\./g, ""],
  [/’|'/g, ""],
  [/aw(?![a-z])/g, "o"],
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
