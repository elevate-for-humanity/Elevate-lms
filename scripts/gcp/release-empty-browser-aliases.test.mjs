import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseEmptyBrowserAliases} from './release-empty-browser-aliases.mjs';
import {browserConsumerBindings} from './release-empty-browser-aliases.mjs';
test('reviews only old generated aliases, retaining production, newest candidate and course QA',async()=>{
 const traffic=[{revisionName:'live',percent:100,tag:'sc-aaaaaaaa-aaaaaaaa'},{revisionName:'pending',percent:0,tag:'sc-bbbbbbbb-bbbbbbbb'},{revisionName:'old',percent:0,tag:'sc-cccccccc-cccccccc'},{revisionName:'course',percent:0,tag:'course-qa-aaaaaaaaaaaa'}];
 const seen=[];const run=args=>args[2]==='describe'?JSON.stringify({status:{traffic,latestCreatedRevisionName:'pending'}}):'[]';
 const r=await releaseEmptyBrowserAliases({run,release:async x=>{seen.push(x);return {changed:true,removedTag:x.tag};}});
 assert.equal(r.removed,1);assert.equal(seen[0].revision,'old');assert.equal(r.primaryTrafficPreserved,true);assert.equal(r.imagesAndRevisionsRetained,true);
});
test('a runtime binding protects an alias without emitting private environment values',async()=>{
 const tag='sc-cccccccc-cccccccc';const run=args=>args[2]==='describe'?JSON.stringify({status:{traffic:[{revisionName:'live',percent:100},{revisionName:'old',percent:0,tag}],latestCreatedRevisionName:'live'}}):args[1]==='services'?JSON.stringify([{spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_URL',value:'https://'+tag+'---browser.run.app'},{name:'UNRELATED',value:'private-token'}]}]}}}}]):'[]';
 const r=await releaseEmptyBrowserAliases({run,release:()=>assert.fail()});assert.equal(r.removed,0);assert.equal(r.results[0].reason,'active_runtime_binding');assert.ok(!JSON.stringify(r).includes('private-token'));
});
test('current and nonterminal execution bindings are read, including secret references',()=>{
 const task=value=>({containers:[{env:[{name:'ULTIMATE_LEARNER_RUNTHROUGH_URL',value}]}]});
 const run=args=>{
  if(args[0]==='secrets')return 'https://active.run.app/learner';
  if(args[1]==='services')return '[]';
  if(args[2]==='list')return JSON.stringify([{metadata:{name:'course'},spec:{template:{spec:{template:{spec:task('https://current.run.app/learner')}}}}}]);
  const pending=task(undefined);pending.containers[0].env[0]={name:'ULTIMATE_LEARNER_RUNTHROUGH_URL',valueFrom:{secretKeyRef:{name:'existing-qa-endpoint',key:'1'}}};
  return JSON.stringify([{status:{},spec:{template:{spec:pending}}},{status:{completionTime:'2026-11-01T00:00:00Z'},spec:{template:{spec:task('https://finished.run.app/learner')}}}]);
 };
 const bindings=browserConsumerBindings(run);assert.ok(bindings.some(x=>x.value.includes('active.run.app')));assert.ok(bindings.some(x=>x.value.includes('current.run.app')));assert.ok(!bindings.some(x=>x.value.includes('finished.run.app')));
});
