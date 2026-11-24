# HANDOFF: Telora

You are picking up a working Next.js 15 scaffold. Read this file, then `IDENTITY.md`, then start on the Mission list. Keep `npm run build` passing after every change.

## 1. Context

**Product:** Telora. Upload your poster and say where it will hang: Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

**Plain pitch:** You made a poster for a club night or a science fair and you want to know, before printing, whether someone walking down the corridor can read the date. You load it into Telora, pick the paper size and how far away people will stand. The screen shows the poster as it really looks from there, and every line that stops reading turns red. Each line gets a note like "readable up to 2.4 m" and how much bigger it needs to be for the target distance. You fix it before printing, and the print money is not wasted.

**Hackathon:** IdeaLab Hacks (Devpost, online), themes Beginner Friendly, Design, Open Ended.
**Deadline:** 30 November 2026, 23:45 EST (1 December 04:45 UTC). Judging 1 to 5 December.
**Target track:** 1st Place. The same single submission also competes for 2nd, 3rd and the 3 Runner-Up slots automatically. All prizes are non-cash recognition.
**Judging:** four criteria at 25% each: creativity and originality; execution and functionality (ties are broken on execution, then creativity); usefulness and experience (usability, design, accessibility); clarity and learning (explain the idea, show the work, credit tools, share what was learned).

**Verified submission requirements:**
- Submit through Devpost.
- Clearly separate pre-existing work from work done during the event (README section "Built during IdeaLab Hacks" exists, keep it accurate).
- Credit every library, open-source component, dataset and AI tool used (README "Credits" and "AI use").
- The project must be accessible to judges and its capabilities described accurately. Never claim the 8-distance OCR re-read works until it does.
- Explain the idea, the work, and what was learned (README "What we learned").
- Eligibility: students only, above the age of majority, teams of 1 to 5. Confirm student status before submitting.

## 2. Current state

Identity: see IDENTITY.md (direction D19, structure S1, archetype L2, kit K4)

### File map

| File | What it does |
| --- | --- |
| `app/layout.tsx` | Loads Red Hat Display and Red Hat Text via next/font/google, metadata, renders `SiteHeader` |
| `app/globals.css` | All color tokens (IDENTITY.md hexes only), aurora mesh background, radius scale, `telora-fade` keyframe and reduced-motion block, range slider styling |
| `app/page.tsx` | `/`: claim band + `PosterLab` (the tool) + two copy sections with scene slots 2 and 3. Reads `?poster= &size= &d= &profile=` |
| `app/about/page.tsx` | `/about`: the model in four steps, calibration table, what runs where |
| `app/opengraph-image.tsx` | 1200x630 OG image |
| `app/icon.svg`, `public/logo.svg` | The brand glyph: a magenta poster whose text lines get smaller and fainter, with a peach viewer dot |
| `public/illustrations/scene-1..3.svg` | Fallback illustrations for the three `SceneSlot`s |
| `components/site-header.tsx` | Sticky solid header: mark, one link (`/about`), one action (`ShareViewButton`) |
| `components/share-view-button.tsx` | Copies the current URL (all lab state lives in it) |
| `components/poster-lab.tsx` | The tool: state, URL sync, controls (size, distance, vision profile), layout |
| `components/poster-deck.tsx` | K4 signature 1: throwable rail of seed posters |
| `components/simulated-poster.tsx` | Live JSX poster blurred to the eye's limit + unblurred verdict outlines; Machado deutan SVG filter |
| `components/block-report.tsx` | Per-block max distance, verdict badge, fix recipe |
| `components/upload-scan.tsx` | Upload card with idle / scanning (determinate progress) / done / error states |
| `components/ui/*` | shadcn primitives restyled for D19 (round, soft shadow); `slider.tsx` is new, `button.tsx` has a `choice` variant (aria-pressed), `badge.tsx` has `legible/borderline/lost` |
| `lib/data.ts` | Types + 4 seed posters (19 text blocks) + 4 vision profiles + tone to CSS variable map |
| `lib/legibility.ts` | The distance model: cap height, threshold, max distance, verdict, fix recipe, blur sigma |
| `lib/ocr.ts` | `scanPosterImage()`: real Tesseract.js scan + canvas contrast measurement |

### Routes

- `/` -> `app/page.tsx` (shareable state in search params: `?poster=robot-sumo-night&size=A2&d=4.0&profile=2020`)
- `/about` -> `app/about/page.tsx` (linked from the header "How it works")

### Real vs mocked

- **Real:** the distance model, blur preview, deuteranopia color matrix, low-contrast filter, verdicts, fix recipes, URL state, upload scan with Tesseract.js (`scanPosterImage` in `lib/ocr.ts`), contrast measured from pixels.
- **Seeded, not measured:** the `contrast` and `deutanContrast` values on the 19 seed blocks in `lib/data.ts` are hand-computed from the palette. Uploaded posters get them measured.
- **Not built yet:** the 8-distance OCR re-read (constants `SCAN_DISTANCES_M` in `lib/legibility.ts` are ready), PDF upload, corridor view, PNG report.

