import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),yaml=require('js-yaml');
const root=path.resolve(import.meta.dirname,'../..');
const workflow=yaml.load(await readFile(path.join(root,'.github/workflows/paris-code-repair.yml'),'utf8'));
async function fixture(t){
 const directory=await mkdtemp(path.join(tmpdir(),'trusted-repair-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const git=(...args)=>execFileSync('git',args,{cwd:directory,encoding:'utf8'}).trim();
 git('init','-q');await writeFile(path.join(directory,'package.json'),'{}');
 await symlink(path.join(root,'node_modules'),path.join(directory,'node_modules'));
 return {directory,git,commit:()=>{git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');return git('rev-parse','HEAD');},write:async(file,body)=>{await mkdir(path.dirname(path.join(directory,file)),{recursive:true});await writeFile(path.join(directory,file),body);}};
}
test('candidate cannot replace the trusted deployment invariant implementation',async t=>{
 const f=await fixture(t);
 await f.write('lib/devstudio/infrastructure-repair.mjs',await readFile(path.join(root,'lib/devstudio/infrastructure-repair.mjs'),'utf8'));
 await f.write('.github/workflows/deploy.yml','permissions: {contents: read}\njobs: {}\n');const base=f.commit();
 await f.write('lib/devstudio/infrastructure-repair.mjs','export function assertDeploymentInvariants() {}');
 await f.write('.github/workflows/deploy.yml','permissions: {contents: write}\njobs: {}\n');const patch=f.commit();
 assert.throws(()=>execFileSync(process.execPath,[path.join(root,'scripts/gcp/validate-infrastructure-repair.mjs'),base,patch],{cwd:f.directory,stdio:'pipe'}),error=>error.stderr.toString().includes('Protected workflow permissions changed'));
});
test('candidate validation has no OIDC minting authority',()=>{
 assert.deepEqual(workflow.jobs.validate.permissions,{contents:'read'});
});
test('trusted workflow rejects a candidate that edits its own authorization or tests',async t=>{
 const f=await fixture(t);await f.write('lib/example.ts','export const fixed=false;');const base=f.commit();
 await f.write('lib/devstudio/paris-code-engineer.ts','export const blockedPath=()=>false;');
 await f.write('tests/regression.test.ts','test("fake",()=>{});');const patch=f.commit();
 const step=workflow.jobs.validate.steps.find(step=>step.name==='Require an application patch and a new regression test');
 const script=step.run.split("python - <<'PY'\n")[1].split('\nPY')[0];
 assert.throws(()=>execFileSync('python3',['-c',script],{cwd:f.directory,env:{...process.env,BASE_SHA:base,PATCH_SHA:patch},stdio:'pipe'}),error=>error.stderr.toString().includes('Independent repair controls require separate review'));
});
