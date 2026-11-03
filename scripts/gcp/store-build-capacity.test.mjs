import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';

const workflow = yaml.load(readFileSync(new URL('../../.github/workflows/deploy-google-store-runtime.yml', import.meta.url), 'utf8'));

test('Store image compilation uses a fresh runner after required source validation', () => {
  const preflight = workflow.jobs['preflight-store'];
  const build = workflow.jobs['build-store'];
  assert.ok(build.needs.includes('preflight-store'));
  assert.ok(build.needs.includes('validate'));
  assert.ok(!build.if.includes('always()'));
  const validateCommands = preflight.steps.map(step => step.run ?? '').join('\n');
  assert.match(validateCommands, /pnpm install --frozen-lockfile/);
  assert.match(validateCommands, /pnpm run typecheck:marketing/);
  assert.match(validateCommands, /pnpm run test:store-delivery/);
  const buildCommands = build.steps.map(step => step.run ?? '').join('\n');
  assert.doesNotMatch(buildCommands, /pnpm install|pnpm run typecheck|download-artifact/);
  assert.match(buildCommands, /docker build -f Dockerfile.marketing/);
  assert.match(buildCommands, /smoke-marketing-container.mjs/);
});

test('public Docker builder inherits the dependency graph without copying it again', () => {
  const dockerfile = readFileSync(new URL('../../Dockerfile.marketing', import.meta.url), 'utf8');
  const builder = dockerfile.split('FROM dependencies AS builder')[1]?.split(/\nFROM /)[0];
  assert.ok(builder, 'public build must inherit the installed dependency layer');
  assert.doesNotMatch(builder, /COPY --from=dependencies/);
  assert.match(builder, /pnpm --filter @elevate\/marketing build/);
  const boundedRunner = readFileSync(new URL('../run-bounded-build.mjs', import.meta.url), 'utf8');
  assert.match(boundedRunner, /4 \* 1024/);
});
