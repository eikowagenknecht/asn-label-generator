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
    // Generate source maps for better debugging
    sourcemap: true,
    
    // Output as single HTML file
    outDir: "dist-web",
    
    // Inline all assets
    assetsInlineLimit: 100000000, // 100MB - ensure everything is inlined
    
    rollupOptions: {
      input: "index.html",
      output: {
        // Single file output
        inlineDynamicImports: true,
      },
    },
  },

  // Development server configuration
  server: {
    open: true,
  },
});