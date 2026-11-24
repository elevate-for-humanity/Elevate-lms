import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { partitionValidator, typecheckPlan } from './typecheck-next-app.mjs';

const script = fileURLToPath(new URL('./typecheck-next-app.mjs', import.meta.url));
test('every generated block survives exactly once with original line positions and common types', () => {
  const text = 'export {};\ntype Expected = string;\n{ const a: Expected = "a"; }\n{ const b: Expected = "b"; }\n';
  const groups = partitionValidator(text, 1);
  assert.equal(groups.length, 2);
  assert.equal(groups.filter(group => group.includes('const a')).length, 1);
  assert.equal(groups.filter(group => group.includes('const b')).length, 1);
  for (const group of groups) {
    assert.equal(group.length, text.length);
    assert.equal(group.split('\n').length, text.split('\n').length);
    assert.ok(group.startsWith('export {};\ntype Expected = string;'));
  }
});
test('configured roots are covered once and global scripts survive every group', async () => fixture(async cwd => {
  const names = Array.from({ length: 7 }, (_, n) => join(cwd, `source${n}.ts`));
  for (const file of names) await writeFile(file, 'export const value = 1;');
  const global = join(cwd, 'global.ts');
  await writeFile(global, 'declare const sharedGlobal: string;');
  const plan = typecheckPlan({ fileNames: [global, ...names] }, 3);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.flatMap(job => job.files.filter(file => file !== global)), names);
  assert.ok(plan.every(job => job.files.includes(global)));
}));

async function fixture(run) {
  const cwd = await mkdtemp(join(tmpdir(), 'bounded-types-'));
  try {
    await mkdir(join(cwd, '.next/types'), { recursive: true });
    await mkdir(join(cwd, 'app'));
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: true, types: [], target: 'es2020', moduleResolution: 'node' }, include: ['app/**/*.ts', '.next/types/**/*.ts'] }));
    await writeFile(join(cwd, 'app/page.ts'), 'export default function page(): string { return "ok"; }');
    await run(cwd);
  } finally { await rm(cwd, { recursive: true, force: true }); }
}
function execute(cwd) { return spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', timeout: 60000 }); }

test('a signature error in the last generated partition fails the complete check', async () => fixture(async cwd => {
  const header = 'export {};\ntype Expected = {default: () => string};\n';
  const good = '{ type Check<T extends Expected> = T; type Result = Check<typeof import("../../app/page")>; }\n';
  const bad = '{ type Check<T extends {default: () => number}> = T; type Result = Check<typeof import("../../app/page")>; }\n';
  await writeFile(join(cwd, '.next/types/validator.ts'), header + good.repeat(300) + bad);
  const result = execute(cwd);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stdout, /checking group 3\/3/);
  assert.match(result.stderr, /validator.ts/);
  assert.match(result.stderr, /string.*number/s);
}));
test('valid generated signatures pass and source errors still fail', async () => fixture(async cwd => {
  await writeFile(join(cwd, '.next/types/validator.ts'), 'export {};\n{ type Check<T extends {default: () => string}> = T; type Result = Check<typeof import("../../app/page")>; }');
  assert.equal(execute(cwd).status, 0);
  await writeFile(join(cwd, 'app/other.ts'), 'const bad: number = "invalid"; export {};');
  const result = execute(cwd);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /other.ts/);
}));

test('transitive ambient declarations are preserved across every compiler group', async () => fixture(async cwd => {
  await mkdir(join(cwd, 'shared'));
  const ambient = join(cwd, 'shared/ambient.ts');
  await writeFile(ambient, 'export {}; declare global { var globalFromDependency: string; }');
  await writeFile(join(cwd, 'app/importer.ts'), 'import "../shared/ambient";');
  await writeFile(join(cwd, 'app/page.ts'), 'export default function page(): string { return globalFromDependency; }');
  const planFile = join(cwd, 'plan.json');
  const result = spawnSync(process.execPath, [script, '--prepare', planFile], { cwd, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(await readFile(planFile, 'utf8'));
  assert.ok(plan.jobs.every(job => job.files.includes(ambient)));
  assert.equal(execute(cwd).status, 0);
}));
