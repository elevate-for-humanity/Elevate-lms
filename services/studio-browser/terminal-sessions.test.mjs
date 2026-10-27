import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {TerminalSessions} from './terminal-sessions.mjs';
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-terminal-'));const cwd=path.join(root,'workspace'),directory=path.join(root,'encrypted');await fs.mkdir(cwd);
 const managers=[];const manager=extra=>{const m=new TerminalSessions({cwd,directory,secret:'fixture-key-not-production',...extra});managers.push(m);return m;};
 t.after(async()=>{await Promise.all(managers.map(m=>m.shutdown().catch(()=>{})));await new Promise(r=>setTimeout(r,30));await fs.rm(root,{recursive:true,force:true});});
 return {root,cwd,directory,manager};
}
async function until(action,predicate){for(let i=0;i<100;i++){const value=await action();if(predicate(value))return value;await new Promise(r=>setTimeout(r,15));}throw Error('terminal did not reach expected state');}
test('real shell output and directory recover after process shutdown without replaying commands',async t=>{
 const f=await fixture(t),m=f.manager();await fs.mkdir(path.join(f.cwd,'nested'));const session=await m.create('operator-a');
 await m.input('operator-a',session.id,"cd nested\nprintf 'private-terminal-marker\\n'\nprintf x >> once\n");
 await until(()=>m.output('operator-a',session.id),x=>x.output.some(v=>v.data.includes('private-terminal-marker')));
 await until(()=>m.get('operator-a',session.id).then(async s=>{await m.flush(s);return s.cwd;}),x=>x.endsWith('/nested'));
 const file=m.filename('operator-a',session.id);assert.equal((await fs.readFile(file,'utf8')).includes('private-terminal-marker'),false);
 await m.shutdown();const recovered=f.manager();const output=await recovered.output('operator-a',session.id);
 assert.equal(output.state,'interrupted');assert.equal(output.recovery.commandsReplayed,false);assert.ok(output.output.some(x=>x.data.includes('private-terminal-marker')));
 assert.equal(recovered.activeCount(),0);await assert.rejects(recovered.input('operator-a',session.id,'echo unsafe\n'),/terminal_resume_required/);
 await recovered.resume('operator-a',session.id);await recovered.input('operator-a',session.id,'pwd\n');
 await until(()=>recovered.output('operator-a',session.id),x=>x.output.some(v=>v.data.includes(f.cwd+'/nested')));
 assert.equal(await fs.readFile(path.join(f.cwd,'nested','once'),'utf8'),'x');
});
test('owner boundaries apply to live, recovered and resumed terminals',async t=>{
 const f=await fixture(t),m=f.manager();const session=await m.create('owner-a');
 for(const method of [()=>m.output('owner-b',session.id),()=>m.input('owner-b',session.id,'echo x'),()=>m.stop('owner-b',session.id),()=>m.resume('owner-b',session.id)])await assert.rejects(method(),/terminal_session_not_found/);
 await m.shutdown();await assert.rejects(f.manager().output('owner-b',session.id),/terminal_session_not_found/);
});
test('unavailable persistence refuses terminal creation before starting a process',async t=>{
 const f=await fixture(t);await fs.writeFile(f.directory,'not a directory');let spawned=0;
 const m=f.manager({spawnShell:()=>{spawned++;throw Error('must not run');}});
 await assert.rejects(m.create('owner'),/terminal_checkpoint_failed/);assert.equal(spawned,0);
});
test('tampered ciphertext fails closed and does not start a replacement process',async t=>{
 const f=await fixture(t),m=f.manager();const session=await m.create('owner');await m.shutdown();
 const file=m.filename('owner',session.id);const data=JSON.parse(await fs.readFile(file,'utf8'));data.data='AAAA'+data.data.slice(4);await fs.writeFile(file,JSON.stringify(data));
 const recovered=f.manager();await assert.rejects(recovered.output('owner',session.id),/terminal_restore_failed/);assert.equal(recovered.activeCount(),0);
});
test('capacity is bounded and explicit stop survives reload without resurrecting commands',async t=>{
 const f=await fixture(t),m=f.manager({maxActive:1});const session=await m.create('owner');
 await assert.rejects(m.create('owner'),/terminal_capacity_reached/);await m.stop('owner',session.id);
 const recovered=f.manager();assert.equal((await recovered.output('owner',session.id)).state,'closed');await assert.rejects(recovered.resume('owner',session.id),/terminal_session_closed/);
});
test('lost storage retains live output and a later retry checkpoints it',async t=>{
 const f=await fixture(t),m=f.manager();const session=await m.create('owner');await fs.rename(f.directory,f.directory+'-saved');await fs.writeFile(f.directory,'unavailable');
 await m.input('owner',session.id,'printf recovery-proof\n');
 await until(async()=>m.sessions.get(session.id).output,x=>x.some(v=>v.data.includes('recovery-proof')));
 await assert.rejects(m.output('owner',session.id),/terminal_checkpoint_failed/);
 assert.equal(m.activeCount(),1);await fs.unlink(f.directory);await fs.rename(f.directory+'-saved',f.directory);
 assert.ok((await m.output('owner',session.id)).output.some(v=>v.data.includes('recovery-proof')));
});
test('missing recovered working directory blocks explicit resume',async t=>{
 const f=await fixture(t),m=f.manager();const nested=path.join(f.cwd,'gone');await fs.mkdir(nested);
 const session=await m.create('owner');await m.input('owner',session.id,'cd gone\n');
 await until(()=>m.get('owner',session.id),s=>s.cwd===nested);await m.shutdown();await fs.rm(nested,{recursive:true});
 const recovered=f.manager();await assert.rejects(recovered.resume('owner',session.id),/terminal_directory_unavailable/);assert.equal(recovered.activeCount(),0);
});
test('concurrent explicit resumes start only one shell',async t=>{
 const f=await fixture(t),m=f.manager(),session=await m.create('owner');await m.shutdown();
 const recovered=f.manager();await Promise.all(Array.from({length:8},()=>recovered.resume('owner',session.id)));
 assert.equal(recovered.activeCount(),1);await recovered.input('owner',session.id,'printf resumed-once\n');
 await until(()=>recovered.output('owner',session.id),v=>v.output.some(x=>x.data.includes('resumed-once')));
});
test('output rings stay bounded and report missing history after recovery',async t=>{
 const f=await fixture(t),m=f.manager({maxOutputBytes:128}),session=await m.create('owner');const s=await m.get('owner',session.id);
 for(let i=0;i<20;i++)m.record(s,'stdout','x'.repeat(100));
 const result=await m.output('owner',session.id);assert.ok(s.bytes<=128);assert.equal(result.recovery.truncated,true);
 await m.shutdown();const restored=await f.manager({maxOutputBytes:128}).output('owner',session.id);assert.equal(restored.recovery.truncated,true);
});

