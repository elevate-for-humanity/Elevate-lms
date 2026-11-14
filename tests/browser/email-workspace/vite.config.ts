import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '../../..') } },
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 4179, strictPort: true },
});
