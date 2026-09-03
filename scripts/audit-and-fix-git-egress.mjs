#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_REMOTE = `https://github.com/${DEFAULT_REPO}.git`;

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function boolArg(name) {
  return process.argv.includes(name);
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

function run(cmd, args, options = {}) {
  try {
    const out = execFileSync(cmd, args, {
      cwd: process.cwd(),
      timeout: options.timeout ?? 30_000,
      encoding: 'utf8',
      env: { ...process.env, ...(options.env || {}), GIT_TERMINAL_PROMPT: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: redact(out.trim()) };
  } catch (error) {
    return { ok: false, output: redact(`${error.stdout || ''}${error.stderr || ''}${error.message || ''}`.trim()) };
  }
}

async function fetchProbe(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 12_000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return { ok: res.ok, status: res.status, statusText: res.statusText };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function configureGit(remoteUrl) {
  const inside = run('git', ['rev-parse', '--is-inside-work-tree']);
  if (!inside.ok) return { ok: false, output: inside.output };
  run('git', ['config', 'user.name', process.env.GIT_AUTHOR_NAME || 'Elevate Codex']);
  run('git', ['config', 'user.email', process.env.GIT_AUTHOR_EMAIL || 'elevate4humanityedu@gmail.com']);
  const remotes = run('git', ['remote']);
  if (remotes.output.split('\n').includes('origin')) run('git', ['remote', 'set-url', 'origin', remoteUrl]);
  else run('git', ['remote', 'add', 'origin', remoteUrl]);
  return { ok: true, output: `origin=${remoteUrl}` };
}

async function main() {
  const fixGit = boolArg('--fix-git');
  const strict = boolArg('--strict');
  const remoteUrl = argValue('--remote', process.env.GITHUB_REMOTE_URL || DEFAULT_REMOTE);
  const report = {
    cwd: process.cwd(),
    hasDotGit: existsSync(join(process.cwd(), '.git')),
    proxy: {
      HTTP_PROXY: !!process.env.HTTP_PROXY || !!process.env.http_proxy,
      HTTPS_PROXY: !!process.env.HTTPS_PROXY || !!process.env.https_proxy,
      NO_PROXY: process.env.NO_PROXY || process.env.no_proxy || '',
    },
    git: {},
    probes: {},
    fix: null,
  };

  report.git.insideWorkTree = run('git', ['rev-parse', '--is-inside-work-tree']);
  report.git.branch = run('git', ['branch', '--show-current']);
  report.git.head = run('git', ['rev-parse', '--short', 'HEAD']);
  report.git.remoteBefore = run('git', ['remote', '-v']);
  if (fixGit) report.fix = configureGit(remoteUrl);
  report.git.remoteAfter = run('git', ['remote', '-v']);

  report.probes.dnsGithub = run('getent', ['hosts', 'github.com']);
  report.probes.dnsGitHubApi = run('getent', ['hosts', 'api.github.com']);
  report.probes.gitLsRemoteProxy = run('git', ['ls-remote', remoteUrl, 'HEAD'], { timeout: 20_000 });
  report.probes.gitLsRemoteNoProxy = run('git', ['ls-remote', remoteUrl, 'HEAD'], {
    timeout: 20_000,
    env: { HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '', http_proxy: '', https_proxy: '', all_proxy: '' },
  });
  report.probes.fetchGitHubApi = await fetchProbe('https://api.github.com');

  const blocked = [report.probes.gitLsRemoteProxy, report.probes.gitLsRemoteNoProxy, report.probes.fetchGitHubApi]
    .some((probe) => !probe.ok);
  report.recommendation = blocked
    ? 'Container egress is blocked or DNS is unavailable. Use scripts/github-promote-local-head.mjs from a runner with GitHub API egress, or run Dev Studio Push Main in production with GITHUB_TOKEN configured.'
    : 'Container egress is available. git push and GitHub API promotion can run from this container.';

  console.log(JSON.stringify(report, null, 2));
  if (strict && blocked) process.exitCode = 1;
}

main().catch((error) => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
