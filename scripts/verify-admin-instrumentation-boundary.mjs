#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const instrumentationFile = 'apps/admin/instrumentation.ts';
const executorFile = 'lib/agentic/executor.ts';
const readinessFile = 'apps/admin/app/api/ready/route.ts';
const instrumentation = await readFile(instrumentationFile, 'utf8');
const rootInstrumentation = await readFile('instrumentation.ts', 'utf8');
const executor = await readFile(executorFile, 'utf8');
const nodeInstrumentation = await readFile('apps/admin/instrumentation-node.ts', 'utf8');
const readiness = await readFile(readinessFile, 'utf8');

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
if (rootInstrumentation.includes("./lib/agentic/executor")) {
  violations.push('root instrumentation imports the Admin agentic executor');
}
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

const roleContracts = [
  'process.env.ELEVATE_SERVICE || process.env.SERVICE_ROLE',
  "serviceRole === 'admin'",
  "process.env.ELEVATE_SERVICE = 'admin'",
];
const missingRoleContracts = roleContracts.filter((token) => !instrumentation.includes(token));
if (missingRoleContracts.length) {
  console.error(
    `[verify-admin-instrumentation-boundary] Admin service-role normalization regressed: ${missingRoleContracts.join(', ')}`,
  );
  process.exit(1);
}

if (!instrumentation.includes("import('./instrumentation-node')") || !instrumentation.includes('startAdminAgenticExecutor()')) {
  console.error('[verify-admin-instrumentation-boundary] Admin runtime does not start the canonical agentic executor.');
  process.exit(1);
}

if (!nodeInstrumentation.includes("import { startAgenticExecutor } from '../../lib/agentic/executor'") || !nodeInstrumentation.includes('startAgenticExecutor()')) {
  console.error('[verify-admin-instrumentation-boundary] Node instrumentation does not start the canonical agentic executor.');
  process.exit(1);
}

if (!nodeInstrumentation.includes("process.env.ELEVATE_AGENTIC_EXECUTOR_STARTED = 'true'")) {
  console.error('[verify-admin-instrumentation-boundary] Admin runtime does not expose canonical executor startup readiness.');
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

const readinessContracts = [
  "process.env.ELEVATE_AGENTIC_EXECUTOR_STARTED === 'true'",
  "'AGENTIC_EXECUTOR'",
  'const ready = readiness.ready && agenticExecutorReady',
];
const missingReadinessContracts = readinessContracts.filter((token) => !readiness.includes(token));
if (missingReadinessContracts.length) {
  console.error(
    `[verify-admin-instrumentation-boundary] Admin readiness can go green without the agentic executor: ${missingReadinessContracts.join(', ')}`,
  );
  process.exit(1);
}

console.info('[verify-admin-instrumentation-boundary] Admin runtime normalizes service role, starts canonical course/marketing agentic execution, and cannot report ready without executor startup.');
