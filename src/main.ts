#!/usr/bin/env node
import { Command } from "commander";
import { cliOptionsSchema } from "./cli/options";
import { labelInfo } from "./config/avery-labels";
import { PDFGenerator } from "./services/pdf-generator";
import type { LabelGeneratorOptions } from "./types/label-info";

const parseIntOption = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("Value must be a positive number");
  }
  return parsed;
};

const parseFloatOption = (value: string): number => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Value must be a number");
  }
  return parsed;
};

const program = new Command()
  .name("label-generator")
  .description("CLI Tool for generating labels with QR codes")
  .option("--start-asn <number>", "Starting ASN number", parseIntOption)
  .option("-f, --format <format>", "Label format to use", "averyL4731")
  .option("-o, --output-file <file>", "Output file path", "labels.pdf")
  .option("-d, --debug", "Show debug borders", false)
  .option("-r, --row-wise", "Process labels row by row", true)
  .option("-n, --num-labels <number>", "Number of labels", parseIntOption)
  .option("-p, --pages <number>", "Number of pages", parseIntOption, 1)
  .option("--digits <number>", "Digits in number", parseIntOption, 7)
  .option("--prefix <text>", "Prefix for labels", "ASN")
  .option("--offset-x <mm>", "X offset in mm", parseFloatOption, 0)
  .option("--offset-y <mm>", "Y offset in mm", parseFloatOption, 0)
  .option("--scale-x <factor>", "X scale factor", parseFloatOption, 1)
  .option("--scale-y <factor>", "Y scale factor", parseFloatOption, 1)
  .option("--margin-x <mm>", "X margin in mm", parseFloatOption, 0)
  .option("--margin-y <mm>", "Y margin in mm", parseFloatOption, 0);

async function main(): Promise<void> {
  program.parse();
  const opts = program.opts();

  try {
    const validatedOptions = cliOptionsSchema.parse(opts);

    const generatorOptions: LabelGeneratorOptions & {
      startAsn: number;
      digits: number;
      prefix: string;
    } = {
      format: validatedOptions.format,
      debug: validatedOptions.debug,
      topDown: !validatedOptions.rowWise,
      startAsn: validatedOptions.startAsn,
      digits: validatedOptions.digits,
      prefix: validatedOptions.prefix,
      offset: { x: validatedOptions.offsetX, y: validatedOptions.offsetY },
      scale: { x: validatedOptions.scaleX, y: validatedOptions.scaleY },
      margin: { x: validatedOptions.marginX, y: validatedOptions.marginY },
    };

    const generator = new PDFGenerator(generatorOptions);

    const labelFormat = labelInfo[validatedOptions.format];
    if (!labelFormat) {
      throw new Error(`Unknown label format: ${validatedOptions.format}`);
    }

    const labelsPerPage =
      labelFormat.labelsHorizontal * labelFormat.labelsVertical;
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
