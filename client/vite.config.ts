import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.npm_config_github_pages === 'true';
const base = isGitHubPages ? '/KnowYourScales/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'github-pages',
      closeBundle() {
        if (!isGitHubPages) return;
        const dist = path.resolve(__dirname, 'dist');
        fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
        fs.writeFileSync(path.join(dist, '.nojekyll'), '');
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
