import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const raw=readFileSync(new URL('./inventory-google-ownership.mjs',import.meta.url),'utf8');
test('inventory visits every discovered job region, retains older active work and excludes credentials',async()=>{
 const calls=[];let report;
 const jobs=['us-central1','us-east1'].map((region,index)=>({metadata:{name:'worker-'+index,labels:{'cloud.googleapis.com/location':region}},spec:{secret:'never-write-this-value'}}));
 globalThis.__inventoryFixture={PROJECT:'test-project',process:{exitCode:0},console:{log(){}},
  writeFileSync(_path,value){report=JSON.parse(value);},
  google(args){
   calls.push(args);
   if(args[0]==='asset'){const error=new Error('private error details');error.code='permission_denied';throw error;}
   if(args.slice(0,3).join(' ')==='run jobs list')return JSON.stringify(jobs);
   if(args.slice(0,4).join(' ')==='run jobs executions list'){
    return JSON.stringify(Array.from({length:7},(_,index)=>({
     metadata:{name:'execution-'+index,creationTimestamp:`2026-10-${String(20-index).padStart(2,'0')}T00:00:00Z`},
     spec:{privateCredential:'never-write-this-value'},
     status:index===6?{runningCount:1,conditions:[{type:'Completed',status:'Unknown'}]}:{completionTime:'2026-10-20T01:00:00Z',conditions:[{type:'Completed',status:'True'}]},
    })));
   }
   return '[]';
  },
 };
 const source=raw.replace("import { writeFileSync } from 'node:fs';",'')
  .replace("import { google, PROJECT } from './runtime-config.mjs';",'const {google,PROJECT,writeFileSync,console,process}=globalThis.__inventoryFixture;');
 try{await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
 finally{delete globalThis.__inventoryFixture;}
 assert.deepEqual(report.failures,[{resource:'projectAssets',reason:'permission_denied'}]);
 for(const [index,region] of ['us-central1','us-east1'].entries()){
  assert.ok(calls.some(args=>args.includes('--job=worker-'+index)&&args.includes('--region='+region)));
  const executions=report.resources['executions:'+region+':worker-'+index];
  assert.equal(executions.length,6);assert.ok(executions.some(e=>e.name==='execution-6'&&e.running===1));
 }
 assert.equal(calls.some(args=>args.slice(0,4).join(' ')==='run jobs executions list'&&!args.some(a=>a.startsWith('--region='))),false);
 assert.equal(JSON.stringify(report).includes('never-write-this-value'),false);
 assert.equal(JSON.stringify(report).includes('private error details'),false);
 assert.equal(calls.some(args=>args.some(arg=>['deploy','execute','cancel','delete','add-iam-policy-binding'].includes(arg))),false);
});
