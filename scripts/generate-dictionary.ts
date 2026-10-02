#!/usr/bin/env tsx
/**
 * Generates data/dictionary.json from curated romanized Myanmar name parts.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { DictionaryEntry, DictionaryFile } from "../src/lib/converter/types";
import { assertUnicodeMyanmar } from "../src/lib/converter/unicode";
import {
  GOLDEN_SYLLABLES,
  RESERVED_ROMAN,
  ROMAN_VARIANTS,
  TITLE_KEYS,
} from "../src/lib/converter/golden-expected";

type Seed = {
  variants: string[];
  spellings: { text: string; weight: number }[];
  kind?: DictionaryEntry["kind"];
};

function s(text: string, weight = 1): { text: string; weight: number } {
  return { text, weight };
}

const T = (variants: string[], myanmar: string) =>
  ({ variants, spellings: [s(myanmar)], kind: "title" as const }) satisfies Seed;

const G = (variants: string[], myanmar: string, alt?: string) =>
  ({
    variants,
    spellings: alt ? [s(myanmar), s(alt, 0.85)] : [s(myanmar)],
    kind: "given" as const,
  }) satisfies Seed;

const Y = (variants: string[], myanmar: string) =>
  ({ variants, spellings: [s(myanmar)], kind: "syllable" as const }) satisfies Seed;

const SEEDS: Seed[] = [];

for (const [canonical, myanmar] of Object.entries(GOLDEN_SYLLABLES)) {
  const lower = canonical.toLowerCase();
  const variants = ROMAN_VARIANTS[lower] ?? [lower, canonical];
  const kind = TITLE_KEYS.has(canonical) ? "title" : "given";
  SEEDS.push({ variants: [...new Set(variants.map((v) => v.toLowerCase()))], spellings: [s(myanmar)], kind });
}

// Dr title (not in syllable golden list)
SEEDS.push(
  T(["dr", "dr."], "\u1012\u1031\u102c\u1037\u1000\u1010\u103b\u102c\u103a"),
);

/** Extra syllable fragments — must not overlap RESERVED_ROMAN keys. */
const EXTRA_PARTS: Array<[string, string]> = [
  ["ba", "\u1017\u102c"],
  ["be", "\u1017\u1031"],
  ["bi", "\u1017\u102d"],
  ["bu", "\u1017\u102f"],
  ["pa", "\u1015\u102c"],
  ["pe", "\u1015\u1031"],
  ["pi", "\u1015\u102d"],
  ["pu", "\u1015\u102f"],
  ["da", "\u1012\u102c"],
  ["de", "\u1012\u1031"],
  ["di", "\u1012\u102d"],
  ["du", "\u1012\u102f"],
  ["ta", "\u1010\u102c"],
  ["te", "\u1010\u1031"],
  ["ti", "\u1010\u102d"],
  ["tu", "\u1010\u102f"],
  ["ga", "\u1002\u102c"],
  ["ge", "\u1002\u1031"],
  ["gi", "\u1002\u102d"],
  ["gu", "\u1002\u102f"],
  ["ka", "\u1000\u102c"],
  ["ke", "\u1000\u1031"],
  ["ki", "\u1000\u102d"],
  ["ku", "\u1000\u102f"],
  ["ja", "\u1007\u102c"],
  ["je", "\u1007\u1031"],
  ["ji", "\u1007\u102d"],
  ["ju", "\u1007\u102f"],
  ["cha", "\u1005\u102c"],
  ["che", "\u1005\u1031"],
  ["chi", "\u1005\u102d"],
  ["chu", "\u1005\u102f"],
  ["sa", "\u1005\u102c"],
  ["se", "\u1005\u1031"],
  ["si", "\u1005\u102d"],
  ["na", "\u1014\u102c"],
  ["ne", "\u1014\u1031"],
  ["ni", "\u1014\u102d"],
  ["nu", "\u1014\u102f"],
  ["la", "\u101e\u102c"],
  ["le", "\u101e\u1031"],
  ["li", "\u101e\u102d"],
  ["lu", "\u101e\u102f"],
  ["ra", "\u101c\u102c"],
  ["re", "\u101c\u1031"],
  ["ri", "\u101c\u102d"],
  ["ru", "\u101c\u102f"],
  ["wa", "\u101d\u102c"],
  ["we", "\u101d\u1031"],
  ["wi", "\u101d\u102d"],
  ["wu", "\u101d\u102f"],
  ["ya", "\u101a\u102c"],
  ["yo", "\u101a\u1031\u102f"],
  ["za", "\u103b\u102c"],
  ["ze", "\u103b\u1031"],
  ["zi", "\u103b\u102d"],
  ["zuu", "\u103b\u1030"],
  ["hta", "\u1011\u102c"],
  ["hte", "\u1011\u1031"],
  ["hti", "\u1011\u102d"],
  ["tha", "\u1011\u102c"],
  ["the", "\u1011\u1031"],
  ["thi", "\u1011\u102d"],
  ["sha", "\u1015\u103c\u102c"],
  ["she", "\u1015\u103c\u1031"],
  ["shi", "\u1015\u103c\u102d"],
  ["shu", "\u1015\u103c\u102f"],
  ["kya", "\u1015\u103b\u102c"],
  ["kye", "\u1015\u103b\u1031"],
  ["kyi", "\u1015\u103b\u102d"],
  ["kyu", "\u1015\u103b\u102f"],
  ["gya", "\u1002\u103b\u102c"],
  ["gye", "\u1002\u103b\u1031"],
  ["gyi", "\u1002\u103b\u102d"],
  ["gyu", "\u1002\u103b\u102f"],
  ["nya", "\u1014\u103b\u102c"],
  ["nye", "\u1014\u103b\u1031"],
  ["nyi", "\u1014\u103b\u102d"],
  ["nyu", "\u1014\u103b\u102f"],
  ["myi", "\u1019\u103b\u102d"],
  ["myu", "\u1019\u103b\u102f"],
  ["pya", "\u1016\u103b\u102c"],
  ["pyi", "\u1016\u103b\u102d"],
  ["pyu", "\u1016\u103b\u102f"],
  ["swe", "\u1005\u103c\u1031"],
  ["swi", "\u1005\u103c\u102d"],
  ["swu", "\u1005\u103c\u102f"],
  ["twa", "\u1010\u103d\u102c"],
  ["twi", "\u1010\u103d\u102d"],
  ["twu", "\u1010\u103d\u102f"],
  ["hna", "\u101f\u1014\u102c"],
  ["hni", "\u101f\u1014\u102d"],
  ["hnu", "\u101f\u1014\u102f"],
  ["hle", "\u101f\u101e\u1031"],
  ["hli", "\u101f\u101e\u102d"],
  ["hlu", "\u101f\u101e\u102f"],
  ["ble", "\u1017\u103b\u1031"],
  ["bla", "\u1017\u103b\u102c"],
  ["bwe", "\u1017\u103d\u1031"],
  ["kwe", "\u1000\u103d\u1031"],
  ["mwe", "\u1019\u103d\u1031"],
  ["pwe", "\u1015\u103d\u1031"],
  ["ywe", "\u101a\u103d\u1031"],
  ["swel", "\u1005\u103c\u101e\u103a"],
  ["ngwet", "\u1014\u103d\u1031\u1010\u103a"],
  ["aungpyaesone", "\u1021\u1031\u102c\u1004\u103a\u1015\u103c\u100a\u1037\u103a\u1005\u102f\u1036"],
  ["pyaesone", "\u1015\u103c\u100a\u1037\u103a\u1005\u102f\u1036"],
  ["kyawmin", "\u1000\u103b\u1031\u102c\u103a\u1019\u1004\u103a\u1038"],
  ["kyawswa", "\u1000\u103b\u1031\u102c\u103a\u1005\u103c\u102c"],
  ["kyawthu", "\u1000\u103b\u1031\u102c\u103a\u1011\u1030"],
  ["kyawzin", "\u1000\u103b\u1031\u102c\u103a\u1007\u1004\u103a"],
  ["minthu", "\u1019\u1004\u103a\u1038\u1011\u1030"],
  ["minzaw", "\u1019\u1004\u103a\u1038\u1007\u1031\u102c\u103a"],
  ["zawmin", "\u1007\u1031\u102c\u103a\u1019\u1004\u103a\u1038"],
  ["htooaung", "\u1011\u1030\u1038\u1021\u1031\u102c\u1004\u103a"],
  ["waiyan", "\u101d\u1031\u101a\u1036"],
  ["waiwai", "\u101d\u1031\u101d\u1031"],
  ["nyeinchan", "\u1004\u103c\u102d\u1019\u103a\u1001\u103b\u1019\u103a\u1038"],
  ["chanmyae", "\u1001\u103b\u1019\u103a\u1038\u1019\u103c\u1031\u1037"],
  ["myintmyat", "\u1019\u102d\u1036\u1037\u103a\u1019\u103c\u1010\u103a"],
  ["myintzu", "\u1019\u102d\u1036\u1037\u103a\u103b\u102f"],
  ["khinmarlar", "\u1001\u1004\u103a\u1019\u102c\u103a\u101e\u102c\u103a"],
  ["khinmar", "\u1001\u1004\u103a\u1019\u102c\u103a"],
  ["khinmoe", "\u1001\u1004\u103a\u1019\u102d\u102f\u1038"],
  ["thandar", "\u1011\u1036\u1037\u1012\u102c\u103a"],
  ["thantzin", "\u1011\u1014\u1037\u103a\u1007\u1004\u103a"],
  ["hninwai", "\u1014\u103e\u1004\u103a\u1038\u101d\u1031"],
  ["hninwaiyan", "\u1014\u103e\u1004\u103a\u1038\u101d\u1031\u101a\u1036"],
  ["aungmoe", "\u1021\u1031\u102c\u1004\u103a\u1019\u102d\u102f\u1038"],
  ["aungpyae", "\u1021\u1031\u102c\u1004\u103a\u1015\u103c\u100a\u1037\u103a"],
  ["aungphyo", "\u1021\u1031\u102c\u1004\u103a\u1015\u103b\u102d\u102f"],
  ["aungzaw", "\u1021\u1031\u102c\u1004\u103a\u1007\u1031\u102c\u103a"],
  ["aungmyint", "\u1021\u1031\u102c\u1004\u103a\u1019\u102d\u1036\u1037\u103a"],
  ["yemyint", "\u101c\u1031\u1019\u102d\u1036\u1037\u103a"],
  ["yemyat", "\u101c\u1031\u1019\u103c\u1010\u103a"],
  ["yadanar", "\u101b\u1010\u1014\u102c"],
  ["yadana", "\u101b\u1010\u1014\u102c"],
  ["myatnoe", "\u1019\u103c\u1010\u103a\u1014\u1031\u1037"],
  ["myatthu", "\u1019\u103c\u1010\u103a\u1011\u1030"],
  ["eaindra", "\u1021\u102d\u1014\u1012\u102c"],
  ["moemoe", "\u1019\u102d\u102f\u1038\u1019\u102d\u102f\u1038"],
  ["kyawkyaw", "\u1000\u103b\u1031\u102c\u103a\u1000\u103b\u1031\u102c\u103a"],
  ["htoohtoo", "\u1011\u1030\u1038\u1011\u1030\u1038"],
  ["marlar", "\u1019\u102c\u103a\u101e\u102c\u103a"],
  ["tayzar", "\u1010\u103b\u102c\u103a"],
  ["myolwin", "\u1019\u103b\u102d\u102f\u1038\u101c\u103d\u1004\u103a"],
  ["hsumon", "\u101f\u1005\u102f\u1014\u1036\u1038"],
  ["yimon", "\u101a\u102d\u1014\u1036\u1038"],
  ["yinmar", "\u101a\u102d\u1036\u1037\u1019\u102c\u103a"],
  ["zuzar", "\u103b\u102f\u1007\u102c\u103a"],
  ["ngwetin", "\u1014\u103d\u1031\u1010\u1004\u103a"],
  ["shwin", "\u1015\u103c\u102d\u1036\u1037"],
  ["pwel", "\u1015\u103d\u101e\u103a"],
  ["bwel", "\u1017\u103d\u101e\u103a"],
  ["kwel", "\u1000\u103d\u101e\u103a"],
  ["mwel", "\u1019\u103d\u101e\u103a"],
  ["twel", "\u1010\u103d\u101e\u103a"],
  ["yemyatthuza", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030\u103b\u102c"],
  ["yemyatthuzar", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030\u103b\u102c\u103a"],
  ["minhtet", "\u1019\u1004\u103a\u1038\u1011\u1031\u102c\u103a"],
  ["minwai", "\u1019\u1004\u103a\u1038\u101d\u1031"],
  ["waiyanntun", "\u101d\u1031\u101a\u1036\u1010\u102f\u1036\u1037"],
  ["myinttun", "\u1019\u102d\u1036\u1037\u103a\u1010\u102f\u1036\u1037"],
  ["myintsoe", "\u1019\u102d\u1036\u1037\u103a\u1005\u102d\u102f\u1038"],
  ["myintthu", "\u1019\u102d\u1036\u1037\u103a\u1011\u1030"],
  ["khinthandar", "\u1001\u1004\u103a\u1011\u1036\u1037\u1012\u102c\u103a"],
  ["thandarswe", "\u1011\u1036\u1037\u1012\u102c\u103a\u101b\u103d\u103e\u1031"],
  ["khinmay", "\u1001\u1004\u103a\u1019\u103c\u1031"],
  ["aungko", "\u1021\u1031\u102c\u1004\u103a\u1000\u102d\u102f"],
  ["kyawtun", "\u1000\u103b\u1031\u102c\u103a\u1010\u102f\u1036\u1037"],
  ["kyawlin", "\u1000\u103b\u1031\u102c\u103a\u101e\u102d\u1036\u1037"],
  ["zawhtoo", "\u1007\u1031\u102c\u103a\u1011\u1030\u1038"],
  ["zawgyi", "\u1007\u1031\u102c\u103a\u1002\u103b\u102d"],
  ["htooaungyeyint", "\u1011\u1030\u1038\u1021\u1031\u102c\u1004\u103a\u101b\u1032\u101b\u1004\u1037\u103a"],
  ["yemint", "\u101c\u1031\u1019\u1004\u103a\u1038"],
  ["yemyatnoe", "\u101c\u1031\u1019\u103c\u1010\u103a\u1014\u1031\u1037"],
  ["yemyatthu", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030"],
  ["yemyatthuzaw", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030\u1007\u1031\u102c\u103a"],
  ["yemyatthuzawmin", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030\u1007\u1031\u102c\u103a\u1019\u1004\u103a\u1038"],
  ["yemyatthuzawminhtet", "\u101c\u1031\u1019\u103c\u1010\u103a\u1011\u1030\u1007\u1031\u102c\u103a\u1019\u1004\u103a\u1038\u1011\u1031\u102c\u103a"],
  ["moeaung", "\u1019\u102d\u102f\u1038\u1021\u1031\u102c\u1004\u103a"],
  ["phyiphyu", "\u1015\u103b\u102d\u102f\u1016\u103b\u102f"],
  ["phyiphyo", "\u1015\u103b\u102d\u102f\u1015\u103b\u102d\u102f"],
  ["nyinyein", "\u1014\u103b\u102d\u1019\u103a\u1004\u103c\u102d\u1019\u103a"],
  ["sususan", "\u1005\u102f\u1005\u102f\u1014\u1036\u1038"],
  ["lwinlwin", "\u101c\u103d\u1004\u103a\u101c\u103d\u1004\u103a"],
  ["thirihtet", "\u1011\u102e\u1011\u1031\u102c\u103a"],
  ["thirihtay", "\u1011\u102e\u1011\u1031\u102c\u1037"],
  ["maymay", "\u1019\u1031\u1019\u1031"],
  ["eiei", "\u1021\u102d\u1021\u102d"],
  ["heinhein", "\u101f\u102d\u1014\u103a\u1038\u101f\u102d\u1014\u103a\u1038"],
  ["myatmyat", "\u1019\u103c\u1010\u103a\u1019\u103c\u1010\u103a"],
  ["kaungkaung", "\u1000\u1031\u102c\u1004\u103a\u1038\u1000\u1031\u102c\u1004\u103a\u1038"],
  ["khaingkhaing", "\u1001\u102d\u102f\u1004\u103a\u1001\u102d\u102f\u1004\u103a"],
  ["thetthet", "\u1011\u1031\u102c\u103a\u1011\u1031\u102c\u103a"],
  ["paingpaing", "\u1015\u102d\u102f\u1004\u103a\u1015\u102d\u102f\u1004\u103a"],
  ["wintwint", "\u101d\u1004\u1037\u103a\u101d\u1004\u1037\u103a"],
  ["yadanarzaw", "\u101b\u1010\u1014\u102c\u1007\u1031\u102c\u103a"],
  ["nandamin", "\u1014\u1014\u1039\u1012\u1019\u1004\u103a\u1038"],
  ["sandarkhin", "\u1005\u1014\u1039\u1012\u102c\u1001\u1004\u103a"],
  ["thidaphyo", "\u1011\u102e\u1010\u102c\u1015\u103b\u102d\u102f"],
  ["thidamoe", "\u1011\u102e\u1010\u102c\u1019\u102d\u102f\u1038"],
  ["thidamin", "\u1011\u102e\u1010\u102c\u1019\u1004\u103a\u1038"],
  ["thidazaw", "\u1011\u102e\u1010\u102c\u1007\u1031\u102c\u103a"],
  ["thidathant", "\u1011\u102e\u1010\u102c\u1011\u1014\u1037\u103a"],
  ["thidakhin", "\u1011\u102e\u1010\u102c\u1001\u1004\u103a"],
  ["thidachan", "\u1011\u102e\u1010\u102c\u1001\u103b\u1019\u103a\u1038"],
  ["thidatin", "\u1011\u102e\u1010\u102c\u1010\u1004\u103a"],
  ["thidangwe", "\u1011\u102e\u1010\u102c\u1004\u103d\u1031"],
  ["thidahla", "\u1011\u102e\u1010\u102c\u101c\u103b\u102c"],
  ["thidakhaing", "\u1011\u102e\u1010\u102c\u1001\u102d\u102f\u1004\u103a"],
  ["thidathein", "\u1011\u102e\u1010\u102c\u1014\u102d\u102f\u1004\u103a"],
  ["thidanaing", "\u1011\u102e\u1010\u102c\u1014\u102d\u102f\u1004\u103a"],
  ["thidapaing", "\u1011\u102e\u1010\u102c\u1015\u102d\u102f\u1004\u103a"],
  ["thidawint", "\u1011\u102e\u1010\u102c\u101d\u1004\u1037\u103a"],
  ["thidaye", "\u1011\u102e\u1010\u102c\u101b\u1032"],
  ["thidayint", "\u1011\u102e\u1010\u102c\u101b\u1004\u1037\u103a"],
  ["thidaoo", "\u1011\u102e\u1010\u102c\u1026"],
  ["thidaaye", "\u1011\u102e\u1010\u102c\u1021\u1031\u1038"],
  ["thidaei", "\u1011\u102e\u1010\u102c\u1021\u102d"],
  ["thidamyo", "\u1011\u102e\u1010\u102c\u1019\u103b\u102d\u102f\u1038"],
  ["thidaphone", "\u1011\u102e\u1010\u102c\u1016\u102f\u1014\u103a\u1038"],
  ["thidapyae", "\u1011\u102e\u1010\u102c\u1015\u103c\u100a\u1037\u103a"],
  ["thidashwe", "\u1011\u102e\u1010\u102c\u101b\u103d\u103e\u1031"],
  ["thidayee", "\u1011\u102e\u1010\u102c\u101b\u100a\u103a"],
  ["thidahnin", "\u1011\u102e\u1010\u102c\u1014\u103e\u1004\u103a\u1038"],
  ["thidawai", "\u1011\u102e\u1010\u102c\u101d\u1031"],
  ["thidayan", "\u1011\u102e\u1010\u102c\u101a\u1036"],
  ["thidachanmyae", "\u1011\u102e\u1010\u102c\u1001\u103b\u1019\u103a\u1038\u1019\u103c\u1031\u1037"],
  ["thidangwetin", "\u1011\u102e\u1010\u102c\u1004\u103d\u1031\u1010\u1004\u103a"],
  ["thidamoemoe", "\u1011\u102e\u1010\u102c\u1019\u102d\u102f\u1038\u1019\u102d\u102f\u1038"],
];

for (const [roman, mm] of EXTRA_PARTS) {
  if (RESERVED_ROMAN.has(roman.toLowerCase())) continue;
  SEEDS.push(Y([roman], mm));
}

function mergeSeeds(seeds: Seed[]): DictionaryEntry[] {
  const byKey = new Map<string, DictionaryEntry>();
  for (const seed of seeds) {
    const key = seed.variants.map((v) => v.toLowerCase()).sort().join("|");
    const existing = byKey.get(key);
    if (existing) {
      existing.spellings = [...existing.spellings, ...seed.spellings];
    } else {
      byKey.set(key, {
        variants: [...new Set(seed.variants.map((v) => v.toLowerCase()))],
        spellings: [...seed.spellings],
        kind: seed.kind,
      });
    }
  }
  return [...byKey.values()];
}

const entries = mergeSeeds(SEEDS);

for (const entry of entries) {
  for (const sp of entry.spellings) {
    assertUnicodeMyanmar(sp.text, `dictionary:${entry.variants[0]}`);
  }
}

const file: DictionaryFile = { version: 1, entries };

const outPath = path.join(process.cwd(), "data", "dictionary.json");
writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} dictionary entries to ${outPath}`);
