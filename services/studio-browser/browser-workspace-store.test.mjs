import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {BrowserWorkspaceStore} from './browser-workspace-store.mjs';
async function fixture(t){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'studio-browser-checkpoint-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return {directory,secret:'fixture-only-key'};}
function session(){const first={url:()=> 'https://example.com/work'},second={url:()=> 'https://example.org/reference'};return {ownerId:'operator-a',viewport:{width:390,height:780},pages:new Map([['first',first],['second',second]]),activeTabId:'first',context:{storageState:async()=>({cookies:[{name:'private-cookie',value:'private-browser-marker',domain:'example.com',path:'/'}],origins:[{origin:'https://example.com',localStorage:[{name:'draft',value:'saved draft'}]}]})}};}
test('encrypted browser tabs, active tab and storage restore under the same owner',async t=>{
 const config=await fixture(t),store=new BrowserWorkspaceStore(config);await store.save(session());
 const files=await fs.readdir(config.directory);assert.equal(files.length,1);assert.ok(!(await fs.readFile(path.join(config.directory,files[0]),'utf8')).includes('private-browser-marker'));
 const recovered=await new BrowserWorkspaceStore(config).load('operator-a');assert.equal(recovered.activeTabIndex,0);assert.equal(recovered.tabs.length,2);assert.equal(recovered.storageState.origins[0].localStorage[0].value,'saved draft');assert.equal(recovered.viewport.width,390);
 assert.equal(await new BrowserWorkspaceStore(config).load('operator-b'),null);
});
test('forwarded Elevate auth tokens are never persisted and OAuth completion URLs are not replayed',async t=>{
 const store=new BrowserWorkspaceStore(await fixture(t)),s=session();s.pages.get('first').url=()=> 'https://example.com/auth/callback?code=one-time&state=private';
 s.context.storageState=async()=>({cookies:[{name:'sb-project-auth-token',value:'do-not-store',domain:'.elevateforhumanity.org'}],origins:[{origin:'https://admin.elevateforhumanity.org',localStorage:[{name:'sb-project-auth-token',value:'do-not-store'},{name:'theme',value:'dark'}]}]});
 await store.save(s);const restored=await store.load('operator-a');assert.equal(restored.tabs[0],'about:blank');assert.equal(restored.storageState.cookies.length,0);assert.deepEqual(restored.storageState.origins[0].localStorage,[{name:'theme',value:'dark'}]);
});
test('tampered and wrong-key browser checkpoints fail closed',async t=>{
 const config=await fixture(t),store=new BrowserWorkspaceStore(config);await store.save(session());await assert.rejects(new BrowserWorkspaceStore({...config,secret:'different'}).load('operator-a'));
 const files=await fs.readdir(config.directory);await fs.writeFile(path.join(config.directory,files[0]),'corrupt');await assert.rejects(store.load('operator-a'));
});
test('a failed checkpoint preserves the previous durable browser state',async t=>{
 const config=await fixture(t),store=new BrowserWorkspaceStore(config),s=session();await store.save(s);s.context.storageState=async()=>{throw Error('context lost');};
 await assert.rejects(store.save(s));assert.equal((await store.load('operator-a')).tabs[0],'https://example.com/work');
});

test('completed download metadata remains inside the owner-encrypted checkpoint',async t=>{
 const config=await fixture(t),store=new BrowserWorkspaceStore(config),s=session();
 s.persistedDownloads=[{id:'a5149ac1-7f62-44d1-9dfc-30d334aa0ff2',fileName:'private-lesson.mp4',size:42,contentType:'video/mp4'}];
 await store.save(s);const recovered=await new BrowserWorkspaceStore(config).load(s.ownerId);assert.deepEqual(recovered.downloads,s.persistedDownloads);
 assert.ok(!(await fs.readFile(store.file(s.ownerId),'utf8')).includes('private-lesson'));
});
