import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["logo-192.png", "logo-512.png"],

      manifest: {
        name: "Panella Manager",
        short_name: "Panella",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0d1b2a",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/logo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      // 🛠️ FIX ABSOLUTO PARA TU ERROR
      strategies: "generateSW",

      workbox: {
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024, // 40 MB
        cleanupOutdatedCaches: true,
        sourcemap: false,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
