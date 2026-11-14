import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Ubuntu 24.04's maintained runner image ships SDK 586.0.0. Do not make
// every dispatch depend on downloading an unbounded latest release.
export function verifySdk(version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Google SDK version unavailable');
  if (Number(version.split('.')[0]) < 586) throw new Error('Google SDK 586.0.0 or newer required for the verified migration commands');
  return { version, passed: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const info = JSON.parse(execFileSync('gcloud', ['version', '--format=json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }));
    console.log(JSON.stringify(verifySdk(info['Google Cloud SDK'])));
  } catch { console.error('Compatible runner-supplied Google SDK is required; no cloud resource was changed.'); process.exitCode = 1; }
}
