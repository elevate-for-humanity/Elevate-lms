/**
 * Prune build-time-only and browser-only packages from .next/standalone (LMS).
 *
 * IMPORTANT: standalone/node_modules is the RUNTIME bundle. Only remove
 * packages that are 100% never needed at request time. If a package is in
 * serverExternalPackages it is loaded via require() at runtime — do NOT
 * remove it from standalone unless outputFileTracingExcludes already omitted it.
 *
 * Admin builds use scripts/prune-admin-standalone.mjs (keeps Remotion).
 */

import { resolve } from 'path';
import { pruneStandaloneNodeModules } from './prune-standalone-lib.mjs';

const STANDALONE_NODE_MODULES = resolve('.next/standalone/node_modules');

const LMS_PRUNE_PACKAGES = [
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  'remotion',
  '@remotion',
  'edge-tts',
  'ffmpeg-static',
  '@ffmpeg',
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
  'pdfkit',
  'fontkit',
  'hyphen',
  'mediabunny',
  'pdf-parse',
  '@sentry/cli',
  'prettier',
  'es-toolkit',
  'web-streams-polyfill',
  '@rspack',
  'typescript',
  'eslint',
  '@typescript-eslint',
  'vitest',
  'jest',
  '@jest',
  '@storybook',
  'jsdom',
  'happy-dom',
  '@sentry/cli-linux-x64',
  '@webcontainer',
  'yjs',
  'y-protocols',
  'lib0',
];

await pruneStandaloneNodeModules(STANDALONE_NODE_MODULES, LMS_PRUNE_PACKAGES, 'prune-standalone');
