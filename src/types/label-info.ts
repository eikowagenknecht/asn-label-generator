// Size measurements are in points (1/72 inch) for PDFKit compatibility
interface LabelDimensions {
  width: number;
  height: number;
}

interface LabelSpacing {
  horizontal: number;
  vertical: number;
}

interface PageMargins {
  top: number;
  left: number;
}

export interface LabelInfo {
  // Number of labels in each direction
  labelsHorizontal: number;
  labelsVertical: number;

  // Size of each individual label
  labelSize: LabelDimensions;

  // Space between labels
  gutterSize: LabelSpacing;

  // Page margins
  margin: PageMargins;

  // Page size in points
  pageSize: [number, number];
}

export interface LabelPosition {
  x: number;
  y: number;
}

export interface LabelGeneratorOptions {
  format: string;
  debug?: boolean;
  topDown?: boolean;
}
