# Migration Guide: Dual CLI + Browser Application

## Overview

This guide converts the CLI-based ASN Label Generator to support both CLI and browser interfaces using a unified jsPDF-based architecture. The core PDF generation logic is shared between both interfaces.

## Technology Stack

- **PDF Generation**: jsPDF (works in both Node.js and browser)
- **QR Code Generation**: `qrcode` library (already browser-compatible)
- **CLI Interface**: Commander.js (existing)
- **Web Interface**: React 19 + shadcn/ui + Tailwind CSS v4
- **Build Tool**: Vite with dual build configuration

## Phase 1: Unified Architecture

### 1.1 Project Structure

```
src/
├── lib/                    # Shared core logic
│   ├── pdf-generator.ts    # Unified jsPDF implementation
│   ├── qr-generator.ts     # Unified QR code generation
│   ├── validation.ts       # Shared Zod schemas (renamed from cli/options.ts)
│   └── label-calculator.ts # Position/layout calculations
├── cli/
│   └── main.ts            # CLI entry point (existing)
├── web/
│   ├── main.tsx           # React entry point
│   └── components/        # React UI components
├── config/                # Existing configurations
└── types/                 # Existing type definitions
```

### 1.2 Dependencies

Since jsPDF works everywhere, we only need to add React dependencies:

```bash
# Add React and web dependencies
pnpm add react react-dom @hookform/react-hook-form @hookform/resolvers
pnpm add -D @vitejs/plugin-react @types/react @types/react-dom vite-plugin-singlefile

# Remove Node.js-only CLI dependency
pnpm remove vite-node
```

### 1.3 Refactor Existing Code

**Move and rename:**
- `src/cli/options.ts` → `src/lib/validation.ts`
- `src/services/` → `src/lib/` (rename services to lib)
- Keep existing: `src/types/`, `src/config/`, `src/util/`

**Update PDF Generator:**
```typescript
// src/lib/pdf-generator.ts
import jsPDF from 'jspdf';
import { generateQRCodeDataURL } from './qr-generator';

export class PDFGenerator {
  private doc: jsPDF;
  
  constructor(options: LabelGeneratorOptions) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    // ... existing logic adapted for jsPDF
  }

  async save(filename: string, environment: 'cli' | 'browser' = 'cli'): Promise<void> {
    if (environment === 'cli') {
      // Node.js: save to filesystem
      const pdfBytes = this.doc.output('arraybuffer');
      const fs = await import('fs/promises');
      await fs.writeFile(`out/${filename}`, Buffer.from(pdfBytes));
    } else {
      // Browser: trigger download
      this.doc.save(filename);
    }
  }
}
```

## Phase 2: Vite Configuration

### 2.1 Dual Build Setup

Create `vite.config.ts`:

```typescript
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => {
  const isWeb = mode === 'web';
  
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: isWeb ? {
      // Web build configuration
      rollupOptions: {
        input: './index.html'
      }
    } : {
      // CLI build configuration  
      lib: {
        entry: 'src/cli/main.ts',
        formats: ['es'],
        fileName: 'main'
      },
      rollupOptions: {
        external: ['commander', 'fs/promises']
      }
    },
    plugins: isWeb ? [
      (await import('@vitejs/plugin-react')).default(),
      (await import('@tailwindcss/vite')).default()
    ] : []
  };
});
```

### 2.2 Package Scripts

```json
{
  "scripts": {
    "dev": "node dist/main.js",
    "dev:web": "vite --mode web",
    "build": "pnpm build:cli && pnpm build:web",
    "build:cli": "vite build --mode cli",
    "build:web": "vite build --mode web",
    "preview": "vite preview --mode web"
  }
}
```

## Phase 3: Web Interface

### 3.1 Install shadcn/ui

```bash
npx shadcn@canary init
npx shadcn@canary add button input label checkbox select card collapsible
```

### 3.2 Create Web Entry Points

**Create `index.html`:**
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
    <script type="module" src="/src/web/main.tsx"></script>
  </body>
</html>
```

**Create `src/web/main.tsx`:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 3.3 Main Form Component

**Create `src/web/components/LabelForm.tsx`:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PDFGenerator } from "@/lib/pdf-generator";
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
      // ... other defaults from existing CLI
    }
  });

  const onSubmit = async (data) => {
    const generator = new PDFGenerator(data);
    await generator.generateLabels();
    await generator.save('labels.pdf', 'browser');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields using existing validation schema */}
    </form>
  );
}
```

## Phase 4: CLI Updates

### 4.1 Update CLI Main

**Update `src/cli/main.ts`:**
```typescript
import { Command } from 'commander';
import { PDFGenerator } from '../lib/pdf-generator.js';
import { cliOptionsSchema } from '../lib/validation.js';

// ... existing CLI setup
program.action(async (options) => {
  const validatedOptions = cliOptionsSchema.parse(options);
  const generator = new PDFGenerator(validatedOptions);
  
  await generator.generateLabels();
  await generator.save(validatedOptions.output || 'labels.pdf', 'cli');
});
```

## Phase 5: Single File Web Build (Optional)

### 5.1 Configure Single File Output

Update web build in `vite.config.ts`:

```typescript
// Add to web build configuration
build: {
  rollupOptions: {
    output: {
      inlineDynamicImports: true,
      entryFileNames: 'index.js',
      assetFileNames: 'index.[ext]',
    }
  },
  cssCodeSplit: false,
  assetsInlineLimit: 100000000,
}
```

### 5.2 Use Vite Plugin

```bash
pnpm add -D vite-plugin-singlefile
```

Add to web plugins:
```typescript
import { viteSingleFile } from "vite-plugin-singlefile";

plugins: [
  react(),
  tailwindcss(),
  viteSingleFile()
]
```

## Migration Checklist

### Core Functionality
- [x] PDF generation unified with jsPDF
- [ ] Shared validation schemas between CLI and web
- [ ] CLI entry point updated to use shared logic
- [ ] Web form using same options as CLI
- [ ] File download working in browser, filesystem save in CLI

### UI/UX (Web Only)
- [ ] Form validation with error messages
- [ ] Responsive design for mobile
- [ ] Real-time preview of labels
- [ ] Advanced options in collapsible sections

### Build & Deployment
- [ ] Dual build configuration working
- [ ] CLI executable builds correctly
- [ ] Web app builds correctly
- [ ] Optional single-file web build
- [ ] Both interfaces tested and working

This unified approach eliminates complexity while providing native experiences for both CLI and web users using the exact same PDF generation code.