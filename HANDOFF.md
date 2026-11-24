# HANDOFF: Telora

You are picking up a working Next.js 15 app. Read this file, then `IDENTITY.md`, `CLAUDE.md` and `DEMO.md`, then start on "Next best step". Keep `npm run build` passing after every change.

## Goal

**Product:** Telora. Upload your poster and say where it will hang: Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

**Hackathon:** IdeaLab Hacks (Devpost, online), themes Beginner Friendly, Design, Open Ended. **Deadline:** 30 November 2026, 23:45 EST (1 December 04:45 UTC). Judging: creativity, execution, usefulness, clarity, 25% each.

**Verified submission requirements:** submit through Devpost; separate pre-existing work from event work (README "Built during IdeaLab Hacks"); credit every library and AI tool (README "Credits", "AI use"); describe capabilities accurately; explain what was learned.

**Phase 3 goal (this session):** the 90-second demo path is real end to end. DEMO step 6 (corrected poster, green at 4 m) and the PDF part of step 7 go from "not built yet" to code; steps 1 to 5 get a fallback chain, zod URL params and the loading, error and empty triad.

## Status

Phase 3 was done by reading and editing files only. Nothing was compiled, tested or run. `npm install` (new: `pdfjs-dist`), `npm run build`, `npm test`, `npm run proof`, `npm run demo:reset` and the browser walk are unverified until the runner and a human report back.

**This is a plain web app.** No database, no server store, no `lib/store.ts`, no migration command, no store secret, no wallet state machine, no chain. `.farm-live.json` stays `{ "requiredEnv": [], "optionalEnv": [] }`.

### Acceptance gate, checked by reading files

- [x] Every DEMO step has a real code path and a fallback in the same file:
  - Steps 1 to 5: `lib/adapter/index.ts:40` `getLabData()` tries `getAdapter()`, then `fakeAdapter` (`:46-48`), then the seed constants (`:51`). `app/page.tsx:19` calls it; `app/page.tsx:21` parses params with `LabParamsSchema.safeParse` and falls back to defaults on failure.
  - Step 6: `lib/data/seed.ts:56` `robot-sumo-night-fixed` (`fixOf` on it, `correctedId` at `lib/data/seed.ts:37`). The button lives in `components/block-report.tsx` (`variantLink`).
  - Step 7: `lib/ocr.ts` `scanPosterImage` routes a PDF to `renderFirstPage` (`lib/pdf.ts:91`) and then `scanPosterCanvas` (`lib/ocr.ts:492`). Typed errors: every failure is a `CoreFailure` code and `components/upload-scan.tsx` renders `scanErrorHint(state.code)`.
