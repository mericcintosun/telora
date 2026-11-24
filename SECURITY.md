# Security

Telora is a plain web app: a Next.js 15 site with no database, no accounts, no API key and no blockchain code.

## Contract addresses and chain id

None, the app has no contracts and no chain. There is no `contracts/` directory.

## Wallet permissions

None requested, the app has no wallet code. A search of `app/`, `components/` and `lib/` for `eth_requestAccounts`, `window.ethereum`, `wagmi`, `eth_sign` and `personal_sign` finds nothing. A wallet extension has nothing to warn about on this site.

## Approval amounts and spenders

None.

## What leaves the browser

- Your poster never does. The OCR scan (Tesseract.js), the PDF render (pdf.js), the distance model and the PNG report all run in the tab. There is no upload route.
- Once the lab is idle, the browser downloads the Tesseract.js worker script, its WebAssembly core and the English language data (about 4 MB) from jsDelivr (`cdn.jsdelivr.net`), the library's default source, because `lib/ocr.ts` calls `createWorker("eng")` without overriding its paths. `OCR_ASSET_HOST` in `lib/config.ts` names it, and `/about` says so.
- The pdf.js worker is bundled by Next and served from this site.
- The two read-only JSON routes (`/api/posters`, `/api/profiles`) serve the example posters and vision profiles. They take one optional `?id=`, checked with zod.

## Secrets

None. `.env.example` holds one optional, non-secret setting (`ADAPTER_MODE`) and a comment about the build-time `NEXT_PUBLIC_BRAND_FILES`.

## Source

https://github.com/mericcintosun/telora

To report a problem, open an issue on that repository.
