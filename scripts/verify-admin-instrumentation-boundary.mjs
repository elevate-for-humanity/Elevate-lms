#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const instrumentationFile = 'apps/admin/instrumentation.ts';
const executorFile = 'lib/agentic/executor.ts';
const instrumentation = await readFile(instrumentationFile, 'utf8');
const executor = await readFile(executorFile, 'utf8');

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

const violations = forbidden.filter((token) => instrumentation.includes(token));
if (violations.length) {
  console.error(
    `[verify-admin-instrumentation-boundary] Admin instrumentation imports Node-only rendering dependencies: ${violations.join(', ')}`,
  );
  console.error('Keep heavy rendering dependencies behind the canonical agentic executor/domain worker boundary.');
  process.exit(1);
}

if (!instrumentation.includes("process.env.NEXT_RUNTIME !== 'nodejs'")) {
  console.error('[verify-admin-instrumentation-boundary] Missing explicit nodejs runtime boundary.');
  process.exit(1);
}

if (!instrumentation.includes("process.env.ELEVATE_SERVICE === 'admin'")) {
  console.error('[verify-admin-instrumentation-boundary] Missing explicit Admin-service boundary for agentic execution.');
  process.exit(1);
}

if (!instrumentation.includes("import('../../lib/agentic/executor')") || !instrumentation.includes('startAgenticExecutor()')) {
  console.error('[verify-admin-instrumentation-boundary] Admin runtime does not start the canonical agentic executor.');
  process.exit(1);
}

const executorContracts = [
  "import { processCourseAgenticTask } from './course-executor'",
  "['marketing_campaign', 'course'].includes(project.target_type)",
  "project.target_type === 'course'",
  'processCourseAgenticTask',
  ".eq('status', 'queued')",
  'claimTask(task.id)',
];

const missingExecutorContracts = executorContracts.filter((token) => !executor.includes(token));
if (missingExecutorContracts.length) {
  console.error(
    `[verify-admin-instrumentation-boundary] Canonical agentic course dispatch regressed: ${missingExecutorContracts.join(', ')}`,
  );
  process.exit(1);
}

console.info('[verify-admin-instrumentation-boundary] Admin instrumentation is web-build safe and starts canonical course/marketing agentic execution.');
