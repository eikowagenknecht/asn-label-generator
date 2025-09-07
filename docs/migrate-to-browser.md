# Migration Guide: CLI to Browser-Only React Application

## Overview

This guide converts the CLI-based ASN Label Generator to a modern browser-only React application using jsPDF for PDF generation and a React 19 + shadcn/ui + Tailwind CSS v4 interface.

## Technology Stack

- **PDF Generation**: jsPDF v3.0.2 (actively maintained, browser-native)
- **QR Code Generation**: Keep existing `qrcode` library (browser-compatible)
- **UI Framework**: React 19 + shadcn/ui + Tailwind CSS v4
- **Build Tool**: Vite with React and Tailwind v4 plugins

## Phase 1: Project Migration & Structure

### 1.1 Add React Dependencies to Existing Project

```bash
# Add React and related dependencies
pnpm add react react-dom
pnpm add -D @vitejs/plugin-react @types/react @types/react-dom

# Add new dependencies for browser version
pnpm add jspdf @hookform/react-hook-form @hookform/resolvers
pnpm add -D @types/jspdf vite-plugin-singlefile
```

### 1.2 Install shadcn/ui with Tailwind v4

```bash
# Use canary version for React 19 + Tailwind v4 support
npx shadcn@canary init
```

### 1.3 Update Vite Configuration

Update `vite.config.ts`:

```typescript
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 1.4 Create React Entry Points

Create `index.html` in project root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ASN Label Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/web-main.tsx"></script>
  </body>
</html>
```

### 1.5 Restructure Existing Code

Existing files to keep and adapt:
- `src/types/label-info.ts` → Keep as-is (already browser-compatible)
- `src/config/avery-labels.ts` → Keep as-is (already browser-compatible)
- `src/util/const.ts` → Keep as-is (already browser-compatible)
- `src/cli/options.ts` → Rename to `src/lib/validation.ts` and adapt Zod schemas for form validation

Files to replace:
- `src/main.ts` → Replace with `src/web-main.tsx` (React entry point)
- `src/services/pdf-generator.ts` → Rewrite for jsPDF
- `src/services/qr-renderer.ts` → Adapt for browser data URLs

Remove CLI-specific dependencies from `package.json`:
```bash
pnpm remove commander vite-node
```

## Phase 2: PDF Generation Rewrite

### 2.1 Create New PDF Generator Service

Create `src/lib/pdf-generator.ts`:

```typescript
import jsPDF from 'jspdf';
import { generateQRCodeDataURL } from './qr-generator';
import type { LabelGeneratorOptions, LabelInfo } from '../types/label-info';

export class PDFGenerator {
  private doc: jsPDF;
  private labelInfo: LabelInfo;
  // ... other properties

  constructor(options: LabelGeneratorOptions) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    // Initialize other properties
  }

  private async renderLabel(pos: LabelPosition): Promise<void> {
    // Generate QR code as data URL
    const qrDataUrl = await generateQRCodeDataURL(textQR, qrSize);
    
    // Add QR code to PDF
    this.doc.addImage(qrDataUrl, 'PNG', x, y, width, height);
    
    // Add text
    this.doc.setFontSize(fontSize);
    this.doc.text(textPrint, textX, textY);
  }

  public downloadPDF(filename: string): void {
    this.doc.save(filename);
  }
}
```

### 2.2 Update QR Code Service

Create `src/lib/qr-generator.ts`:

```typescript
import QRCode from 'qrcode';

export async function generateQRCodeDataURL(
  text: string,
  size: number
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size * 8, // Scale factor for quality
    margin: 0,
    type: 'image/png'
  });
}
```

### 2.3 Convert Coordinate Systems

- jsPDF uses points (pt) as default unit
- Convert all positioning calculations from PDFKit to jsPDF coordinate system
- jsPDF origin (0,0) is top-left corner

## Phase 3: React UI Development

### 3.1 Main Form Component

Create `src/components/LabelForm.tsx`:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cliOptionsSchema } from "@/lib/validation";

export function LabelForm() {
  const form = useForm({
    resolver: zodResolver(cliOptionsSchema),
    defaultValues: {
      pages: 1,
      startAsn: 1,
      digits: 5,
      prefixQR: "ASN",
      prefixPrint: "ASN",
      // ... other defaults
    }
  });

  const onSubmit = async (data) => {
    const generator = new PDFGenerator(data);
    await generator.renderLabels(calculateLabelCount(data));
    generator.downloadPDF('labels.pdf');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields using shadcn/ui components */}
    </form>
  );
}
```

### 3.2 Install Required shadcn/ui Components

```bash
npx shadcn@canary add button input label checkbox select card collapsible
```

### 3.3 Main App Structure

Update `src/App.tsx`:

```typescript
import { LabelForm } from "@/components/LabelForm";
import { LabelPreview } from "@/components/LabelPreview";

