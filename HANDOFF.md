# HANDOFF: Telora

You are picking up a working Next.js 15 app after the Phase 5 frontend pass. Read this file, then `IDENTITY.md`, `CLAUDE.md` and `DEMO.md`. Keep `npm run build` passing after every change.

## Goal

**Product:** Telora. Upload your poster and say where it will hang: Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

**Hackathon:** IdeaLab Hacks (Devpost, online), 4 to 30 November 2026. Deadline 30 November 2026, 23:45 EST. Four automatic, non-cash rows (1st, 2nd, 3rd Place, Runner-Up Recognition); no sponsor bounty row.

**Phase 5 goal:** finish the D19 surface (white panels, mesh hero, one gradient word), make `/` and `/about` read as a finished product, add signature 2 (lines gauge) and signature 3 (poster tilt), place five scene slots, fix the three low responsive items, and write the submission package (README, SUBMISSION.md, screenshot shot list, LICENSE).

## Status

No live deployment yet, diagnosed from files only. Everything in this phase was done by reading and editing files. Nothing was compiled, tested or run: `npm install`, `npm run build`, `npm test`, `npm run proof`, the browser walk at 360, 768 and 1280 px, and Lighthouse are unverified until the runner and a human report back. No dependency was added; `@react-spring/web ^10.1.2` and `@use-gesture/react ^10.3.1` were already in `package.json`.

### Acceptance gate, checked by reading files

- [x] `.farm-delta.md`: 20 Diagnosis items, 19 Changes rows (13 `A`, 6 `B`), 2 Kept rows. One combined Grep of all 19 proof-gone strings over `app/` and `components/` returns 0; every proof-new returns at least 1 (counts and lines recorded there).
- [x] Sameness tripwire over `app/` and `components/` (dead hexes, teal and amber hexes, `fade-up`, `float-y`, `glow-pulse`, `caret-blink`, `pulse-dot`, standalone `float`): 0 hits.
- [x] Banned props: `role="tablist"` 0, `animate-pulse` 0, `--delay` and `--d:` 0, `backdrop-blur` 0, `font-mono` 0, `mask-image` 0, `CopyChip` and `Reveal` 0. `rounded-xl` remains only on skeleton bars, buttons, the input, the header and footer links and two status strips inside the upload card, none of them a card; `Card` itself is `telora-panel` (`components/ui/card.tsx:6`).
- [x] Fonts: `app/layout.tsx:2` imports `Red_Hat_Display, Red_Hat_Text` from `next/font/google`; `h1, h2, h3` use the display stack (`app/globals.css`). Hexes in `app/globals.css` are exactly the 11 key-block values (lines 7 to 17); the white panel is `color-mix(in oklab, var(--t-ground) 30%, white)` and the violet mesh stop is `color-mix(in oklab, var(--t-accent) 55%, var(--t-ink))`.
- [x] Header: `components/site-header.tsx:12-18`, one `<BrandMark size={30} />` plus the text "Telora" inside the home link, one link (`<HeaderLink href="/about">About</HeaderLink>`, `aria-current` kept in `components/header-link.tsx`), one action (`ShareViewButton`). Solid `bg-background`, `border-b border-border`, `sticky`.
- [x] IDENTITY.md key block unchanged; one dated line added under Amendments.
- [x] Routes: `/` is `app/page.tsx`, `/about` is `app/about/page.tsx`; reachable from the brand link, the header link and the new footer. No route added or removed.
- [x] Grep for `<button` and `<select` outside `components/ui/`: 0. `<input` only in `components/ui/input.tsx` and `components/ui/slider.tsx`.
- [x] Five `<SceneSlot n={N}` placements with literal n, alt, width and height (map below). Each has `public/illustrations/scene-N.svg`.
- [x] One `@keyframes telora-fade` (`app/globals.css`) plus the `prefers-reduced-motion: reduce` block. The entrance is pure CSS (`components/entrance.tsx`), so server HTML holds all content; nothing is set to opacity 0 or moved off screen by script.
- [x] Kit imports only in `"use client"` files: `components/poster-deck.tsx`, `components/corridor-view.tsx`, `components/lines-gauge.tsx`, `components/tilt-frame.tsx`.
- [x] README.md and SUBMISSION.md: prize table byte-identical to the spec, no video mention, no `<PASTE`, `TBD`, `ADD_VIDEO` or "placeholder until", no em or en dash, no banned word (Grep over README.md, SUBMISSION.md, docs/, app/, components/: 0 hits).
- [x] `.gitignore` covers `.env*` with `!.env.example`. Seed untouched, so `/` stays non-empty. SECURITY.md, `OCR_ASSET_HOST` and the no-wallet state untouched.

