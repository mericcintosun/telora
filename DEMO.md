# DEMO: Telora in 90 seconds

**Problem:** posters get designed 40 cm from a laptop and read from 3 to 5 metres down a corridor, so the date, the room and the QR caption vanish first and nobody finds out until after the print is paid for.

**Trigger:** a visitor opens `/`. The poster lab is already loaded with an example poster, no click needed.

**Wow moment:** the visitor drags the distance slider from 1 m to 6 m. The poster blurs live, the lines turn red in order, and the date shows "2.4 m max".

**Demo start route:** `/` (`app/page.tsx`). Start from a clean URL, or `/?poster=robot-sumo-night&size=A2&d=4.0&profile=2020`.

## Steps

| # | Step | Route file | Component | Status |
| --- | --- | --- | --- | --- |
| 1 | Club poster loaded: Robot Sumo Night, A2, 4 m | `app/page.tsx` | `components/poster-lab.tsx`, `components/poster-deck.tsx` | works |
| 2 | Verdict outlines on the poster and a distance per line | `app/page.tsx` | `components/simulated-poster.tsx`, `components/block-report.tsx` | works |
| 3 | Slider dragged from 1 m to 6 m: blur grows, lines turn red in order, the date reads "2.4 m max" | `app/page.tsx` | `components/poster-lab.tsx` (Viewing distance slider), `components/simulated-poster.tsx` | works |
| 4 | Vision profile switched to 20/40, then to Deuteranopia | `app/page.tsx` | `components/poster-lab.tsx` (Who is looking), `components/simulated-poster.tsx` | works |
| 5 | Fix recipe: "enlarge it 1.7x" on the event date | `app/page.tsx` | `components/block-report.tsx` | works |
| 6 | The corrected poster is all green at 4 m | `app/page.tsx` | `components/block-report.tsx` ("Open the corrected poster"), seed variant `robot-sumo-night-fixed` in `lib/data/seed.ts` | works |
| 7 | Upload a poster (PNG, JPG, WebP or PDF): the bar steps through 8 distances, then each line reads "OCR: 2.0 m, model: 2.4 m" | `app/page.tsx` (`app/about/page.tsx` explains the model) | `components/upload-scan.tsx`, `components/block-report.tsx`, `lib/ocr.ts`, `lib/pdf.ts` | works, PDF included (first page); corridor view and PNG report not built yet |

Notes per step:

1. The page reads posters and profiles through `getLabData()` (`lib/adapter/index.ts`): the active adapter, then the fake adapter, then the seed constants, so `/` never comes up empty. Bad URL params fall back to defaults silently.
2. Outlines use OK, WARN and BAD tokens. Every chip reads "Label: N m max".
3. The order of lines turning red is driven by `maxReadableDistanceM` in `lib/legibility.ts`. The narration says the date lasts to 2.4 m; check it live on the chip before recording.
4. 20/40 doubles the threshold, so every distance roughly halves. Deuteranopia is clearest on "Microplastics in Campus Tap Water" (the RESULTS banner drops to 60 cm).
5. The recipe line in the report reads "To read at 4.0 m, enlarge it 1.7x, from N pt to M pt."
6. On Robot Sumo Night, click "Open the corrected poster" at the top of the "Block by block" report. The lab loads `robot-sumo-night-fixed` at A2 and 4.0 m and every line is green for 20/20. The date there is 2.1x larger, not 1.7x: 1.7x reaches exactly 4.0 m, which shows amber, and green needs 15% to spare. "Back to the original" returns. The corrected poster is not on the rail.
7. The 8-distance OCR runs in the browser on the uploaded file. A PDF opens with pdf.js (first page only) and then takes the same path. The engine starts loading while the page is idle, so the first upload usually skips the 4 MB wait; on a slow connection, still do one upload before recording. In the default fake mode the example posters show "Sample OCR" lines, which are hand-written samples; say so if you show them.

**Reset before a take:** `npm run demo:reset`, then open the URL it prints in a private window. There is no server state to clear; a reload resets the tab.

**Closing line:** Know before you print.

The builder records the 90-second video himself on the live URL.
