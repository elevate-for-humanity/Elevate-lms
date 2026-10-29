import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {METADATA_PROBE,inventoryStudioLiveState,studioProcessClass} from './inventory-studio-live-state.mjs';
import {inspectStudioPreservation} from './inventory-studio-live-state.mjs';
test('workspace diagnosis returns bounded aggregate differences without private output or mutations',async()=>{
 const traffic=[{revisionName:'candidate',tag:'sc-12345678-12345678',url:'https://candidate.run.app',percent:0}];
 const run=args=>args[0]==='run'?JSON.stringify({status:{url:'https://serving.run.app',latestCreatedRevisionName:'candidate',traffic}}):'test-secret';
 const calls=[];const request=async(url,options)=>{calls.push({url,options});return Response.json({exitCode:0,stdout:JSON.stringify({files:url.hostname==='candidate.run.app'?2:3,directories:1,bytes:10,digest:'a'.repeat(64),archiveDigest:'b'.repeat(64),generation:'1234',authenticatedManifest:true,excludedDependencyCaches:true,private:'never-return-this'})});};
 const result=await inspectStudioPreservation({run,request});assert.equal(result.equal,false);assert.equal(result.source.files,3);assert.equal(result.candidate.files,2);
 assert.equal(result.stateChanged,false);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url.pathname==='/workspace/exec'));
 assert.ok(!JSON.stringify(result).includes('never-return-this'));assert.ok(!JSON.stringify(result).includes('test-secret'));
 traffic[0].percent=100;assert.equal((await inspectStudioPreservation({run,request})).candidateAvailable,false);assert.equal(calls.length,2);
});
test('real metadata probe counts files and links without returning contents or names',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-inventory-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.writeFile(path.join(root,'private-name'),'private-content');await fs.mkdir(path.join(root,'node_modules'));await fs.writeFile(path.join(root,'node_modules','ignored'),'cache');await fs.symlink('/etc',path.join(root,'external-link'));
 const {stdout}=await promisify(execFile)(process.execPath,['-e',METADATA_PROBE],{cwd:root});const data=JSON.parse(stdout);assert.equal(data.files,1);assert.equal(data.bytes,15);assert.equal(data.symlinks,1);assert.ok(!stdout.includes('private'));assert.equal(data.fileContentsRead,false);
});
test('inventory uses exact Google endpoint and authorized metadata probe; returns only selected metadata',async()=>{
 const calls=[];const run=args=>args[0]==='run'?JSON.stringify({status:{url:'https://studio.test.run.app',traffic:[{revisionName:'old',percent:100}]}}):'test-secret';
 const request=async(url,opts={})=>{calls.push({url:String(url),opts});return {ok:true,json:async()=>String(url).endsWith('/health')?{commit:'serving',activeSessions:2}:{exitCode:0,stdout:JSON.stringify({files:1,directories:0,symlinks:0,bytes:15,excludedDependencyCaches:true,directChildShells:1,processInventoryReadable:true,fileContentsRead:false,commandsRead:false})}};};
 const r=await inventoryStudioLiveState({run,request});assert.equal(r.activeBrowserSessions,2);assert.equal(r.stateChanged,false);assert.equal(r.directChildShells,1);assert.ok(!JSON.stringify(r).includes('test-secret'));assert.deepEqual(JSON.parse(calls[1].opts.body).args,['-e',METADATA_PROBE]);
});

test('inventory uses the durable checkpoint boundary for interrupted Git transfers',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-inventory-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'.git/objects/pack'),{recursive:true});
 for(const [name,value] of [['tmp_pack_partial','unfinished'],['tmp_idx_partial','index'],['pack-valid.pack','committed']])
  await fs.writeFile(path.join(root,'.git/objects/pack',name),value);
 // Similar names outside Git's internal transfer directory are user work.
 await fs.writeFile(path.join(root,'tmp_pack_user-work'),'preserved');
 const {stdout}=await promisify(execFile)(process.execPath,['-e',METADATA_PROBE],{cwd:root});const data=JSON.parse(stdout);
 assert.equal(data.files,2);assert.equal(data.bytes,18);
 assert.equal(data.excludedGitTransferFiles,2);assert.equal(data.excludedGitTransferBytes,15);
 assert.equal((await fs.readFile(path.join(root,'.git/objects/pack/tmp_pack_partial'),'utf8')),'unfinished');
 const {workspaceContentProof}=await import('./verify-studio-workspace-preservation.mjs');
 const proof=await workspaceContentProof(root);assert.equal(proof.files,data.files);assert.equal(proof.bytes,data.bytes);
 assert.ok(!stdout.includes('user-work'));assert.equal(data.fileContentsRead,false);
});

test('only known browser helpers are classified; arbitrary Node processes remain unknown',()=>{
 assert.equal(studioProcessClass('chrome_crashpad'),'browserHelper');assert.equal(studioProcessClass('chrome_crashpad_handler'),'browserHelper');
 assert.equal(studioProcessClass('chromium'),'browser');assert.equal(studioProcessClass('bash'),'shell');
 for(const name of ['node','python3','private-process-name','chrome_crashpad_unrecognized'])assert.equal(studioProcessClass(name),'unclassified');
});

test('Admin binding inventory never emits inline credential values or runtime payloads',async()=>{
 const {adminGitHubBindingMetadata}=await import('./inventory-studio-live-state.mjs');
 const result=adminGitHubBindingMetadata({spec:{template:{spec:{containers:[{env:[{name:'GITHUB_APP_PRIVATE_KEY',value:'private-key-payload-fixture'},{name:'GITHUB_TOKEN',value:'token-payload-fixture'},{name:'UNRELATED_SECRET',value:'unrelated-payload-fixture'}]}],volumes:[{name:'app-key',secret:{secretName:'existing-github-key'}}]}}}},
 {runtimeEnvironment:{GITHUB_APP_PRIVATE_KEY:'config-payload-fixture'}},['projects/p/secrets/existing-github-key']);
 const json=JSON.stringify(result);
 assert.equal(result.runtimeConfigHasAppPrivateKey,true);
 assert.equal(result.serviceBindings.length,2);
 assert.deepEqual(result.secretVolumes,[{name:'app-key',secret:'existing-github-key'}]);
 assert.deepEqual(result.candidateSecretNames,['projects/p/secrets/existing-github-key']);
 for(const value of ['private-key-payload-fixture','token-payload-fixture','unrelated-payload-fixture','config-payload-fixture'])assert.ok(!json.includes(value));
 assert.equal(result.stateChanged,false);
});
