# CLAUDE.md: Telora

Read `IDENTITY.md` before any visual change. It overrides taste. Then `HANDOFF.md` for the current state.

## Commands

- `npm install`
- `npm run build` (must stay green after every change; it also type-checks `scripts/`)
- `npm run seed` (writes `fixtures/seed-snapshot.json` from `lib/data/seed.ts`, same bytes every run)
- `npm run dev` (http://localhost:3000)
- There is no test runner yet.

## Stack pitfalls

- Next.js 15 App Router. `searchParams` in a page is a Promise; await it.
- Tailwind v4 with no config file. Tokens live in `app/globals.css` (`:root` hexes mapped by `@theme inline`). No hex anywhere else in `app/` or `components/`; the OG image reads `lib/og-colors.ts`.
- TypeScript strict.
- Tesseract.js and the kit packages (`@react-spring/web`, `@use-gesture/react`) are imported only in `"use client"` components.
- No server key anywhere. The only env keys are `ADAPTER_MODE` and the build-time `NEXT_PUBLIC_BRAND_FILES`.
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
