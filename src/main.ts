#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { cliOptionsSchema } from "./cli/options";
import { labelInfo } from "./config/avery-labels";
import { PDFGenerator } from "./services/pdf-generator";
import type { LabelGeneratorOptions } from "./types/label-info";

const parsePositiveIntArg = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new InvalidArgumentError("Value must be a positive number.");
  }
  return parsed;
};

const parseFloatArg = (value: string): number => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    throw new InvalidArgumentError("Value must be a number.");
  }
  return parsed;
};

const program = new Command()
  .name("label-generator")
  .description(
    "CLI Tool for generating labels with QR codes.\nSee https://github.com/eikowagenknecht/asn-label-generator for more information.",
  )
  .option(
    "-p, --pages <number>",
    "number of pages. Ignored if number of labels is set",
    parsePositiveIntArg,
    1,
  )
  .option(
    "-n, --num-labels <number>",
    "number of labels. If this is set, --pages is ignored",
    parsePositiveIntArg,
  )
  .option("-o, --output-file <file>", "output file path", "labels.pdf")
  .option(
    "-s, --start-asn <number>",
    "starting ASN number",
    parsePositiveIntArg,
    1,
  )
  .option("-b, --border", "draw borders", false)
  .option("-t, --top-down", "order labels by col instead of by row", false)
  .option("-d, --digits <number>", "digits in number", parsePositiveIntArg, 6)
  .option(
    "--prefixQR <text>",
    "prefix for labels embedded in the QR code",
    "ASN",
  )
  .option(
    "--prefixPrint <text>",
    "prefix for labels printed on the label",
    "ASN",
  )
  .option("--skip <number>", "skip first N labels", parsePositiveIntArg, 0)
  .option(
    "--format <format>",
    'label format to use. currently only "averyL4731" is supported. create an issue if you need another one.',
    "averyL4731",
  )
  .option("--offset-x <mm>", "x offset in mm", parseFloatArg, 0)
  .option("--offset-y <mm>", "y offset in mm", parseFloatArg, 0)
  .option("--scale-x <factor>", "x scale factor", parseFloatArg, 1)
  .option("--scale-y <factor>", "y scale factor", parseFloatArg, 1)
  .option("--margin-x <mm>", "x margin in mm", parseFloatArg, 1)
  .option("--margin-y <mm>", "y margin in mm", parseFloatArg, 1);

async function main(): Promise<void> {
  program.parse();
  const opts = program.opts();

  try {
    const validatedOptions = cliOptionsSchema.parse(opts);

    const generatorOptions: LabelGeneratorOptions = {
      format: validatedOptions.format,
      border: validatedOptions.border,
      topDown: validatedOptions.topDown,
      startAsn: validatedOptions.startAsn,
      digits: validatedOptions.digits,
      prefixQR: validatedOptions.prefixQR,
      prefixPrint: validatedOptions.prefixPrint,
      offset: { x: validatedOptions.offsetX, y: validatedOptions.offsetY },
      scale: { x: validatedOptions.scaleX, y: validatedOptions.scaleY },
      margin: { x: validatedOptions.marginX, y: validatedOptions.marginY },
      skip: validatedOptions.skip,
    };

    const generator = new PDFGenerator(generatorOptions);

    const labelFormat = labelInfo[validatedOptions.format];
    if (!labelFormat) {
      throw new Error(`Unknown label format: ${validatedOptions.format}`);
    }

    const labelsPerPage = labelFormat.labelsX * labelFormat.labelsY;
    const count =
      validatedOptions.numLabels ?? validatedOptions.pages * labelsPerPage;

    await generator.renderLabels(count);
    await generator.save(validatedOptions.outputFile);
    console.log(`Saved to ${validatedOptions.outputFile}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
