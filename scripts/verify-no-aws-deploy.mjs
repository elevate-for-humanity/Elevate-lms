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

if (failed) {
  process.exit(1);
}
console.log('✅ No AWS ECS deploy artifacts; Google deployment workflows present.');
