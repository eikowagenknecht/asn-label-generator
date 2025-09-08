# ASN Label Generator - CLI

Command-line interface for generating PDF sheets of labels with ASN (Archive Serial Number) numbers and corresponding QR codes for the paperless-ngx document management system.

> **💡 Looking for the easy-to-use web version?** Check out [eikowagenknecht.com/asn-label-generator](https://eikowagenknecht.com/asn-label-generator/) - no installation required!

## Prerequisites

- Node.js >= 22.0.0
- pnpm (recommended) or npm
- Compatible label sheets (Avery L4731 or equivalent)

## Installation & Setup

Choose your preferred method:

### Method 1: Local Development Setup

```bash
# Clone the repository
git clone https://github.com/eikowagenknecht/asn-label-generator.git
cd asn-label-generator

# Install dependencies
pnpm install

# Run in development mode
pnpm dev -- [options]
```

### Method 2: Production Build

```bash
# Clone and install as above, then build
pnpm build

# Run the built version
node dist/main.js [options]
```

### Method 3: Global Installation

```bash
# From the project directory
pnpm build
pnpm link --global

# Now you can run from anywhere using
asn-label-generator [options]
```

> **Note:** Global installation allows you to use the `asn-label-generator` command from anywhere. If you prefer not to install globally, use the methods above with the appropriate command format.


## Usage

### Basic Usage

Generate a single page of labels starting with ASN00001:

```bash
# If globally installed
asn-label-generator

# If using development mode
pnpm dev

# If using built version
node dist/main.js
```

Generate labels for a specific batch of documents:

```bash
# If globally installed
asn-label-generator --num-labels 50

# If using development mode
pnpm dev -- --num-labels 50

# If using built version
node dist/main.js --num-labels 50
```

### Common Examples

Generate labels for a large batch of documents:

```bash
# If globally installed
asn-label-generator --pages 3 --start-asn 1000

# If using development mode
pnpm dev -- --pages 3 --start-asn 1000

# If using built version
node dist/main.js --pages 3 --start-asn 1000
```

Use custom prefixes for different document types so you can easily distinguish the labels:

```bash
# If globally installed
asn-label-generator --prefixPrint "P" --digits 6  # For private documents
asn-label-generator --prefixPrint "B" --digits 6  # For business documents

# If using development mode
pnpm dev -- --prefixPrint "P" --digits 6  # For private documents
pnpm dev -- --prefixPrint "B" --digits 6  # For business documents

# If using built version
node dist/main.js --prefixPrint "P" --digits 6  # For private documents
node dist/main.js --prefixPrint "B" --digits 6  # For business documents
```

The QR code itself will still contain `ASN` followed by the number, you can set this indivuidally with the `--prefixQR` option.

Continue from a partially used sheet:

```bash
# If globally installed
asn-label-generator --skip 10

# If using development mode
pnpm dev -- --skip 10

# If using built version
node dist/main.js --skip 10
```

### Advanced Options

Test label alignment with visible borders:

```bash
# If globally installed
asn-label-generator --border

# If using development mode
pnpm dev -- --border

# If using built version
node dist/main.js --border
```

Adjust label positioning for your printer (offset values in millimeters):

```bash
# If globally installed
asn-label-generator --offset-x 0.5 --offset-y -0.2 --scale-x 0.98

# If using development mode
pnpm dev -- --offset-x 0.5 --offset-y -0.2 --scale-x 0.98

# If using built version
node dist/main.js --offset-x 0.5 --offset-y -0.2 --scale-x 0.98
```

As an example, my Brother HL-L2350DW printer requires the following adjustments to manage to print the label content in the middle of each label:

```bash
# If globally installed
asn-label-generator --offset-x 0 --offset-y -0.5 --scale-x 1.0 --scale-y 0.994475

# If using development mode
pnpm dev -- --offset-x 0 --offset-y -0.5 --scale-x 1.0 --scale-y 0.994475

# If using built version
node dist/main.js --offset-x 0 --offset-y -0.5 --scale-x 1.0 --scale-y 0.994475
```

### All Available Options

```txt
Options:
  -p, --pages <number>     number of pages (default: 1)
  -n, --num-labels <number> number of labels (overrides --pages)
  -o, --output-file <file> output file path (default: "labels.pdf")
  -s, --start-asn <number> starting ASN number (default: 1)
  -b, --border            draw borders for testing
  -t, --top-down          order labels by column instead of by row
  -d, --digits <number>   digits in number (default: 5)
  --prefixQR <text>       prefix for labels embedded in the QR code (default: "ASN")
  --prefixPrint <text>    prefix for labels printed on the label (default: "ASN")
  --skip <number>         skip first N labels (default: 0)
  --format <format>       label format (default: "averyL4731")
  --offset-x <mm>         x offset in mm (default: 0)
  --offset-y <mm>         y offset in mm (default: 0)
  --scale-x <factor>      x scale factor (default: 1)
  --scale-y <factor>      y scale factor (default: 1)
  --margin-x <mm>         x margin in mm (default: 1)
  --margin-y <mm>         y margin in mm (default: 1)
  -h, --help             display help information
```

## Development

### CLI Development
```bash
# Run CLI in development mode
pnpm dev -- [options]

# Build CLI for production
pnpm build
```

### Code Quality
```bash
# Run linting and formatting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the terms of the MIT license.