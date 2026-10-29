import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Single-file build: swap '/placeholders/…' paths in source for data URIs. */
function inlinePlaceholders(): Plugin {
  const types: Record<string, string> = { svg: 'image/svg+xml', pdf: 'application/pdf' };
  return {
    name: 'inline-placeholders',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/src/') || !code.includes('/placeholders/')) return;
      return code.replace(/(['"`])\/placeholders\/([\w.-]+)\.(svg|pdf)\1/g, (_m, q, name, ext) => {
        const data = readFileSync(new URL(`./public/placeholders/${name}.${ext}`, import.meta.url)).toString('base64');
        return `${q}data:${types[ext]};base64,${data}${q}`;
      });
    },
    transformIndexHtml(html) {
      const icon = readFileSync(new URL('./public/favicon.svg', import.meta.url)).toString('base64');
      return html.replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${icon}"`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [inlinePlaceholders(), viteSingleFile()] : [])],
  publicDir: mode === 'single' ? false : 'public',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Keep the motion runtime in its own long-cached chunk; GSAP is only
        // ever reached through dynamic import() so it splits on its own.
        manualChunks: mode === 'single' ? undefined : { motion: ['framer-motion'] },
      },
    },
  },
}));
