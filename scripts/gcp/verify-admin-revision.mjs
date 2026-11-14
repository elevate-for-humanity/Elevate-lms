import { pathToFileURL } from 'node:url';

export async function verifyAdminRevision(base, commit, {
  request = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 24,
} = {}) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid Google Admin URL');
  if (!/^[a-f0-9]{40}$/.test(commit ?? '') || !Number.isInteger(attempts) || attempts < 1 || attempts > 24) throw new Error('Invalid Admin verification parameters');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await request(new URL('/api/health', url), {
        redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' },
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 200 && body.service === 'admin' && body.commit === commit && body.healthy === true && body.dependencies?.supabase?.ok === true) {
        return { verified: true, commit, attempts: attempt };
      }
    } catch {
      // A cold-start/network timeout consumes an attempt, not the whole budget.
    }
    if (attempt < attempts) await pause(5000);
  }
  throw new Error('Exact Google Admin revision did not become healthy within the verification budget');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyAdminRevision(process.env.GOOGLE_ADMIN_URL, process.env.GITHUB_SHA)
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
