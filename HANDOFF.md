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
- Describe capabilities accurately. Never claim the 8-distance OCR re-read works until it does.
- Explain the idea, the work, and what was learned (README "What we learned").

**Phase 1 goal (this session):** every step of the 90-second demo has a home on `/` or `/about` (see `DEMO.md`), and data flows through one adapter seam.

## Status

Phase 1 done by reading and editing files only. Nothing was compiled or run in this session. The build, `npm run seed` and the deploy are unverified until the runner reports back.

Done:
- Typed core in `lib/types.ts` (all domain types, `ScanProgress`, `ApiResponse<T>`, `AdapterMode`). `lib/ocr.ts` re-exports `ScanProgress`.
- Seed in `lib/data/seed.ts` (same ids and values as before, fixed `updated` dates, no `Date.now` or `Math.random`). `lib/data.ts` is now a barrel.
- Adapter seam `lib/adapter/{types,fake,real,index}.ts`; `getAdapter()` reads `ADAPTER_MODE`, default `"fake"`.
- `app/api/posters/route.ts` and `app/api/profiles/route.ts` return `ApiResponse` from the adapter.
- `app/page.tsx` and `app/about/page.tsx` read through `getAdapter()`. `PosterLab` and `PosterDeck` take posters and profiles as props.
- `app/loading.tsx`, `app/about/loading.tsx`; empty states in `components/poster-deck.tsx` ("No posters yet. Upload one below."), `components/block-report.tsx` ("No text lines found for this poster.") and a no-poster panel in `components/poster-lab.tsx`. Upload idle state unchanged (`components/upload-scan.tsx`, `state.kind === "idle"`).
- `app/error.tsx` (name, `reset()` retry, link to `/`, no message or stack) and `app/not-found.tsx` (name, link to `/`).
- Metadata template `"%s | Telora"` in `app/layout.tsx`; `/` title "Poster distance lab", `/about` title "How it works". Header link uses `aria-current="page"` via `components/header-link.tsx`.
- Type scale (`--text-*`), spacing base (`--spacing`) and a link focus outline added to `app/globals.css`. OG colors moved to `lib/og-colors.ts`.
- `DEMO.md`, `CLAUDE.md`, README stack and "Planned" section, this file.

Unmet or partly met, with evidence:
- Hex literals still exist under `app/`: `app/globals.css:7-17` (the token block, which is where the spec says they live) and `app/icon.svg:2-8` (protected file, not touched). `components/` has none.
- The tokens sit in a `:root` block (`app/globals.css:6-39`) that `@theme inline` maps to utilities, not literally inside `@theme`. Moving them risked Tailwind dropping unreferenced theme variables; left as is.
- `components/poster-deck.tsx` keeps a fixed card width in px (`CARD_W = 232`, used at the `role="listitem"` div). The throw and snap math (`STEP`) works in px, so a rem width would desync at non-default font sizes. The rail viewport itself is fluid.
- `app/opengraph-image.tsx` keeps px sizes; it is a fixed 1200x630 image, not a responsive container.
- The upload card remounts if the seed is empty and the visitor uploads (the no-poster branch in `components/poster-lab.tsx` switches to the full layout). Only reachable with an empty seed.
- `useSearchParams`: Grep finds no call anywhere. `/` reads `searchParams` as a server page prop, so no `Suspense` wrapper is needed.
- Not built yet: demo step 6 (corrected poster) and step 7 (8-distance OCR, PDF, corridor view, PNG report). Kit signatures 2 and 3.

## Decisions

