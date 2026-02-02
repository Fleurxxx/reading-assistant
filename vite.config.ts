import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./src/manifest.json";

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest as any }),
    // Plugin to copy content.css after build
    {
      name: "copy-content-css",
      closeBundle() {
        const distDir = path.resolve(__dirname, "dist/src/content");
        mkdirSync(distDir, { recursive: true });
        copyFileSync(
          path.resolve(__dirname, "src/content/content.css"),
          path.resolve(distDir, "content.css")
        );
        console.log("✓ Copied content.css to dist/src/content/");
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: "src/sidepanel/sidepanel.html",
        popup: "src/popup/popup.html",
        options: "src/options/options.html",
      },
    },
  },
});
