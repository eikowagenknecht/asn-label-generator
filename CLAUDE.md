# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASN Label Generator is a CLI tool that generates PDF sheets of labels with ASN (Archive Serial Number) numbers and QR codes for the paperless-ngx document management system. The tool creates physical labels that can be scanned to automatically assign unique identifiers to documents.

## Development Commands

- **Development**: `pnpm dev` - Run the CLI in development mode using vite-node
- **Build**: `pnpm build` - Build the project using Vite
- **Testing**: `pnpm test` - Run tests with Vitest
- **Test (watch)**: `pnpm test:watch` - Run tests in watch mode
- **Test (coverage)**: `pnpm test:coverage` - Run tests with coverage report
- **Lint & Format**: `pnpm lint` - Run complete linting (TypeScript, ESLint, Prettier, Biome)
- **Type Check**: `pnpm type-check` - Run TypeScript type checking only
- **Check All**: `pnpm check` - Run both linting and type checking

For single test runs, use: `vitest run specific-test-file.test.ts`

## Architecture

### Core Components

- **`src/main.ts`**: CLI entry point using Commander.js for argument parsing
- **`src/cli/options.ts`**: Zod schemas for CLI option validation
- **`src/services/pdf-generator.ts`**: Main PDF generation logic using PDFKit
- **`src/services/qr-renderer.ts`**: QR code generation service
- **`src/config/avery-labels.ts`**: Label format configurations (currently Avery L4731)
- **`src/types/label-info.ts`**: TypeScript type definitions

### Key Architecture Patterns

- **Type Safety**: Heavy use of Zod for runtime validation and TypeScript for compile-time safety
- **Modular Services**: PDF generation and QR code rendering are separate services
- **Configuration-Driven**: Label formats are defined in configuration files for easy extension
- **CLI-First**: Built as a CLI tool with comprehensive option handling

### Build System

- Uses Vite for building and development
- ESM-only project (type: "module")
- External dependencies (commander, pdfkit, qrcode, zod) are not bundled
- Builds to `dist/main.js` as a single ES module
- Executable shebang for direct CLI usage

### Label Generation Flow

1. CLI options parsed and validated via Zod schema
2. PDFGenerator instantiated with label format configuration
3. Labels positioned using calculated grid system with offset/scale support  
4. Each label renders QR code and text side-by-side
5. PDF saved to `out/` directory

### Testing and Quality

- Vitest for testing with V8 coverage
- Multi-linter setup: ESLint + Prettier + Biome
- TypeScript strict mode enabled
- Git hooks via Lefthook for commit validation