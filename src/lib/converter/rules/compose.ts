import { MYANMAR } from "../unicode";

export interface OnsetMatch {
  roman: string;
  consonant: string;
  /** Medial signs carried by the onset (subset of ျ ြ ွ ှ). */
  medials?: string;
  weight?: number;
}

/**
 * Romanized onsets (common Burmese name romanization), longest match first.
 * Several entries may share a roman key to offer alternatives.
 */
export const ONSETS: OnsetMatch[] = [
  { roman: "shw", consonant: "ရ", medials: "ွှ" },
  { roman: "hny", consonant: "ည", medials: "ှ" },
  { roman: "hng", consonant: "င", medials: "ှ" },
  { roman: "phy", consonant: "ဖ", medials: "ြ" },
  { roman: "phy", consonant: "ဖ", medials: "ျ", weight: 0.9 },
  { roman: "hm", consonant: "မ", medials: "ှ" },
  { roman: "hn", consonant: "န", medials: "ှ" },
  { roman: "hl", consonant: "လ", medials: "ှ" },
  { roman: "sh", consonant: "ရ", medials: "ှ" },
  { roman: "ky", consonant: "က", medials: "ျ" },
  { roman: "ky", consonant: "က", medials: "ြ", weight: 0.9 },
  { roman: "gy", consonant: "က", medials: "ြ", weight: 0.95 },
  { roman: "gy", consonant: "ဂ", medials: "ျ", weight: 0.9 },
  { roman: "ch", consonant: "ခ", medials: "ျ" },
  { roman: "ch", consonant: "ခ", medials: "ြ", weight: 0.85 },
  { roman: "py", consonant: "ပ", medials: "ြ" },
  { roman: "py", consonant: "ပ", medials: "ျ", weight: 0.9 },
  { roman: "my", consonant: "မ", medials: "ြ" },
  { roman: "my", consonant: "မ", medials: "ျ", weight: 0.95 },
  { roman: "by", consonant: "ဗ", medials: "ျ" },
  { roman: "hs", consonant: "ဆ" },
  { roman: "ht", consonant: "ထ" },
  { roman: "th", consonant: "သ" },
  { roman: "th", consonant: "ထ", weight: 0.8 },
  { roman: "ph", consonant: "ဖ" },
  { roman: "kh", consonant: "ခ" },
  { roman: "ng", consonant: "င" },
  { roman: "ny", consonant: "ည" },
  { roman: "ny", consonant: "ဉ", weight: 0.8 },
  { roman: "dh", consonant: "ဓ" },
  { roman: "bh", consonant: "ဘ" },
  { roman: "gh", consonant: "ဃ" },
  { roman: "k", consonant: "က" },
  { roman: "g", consonant: "ဂ" },
  { roman: "s", consonant: "စ" },
  { roman: "s", consonant: "ဆ", weight: 0.9 },
  { roman: "z", consonant: "ဇ" },
  { roman: "j", consonant: "ဂ", medials: "ျ" },
  { roman: "t", consonant: "တ" },
  { roman: "d", consonant: "ဒ" },
  { roman: "n", consonant: "န" },
  { roman: "p", consonant: "ပ" },
  { roman: "b", consonant: "ဗ" },
  { roman: "b", consonant: "ဘ", weight: 0.9 },
  { roman: "m", consonant: "မ" },
  { roman: "y", consonant: "ယ" },
  { roman: "y", consonant: "ရ", weight: 0.85 },
  { roman: "r", consonant: "ရ" },
  { roman: "l", consonant: "လ" },
  { roman: "w", consonant: "ဝ" },
  { roman: "h", consonant: "ဟ" },
  { roman: "f", consonant: "ဖ" },
  { roman: "v", consonant: "ဗ" },
  /** Vowel-initial syllables are written on the carrier consonant အ. */
  { roman: "", consonant: MYANMAR.A, weight: 0.9 },
];

export interface RhymePattern {
  roman: string;
  /** Vowel/final/tone tail appended after consonant + medials. */
  suffix: string;
  /** Extra medial required by the rhyme (e.g. wa-hswe for "un" → ွန်း). */
  medial?: string;
  weight?: number;
}

const R = (roman: string[], options: Array<[string, number] | [string, number, string]>): RhymePattern[] =>
  roman.flatMap((r) => options.map(([suffix, weight, medial]) => ({ roman: r, suffix, weight, medial })));

