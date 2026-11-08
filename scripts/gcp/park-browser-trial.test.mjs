import test from 'node:test';
import assert from 'node:assert/strict';
import {parkBrowserTrial} from './park-browser-trial.mjs';
const state=()=>({name:'elevate-studio-browser-trial',id:'123',status:'RUNNING',labels:{purpose:'studio-isolation-trial'},zone:'projects/p/zones/us-central1-a',machineType:'zones/a/machineTypes/e2-standard-2',disks:[{source:'projects/p/disks/boot',boot:true,autoDelete:true},{source:'projects/p/disks/elevate-studio-browser-auth-trial',boot:false,autoDelete:false}]});
const proof=()=>({ready:true,cookieStoragePersistent:true,dataDiskMounted:true,activeBrowserSessions:0,files:0,symlinks:0,directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true});
function fixture(){let current=state();const calls=[];return {calls,current,read:()=>structuredClone(current),inspect:async()=>proof(),bindings:async()=>true,production:async()=>true,stop:()=>{calls.push('stop');current.status='TERMINATED';},start:()=>{calls.push('start');current.status='RUNNING';}};}
test('parks only the verified unused trial and retains every disk and the production browser',async()=>{
 const f=fixture(),result=await parkBrowserTrial(f);
 assert.equal(result.parked,true);assert.equal(result.disksDeleted,false);assert.equal(result.authDiskRetained,true);assert.deepEqual(f.calls,['stop']);assert.equal(f.current.disks.length,2);
});
test('active sessions, files, shells, unknown processes or unproven auth storage prevent a stop',async()=>{
 for(const change of [{activeBrowserSessions:1},{files:1},{directChildShells:1},{directNonBrowserProcesses:1},{cookieStoragePersistent:false},{dataDiskMounted:false},{processInventoryReadable:false}]){
  const f=fixture();f.inspect=async()=>({...proof(),...change});await assert.rejects(parkBrowserTrial(f),/HAS_WORK_OR_UNVERIFIED_STATE/);assert.deepEqual(f.calls,[]);
 }
});
test('wrong ownership or a live production dependency prevents a stop',async()=>{
 const f=fixture();f.current.labels.purpose='production';await assert.rejects(parkBrowserTrial(f),/OWNERSHIP/);assert.deepEqual(f.calls,[]);
 const other=fixture();other.bindings=async()=>false;await assert.rejects(parkBrowserTrial(other),/BINDINGS_UNVERIFIED/);assert.deepEqual(other.calls,[]);
});
test('production failure after parking restarts the same retained VM',async()=>{
 const f=fixture();let checks=0;f.production=async()=>++checks===1;
 await assert.rejects(parkBrowserTrial(f),/PARK_ROLLED_BACK/);assert.deepEqual(f.calls,['stop','start']);assert.equal(f.current.status,'RUNNING');
});

test('a trial promoted to the current production-ready role is preserved without retirement probes',async()=>{
 const f=fixture();f.current.labels.purpose='studio-browser-ready';f.inspect=()=>assert.fail('production role must not enter trial retirement');
 const result=await parkBrowserTrial(f);assert.equal(result.parked,false);assert.equal(result.reason,'production_browser_role_preserved');assert.deepEqual(f.calls,[]);
});
