import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { labelInfo } from "../config/avery-labels";
import type {
  LabelGeneratorOptions,
  LabelInfo,
  LabelPosition,
  Point,
  ScaleFactor,
  Spacing,
} from "../types/label-info";
import { generateQRCodeBuffer } from "./qr-renderer";
import { MM_TO_POINTS } from "@/util/const";

export class PDFGenerator {
  private readonly doc: PDFKit.PDFDocument;
  private readonly labelInfo: LabelInfo;
  private readonly topDown: boolean;
  private readonly border: boolean;
  private currentAsn: number;
  private readonly digits: number;
  private readonly prefix: string;
  private readonly offset: Point;
  private readonly scale: ScaleFactor;
  private readonly margin: Spacing;
  private readonly skip: number;

  constructor(options: LabelGeneratorOptions) {
    const chosenLabel = labelInfo[options.format];
    if (!chosenLabel) {
      throw new Error(`Unknown label format: ${options.format}`);
    }

    this.labelInfo = chosenLabel;
    this.currentAsn = options.startAsn;
    this.digits = options.digits;
    this.prefix = options.prefix;
    this.skip = options.skip;
    this.topDown = options.topDown;
    this.border = options.border;
    this.scale = options.scale;

    // Convert mm to points for offsets and margins
    this.offset = {
      x: options.offset.x * MM_TO_POINTS,
      y: options.offset.y * MM_TO_POINTS,
    };
    this.margin = {
      x: options.margin.x * MM_TO_POINTS,
      y: options.margin.y * MM_TO_POINTS,
    };

    this.doc = new PDFDocument({
      size: this.labelInfo.pageSize,
      margin: 0,
      autoFirstPage: true,
    });
  }

  private calculatePosition(index: number): LabelPosition {
    let x: number;
    let y: number;

    if (this.topDown) {
      const col = Math.floor(index / this.labelInfo.labelsY);
      const row = index % this.labelInfo.labelsY;
      x = col;
      y = row;
    } else {
      const row = Math.floor(index / this.labelInfo.labelsX);
      const col = index % this.labelInfo.labelsX;
      x = col;
      y = row;
    }

    const baseX =
      this.labelInfo.margin.left +
      x * (this.labelInfo.labelSize.width + this.labelInfo.gutterSize.x);
    const baseY =
      this.labelInfo.margin.top +
      y * (this.labelInfo.labelSize.height + this.labelInfo.gutterSize.y);

    return {
      x: baseX * this.scale.x + this.offset.x,
      y: baseY * this.scale.y + this.offset.y,
    };
  }

  private drawDebugBorder(pos: LabelPosition): void {
    if (this.border) {
      const width = this.labelInfo.labelSize.width * this.scale.x;
      const height = this.labelInfo.labelSize.height * this.scale.y;
      this.doc.rect(pos.x, pos.y, width, height).stroke();
    }
  }

  private async renderLabel(pos: LabelPosition): Promise<void> {
    this.drawDebugBorder(pos);

    const text = `${this.prefix}${this.currentAsn
      .toString()
      .padStart(this.digits, "0")}`;
    const fontSize = 2 * MM_TO_POINTS; // 2mm font size

    const scaledWidth = this.labelInfo.labelSize.width * this.scale.x;
    const scaledHeight = this.labelInfo.labelSize.height * this.scale.y;
    const qrSize = Math.min(scaledWidth, scaledHeight);
    const qrScaledSize = qrSize * 0.9;

    // Apply margins to position
    const labelX = pos.x + this.margin.x;
    const labelY = pos.y + this.margin.y;

    // Generate QR code as PNG buffer
    const qrBuffer = await generateQRCodeBuffer(text, qrSize);

    // Draw QR code aligned to the left
    this.doc.image(
      qrBuffer,
      labelX + 1 * MM_TO_POINTS,
      labelY + (scaledHeight - qrScaledSize) / 2,
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
        labelX + qrScaledSize + 2 * MM_TO_POINTS,
        labelY + (scaledHeight - fontSize) / 2,
        {
          width:
            scaledWidth - qrScaledSize - 3 * MM_TO_POINTS - this.margin.x * 2,
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
    const labelsPerPage = this.labelInfo.labelsX * this.labelInfo.labelsY;
    const totalPages = Math.ceil(count / labelsPerPage);

    // Add empty pages upfront based on skip count
    const startingPage = Math.floor(this.skip / labelsPerPage);
    for (let i = 0; i < startingPage; i++) {
      this.doc.addPage();
    }

    // We'll render labels from index 'skip' up to 'totalLabels'
    for (let labelIndex = this.skip; labelIndex < count; labelIndex++) {
      // First, determine which page this label belongs on
      const pageNumber = Math.floor(labelIndex / labelsPerPage);

      // Add a new page when needed
      if (pageNumber > 0 && labelIndex % labelsPerPage === 0) {
        this.doc.addPage();
      }

      // Calculate the position within the current page
      // By using modulo here, we ensure the position wraps within each page's grid
      const positionOnPage = labelIndex % labelsPerPage;
      const position = this.calculatePosition(positionOnPage);
      await this.renderLabel(position);
    }

    const renderedLabels = count - this.skip;
    console.log(
      `Rendered ${renderedLabels.toFixed()} labels on ${totalPages.toFixed()} pages.`,
    );
  }
}
