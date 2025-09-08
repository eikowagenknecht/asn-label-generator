import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  // Resolve @/ to the source root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],

  build: {
    // Disable source maps for smaller output
    sourcemap: false,
    
    // Output directory
    outDir: "dist-web",
    
    // Optimize rollup for single file
    rollupOptions: {
      external: [
        // Don't bundle these - we don't use them
        'html2canvas',
        'canvg',
        'dompurify',
      ],
    },
  },

  // Development server configuration
  server: {
    open: true,
  },
});