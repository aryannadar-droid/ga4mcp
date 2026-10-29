import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Keep the motion runtime in its own long-cached chunk; GSAP is only
        // ever reached through dynamic import() so it splits on its own.
        manualChunks: { motion: ['framer-motion'] },
      },
    },
  },
});
