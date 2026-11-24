# Telora

Upload your poster and say where it will hang. Telora shows which line of text stops reading from across the hallway, and at exactly how many metres it disappears.

> Live demo: https://telora.vercel.app

## The problem

Club nights, science fair boards, conference posters: they all get designed about 40 cm from a laptop screen, zoomed in. Then they get read from 3 to 5 metres down a corridor.

The help that exists is a static table. NC State and Knight ADRC publish point sizes against viewing distances, and Better Posters suggests printing a small copy and holding it at arm's length. None of them looks at your file. So the most important lines (the date, the room, the text under the QR code) are the first to vanish, and you find out after paying for the print.

## The solution

Pick a poster, a paper size (A3 to A0) and a viewing distance. Telora:

1. Converts every text block's capital height into millimetres on the paper you chose.
2. Works out the visual angle that letter covers at your distance.
3. Compares it with an 8 arcminute threshold for 20/20 vision, raised for weaker eyesight and for low-contrast color pairs.
4. Blurs the live preview to the eye's resolution limit at that distance, and outlines each block in green, amber or red.

Every block gets a line like "Event date: 2.4 m max" and a fix: "enlarge it 1.7x, from 23 pt to 38 pt". When size cannot help (red text on green for someone with deuteranopia), it says to change the color pair instead.

Drag the distance slider from 1 m to 6 m and you watch the poster blur and the lines turn red one by one.

## How it uses its tech

There is no sponsor SDK in this hackathon. The technical core is:

- **Tesseract.js** scans an uploaded PNG, JPG or WebP in a Web Worker and returns every text line with its bounding box. The line height becomes the letter height the model scores.
- **Canvas 2D** measures luminance contrast inside each line box, once as-is and once after the **Machado 2009 deuteranopia matrix**.
- **CSS filters** apply the distance blur, a contrast cut for the low-contrast profile, and an SVG `feColorMatrix` with the same Machado matrix for the deuteranopia preview.
- **react-spring and @use-gesture** drive the poster rail: throw it and the release velocity decides which example loads.

The scan and the model run in the browser. No key, and your poster is never uploaded. The example posters and vision profiles come from a seed module through one adapter (`lib/adapter`), which the pages and two read-only JSON routes (`/api/posters`, `/api/profiles`) share.

## What we learned

- The NC State anchor of 20 pt readable to about 7 ft lines up with an 8 arcmin cap height threshold almost exactly (20 pt capitals are about 4.9 mm, which covers 7.96 arcmin at 2.13 m). That one number calibrates the whole model.
- A Gaussian blur is a simplification of the eye's contrast sensitivity curve. Lighting, glare and viewing angle are ignored. The numbers are most useful as a ranking: if the date lasts 2.4 m and the title 9 m, the date is your problem.
- Contrast matters more than we expected. Peach text on a light background loses about half its reading distance compared with dark ink at the same size.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, shadcn-style primitives
- Tesseract.js 6 (in-browser OCR)
- @react-spring/web 10 and @use-gesture/react 10
- Red Hat Display and Red Hat Text via next/font
- tsx (dev only, runs `npm run seed`)
- Deployed on Vercel with the standard Next build

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

No secrets are needed. `.env.example` lists one optional key, `ADAPTER_MODE` (`fake` by default). `npm run seed` writes the seed to `fixtures/seed-snapshot.json`.

Where things live: types in `lib/types.ts`, the four example posters in `lib/data/seed.ts`, the adapter in `lib/adapter/`, the distance model in `lib/legibility.ts`, the OCR scan in `lib/ocr.ts`.

## Built during IdeaLab Hacks

Before the event: nothing but a generic Next.js starter template (layout, Tailwind setup, empty button/card/badge/input primitives).

During the event: everything in this repository's commit history, starting with the scaffold commits. That covers the distance model, the four seed posters, the live simulated preview, vision profiles, the per-block report and fix recipe, the Tesseract.js upload scan, the throwable poster rail, the adapter and API routes, every illustration and all copy.

## Planned

Not built yet. None of these run today:

- Re-read the blurred poster with OCR at 8 fixed distances (1 to 10 m) and mark the point where the word match drops, as a second signal next to the arcmin estimate.
- PDF upload (first page through pdf.js).
- A corridor view that shows the poster small on a wall in perspective.
- A downloadable PNG report with every block's verdict and fix.
- A corrected version of the club poster that reads all green at 4 m.

## AI use

> Adjust this section to the hackathon's disclosure rules before submitting.

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

## Credits

- Tesseract.js (Apache 2.0), react-spring (MIT), @use-gesture (MIT), lucide-react (ISC), Next.js (MIT), tsx (MIT)
- Machado, Oliveira and Fernandes (2009), "A Physiologically-based Model for Simulation of Color Vision Deficiency"
- NC State "Legible Viewing Distance for Posters and Exhibits" table, used as the calibration anchor