- `lib/data.ts` stays as a barrel (`export * from "./types"` plus seed exports and `findPoster`/`findProfile`, which now take an optional list). `@/lib/data` resolves to the file before the `lib/data/` folder.
- Components still import `PAPER_SIZES` and `TONE_VAR` from the barrel. They are fixed constants (paper sizes, tone to CSS variable), not records an adapter would serve. No component imports `POSTERS` or `VISION_PROFILES`.
- `PosterAdapter` has a `mode` field so the API envelope can report `"fake"` or `"real"`.
- `realAdapter` reads the seed too. There is no backend; scanning stays in the browser. It is the Phase 2 swap point.
- The old HANDOFF said "No server routes are needed". Phase 1 asked for two read-only API stubs, so they exist. They are not new pages; the page routes are still only `/` and `/about`.
- `.env.example`: the first comment line changed from "needs no environment variables" to "needs no secrets", because `ADAPTER_MODE` now exists. `NEXT_PUBLIC_BRAND_FILES` got a commented placeholder line.
- `scripts/seed.ts` uses relative imports so `tsx` needs no path alias setup. It creates `fixtures/` with `mkdirSync({ recursive: true })`; no snapshot was hand-written.
- `PosterDeck` gets the 20/20 profile as a prop for its "N blocks lost at the spot" line instead of reading the seed.
- Verdict chip font size moved from `text-[11px]` to a `text-2xs` token.
- The `/about` metadata title became "How it works" (it renders as "How it works | Telora").

## Failed attempts

None in this session.

## Files changed

Slice 1: `lib/types.ts` (new), `lib/data/seed.ts` (new), `lib/data.ts`, `lib/ocr.ts`, `lib/adapter/types.ts` (new), `lib/adapter/fake.ts` (new), `lib/adapter/real.ts` (new), `lib/adapter/index.ts` (new), `scripts/seed.ts` (new), `package.json`, `.env.example`.
Slice 2: `app/api/posters/route.ts` (new), `app/api/profiles/route.ts` (new), `app/page.tsx`, `app/about/page.tsx`, `components/poster-lab.tsx`, `components/poster-deck.tsx`.
Slice 3: `app/loading.tsx` (new), `app/about/loading.tsx` (new), `components/block-report.tsx`, `app/error.tsx`, `app/not-found.tsx`.
Slice 4: `app/layout.tsx`, `app/globals.css`, `app/opengraph-image.tsx`, `lib/og-colors.ts` (new), `components/header-link.tsx` (new), `components/site-header.tsx`, `components/simulated-poster.tsx`.
Slice 5: `DEMO.md` (new), `CLAUDE.md` (new), `README.md`, `HANDOFF.md`, `.farm-commits.json` (new).

## Commands run

None, the agent cannot run commands.

## File map

| File | What it does |
| --- | --- |
| `app/layout.tsx` | Fonts, metadata with the `"%s | Telora"` template, `SiteHeader`, one `<main>` |
| `app/globals.css` | Color tokens (IDENTITY.md hexes only), spacing, type scale, radii, aurora mesh, `telora-fade` and reduced-motion block, slider styling, link focus outline |
| `app/page.tsx` | `/`: claim band + `PosterLab` fed by `getAdapter()` + two copy sections. Reads `?poster= &size= &d= &profile=` |
| `app/loading.tsx` | Lab skeleton |
| `app/about/page.tsx` | `/about`: the model in four steps, calibration table, what runs where. Reads through `getAdapter()` |
| `app/about/loading.tsx` | About skeleton |
| `app/error.tsx`, `app/not-found.tsx` | Error boundary with retry; 404. Both link to `/` |
| `app/api/posters/route.ts`, `app/api/profiles/route.ts` | Read-only JSON, `ApiResponse<T>` from the adapter |
| `app/opengraph-image.tsx` | 1200x630 OG image, colors from `lib/og-colors.ts` |
| `app/icon.svg`, `public/logo.svg` | Brand glyph (do not touch) |
| `public/illustrations/scene-1..3.svg` | Fallback illustrations for `SceneSlot` (do not touch) |
| `components/site-header.tsx` | Sticky solid header: mark, one link, one action |
| `components/header-link.tsx` | The header's `/about` link with `aria-current` |
| `components/share-view-button.tsx` | Copies the current URL |
| `components/poster-lab.tsx` | The tool: state, URL sync, controls, layout. Posters and profiles via props |
| `components/poster-deck.tsx` | K4 signature 1: throwable rail; empty state |
| `components/simulated-poster.tsx` | Blurred live poster + verdict outlines; deutan SVG filter |
| `components/block-report.tsx` | Per-block max distance, verdict, fix recipe; empty state |
| `components/upload-scan.tsx` | Upload card: idle, scanning, done, error |
| `components/ui/*` | shadcn primitives restyled for D19 |
| `lib/types.ts` | All shared types and `ApiResponse<T>` |
| `lib/data/seed.ts` | 4 posters (19 blocks), 4 vision profiles, paper sizes, tone map |
| `lib/data.ts` | Barrel: types, seed exports, `findPoster`, `findProfile` |
| `lib/adapter/*` | `PosterAdapter`, fake and real adapters, `getAdapter()` |
| `lib/legibility.ts` | The distance model |
| `lib/ocr.ts` | `scanPosterImage()`: Tesseract.js scan + canvas contrast |
| `lib/og-colors.ts` | OG image colors mirroring `app/globals.css` |
| `scripts/seed.ts` | `npm run seed`: writes `fixtures/seed-snapshot.json` |

