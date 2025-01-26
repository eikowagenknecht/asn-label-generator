import QRCode from "qrcode";

export async function generateQRCodeBuffer(
  text: string,
  size: number,
): Promise<Buffer> {
  // Use a larger base size for better quality, PDFKit will scale it down
  const scaleFactor = 4;
  return QRCode.toBuffer(text, {
    width: size * scaleFactor,
    margin: 0,
    scale: 1,
    type: "png",
  });
}
