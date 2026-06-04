#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const CLUSTER = 'elevate-cluster';
const SERVICES = ['elevate-admin-service', 'elevate-studio-service'];
const REQUIRED_SSM = [
  '/elevate/STUDIO_SHELL_SECRET',
  '/elevate/STUDIO_TOKEN_SECRET',
  '/elevate/STUDIO_SHELL_WS_URL',
  '/elevate/STUDIO_SHELL_WS_URL_PUBLIC',
];
const REQUIRED_ENV = REQUIRED_SSM.map((name) => name.split('/').pop());
const REDEPLOY = process.argv.includes('--redeploy');

function statusIcon(status) {
  if (status === 'PASS') return '✅';
  if (status === 'FAIL') return '❌';
  return '⚠️';
}

function printResult(status, check, detail) {
  console.log(`| ${statusIcon(status)} ${status} | ${check} | ${detail.replaceAll('|', '\\|')} |`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function commandExists(command) {
  const result = run('bash', ['-lc', `command -v ${command}`]);
  return result.status === 0;
}

function taskSecretNames(taskFile) {
  const task = readJson(taskFile);
  return new Set(
    (task.containerDefinitions ?? [])
      .flatMap((container) => container.secrets ?? [])
      .map((secret) => secret.name),
  );
}

function taskSecretRefs(taskFile) {
  const task = readJson(taskFile);
  return new Set(
    (task.containerDefinitions ?? [])
      .flatMap((container) => container.secrets ?? [])
      .map((secret) => secret.valueFrom),
  );
}

function awsJson(args) {
  const result = run('aws', args);
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'aws command failed').trim());
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : {};
}

console.log('# Dev Studio Activation Check');
console.log('');
console.log(`Cluster: \`${CLUSTER}\``);
console.log(`Services: ${SERVICES.map((service) => `\`${service}\``).join(', ')}`);
console.log(`Redeploy requested: ${REDEPLOY ? '`yes`' : '`no`'}`);
console.log('');
console.log('| Status | Check | Evidence |');
console.log('| --- | --- | --- |');

const adminSecretNames = taskSecretNames('aws/ecs-task-admin.json');
for (const key of REQUIRED_ENV) {
  printResult(
    adminSecretNames.has(key) ? 'PASS' : 'FAIL',
    `Admin task definition includes ${key}`,
    adminSecretNames.has(key)
      ? 'present in aws/ecs-task-admin.json secrets'
      : 'missing from aws/ecs-task-admin.json secrets',
  );
}

const studioSecretRefs = taskSecretRefs('aws/ecs-task-studio.json');
const studioHasShellSecret = [...studioSecretRefs].some((ref) =>
  ref.endsWith('/elevate/STUDIO_SHELL_SECRET'),
);
printResult(
  studioHasShellSecret ? 'PASS' : 'FAIL',
  'Studio task receives STUDIO_SHELL_SECRET',
  studioHasShellSecret
    ? 'aws/ecs-task-studio.json maps /elevate/STUDIO_SHELL_SECRET into SHELL_SECRET'
    : 'aws/ecs-task-studio.json does not reference /elevate/STUDIO_SHELL_SECRET',
);

const workflow = fs.readFileSync('.github/workflows/deploy-studio.yml', 'utf8');
printResult(
  /ECS_SERVICE:\s+elevate-studio-service/.test(workflow) ? 'PASS' : 'FAIL',
  'Deploy workflow targets canonical studio service',
  '.github/workflows/deploy-studio.yml ECS_SERVICE should be elevate-studio-service',
);
printResult(
  /TASK_FAMILY:\s+elevate-studio/.test(workflow) &&
    workflow.includes('--task-definition $TASK_FAMILY')
    ? 'PASS'
    : 'FAIL',
  'Deploy workflow creates service from task family',
  'create-service must use task family elevate-studio, not service name',
);

const awsAvailable = commandExists('aws');
printResult(
  awsAvailable ? 'PASS' : 'BLOCKED',
  'AWS CLI available for live SSM/ECS verification',
  awsAvailable ? 'aws command found' : 'aws CLI is not installed in this environment',
);

if (awsAvailable) {
  try {
    const params = awsJson([
      'ssm',
      'get-parameters',
      '--with-decryption',
      '--names',
      ...REQUIRED_SSM,
      '--output',
      'json',
    ]);
    const found = new Set((params.Parameters ?? []).map((param) => param.Name));
    for (const name of REQUIRED_SSM) {
      printResult(
        found.has(name) ? 'PASS' : 'FAIL',
        `SSM parameter ${name}`,
        found.has(name) ? 'exists' : 'missing',
      );
    }
  } catch (error) {
    printResult('BLOCKED', 'SSM parameter verification', error.message);
  }

  try {
    const services = awsJson([
      'ecs',
      'describe-services',
      '--cluster',
      CLUSTER,
      '--services',
      ...SERVICES,
      '--output',
      'json',
    ]);
    const byName = new Map(
      (services.services ?? []).map((service) => [service.serviceName, service]),
    );
    for (const serviceName of SERVICES) {
      const service = byName.get(serviceName);
      const passing = service?.status === 'ACTIVE' && service.runningCount >= service.desiredCount;
      printResult(
        passing ? 'PASS' : 'FAIL',
        `ECS service ${serviceName}`,
        service
          ? `status=${service.status}, running=${service.runningCount}, desired=${service.desiredCount}, pending=${service.pendingCount}`
          : 'service not returned by ECS',
      );
    }
  } catch (error) {
    printResult('BLOCKED', 'ECS service verification', error.message);
  }

  if (REDEPLOY) {
    for (const serviceName of SERVICES) {
      const result = run('aws', [
        'ecs',
        'update-service',
        '--cluster',
        CLUSTER,
        '--service',
        serviceName,
        '--force-new-deployment',
        '--output',
        'json',
      ]);
      printResult(
        result.status === 0 ? 'PASS' : 'FAIL',
        `Force redeploy ${serviceName}`,
        result.status === 0
          ? 'deployment requested'
          : (result.stderr || result.stdout || 'update-service failed').trim(),
      );
    }
  }
}

console.log('');
console.log(
  'PASS requires a live terminal check in Admin → Dev Studio → Terminal that returns a shell prompt.',
);
