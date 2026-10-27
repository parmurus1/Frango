import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relativa: funciona tanto no GitHub Pages (/Frango/) quanto em qualquer subpasta.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
