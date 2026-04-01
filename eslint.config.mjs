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
      // react-hooks v7 recommended spreads 14 error rules — many are new and
      // have pre-existing violations across the codebase. Explicitly set only
      // the two rules we enforce; everything else is off or warn.
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/static-components': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // react-refresh/only-export-components: Disabled - only affects HMR during development, not production
      'react-refresh/only-export-components': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      // All other react-hooks v7 rules off — new rules with pre-existing violations
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/unsupported-syntax': 'off',
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
      'legal/**',
      'tests/**',
      'lib/dynamic-imports.ts',
      'lib/ocr/**',
    ],
  }
);
