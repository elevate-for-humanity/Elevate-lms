/**
 * Prune build-time and browser-only packages from apps/admin/.next/standalone.
 *
 * Unlike scripts/prune-standalone.mjs (LMS), this keeps Remotion + rspack +
 * edge-tts because /api/admin/generate-lesson-videos loads lib/video/remotion-render
 * at runtime on the admin container.
 *
 * Usage (from repo root, after apps/admin next build):
 *   node scripts/prune-admin-standalone.mjs
 */

import { pruneStandaloneNodeModules } from './prune-standalone-lib.mjs';
import { resolve } from 'path';

const STANDALONE_NODE_MODULES = resolve('apps/admin/.next/standalone/node_modules');

/** Packages safe to drop from admin runtime — never imported by admin API routes. */
const ADMIN_PRUNE_PACKAGES = [
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  '@esbuild',
  'esbuild',
  'webpack',
  'webpack-sources',
  '@swc/core',
  '@swc/cli',
  'puppeteer',
  'puppeteer-core',
  'playwright',
  'playwright-core',
  'chromium-bidi',
  '@playwright',
  '@sparticuz',
  'chrome-aws-lambda',
  'three',
  'three-stdlib',
  '@react-three',
  '@dimforge',
  'hls.js',
  'video.js',
  '@videojs',
  '@mediapipe',
  'monaco-editor',
  '@monaco-editor',
  'lucide-react',
  'recharts',
  'html2canvas',
  'node-pty',
  'canvas',
  '@napi-rs',
  'jspdf',
  'pdfjs-dist',
  'fontkit',
  'hyphen',
  'mediabunny',
  '@sentry/cli-linux-x64',
  '@sentry/cli',
  '@webcontainer',
  'yjs',
  'y-protocols',
  'lib0',
  'typescript',
  'prettier',
  'eslint',
  '@typescript-eslint',
  'vitest',
  'jest',
  '@jest',
  '@storybook',
  'jsdom',
  'happy-dom',
  'es-toolkit',
  'web-streams-polyfill',
];

await pruneStandaloneNodeModules(STANDALONE_NODE_MODULES, ADMIN_PRUNE_PACKAGES, 'prune-admin-standalone');
