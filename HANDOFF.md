# HANDOFF: Telora

You are picking up a working Next.js 15 app. Read this file, then `IDENTITY.md`, `CLAUDE.md` and `DEMO.md`, then start on "Next best step". Keep `npm run build` passing after every change.

## Goal

**Product:** Telora. Upload your poster and say where it will hang: Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

**Plain pitch:** You made a poster for a club night or a science fair and you want to know, before printing, whether someone walking down the corridor can read the date. You load it into Telora, pick the paper size and how far away people will stand. The screen shows the poster as it really looks from there, and every line that stops reading turns red. Each line gets a note like "readable up to 2.4 m" and how much bigger it needs to be for the target distance.

**Hackathon:** IdeaLab Hacks (Devpost, online), themes Beginner Friendly, Design, Open Ended.
**Deadline:** 30 November 2026, 23:45 EST (1 December 04:45 UTC). Judging 1 to 5 December.
**Judging:** four criteria at 25% each: creativity and originality; execution and functionality (ties broken on execution, then creativity); usefulness and experience; clarity and learning.

**Verified submission requirements:**
- Submit through Devpost.
- Clearly separate pre-existing work from event work (README "Built during IdeaLab Hacks").
- Credit every library, component, dataset and AI tool (README "Credits" and "AI use").
- Describe capabilities accurately.
- Explain the idea, the work, and what was learned (README "What we learned").

**Phase 2 goal (this session):** DEMO.md step 7, the 8-distance OCR confirmation, is real. An uploaded poster is blurred to each of 1, 1.5, 2, 3, 4, 5, 7 and 10 m and re-read by Tesseract.js in the browser; each line then reads "OCR: x m, model: y m".

## Status

Phase 2 was done by reading and editing files only. Nothing was compiled, tested or run in this session. `npm install`, `npm run build`, `npm test`, `npm run proof` and the browser upload are unverified until the runner and a human report back.

**What went real:** the 8-distance in-browser OCR confirmation (`confirmAtDistances` in `lib/ocr.ts:304`, pure logic in `lib/confirm.ts`), with a 2-worker Tesseract scheduler, `ctx.filter` blur with a downscale fallback for Safari, timeouts with exactly one retry on worker load, typed error codes, and a content-hash cache for the tab.

**Still on fixtures:** the seed posters and vision profiles (`lib/data/seed.ts`), and the seed posters' OCR numbers, which are hand-written samples (`lib/data/ocr-samples.ts`, labelled "Sample OCR", only under `ADAPTER_MODE=fake`).

**Env keys:** none required. `.farm-live.json` is `{ "requiredEnv": [], "optionalEnv": [] }` because the real path is in-browser OCR and needs no secret.

### Acceptance gate, checked by reading files

