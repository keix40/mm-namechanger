import dictionaryData from "@data/dictionary.json";
import { normalizeRomanToken } from "./normalize";
import { convertTokenByRules } from "./rules";
import { tokenizeName } from "./tokenize";
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
      const ruled = convertTokenByRules(token).filter((c) => c.weight >= 0.35);
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
    confidence: Math.min(1, Math.pow(beam.score, 1 / Math.max(1, beam.tokens.length))),
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
