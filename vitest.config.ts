import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // tsconfig.json uses "jsx": "preserve" for Next.js, but Vitest/esbuild needs
  // to transform JSX itself. Override here so all .tsx/.jsx files get the
  // automatic React 17+ runtime injected without requiring `import React`.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Only include unit tests in the unit folder
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: ['node_modules', 'tests/e2e/**', '**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // server-only is a Next.js compile-time guard that throws when imported
      // outside the server bundle. Map it to an empty shim so unit tests
      // can import engine files that contain `import 'server-only'` without
      // crashing. Tests never run in a real server context.
      'server-only': path.resolve(__dirname, 'tests/shims/server-only.ts'),
    },
  },
});