- [x] Both adapters implement `PosterAdapter`: `lib/adapter/fake.ts:18` and `lib/adapter/real.ts:10`. The only `ADAPTER_MODE` reader is `lib/adapter/index.ts:12`, which defaults to fake.
- [x] Grep for `adapter/fake|adapter/real` in code finds only the imports in `lib/adapter/index.ts:5-6`.
- [x] `.farm-live.json` has empty `requiredEnv` and `optionalEnv`; justified in the Status paragraph above.
- [x] `lib/config.ts` holds the core constants and reads no env (header comment, lines 1-3). `.env.example` lists only `ADAPTER_MODE` and the commented build-time `NEXT_PUBLIC_BRAND_FILES`; the code reads only those two (`lib/adapter/index.ts:12`, `lib/brand-files.ts:2`).
- [x] `package.json:10-11` has `test` and `proof`, `package.json:25` has `zod`. `tests/confirm.test.ts` and `scripts/proof.ts` exist. README has three BEGIN/END pairs: `ocr` (lines 58-60), `calibration` (66-68), `tests` (102-104).
- [x] The forbidden filler markers from the spec (the paste marker, the to-be-decided abbreviation and the two placeholder phrases) have zero Grep hits in README.md, HANDOFF.md and DEMO.md.
- [x] `CoreErrorCode` union at `lib/errors.ts:6`. Failures throw `CoreFailure` carrying `{ error, hint }`; the UI stores only the code and renders `scanErrorHint(code)` (`components/upload-scan.tsx:68`, `:137`, `:167`).
- [x] Worker load uses `OCR_LOAD_TIMEOUT_MS` and one retry guarded by `OCR_RETRIES` with no loop (`lib/ocr.ts:122-139`); each job uses `OCR_JOB_TIMEOUT_MS` (`lib/ocr.ts:160`).
- [x] zod runs on the upload before any scan logic: `components/upload-scan.tsx:46`, and again as the first line of `scanPosterImage` (`lib/ocr.ts:418`). Schemas are exported from `lib/schemas.ts`; the tests import `BlockOcrSchema` and `UploadFileSchema`.
- [x] No `NEXT_PUBLIC_` secret. No `"use client"` file imports a module that reads `process.env` (the client chain imports `lib/config`, `lib/errors`, `lib/schemas`, `lib/confirm`, `lib/cache`, `lib/ocr`, `lib/legibility`, `lib/data`; none touches `process.env`). The existing `lib/brand-files.ts` reads the build-time `NEXT_PUBLIC_BRAND_FILES`, unchanged from Phase 1.
- [x] `lib/cache.ts:17` is a module-scope `Map`, keyed by SHA-256 hex plus size and profile id (`lib/cache.ts:24`); no filesystem or localStorage. No LLM and no prompt text. A failed confirmation returns the poster with model distances and `confirmError` (`lib/ocr.ts`, the `catch (err)` inside `scanPosterImage`).
- [x] Core logs use `CORE_LOG_PREFIX` (`lib/ocr.ts:73-74`) and pass only counts, ids, codes and durations, for example `log("confirm ok", { blocks, ms })` at `lib/ocr.ts:370`.
- [x] The UI says sample or live: `components/poster-lab.tsx:214` (driven by `mode` from `app/page.tsx:54`) and "Sample OCR" vs "OCR" from `block.ocr.basis` in `confirmationLine` (`lib/confirm.ts:96`).
- [x] Under `ADAPTER_MODE=fake` seeds show sample OCR and uploads run the live check; the upload path does not depend on the mode, so no code path exists only under `real`.
- [x] Imports in touched files resolve to repo files or declared dependencies (`zod`, `tesseract.js`, `node:*`). The seed is unchanged: 4 posters, 19 blocks (also asserted in `tests/confirm.test.ts`).
- [x] Sameness greps: no dead hex in `app/`, `components/`, `lib/`; the only keyframe is `telora-fade` (`app/globals.css:150`); no banned keyframe, `--delay`, `backdrop-blur`, browser chrome or stat band added; header untouched (one brand mark).
- [x] No em dash, en dash or banned word in written text (Grep: the only banned-word hit is the rule list in `CLAUDE.md:46`).

Runner and human checks (not done by the agent): `npm install` picking up zod, `npm run build` with zero TypeScript errors, `npm test`, `npm run proof`, the browser upload, Vercel redeploy.

### Manual checklist for the human

- [ ] Confirm student eligibility (students only, above the age of majority, teams of 1 to 5).
- [ ] Check the Devpost video length limit on the IdeaLab Hacks rules page.
- [ ] On the live URL, upload one PNG poster and watch the bar step through "Re-reading at N m (k of 8)"; each line should then show "OCR: x m, model: y m". Upload the same file again: identical output, plus the "came from the tab's cache" note.
- [ ] On the default fake mode, open Robot Sumo Night: the date reads "Sample OCR: 2.0 m, model: 2.4 m" and the report shows the "Sample data" line.
- [ ] Open the browser console during an upload: lines start with `[core]` and never contain poster text.

## Decisions

