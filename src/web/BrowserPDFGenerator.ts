import { PDFGeneratorBase } from "@/lib/pdf-generator-base";

export class BrowserPDFGenerator extends PDFGeneratorBase {
  public override save(filename: string): Promise<void> {
    return new Promise<void>((resolve) => {
      // Generate PDF buffer - use the same method as the parent class
      const pdfBuffer = this.doc.output("arraybuffer");

      // Create a blob from the buffer
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.append(link);
      link.click();

      // Clean up
      link.remove();
      URL.revokeObjectURL(url);

      resolve();
    });
  }
}