export default function App() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">ASN Label Generator</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <LabelForm />
        <LabelPreview />
      </div>
    </div>
  );
}
```

### 3.4 Form Fields to Implement

- **Basic Settings**: Pages, number of labels, starting ASN, output filename
- **Label Content**: Digits, QR prefix, print prefix
- **Layout Options**: Top-down ordering, skip labels, label format
- **Fine-tuning**: Offsets (X/Y), scale factors (X/Y), margins (X/Y)
- **Debug**: Border checkbox for testing alignment

### 3.5 Advanced Controls (Collapsible)

Group advanced options in collapsible sections:
- **Position Adjustments**: Offset and scale controls
- **Format Options**: Label format selector, margin controls
- **Debug Tools**: Border toggle, preview options

## Phase 4: Enhanced Features

### 4.1 Real-time Preview

Create `src/components/LabelPreview.tsx`:

```typescript
export function LabelPreview({ options }: { options: LabelGeneratorOptions }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Label Preview</h3>
      <canvas 
        ref={canvasRef}
        className="border border-gray-200"
        width={200} 
        height={80}
      />
      <div className="mt-2 text-sm text-gray-600">
        {labelCount} labels on {pageCount} pages
      </div>
    </div>
  );
}
```

### 4.2 Validation & Error Handling

- Use Zod schemas for form validation
- Show validation errors inline with form fields
- Provide helpful error messages for invalid inputs
- Handle PDF generation errors gracefully

### 4.3 URL State Management

- Serialize form state to URL params for sharing configurations
- Allow bookmarking of specific label setups
- Restore form state from URL on page load

## Phase 5: Build & Deployment (Single File)

### 5.1 Configure Vite for Single File Output

Update `vite.config.ts` for single file build:

```typescript
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]',
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Inline all assets
  }
});
```

### 5.2 Create Single HTML File Template

Create `index.html` in project root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ASN Label Generator</title>
    <style>
      /* All CSS will be inlined here by Vite */
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      /* All JS will be inlined here by Vite */
    </script>
  </body>
</html>
```

### 5.3 Build Process

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && node inline-build.js",
    "preview": "vite preview",
    "lint": "pnpm run lint:eslint && pnpm run lint:prettier && pnpm run lint:biome",
    "lint:eslint": "eslint . --ext ts,tsx --fix",
    "lint:prettier": "prettier --write ./src", 
    "lint:biome": "biome check --fix --unsafe ./src",
    "type-check": "tsc --noEmit"
  }
}
```

### 5.4 Post-build Inline Script

Create `inline-build.js` to merge CSS and JS into single HTML:

```javascript
import fs from 'fs';
import path from 'path';

const distDir = './dist';
const indexPath = path.join(distDir, 'index.html');
const jsPath = path.join(distDir, 'index.js');
const cssPath = path.join(distDir, 'index.css');

let html = fs.readFileSync(indexPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

// Inline CSS
if (css) {
  html = html.replace('</head>', `<style>${css}</style></head>`);
}

// Inline JS
html = html.replace('<script type="module" crossorigin src="./index.js"></script>', 
  `<script>${js}</script>`);

// Write final single file
fs.writeFileSync(path.join(distDir, 'asn-label-generator.html'), html);
console.log('Single file build created: dist/asn-label-generator.html');
```

### 5.5 Alternative: Vite Plugin for Single File

Install and use `vite-plugin-singlefile`:

```bash
pnpm add -D vite-plugin-singlefile
```

Update `vite.config.ts`:

```typescript
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  // ... other config
});
```

### 5.6 Deployment

After building, you'll have a single `asn-label-generator.html` file that:
- Contains all CSS, JavaScript, and assets inlined
- Can be opened directly in any browser
- Requires no server or hosting service
- Can be shared as a single file via email, USB, etc.

**Deployment options:**
- **Direct sharing**: Email the single HTML file
- **File hosting**: Upload to any file hosting service
- **GitHub**: Commit the single file for easy access
- **Local use**: Save to desktop for offline use

## Migration Checklist

### Core Functionality
- [ ] PDF generation working with jsPDF
- [ ] QR code generation as data URLs
- [ ] All CLI options available in form
- [ ] Label positioning calculations converted
- [ ] File download working in browser

### UI/UX
- [ ] Form validation with error messages
- [ ] Responsive design for mobile
- [ ] Real-time preview of labels
- [ ] Advanced options in collapsible sections
- [ ] Loading states during PDF generation

### Quality & Polish
- [ ] TypeScript types updated for browser environment
- [ ] Error handling for edge cases
- [ ] Accessibility features (keyboard navigation, screen readers)
- [ ] Dark mode support (Tailwind v4 built-in)
- [ ] URL state management for sharing configs

### Testing & Deployment
- [ ] Build process working correctly
- [ ] All dependencies browser-compatible
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing
- [ ] Production deployment successful