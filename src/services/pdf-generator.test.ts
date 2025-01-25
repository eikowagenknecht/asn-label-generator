import { existsSync, unlinkSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PDFGenerator } from "../../src/services/pdf-generator";

describe("PDFGenerator", () => {
  const testFile = "test-labels.pdf";

  beforeEach(() => {
    // Clean up any existing test file
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  it("should generate a PDF file", async () => {
    const generator = new PDFGenerator({
      format: "averyL4731",
      debug: true,
    });

    generator.renderEmptyLabels(10);
    await generator.save(testFile);

    expect(existsSync(testFile)).toBe(true);
  });

  it("should throw error for invalid format", () => {
    expect(() => {
      new PDFGenerator({
        format: "invalidFormat",
      });
    }).toThrow("Unknown label format: invalidFormat");
  });
});
