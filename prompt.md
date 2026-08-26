# CONVX — Client-Side Universal File Converter

Build a production-quality, open-source web application called **CONVX**.

CONVX is a **100% client-side file conversion tool**. Users should be able to upload multiple files, preview them, select an output format, convert them entirely inside their browser, preview the result, and download it.

## 1. Core Principle

The most important architectural requirement:

**FILES MUST NEVER LEAVE THE USER'S DEVICE.**

There must be:

* No backend
* No API server
* No database
* No file uploads
* No cloud processing
* No authentication
* No accounts
* No analytics that inspect files
* No external conversion API
* No `fetch()` requests containing user files
* No server-side conversion

The website itself may be hosted as a static application, but all conversion must happen locally in the browser.

The application should continue working after the initial application assets have been loaded, including when offline where technically possible.

Display a small privacy statement in the UI:

> **Your files never leave your device.**

Do not make this statement visually dominant. It should be subtle and integrated into the interface.

---

# 2. Design Direction

The entire interface must use an extremely strict **black-and-white visual system**.

Allowed:

* `#000000`
* `#FFFFFF`
* grayscale values only

Do NOT use:

* blue
* purple
* green
* red
* orange
* yellow
* gradients
* colorful icons
* colorful status indicators

Even success/error states must remain monochrome.

Use contrast, borders, typography, symbols, and patterns instead of color.

## Visual personality

The design should feel:

* comic-book inspired
* minimalist
* slightly playful
* technical
* editorial
* brutalist
* compact
* highly intentional

Think:

**black ink on white paper + comic panels + terminal utility + modern Swiss/editorial layout.**

Do NOT make it look like:

* a generic SaaS dashboard
* a corporate enterprise application
* a colorful AI startup
* a glassmorphism website
* a gradient-heavy landing page
* a neumorphic interface

The interface should feel almost like someone designed a powerful tool using a black marker and a ruler.

---

# 3. Typography

Use a strong comic/editorial typographic system.

Prefer:

* bold grotesk/sans-serif headings
* monospace for technical information
* slightly exaggerated typography for major labels
* uppercase labels where appropriate

Use typography to create hierarchy rather than colors.

Example:

```text
CONVX

CONVERT
ANYTHING.

LOCALLY.
```

But do not overuse oversized text.

Use a restrained type scale.

---

# 4. Visual Language

Use:

* thick black borders
* thin black dividers
* rectangular panels
* slightly irregular comic-style boxes
* halftone/dot textures only where useful
* subtle paper-like visual treatment
* monochrome icons
* arrows
* small labels
* comic-style speech bubbles sparingly
* sharp corners by default

Avoid excessive rounded cards.

Avoid floating glass cards.

Avoid excessive shadows.

If shadows are used, they should be simple black offset shadows such as:

```css
box-shadow: 4px 4px 0 #000;
```

No soft blur shadows.

Buttons should look tactile and slightly comic-like.

Example:

```text
┌─────────────────────┐
│  + ADD FILES        │
└─────────────────────┘
```

On hover, the button can shift by 2–3px or change its border treatment.

Keep animations extremely subtle and fast.

---

# 5. Main Application

The homepage should immediately be the converter.

Do NOT create a giant marketing landing page before the tool.

The primary screen should contain:

```text
┌─────────────────────────────────────────────────────┐
│ CONVX                              LOCAL / PRIVATE │
├─────────────────────────────────────────────────────┤
│                                                     │
│                    DROP FILES                       │
│                       HERE                          │
│                                                     │
│                 or [ ADD FILES ]                    │
│                                                     │
│       Nothing leaves your device.                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The upload area should support:

* click to upload
* drag and drop
* multiple files
* selecting multiple files from the file picker
* adding additional files later

Do not restrict the user to one file.

---

# 6. Multiple File Workflow

After files are added, show a compact file queue.

Example:

```text
FILES · 04

┌──────────────────────────────────────────────────────┐
│ PDF     research.pdf              12.4 MB     ×      │
├──────────────────────────────────────────────────────┤
│ DOCX    thesis.docx                4.8 MB     ×      │
├──────────────────────────────────────────────────────┤
│ PNG     diagram.png                1.2 MB     ×      │
├──────────────────────────────────────────────────────┤
│ MD      notes.md                    34 KB      ×      │
└──────────────────────────────────────────────────────┘

