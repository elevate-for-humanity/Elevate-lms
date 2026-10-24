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
    // Mark the existing remote as a partial clone so checkout lazily retrieves
    // only required blobs. Never fetch a full history of retired video assets.
    await run(['config', 'remote.origin.promisor', 'true']);
    await run(['config', 'remote.origin.partialclonefilter', 'blob:none']);
    await run(['fetch', '--filter=blob:none', '--no-tags', 'origin', branch, '--prune']);
    await run(['checkout', branch]);
    // Merge exactly the fetched revision. A second pull would fetch it again
    // without the blob filter. Fast-forward checks preserve divergent work.
    await run(['merge', '--ff-only', 'FETCH_HEAD']);
  }
  const { stdout } = await run(['rev-parse', 'HEAD']);
  return { ok: true, branch, sha: stdout.trim() };
}
