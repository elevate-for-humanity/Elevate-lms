#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';

function readText(path) {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function check(name, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.info(`${icon} ${name}${detail ? `: ${detail}` : ''}`);
}

const packageJson = JSON.parse(readText('package.json') || '{}');
const scripts = packageJson.scripts || {};
const envText = readText('.env') + '\n' + readText('.env.local');
const wrangler = readText('wrangler.toml') || readText('cloudflare-workers/wrangler.toml');

const buildConfigured = typeof scripts.build === 'string' && scripts.build.length > 0;
const supabaseConfigured =
  /NEXT_PUBLIC_SUPABASE_URL=/.test(envText) &&
  /NEXT_PUBLIC_SUPABASE_ANON_KEY=/.test(envText) &&
  /SUPABASE_SERVICE_ROLE_KEY=/.test(envText);
const northflankConfigured =
  existsSync('Dockerfile.northflank-lms') &&
  existsSync('Dockerfile.northflank-admin') &&
  existsSync('scripts/northflank/configure-services.ts') &&
  existsSync('.github/workflows/deploy-lms.yml') &&
  existsSync('.github/workflows/deploy-admin.yml');
const cloudflareConfigured =
  (existsSync('wrangler.toml') || existsSync('cloudflare-workers/wrangler.toml')) &&
  /name\s*=\s*/.test(wrangler) &&
  (/account_id\s*=\s*/.test(wrangler) || /CLOUDFLARE_ACCOUNT_ID=/.test(envText));

console.info('Integration Audit Summary');
console.info('=========================');
check('Build script', buildConfigured, buildConfigured ? 'configured' : 'missing');
check('Supabase envs', supabaseConfigured, supabaseConfigured ? 'configured' : 'incomplete');
check('Northflank deploy', northflankConfigured, northflankConfigured ? 'configured' : 'incomplete');
check(
  'Cloudflare worker config',
  cloudflareConfigured,
  cloudflareConfigured ? 'configured' : 'incomplete',
);

const allOk = buildConfigured && supabaseConfigured && northflankConfigured && cloudflareConfigured;
console.info('');
check('Overall integration readiness', allOk, allOk ? 'PASS' : 'ACTION NEEDED');
process.exit(allOk ? 0 : 1);