### Scene slots (all are SVG fallbacks: `public/brand/` does not exist)

| Slot | Shape | Route | Caller |
| --- | --- | --- | --- |
| scene-1 | 960x640 | `/` upload card, idle | `components/upload-scan.tsx` |
| scene-2 | 960x640 | `/about`, blur model | `app/about/page.tsx` |
| scene-3 | 960x640 | `/about`, verdicts and OCR | `app/about/page.tsx` |
| scene-4 | 1200x560, wide | `/` report section | `app/page.tsx` |
| scene-5 | 720x640, near square | `/` closing section | `app/page.tsx` |

### Interactions

| Signature | File | Drag alternative | Reduced motion | Numbers from |
| --- | --- | --- | --- | --- |
| 1 throwable rail (kept) | `components/poster-deck.tsx` | previous and next buttons, plain click | `immediate` | seed posters, `maxReadableDistanceM` |
| 2 lines gauge | `components/lines-gauge.tsx` | no drag | `immediate`, figure is plain text with `aria-live` | `scores` in `components/poster-lab.tsx` (`maxReadableDistanceM`, `verdictAt`) |
| 3 poster tilt | `components/tilt-frame.tsx` | no drag; cosmetic hover, `touch-action: manipulation` | off, also off on coarse pointers | none shown |

## Decisions

