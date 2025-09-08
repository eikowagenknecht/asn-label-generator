import { jsPDF } from "jspdf";
import { labelInfo } from "../config/avery-labels";
import type {
  LabelGeneratorOptions,
  LabelInfo,
  LabelPosition,
  Point,
  ScaleFactor,
  Spacing,
} from "../types/label-info";
import { MM_TO_POINTS } from "../util/const";
import { generateQRCodeDataURL } from "./qr-renderer";

export abstract class PDFGeneratorBase {
  protected readonly doc: jsPDF;
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

    // jsPDF works in mm by default, so no conversion needed for offsets and margins
    this.offset = {
      x: options.offset.x,
      y: options.offset.y,
    };
    this.margin = {
      x: options.margin.x,
      y: options.margin.y,
    };

    // Create jsPDF document using the configured page format
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: this.labelInfo.pageFormat.toLowerCase(),
    });
  }

  private calculatePosition(index: number): LabelPosition {
    let x: number;
    let y: number;

    if (this.topDown) {
      x = Math.floor(index / this.labelInfo.numLabels.y);
      y = index % this.labelInfo.numLabels.y;
    } else {
      x = index % this.labelInfo.numLabels.x;
      y = Math.floor(index / this.labelInfo.numLabels.x);
    }

    return {
      x:
        this.labelInfo.marginInMm.left +
        x *
          (this.labelInfo.labelSizeInMm.width +
            this.labelInfo.gutterSizeInMm.x),
      y:
        this.labelInfo.marginInMm.top +
        y *
          (this.labelInfo.labelSizeInMm.height +
            this.labelInfo.gutterSizeInMm.y),
    };
  }

  private drawDebugBorder(pos: LabelPosition): void {
    if (this.border) {
      // Scale the dimensions independently
      const width = this.labelInfo.labelSizeInMm.width * this.scale.x;
      const height = this.labelInfo.labelSizeInMm.height * this.scale.y;
      const x = pos.x * this.scale.x + this.offset.x;
      const y = pos.y * this.scale.y + this.offset.y;

      this.doc.rect(x, y, width, height, "S");
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

    const outerHeight = this.labelInfo.labelSizeInMm.height * this.scale.y;
    const outerWidth = this.labelInfo.labelSizeInMm.width * this.scale.x;
    const innerHeight = outerHeight - this.margin.y * 2 * this.scale.y;
    const innerWidth = outerWidth - this.margin.x * 2 * this.scale.x;

    // Don't render if the label is outside the page (jsPDF page dimensions in mm)
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();
    if (
      outerX + outerWidth > pageWidth ||
      outerY + outerHeight > pageHeight ||
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

    // Generate QR code data URL at natural size
    const qrDataURL = await generateQRCodeDataURL(textQR);

    // Draw QR code with independent x/y scaling
    this.doc.addImage(qrDataURL, "PNG", innerX, innerY, qrWidth, qrHeight);

    const gutter = 2 * this.scale.x; // 2mm gutter
    const maxTextWidth = innerWidth - qrWidth - gutter;

    // Calculate font size based on available space
    // jsPDF text width estimation is different from PDFKit
    const testFontSize = 10;
    this.doc.setFontSize(testFontSize);
    const testWidth = this.doc.getTextWidth(textPrint);
    const fontSize = Math.max(
      6,
      (maxTextWidth / testWidth) * testFontSize * 0.95,
    );

    this.doc.setFontSize(fontSize);

    // Calculate text position
    const centerY = innerY + innerHeight / 2;
    const textStartX = innerX + qrWidth + gutter;
    const textStartY = centerY + (fontSize * 0.38) / MM_TO_POINTS; // Convert to mm

    // Draw text
    this.doc.text(textPrint, textStartX, textStartY);

    this.currentAsn += 1;
  }

  public abstract save(outputPath: string): Promise<void>;

  public async renderLabels(
    count: number,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const labelsPerPage =
      this.labelInfo.numLabels.x * this.labelInfo.numLabels.y;
    const totalPages = Math.ceil(count / labelsPerPage);

    // We'll render labels from index 'skip' up to 'count'
    let currentPage = 0;
    for (let labelIndex = this.skip; labelIndex < count; labelIndex++) {
      // Report progress
      if (onProgress) {
        const progress =
          ((labelIndex - this.skip + 1) / (count - this.skip)) * 100;
        onProgress(Math.min(progress, 100));
      }

      // Determine which page this label belongs on
      const pageNumber = Math.floor(labelIndex / labelsPerPage);

      // Add pages as needed
      while (currentPage <= pageNumber) {
        if (currentPage > 0) {
          this.doc.addPage();
        }
        currentPage++;
      }

      // Calculate the position within the current page
      const positionOnPage = labelIndex % labelsPerPage;
      const position = this.calculatePosition(positionOnPage);
      await this.renderLabel(position);

      // Add small delay every 50 labels to allow UI updates
      if (labelIndex % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const renderedLabels = count - this.skip;
    console.log(
      `Rendered ${renderedLabels.toFixed()} labels on ${totalPages.toFixed()} pages.`,
    );
  }
}
