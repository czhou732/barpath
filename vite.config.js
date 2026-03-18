import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/barpath/' : '/',
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
    host: true,
    allowedHosts: 'all',
  },
  build: {
    outDir: 'dist',
  },
});
