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

const POINTS_PER_MM = 2.83465;

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
      x: options.offset.x * POINTS_PER_MM,
      y: options.offset.y * POINTS_PER_MM,
    };
    this.margin = {
      x: options.margin.x * POINTS_PER_MM,
      y: options.margin.y * POINTS_PER_MM,
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
    const fontSize = 2 * POINTS_PER_MM; // 2mm font size

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
      labelX + 1 * POINTS_PER_MM,
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
        labelX + qrScaledSize + 2 * POINTS_PER_MM,
        labelY + (scaledHeight - fontSize) / 2,
        {
          width:
            scaledWidth - qrScaledSize - 3 * POINTS_PER_MM - this.margin.x * 2,
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
    const totalCount = count;
    const fullPages = Math.floor(totalCount / labelsPerPage);
    const remainingLabels = totalCount % labelsPerPage;

    if (this.skip >= labelsPerPage) {
      throw new Error("Skip value is larger than labels per page.");
    }

    // Render full pages
    for (let page = 0; page < fullPages; page++) {
      if (page > 0) {
        this.doc.addPage();
      }

      // Skip labels if needed on the first page
      const startIdx = page === 0 ? this.skip : 0;
      for (let i = startIdx; i < labelsPerPage; i++) {
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

    const actualCount = totalCount - this.skip;
    const totalPages = fullPages + (remainingLabels > 0 ? 1 : 0);
    console.log(
      `Rendered ${actualCount.toFixed()} labels on ${totalPages.toFixed()} pages.`,
    );
  }
}
