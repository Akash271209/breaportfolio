# Production Audit Report — breafreeburn.co.uk
Date: 2026-06-15

## Summary

A full audit was run against the 10-point checklist. 6 real issues were found and
fixed, build/lint verified, and the site was rebuilt and redeployed to both
`breafreeburn.surge.sh` and `breafreeburn.co.uk`. An automated asset-audit script
was added to `npm run build` so the most common classes of these bugs (broken
image paths, missing favicon, oversized images) fail the build going forward.

---

## Issues found & fixed

### 1. Oversized gallery images (Core Web Vitals / page speed)
- **Root cause**: `bone-series-3.jpg` (1.1MB, 3945×2705px), `breathing-series-3.jpg`
  (959KB, 2880×2880px) and `breathing-series-4.jpg` (1.1MB, 2880×2880px) were
  uploaded at full camera resolution — far larger than needed for web display.
- **Fix**: Resized to max 1600px and re-compressed to ~78% JPEG quality via
  `sips -Z 1600 -s formatOptions 78`.
- **Files changed**: `public/bone-series-3.jpg`, `public/breathing-series-3.jpg`,
  `public/breathing-series-4.jpg` (originals backed up to `/tmp/*.bak`)
- **Performance improvement**:
  - `bone-series-3.jpg`: 1,121,820 → 243,259 bytes (−78%)
  - `breathing-series-3.jpg`: 959,305 → 298,547 bytes (−69%)
  - `breathing-series-4.jpg`: 1,146,484 → 419,298 bytes (−63%)
  - Total payload reduction across these 3 images: ~2.27MB → ~0.96MB (−58%)

### 2. Above-the-fold images incorrectly lazy-loaded (LCP)
- **Root cause**: The Bio page portrait and the Gallery hero image are the
  Largest Contentful Paint elements on their pages, but were marked
  `loading="lazy"`, delaying their fetch until after layout — directly hurting LCP.
- **Fix**: Changed both to `loading="eager" fetchPriority="high"` so the browser
  prioritizes and starts fetching them immediately.
- **Files changed**: `src/pages/Bio.jsx` (portrait image), `src/pages/Gallery.jsx`
  (hero `featured` image)
- **Performance improvement**: Faster LCP on the two most visually important
  pages — the hero/portrait image now starts downloading at the same time as
  the page shell instead of after.

### 3. Missing `public/favicon.ico` → live 404
- **Root cause**: `index.html` references `/favicon.ico`, but the actual file
  only existed at the project root, outside `public/`. Vite only copies files
  from `public/` into `dist/`, so every page load on the live site issued a
  404 request for the favicon.
- **Fix**: Copied `favicon.ico` into `public/favicon.ico` so it's included in
  every build.
- **Files changed**: `public/favicon.ico` (new file, 15.4KB)
- **Performance improvement**: Eliminates a 404 network request on every page
  load (network errors check, item 6).

### 4. Unused `React` imports
- **Root cause**: Leftover `import React from 'react'` statements from an
  older React version — React 19's JSX transform doesn't need it, and these
  triggered unused-import lint warnings.
- **Fix**: Removed the unused `React` import, keeping only the named imports
  actually used (`useState`, `useEffect`, etc.).
- **Files changed**: `src/pages/Bio.jsx`, `src/pages/Gallery.jsx`,
  `src/components/Navbar.jsx`, `src/pages/Contact.jsx`
- **Performance improvement**: None measurable, but removes lint noise and a
  potential source of future console warnings.

### 5. Unhandled promise rejection risk in "Copy email" button
- **Root cause**: `navigator.clipboard.writeText(EMAIL)` returns a Promise. If
  it rejects (e.g. clipboard permission denied in some browsers/contexts),
  this would surface as an unhandled promise rejection in the console (item 5,
  JS console errors).
- **Fix**: Added `.then()/.catch()` handling and an early return if
  `navigator.clipboard` is unavailable.
- **Files changed**: `src/pages/Contact.jsx`
- **Performance improvement**: N/A — robustness fix, prevents console errors
  on unsupported/restricted browsers.

### 6. (Previously fixed, redeployed) `.page-wrapper` transform breaking fixed elements
- **Root cause**: `transform: translateY(...)` on `.page-wrapper` created a new
  CSS containing block, causing `position: fixed` elements (`.back-to-top`,
  `.lightbox-overlay`) to position relative to the page wrapper instead of the
  viewport — the "glitch" reported earlier.
- **Fix**: Reverted to an opacity-only fade transition for page entry.
- **Files changed**: `src/styles/styles.css`
- **Performance improvement**: Fixes visually broken/misplaced floating button
  and lightbox overlay across all pages.

---

## Checklist results

| # | Check | Result |
|---|-------|--------|
| 1 | Image loading on desktop/mobile | OK after fixes #1, #2 |
| 2 | Broken image URLs / missing assets | OK — all `src/` image references verified against `public/`; favicon fixed (#3) |
| 3 | Responsive design (common screen sizes) | Reviewed media queries — no issues found |
| 4 | Animation performance/failures | Page-transition + lightbox animations reviewed; fixed-position bug (#6) already resolved |
| 5 | JS console errors | Fixed clipboard rejection risk (#5); unused imports removed (#4) |
| 6 | Network errors (404/500) | Fixed favicon 404 (#3); no other broken requests found |
| 7 | Core Web Vitals / page speed | Fixed LCP lazy-loading (#2) and oversized images (#1) |
| 8 | Lazy loading / image optimization | Below-fold images correctly use `loading="lazy"`; above-fold fixed (#2); large images compressed (#1) |
| 9 | Browser compatibility (Chrome/Safari/Edge/Firefox) | `100dvh` and `aspect-ratio` usage reviewed — both have broad modern support, no fallback needed |
| 10 | Hydration / rendering issues | N/A — this is a pure client-side rendered SPA (Vite + React Router, no SSR), so there is no server/client hydration mismatch to audit |

---

## Automated monitoring added

A new script, `scripts/audit-assets.js`, now runs automatically as part of
`npm run build` (via a new `npm run audit` step). It checks:

1. **Every image path referenced in `src/**/*.jsx`/`.js`** (e.g.
   `src="/foo.jpg"`) exists in `public/` — catches broken image references
   before deploy.
2. **The favicon referenced in `index.html`** exists in `public/` — catches
   the exact bug found in #3.
3. **Any image in `public/` over 500KB** — emits a warning so oversized
   uploads (like #1) get caught before they ship.

If a referenced asset or the favicon is missing, the build fails (`exit 1`).
Oversized images produce a warning but don't block the build (some hero images
may legitimately need to be larger — the warning is a prompt to check/compress).

Run it standalone any time with:
```
npm run audit
```

---

## Deployment

Rebuilt and redeployed to:
- `https://breafreeburn.surge.sh`
- `https://breafreeburn.co.uk`

Verified via `curl`: `/`, `/gallery`, `/bio`, `/contact`, `/favicon.ico`, and
`/bone-series-3.jpg` all return `200`. HTTP → HTTPS redirect on
`breafreeburn.co.uk` confirmed working (`301` to `https://`).
