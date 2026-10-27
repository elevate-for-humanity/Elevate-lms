import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {METADATA_PROBE,inventoryStudioLiveState,studioProcessClass} from './inventory-studio-live-state.mjs';
test('real metadata probe counts files and links without returning contents or names',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-inventory-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.writeFile(path.join(root,'private-name'),'private-content');await fs.mkdir(path.join(root,'node_modules'));await fs.writeFile(path.join(root,'node_modules','ignored'),'cache');await fs.symlink('/etc',path.join(root,'external-link'));
 const {stdout}=await promisify(execFile)(process.execPath,['-e',METADATA_PROBE],{cwd:root});const data=JSON.parse(stdout);assert.equal(data.files,1);assert.equal(data.bytes,15);assert.equal(data.symlinks,1);assert.ok(!stdout.includes('private'));assert.equal(data.fileContentsRead,false);
});
test('inventory uses exact Google endpoint and authorized metadata probe; returns only selected metadata',async()=>{
 const calls=[];const run=args=>args[0]==='run'?JSON.stringify({status:{url:'https://studio.test.run.app',traffic:[{revisionName:'old',percent:100}]}}):'test-secret';
 const request=async(url,opts={})=>{calls.push({url:String(url),opts});return {ok:true,json:async()=>String(url).endsWith('/health')?{commit:'serving',activeSessions:2}:{exitCode:0,stdout:JSON.stringify({files:1,directories:0,symlinks:0,bytes:15,excludedDependencyCaches:true,directChildShells:1,processInventoryReadable:true,fileContentsRead:false,commandsRead:false})}};};
 const r=await inventoryStudioLiveState({run,request});assert.equal(r.activeBrowserSessions,2);assert.equal(r.stateChanged,false);assert.equal(r.directChildShells,1);assert.ok(!JSON.stringify(r).includes('test-secret'));assert.deepEqual(JSON.parse(calls[1].opts.body).args,['-e',METADATA_PROBE]);
});

test('only known browser helpers are classified; arbitrary Node processes remain unknown',()=>{
 assert.equal(studioProcessClass('chrome_crashpad'),'browserHelper');assert.equal(studioProcessClass('chrome_crashpad_handler'),'browserHelper');
 assert.equal(studioProcessClass('chromium'),'browser');assert.equal(studioProcessClass('bash'),'shell');
 for(const name of ['node','python3','private-process-name','chrome_crashpad_unrecognized'])assert.equal(studioProcessClass(name),'unclassified');
});
