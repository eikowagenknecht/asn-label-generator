import QRCode from "qrcode";

export async function generateQRCodeDataURL(text: string): Promise<string> {
  // Generate QR code with 1 pixel per module for minimal size and perfect alignment
  // Let the QRCode library determine the natural size, then let PDF scaling handle the sizing
  return QRCode.toDataURL(text, {
    margin: 0,
    scale: 1, // 1 pixel per QR module - minimal and perfect
    type: "image/png",
  });
}
