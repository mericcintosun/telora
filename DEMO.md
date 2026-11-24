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
| 6 | The corrected poster is all green at 4 m | `app/page.tsx` | `components/poster-deck.tsx` (needs a "corrected" seed variant in `lib/data/seed.ts`) | not built yet (Phase 4) |
| 7 | 8-distance OCR confirmation, PDF upload, corridor view, PNG report | `app/page.tsx` (`app/about/page.tsx` explains the model) | `components/upload-scan.tsx`, `lib/ocr.ts` | not built yet (8-distance OCR: Phase 2; PDF upload: Phase 3; corridor view and PNG report: Phase 4) |

Notes per step:

1. The page reads posters and profiles through `getAdapter()` (`lib/adapter`), so the seed is the only data source today.
2. Outlines use OK, WARN and BAD tokens. Every chip reads "Label: N m max".
3. The order of lines turning red is driven by `maxReadableDistanceM` in `lib/legibility.ts`. The narration says the date lasts to 2.4 m; check it live on the chip before recording.
4. 20/40 doubles the threshold, so every distance roughly halves. Deuteranopia is clearest on "Microplastics in Campus Tap Water" (the RESULTS banner drops to 60 cm).
5. The recipe line in the report reads "To read at 4.0 m, enlarge it 1.7x, from N pt to M pt."
6. Phase numbers for steps 6 and 7 are plans, not promises; HANDOFF.md holds the current order.

**Closing line:** Know before you print.

The builder records the 90-second video himself on the live URL.
