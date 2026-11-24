# HANDOFF: Telora

You are picking up a working Next.js 15 app. Read this file, then `IDENTITY.md`, `CLAUDE.md` and `DEMO.md`, then start on "Next best step". Keep `npm run build` passing after every change.

## Goal

**Product:** Telora. Upload your poster and say where it will hang: Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

**Hackathon:** IdeaLab Hacks (Devpost, online), themes Beginner Friendly, Design, Open Ended. **Deadline:** 30 November 2026, 23:45 EST (1 December 04:45 UTC). Judging: creativity, execution, usefulness, clarity, 25% each. Four automatic, non-cash main placement rows (1st Place, 2nd Place, 3rd Place, Runner-Up Recognition); no sponsor bounty row, so no bounty row was dropped and none needed code.

**Phase 4 goal (this session):** corridor view (DEMO step 8), PNG report (completes step 7), responsive audit at 360 px, share metadata, web hygiene sweep, `SECURITY.md`, `DELIVERY.md`.

## Status

Phase 4 was done by reading and editing files only. Nothing was compiled, tested or run. `npm run build`, `npm test`, `npm run proof`, the browser walk at 360, 768 and 1280 px, the PNG download on desktop and phone, and Lighthouse are unverified until the runner and a human report back. No dependency was added, so `npm install` changes nothing.

**This is a plain web app.** No database, no store, no contracts, no wallet, no chain. `.farm-live.json` is unchanged: `{ "requiredEnv": [], "optionalEnv": [] }`.

### Acceptance gate, checked by reading files

- [x] Corridor view: `components/corridor-view.tsx:1` is `"use client"`; imported at `components/poster-lab.tsx:6` and rendered when `view === "corridor"`. Empty (no poster or zero blocks) renders `LabEmptyState` with "Pick an example poster or drop your own file, then the corridor shows it on the wall." (`CORRIDOR_EMPTY_MESSAGE`). Loading and error for the route are `app/loading.tsx` (`LabSkeleton`) and `app/error.tsx` (`LabErrorState`); the corridor itself does no async work. DEMO.md row 8 names `app/page.tsx` and the expected result.
- [x] Toggle: "Flat" / "Corridor" buttons in the stage bar of `components/poster-lab.tsx` (role group "Stage"). `view` is validated by `LabViewSchema` in `lib/schemas.ts` and parsed in `app/page.tsx` through `LabParamsSchema`. No `useSearchParams` anywhere (Grep: zero hits). No new route file.
- [x] Apparent scale and outlines come from existing data: height share is `apparentHeightShare(size, distanceM)` (`lib/legibility.ts`, visual angle 2 atan(h / 2d) over a 30 degree view); outlines and the caption use the lab's `scores` (from `maxReadableDistanceM` and `verdictAt`). Motion: `useSpring` on the height only, `immediate` under reduced motion; the stage swap fades with the existing `telora-enter` class.
- [x] PNG report: `renderReportPng` exported from `lib/report.ts`, imported by `components/poster-lab.tsx` (`ReportDownload`). Canvas is created inside the function (`newCanvas`), colors from `getComputedStyle` on the `--t-*` variables, object URL revoked 4 s after the click. No `fs` (Grep `from "fs"|from "node:fs"` over `app/`, `components/`, `lib/`: zero hits). Disabled with a one-line reason when there is no poster or no text lines; failures map to a `CoreErrorCode` and show a report-specific hint (`REPORT_HINT`).
- [x] Header: one brand mark, one link, one action (`components/site-header.tsx`). Below `sm` the link reads "About" and the share button "Share"; mark link is `shrink-0`, nav `min-w-0`, gaps reduced. Estimated width at 360 px: about 300 px of content in 328 px.
- [x] Touch targets: `components/ui/button.tsx` sizes are `h-11` (default), `min-h-11` (sm), `h-11 w-11` (icon), `h-12` (lg). Explicit `min-h-11` on the stage toggle, verdict toggle, size and profile buttons, slider, report download, "Open the corrected poster", share button and header link. Upload input is `h-11` (`components/ui/input.tsx`).
- [x] Metadata: `app/layout.tsx` default title "Telora: know before you print", template `"%s | Telora"`, description 130 characters, `openGraph` (title, description, siteName, type website, url), `twitter.card: "summary_large_image"`, `metadataBase` https. `/` no longer sets its own title, so it shows the default. `app/opengraph-image.tsx` is 1200x630 and now carries "Know before you print."
- [x] Hygiene greps over `app/`, `components/`, `lib/`: no `console.log` (only `console.info` core-path lines in `lib/ocr.ts` and `lib/pdf.ts`, which carry ids, counts and durations); no `target=`; no `http://` (only the SVG namespace in `app/icon.svg`, untouched); no `<form>`; no key-like strings (`sk-`, `PRIVATE_KEY`, 64-hex, long base64: zero hits). Env reads: `ADAPTER_MODE` and `NEXT_PUBLIC_BRAND_FILES`, both in `.env.example`.
- [x] Wallet grep (`eth_requestAccounts|window.ethereum|wagmi|connect\(|eth_sign|personal_sign`): the only hits are `ro.disconnect()` on ResizeObservers in `components/poster-deck.tsx:65` and `components/simulated-poster.tsx:62`, which are not wallet code. The wallet rules verify vacuously; the Blockaid warning is not expected.
- [x] Sameness tripwire over `app/`, `components/`, `lib/`: zero hits for the dead hexes, `fade-up`, `float-y`, `glow-pulse`, `caret-blink`, `pulse-dot`, `backdrop-blur`, `--delay`, `--d:`. The only `@keyframes` is `telora-fade` (`app/globals.css:150`). Hex literals only in `app/globals.css` and `lib/og-colors.ts`.
- [x] Writing rules: zero hits for em dash, en dash, spaced double hyphen and the banned words in `app/`, `components/`, `lib/`. The docs written this phase follow the same rules.

