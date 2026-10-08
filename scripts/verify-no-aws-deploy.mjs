#!/usr/bin/env node
/**
 * CI guard: production deploy must be Google Cloud Run only (no AWS ECS artifacts or workflows).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const workflowDir = '.github/workflows';
const forbiddenInWorkflows = [
  /deploy-aws\.yml$/,
  /amazon-ecs/,
  /aws-actions\/configure-aws-credentials/,
  /elevate-cluster/,
  /AWS_ACCESS_KEY_ID.*deploy/i,
];

const forbiddenRepoPaths = [
  'aws',
  'aws/ecs-task-lms.json',
  'aws/ecs-task-admin.json',
  'aws/buildspec-lms.yml',
  'aws/buildspec-admin.yml',
  '.github/workflows/deploy-aws.yml',
  'Dockerfile.package',
  // Dockerfile.admin is allowed for standard Docker container builds.
];

let failed = false;
for (const file of readdirSync(workflowDir)) {
  if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
  const text = readFileSync(join(workflowDir, file), 'utf8');
  for (const pattern of forbiddenInWorkflows) {
    if (pattern.test(file) || pattern.test(text)) {
      console.error(`❌ ${file}: matches forbidden AWS deploy pattern ${pattern}`);
      failed = true;
    }
  }
}

for (const path of forbiddenRepoPaths) {
  if (existsSync(path)) {
    console.error(`❌ forbidden AWS/ECS artifact still in repo: ${path}`);
    failed = true;
  }
}

const required = [
  '.github/workflows/deploy-admin.yml',
  '.github/workflows/deploy-google-marketing-trigger.yml',
  'Dockerfile.northflank-admin',
];
for (const path of required) {
  if (!existsSync(path)) {
    console.error(`❌ missing required Google deployment artifact: ${path}`);
    failed = true;
  }
}

// Google ownership contract: an operational deployment entrypoint must never
// reintroduce a Northflank API call or the removed production webhook path.
// Migration inventories are intentionally retained until cutover acceptance.
const googleOwnedEntrypoints = [
  '.github/workflows/deploy-admin.yml',
  '.github/workflows/deploy-google-marketing-trigger.yml',
  'apps/admin/app/api/admin/env-vars/deploy/route.ts',
  'apps/admin/app/api/admin/dev-studio/builds/route.ts',
  'apps/admin/app/api/admin/dev-studio/shell/route.ts',
  'apps/admin/app/api/admin/dev-studio/autofix/route.ts',
  'lib/admin/publish-website.ts',
  'lib/gcp/dispatch-production-workflow.ts',
  'supabase/functions/autopilot-worker/index.ts',
];
for (const file of googleOwnedEntrypoints) {
  if (!existsSync(file)) {
    console.error('Missing canonical Google-owned entrypoint: ' + file);
    failed = true;
    continue;
  }
  const source = readFileSync(file, 'utf8');
  if (/api\\.northflank\\.com|triggerNorthflankBuild|trigger-northflank\\.sh|scripts\\/northflank\\/(?:trigger|deploy|restart)/i.test(source)) {
    console.error('Legacy Northflank execution path in Google-owned entrypoint: ' + file);
    failed = true;
  }
}
for (const legacy of [
  'northflank-trigger-dispatch.yml', 'deploy-lms.yml', 'deploy-marketing.yml',
  'recover-marketing.yml', 'elevate-production-deploy.yml',
  'force-admin-remotion-deploy.yml', 'restart-admin-renderer.yml',
  'repair-llm-runtime.yml', 'wait-admin-video-runtime.yml',
]) {
  if (existsSync(join(workflowDir, legacy))) {
    console.error('Retired Northflank deployment workflow reintroduced: ' + legacy);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('✅ No AWS ECS deploy artifacts; Google deployment workflows present.');
