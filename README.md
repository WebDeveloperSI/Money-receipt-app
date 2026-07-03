# SAS IT HUB — Money Receipt Generator (Standalone)

A fully self-contained HTML/CSS/JS build of the money receipt generator. No build step, no server required — just open `index.html` in a modern browser.

## How to run

1. Unzip the folder.
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.
   - Some browsers block `fetch()` of local files (needed to embed the logo in the PDF). If you see "Failed to generate PDF":
     - Easiest: serve locally, e.g. `python3 -m http.server` then open `http://localhost:8000`.
     - Or use VS Code's "Live Server" extension.
3. Fill in the form on the left, upload a signature image (optional), and click **Download PDF**.

## File structure

```
receipt-app/
├── index.html          # Page markup, form + live preview
├── styles.css          # All styling (no framework)
├── app.js              # Form logic, live preview, PDF generation, number-to-words
├── assets/
│   └── sas-it-hub-logo.png
└── README.md           # This file
```

## Fonts

- **Helvetica Neue**, falling back to Arial and generic sans-serif.
  System fonts only — no web font is loaded. If you want a custom font, add a `<link>` to Google Fonts in `index.html` and update `body { font-family: … }` in `styles.css`.

## Color palette

| Purpose                    | Hex        |
|----------------------------|------------|
| Primary brand (dark blue)  | `#1e3a8a`  |
| Accent blue                | `#1e40af`  |
| Amount-box background      | `#eff6ff`  |
| Body text                  | `#0f172a`  |
| Muted text                 | `#475569`  |
| Secondary muted            | `#64748b`  |
| Border light               | `#cbd5e1`  |
| Page background            | `#f1f5f9`  |
| Toast success              | `#16a34a`  |
| Toast error                | `#dc2626`  |

## Libraries / plugins

Only one external dependency, loaded from CDN in `index.html`:

- **jsPDF 2.5.1** — client-side PDF generation.
  CDN: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
  License: MIT. Docs: https://github.com/parallax/jsPDF

To go fully offline, download `jspdf.umd.min.js` into `assets/` and update the `<script>` src in `index.html`.

## Features

- Live A4-sized receipt preview that updates as you type.
- Signature image upload (PNG/JPG, up to 2MB) with remove option.
- Automatic amount-in-words conversion (English).
- Auto-calculated remaining balance (Total − Previous − This Payment).
- Direct PDF generation via jsPDF — no screenshots, no image blur.
- Toast notifications for feedback.
- Responsive layout (single column below 960px).

## Customization tips

- **Company info**: search `BSCIC Road, Barishal` in `index.html` and `app.js` to change contact line.
- **Logo**: replace `assets/sas-it-hub-logo.png` (keep same filename or update the two references).
- **Colors**: edit hex values in `styles.css` and the `setTextColor` / `setFillColor` calls in `app.js` (RGB tuples).
- **Currency label**: search `BDT` in `app.js`.

---
Generated: 2026-07-03
