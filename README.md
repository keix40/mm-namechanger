# MM-NameChanger

Convert English-romanized Myanmar (Burmese) **personal names** into Myanmar script (Unicode). Includes a responsive web UI and a JSON API. No AI — dictionary + syllable rules only.

**Live site (placeholder):** https://mm-namechanger.vercel.app

<!-- Screenshots: add after deploy -->

## Examples

| Romanized | Myanmar Unicode (best) |
|-----------|-------------------------|
| Mg Mg | မောင်မောင် |
| Aung Kyaw | အောင်ကျော် |
| Daw Khin Myo | ဒေါ်ခင်မျိုး |
| Htoo Aung Ye Yint | ထူးအောင်ရဲယင့် |

Names often have multiple valid spellings; the API returns ranked alternatives with confidence scores.

## API

### `POST /api/convert`

```bash
curl -s -X POST https://mm-namechanger.vercel.app/api/convert \
  -H 'Content-Type: application/json' \
  -d '{"name":"Aung Kyaw"}'
```

Batch (max 200 names):

```bash
curl -s -X POST https://mm-namechanger.vercel.app/api/convert \
  -H 'Content-Type: application/json' \
  -d '{"names":["Mg Mg","Daw Khin Myo"]}'
```

### `GET /api/convert?name=Aung+Kyaw`

Quick conversion for simple clients.

Responses include `best.myanmar`, `best.confidence`, `alternatives`, and per-token `source` (`dictionary` | `rules`).

**Rate limiting:** best-effort in-memory limit per serverless instance (~120 requests/minute/IP). Not a global guarantee across cold starts or multiple instances.

## How it works

1. **Tokenize** on spaces, hyphens, and dots; normalize abbreviations (Mg, Daw, U, Ko, …).
2. **Dictionary lookup** (case-insensitive, romanization variants) with weighted Myanmar spellings.
3. **Rule engine fallback** composes consonants, medials (ျ/ြ/ွ/ှ), vowels, and finals in Unicode order.
4. **Rank** full-name candidates from token weights; label each token’s source.

Unicode output only (not Zawgyi). Zawgyi export could be added later behind the same core library.

## Dictionary & data

- Data file: [`data/dictionary.json`](data/dictionary.json) (regenerate via `scripts/generate-dictionary.ts`).
- Attributions: [`data/SOURCES.md`](data/SOURCES.md).

### Add a dictionary entry

1. Add a seed in `scripts/generate-dictionary.ts` (preferred) or edit `data/dictionary.json`.
2. Run `pnpm validate:dictionary`.
3. Update `data/SOURCES.md` if you used a new external list.

## Local development

```bash
pnpm install
pnpm exec tsx scripts/generate-dictionary.ts
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit & API tests |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm validate:dictionary` | Unicode + size checks on dictionary |

## License

MIT — see [LICENSE](LICENSE).
