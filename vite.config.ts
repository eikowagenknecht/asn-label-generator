import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Resolve @/ to the source root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  plugins: [tailwindcss()],

  build: {
    // Generate source maps for better debugging
    sourcemap: true,

    lib: {
      // Set the entry point
      entry: "src/cli/main.ts",
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
        "jspdf",
        "qrcode",
        "zod",
      ],
    },
  },
});
