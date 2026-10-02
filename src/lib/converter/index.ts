import dictionaryData from "@data/dictionary.json";
import { normalizeRomanToken } from "./normalize";
import { convertTokenByRules } from "./rules";
import { tokenizeName } from "./tokenize";
import { containsMyanmar, isLikelyZawgyi, validateMyanmarOrthography } from "./unicode";
import {
  DictionaryFile,
  NameConversionResult,
  SpellingCandidate,
  TokenConversion,
} from "./types";

const dictionary = dictionaryData as DictionaryFile;

const kindRank: Record<string, number> = { title: 3, given: 2, syllable: 1 };

type LookupEntry = { spellings: SpellingCandidate[]; rank: number };

const lookupMap = new Map<string, LookupEntry>();

for (const entry of dictionary.entries) {
  const rank = kindRank[entry.kind ?? "syllable"] ?? 1;
  for (const variant of entry.variants) {
    const key = normalizeRomanToken(variant);
    const existing = lookupMap.get(key);
    if (!existing || rank > existing.rank) {
      lookupMap.set(key, { spellings: [...entry.spellings], rank });
    } else if (rank === existing.rank) {
      lookupMap.set(key, { spellings: mergeSpellings(existing.spellings, entry.spellings), rank });
    }
  }
}

function mergeSpellings(a: SpellingCandidate[], b: SpellingCandidate[]): SpellingCandidate[] {
  const map = new Map<string, SpellingCandidate>();
  for (const s of [...a, ...b]) {
    const prev = map.get(s.text);
    if (!prev || prev.weight < s.weight) map.set(s.text, s);
  }
  return [...map.values()].sort((x, y) => y.weight - x.weight);
}

function lookupDictionary(token: string): SpellingCandidate[] | null {
  const key = normalizeRomanToken(token);
  const hit = lookupMap.get(key);
  return hit?.spellings.length ? hit.spellings : null;
}

/** Tokens already written in well-formed Myanmar Unicode pass through unchanged. */
function isWellFormedMyanmar(token: string): boolean {
  return containsMyanmar(token) && !isLikelyZawgyi(token) && validateMyanmarOrthography(token).length === 0;
}

const MAX_PIECE_LENGTH = 10;
const RULE_PIECE_FACTOR = 0.9;
const EXTRA_PIECE_PENALTY = 0.97;
/** A doubled consonant ("cherry", "anna") is read as one: skip the repeat. */
const DOUBLED_CONSONANT_PENALTY = 0.98;
/**
 * "r" is never a real syllable final in Burmese romanization ("ar" = ာ), so when
 * a vowel-initial piece follows a piece ending in "r" ("tar" + "a"), the "r" was
 * almost certainly the next syllable's onset ("ta" + "ra").
 */
const SWALLOWED_R_PENALTY = 0.8;

/**
 * Fallback for tokens missing from the dictionary: split the romanized token into
 * dictionary syllables and/or rule-parsed syllables ("nilar" -> ni + lar) and keep
 * the best-scoring segmentations.
 */
function segmentToken(token: string): SpellingCandidate[] {
  const s = normalizeRomanToken(token);
  if (!s || s.length > 60 || !/^[a-z]+$/.test(s)) return [];
  type Partial = { text: string; score: number; pieces: number; endsWithR: boolean };
  const best: Partial[][] = Array.from({ length: s.length + 1 }, () => []);
  best[0] = [{ text: "", score: 1, pieces: 0, endsWithR: false }];
  const keepBest = (j: number) => {
    best[j]!.sort((a, b) => b.score - a.score);
    best[j]!.splice(4);
  };
  for (let i = 0; i < s.length; i++) {
    if (!best[i]!.length) continue;
    if (i > 0 && s[i] === s[i + 1] && !/[aeiouwy]/.test(s[i]!)) {
      for (const prev of best[i]!) {
        best[i + 1]!.push({ ...prev, score: prev.score * DOUBLED_CONSONANT_PENALTY, endsWithR: false });
      }
      keepBest(i + 1);
    }
    for (let j = i + 1; j <= Math.min(s.length, i + MAX_PIECE_LENGTH); j++) {
      const piece = s.slice(i, j);
      const dict = piece.length >= 2 ? lookupMap.get(piece)?.spellings : undefined;
      const cands = dict?.length
        ? dict
        : convertTokenByRules(piece).map((c) => ({ text: c.text, weight: c.weight * RULE_PIECE_FACTOR }));
      const vowelInitial = /^[aeiou]/.test(piece);
      for (const prev of best[i]!) {
        const penalty =
          (prev.pieces ? EXTRA_PIECE_PENALTY : 1) * (prev.endsWithR && vowelInitial ? SWALLOWED_R_PENALTY : 1);
        for (const c of cands.slice(0, 3)) {
          best[j]!.push({
            text: prev.text + c.text,
            score: prev.score * c.weight * penalty,
            pieces: prev.pieces + 1,
            endsWithR: piece.endsWith("r"),
          });
        }
      }
      keepBest(j);
    }
  }
  const dedup = new Map<string, number>();
  for (const p of best[s.length]!) {
    if (!p.pieces) continue;
    const weight = Math.round(Math.pow(p.score, 1 / p.pieces) * RULE_PIECE_FACTOR * 1000) / 1000;
    if ((dedup.get(p.text) ?? 0) < weight) dedup.set(p.text, weight);
  }
  return [...dedup.entries()].map(([text, weight]) => ({ text, weight })).sort((a, b) => b.weight - a.weight);
}

