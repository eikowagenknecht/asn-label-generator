import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { labelInfo } from "../config/avery-labels";
import type {
  LabelGeneratorOptions,
  LabelInfo,
  LabelPosition,
} from "../types/label-info";

export interface RenderOptions {
  text: string;
  fontSize?: number;
}

export class PDFGenerator {
  private readonly doc: PDFKit.PDFDocument;
  private readonly labelInfo: LabelInfo;
  private readonly topDown: boolean;
  private readonly debug: boolean;

  constructor(options: LabelGeneratorOptions) {
    const chosenLabel = labelInfo[options.format];

    if (!chosenLabel) {
      throw new Error(`Unknown label format: ${options.format}`);
    }
    this.labelInfo = chosenLabel;

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

  private renderLabel(pos: LabelPosition, options: RenderOptions): void {
    this.drawDebugBorder(pos);

    const fontSize = options.fontSize ?? 10;
    const text = options.text;

    this.doc
      .font("Helvetica")
      .fontSize(fontSize)
      .text(
        text,
        pos.x,
        pos.y + this.labelInfo.labelSize.height / 2 - fontSize / 2,
        {
          width: this.labelInfo.labelSize.width,
          align: "center",
        },
      );
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

  public renderLabels(count: number, options: RenderOptions): void {
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
        this.renderLabel(pos, options);
      }
    }

    // Render remaining labels on the last page if any
    if (remainingLabels > 0) {
      if (fullPages > 0) {
        this.doc.addPage();
      }
      for (let i = 0; i < remainingLabels; i++) {
        const pos = this.calculatePosition(i);
        this.renderLabel(pos, options);
      }
    }

    const totalPages = fullPages + (remainingLabels > 0 ? 1 : 0);
    console.log(
      `Rendered ${count.toFixed()} labels on ${totalPages.toFixed()} pages.`,
    );
  }

  public renderEmptyLabels(count: number): void {
    this.renderLabels(count, { text: "" });
  }
}
