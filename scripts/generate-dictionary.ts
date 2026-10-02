#!/usr/bin/env tsx
/**
 * Generates data/dictionary.json from the curated golden name parts in
 * src/lib/converter/golden-expected.ts. Every spelling must pass the strict
 * orthography validator, so a malformed fixture fails generation.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { DictionaryEntry, DictionaryFile } from "../src/lib/converter/types";
import { assertUnicodeMyanmar } from "../src/lib/converter/unicode";
import {
  ALTERNATE_SPELLINGS,
  GOLDEN_SYLLABLES,
  ROMAN_VARIANTS,
  TITLE_KEYS,
} from "../src/lib/converter/golden-expected";

const ALT_WEIGHT = 0.85;

const entries: DictionaryEntry[] = [];
const seen = new Set<string>();

for (const [canonical, myanmar] of Object.entries(GOLDEN_SYLLABLES)) {
  const lower = canonical.toLowerCase();
  const candidates = [...new Set((ROMAN_VARIANTS[lower] ?? [lower, canonical]).map((v) => v.toLowerCase()))];
  const variants: string[] = [];
  for (const v of candidates) {
    if (seen.has(v)) continue;
    seen.add(v);
    variants.push(v);
  }
  if (!variants.length) continue;
  const spellings = [{ text: myanmar, weight: 1 }];
  const alt = ALTERNATE_SPELLINGS[canonical];
  if (alt && alt !== myanmar) spellings.push({ text: alt, weight: ALT_WEIGHT });
  entries.push({ variants, spellings, kind: TITLE_KEYS.has(canonical) ? "title" : "given" });
}

for (const key of Object.keys(ALTERNATE_SPELLINGS)) {
  if (!(key in GOLDEN_SYLLABLES)) throw new Error(`Alternate for unknown syllable "${key}"`);
}

for (const entry of entries) {
  for (const sp of entry.spellings) {
    assertUnicodeMyanmar(sp.text, `dictionary:${entry.variants[0]}`);
  }
}

const file: DictionaryFile = { version: 1, entries };
const outPath = path.join(process.cwd(), "data", "dictionary.json");
writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} dictionary entries to ${outPath}`);
