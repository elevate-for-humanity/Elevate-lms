import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);

/** Fetch commits and trees without historical media blobs; preserve local edits. */
export async function syncWorkspaceRepository({ root, repoUrl, branch = 'main' }) {
  if (!repoUrl) throw new Error('repository_not_configured');
  await fs.mkdir(root, { recursive: true });
  const run = args => execute('git', args, {
    cwd: root, timeout: 120000, maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  const exists = await fs.stat(path.join(root, '.git')).then(() => true, () => false);
  if (!exists) {
    if ((await fs.readdir(root)).length) throw new Error('workspace_not_empty');
    await run(['clone', '--filter=blob:none', '--depth', '1', '--branch', branch, repoUrl, '.']);
  } else {
    // An unchanged remote is a read-only operation. Rewriting Git config and
    // FETCH_HEAD on every reconnect forces a full durable workspace upload.
    const { stdout: advertised } = await run(['ls-remote', '--exit-code', '--heads', 'origin', 'refs/heads/' + branch]);
    const [remoteSha, remoteRef] = advertised.trim().split(/\s+/);
    const localSha = await run(['rev-parse', '--verify', 'HEAD']).then(result => result.stdout.trim(), () => '');
    const localBranch = await run(['symbolic-ref', '--quiet', '--short', 'HEAD']).then(result => result.stdout.trim(), () => '');
    if (/^[a-f0-9]{40,64}$/.test(remoteSha || '') && remoteRef === 'refs/heads/' + branch &&
        localSha === remoteSha && localBranch === branch)
      return { ok: true, branch, sha: remoteSha, changed: false };
    const configure = async (key, value) => {
      let current;
      try { current = (await run(['config', '--get', key])).stdout.trim(); }
      catch (error) { if (error.code !== 1) throw error; }
      if (current !== value) await run(['config', key, value]);
    };
    // Mark the existing remote as a partial clone so checkout lazily retrieves
    // only required blobs. Never fetch a full history of retired video assets.
    await configure('remote.origin.promisor', 'true');
    await configure('remote.origin.partialclonefilter', 'blob:none');
    await run(['fetch', '--filter=blob:none', '--no-tags', 'origin', branch, '--prune']);
    await run(['checkout', branch]);
    // Merge exactly the fetched revision. A second pull would fetch it again
    // without the blob filter. Fast-forward checks preserve divergent work.
    await run(['merge', '--ff-only', 'FETCH_HEAD']);
  }
  const { stdout } = await run(['rev-parse', 'HEAD']);
  return { ok: true, branch, sha: stdout.trim(), changed: true };
}
