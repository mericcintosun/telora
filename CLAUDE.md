# CLAUDE.md: Telora

Read `IDENTITY.md` before any visual change. It overrides taste. Then `HANDOFF.md` for the current state.

## Commands

- `npm install`
- `npm run build` (must stay green after every change; it also type-checks `scripts/`)
- `npm run seed` (writes `fixtures/seed-snapshot.json` from `lib/data/seed.ts`, same bytes every run)
- `npm run dev` (http://localhost:3000)
- `npm test` (node:test through tsx, `tests/*.test.ts`: pure OCR confirmation logic, schemas, sample table)
- `npm run proof` (runs the tests and the calibration, rewrites the `PROOF:BEGIN/END` blocks in README.md: `ocr`, `calibration`, `tests`, `corrected`; always exits 0)
- `npm run demo:reset` (rewrites the seed snapshot twice through `scripts/seed.ts`, fails if the bytes differ, prints the clean demo URL). No store, no migration.

## Real vs mocked

- **Real:** distance model, blur preview, deuteranopia matrix, verdicts, fix recipes, URL state (zod `LabParamsSchema`), Tesseract.js upload scan with the 8-distance OCR confirmation, PDF first page through pdfjs-dist (`lib/pdf.ts`), idle engine warm-up, tab cache.
- **Seeded:** 5 posters (4 originals plus the corrected `robot-sumo-night-fixed`) and 4 vision profiles. Seed OCR numbers are samples under fake mode, absent under real mode, and absent on the corrected poster in both.
- **Fallback:** `getLabData()` in `lib/adapter/index.ts`: active adapter, then fake adapter, then seed constants.

## Stack pitfalls

- Next.js 15 App Router. `searchParams` in a page is a Promise; await it.
- Tailwind v4 with no config file. Tokens live in `app/globals.css` (`:root` hexes mapped by `@theme inline`). No hex anywhere else in `app/` or `components/`; the OG image reads `lib/og-colors.ts`.
- TypeScript strict.
- Tesseract.js and the kit packages (`@react-spring/web`, `@use-gesture/react`) are imported only in `"use client"` components.
- `pdfjs-dist` is imported only with a dynamic `import()` inside `renderFirstPage` (`lib/pdf.ts`), never at module top level. `next.config.ts` aliases its optional `canvas` dependency to `false`.
- No server key anywhere. The only env keys are `ADAPTER_MODE` (read only in `lib/adapter/index.ts`; `fake` gives seed posters sample OCR numbers, `real` gives none) and the build-time `NEXT_PUBLIC_BRAND_FILES`. The real OCR runs in the browser and needs no key.
- Core constants live in `lib/config.ts` (reads no env). Error codes in `lib/errors.ts`; the UI switches on the code. Pure confirmation logic in `lib/confirm.ts` keeps relative imports so `tsx` runs it without the path alias.
- Data flows through one seam: `getAdapter()` in `lib/adapter`. Pages pass posters and profiles to client components as props; components never import the seed.

## Never touch

- `public/illustrations/`
- `.farm-*` files (including `.farm-scaffold.json`)
- `IDENTITY.md` above its Amendments line
- `app/icon.svg` and `public/logo.svg`

## Vercel guardrails

- No runtime filesystem writes in app code (build-time and seed scripts may write).
- `useSearchParams` only under `Suspense`.
- No Node-only APIs in edge paths, no custom server, no `output: export`, standard Next build only.
- Every `process.env` key is mirrored in `.env.example`.

## Compaction

When compacting preserve the list of modified files and test commands.

## Writing rules

- English only. Write like a builder: short, concrete, no hype.
- No em dash, no en dash, no double hyphen used as a dash, in code strings, docs or commit messages.
- Banned words: seamless, seamlessly, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless, "in today's world", "it's not just X, it's Y".
- Never describe a feature in the README or UI before it runs.
