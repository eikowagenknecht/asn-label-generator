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
  .description("CLI Tool for generating labels with QR codes")
  .option(
    "-s, --start-asn <number>",
    "Starting ASN number",
    parsePositiveIntArg,
    1,
  )
  .option("-n, --num-labels <number>", "Number of labels", parsePositiveIntArg)
  .option(
    "-p, --pages <number>",
    "Number of pages. Ignored if number of labels is set.",
    parsePositiveIntArg,
    1,
  )
  .option("--skip <number>", "Skip first N labels", parsePositiveIntArg, 0)
  .option("-f, --format <format>", "Label format to use", "averyL4731")
  .option("-o, --output-file <file>", "Output file path", "labels.pdf")
  .option("--border", "Draw borders", false)
  .option("--top-down", "Order labels by col instead of by row", false)
  .option("--digits <number>", "Digits in number", parsePositiveIntArg, 5)
  .option("--prefix <text>", "Prefix for labels", "ASN")
  .option("--offset-x <mm>", "X offset in mm", parseFloatArg, 0)
  .option("--offset-y <mm>", "Y offset in mm", parseFloatArg, 0)
  .option("--scale-x <factor>", "X scale factor", parseFloatArg, 1)
  .option("--scale-y <factor>", "Y scale factor", parseFloatArg, 1)
  .option("--margin-x <mm>", "X margin in mm", parseFloatArg, 2)
  .option("--margin-y <mm>", "Y margin in mm", parseFloatArg, 2);

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
      prefix: validatedOptions.prefix,
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
