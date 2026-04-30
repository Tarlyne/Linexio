import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Ensure we always have a string for the API key to prevent SDK crashes in browser
  const apiKey = env.GEMINI_API_KEY || 'MISSING_API_KEY_PLACEHOLDER';

  return {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        devOptions: {
          enabled: true, // Prevents the manifest 404 error during npm run dev
        },
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['favicon_v2.png', 'apple-touch-icon_v2.png', 'logo192_v2.png', 'logo512_v2.png', 'splash-universal.png', 'splash.png'],
        manifest: {
          short_name: "Linexio",
          name: "Linexio - Der Lehrer-Assistent",
          icons: [
            {
              src: "logo192_v2.png",
              type: "image/png",
              sizes: "192x192",
              purpose: "any"
            },
            {
              src: "logo512_v2.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "any"
            },
            {
              src: "logo512_v2.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "maskable"
            }
          ],
          start_url: "/",
          display: "standalone",
          theme_color: "#1f2937",
          background_color: "#111827"
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          cleanupOutdatedCaches: true,
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true
    }
  };
});