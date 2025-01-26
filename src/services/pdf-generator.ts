import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { labelInfo } from "../config/avery-labels";
import { generateQRCodeBuffer } from "./qr-renderer";
import type {
  LabelGeneratorOptions,
  LabelInfo,
  LabelPosition,
} from "../types/label-info";

const POINTS_PER_MM = 2.83465;

export class PDFGenerator {
  private readonly doc: PDFKit.PDFDocument;
  private readonly labelInfo: LabelInfo;
  private readonly topDown: boolean;
  private readonly debug: boolean;
  private currentAsn: number;
  private readonly digits: number;

  constructor(
    options: LabelGeneratorOptions & { startAsn: number; digits: number },
  ) {
    const chosenLabel = labelInfo[options.format];

    if (!chosenLabel) {
      throw new Error(`Unknown label format: ${options.format}`);
    }
    this.labelInfo = chosenLabel;
    this.currentAsn = options.startAsn;
    this.digits = options.digits;

    this.doc = new PDFDocument({
      size: this.labelInfo.pageSize,
      margin: 0,
      autoFirstPage: true,
    });

    this.topDown = options.topDown ?? true;
    this.debug = options.debug ?? false;
  }

  private calculatePosition(index: number): LabelPosition {
    let x: number;
    let y: number;

    if (this.topDown) {
      const col = Math.floor(index / this.labelInfo.labelsVertical);
      const row = index % this.labelInfo.labelsVertical;
      x = col;
      y = row;
    } else {
      const row = Math.floor(index / this.labelInfo.labelsHorizontal);
      const col = index % this.labelInfo.labelsHorizontal;
      x = col;
      y = row;
    }

    return {
      x:
        this.labelInfo.margin.left +
        x *
          (this.labelInfo.labelSize.width +
            this.labelInfo.gutterSize.horizontal),
      y:
        this.labelInfo.margin.top +
        y *
          (this.labelInfo.labelSize.height +
            this.labelInfo.gutterSize.vertical),
    };
  }

  private drawDebugBorder(pos: LabelPosition): void {
    if (this.debug) {
      this.doc
        .rect(
          pos.x,
          pos.y,
          this.labelInfo.labelSize.width,
          this.labelInfo.labelSize.height,
        )
        .stroke();
    }
  }

  private async renderLabel(pos: LabelPosition): Promise<void> {
    this.drawDebugBorder(pos);

    const text = `ASN${this.currentAsn.toString().padStart(this.digits, "0")}`;
    const fontSize = 2 * POINTS_PER_MM; // 2mm font size
    const qrSize = Math.min(
      this.labelInfo.labelSize.width,
      this.labelInfo.labelSize.height,
    );
    const qrScaledSize = qrSize * 0.9;

    // Generate QR code as PNG buffer
    const qrBuffer = await generateQRCodeBuffer(text, qrSize);

    // Draw QR code aligned to the left
    this.doc.image(
      qrBuffer,
      pos.x + 1 * POINTS_PER_MM,
      pos.y + (this.labelInfo.labelSize.height - qrScaledSize) / 2,
      {
        width: qrScaledSize,
        height: qrScaledSize,
      },
    );

    // Draw text centered vertically and to the right of the QR code
    this.doc
      .font("Helvetica")
      .fontSize(fontSize)
      .text(
        text,
        pos.x + qrScaledSize + 2 * POINTS_PER_MM,
        pos.y + (this.labelInfo.labelSize.height - fontSize) / 2,
        {
          width:
            this.labelInfo.labelSize.width - qrScaledSize - 3 * POINTS_PER_MM,
          align: "left",
          baseline: "top",
        },
      );

    this.currentAsn += 1;
  }

  public async save(outputPath: string): Promise<void> {
    const outDir = join(process.cwd(), "out");
    const fullPath = join(outDir, outputPath);

    await mkdir(outDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(fullPath);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      this.doc.pipe(writeStream);
      this.doc.end();
    });
  }

  public async renderLabels(count: number): Promise<void> {
    const labelsPerPage =
      this.labelInfo.labelsHorizontal * this.labelInfo.labelsVertical;
    const fullPages = Math.floor(count / labelsPerPage);
    const remainingLabels = count % labelsPerPage;

    // Render full pages
    for (let page = 0; page < fullPages; page++) {
      if (page > 0) {
        this.doc.addPage();
      }
      for (let i = 0; i < labelsPerPage; i++) {
        const pos = this.calculatePosition(i);
        await this.renderLabel(pos);
      }
    }

    // Render remaining labels on the last page if any
    if (remainingLabels > 0) {
      if (fullPages > 0) {
        this.doc.addPage();
      }
      for (let i = 0; i < remainingLabels; i++) {
        const pos = this.calculatePosition(i);
        await this.renderLabel(pos);
      }
    }

    const totalPages = fullPages + (remainingLabels > 0 ? 1 : 0);
    console.log(
      `Rendered ${count.toFixed()} labels on ${totalPages.toFixed()} pages.`,
    );
  }
}
