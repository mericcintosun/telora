# Telora: Devpost submission

Fields in Devpost form order, ready to paste.

## Project name

Telora

## Tagline (60 characters at most; this one is 55)

Know which poster line vanishes, and at how many metres

## Project story

### What it does

Telora is a poster distance lab. Pick an example poster or drop your own (PNG, JPG, WebP or the first page of a PDF), choose the paper size and how far away people will stand, and Telora blurs the poster to what the eye resolves from there. Every line gets a green, amber or red outline, the distance it lasts to ("Event date: 2.4 m max") and a fix ("enlarge it 1.7x", or "change the color pair" when size cannot help). A gauge shows how many lines still read, and swings to the new count as you drag the distance slider. You can switch to 20/40 vision, low contrast or deuteranopia, hang the poster in a corridor view, and download the result as a PNG report.

### How I built it

Next.js 15 with the App Router, React 19, TypeScript and Tailwind CSS 4. The distance model is plain geometry in one file: capital height on the printed sheet, its visual angle at the viewing distance, and an 8 arcminute threshold for 20/20 vision, raised for weaker eyesight and low-contrast pairs. The live preview uses a CSS blur whose radius comes from the same model, and an SVG color matrix (Machado 2009) for deuteranopia. Uploads are read by Tesseract.js in the browser, then re-read blurred to 8 distances as a second opinion on the model. PDFs open through pdf.js. react-spring and use-gesture drive the throwable poster rail, the lines gauge and the poster tilt. Nothing is uploaded to a server.

### What I did during the event versus before

IdeaLab Hacks ran from 4 to 30 November 2026. Before the event there was only a generic Next.js starter. Everything else was built during the event: the model, the example posters, the lab, the OCR confirmation, PDF support, the corridor view, the PNG report, the motion and all copy and illustrations.

### AI tools and libraries used

AI tools are allowed by the event, not required, and their use must be stated, so here it is. Claude Code (Anthropic) wrote much of the code and copy under my direction; product decisions and the final review are mine. Libraries: Next.js, React, Tailwind CSS, tesseract.js (with its English language data from jsDelivr), pdfjs-dist, zod, react-spring, use-gesture, lucide-react, Radix Slot and the Red Hat fonts, each under its own open-source licence. Every example poster is hand-authored in the repository; no external dataset is used. At runtime there is no language model: the only model running is Tesseract.js in your browser.

### Challenges

Making the blur honest: the blur radius has to follow the same threshold as the verdicts, or the picture and the numbers disagree. Tesseract also gives up on blur earlier than a person does, so the OCR result is shown as a second opinion next to the model, never as the answer. Safari has no canvas blur filter, so the re-read falls back to a downscale blur there and says so.

### What I learned

One number from the NC State poster table (20 pt reads to about 7 ft) calibrates the whole model, because it matches an 8 arcminute capital height almost exactly. A Gaussian blur is a simplification of the eye's contrast sensitivity, and lighting and glare are ignored, so the distances work best as a ranking of which line fails first. Contrast matters more than I expected: peach text on a light ground loses about half its reading distance.

### What is next

Draw the deuteranopia filter into the PNG report, size landscape posters better in the corridor view, and test the distances against real readers in a real hallway.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Tesseract.js, pdf.js, zod, react-spring, use-gesture, lucide-react, Radix UI, Vercel, Claude Code

## Try it out

https://telora.vercel.app

## Repository

https://github.com/mericcintosun/telora

## Image gallery

Use the shot list in the repository's screenshot list document; capture each shot from the live URL.

## Tracks

One submission enters all four rows automatically. There is no sponsor bounty row.

| Track | Prize (verbatim) | Slots |
| --- | --- | --- |
| 1st Place | First-place recognition for the highest-scoring eligible project. Non-cash recognition; no monetary prize. | 1 |
| 2nd Place | Second-place recognition for the next highest-scoring eligible project. Non-cash recognition; no monetary prize. | 1 |
| 3rd Place | Third-place recognition for the next highest-scoring eligible project. Non-cash recognition; no monetary prize. | 1 |
| Runner-Up Recognition | Recognition for three additional standout eligible projects. Non-cash recognition; no monetary prize. | 3 |
