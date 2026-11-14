#!/usr/bin/env tsx
/** Try to set elevate-admin branch to main (multiple API path variants). */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function tryPatch(label: string, path: string) {
  try {
    await nfFetch(path, {
      method: 'PATCH',
      body: JSON.stringify({ vcsData: { projectBranch: 'main' } }),
    });
    console.log('OK', label, path);
    return true;
  } catch (e) {
    console.log('FAIL', label, e instanceof Error ? e.message.slice(0, 100) : e);
    return false;
  }
}

async function main() {
  const pid = resolveProjectId()!;
  const sid = 'elevate-admin';
  const paths = [
    ['team projectApiPath', projectApiPath(pid, `/services/${sid}`)],
    ['no team', `/projects/${pid}/services/${sid}`],
  ];
  for (const [label, path] of paths) {
    if (await tryPatch(label, path)) {
      const build = await nfFetch(projectApiPath(pid, `/services/${sid}/build`), {
        method: 'POST',
        body: '{}',
      });
      console.log('Triggered build:', build);
      return;
    }
  }
  process.exit(1);
}

main();
