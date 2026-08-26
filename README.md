# CONVX

Private, client-side file conversion entirely inside your browser.

**Hosted Live:** [convx.netlify.app](https://convx.netlify.app/)

```text
✓ No uploads
✓ No backend
✓ No accounts
✓ Runs entirely in your browser
✓ Open source
✓ Offline capable
```

CONVX is a 100% client-side file conversion tool designed with a strict black-and-white visual identity. **Your files never leave your device.** 

---

## 1. How Privacy Works

Unlike typical online converters, CONVX does not upload your files to any server.

1. **Local Reading:** Selected files are loaded into browser memory as local `Blob` or `ArrayBuffer` objects.
2. **Local Processing:** Standard JavaScript, WebAssembly, and browser APIs parse, render, and compile your files directly inside your browser.
3. **Local Compilation:** Converted data is packaged into a local Blob URL for direct download.
4. **Local Cleanup:** All references and memory buffers are immediately garbage collected and URL pointers are revoked upon download/exit.

### Developer Verification Tutorial

To confirm that no files are sent to remote servers:
1. Open your browser's Developer Tools (<kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd>).
2. Go to the **Network** tab.
3. Drag a file into the upload zone, configure your output format, and click **Convert**.
4. Observe the Network tab: **no outgoing upload requests or API fetch calls will appear.** Only static assets (or cached dependencies) are loaded.

---

## 2. Architecture

CONVX uses a modular pipeline designed to separate frontend presentation from local conversion libraries:

```text
UI (DropZone, Queue, Results)
 │
 ├── File Queue / Previews
 │
 └── Pipeline (Decides pathway)
        │
        ├── [Text & Data] ──► Web Worker (CSV, JSON, Plain Text)
        │
        └── [Doc & Canvas] ──► Browser API / jsPDF (Image scale, DOCX XML, PDF.js, HTML)
```

- **Vite & React:** High-performance, lightweight UI shell.
- **Web Workers:** Used to parse CPU-bound formats (CSV/JSON/Text) in a background thread to prevent UI lockups.
- **Vite PWA Plugin:** Registers a Service Worker to cache all local assets, including the CDN-loaded PDF.js libraries, making the application fully functional offline.

---

## 3. Supported Formats

| Category | Input Formats | Target Output Formats | Processing Libraries |
| :--- | :--- | :--- | :--- |
| **Documents** | `PDF` | `TXT`, `HTML`, `PNG`, `JPG` (zipped if >1 page) | PDF.js (CDN-lazyloaded) |
| | `DOCX` | `PDF`, `HTML`, `TXT`, `MD` | Native `DOMParser` + `JSZip` |
| | `HTML` | `PDF` | `jsPDF` (off-screen rendering) |
| | `Markdown` | `HTML`, `PDF` | `marked` + `jsPDF` |
| | `TXT` | `Markdown` | Custom parser |
| **Images** | `PNG`, `JPG`, `WebP` | `PNG`, `JPG`, `WebP`, `PDF` (combined option) | Canvas 2D Context + `jsPDF` |
| **Data** | `CSV` | `JSON` | Web Worker parser |
| | `JSON` | `CSV` | Web Worker parser |

---

## 4. Local Development

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/shad-ct/CONVX.git
cd CONVX
npm install
```

### Run Locally

Start the Vite development server:

```bash
npm run dev
```

### Production Build

Compile and build the static assets:

```bash
npm run build
```

This generates a folder named `dist/` containing HTML, CSS, JavaScript, manifest, and service worker configurations.

### Deployment

The contents of `dist/` are entirely static and can be deployed directly to:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel Static Hosting
- Nginx / Apache / any web host

---

## 5. Adding New Converters

To introduce support for a new conversion pathway:

1. **Implement Converter:** Create a folder under `src/converters/<format>/` and write the conversion function returning a `Promise<Blob>`.
2. **Register Formats:** Update the `CONVERSION_REGISTRY` in `src/engine/registry.ts` to expose the new options.
3. **Handle Flow:** Update the `executeConversion` switch block in `src/engine/registry.ts` to call your new handler.