- **`profileId` added to `BlockOcr`.** The spec listed four fields. The blur depends on the vision profile, and the cache key includes it, so a result without its profile could be compared against the wrong model. The report shows a "checked for a different vision profile" note when it differs, like the stale-size note.
- **Scan uses the lab's current size and profile.** `UploadScan` now gets `size` and `profile` from `PosterLab`; the uploaded poster's `intendedSize` is that size, so the first report matches the OCR.
- **One scheduler for both passes.** `scanPosterImage` starts the 2-worker scheduler once, runs the first pass and passes it to `confirmAtDistances` through an optional sixth `deps` argument; `confirmAtDistances` starts and terminates its own when called alone. Termination is always in `finally`.
- **Worker load tolerates one failed worker.** Both workers load in parallel with `Promise.allSettled`; the scan continues with one if the other fails after its retry. A worker that arrives after its timeout is terminated.
- **Blurred copies go to Tesseract as PNG Blobs** drawn on one reused surface, so 8 full-size canvases never sit in memory together. Jobs are queued as each blob is ready, so OCR starts while later copies are still encoding.
- **Progress for parallel jobs** reports completed count k and names the next distance in queue order ("Re-reading at 3 m (4 of 8)"); the bar fills from 0.55 to 0.98.
- **`scanErrorHint` lives in `lib/errors.ts`** (pure, testable) and is re-exported from `lib/ocr.ts`.
- **Agreement colour:** `ocrAgrees` in `lib/confirm.ts` is OK when OCR reaches `OCR_AGREE_RATIO` (0.85) of the model, or when both are under 1 m; WARN otherwise. BAD is not used for OCR lines.
- **Sample ratios** in `lib/data/ocr-samples.ts` are generated by a small helper from the hand-written distances, and a test checks that each one gives back its own distance under the 60% rule.
- **`CAP_OF_LINE_BOX` and the deuteranopia matrix moved to `lib/config.ts`**, so `lib/ocr.ts` holds no tuning numbers.
- **`/about`** "What runs where" card now describes the confirmation instead of calling it "next up".
- The canvas is filled white before drawing, so transparent PNGs read as dark on white for Tesseract.

## Failed attempts

None in this session. No cut from the cut protocol was needed; the scheduler path was written as specified (not verified by running).

## Files changed

Slice 1: `lib/config.ts` (new), `lib/errors.ts` (new), `lib/schemas.ts` (new), `lib/confirm.ts` (new), `lib/types.ts`, `tests/confirm.test.ts` (new), `package.json`.
Slice 2: `lib/ocr.ts`, `lib/cache.ts` (new).
Slice 3: `lib/data/ocr-samples.ts` (new), `lib/adapter/fake.ts`, `lib/adapter/real.ts`, `lib/adapter/index.ts`, `app/page.tsx`.
Slice 4: `components/upload-scan.tsx`, `components/block-report.tsx`, `components/poster-lab.tsx`, `app/about/page.tsx`.
Slice 5: `scripts/proof.ts` (new), `.farm-live.json` (new), `.env.example`, `README.md`, `DEMO.md`, `CLAUDE.md`, `HANDOFF.md`, `.farm-commits.json`.

## Commands run

None, the agent cannot run commands.

## File map

