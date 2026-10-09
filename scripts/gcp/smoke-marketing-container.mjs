import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const sha = process.env.GITHUB_SHA;
assert.match(sha ?? '', /^[a-f0-9]{40}$/);
const image = `elevate-marketing:${sha}`;
const name = `marketing-smoke-${process.env.GITHUB_RUN_ID || process.pid}`;
const docker = args => execFileSync('docker', args, { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let started = false;
try {
  // Resolve dependencies and assets inside the final image, as its runtime user.
  docker(['run', '--rm', '--entrypoint=node', image, '-e', `
    const fs=require('fs');
    for(const file of ['/app/apps/marketing/server.js','/app/apps/marketing/.next/BUILD_ID','/app/apps/marketing/public/version.json','/app/apps/marketing/public/data/hero-banners.json']) {
      if(!fs.statSync(file).size) throw new Error('Missing runtime file: '+file);
    }
    for(const pkg of ['next','react','react-dom','styled-jsx/style']) require.resolve(pkg,{paths:['/app/apps/marketing']});
    const version=JSON.parse(fs.readFileSync('/app/apps/marketing/public/version.json','utf8'));
    if(version.commit!==process.env.GIT_SHA) throw new Error('Packaged version mismatch');
  `]);
  docker(['run', '-d', '--name', name, '-p', '127.0.0.1::3000',
    '--env', 'PORT=3000', '--env', 'HOSTNAME=0.0.0.0',
    '--env', 'NEXT_PUBLIC_SUPABASE_URL', '--env', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', image]);
  started = true;
  const port = docker(['port', name, '3000/tcp']).split(':').at(-1);
  assert.match(port, /^\d+$/);
  const root = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    assert.equal(docker(['inspect', '--format={{.State.Running}}', name]), 'true', 'Container exited during startup');
    try {
      const response = await fetch(root + '/api/ping', { redirect: 'manual', signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      ready = response.status === 200 && body.ok === true && body.service === 'marketing' && body.commit === sha;
      if (ready) break;
    } catch { /* A bounded wait allows the real server to initialize. */ }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  assert.ok(ready, 'Packaged server did not start within 120 seconds');
  for (const host of ['169.254.1.1:3000', '10.0.0.2:3000', 'customer.example', 'acme.app.elevateforhumanity.org']) {
    for (const path of ['/api/ping', '/api/ready', '/api/health']) {
      const response = await fetch(root + path, { headers: { host }, redirect: 'manual', signal: AbortSignal.timeout(10000) });
      if (path === '/api/health') assert.ok([200, 503].includes(response.status), 'Dependency health must return its real status');
      else assert.equal(response.status, 200, `${host}${path} must reach the service endpoint`);
      const body = await response.json();
      assert.equal(body.service, 'marketing');
      assert.equal(body.commit, sha);
      assert.equal(path === '/api/ping' ? body.ok : body.ready, true);
    }
  }
  const version = await fetch(root + '/version.json', { signal: AbortSignal.timeout(10000) });
  assert.equal(version.status, 200);
  assert.equal((await version.json()).commit, sha);
  console.log('Final Marketing image dependencies, assets, startup and internal-host health routing verified.');
} catch (error) {
  // Do not export raw application logs or runtime environment values from CI.
  console.error('Marketing container smoke test failed:', error.message);
  if (started) console.error('Container state:', docker(['inspect', '--format={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}', name]));
  process.exitCode = 1;
} finally {
  if (started) { try { docker(['rm', '-f', name]); } catch { console.error('Smoke container cleanup failed'); process.exitCode = 1; } }
}
