import { validateMyanmarOrthography } from "../src/lib/converter/unicode";
import { EXTENDED_GOLDEN_SYLLABLES } from "../src/lib/converter/extended-syllables";

let bad = 0;
for (const [roman, text] of Object.entries(EXTENDED_GOLDEN_SYLLABLES)) {
  const errs = validateMyanmarOrthography(text);
  if (errs.length) {
    bad++;
    console.error(roman, text, errs);
  }
}
if (bad) {
  process.exit(1);
}
console.log(`Extended syllables OK: ${Object.keys(EXTENDED_GOLDEN_SYLLABLES).length}`);
