# CLI-to-Web Migration Plan

## Phase 1: Build System Setup

- [x] **Create Tailwind CSS file** - `src/web/globals.css` with @tailwind directives (already done)
- [x] **Create web Vite config** - `vite.config.web.ts` for React app build
- [x] **Add React plugin** - Configure for React + existing Tailwind plugin
- [x] **Setup web entry points** - `src/web/main.tsx` and `index.html`

## Phase 2: Browser PDF Generator

- [x] **Create browser PDFGenerator** - Created abstract base class and browser implementation
- [x] **Remove Node.js imports** - Refactored into `PDFGeneratorBase` without Node.js dependencies
- [x] **Test existing services** - Verified `qr-renderer.ts` works in browser

## Phase 3: React UI

- [x] **Create form component** - React form with all CLI options using shadcn/ui
- [x] **Adapt validation schema** - Created web-specific Zod schema
- [x] **Wire up generation** - Form → BrowserPDFGenerator → browser download
- [x] **Basic styling** - Clean UI with Tailwind and shadcn components

## Phase 4: Build & Deploy

- [x] **Single file build** - Configured vite-plugin-singlefile for portable deployment
- [x] **Update scripts** - Added `build:web` and `dev:web` commands to package.json
- [x] **Test both builds** - CLI and web app both build and function correctly

## ✅ Migration Complete!

**Usage:**

- **CLI**: `pnpm build` → `node dist/main.js [options]`
- **Web App**: `pnpm build:web` → Deploy `dist-web/index.html` anywhere
- **Development**: `pnpm dev:web` for live web development

**Result**: Single 1.1MB HTML file that works offline and can be hosted anywhere!
