# CLI-to-Web Migration Plan

## Phase 1: Build System Setup
- [x] **Create Tailwind CSS file** - `src/web/globals.css` with @tailwind directives (already done)
- [ ] **Create web Vite config** - `vite.config.web.ts` for React app build
- [ ] **Add React plugin** - Configure for React + existing Tailwind plugin
- [ ] **Setup web entry points** - `src/web/main.tsx` and `index.html`

## Phase 2: Browser PDF Generator
- [ ] **Create browser PDFGenerator** - Extend existing class, replace `save()` method with browser download
- [ ] **Remove Node.js imports** - Replace `node:fs/promises` and `node:path` usage in web version
- [ ] **Test existing services** - Verify `qr-renderer.ts` works in browser (should already work)

## Phase 3: React UI 
- [ ] **Create form component** - React form with all CLI options using shadcn/ui
- [ ] **Adapt validation schema** - Use existing Zod schemas for form validation
- [ ] **Wire up generation** - Form → PDFGenerator → browser download
- [ ] **Basic styling** - Clean UI with Tailwind

## Phase 4: Build & Deploy
- [ ] **Single file build** - Configure vite-plugin-singlefile for portable deployment
- [ ] **Update scripts** - Add `build:web` command to package.json
- [ ] **Test both builds** - Ensure CLI unchanged, web app works

**Key Insight**: Most work is already done! Just need browser download + React UI wrapper around existing PDFGenerator class.