- [x] Persistence: no store (see Decisions, table row and rejected rows).
- [x] No runtime `fs` writes: Grep for `from "fs"`, `from "node:fs"`, `writeFile` over `app/`, `components/`, `lib/` returns nothing. `fs` is in `scripts/seed.ts`, `scripts/demo-reset.ts`, `scripts/proof.ts` and the build-time `next.config.ts` read (unchanged from Phase 1).
- [x] No store secret: `.env.example` and `.farm-live.json` were not touched this phase.
- [x] No auth screen, faucet or wallet code anywhere.
- [x] Triad in `components/lab-states.tsx`: `LabSkeleton` (`:11`), `LabErrorState` with "Try again" calling `reset` (`:64`), `LabEmptyState` with `<a href="#upload">Check your own poster</a>` (`:82`). Route to file: `/` uses `app/loading.tsx:5` (`<LabSkeleton />`), `app/error.tsx:7` (`<LabErrorState reset={reset} />`), `components/poster-lab.tsx:109` (`<LabEmptyState />`). `/about` uses `app/about/loading.tsx:3` (`AboutSkeleton`) and `app/error.tsx`; empty state not applicable (static copy, no data).
- [x] Upload guard: `components/upload-scan.tsx:45` `const scanInFlight = useRef(false)`, early return at `:60`, cleared in `finally` at `:86`. The input is `disabled={state.kind === "scanning"}` at `:119`, bound to state.
- [x] zod everywhere data enters: page params `app/page.tsx:21`; API ids `app/api/posters/route.ts:25` and `app/api/profiles/route.ts:25` (`ApiIdSchema`, `lib/schemas.ts:52`). Bad id: 400 `coreError("invalid_input")`; unknown id: 404 `coreError("invalid_input")`; adapter throw: 502 `toCoreError(err)`.
- [x] No chained client-effect fetches: Grep `fetch(` in `components/` has zero hits. `SceneSlot` now uses `next/image` (`components/scene-slot.tsx:1`); it used a plain `<img>` before, so it was changed.
- [x] `package.json:12` has `demo:reset`; `scripts/demo-reset.ts` exists and imports `writeSeedSnapshot` from `scripts/seed.ts`. No migration command; README "Resetting the demo" says why.
- [x] `pdfjs-dist` at `package.json:22` (`^5.0.0`), imported only by dynamic `import("pdfjs-dist")` at `lib/pdf.ts:38` (`lib/pdf.ts:13` is a type-only `typeof import(...)`). README Tech stack says "pdfjs-dist 5".
- [x] Imports added this phase resolve: `@/components/lab-states`, `@/lib/pdf`, `@/lib/schemas` (`LabParamsSchema`, `ApiIdSchema`), `next/image`, `./seed` from `scripts/demo-reset.ts`, `pdfjs-dist` (declared). Seed: 5 posters, 4 profiles, so `/` is non-empty.
- [x] Sameness greps over `app/`, `components/`, `lib/`, `README.md`: zero hits for the dead hexes, banned keyframes, `--delay`, `--d:`, `animate-pulse`, `backdrop-blur`. The only keyframe is still `telora-fade`. Header untouched.
- [x] Writing rules: zero hits for the em dash, en dash, spaced double hyphen and the banned words in `app/`, `components/`, `lib/`, `scripts/`, `tests/`, README.md, DEMO.md, HANDOFF.md (checked before this file was written; this file was written to the same rules).
- [x] Stack claims: README names Next 15, React 19, Tailwind 4, Tesseract.js 6, zod 3, pdfjs-dist 5, react-spring 10; all match `package.json` majors.

Runner checks (not done by the agent): `npm install`, `npm run build` with zero TypeScript errors (including `lib/pdf.ts` against the installed pdfjs-dist 5 types and the `next.config.ts` webpack alias), `npm test` (now two files), `npm run proof` (four blocks), `npm run demo:reset` exit 0, Vercel redeploy.

### Manual checklist for the human

- [ ] Confirm student eligibility and the Devpost video length limit on the IdeaLab Hacks rules page.
- [ ] Private window, three cycles with identical results: steps 1 to 5 instant; "Open the corrected poster" shows every line green at 4 m; upload one PNG and one PDF, both run the 8-step bar and show "OCR: x m, model: y m". Note the scan time; if over 5 s on a large poster, write it here.
- [ ] Drop a second file while a scan runs: nothing happens (input disabled, guard in place).
- [ ] Upload a password-protected PDF: the card shows the parse_failure sentence.
- [ ] Console during the first upload: a `[core] ocr warm` line should appear soon after page load, before the upload.

## Decisions

**Persistence.**

| Option | Verdict | Why |
| --- | --- | --- |
| Steps only read seeded or computed data (no store) | **Chosen** | Seed constants in `lib/data/seed.ts`; uploads stay in the browser; tab cache in `lib/cache.ts`. |
| KV | Rejected | Nothing mutable is shared between visitors. |
| Postgres | Rejected | No relational reads. |
| On-chain | Rejected | No chain in this repo. The "reset the chain state" part of a demo reset is a no-op. |

