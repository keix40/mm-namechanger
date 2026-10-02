/**
 * Myanmar Unicode helpers and strict well-formedness checks (Unicode, not Zawgyi).
 *
 * `validateMyanmarOrthography` parses text into orthographic syllables using the
 * UTN #11 storage order — [kinzi] base [U+1039 stacked] [ျ][ြ][ွ][ှ] vowels/tone
 * [coda consonant + asat] — and checks every vowel/final/tone tail against a
 * whitelist of Burmese rhymes. It rejects things like ိ့, ိး, ာ်, ိံ, a lone asat
 * after an independent vowel, doubled diacritics, Zawgyi-range code points and a
 * vowel sign E stored before its consonant.
 */

const MYANMAR_START = 0x1000;
const MYANMAR_END = 0x109f;

const MEDIAL_ORDER = ["ျ", "ြ", "ွ", "ှ"] as const;

/** Consonants written with tall aa (ါ) when they carry no medial. */
const TALL_AA_CONSONANTS = new Set(["ခ", "ဂ", "င", "ဒ", "ပ", "ဝ"]);

const NASAL_FINALS = ["င", "ဉ", "ည", "န", "မ"];
const STOP_FINALS = ["က", "စ", "တ", "ပ"];

function buildRhymes(): Set<string> {
  const r = new Set<string>([
    "", "့",
    "ာ", "ား", "ါ", "ါး",
    "ိ", "ီ", "ီး",
    "ု", "ူ", "ူး",
    "ေ", "ေ့", "ေး",
    "ဲ", "ဲ့",
    "ော", "ော့", "ော်", "ေါ", "ေါ့", "ေါ်",
    "ို", "ို့", "ိုး",
    "ံ", "ံ့", "ုံ", "ုံ့", "ုံး",
    "ယ်",
    // Common Pali/loan finals seen in names (ဗိုလ်, ဉာဏ်, ဟေမာန်).
    "ိုလ်", "ာဏ်", "ာန်",
  ]);
  const nasal = (prefix: string, finals: string[]) => {
    for (const n of finals) {
      r.add(`${prefix}${n}်`);
      r.add(`${prefix}${n}့်`);
      r.add(`${prefix}${n}်း`);
    }
  };
  nasal("", NASAL_FINALS);
  for (const s of STOP_FINALS) r.add(`${s}်`);
  for (const v of ["ိ", "ု"]) {
    nasal(v, ["န", "မ"]);
    r.add(`${v}တ်`);
    r.add(`${v}ပ်`);
  }
  for (const v of ["ော", "ေါ", "ို"]) {
    nasal(v, ["င"]);
    r.add(`${v}က်`);
  }
  return r;
}

const VALID_RHYMES = buildRhymes();

const SYLLABLE_RE = new RegExp(
  [
    "((?:[\\u1000-\\u1021]\\u103A\\u1039)?)", // 1 kinzi
    "([\\u1000-\\u1021\\u1023-\\u102A\\u103F\\u1040-\\u1049\\u104C-\\u104F])", // 2 base
    "((?:\\u1039[\\u1000-\\u1021])?)", // 3 stacked consonant
    "(\\u103B?\\u103C?\\u103D?\\u103E?)", // 4 medials in storage order
    "([\\u102B-\\u1038\\u103A]*)", // 5 vowel signs, tone marks, asat
    "((?:[\\u1000-\\u1021]\\u1037?\\u103A(?!\\u1039)\\u1038?)?)", // 6 coda consonant + asat
  ].join(""),
  "y",
);

const INDEPENDENT_OK = new Set(["ဥ", "ဦ", "ဦး", "ဣ", "ဤ", "ဧ", "ဩ", "ဪ"]);

export function isMyanmarCodePoint(cp: number): boolean {
  return cp >= MYANMAR_START && cp <= MYANMAR_END;
}

export function containsMyanmar(text: string): boolean {
  for (const ch of text) {
    if (isMyanmarCodePoint(ch.codePointAt(0)!)) return true;
  }
  return false;
}

/** Heuristic Zawgyi detection: Zawgyi-range code points, U+1039 as visible asat, E before consonant. */
export function isLikelyZawgyi(text: string): boolean {
  if (/[\u1060-\u1097]/.test(text)) return true;
  if (/\u1039(?![\u1000-\u1021])/.test(text)) return true;
  if (/(^|[^\u1000-\u1021\u103B-\u103E\u1039])\u1031/.test(text)) return true;
  return false;
}

