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

const program = new Command()
  .name("label-generator")
  .description("CLI Tool for generating labels with QR codes")
  .option("--start-asn <number>", "Starting ASN number", parseIntOption)
  .option("-f, --format <format>", "Label format to use", "averyL4731")
  .option("-o, --output-file <file>", "Output file path", "labels.pdf")
  .option("-d, --debug", "Show debug borders", false)
  .option(
    "-r, --row-wise",
    "Process labels row by row instead of column by column",
    true,
  )
  .option(
    "-n, --num-labels <number>",
    "Number of labels to generate",
    parseIntOption,
  )
  .option(
    "-p, --pages <number>",
    "Number of pages to generate",
    parseIntOption,
    1,
  )
  .option(
    "--digits <number>",
    "Number of digits in ASN (e.g., 7 produces 'ASN0000001')",
    parseIntOption,
    7,
  );

async function main(): Promise<void> {
  program.parse();
  const options = program.opts();

  try {
    const validatedOptions = cliOptionsSchema.parse(options);

    const generatorOptions: LabelGeneratorOptions = {
      format: validatedOptions.format,
      debug: validatedOptions.debug,
      topDown: !validatedOptions.rowWise,
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

    const startAsn = validatedOptions.startAsn;
    const digits = validatedOptions.digits;

    generator.renderLabels(count, {
      text: `ASN${startAsn.toString().padStart(digits, "0")}`,
      fontSize: 12,
    });

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
