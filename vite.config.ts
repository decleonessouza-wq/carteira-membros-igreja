// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "pwa-192.png",
          "pwa-512.png",
          "apple-touch-icon.png",
          // ✅ arquivos reais em /public
          "logo_app.png",
          "marca_dagua.png",
        ],
        manifest: {
          name: "Carteira Digital de Membros",
          short_name: "Carteira",
          description: "Gerador de Carteira de Membro - Igreja Jardim de Oração",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#15803d",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
      }),
    ],
    define: {
      // Mantido por compatibilidade caso algum código ainda use process.env.*
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