| File | What it does |
| --- | --- |
| `app/layout.tsx` | Fonts, metadata with the `"%s | Telora"` template, `SiteHeader`, one `<main>` |
| `app/globals.css` | Color tokens (IDENTITY.md hexes only), spacing, type scale, radii, aurora mesh, `telora-fade` and reduced-motion block, slider styling, link focus outline |
| `app/page.tsx` | `/`: claim band + `PosterLab` fed by `getAdapter()` (posters, profiles, `mode`) + two copy sections |
| `app/about/page.tsx` | `/about`: the model, calibration table, what runs where |
| `app/api/posters/route.ts`, `app/api/profiles/route.ts` | Read-only JSON, `ApiResponse<T>` from the adapter |
| `components/poster-lab.tsx` | The tool: state, URL sync, controls, layout, the sample/live source line |
| `components/block-report.tsx` | Per-block max distance, verdict, fix recipe, OCR confirmation line |
| `components/upload-scan.tsx` | Upload card: zod check, 8-step progress, done with OCR count, error by code |
| `lib/config.ts` | Every core constant; reads no env |
| `lib/errors.ts` | `CoreErrorCode`, `CoreError`, `coreError`, `CoreFailure`, `scanErrorHint` |
| `lib/schemas.ts` | `UploadFileSchema`, `BlockOcrSchema`, `OcrSamplesSchema` |
| `lib/confirm.ts` | Pure: `normalizeWords`, `wordMatchRatio`, `assignWordsToBlocks`, `ocrMaxDistanceM`, `ocrAgrees`, `confirmationLine` |
| `lib/ocr.ts` | `scanPosterImage()` and `confirmAtDistances()`: Tesseract scheduler, blur, timeouts, logs |
| `lib/cache.ts` | In-memory scan cache keyed by SHA-256 + size + profile |
| `lib/data/seed.ts` | 4 posters (19 blocks), 4 vision profiles, paper sizes, tone map |
| `lib/data/ocr-samples.ts` | Sample OCR numbers for the 19 seed blocks (not measured) |
| `lib/adapter/*` | `PosterAdapter`, fake (seed + sample OCR) and real (seed, no OCR), `getAdapter()` |
| `lib/legibility.ts` | The distance model, `SCAN_DISTANCES_M`, `blurSigmaPx` |
| `tests/confirm.test.ts` | `npm test` |
| `scripts/proof.ts` | `npm run proof`: tests, calibration, README PROOF blocks |
| `scripts/seed.ts` | `npm run seed`: writes `fixtures/seed-snapshot.json` |

### Real vs mocked

- **Real:** distance model, blur preview, deuteranopia matrix, verdicts, fix recipes, URL state, Tesseract.js upload scan, contrast from pixels, 8-distance OCR confirmation on uploads.
- **Seeded:** posters and profiles. Seed OCR numbers are samples under fake mode, absent under real mode.
- **Not built yet:** PDF upload, corridor view, PNG report, corrected seed variant, kit signatures 2 (spring gauge) and 3 (pointer tilt).

## Open questions

- Unverified until run: whether `tesseract.js` 6 loads through `await import()` as a namespace or under `.default` in the Next bundle. `loadTesseract` in `lib/ocr.ts` accepts both.
- Unverified: real-world agreement between OCR and model distances. If Tesseract fails at 1 m on most posters (blur sigma there is about 1.3 px at 1600 px), consider re-reading at a larger long edge; the constant is `OCR_LONG_EDGE_PX`.
- The downscale blur fallback (`OCR_DOWNSCALE_PER_SIGMA = 2`) is an approximation; nobody has compared it with the filter blur on the same file yet.
- Confirm student eligibility and the Devpost video limit (see the manual checklist).

## Next best step

Phase 3: PDF upload via `pdfjs-dist`. Render the first page to a canvas at the `OCR_LONG_EDGE_PX` long edge, then hand that canvas to the same path as images (`scanPosterImage` will need a canvas entry point next to the `File` one). Extend `UploadFileSchema` with `application/pdf`.

Later missions: wow-moment polish and corridor view; spring gauge on the lost count; PNG report and a "corrected" Robot Sumo Night seed variant (date at 1.7x); pointer tilt, mobile layout, video.

## Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, Vercel.
- `IDENTITY.md` is law for color, font, route, layout and animation. Colors only from tokens in `app/globals.css`. Radius 0.75rem minimum. Motion opacity only, linear, 280 ms, keyframes prefixed `telora-`. Header: one link, one action.
- Kit packages and Tesseract.js only in `"use client"` components or browser-only functions.
- Copy rules and banned words: see `CLAUDE.md`.
- Honesty: the README and UI never describe a feature that does not run; sample numbers are always labelled.
- If scope threatens the deadline, cut the corridor view first, then the PNG report, never the working core.