[ + ADD MORE ]

                    [ CONVERT ALL ]
```

Each file should show:

* filename
* extension
* file size
* conversion status
* remove button
* preview button
* selected output format

Allow individual files to have different output formats.

Example:

```text
research.pdf   → Markdown
thesis.docx    → PDF
diagram.png    → WebP
notes.md       → HTML
```

---

# 7. File Preview

Every supported input file should have a preview where technically possible.

Create a preview panel/modal/drawer.

Examples:

PDF:

* page preview
* page navigation
* zoom
* page count

Image:

* actual image preview
* dimensions
* file size

Text:

* syntax/plain-text preview
* line count where useful

Markdown:

* rendered Markdown preview
* source/preview toggle

HTML:

* sandboxed rendered preview
* source toggle

CSV:

* table preview
* row/column count

DOCX:

* extractable text preview
* document metadata where available

Do not attempt to perfectly render every possible format.

When a full preview is not technically possible, show a useful metadata preview instead.

Example:

```text
PREVIEW

thesis.docx

Type       Microsoft Word
Size       4.8 MB
Pages      42
Modified   —
```

---

# 8. Conversion Selection

For each file, provide a clean format selector.

Example:

```text
research.pdf

CONVERT TO

[ Markdown ▼ ]
```

The dropdown should only show formats supported for that input.

Do not show impossible conversions.

For example:

```text
PDF

✓ Markdown
✓ TXT
✓ HTML
✓ PNG
✓ JPG

DOCX

✓ PDF
✓ HTML
✓ TXT
✓ Markdown
```

The conversion capability system should be centralized.

Do NOT hardcode conversion logic directly into UI components.

Create a conversion registry such as:

```ts
type Conversion = {
  from: string[];
  to: string[];
  converter: string;
  supportsBatch: boolean;
};
```

The UI should derive available formats from this registry.

---

# 9. Conversion Engine

Use a modular architecture.

Create:

```text
src/
├── converters/
│   ├── pdf/
│   ├── docx/
│   ├── markdown/
│   ├── html/
│   ├── image/
│   ├── text/
│   └── csv/
│
├── engine/
│   ├── registry.ts
│   ├── pipeline.ts
│   ├── worker.ts
│   └── types.ts
│
├── preview/
├── components/
├── pages/
├── hooks/
└── utils/
```

Each converter should implement a consistent interface.

Conceptually:

```ts
interface Converter {
  canConvert(input: Format, output: Format): boolean;

  convert(
    file: File,
    options?: ConversionOptions
  ): Promise<ConversionResult>;
}
```

Keep the conversion engine independent from the UI.

---

# 10. Browser Architecture

Heavy conversions MUST NOT block the main UI thread.

Use:

**Web Workers.**

Architecture:

```text
UI
 │
 ├── File queue
 ├── Preview
 └── Progress
        │
        ▼
   Web Worker
        │
        ▼
 Conversion Engine
        │
        ▼
 WebAssembly / browser APIs
        │
        ▼
 Converted Blob
```

The UI should remain responsive during conversion.

Show progress where possible.

Example:

```text
CONVERTING

research.pdf

████████████████░░░░  78%

Extracting pages...
```

For conversions where exact progress cannot be measured, use an indeterminate but subtle progress indicator.

---

# 11. WebAssembly

Use WebAssembly for conversion engines where practical.

Prefer mature existing browser-compatible/WASM libraries instead of implementing complex document formats from scratch.

Potential technologies include:

* PDF.js for PDF parsing/rendering
* WebAssembly-based document conversion engines where available
* browser Canvas APIs for image conversion
* Web Workers for processing
* appropriate JS/WASM libraries for Markdown, HTML, CSV, and text

Do not introduce a huge dependency simply because it technically supports one obscure format.

**Bundle size matters.**

Prefer lazy-loading conversion engines.

For example:

```text
Initial page
    ↓
small core bundle
    ↓
user selects PDF
    ↓
load PDF conversion module
```

Do not load every converter on the initial page.

---

# 12. Image Conversion

Image conversions should use browser-native APIs where possible.

Support useful formats such as:

* PNG
* JPEG/JPG
* WebP

Potential operations:

* format conversion
* quality
* resize
* dimensions

Example:

```text
IMAGE