/** Rhyme tails matched after the onset (and an optional "w" medial). */
export const RHYMES: RhymePattern[] = [
  ...R(["a"], [["", 1], ["ာ", 0.85]]),
  ...R(["ar", "aa"], [["ာ", 1], ["ား", 0.85]]),
  ...R(["ah"], [["ား", 1]]),
  ...R(["i"], [["ိ", 1], ["ီ", 0.9]]),
  ...R(["ee", "ii"], [["ီ", 1], ["ည်", 0.9], ["ီး", 0.85]]),
  ...R(["u"], [["ု", 1], ["ူ", 0.9]]),
  ...R(["uu"], [["ူ", 1]]),
  ...R(["oo"], [["ူး", 1], ["ူ", 0.9], ["ု", 0.85]]),
  ...R(["ue"], [["ူး", 1]]),
  ...R(["e"], [["ေ", 1], ["ဲ", 0.9]]),
  ...R(["ay"], [["ေ", 1], ["ေး", 0.9]]),
  ...R(["ei"], [["ိ", 0.9], ["ေ", 0.85]]),
  ...R(["ae"], [["ဲ", 1], ["ယ်", 0.9]]),
  ...R(["al", "el", "eh"], [["ယ်", 1], ["ဲ", 0.9]]),
  ...R(["ai"], [["ိုင်း", 0.9], ["ဲ", 0.85], ["ေ", 0.85]]),
  ...R(["o", "oe", "oh"], [["ို", 1], ["ိုး", 0.95]]),
  ...R(["aw"], [["ော်", 1], ["ော", 0.9]]),
  ...R(["in", "inn"], [["င်း", 1], ["င်", 0.95], ["ဉ်", 0.85]]),
  ...R(["int"], [["င့်", 1], ["ဉ့်", 0.85]]),
  ...R(["an", "ann"], [["န်း", 1], ["န်", 0.95], ["မ်း", 0.9], ["ံ", 0.85]]),
  ...R(["ant"], [["န့်", 1], ["မ့်", 0.85]]),
  ...R(["un", "oon"], [["န်း", 1, "ွ"], ["န်", 0.95, "ွ"]]),
  ...R(["unt"], [["န့်", 1, "ွ"]]),
  ...R(["on", "one", "ohn", "oan"], [["ုန်း", 1], ["ုံ", 0.95], ["ုန်", 0.9], ["ုံး", 0.85]]),
  ...R(["aung"], [["ောင်", 1], ["ောင်း", 0.95]]),
  ...R(["auk"], [["ောက်", 1]]),
  ...R(["aing", "ine"], [["ိုင်", 1], ["ိုင်း", 0.95]]),
  ...R(["aik", "ike"], [["ိုက်", 1]]),
  ...R(["ein"], [["ိန်", 1], ["ိန်း", 0.95], ["ိမ်", 0.9], ["ိမ်း", 0.85]]),
  ...R(["eik", "ate"], [["ိတ်", 1], ["ိပ်", 0.9]]),
  ...R(["et", "ett"], [["က်", 1]]),
  ...R(["at", "att"], [["တ်", 1], ["ပ်", 0.85]]),
  ...R(["it", "itt"], [["စ်", 1]]),
  ...R(["ut", "oke", "ote"], [["ုတ်", 1], ["ုပ်", 0.9]]),
];

const TALL_AA_CONSONANTS = new Set(["ခ", "ဂ", "င", "ဒ", "ပ", "ဝ"]);
const MEDIAL_ORDER = [MYANMAR.YA_PIN, MYANMAR.YA_YIT, MYANMAR.WA_HSWE, MYANMAR.HA_HTOE];

/** Orders medials ျ ြ ွ ှ as required by Unicode storage order. */
export function orderMedials(medials: string): string {
  return MEDIAL_ORDER.filter((m) => medials.includes(m)).join("");
}

export function composeSyllable(onset: OnsetMatch, extraMedials: string, rhyme: RhymePattern): string {
  const medials = orderMedials(`${onset.medials ?? ""}${extraMedials}${rhyme.medial ?? ""}`);
  let suffix = rhyme.suffix;
  if (!medials && TALL_AA_CONSONANTS.has(onset.consonant)) {
    suffix = suffix.replace(/^ော/, "ေါ").replace(/^ာ/, "ါ");
  }
  return `${onset.consonant}${medials}${suffix}`;
}
