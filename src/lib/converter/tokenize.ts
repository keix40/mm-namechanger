import { expandAbbreviation, normalizeRomanInput } from "./normalize";

const SPLIT = /[\s\-·.]+/;

export function tokenizeName(name: string): string[] {
  const cleaned = normalizeRomanInput(name);
  if (!cleaned) return [];
  return cleaned
    .split(SPLIT)
    .map((t) => t.replace(/[,;]+$/g, ""))
    .filter(Boolean)
    .map(expandAbbreviation);
}
