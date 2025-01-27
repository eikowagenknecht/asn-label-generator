import QRCode from "qrcode";

export async function generateQRCodeBuffer(
  text: string,
  size: number,
): Promise<Buffer> {
  // Use a larger base size for better quality, otherwise the QR code will not be readable
  const scaleFactor = 8;

  return QRCode.toBuffer(text, {
    width: size * scaleFactor,
    margin: 0,
    scale: 1,
    type: "png",
  });
}
