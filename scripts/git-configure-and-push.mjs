#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_REMOTE = `https://github.com/${DEFAULT_REPO}.git`;
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,120}$/;

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function boolArg(name) {
  return process.argv.includes(name);
}

function token() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null;
}

function validateBranch(value, label) {
  if (!BRANCH_RE.test(value) || value.includes('..') || value.startsWith('/') || value.endsWith('/')) {
    throw new Error(`${label} contains invalid branch characters: ${value}`);
  }
  return value;
}

function redact(text) {
  const secrets = [process.env.GITHUB_TOKEN, process.env.GH_TOKEN, process.env.GITHUB_PAT].filter(Boolean);
  const derived = secrets.flatMap((secret) => [
    Buffer.from(`x-access-token:${secret}`).toString('base64'),
    `x-access-token:${secret}`,
    `Authorization: Basic ${Buffer.from(`x-access-token:${secret}`).toString('base64')}`,
  ]);
  return [...secrets, ...derived].reduce((acc, secret) => acc.split(secret).join('[REDACTED]'), String(text || ''));
}

async function git(args, options = {}) {
  const { stdout, stderr } = await execFileAsync('git', args, {
    cwd: process.cwd(),
    timeout: options.timeout ?? 120_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, ...options.env },
  });
  if (!options.silent && stdout.trim()) process.stdout.write(redact(stdout));
  if (!options.silent && stderr.trim()) process.stderr.write(redact(stderr));
  return stdout.trim();
}

async function remoteExists(name) {
  const remotes = await git(['remote'], { silent: true });
  return remotes.split('\n').map((line) => line.trim()).includes(name);
}

async function main() {
  const remoteUrl = argValue('--remote', process.env.GITHUB_REMOTE_URL || DEFAULT_REMOTE);
  const target = validateBranch(argValue('--target', process.env.GITHUB_BRANCH || 'main'), 'target');
  const source = validateBranch(argValue('--source', await git(['branch', '--show-current'], { silent: true }) || 'work'), 'source');
  const name = argValue('--name', process.env.GIT_AUTHOR_NAME || 'Elevate Codex');
  const email = argValue('--email', process.env.GIT_AUTHOR_EMAIL || 'elevate4humanityedu@gmail.com');
  const dryRun = boolArg('--dry-run');

  await git(['rev-parse', '--is-inside-work-tree'], { silent: true });
  await git(['config', 'user.name', name], { silent: true });
  await git(['config', 'user.email', email], { silent: true });

  if (await remoteExists('origin')) await git(['remote', 'set-url', 'origin', remoteUrl], { silent: true });
  else await git(['remote', 'add', 'origin', remoteUrl], { silent: true });

  console.log(`Configured origin=${remoteUrl}`);
  console.log(`Configured git author=${name} <${email}>`);

  const authToken = token();
  if (!authToken) {
    console.error('Missing GITHUB_TOKEN, GH_TOKEN, or GITHUB_PAT; cannot push.');
    process.exitCode = 2;
    return;
  }

  const basicAuth = Buffer.from(`x-access-token:${authToken}`).toString('base64');
  const refspec = `${source}:${target}`;
  const args = [
    '-c',
    `http.https://github.com/.extraheader=Authorization: Basic ${basicAuth}`,
    'push',
    'origin',
    refspec,
  ];
  if (dryRun) args.splice(3, 0, '--dry-run');

  console.log(`${dryRun ? 'Dry-run pushing' : 'Pushing'} ${refspec}...`);
  await git(args);
  console.log(`✅ ${dryRun ? 'Dry-run push completed' : 'Push completed'}: ${refspec}`);
}

main().catch((error) => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