- **White panels without a new hex:** `--card` is a white tint of GROUND through `color-mix`, and `.telora-panel` (in `@layer components`, so utilities still override) gives white, `1.25rem` radius and the soft shadow. `Card` uses it and lost its border.
- **Mesh hero, not mesh body:** the body is plain GROUND; `.telora-mesh` wraps the claim band and the lab on `/` only.
- **Claim band:** h1 "See which poster line stops reading across the hallway" with the one gradient word on "hallway", one line of support, one CTA ("Check your own poster" to `#upload`, DEMO step 7's card). The earlier gradient word on a lower h2 is gone, so there is exactly one.
- **Gauge swing rule:** the needle springs to every new count; when the poster, size or profile changes and the count stays the same, it gets a short kick. A distance step that does not change the count does not swing, so dragging the slider does not jitter.
- **Tilt placement:** on the flat stage only, outside `SimulatedPoster`. The blur radius comes from the frame's `contentRect` height, which a CSS transform does not change, and outlines sit inside the frame, so measurement is untouched. Not in the corridor view.
- **One reduced-motion hook:** `components/use-reduced-motion.ts` replaces the copies in the rail and the corridor, and adds `useCoarsePointer`.
- **Responsive low items fixed:** (1) a landscape poster sizes by width, capped by the stage height through `cqh` units on a `[container-type:size]` stage (`components/simulated-poster.tsx`); (2) rail cards shrink to the rail width (180 to 232 px), so a 360 px screen shows one whole card (`components/poster-deck.tsx`); (3) the corridor says "closer than the wall can show" when the 66% clamp applies (`components/corridor-view.tsx`).
- **Stage height:** flat stage `min(58vh, 38rem)` (was 66vh); corridor stage 56vh.
- **Text walls:** each section after the lab and each `/about` section is one sentence plus a scene; the steps, the NC State table and "What runs where" moved into one-line `<details>`. Numbers in the home steps now come from `PAPER_MM` and `BASE_THRESHOLD_ARCMIN` (the arcminute figure is computed, about 510).
- **Footer:** new `components/site-footer.tsx`, links to the repo, the Devpost page and About, plus one sentence.
- **Illustrations:** `CLAUDE.md` says not to touch `public/illustrations/`; this phase's spec asked for new scene-4 and scene-5 there, so two files were added and scene-1 to scene-3 were left as they were.
- **LICENSE:** none existed, so an MIT `LICENSE` was added with "mericcintosun" (the repo owner's GitHub handle) as holder.
- **Proof script:** unchanged. No new command-derived number was added; the README keeps its four PROOF blocks.

## Failed attempts

None in this session. No cut from the cut protocol was needed (not verified by running).

## Files changed

- Slice 1: `app/globals.css`, `app/layout.tsx`, `components/ui/card.tsx`, `components/site-header.tsx`, `components/site-footer.tsx` (new).
- Slice 2: `app/page.tsx`, `app/about/page.tsx`, `app/not-found.tsx`, `components/lab-states.tsx`, `components/block-report.tsx`, `components/simulated-poster.tsx`, `components/poster-deck.tsx`, `components/corridor-view.tsx`, `components/upload-scan.tsx`, `components/entrance.tsx` (new), `components/use-reduced-motion.ts` (new).
- Slice 3: `public/illustrations/scene-4.svg`, `public/illustrations/scene-5.svg` (new).
- Slice 4: `components/lines-gauge.tsx` (new), `components/tilt-frame.tsx` (new), `components/poster-lab.tsx`.
- Slice 5: `README.md`, `SUBMISSION.md` (new), `docs/SCREENSHOTS.md` (new), `LICENSE` (new).
- Slice 6: `HANDOFF.md`, `IDENTITY.md` (Amendments line).

## Commands run

None. The agent cannot run commands.

## Open questions

- **Unverified until build:** react-spring 10 types for `animated.path` with an interpolated `strokeDashoffset`, `to([rx, ry], ...)` in `components/tilt-frame.tsx`, and `transformBox: "view-box"` in the gauge style. Tailwind 4 arbitrary property `[container-type:size]` and the `stroke-ok`, `stroke-bad`, `stroke-ink`, `fill-ink` utilities.
- **Unverified until run:** the needle overshoot feel (tension 320, friction 9), the tilt feel (4 degrees), the `cqh` landscape sizing in Safari, the global `p { max-width: 70ch }` in the base layer (check the stage bar and the corridor caption).
- **Claim band length:** two lines at 1280 px by estimate; on a 360 px phone the h1 wraps to three or four lines. Shortest fix if a judge flags it: hide the support line below `sm`.
- **AI policy wording:** README and SUBMISSION.md summarise the policy (allowed, not required, respect licences, state use); no verbatim policy text was in the repository to quote. Compare with the Devpost rules page.
- **DELIVERY.md** still carries the Phase 4 human checklist, which mentions the video link field. It is a human checklist, left as it was.
- Carried over: pdf.js 5 worker emission on Vercel, PNG download on iOS Safari, OCR versus model agreement in real hallways.

## Next best step

Phase 6: run the build, fix any type error from the two new kit components in one repair round, publish, then capture the first real screenshots from the live URL with `docs/SCREENSHOTS.md` and act on judge findings. Phase 7 is the freeze and the `v0.1-hackathon` tag.

## Manual submit checklist

- [ ] No live deployment yet, diagnosed from files only: open the published URL cold in a private window, then at phone width (360 px), and walk DEMO steps 1 to 8.
- [ ] Confirm student eligibility: students only, of legal age in their country of residence.
- [ ] Add team member names on Devpost.
- [ ] Check the Devpost form for a video limit and for a repo or licence requirement, then record and paste your own video link (the farm does not write it).
- [ ] Confirm the commit history dates fall between 4 and 30 November 2026, as the "Built during the event vs before" section says (the agent could not run git to check).
- [ ] Confirm the LICENSE holder name ("mericcintosun") is how you want it.
- [ ] All five scene slots are SVG fallbacks (scene-1 to scene-5). Drop `public/brand/scene-N.png` files if you want raster art instead.
- [ ] Paste SUBMISSION.md field by field; upload gallery shots from `docs/SCREENSHOTS.md`.
- [ ] Submit before 30 November 2026, 23:45 EST.

## File map

| File | What it does |
| --- | --- |
| `app/page.tsx` | `/`: mesh hero with claim band and `PosterLab` fed by `getLabData()`, then two one-sentence sections with scene-4 and scene-5 |
| `app/about/page.tsx` | `/about`: two sections (blur model, OCR) with scene-2 and scene-3, details for steps, table and runtime |
| `components/poster-lab.tsx` | The tool: state, URL sync, gauge, Flat/Corridor, tilt-wrapped poster, controls, report, upload |
| `components/lines-gauge.tsx` | Signature 2: spring needle on "N of M lines readable" |
| `components/tilt-frame.tsx` | Signature 3: pointer tilt on the poster frame |
| `components/poster-deck.tsx` | Signature 1: throwable rail |
| `components/entrance.tsx` | M5 fade wrapper |
| `components/use-reduced-motion.ts` | Reduced-motion and coarse-pointer hooks |
| `components/site-footer.tsx` | Footer links |
| `lib/legibility.ts` | Distance model, blur, apparent size (unchanged) |
| `lib/data/seed.ts` | 5 posters, 4 profiles (unchanged) |

## Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, Vercel.
- `IDENTITY.md` is law for color, font, route, layout and animation. Tokens only in `app/globals.css`. Radius 0.75rem minimum. Motion opacity only for entrances, linear, 280 ms, keyframes prefixed `telora-`. Header: one link, one action.
- Kit packages and Tesseract.js only in `"use client"` components or browser-only functions; pdfjs-dist only through the dynamic import in `lib/pdf.ts`.
- Copy rules and banned words: see `CLAUDE.md`.