### Interaction kit (K4 spring)

- **Shipped:** signature 1, the throwable poster rail in `components/poster-deck.tsx`. `useDrag` movement and velocity project where the rail would coast, the nearest poster loads into the lab (size, distance and verdicts all change), a `useSpring` settles the rail. Prev/next buttons and clicks are the keyboard alternative, `touch-action: pan-y` is set, reduced motion makes the settle immediate.
- **To build:** signature 2, a spring gauge on the "Viewing distance" readout or the "N of M blocks lost" count that overshoots and settles whenever the value changes.
- **To build:** signature 3, a pointer-following tilt on the simulated poster frame (the hero artifact), off under reduced motion.

### One-mark proof (header home link, `components/site-header.tsx`)

```tsx
<Link href="/" className="flex items-center gap-2.5 rounded-xl font-display text-xl font-black tracking-tight">
  <BrandMark size={30} />
  Telora
</Link>
```

## 3. Mission (in order)

1. **Multi-distance OCR confirmation (about 4 h).** In `lib/ocr.ts`, add `confirmAtDistances(canvas, blocks, size, profile)`: for each of `SCAN_DISTANCES_M`, blur an OffscreenCanvas copy with `ctx.filter = blur(sigma)` (sigma from `blurSigmaPx`, using the canvas height), re-run Tesseract on it (two workers in parallel), and record the last distance where at least 60% of each line's words still match. Store it as `ocrMaxDistanceM` on the block. Done looks like: after an upload, the report shows "OCR: 2.0 m, model: 2.4 m" per line and a progress bar fills through 8 steps. Cache results per file hash in memory.
2. **PDF upload and calibration check (about 3 h).** Add `pdfjs-dist`, render page 1 to canvas, feed it into the same scan. Done: a PDF poster scans exactly like a PNG. Re-run the about page calibration rows after any threshold change.
3. **Wow moment polish (about 2 h, schedule on day 2 morning).** The demo is: Robot Sumo Night, A2, slider dragged from 1 m to 6 m, lines turn red in order (QR caption at 1.1 m, pitch at 1.5 m, venue at 1.7 m, date at 2.4 m), headline survives to 9 m. Make the slider drag smooth on a mid-range laptop (memoize poster blocks, avoid re-rendering the report while dragging if it stutters). Add the corridor view toggle: the same poster small on a wall in perspective.
4. **Vision profile demo (about 1.5 h).** Switching to 20/40 must halve every distance (it does), and deuteranopia must kill the "RESULTS" banner on the Microplastics poster (it does, 60 cm cap). Add signature 2 (spring gauge) on the lost-count so the profile switch has a physical moment.
5. **Fix recipe and PNG report (about 1.5 h).** Download a PNG: the poster at the chosen distance with outlines plus a table of blocks, max distance and fix. Add a "corrected" variant of Robot Sumo Night to the seed (date at 1.7x) so the demo can end with everything green at 4 m.
6. **Signature 3 tilt, mobile layout, README and video (rest).** Fix the poster frame on narrow screens (aspect ratio breaks under `max-w-full`), deploy, record the 90 second video.

## 4. Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn primitives in `components/ui/`, deploy on Vercel. No server routes are needed; keep it that way.
- `IDENTITY.md` is law for every color, font, route, layout and animation. Colors come only from the tokens in `app/globals.css`; never write a hex in a component. Radius is round (0.75rem minimum on cards, panels, controls). Motion is opacity only, linear, 280 ms, keyframes prefixed `telora-`. S1 means no landing page and a header with one link and one action.
- Kit packages live only in `"use client"` components. Every drag needs a button alternative and `touch-action`.
- Copy: English, no em or en dashes, no double hyphens as dashes, none of: seamless, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless. Write like a builder.
- Honesty: the README and UI must never describe a feature that does not run. Update "Built during IdeaLab Hacks" as you go.
- Scope: if something threatens the 30 November deadline, cut scope (corridor view first, then PNG report), never the working core.
- Run `npm run build` after every change and keep it green.

## 5. Definition of done

- Deployed at https://telora.vercel.app and reachable without login.
- README live demo link correct; AI use and credits sections reviewed by the team.
- The 90 second demo runs end to end: club poster on screen, A2 at 4 m, verdicts appear, slider 1 m to 6 m with lines turning red, 20/40 and deuteranopia switch, "enlarge the date 1.7x", corrected poster all green at 4 m.
- Uploading a real poster PNG produces per-line distances in under 20 seconds.
- Wow moment rehearsed at least twice on the deployed URL, cold cache included.
