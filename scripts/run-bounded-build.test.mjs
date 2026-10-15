import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const launcher = fileURLToPath(new URL('./run-bounded-build.mjs', import.meta.url));
function run(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [launcher, '--', process.execPath, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, output }));
  });
}

test('simultaneous build commands obtain one kernel-locked slot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'build-admission-test-'));
  try {
    const path = join(directory, 'events.txt');
    const script = `const fs=require('node:fs');const [path,id]=process.argv.slice(1);fs.appendFileSync(path,'start-'+id+'\\n');setTimeout(()=>fs.appendFileSync(path,'end-'+id+'\\n'),80);`;
    const results = await Promise.all([run(['-e', script, path, 'a']), run(['-e', script, path, 'b'], directory)]);
    for (const result of results) assert.equal(result.code, 0, result.output);
    const events = (await readFile(path, 'utf8')).trim().split('\n');
    const first = events[0].slice(6);
    const second = first === 'a' ? 'b' : 'a';
    assert.deepEqual(events, [`start-${first}`, `end-${first}`, `start-${second}`, `end-${second}`]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('child failure is propagated and releases the build slot', async () => {
  assert.equal((await run(['-e', 'process.exit(7)'])).code, 7);
  assert.equal((await run(['-e', 'console.log("released")'])).code, 0);
});
