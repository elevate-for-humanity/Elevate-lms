import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTestedRevision, unusedCandidateTags } from './gcp/activate-tested-public-revision.mjs';
const commit='a'.repeat(40),service='elevate-marketing-migration',revision=service+'-candidate-a';
function fixture(state={healthy:true,commit},status=200){
 const calls=[];const f={calls};
 f.read=args=>{calls.push(args);if(args[1]==='revisions')return {spec:{containers:[{image:'registry/image@sha256:'+'a'.repeat(64)}]}};return {status:{latestReadyRevisionName:service+'-old',traffic:[{tag:'c-aaaaaaaaaaaa',revisionName:revision,url:'https://candidate.example.run.app',percent:calls.some(a=>a.includes('--to-revisions='+revision+'=100'))?100:0}]}};};
 f.fetcher=async()=>({ok:status===200,async json(){return state;}});
 f.options={service,revision,commit,read:f.read,fetcher:f.fetcher,attempts:1};return f;
}
test('pinned old latest-ready revision does not prevent exact tested candidate activation',async()=>{
 const f=fixture();const result=await activateTestedRevision(f.options);assert.equal(result.traffic,100);
 assert.ok(f.calls.find(a=>a.includes('--update-tags=c-aaaaaaaaaaaa='+revision)));
 assert.ok(f.calls.find(a=>a.includes('--to-revisions='+revision+'=100')));
});
test('wrong candidate commit never switches public traffic',async()=>{
 const f=fixture({healthy:true,commit:'b'.repeat(40)});await assert.rejects(activateTestedRevision(f.options),/wrong immutable commit/);
 assert.equal(f.calls.some(a=>a.some(x=>x.startsWith('--to-revisions='))),false);
});
test('candidate health failure preserves pinned serving traffic',async()=>{
 const f=fixture({healthy:false,commit},503);await assert.rejects(activateTestedRevision(f.options),/failed runtime health/);
 assert.equal(f.calls.some(a=>a.some(x=>x.startsWith('--to-revisions='))),false);
});
test('mutable image is refused before adding candidate tag',async()=>{
 const f=fixture();f.options.read=args=>{f.calls.push(args);return {spec:{containers:[{image:'registry/image:latest'}]}};};
 await assert.rejects(activateTestedRevision(f.options),/immutable/);assert.equal(f.calls.length,1);
});

test('candidate tag and service name fit Google limit',()=>{assert.ok(('c-'+commit.slice(0,12)+service).length<=46);});

test('configured region is used for every revision and traffic operation',async()=>{
 const f=fixture();await activateTestedRevision(f.options);
 const expected=process.env.CANDIDATE_REGION||'us-central1';
 for(const args of f.calls)assert.ok(args.includes('--region='+expected));
});

test('only unused owned tags are selected; custom and serving revision tags stay',()=>{
 const rows=[
  {revisionName:'serving',percent:100},
  {revisionName:'serving',tag:'c-111111111111'},
  {revisionName:'old',tag:'c-222222222222'},
  {revisionName:'old',tag:'release-verified'},
  {revisionName:'target',tag:'c-aaaaaaaaaaaa'},
 ];
 assert.deepEqual(unusedCandidateTags({status:{traffic:rows}},'c-aaaaaaaaaaaa'),['c-222222222222']);
 assert.deepEqual(unusedCandidateTags({spec:{traffic:[{revisionName:'old',percent:100}]},status:{traffic:rows}},'c-aaaaaaaaaaaa'),[]);
});

test('stale owned tags are removed in the same operation that adds the candidate',async()=>{
 const f=fixture(),read=f.read;
 f.options.read=args=>{const state=read(args);if(args[1]==='services'&&args[2]==='describe')state.status.traffic.push({revisionName:service+'-retired',tag:'c-222222222222'});return state;};
 await activateTestedRevision(f.options);
 const add=f.calls.find(a=>a.some(x=>x.startsWith('--update-tags=')));
 assert.ok(add.includes('--remove-tags=c-222222222222'));
});

test('failed candidate provisioning removes its retained zero-traffic tag',async()=>{
 const f=fixture(),read=f.read;
 f.options.read=args=>{const state=read(args);if(args.some(x=>x.startsWith('--update-tags=')))throw Error('quota exceeded');return state;};
 await assert.rejects(activateTestedRevision(f.options),/quota exceeded/);
 assert.ok(f.calls.some(a=>a.includes('--remove-tags=c-aaaaaaaaaaaa')));
 assert.equal(f.calls.some(a=>a.some(x=>x.startsWith('--to-revisions='))),false);
});

test('failure cleanup preserves a candidate that became serving',async()=>{
 const f=fixture({healthy:false,commit},503),read=f.read;
 f.options.read=args=>{const state=read(args);if(args[1]==='services'&&args[2]==='describe')state.status.traffic[0].percent=100;return state;};
 await assert.rejects(activateTestedRevision(f.options),/failed runtime health/);
 assert.equal(f.calls.some(a=>a.includes('--remove-tags=c-aaaaaaaaaaaa')),false);
});

test('cleanup errors do not hide the activation failure',async()=>{
 const f=fixture(),read=f.read;
 f.options.read=args=>{const state=read(args);if(args.some(x=>x.startsWith('--update-tags=')))throw Error('original quota error');if(args.some(x=>x.startsWith('--remove-tags=')))throw Error('cleanup error');return state;};
 await assert.rejects(activateTestedRevision(f.options),/original quota error/);
});

test('legacy startup-test tag is retired only after its revision stops serving',()=>{
 const tagged={revisionName:'former-serving',tag:'startup-gen2'};
 assert.deepEqual(unusedCandidateTags({status:{traffic:[tagged,{revisionName:'former-serving',percent:100}]}}),[]);
 assert.deepEqual(unusedCandidateTags({status:{traffic:[tagged,{revisionName:'new-serving',percent:100}]}}),['startup-gen2']);
});
