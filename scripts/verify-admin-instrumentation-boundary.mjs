#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const file = 'apps/admin/instrumentation.ts';
const source = await readFile(file, 'utf8');

const forbidden = [
  'lib/video/background-worker',
  'lib/video/process-video-job',
  'lib/video/remotion-render',
  'lib/video/upload-lesson-media',
  'fs/promises',
  "from 'os'",
  'from "os"',
  "from 'path'",
  'from "path"',
  '@remotion/bundler',
  '@rspack/binding',
];

const violations = forbidden.filter((token) => source.includes(token));
if (violations.length) {
  console.error(
    `[verify-admin-instrumentation-boundary] Admin instrumentation imports Node-only rendering dependencies: ${violations.join(', ')}`,
  );
  console.error('Run video rendering from a dedicated server worker entry, never from Next instrumentation.');
  process.exit(1);
}

if (!source.includes("process.env.NEXT_RUNTIME !== 'nodejs'")) {
  console.error('[verify-admin-instrumentation-boundary] Missing explicit nodejs runtime boundary.');
  process.exit(1);
}

console.info('[verify-admin-instrumentation-boundary] Admin instrumentation is web-build safe.');