diagram.png

Convert to:

[ WebP ▼ ]

Quality
[───────────────●──]

Width
[ 1920 ]

Height
[ 1080 ]

[ CONVERT ]
```

Keep advanced controls hidden until needed.

---

# 13. PDF Handling

PDF is a major feature.

Support:

* PDF preview
* page navigation
* zoom
* page count
* text extraction where possible
* PDF → TXT
* PDF → HTML
* PDF → Markdown where practical
* PDF → images
* image → PDF

For image → PDF:

Allow multiple images to be combined:

```text
01.png
02.png
03.png

        ↓

combined.pdf
```

Allow simple page ordering.

Drag to reorder pages.

Keep this interface minimal.

---

# 14. Batch Conversion

Batch conversion is a core feature.

Example:

```text
12 FILES

[✓] paper-01.pdf
[✓] paper-02.pdf
[✓] paper-03.pdf
[✓] paper-04.pdf

OUTPUT

[ Markdown ▼ ]

[ CONVERT 4 FILES ]
```

For compatible files, allow:

**Convert all → selected format**

For incompatible files, clearly indicate why.

Example:

```text
4 files selected

3 can be converted to Markdown
1 cannot

[ CONVERT 3 ]
```

Do not fail the entire batch because one file is unsupported.

---

# 15. Result Preview

After conversion, provide a result screen.

Example:

```text
DONE.

research.pdf
        ↓
research.md

[ PREVIEW ]   [ DOWNLOAD ]

────────────────────────────

# Research Paper

## Abstract

...

────────────────────────────

[ DOWNLOAD FILE ]
```

For images, show the actual result.

For PDF, show PDF preview.

For Markdown, show rendered preview.

For text, show text.

For HTML, render it safely inside a sandboxed iframe.

---

# 16. Downloads

Allow:

* individual download
* download all
* batch download as ZIP

Example:

```text
RESULTS · 04

research.md       [ DOWNLOAD ]
thesis.pdf        [ DOWNLOAD ]
diagram.webp      [ DOWNLOAD ]
notes.html        [ DOWNLOAD ]

                    [ DOWNLOAD ALL ]
```

For multiple downloads, generate the ZIP entirely in the browser.

Never upload the files to create the ZIP.

---

# 17. File Safety

Treat uploaded files as untrusted data.

Important requirements:

* Never execute uploaded files.
* Never inject uploaded HTML directly into the main DOM.
* Sandbox HTML previews.
* Sanitize rendered content where necessary.
* Use object URLs carefully.
* Revoke object URLs when no longer required.
* Clean up large ArrayBuffers/Blobs after conversion.
* Avoid keeping unnecessary copies of large files in memory.

The application should handle large files gracefully where technically possible.

---

# 18. Privacy Indicator

Include a tiny persistent indicator somewhere near the main tool:

```text
LOCAL ONLY · NO UPLOADS
```

or:

```text
⌁ YOUR FILES STAY HERE
```

Keep it monochrome and subtle.

Do not turn privacy into a huge marketing section.

---

# 19. Responsive Design

The application must work on:

* desktop
* laptop
* tablet
* mobile

Desktop:

```text
┌───────────────────────────────────────────────────────┐
│ FILES              │ PREVIEW                          │
│                    │                                  │
│ research.pdf       │ PDF PREVIEW                      │
│ thesis.docx        │                                  │
│ notes.md           │                                  │
│                    │                                  │
└────────────────────┴──────────────────────────────────┘
```

Mobile:

```text
FILES

research.pdf
thesis.docx

[ PREVIEW ]

[ CONVERT ]
```

Do not simply shrink the desktop UI.

Reflow it properly.

---

# 20. Keyboard-first UX

The application should be usable with the keyboard.

Useful shortcuts:

```text
A       Add files
Enter   Select/confirm
Esc     Close preview/modal
Delete  Remove selected file
C       Convert
D       Download
?       Show shortcuts
```

Do not make keyboard shortcuts interfere with normal text input.

---

# 21. Empty State

The empty state should be extremely clean.

Something like:

```text
CONVX

DROP FILES
HERE

