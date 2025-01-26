/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // Resolve @/ to the source root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Generate source maps for better debugging
    sourcemap: true,

    lib: {
      // Set the entry point
      entry: "src/main.ts",
      // The name of your CLI tool
      name: "asn-label-generator",
      // The formats to build
      formats: ["es"],
      // The name of the output file
      fileName: "main",
    },
    // Rollup specific options
    rollupOptions: {
      // External packages that shouldn't be bundled
      external: [
        // Node.js built-in modules
        "node:fs",
        "node:path",
        "node:fs/promises",
        // Dependencies from package.json
        "commander",
        "pdfkit",
        "qrcode",
        "zod",
      ],
    },
  },
  test: {
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "tests/**/*.?(c|m)[jt]s?(x)"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
    },
  },
});
