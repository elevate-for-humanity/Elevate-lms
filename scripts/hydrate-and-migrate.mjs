#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    const { hydrateProcessEnv } = await import('../lib/secrets.ts');
    await hydrateProcessEnv();
  } catch (e) {
    console.warn('Secrets hydration skipped:', e instanceof Error ? e.message : e);
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key.startsWith('eyJ')) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing or placeholder — cannot run migrations.');
    process.exit(1);
  }

  const child = spawn(process.execPath, [path.join(__dirname, 'db/runMigrations.js')], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

main();