test('a fresh Node process restores a checkpoint without launching a shell',async t=>{
 const f=await fixture(t);const moduleUrl=new URL('./terminal-sessions.mjs',import.meta.url).href;
 const prefix=`import {TerminalSessions} from ${JSON.stringify(moduleUrl)};const m=new TerminalSessions(${JSON.stringify({cwd:f.cwd,directory:f.directory,secret:'fixture-key-not-production'})});`;
 const run=promisify(execFile);
 const created=await run(process.execPath,['--input-type=module','-e',prefix+`const s=await m.create('owner');await m.input('owner',s.id,'printf cross-process-proof\\n');for(let i=0;i<100;i++){const o=await m.output('owner',s.id);if(o.output.some(x=>x.data.includes('cross-process-proof')))break;await new Promise(r=>setTimeout(r,10));}await m.shutdown();console.log(s.id);`]);
 const id=created.stdout.trim();
 const restored=await run(process.execPath,['--input-type=module','-e',prefix+`const o=await m.output('owner',${JSON.stringify(id)});console.log(JSON.stringify({state:o.state,active:m.activeCount(),output:o.output}));await m.shutdown();`]);
 const result=JSON.parse(restored.stdout);assert.equal(result.state,'interrupted');assert.equal(result.active,0);assert.ok(result.output.some(x=>x.data.includes('cross-process-proof')));
});
test('inactive checkpoints can leave the memory cache without losing durable history',async t=>{
 const f=await fixture(t),m=f.manager({maxActive:1,maxCached:2});const ids=[];
 for(let i=0;i<5;i++){const session=await m.create('owner');ids.push(session.id);await m.stop('owner',session.id);await until(()=>m.get('owner',session.id),s=>!s.shell);await m.flush(await m.get('owner',session.id));}
 assert.ok(m.sessions.size<=2);assert.equal((await m.output('owner',ids[0])).state,'closed');
});

test('closing a terminal while resume awaits persistence cannot launch a replacement shell',async t=>{
 const f=await fixture(t),m=f.manager(),session=await m.create('owner');await m.shutdown();
 let spawned=0;const recovered=f.manager({spawnShell:()=>{spawned++;throw Error('closed terminal must not spawn');}});
 const s=await recovered.get('owner',session.id),flush=recovered.flush.bind(recovered);
 let release,entered;const ready=new Promise(resolve=>{entered=resolve;});
 recovered.flush=async current=>{if(current.state==='starting'){entered();await new Promise(resolve=>{release=resolve;});}return flush(current);};
 const resumed=recovered.resume('owner',session.id);await ready;
 await recovered.stop('owner',session.id);release();
 await assert.rejects(resumed,/terminal_session_closed/);
 assert.equal(spawned,0);assert.equal(s.state,'closed');
 assert.equal((await f.manager().output('owner',session.id)).state,'closed');
});
