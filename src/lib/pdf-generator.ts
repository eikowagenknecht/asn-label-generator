import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PDFGeneratorBase } from "./pdf-generator-base";

export class PDFGenerator extends PDFGeneratorBase {
  public override async save(outputPath: string): Promise<void> {
    const outDir = join(process.cwd(), "out");
    const fullPath = join(outDir, outputPath);

    await mkdir(outDir, { recursive: true });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(this.doc.output("arraybuffer"));

    // Write to file
    await writeFile(fullPath, pdfBuffer);
  }
}