- **Fallback chain in `getLabData`:** active adapter, then `fakeAdapter` (only if the active one was not already fake), then the seed constants with `mode: "real"` (no OCR numbers, so nothing is invented). An empty list counts as a failure. `usedFallback` is returned for later use; the UI does not show it yet.
- **`/about` has no empty state:** it is static copy with no data.
- **Corrected poster enlarges the date 2.1x, not 1.7x.** The fix recipe's 1.7x brings the date to exactly 4.0 m, and `verdictAt` only calls a line green (legible) when the distance is at most 85% of its max, so 1.7x shows amber. Every rsf block targets about 5 m: date 0.94 to 1.95, venue 0.8 to 2.4 (accent on ground, contrast 5.0), pitch 0.6 to 1.95, QR caption 0.43 to 1.95, title unchanged at 3.53. Hand math is in the comment above the poster in `lib/data/seed.ts`. The report wording "enlarge it 1.7x" on the original is unchanged and tested (`tests/corrected.test.ts`).
- **20/40 is not asserted for the corrected poster.** 20/40 doubles the threshold, so lines would need about 3.2% cap height on A2 and the date would run wider than the sheet. Documented in the test header.
- **The corrected poster is off the rail;** while it is open, the rail keeps its original highlighted. The report shows "Open the corrected poster" on the original and "Back to the original" on the variant; both call the lab's `selectPoster`, which resets size and distance to A2 and 4.0 m and goes through the existing URL sync.
- **PDF path:** `scanPosterImage` hashes the PDF file (SHA-256 plus size plus profile, `scanCacheKey`), renders page 1 with `renderFirstPage(file, OCR_LONG_EDGE_PX)`, then calls `scanPosterCanvas` with that key. A cache hit still renders the page (needed for the preview image). The image path also goes through `scanPosterCanvas` now, so both share one code path.
- **pdf.js render params:** pdf.js 5 moved from `canvasContext` to `canvas` across minor versions, so `lib/pdf.ts` passes both through a cast to `Parameters<typeof page.render>[0]`. Worker failures (message mentions the worker, not a file error name) get one retry, then `upstream_error`; anything else from pdf.js is `parse_failure`.
- **Engine warm-up:** `warmOcrEngine()` loads one worker once per tab (timeout plus one retry, same as scans), then terminates it; the browser keeps the engine and language data cached. It never rejects.
- **`ApiResponse` error variant** gained an optional `hint`, so API errors can carry the `coreError` body. Type only, no data schema change.
- **`invalid_input` hint** now names PDF as accepted; `parse_failure` also covers a damaged or password-protected PDF.

## Failed attempts

None in this session. No cut from the cut protocol was needed (not verified by running).

## Files changed

Slice 1: `lib/adapter/index.ts`, `lib/schemas.ts`, `lib/types.ts`, `app/page.tsx`, `app/api/posters/route.ts`, `app/api/profiles/route.ts`, `components/lab-states.tsx` (new), `app/loading.tsx`, `app/about/loading.tsx`, `app/error.tsx`, `components/poster-lab.tsx`.
Slice 2: `lib/types.ts`, `lib/data/seed.ts`, `lib/adapter/fake.ts`, `components/poster-deck.tsx`, `components/block-report.tsx`, `components/poster-lab.tsx`, `tests/corrected.test.ts` (new), `tests/confirm.test.ts` (seed count 5, PDF accepted).
Slice 3: `package.json`, `next.config.ts`, `lib/config.ts`, `lib/errors.ts`, `lib/pdf.ts` (new), `lib/ocr.ts`, `components/upload-scan.tsx`.
Slice 4: `components/upload-scan.tsx`, `lib/ocr.ts`, `components/scene-slot.tsx`.
Slice 5: `package.json`, `scripts/seed.ts`, `scripts/demo-reset.ts` (new), `scripts/proof.ts`, `README.md`, `DEMO.md`, `CLAUDE.md`, `HANDOFF.md`, `.farm-commits.json`.