/** Validate medial sign order within one cluster. */
export function hasValidMedialOrder(cluster: string): boolean {
  let lastIdx = -1;
  for (const ch of cluster) {
    const idx = MEDIAL_ORDER.indexOf(ch as (typeof MEDIAL_ORDER)[number]);
    if (idx >= 0) {
      if (idx <= lastIdx) return false;
      lastIdx = idx;
    }
  }
  return true;
}

/** Returns a list of orthography problems; empty means the text is well-formed. */
export function validateMyanmarOrthography(text: string): string[] {
  const errors: string[] = [];
  if (!text) return ["empty string"];
  if (text !== text.normalize("NFC")) errors.push("not NFC-normalized");
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (!isMyanmarCodePoint(cp)) errors.push(`non-Myanmar character U+${cp.toString(16).toUpperCase()}`);
    else if (cp >= 0x1060 && cp <= 0x1097) errors.push(`Zawgyi-range code point U+${cp.toString(16).toUpperCase()}`);
  }
  if (errors.length) return errors;

  let pos = 0;
  while (pos < text.length) {
    SYLLABLE_RE.lastIndex = pos;
    const m = SYLLABLE_RE.exec(text);
    if (!m || m[0].length === 0) {
      errors.push(`stray mark at index ${pos} in "${text}" (e.g. vowel sign E before its consonant)`);
      break;
    }
    pos += m[0].length;
    const [syl, kinzi, base, stacked, medials, tail, coda] = m as unknown as string[];
    const rhyme = `${tail}${coda}`;
    const cp = base!.codePointAt(0)!;

    if (cp >= 0x1040) {
      if (rhyme || medials || stacked) errors.push(`marks after digit/symbol in "${syl}"`);
      continue;
    }
    if (cp >= 0x1023) {
      if (medials || stacked || !INDEPENDENT_OK.has(`${base}${tail}`) || coda) {
        errors.push(`invalid independent-vowel syllable "${syl}"`);
      }
      continue;
    }
    if (medials!.includes("ျ") && medials!.includes("ြ")) errors.push(`both ya-pin and ya-yit in "${syl}"`);
    if (!VALID_RHYMES.has(rhyme)) {
      errors.push(`invalid vowel/final/tone tail "${rhyme}" in "${syl}"`);
      continue;
    }
    if (!medials && !kinzi && !stacked) {
      const tall = rhyme.startsWith("ါ") || rhyme.startsWith("ေါ");
      const short = rhyme.startsWith("ာ") || rhyme.startsWith("ော");
      if (tall && !TALL_AA_CONSONANTS.has(base!)) errors.push(`tall aa after ${base} in "${syl}"`);
      if (short && TALL_AA_CONSONANTS.has(base!)) errors.push(`short aa after ${base} (expected ါ) in "${syl}"`);
    }
  }
  return errors;
}

export function assertUnicodeMyanmar(text: string, context: string): void {
  if (!containsMyanmar(text)) {
    throw new Error(`${context}: expected Myanmar script, got "${text}"`);
  }
  if (isLikelyZawgyi(text)) {
    throw new Error(`${context}: rejected likely Zawgyi encoding in "${text}"`);
  }
  const errors = validateMyanmarOrthography(text);
  if (errors.length) {
    throw new Error(`${context}: malformed Myanmar "${text}": ${errors.join("; ")}`);
  }
}

/** True when a rule-engine output is well-formed Myanmar. */
export function isPlausibleNameSyllable(text: string): boolean {
  return containsMyanmar(text) && !isLikelyZawgyi(text) && validateMyanmarOrthography(text).length === 0;
}

/** Split into rough orthographic clusters (base consonant/vowel + following marks). */
export function splitMyanmarClusters(text: string): string[] {
  const clusters: string[] = [];
  let current = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x1000 && cp <= 0x102a) {
      if (current) clusters.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) clusters.push(current);
  return clusters;
}

export const MYANMAR = {
  A: "အ",
  ASAT: "်",
  DOT_BELOW: "့",
  VISARGA: "း",
  ANUSVARA: "ံ",
  YA_PIN: "ျ",
  YA_YIT: "ြ",
  WA_HSWE: "ွ",
  HA_HTOE: "ှ",
  VOWEL_I: "ိ",
  VOWEL_II: "ီ",
  VOWEL_U: "ု",
  VOWEL_UU: "ူ",
  VOWEL_E: "ေ",
  VOWEL_AI: "ဲ",
} as const;