### Real vs mocked

- **Real:** distance model, blur preview, deuteranopia matrix, low-contrast filter, verdicts, fix recipes, URL state, Tesseract.js upload scan, contrast measured from pixels.
- **Seeded:** posters and profiles (both adapters serve `lib/data/seed.ts`). The `contrast` and `deutanContrast` values on the 19 seed blocks are hand-computed from the palette.
- **Not built yet:** 8-distance OCR re-read (`SCAN_DISTANCES_M` in `lib/legibility.ts` is ready), PDF upload, corridor view, PNG report, corrected seed variant, kit signatures 2 (spring gauge) and 3 (pointer tilt).

### One-mark proof (`components/site-header.tsx`)

```tsx
<Link href="/" className="flex items-center gap-2.5 rounded-xl font-display text-xl font-black tracking-tight">
  <BrandMark size={30} />
  Telora
</Link>
```

## Open questions

- Confirm student eligibility (students only, above the age of majority, teams of 1 to 5) before submitting.
- The Devpost video length limit and the public repo requirement are unverified. Check the IdeaLab Hacks rules page before recording.
- Should `ADAPTER_MODE=real` ever point at something other than the seed? If not, Phase 2 can keep `realAdapter` as a seed reader and put OCR confirmation in `lib/ocr.ts` only.

## Next best step

Phase 2: the 8-distance OCR confirmation in `lib/ocr.ts`. Add `confirmAtDistances(canvas, blocks, size, profile)`: for each of `SCAN_DISTANCES_M`, blur an OffscreenCanvas copy with `ctx.filter = blur(sigma)` (sigma from `blurSigmaPx`), re-run Tesseract (two workers in parallel), and record the last distance where at least 60% of each line's words still match as `ocrMaxDistanceM`. Done looks like: after an upload the report shows "OCR: 2.0 m, model: 2.4 m" per line and the progress bar fills through 8 steps.

Later missions (unchanged from the scaffold plan): PDF upload with `pdfjs-dist`; wow-moment polish and corridor view; spring gauge on the lost count; PNG report and a "corrected" Robot Sumo Night seed variant (date at 1.7x); pointer tilt, mobile layout, video.

## Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, Vercel.
- `IDENTITY.md` is law for color, font, route, layout and animation. Colors only from tokens in `app/globals.css`. Radius 0.75rem minimum. Motion opacity only, linear, 280 ms, keyframes prefixed `telora-`. Header: one link, one action.
- Kit packages only in `"use client"` components. Every drag has a button alternative and `touch-action`.
- Copy rules and banned words: see `CLAUDE.md`.
- Honesty: the README and UI never describe a feature that does not run.
- If scope threatens the deadline, cut the corridor view first, then the PNG report, never the working core.
