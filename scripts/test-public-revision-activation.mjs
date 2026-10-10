import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTestedRevision } from './gcp/activate-tested-public-revision.mjs';
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
