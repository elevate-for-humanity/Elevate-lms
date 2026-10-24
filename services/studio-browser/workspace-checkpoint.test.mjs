import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {WorkspaceCheckpoint} from './workspace-checkpoint.mjs';
class DiskObjects{
 constructor(directory){this.directory=directory;this.generation=0;this.manifest=null;this.writes=0;}
 async readManifest(){return this.manifest?{data:Buffer.from(this.manifest),generation:String(this.generation)}:null;}
 async writeManifest(data,expected){if(String(this.generation)!==String(expected))throw Error('generation_conflict');this.writes++;this.manifest=Buffer.from(data);this.generation++;return {generation:String(this.generation)};}
 createArchiveWriteStream(name){return fs.createWriteStream(path.join(this.directory,name),{flags:'wx',mode:0o600});}
 createArchiveReadStream(name){return fs.createReadStream(path.join(this.directory,name));}
 async removeArchive(name){await fsp.unlink(path.join(this.directory,name));}
}
async function fixture(t){const directory=await fsp.mkdtemp(path.join(os.tmpdir(),'workspace-checkpoint-'));t.after(()=>fsp.rm(directory,{recursive:true,force:true}));const root=path.join(directory,'workspace'),storage=path.join(directory,'private');await fsp.mkdir(root);await fsp.mkdir(storage);const objects=new DiskObjects(storage);const config={root,objects,secret:'fixture-only-secret'};return {directory,root,storage,objects,config};}
test('binary, Unicode, hidden Git metadata, executable files and internal links survive replacement',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();await fsp.mkdir(path.join(f.root,'.git'));await fsp.writeFile(path.join(f.root,'.git','HEAD'),'ref: refs/heads/main\n');
 const bytes=Buffer.from(Array.from({length:200000},(_,i)=>i%256));await fsp.writeFile(path.join(f.root,'lesson-视频.bin'),bytes);await fsp.writeFile(path.join(f.root,'run.sh'),'echo not-replayed\n',{mode:0o755});await fsp.symlink('run.sh',path.join(f.root,'script-link'));
 const saved=await store.checkpoint();assert.equal(saved.changed,true);assert.equal(f.objects.writes,1);assert.equal((await store.checkpoint()).changed,false);
 const archive=JSON.parse(f.objects.manifest).payload.archive;assert.ok(!(await fsp.readFile(path.join(f.storage,archive))).includes(Buffer.from('not-replayed')));
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await new WorkspaceCheckpoint(f.config).initialize();
 assert.deepEqual(await fsp.readFile(path.join(f.root,'lesson-视频.bin')),bytes);assert.equal(await fsp.readFile(path.join(f.root,'.git','HEAD'),'utf8'),'ref: refs/heads/main\n');assert.equal((await fsp.stat(path.join(f.root,'run.sh'))).mode&0o777,0o755);assert.equal(await fsp.readlink(path.join(f.root,'script-link')),'run.sh');
});
test('working files are never overwritten by checkpoint restoration',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();await fsp.writeFile(path.join(f.root,'draft'),'saved');await store.checkpoint();await fsp.writeFile(path.join(f.root,'draft'),'newer unsaved');
 await assert.rejects(new WorkspaceCheckpoint(f.config).initialize(),/RECONCILIATION/);assert.equal(await fsp.readFile(path.join(f.root,'draft'),'utf8'),'newer unsaved');
});
test('corrupted ciphertext never publishes a partially recovered workspace',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();await fsp.writeFile(path.join(f.root,'draft'),'preserve private data');await store.checkpoint();
 const name=JSON.parse(f.objects.manifest).payload.archive;const file=path.join(f.storage,name),bytes=await fsp.readFile(file);bytes[Math.floor(bytes.length/2)]^=1;await fsp.writeFile(file,bytes);
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await assert.rejects(new WorkspaceCheckpoint(f.config).initialize());assert.deepEqual(await fsp.readdir(f.root),[]);
});
test('cache directories are excluded and escaping symbolic links block a backup',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();await fsp.mkdir(path.join(f.root,'node_modules'));await fsp.writeFile(path.join(f.root,'node_modules','cache'),'cache');await fsp.symlink('/etc',path.join(f.root,'escape'));
 await assert.rejects(store.checkpoint());assert.equal(f.objects.writes,0);await fsp.unlink(path.join(f.root,'escape'));assert.equal((await store.checkpoint()).changed,false);
});
test('overlapping runtime revisions cannot overwrite a newer accepted checkpoint',async t=>{
 const f=await fixture(t),first=new WorkspaceCheckpoint(f.config),otherRoot=path.join(f.directory,'other');await fsp.mkdir(otherRoot);const second=new WorkspaceCheckpoint({...f.config,root:otherRoot});await first.initialize();await second.initialize();
 await fsp.writeFile(path.join(f.root,'draft'),'new serving revision');await first.checkpoint();await fsp.writeFile(path.join(otherRoot,'draft'),'stale candidate');await assert.rejects(second.checkpoint(),/CONFLICT/);assert.equal(f.objects.writes,1);
});
test('a lost success response is reconciled without deleting the accepted archive',async t=>{
 const f=await fixture(t),original=f.objects.writeManifest.bind(f.objects);f.objects.writeManifest=async(...args)=>{await original(...args);throw Error('network response lost');};
 const store=new WorkspaceCheckpoint(f.config);await store.initialize();await fsp.writeFile(path.join(f.root,'draft'),'durable');assert.equal((await store.checkpoint()).changed,true);
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await new WorkspaceCheckpoint(f.config).initialize();assert.equal(await fsp.readFile(path.join(f.root,'draft'),'utf8'),'durable');
});