or

[ + ADD FILES ]

LOCAL ONLY · NO UPLOADS
```

Nothing more.

Avoid unnecessary marketing copy.

---

# 22. Error Handling

Errors should be human-readable.

Bad:

```text
WASM_ERR_0x8F23
```

Good:

```text
CONVERSION FAILED

research.pdf → DOCX

This conversion is not currently supported.

[ CHANGE FORMAT ]
```

For unexpected errors:

```text
SOMETHING BROKE.

The file could not be converted.

No data was uploaded.

[ TRY AGAIN ]
```

Keep errors monochrome.

---

# 23. Settings

Avoid a large settings page.

Only include useful settings:

```text
SETTINGS

Theme
● Black & White

Default output folder
Browser controlled

Animations
[ Minimal ]

Confirm before removing files
[ ON ]
```

Since this is a browser application, do not pretend we can control filesystem paths that browser security does not permit.

---

# 24. Technology Stack

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* Web Workers
* WebAssembly where appropriate
* browser File APIs
* Blob APIs
* Canvas APIs
* IndexedDB only if genuinely useful
* JSZip or equivalent for client-side ZIP creation

Avoid unnecessary libraries.

Do NOT use:

* Next.js unless there is a compelling reason
* Express
* Fastify
* Node backend
* PostgreSQL
* Firebase
* Supabase
* authentication
* cloud storage
* upload services
* analytics platforms
* unnecessary UI component libraries

The application should be a **static frontend**.

---

# 25. Dependency Philosophy

Keep dependencies minimal.

Before adding a library ask:

1. Can the browser do this natively?
2. Can a small existing library do it?
3. Is WebAssembly necessary?
4. Does this dependency significantly increase bundle size?
5. Is the functionality important enough to justify the dependency?

Prefer fewer dependencies over feature quantity.

Use lazy loading for large converters.

---

# 26. PWA / Offline Support

Make CONVX installable as a PWA.

After the initial application load:

* cache application assets
* cache converter modules where practical
* allow the UI to open offline
* perform conversions locally

Show:

```text
OFFLINE READY
```

only if the application is actually capable of operating offline.

Do not fake offline support.

---

# 27. No Fake Features

Do NOT create UI for functionality that doesn't actually work.

If a format cannot currently be converted:

Do not put it in the dropdown.

If a preview isn't available:

Show metadata instead.

If a conversion is experimental:

Clearly label it.

The application must prioritize **working conversions over a huge format list**.

---

# 28. Initial Format Support

Build a strong v1 rather than claiming "everything."

Prioritize:

### Documents

* PDF
* TXT
* Markdown
* HTML
* DOCX where browser-compatible tooling allows it

### Images

* PNG
* JPG/JPEG
* WebP

### Data

* CSV
* JSON

### Useful conversions

```text
PDF → TXT
PDF → HTML
PDF → images

TXT → Markdown
Markdown → HTML
Markdown → PDF where feasible
HTML → PDF where feasible

PNG → JPG
PNG → WebP
JPG → PNG
JPG → WebP
WebP → PNG
WebP → JPG

CSV → JSON
JSON → CSV

Images → PDF
Multiple Images → PDF
```

Expand the format matrix later.

---

# 29. Project Structure

Use a clean architecture:

```text
convx/
│
├── public/
│
├── src/
│   ├── app/
│   ├── components/
│   │   ├── DropZone/
│   │   ├── FileQueue/
│   │   ├── FileItem/
│   │   ├── Preview/
│   │   ├── FormatSelector/
│   │   ├── Progress/
│   │   └── Results/
│   │
│   ├── converters/
│   │   ├── pdf/
│   │   ├── image/
│   │   ├── markdown/
│   │   ├── html/
│   │   ├── csv/
│   │   └── text/
│   │
│   ├── engine/
│   │   ├── registry.ts
│   │   ├── worker.ts
│   │   ├── pipeline.ts
│   │   └── types.ts
│   │
│   ├── preview/
│   ├── hooks/
│   ├── utils/
│   └── styles/
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

Keep modules isolated.

---

# 30. UX Flow

The complete flow should be:

