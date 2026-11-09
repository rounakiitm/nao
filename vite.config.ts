import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ensures assets load cleanly on GitHub Pages subpaths as well as localhost
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