## Decisions

- **Contract front skipped: no contracts/ directory, plain web app.**
- **Wallet front:** nothing to fix; `SECURITY.md` says none for addresses, permissions and approvals. No footer wallet section.
- **Corridor scale:** a fixed 30 degree vertical view. The poster's share of it is its visual angle, clamped between 2% and 66% of the stage so it never leaves the back wall. Apparent size is therefore close to proportional to size / distance, using the same geometry as the verdicts.
- **Corridor chips:** `SimulatedPoster` got a `compact` prop that hides the "Label: N m max" chips (they do not fit on a small poster). The legend under the corridor lists each line with its distance and verdict instead.
- **Corridor motion:** the spring animates the poster's `height`, not a transform, so the M5 rule (opacity only for entrances, no transform animation) holds. The perspective is static `clip-path` panels and SVG lines in token colors (DEEP back wall, SURFACE side walls and floor, GROUND ceiling, LINE edges and floor line).
- **Report hints:** the shared `HINTS` in `lib/errors.ts` talk about OCR, so the report keeps its own sentence per `CoreErrorCode` in `components/poster-lab.tsx`. No new code was added to `lib/errors.ts`.
- **Report contents:** the poster is redrawn from its blocks (seed) or from the upload's object URL, blurred with `blurSigmaPx` for the drawn height through `ctx.filter`, then numbered verdict outlines and one row per line, weakest first. The deuteranopia filter is not drawn; the footer says so.
- **Button sizes:** raising every Button size to 44 px was simpler and safer than tagging each call site. The rail cards already override with `h-auto`.
- **Card grids** on `/` and `/about` collapse to one column below `md` (were `sm`).
- **Page body** has `overflow-x-clip` (not `hidden`, which would break the sticky header) as a guard against stray sideways scroll.
- **`/` title:** removed the page-level "Poster distance lab" title so the home page shows "Telora: know before you print".
- **Tesseract CDN:** documented, not changed. Self-hosting the language data would need copying files into `public/` and passing paths; it was out of scope.
- **Proof script untouched:** no new measurable fact that `npm run proof` could compute without a browser.

