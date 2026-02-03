import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./src/manifest.json";

export default defineConfig({
  // Chrome 扩展需要使用相对路径
  base: "./",
  plugins: [
    react(),
    crx({ manifest: manifest as chrome.runtime.ManifestV3 }),
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
      output: {
        // 避免 chunk 文件名以下划线开头（Chrome 扩展不允许）
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // 如果文件名以下划线开头，去掉下划线
          const safeName = name.startsWith("_") ? name.slice(1) : name;
          return `assets/${safeName}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || "";
          const safeName = name.startsWith("_") ? name.slice(1) : name;
          return `assets/${safeName}-[hash].[ext]`;
        },
      },
    },
  },
});
