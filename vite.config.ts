import { defineConfig } from "vite";
import { resolve } from "path";

import { mkdirSync, copyFileSync, existsSync, renameSync } from "fs";

export default defineConfig({
  base: "./",

  build: {
    outDir: "dist",

    emptyOutDir: true,

    rollupOptions: {
      input: {
        app: resolve(__dirname, "src/app/index.html"),
        welcome: resolve(__dirname, "src/welcome/index.html"),
        serviceWorker: resolve(__dirname, "src/background/service-worker.ts"),
        youtube: resolve(__dirname, "src/content/youtube.ts"),
        instagram: resolve(__dirname, "src/content/instagram.ts"),
      },

      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "serviceWorker") {
            return "background/service-worker.js";
          }

          if (chunkInfo.name === "youtube") {
            return "content/youtube.js";
          }

          if (chunkInfo.name === "instagram") {
            return "content/instagram.js";
          }

          return "assets/[name].js";
        },
      },
    },
  },

  plugins: [
    {
      name: "copy-extension-files",

      writeBundle() {
        /*
         * ==================================================
         * CONTENT
         * ==================================================
         */

        mkdirSync(resolve(__dirname, "dist/content"), {
          recursive: true,
        });

        /*
         * YouTube CSS
         */

        copyFileSync(
          resolve(__dirname, "src/content/youtube.css"),
          resolve(__dirname, "dist/content/youtube.css"),
        );

        /*
         * ==================================================
         * MANIFEST
         * ==================================================
         */

        copyFileSync(
          resolve(__dirname, "public/manifest.json"),
          resolve(__dirname, "dist/manifest.json"),
        );

        /*
         * ==================================================
         * ICONS
         * ==================================================
         */

        mkdirSync(resolve(__dirname, "dist/icons"), {
          recursive: true,
        });

        /*
         * ==================================================
         * APP
         * ==================================================
         */

        mkdirSync(resolve(__dirname, "dist/app"), {
          recursive: true,
        });

        /*
         * Vite genera inizialmente:
         *
         * dist/src/app/index.html
         *
         * Lo spostiamo in:
         *
         * dist/app/index.html
         */

        const generatedWelcome = resolve(__dirname, "dist/src/welcome/index.html");

        const targetWelcome = resolve(__dirname, "dist/welcome/index.html");

        if (existsSync(generatedWelcome)) {
          mkdirSync(resolve(__dirname, "dist/welcome"), {
            recursive: true,
          });

          renameSync(generatedWelcome, targetWelcome);
        }

        const generatedApp = resolve(__dirname, "dist/src/app/index.html");

        const targetApp = resolve(__dirname, "dist/app/index.html");

        if (existsSync(generatedApp)) {
          mkdirSync(resolve(__dirname, "dist/app"), {
            recursive: true,
          });

          renameSync(generatedApp, targetApp);
        }

        /*
         * ==================================================
         * CONTENT ASSETS
         * ==================================================
         */

        mkdirSync(resolve(__dirname, "dist/content/assets"), {
          recursive: true,
        });

        copyFileSync(
          resolve(__dirname, "src/content/assets/delete.png"),
          resolve(__dirname, "dist/content/assets/delete.png"),
        );
      },
    },
  ],
});
