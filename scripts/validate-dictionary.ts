import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DictionaryFile } from "../src/lib/converter/types";
import { assertUnicodeMyanmar, validateMyanmarOrthography } from "../src/lib/converter/unicode";

const dictPath = path.join(process.cwd(), "data/dictionary.json");
const raw = readFileSync(dictPath, "utf8");
const file = JSON.parse(raw) as DictionaryFile;

if (file.entries.length < 300) {
  throw new Error(`Expected at least 300 dictionary entries, got ${file.entries.length}`);
}

for (const entry of file.entries) {
  if (!entry.variants.length || !entry.spellings.length) {
    throw new Error(`Invalid entry: ${JSON.stringify(entry)}`);
  }
  for (const sp of entry.spellings) {
    assertUnicodeMyanmar(sp.text, entry.variants[0] ?? "unknown");
    const strict = validateMyanmarOrthography(sp.text);
    if (strict.length) {
      throw new Error(`Strict orthography failed for ${entry.variants[0]}: ${strict.join("; ")}`);
    }
    if (sp.weight <= 0 || sp.weight > 1) {
      throw new Error(`Invalid weight for ${entry.variants[0]}: ${sp.weight}`);
    }
  }
}

execSync("python3 scripts/strict-unicode-check.py data/dictionary.json", {
  stdio: "inherit",
  cwd: process.cwd(),
});

console.log(`Dictionary OK: ${file.entries.length} entries (strict checker passed)`);
