import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { MM_TO_POINTS } from "@/util/const";
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

export class PDFGenerator {
  private readonly doc: PDFKit.PDFDocument;
  private readonly labelInfo: LabelInfo;
  private readonly topDown: boolean;
  private readonly border: boolean;
  private currentAsn: number;
  private readonly digits: number;
  private readonly prefixQR: string;
  private readonly prefixPrint: string;
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
    this.prefixQR = options.prefixQR;
    this.prefixPrint = options.prefixPrint;
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
      x = Math.floor(index / this.labelInfo.labelsY);
      y = index % this.labelInfo.labelsY;
    } else {
      x = index % this.labelInfo.labelsX;
      y = Math.floor(index / this.labelInfo.labelsX);
    }

    return {
      x:
        this.labelInfo.margin.left +
        x * (this.labelInfo.labelSize.width + this.labelInfo.gutterSize.x),
      y:
        this.labelInfo.margin.top +
        y * (this.labelInfo.labelSize.height + this.labelInfo.gutterSize.y),
    };
  }

  private drawDebugBorder(pos: LabelPosition): void {
    if (this.border) {
      // Scale the dimensions independently
      const width = this.labelInfo.labelSize.width * this.scale.x;
      const height = this.labelInfo.labelSize.height * this.scale.y;
      const x = pos.x * this.scale.x + this.offset.x;
      const y = pos.y * this.scale.y + this.offset.y;

      this.doc.rect(x, y, width, height).stroke();
    }
  }

  private async renderLabel(pos: LabelPosition): Promise<void> {
    this.drawDebugBorder(pos);

    // Text to QR encode and render
    const textQR = `${this.prefixQR}${this.currentAsn
      .toString()
      .padStart(this.digits, "0")}`;

    const textPrint = `${this.prefixPrint}${this.currentAsn
      .toString()
      .padStart(this.digits, "0")}`;

    // Calculate scaled label basic positions
    const outerX = pos.x * this.scale.x + this.offset.x;
    const outerY = pos.y * this.scale.y + this.offset.y;
    const innerX = outerX + this.margin.x * this.scale.x;
    const innerY = outerY + this.margin.y * this.scale.y;

    const outerHeight = this.labelInfo.labelSize.height * this.scale.y;
    const outerWidth = this.labelInfo.labelSize.width * this.scale.x;
    const innerHeight = outerHeight - this.margin.y * 2 * this.scale.y;
    const innerWidth = outerWidth - this.margin.x * 2 * this.scale.x;

    // Don't render if the label is outside the page
    if (
      outerX + outerWidth > this.doc.page.width ||
      outerY + outerHeight > this.doc.page.height ||
      outerX < 0 ||
      outerY < 0
    ) {
      return;
    }

    // QR Code size and position.
    // Base size is unscaled height, as it's the limiting factor
    const qrBaseSize = innerHeight / this.scale.y;

    // Scale QR code sizes independently
    const qrWidth = qrBaseSize * this.scale.x;
    const qrHeight = qrBaseSize * this.scale.y;

    // Generate QR code buffer using the larger dimension
    const qrBuffer = await generateQRCodeBuffer(
      textQR,
      Math.max(qrHeight, qrWidth),
    );

    // Draw QR code with independent x/y scaling
    this.doc.image(qrBuffer, innerX, innerY, {
      width: qrWidth,
      height: qrHeight,
    });

    const gutter = 2 * MM_TO_POINTS * this.scale.x;
    const maxTextWidth = innerWidth - qrWidth - gutter;

    // Find out the font size based on available space
    this.doc.fontSize(1);
    // Small margin as not all characters are the same width
    const fontSize = (maxTextWidth / this.doc.widthOfString(textPrint)) * 0.95;
    this.doc.fontSize(fontSize);

    // Calculate available space for text
    const centerY = innerY + innerHeight / 2;
    const textStartX = innerX + qrWidth + gutter;
    const textStartY = centerY + fontSize * 0.38;

    // Font is always scaled in both axis, as this is not supported by PDFKit.
    // Should be good enough for small scales though.

    this.doc.font("Helvetica").text(textPrint, textStartX, textStartY, {
      width: maxTextWidth,
      align: "left",
      baseline: "alphabetic",
    });

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
