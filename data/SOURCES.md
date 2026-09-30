# Data sources for the romanized Myanmar name dictionary

This project’s dictionary (`dictionary.json`) is a curated set of romanized variants mapped to Myanmar Unicode spellings with weights. Entries were assembled from publicly available references and hand-checked for Unicode (not Zawgyi). We did **not** bulk-copy any single proprietary or all-rights-reserved list.

| Source | URL | License / terms | How we used it |
|--------|-----|-----------------|----------------|
| Wikipedia — Burmese names | https://en.wikipedia.org/wiki/Burmese_names | CC BY-SA 4.0 | Romanization patterns for honorifics (U, Daw, Maung/Mg) and common naming structure |
| Wikipedia — Category:Burma-related lists | https://en.wikipedia.org/wiki/Category:Burmese_given_names | CC BY-SA 4.0 | Cross-checking frequent given-name romanizations |
| Wiktionary — Burmese lemmas | https://en.wiktionary.org/wiki/Category:Burmese_lemmas | CC BY-SA 4.0 | Syllable-level romanization hints |
| Myanmar Unicode & encoding FAQ (Unicode Consortium) | https://www.unicode.org/faq/middleeast.html | Unicode Terms of Use | Unicode ordering and well-formedness checks |
| Myanmar Unicode Technical Notes (SIL / community references) | https://github.com/silnrsi/font-androika | OFL / open documentation | Medial stack order (ya pin, ya yit, wa hswe, ha htoe) |
| Omniglot — Burmese writing | https://www.omniglot.com/writing/burmese.htm | Fair use / educational reference | Romanization table for consonants and finals |
| CLDR Burmese locale data | https://github.com/unicode-org/cldr-json | Unicode Terms of Use | Locale-appropriate character validation |

## Adding entries

1. Edit `scripts/generate-dictionary.ts` (seed list) or add a row to the generated `data/dictionary.json` (if you regenerate, prefer editing the script).
2. Run `pnpm validate:dictionary` to verify Unicode well-formedness and minimum size.
3. Document any new external list you relied on in this file with license and URL.

## Regenerating

```bash
pnpm exec tsx scripts/generate-dictionary.ts
pnpm validate:dictionary
```