## Responsive audit (by reading classes; smallest route first)

| Route | Wide element | Before | After |
| --- | --- | --- | --- |
| `app/not-found.tsx` | centred column `max-w-xl` | fits | unchanged, renders inside `app/layout.tsx` so the header stays |
| `app/error.tsx` | `LabErrorState` `max-w-xl` card | fits; buttons 40 px | buttons 44 px through `button.tsx`; renders inside the layout, header stays |
| `app/about/page.tsx` | NC State table `min-w-[32rem]` | already in `overflow-x-auto` | unchanged |
| `app/about/page.tsx` | "What runs where" cards | 2 columns from `sm` | 2 columns from `md` |
| header (all routes) | mark + "How it works" + "Share this view" | about 386 px at 360 | short labels below `sm`, about 300 px |
| `/` claim band | h1, line, CTA | CTA fixed width | CTA `w-full` below `sm` |
| `/` rail (`poster-deck.tsx`) | 232 px cards | clipped inside `overflow-hidden` viewport | unchanged (allowed); arrows now 44 px |
| `/` poster stage (`poster-lab.tsx`) | `h-[min(66vh,41rem)] min-h-[27.5rem]`, `p-6` | 440 px min height, 278 px wide content at 360 | `min-h-[22rem]` and `p-4` below `sm`, `w-full max-w-full`; grid columns `min-w-0` |
| `/` stage bar | status line + verdict toggle | one button | wraps; adds Flat/Corridor group, all 44 px |
| `/` corridor (`corridor-view.tsx`) | stage `h-[min(60vh,34rem)]` | new | `w-full max-w-full`, legend chips wrap and truncate |
| `/` "Block by block" | `ol` rows with truncate | already a card list | unchanged; download button `w-full` below `sm` |
| `/` upload card | file input `w-full h-11` | fits | unchanged |
| `/` story sections | 3 cards | 3 columns from `sm` | 3 columns from `md` |

Found, not fixed:

- **Low:** a landscape upload on a phone can be squeezed sideways in the flat stage, because the stage sets the height and `max-w-full` clamps the width. Shortest fix: in `SimulatedPoster`, when `aspect > 1`, size by width (`w-full h-auto`) instead of height.
- **Low:** at 360 px the rail shows one card and part of the next, clipped; the arrows and throw still work.
- **Low:** the corridor clamps the poster at 66% of the stage, so very close distances on A0 look the same size. Shortest fix: let the wall grow or show "closer than the wall can show".

## Failed attempts

None in this session. No cut from the cut protocol was needed (not verified by running).

## Files changed

Slice 1 (corridor): `components/corridor-view.tsx` (new), `components/poster-lab.tsx`, `components/simulated-poster.tsx` (`compact`), `components/lab-states.tsx` (`message` prop), `lib/legibility.ts` (`apparentHeightShare`, `CORRIDOR_FOV_DEG`), `lib/schemas.ts` (`LabViewSchema`, `view`), `app/page.tsx` (`view` into `initial`), `DEMO.md`.
Slice 2 (PNG report): `lib/report.ts` (new), `components/poster-lab.tsx` (`ReportDownload`), `DEMO.md`.
Slice 3 (responsive): `components/ui/button.tsx`, `components/site-header.tsx`, `components/header-link.tsx`, `components/share-view-button.tsx`, `components/poster-lab.tsx`, `components/block-report.tsx`, `app/layout.tsx` (`overflow-x-clip`), `app/page.tsx`, `app/about/page.tsx`.
Slice 4 (meta): `app/layout.tsx`, `app/opengraph-image.tsx`, `app/page.tsx`, `components/lab-states.tsx`, `components/poster-deck.tsx`, `components/block-report.tsx` (empty-state copy), `README.md`.
Slice 5 (security, delivery): `lib/config.ts` (`OCR_ASSET_HOST`), `app/about/page.tsx`, `SECURITY.md` (new), `DELIVERY.md` (new), `README.md`.
Slice 6: `HANDOFF.md`, `.farm-commits.json`.

