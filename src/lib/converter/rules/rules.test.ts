import { describe, expect, it } from "vitest";
import { convertTokenByRules } from "@/lib/converter/rules";
import { assertUnicodeMyanmar } from "@/lib/converter/unicode";

describe("rule engine", () => {
  it("composes aung-like syllable for unknown token starting with aung pattern", () => {
    const out = convertTokenByRules("aung");
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.text).toContain("\u1021");
    assertUnicodeMyanmar(out[0]!.text, "test");
  });

  it("returns low-confidence fallback for gibberish", () => {
    const out = convertTokenByRules("qqqzzz");
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.weight).toBeLessThan(0.5);
  });

  it("handles medial stack ky onset via rules when not in dictionary", () => {
    const out = convertTokenByRules("kyi");
    expect(out.length).toBeGreaterThan(0);
    assertUnicodeMyanmar(out[0]!.text, "kyi");
  });
});
