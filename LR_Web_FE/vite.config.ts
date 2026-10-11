import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from "@tailwindcss/vite";
import http from 'node:http';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function autoCompressPlugin(): Plugin {
  const triggerSync = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      const req = http.get('http://localhost:8080/api/AutoCompress.php?action=sync', { timeout: 3000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        exec('docker exec lrdance_php php /var/www/html/api/AutoCompress.php', () => resolve());
      });
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });
    });
  };

  return {
    name: 'vite-plugin-autocompress',
    async buildStart() {
      await triggerSync();
    },
    configureServer(server) {
      server.middlewares.use(async (req, _res, next) => {
        const url = req.url?.split('?')[0] || '';
        if (url.startsWith('/assets/imgs/') && /_[123]\.webp$/.test(url)) {
          const filePath = path.join(process.cwd(), 'public', url);
          if (!fs.existsSync(filePath)) {
            await triggerSync();
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    autoCompressPlugin(),
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