## Commands run

None, the agent cannot run commands.

## File map

| File | What it does |
| --- | --- |
| `app/page.tsx` | `/`: claim band + `PosterLab` fed by `getLabData()`, params (including `view`) through `LabParamsSchema` |
| `app/loading.tsx`, `app/error.tsx`, `app/about/loading.tsx` | Triad wrappers over `components/lab-states.tsx` |
| `app/api/posters/route.ts`, `app/api/profiles/route.ts` | Read-only JSON, optional `?id=` (zod), codes from `lib/errors.ts` |
| `components/lab-states.tsx` | `LabSkeleton`, `LabErrorState`, `LabEmptyState` (optional `message`) |
| `components/poster-lab.tsx` | The tool: state, URL sync, Flat/Corridor toggle, controls, report, `ReportDownload`, upload card |
| `components/corridor-view.tsx` | DEMO step 8: poster on a hallway wall, spring-sized |
| `components/poster-deck.tsx` | Throwable rail (signature 1), hides `fixOf` posters |
| `components/block-report.tsx` | Per-block distance, recipe, OCR line, open corrected / back to original |
| `components/upload-scan.tsx` | Upload card: zod check, `scanInFlight` guard, idle warm-up, 8-step progress, PDF accepted |
| `lib/report.ts` | `renderReportPng()`: canvas PNG report and download |
| `lib/legibility.ts` | Distance model, blur, `apparentHeightShare` |
| `lib/adapter/index.ts` | `getAdapter()`, `getLabData()` fallback chain |
| `lib/pdf.ts`, `lib/ocr.ts` | PDF first page, OCR scan and 8-distance confirmation |
| `lib/data/seed.ts` | 5 posters (24 blocks), 4 profiles |
| `SECURITY.md`, `DELIVERY.md` | No chain, no wallet, what leaves the browser; per-track delivery and the human checklist |

## Open questions

- **Prize wording:** the spec asks the README to quote each track's `prizeVerbatim` byte for byte, but no prize text exists anywhere in this repository. The README lists the four rows with their facts and says the wording is on the Devpost page. Shortest fix: paste the four lines from the Devpost prize list into the README "Prize tracks" table.
- **Unverified until build:** `ctx.roundRect` and `ctx.filter` type checks in `lib/report.ts` (both are in the TypeScript 5 DOM lib; `roundRect` has a `rect` fallback at runtime); `stroke-border` utility on the corridor SVG (Tailwind 4 generates `stroke-*` from `--color-border`).
- **Unverified until run:** the corridor view on a real phone; the PNG download in Safari (object URL revoked after 4 s; iOS Safari may open the image in a new tab instead of saving it); canvas text in the report uses the loaded Red Hat fonts after `document.fonts.ready`.
- **Carried over:** pdf.js 5 types and worker emission on Vercel, older Safari polyfills, scan time on a large poster, OCR versus model agreement in the real world, `tests/corrected.test.ts` asserts 20/20 only.
- Confirm student eligibility and the Devpost video limit (in `DELIVERY.md`).

## Next best step

Phase 5 frontend pass: signature 2 (spring gauge on the lost-line count, overshoot and settle when the value changes) and signature 3 (pointer tilt on the poster or the primary control), both with `@react-spring/web` and `@use-gesture/react` in `"use client"` components, honoring reduced motion. Then fix the low items in the responsive audit.

## Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, Vercel.
- `IDENTITY.md` is law for color, font, route, layout and animation. Tokens only from `app/globals.css`. Radius 0.75rem minimum. Motion opacity only, linear, 280 ms, keyframes prefixed `telora-`. Header: one link, one action.
- Kit packages and Tesseract.js only in `"use client"` components or browser-only functions; pdfjs-dist only through the dynamic import in `lib/pdf.ts`.
- Copy rules and banned words: see `CLAUDE.md`. The README and UI never describe a feature that does not run.
