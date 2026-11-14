import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotPage} from './server.mjs';
import {CdpPage} from './cdp-browser.mjs';
test('frame inspections share a total deadline instead of spending a minute on every frame',async t=>{
 let now=1000;const deadlines=[];t.mock.method(Date,'now',()=>now);
 const frames=Array.from({length:15},()=>({evaluate:async(_fn,offset,{timeout})=>{deadlines.push(timeout);now+=timeout;return {title:'Frame',url:'https://example.org',visibleText:'Healthy content',headings:[],controls:[{ref:`e${offset+1}`,role:'button',name:'Open'}]};}}));
 const page={url:()=> 'https://example.org',waitForLoadState:async()=>{},frames:()=>frames};
 const result=await snapshotPage({page,events:[]});
 assert.deepEqual(deadlines,[5000,5000,5000]);assert.equal(result.partial,true);
 assert.ok(result.frameErrors.includes('snapshot_frame_budget_exhausted'));assert.equal(result.controls.length,3);
});
test('the page proxy passes a bounded evaluation deadline to the actual CDP frame',async t=>{
 t.mock.method(Date,'now',()=>1000);let actual;
 const browser={connection:{send:async(method,params,session,timeout)=>{actual={method,timeout};return {result:{value:42}};}}};
 const page=new CdpPage({options:{},browser},{targetId:'target',url:'https://example.org'},'session');
 page.updateFrame({id:'main',url:'https://example.org'});
 await page.dispatch('Runtime.executionContextCreated',{context:{id:1,auxData:{isDefault:true,frameId:'main'}}});
 assert.equal(await page.evaluate(()=>42,null,{timeout:1234}),42);assert.deepEqual(actual,{method:'Runtime.evaluate',timeout:1234});
});
test('overlapping inspectors share one read and a failed inspection releases admission without replay',async()=>{
 let release,calls=0,fail=true;
 const frame={evaluate:async()=>{calls++;await new Promise(resolve=>{release=resolve;});if(fail)throw Error('renderer timeout');return {title:'Recovered',url:'https://example.org',visibleText:'Recovered',headings:[],controls:[]};}};
 const page={url:()=> 'https://example.org',waitForLoadState:async()=>{},frames:()=>[frame]};
 const session={page,events:[]};
 const first=snapshotPage(session),second=snapshotPage(session);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,1);
 const failed1=assert.rejects(first,/renderer timeout/),failed2=assert.rejects(second,/renderer timeout/);release();await Promise.all([failed1,failed2]);
 assert.equal(session.snapshotInFlight,undefined);
 fail=false;const recovered=snapshotPage(session);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);release();assert.equal((await recovered).title,'Recovered');
});