## Commands run

None, the agent cannot run commands.

## File map

| File | What it does |
| --- | --- |
| `app/page.tsx` | `/`: claim band + `PosterLab` fed by `getLabData()`, params through `LabParamsSchema` |
| `app/loading.tsx`, `app/error.tsx`, `app/about/loading.tsx` | Triad wrappers over `components/lab-states.tsx` |
| `app/api/posters/route.ts`, `app/api/profiles/route.ts` | Read-only JSON, optional `?id=` (zod), codes from `lib/errors.ts` |
| `components/lab-states.tsx` | `LabSkeleton`, `LabErrorState`, `LabEmptyState` |
| `components/poster-lab.tsx` | The tool: state, URL sync, controls, report, upload card |
| `components/poster-deck.tsx` | Throwable rail (signature 1), hides `fixOf` posters |
| `components/block-report.tsx` | Per-block distance, recipe, OCR line, open corrected / back to original |
| `components/upload-scan.tsx` | Upload card: zod check, `scanInFlight` guard, idle warm-up, 8-step progress, PDF accepted |
| `lib/adapter/index.ts` | `getAdapter()`, `getLabData()` fallback chain |
| `lib/pdf.ts` | `renderFirstPage()` through dynamic pdfjs-dist |
| `lib/ocr.ts` | `scanPosterImage()`, `scanPosterCanvas()`, `confirmAtDistances()`, `warmOcrEngine()` |
| `lib/data/seed.ts` | 5 posters (24 blocks), 4 profiles |
| `scripts/seed.ts`, `scripts/demo-reset.ts`, `scripts/proof.ts` | Snapshot writer, reset check, README proofs |
| `tests/confirm.test.ts`, `tests/corrected.test.ts` | `npm test` |

## Open questions

- Unverified until build: whether the installed pdfjs-dist 5.x types accept the `getDocument({ data })` call and `task.destroy()` as written in `lib/pdf.ts`. The render params are cast, so that call is safe either way.
- Unverified until run: whether Next 15 webpack emits `pdf.worker.min.mjs` from `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` in `lib/pdf.ts`. If the worker 404s on Vercel, the PDF upload shows the `upstream_error` sentence after one retry; the fallback would be copying the worker into `public/` at build time.
- Unverified: whether pdf.js 5 needs extra polyfills in older Safari (it uses newer JS such as `Promise.withResolvers`). If so, PDF upload fails there with a typed error and images still work.
- Unverified: scan time on a large poster. Record it here after the human walk.
- The spec asked for the corrected date at about 1.6% cap height (1.7x). It is 1.95% (2.1x) so the line is green, not amber, at 4 m; see Decisions. The narration "enlarge it 1.7x" still matches the original's recipe line.
- `tests/corrected.test.ts` asserts only 20/20; 20/40 cannot hold at 4 m without overlap.
- Carried over: real-world agreement between OCR and model distances; the downscale blur fallback is an approximation; `tesseract.js` namespace vs default export (handled both ways).
- Confirm student eligibility and the Devpost video limit.

## Next best step

Phase 4: corridor view (poster small on a wall in perspective), downloadable PNG report, kit signature 2 (spring gauge on the lost-line count), signature 3 (pointer tilt on the poster), mobile layout polish. Optionally show `usedFallback` from `getLabData` as a one-line note in the lab.

## Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, Vercel.
- `IDENTITY.md` is law for color, font, route, layout and animation. Tokens only from `app/globals.css`. Radius 0.75rem minimum. Motion opacity only, linear, 280 ms, keyframes prefixed `telora-`. Header: one link, one action.
- Kit packages and Tesseract.js only in `"use client"` components or browser-only functions; pdfjs-dist only through the dynamic import in `lib/pdf.ts`.
- Copy rules and banned words: see `CLAUDE.md`. The README and UI never describe a feature that does not run.
