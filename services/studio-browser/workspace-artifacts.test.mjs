import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {artifactDirectory,listArtifacts,readArtifact,createArtifact} from './workspace-artifacts.mjs';
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-files-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
test('lists and downloads exact bytes only from the authenticated owner directory',async t=>{
 const root=await fixture(t);const dir=artifactDirectory(root,'owner');await fs.mkdir(dir,{recursive:true});const bytes=Buffer.from([0,255,80,75]);await fs.writeFile(path.join(dir,'Report.xlsx'),bytes);
 assert.equal((await listArtifacts(root,'owner'))[0].name,'Report.xlsx');assert.deepEqual((await readArtifact(root,'owner','Report.xlsx')).bytes,bytes);assert.deepEqual(await listArtifacts(root,'other'),[]);
});
test('rejects traversal, credentials and symlinks instead of serving workspace secrets',async t=>{
 const root=await fixture(t),dir=artifactDirectory(root,'owner');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(root,'secret.pdf'),'private');await fs.symlink(path.join(root,'secret.pdf'),path.join(dir,'leak.pdf'));
 for(const name of ['../secret.pdf','.env','a/b.pdf','leak.pdf'])await assert.rejects(readArtifact(root,'owner',name));
 assert.deepEqual(await listArtifacts(root,'owner'),[]);
 await fs.symlink(dir,artifactDirectory(root,'other'));await assert.rejects(listArtifacts(root,'other'));
});
test('renders a new file and verifies its actual saved bytes before returning metadata',async t=>{
 const root=await fixture(t);const result=await createArtifact(root,'owner',{format:'pdf',title:'Quarterly report',content:'Actual supplied text'},async(destination,spec)=>{assert.equal(JSON.parse(spec).content,'Actual supplied text');await fs.writeFile(destination,'%PDF-fixture');});
 assert.equal(result.size,12);assert.match(result.name,/\.pdf$/);assert.equal((await listArtifacts(root,'owner')).length,1);
 await assert.rejects(createArtifact(root,'owner',{format:'exe',title:'x',content:'x'},()=>{}));
});
