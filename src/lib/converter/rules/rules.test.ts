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

  it("returns empty for gibberish (no malformed fallback)", () => {
    const out = convertTokenByRules("qqqzzz");
    expect(out.length).toBe(0);
  });

  it("handles medial stack ky onset via rules when not in dictionary", () => {
    const out = convertTokenByRules("kyi");
    expect(out.length).toBeGreaterThan(0);
    assertUnicodeMyanmar(out[0]!.text, "kyi");
  });
});
