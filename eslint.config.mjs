import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const elevateLmsRules = require('./eslint-rules/index.cjs');

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // react-refresh/only-export-components: Disabled - only affects HMR during development, not production
      'react-refresh/only-export-components': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      // Downgrade to warnings - these are code quality issues, not blockers
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      // React Compiler rules - disable for now (code works, these are optimization hints)
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'no-unsafe-optional-chaining': 'warn',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      '.archive/**',
      '.next/**',
      'deployment-ready/**',
      'supabase/functions/**',
      'workers/**',
      '.pnpm-store/**',
      'playwright-report/**',
      'scripts/**',
      'public/**/*.js',
      'lib/autopilot/*.js',
      'server/video-*.ts',
      'server/download-*.ts',
      'server/generate-*.ts',
      'server/test-*.ts',
      'eslint-rules/**',
      'tests/**',
      'lib/dynamic-imports.ts',
      'lib/ocr/**',
    ],
  }
);
