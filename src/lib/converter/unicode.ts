/** Myanmar Unicode helpers and well-formedness checks (Unicode-only, not Zawgyi). */

const MYANMAR_START = 0x1000;
const MYANMAR_END = 0x109f;

const MEDIAL_ORDER = ["\u103b", "\u103c", "\u103d", "\u103e"] as const;

/** Known Zawgyi-style misuse: U+1039 asat before certain vowels (simplified heuristic). */
const ZAWGYI_SUSPICIOUS = /[\u1039][\u102d\u102e\u1030\u1031]/;

export function isMyanmarCodePoint(cp: number): boolean {
  return cp >= MYANMAR_START && cp <= MYANMAR_END;
}

export function containsMyanmar(text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (isMyanmarCodePoint(cp)) return true;
  }
  return false;
}

export function isLikelyZawgyi(text: string): boolean {
  if (ZAWGYI_SUSPICIOUS.test(text)) return true;
  // Zawgyi often uses U+1031 in wrong positions relative to base consonant.
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)!;
    if (cp === 0x1031 && i > 0) {
      const prev = text.codePointAt(i - 1)!;
      if (prev >= 0x102b && prev <= 0x1030) return true;
    }
  }
  return false;
}

/** Validate medial sign order within one cluster (best-effort). */
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

export function assertUnicodeMyanmar(text: string, context: string): void {
  if (!containsMyanmar(text)) {
    throw new Error(`${context}: expected Myanmar script, got "${text}"`);
  }
  if (isLikelyZawgyi(text)) {
    throw new Error(`${context}: rejected likely Zawgyi encoding in "${text}"`);
  }
  const clusters = splitMyanmarClusters(text);
  for (const c of clusters) {
    if (!hasValidMedialOrder(c)) {
      throw new Error(`${context}: invalid medial order in cluster "${c}"`);
    }
  }
}

/** Reject rule-engine outputs with common malformed modifier stacks. */
export function isPlausibleNameSyllable(text: string): boolean {
  if (!containsMyanmar(text)) return false;
  if (isLikelyZawgyi(text)) return false;
  // Dot-below should not immediately follow a bare vowel sign without consonant context.
  if (/[\u102d\u102e\u102f\u1030\u1031\u1032][\u1037]/.test(text)) return false;
  // Asat should not follow vowel signs directly.
  if (/[\u102d\u102e\u102f\u1030\u1031\u1032][\u103a]/.test(text)) return false;
  const clusters = splitMyanmarClusters(text);
  for (const c of clusters) {
    if (!hasValidMedialOrder(c)) return false;
    const hasConsonant = [...c].some((ch) => {
      const cp = ch.codePointAt(0)!;
      return cp >= 0x1000 && cp <= 0x102a;
    });
    if (!hasConsonant) return false;
  }
  return true;
}

/** Split into rough orthographic syllable clusters for validation. */
export function splitMyanmarClusters(text: string): string[] {
  const clusters: string[] = [];
  let current = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (isMyanmarCodePoint(cp) && cp >= 0x1000 && cp <= 0x102a) {
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
  A: "\u1021",
  ASAT: "\u103a",
  DOT_BELOW: "\u1037",
  VISARGA: "\u1038",
  ANUSVARA: "\u1036",
  YA_PIN: "\u103b",
  YA_YIT: "\u103c",
  WA_HSWE: "\u103d",
  HA_HTOE: "\u103e",
  VOWEL_I: "\u102d",
  VOWEL_II: "\u102e",
  VOWEL_U: "\u102f",
  VOWEL_UU: "\u1030",
  VOWEL_E: "\u1031",
  VOWEL_AI: "\u1032",
} as const;
