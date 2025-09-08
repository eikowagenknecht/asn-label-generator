# ASN Label Generator - Development Guide

Development documentation for contributing to the ASN Label Generator project.

## Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0

## Project Setup

```bash
# Clone the repository
git clone https://github.com/eikowagenknecht/asn-label-generator.git
cd asn-label-generator

# Install dependencies
pnpm install
```

## Development Commands

### Web Application Development
```bash
# Run web app in development mode with hot reload
pnpm dev:web

# Build web version for deployment  
pnpm build:web
```

### CLI Development
```bash
# Run CLI in development mode
pnpm dev -- [options]

# Build CLI for production
pnpm build
```

### Code Quality
```bash
# Run complete linting (TypeScript, ESLint, Prettier, Biome)
pnpm lint

# Run individual linters
pnpm lint:eslint     # ESLint only
pnpm lint:prettier   # Prettier only
pnpm lint:biome      # Biome only

# Run type checking only
pnpm type-check

# Run both linting and type checking
pnpm check

# Format code with Biome
pnpm format
```

### Testing
```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
vitest run specific-test-file.test.ts
```

### Package Management
```bash
# Clean node_modules
pnpm clean:npm

# Reinstall dependencies from lockfile
pnpm sync:npm

# Update all dependencies to latest versions
pnpm upgrade:npm

# Find unused dependencies
pnpm knip
```

## Architecture

### Project Structure

- **`src/main.ts`**: CLI entry point using Commander.js for argument parsing
- **`src/cli/options.ts`**: Zod schemas for CLI option validation
- **`src/services/pdf-generator.ts`**: Main PDF generation logic using PDFKit
- **`src/services/qr-renderer.ts`**: QR code generation service
- **`src/config/avery-labels.ts`**: Label format configurations (currently Avery L4731)
- **`src/types/label-info.ts`**: TypeScript type definitions
- **`src/web/`**: Web application components and logic
  - **`src/web/App.tsx`**: Main React application component
  - **`src/web/components/`**: React UI components
  - **`src/web/BrowserPDFGenerator.ts`**: Browser-compatible PDF generation

### Key Architecture Patterns

- **Type Safety**: Heavy use of Zod for runtime validation and TypeScript for compile-time safety
- **Modular Services**: PDF generation and QR code rendering are separate services
- **Configuration-Driven**: Label formats are defined in configuration files for easy extension
- **Dual Interface**: Both CLI and web interfaces using shared core logic

### Build System

- **Vite** for building and development
- **ESM-only** project (`type: "module"`)
- **External dependencies** are not bundled for CLI, bundled for web
- **CLI builds** to `dist/main.js` as a single ES module
- **Web builds** to `dist-web/` as a single HTML file with embedded assets
- **Executable shebang** for direct CLI usage

### Label Generation Flow

1. Options parsed and validated via Zod schema
2. PDFGenerator instantiated with label format configuration
3. Labels positioned using calculated grid system with offset/scale support  
4. Each label renders QR code and text side-by-side
5. PDF generated and saved/downloaded

## Technology Stack

### Core Dependencies
- **React 19**: Web interface framework
- **jsPDF**: PDF generation in browser
- **QRCode**: QR code generation
- **Zod**: Runtime validation and type safety
- **Commander.js**: CLI argument parsing
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and dev server

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Biome**: Fast linter and formatter
- **Vitest**: Testing framework
- **Lefthook**: Git hooks management

## Code Style Guidelines

- **TypeScript strict mode** enabled
- **ESM imports/exports** only
- **Functional components** for React
- **Zod schemas** for all data validation
- **Consistent naming**: camelCase for variables/functions, PascalCase for components
- **No default exports** (prefer named exports)

## Testing Strategy

- **Unit tests** with Vitest
- **V8 coverage** reporting
- **Validation testing** for Zod schemas
- **PDF generation testing** for core functionality

## Git Workflow

- **Conventional commits** enforced via commitlint
- **Pre-commit hooks** via Lefthook for linting and formatting
- **Feature branches** for new development
- **Pull requests** required for main branch

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm check && pnpm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release commit
4. Tag with version number
5. Push to trigger CI/CD
6. Publish to npm (CLI)
7. Deploy web version to hosting

## Troubleshooting

### Common Issues

- **Node version mismatch**: Ensure Node.js >= 22.0.0
- **pnpm not found**: Install with `npm install -g pnpm`
- **Build failures**: Clear node_modules and reinstall (`pnpm clean:npm && pnpm install`)
- **Test failures**: Ensure all dependencies are installed
- **Linting errors**: Run `pnpm lint` to auto-fix most issues