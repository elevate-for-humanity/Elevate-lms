#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,120}$/;
const GH_API = 'https://api.github.com';

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function validateBranch(value, label) {
  if (!BRANCH_RE.test(value) || value.includes('..') || value.startsWith('/') || value.endsWith('/')) {
    throw new Error(`${label} contains invalid branch characters: ${value}`);
  }
  return value;
}

function token() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null;
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

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    timeout: options.timeout ?? 120_000,
    maxBuffer: 100 * 1024 * 1024,
    encoding: options.encoding ?? 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

async function gh(path, authToken, init = {}) {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 600)}`);
  return res.json();
}

function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, '/');
}

function parseDiffNameStatus(output) {
  return output.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('\t');
    const status = parts[0] || '';
    if (status.startsWith('R')) return { status: 'R', oldPath: parts[1], path: parts[2] };
    return { status: status[0], path: parts[1] };
  }).filter((entry) => entry.path);
}

async function createBlob(repo, authToken, content) {
  const blob = await gh(`/repos/${repo}/git/blobs`, authToken, {
    method: 'POST',
    body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
  });
  return blob.sha;
}

async function main() {
  const authToken = token();
  if (!authToken) throw new Error('Missing GITHUB_TOKEN, GH_TOKEN, or GITHUB_PAT.');

  const repo = argValue('--repo', process.env.GITHUB_REPO || DEFAULT_REPO);
  const source = validateBranch(argValue('--source', git(['branch', '--show-current'], { encoding: 'utf8' }).trim() || 'work'), 'source');
  const target = validateBranch(argValue('--target', process.env.GITHUB_BRANCH || 'main'), 'target');
  const message = argValue('--message', `Promote ${source} to ${target} from Dev Studio`);
  const dryRun = process.argv.includes('--dry-run');

  git(['rev-parse', '--is-inside-work-tree']);
  const sourceSha = git(['rev-parse', source], { encoding: 'utf8' }).trim();
  const targetRef = await gh(`/repos/${repo}/git/ref/heads/${encodePath(target)}`, authToken);
  const targetSha = targetRef.object.sha;
  const targetCommit = await gh(`/repos/${repo}/git/commits/${targetSha}`, authToken);

  let diffOutput = '';
  try {
    diffOutput = git(['diff', '--name-status', '--find-renames', `${targetSha}..${sourceSha}`], { encoding: 'utf8', timeout: 180_000 }).trim();
  } catch (error) {
    throw new Error(`Could not diff local ${sourceSha} against GitHub ${target} (${targetSha}). Ensure this checkout contains the target branch history. ${error.message}`);
  }

  const entries = parseDiffNameStatus(diffOutput);
  console.log(`Promoting ${repo}: ${source}@${sourceSha.slice(0, 7)} → ${target}@${targetSha.slice(0, 7)}`);
  console.log(`Changed paths: ${entries.length}`);
  if (!entries.length) {
    console.log('No changes to promote.');
    return;
  }
  if (dryRun) {
    for (const entry of entries.slice(0, 80)) console.log(`${entry.status}\t${entry.oldPath ? `${entry.oldPath} -> ` : ''}${entry.path}`);
    if (entries.length > 80) console.log(`... ${entries.length - 80} more`);
    return;
  }

  const tree = [];
  for (const entry of entries) {
    if (entry.status === 'R' && entry.oldPath) tree.push({ path: entry.oldPath, sha: null });
    if (entry.status === 'D') {
      tree.push({ path: entry.path, sha: null });
      continue;
    }
    const modeLine = git(['ls-tree', sourceSha, '--', entry.path], { encoding: 'utf8' }).trim();
    const mode = modeLine.split(/\s+/)[0] || '100644';
    const content = git(['show', `${sourceSha}:${entry.path}`], { encoding: 'buffer', timeout: 180_000 });
    const sha = await createBlob(repo, authToken, content);
    tree.push({ path: entry.path, mode, type: 'blob', sha });
  }

  const newTree = await gh(`/repos/${repo}/git/trees`, authToken, {
    method: 'POST',
    body: JSON.stringify({ base_tree: targetCommit.tree.sha, tree }),
  });
  const newCommit = await gh(`/repos/${repo}/git/commits`, authToken, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [targetSha] }),
  });
  await gh(`/repos/${repo}/git/refs/heads/${encodePath(target)}`, authToken, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
  console.log(`✅ Promoted ${entries.length} changed paths to ${target}: ${newCommit.sha}`);
}

main().catch((error) => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
