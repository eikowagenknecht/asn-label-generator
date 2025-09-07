export interface Point {
  x: number;
  y: number;
}

export interface Spacing {
  x: number;
  y: number;
}

export interface ScaleFactor {
  x: number;
  y: number;
}

interface DimensionsInMm {
  width: number;
  height: number;
}

interface PageMarginsInMm {
  top: number;
  left: number;
}

export interface LabelInfo {
  numLabels: Spacing;
  labelSizeInMm: DimensionsInMm;
  gutterSizeInMm: Spacing;
  marginInMm: PageMarginsInMm;
  pageFormat: string;
}

export interface LabelPosition {
  x: number;
  y: number;
}

export interface LabelGeneratorOptions {
  format: string;
  border: boolean;
  topDown: boolean;
  offset: Point;
  scale: ScaleFactor;
  margin: Spacing;
  skip: number;
  startAsn: number;
  digits: number;
  prefixQR: string;
  prefixPrint: string;
}