function toTokenConversion(roman: string, candidates: SpellingCandidate[], source: "dictionary" | "rules"): TokenConversion {
  const best = candidates[0]!;
  return {
    roman,
    myanmar: best.text,
    confidence: best.weight,
    source,
    alternatives: candidates,
  };
}

interface BeamState {
  tokens: TokenConversion[];
  score: number;
}

function combineTokens(tokenConversions: TokenConversion[], maxAlternatives: number): BeamState[] {
  const beams: BeamState[] = [{ tokens: [], score: 1 }];
  for (const tc of tokenConversions) {
    const alts = tc.alternatives.length ? tc.alternatives : [{ text: tc.myanmar, weight: tc.confidence }];
    const next: BeamState[] = [];
    for (const beam of beams) {
      for (const alt of alts.slice(0, 4)) {
        const token: TokenConversion = {
          ...tc,
          myanmar: alt.text,
          confidence: alt.weight,
          alternatives: alts,
        };
        const score = beam.score * alt.weight;
        next.push({ tokens: [...beam.tokens, token], score });
      }
    }
    next.sort((a, b) => b.score - a.score);
    beams.splice(0, beams.length, ...next.slice(0, maxAlternatives));
  }
  return beams;
}

export function convertName(input: string, options?: { maxAlternatives?: number }): NameConversionResult {
  const maxAlternatives = options?.maxAlternatives ?? 5;
  const tokens = tokenizeName(input);
  const perTokenOptions: TokenConversion[] = [];

  for (const token of tokens) {
    const dict = lookupDictionary(token);
    if (dict) {
      perTokenOptions.push(toTokenConversion(token, dict, "dictionary"));
    } else {
      const ruled = isWellFormedMyanmar(token)
        ? [{ text: token, weight: 0.95 }]
        : segmentToken(token).filter((c) => c.weight >= 0.35);
      if (ruled.length === 0) {
        perTokenOptions.push({
          roman: token,
          myanmar: token,
          confidence: 0.05,
          source: "rules",
          alternatives: [{ text: token, weight: 0.05 }],
        });
      } else {
        perTokenOptions.push(toTokenConversion(token, ruled, "rules"));
      }
    }
  }

  const beams = combineTokens(perTokenOptions, maxAlternatives);
  const bestBeam = beams[0] ?? { tokens: perTokenOptions, score: 0.1 };
  const bestMyanmar = bestBeam.tokens.map((t) => t.myanmar).join("");

  const alternatives = beams.map((beam) => ({
    myanmar: beam.tokens.map((t) => t.myanmar).join(""),
    confidence: Math.round(Math.min(1, Math.pow(beam.score, 1 / Math.max(1, beam.tokens.length))) * 1000) / 1000,
    tokens: beam.tokens,
  }));

  return {
    input,
    best: {
      myanmar: bestMyanmar,
      confidence: alternatives[0]?.confidence ?? 0.1,
    },
    alternatives,
    tokens: bestBeam.tokens,
  };
}

export function convertNames(inputs: string[], options?: { maxAlternatives?: number }): NameConversionResult[] {
  return inputs.map((n) => convertName(n, options));
}

export function getDictionaryEntryCount(): number {
  return dictionary.entries.length;
}

export { dictionary };
