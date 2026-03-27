import { defineConfig } from 'vite';

export default defineConfig({
  base: '/aqua-quence-app/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    outDir: 'dist',
  }
});