```text
OPEN WEBSITE
     ↓
DROP / SELECT FILES
     ↓
FILES APPEAR IN QUEUE
     ↓
SELECT FILE
     ↓
PREVIEW
     ↓
SELECT OUTPUT FORMAT
     ↓
CONVERT
     ↓
WEB WORKER PROCESSES FILE
     ↓
RESULT CREATED IN MEMORY
     ↓
RESULT PREVIEW
     ↓
DOWNLOAD
```

For batch conversion:

```text
SELECT MULTIPLE
       ↓
CHOOSE FORMAT
       ↓
CONVERT
       ↓
RESULTS
       ↓
DOWNLOAD INDIVIDUALLY
       OR
DOWNLOAD ZIP
```

---

# 31. Branding

Name:

**CONVX**

Logo should simply be:

```text
CONVX
```

No elaborate logo.

Potential visual treatment:

```text
C O N V X
```

or a compact black rectangular mark containing:

```text
CX
```

Use typography as the primary identity.

No colorful branding.

No gradients.

No mascots.

No 3D illustrations.

No stock images.

No unnecessary decorative graphics.

---

# 32. Comic Treatment

The comic aesthetic should be subtle.

Use things like:

```text
┌─────────────────────┐
│ POW!                 │
│                     │
│ CONVERTED            │
└─────────────────────┘
```

But don't make the application look like a children's comic book.

The desired feeling is:

**“A hacker built a document converter with a black marker.”**

Not:

**“A cartoon website about converting files.”**

Use occasional comic-style microcopy:

```text
DROP IT.
```

```text
CONVERT.
```

```text
DONE.
```

```text
NO UPLOADS.
```

But keep the majority of the UI functional.

---

# 33. Performance

Performance is a major requirement.

Optimize for:

* small initial bundle
* lazy-loaded converters
* Web Workers
* minimal memory duplication
* efficient Blob handling
* cleanup of object URLs
* streaming where browser APIs support it
* no unnecessary global state
* no unnecessary rerenders

Do not load a 20 MB WASM module just to convert a PNG.

Load conversion engines only when required.

---

# 34. Accessibility

Maintain proper:

* keyboard navigation
* focus states
* semantic HTML
* ARIA labels where required
* visible focus indicators
* screen-reader-friendly buttons
* sufficient black/white contrast

Do not sacrifice accessibility for the comic aesthetic.

---

# 35. README

Create a concise but technically honest README.

Include:

```text
CONVX
Private client-side file conversion.

✓ No uploads
✓ No backend
✓ No accounts
✓ Runs in your browser
✓ Open source
✓ Offline capable
```

Explain exactly how privacy works.

Include:

```text
Architecture
Supported formats
Local processing
Browser compatibility
Development
Build
Deployment
Adding converters
```

Do not claim "all formats" unless they are actually supported.

---

# 36. Deployment

The final application must be deployable as a static site.

The production build should be:

```bash
npm run build
```

producing:

```text
dist/
```

The contents of `dist/` should be deployable directly to:

* GitHub Pages
* Cloudflare Pages
* Netlify
* Vercel static hosting
* Nginx
* any static web server

No server runtime should be required.

---

# 37. Security Verification

Before considering the project complete, verify that:

* user files never appear in network requests
* no conversion API is called
* no file data is stored remotely
* no backend exists
* HTML previews are sandboxed
* object URLs are revoked
* workers are terminated when appropriate
* large files do not remain unnecessarily in memory

Add development documentation explaining how someone can verify that files aren't uploaded using browser DevTools → Network.

---

# 38. Final Product Philosophy

CONVX should feel like a **small tool**, not a web platform.

The guiding principle is:

> **Drop. Convert. Download.**

Everything else is secondary.

No accounts.

No dashboards.

No advertisements.

No popups asking users to sign up.

No unnecessary onboarding.

No giant hero section.

No fake AI features.

No tracking.

No server processing.

No colorful UI.

No visual clutter.

The final experience should be so simple that a user can understand it in approximately five seconds.

The ideal application is:

```text
             CONVX

        DROP FILES HERE

       [ + ADD FILES ]

      LOCAL ONLY · NO UPLOADS
```

Then:

```text
FILE
  ↓
FORMAT
  ↓
CONVERT
  ↓
PREVIEW
  ↓
DOWNLOAD
```

Build the application around this simplicity.
