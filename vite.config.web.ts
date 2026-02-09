import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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

  plugins: [react(), tailwindcss()],

  build: {
    // Disable source maps for smaller output
    sourcemap: false,

    // Output directory
    outDir: "dist-web",

    // Optimize rollup options
    rollupOptions: {
      external: [
        // Don't bundle these - we don't use them
        "html2canvas",
        "canvg",
        "dompurify",
      ],
      output: {
        // Use consistent naming for assets
        entryFileNames: "asn-label-generator.js",
        chunkFileNames: "asn-label-generator-[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith(".css")) {
            return "asn-label-generator.css";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },

  // Development server configuration
  server: {
    open: true,
  },
});