test('a real Git checkout retains its commit, index and uncommitted edits after replacement',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();
 const git=(...args)=>execFileSync('git',args,{cwd:f.root,encoding:'utf8'}).trim();
 git('init','--initial-branch=main');git('config','user.name','Recovery fixture');git('config','user.email','fixture@example.invalid');
 await fsp.writeFile(path.join(f.root,'lesson.txt'),'committed lesson\n');git('add','lesson.txt');git('commit','-m','Recovery fixture');const commit=git('rev-parse','HEAD');
 await fsp.writeFile(path.join(f.root,'lesson.txt'),'uncommitted lesson correction\n');const status=git('status','--porcelain');await store.checkpoint();
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await new WorkspaceCheckpoint(f.config).initialize();
 assert.equal(git('rev-parse','HEAD'),commit);assert.equal(git('status','--porcelain'),status);assert.equal(await fsp.readFile(path.join(f.root,'lesson.txt'),'utf8'),'uncommitted lesson correction\n');
});

test('a same-size edit with restored modification time is still checkpointed',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();
 const file=path.join(f.root,'draft');await fsp.writeFile(file,'old lesson');await store.checkpoint();const original=await fsp.stat(file);
 await new Promise(resolve=>setTimeout(resolve,5));await fsp.writeFile(file,'new lesson');await fsp.utimes(file,original.atime,original.mtime);
 assert.equal((await store.checkpoint()).changed,true);
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await new WorkspaceCheckpoint(f.config).initialize();
 assert.equal(await fsp.readFile(file,'utf8'),'new lesson');
});

test('unfinished Git transfers cannot exceed snapshot limits or replace accepted objects',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint({...f.config,maxBytes:1024});
 await store.initialize();
 const pack=path.join(f.root,'.git','objects','pack');await fsp.mkdir(pack,{recursive:true});
 await fsp.writeFile(path.join(pack,'pack-accepted.pack'),'accepted Git objects');
 await fsp.writeFile(path.join(pack,'tmp_pack_incomplete'),Buffer.alloc(4096));
 await fsp.writeFile(path.join(pack,'tmp_idx_incomplete'),Buffer.alloc(4096));
 await fsp.writeFile(path.join(f.root,'draft.txt'),'user draft');
 const saved=await store.checkpoint();assert.equal(saved.changed,true);
 assert.ok(saved.bytes<1024);
 assert.equal((await fsp.stat(path.join(pack,'tmp_pack_incomplete'))).size,4096);
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);
 await new WorkspaceCheckpoint({...f.config,maxBytes:1024}).initialize();
 assert.equal(await fsp.readFile(path.join(pack,'pack-accepted.pack'),'utf8'),'accepted Git objects');
 assert.equal(await fsp.readFile(path.join(f.root,'draft.txt'),'utf8'),'user draft');
 await assert.rejects(fsp.stat(path.join(pack,'tmp_pack_incomplete')),/ENOENT/);
});

test('a file edit during snapshot serialization retries the snapshot without replaying commands',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();
 const file=path.join(f.root,'draft');await fsp.writeFile(file,'before');
 const write=f.objects.createArchiveWriteStream.bind(f.objects);let attempts=0;
 f.objects.createArchiveWriteStream=name=>{if(++attempts===1)fs.writeFileSync(file,'latest correction');return write(name);};
 const result=await store.checkpoint();assert.equal(result.changed,true);assert.equal(attempts,2);assert.equal(f.objects.writes,1);
 await fsp.rm(f.root,{recursive:true});await fsp.mkdir(f.root);await new WorkspaceCheckpoint(f.config).initialize();
 assert.equal(await fsp.readFile(file,'utf8'),'latest correction');
});
test('continuous edits stop after three snapshot attempts and never publish inconsistent bytes',async t=>{
 const f=await fixture(t),store=new WorkspaceCheckpoint(f.config);await store.initialize();
 const file=path.join(f.root,'draft');await fsp.writeFile(file,'initial');
 const write=f.objects.createArchiveWriteStream.bind(f.objects);let attempts=0;
 f.objects.createArchiveWriteStream=name=>{fs.writeFileSync(file,'changed-'.repeat(++attempts+1));return write(name);};
 await assert.rejects(store.checkpoint(),/WORKSPACE_CHANGED_DURING_CHECKPOINT/);assert.equal(attempts,3);assert.equal(f.objects.writes,0);
});
