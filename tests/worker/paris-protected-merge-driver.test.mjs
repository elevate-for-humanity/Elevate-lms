import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HEAD = 'a'.repeat(40);
const preload = `
const scenario = JSON.parse(process.env.SCENARIO);
const head = 'a'.repeat(40), main = 'b'.repeat(40);
const writes = [], reads = [];
let approved = false, merged = false, policyReads = 0, checkReads = 0, e2eReads = 0;
process.on('exit', () => console.log('FIXTURE_EVIDENCE ' + JSON.stringify({ writes, reads })));
const pr = {number:42,state:'open',draft:false,merged:false,base:{ref:'main'},head:{sha:head},user:{login:'owner'}};
const reply = (data, status=200) => Response.json(data, {status});
globalThis.fetch = async (url, options={}) => {
  const method=options.method||'GET', path=new URL(url).pathname;
  if(new URL(url).hostname==='admin.example.test') {
    const body=JSON.parse(options.body);
    if(body.phase==='merge-authorize') return reply({authorized:scenario.authorized!==false,reasons:['fixture denial']});
    return reply({accepted:true});
  }
  if(scenario.expiredVerifier && options.headers.Authorization==='Bearer fixture-verifier-token')return reply({message:'Bad credentials'},401);
  if(method==='GET')reads.push(path); else writes.push({method,path,body:JSON.parse(options.body||'{}')});
  if(path.endsWith('/pulls/42') && method==='GET')return reply(scenario.headMoved?{...pr,head:{sha:main}}:pr);
  if(path.endsWith('/check-runs')) {
    checkReads++;
    return reply({check_runs:[{name:'CI Required Gate',app:{id:15368},status:'completed',conclusion:scenario.failedCheck||(scenario.checkRegressed&&checkReads>1)?'failure':'success'},...(scenario.failedOptional?[{name:'E2E desktop-chrome',status:'completed',conclusion:'failure'}]:[])]});
  }
  if(path.endsWith('/reviews') && method==='GET' && scenario.malformedReviews)return reply(null);
  if(path.endsWith('/reviews') && method==='GET')return reply(scenario.changeRequest?[{user:{login:'reviewer',type:'User'},state:'CHANGES_REQUESTED',submitted_at:'2026-11-19T00:00:00Z'}]:approved?[{user:{login:'verifier',type:'User'},state:'APPROVED',commit_id:head,submitted_at:'2026-11-19T00:00:00Z'}]:[]);
  if(path.endsWith('/actions/workflows/e2e-desktop-chrome.yml/runs')) {
    e2eReads++;
    return reply({workflow_runs:scenario.e2eMissing?[]:[{id:99,head_sha:head,event:'pull_request',path:'.github/workflows/e2e-desktop-chrome.yml',head_repository:{full_name:'fixture/repository'},status:scenario.e2ePending?'queued':'completed',conclusion:scenario.e2eFailure||(scenario.e2eRegressed&&e2eReads>1)?'failure':'success'}]});
  }
  if(path.endsWith('/actions/runs/99/jobs'))return reply({jobs:['E2E desktop-chrome','Public Host Shop navigation and application (five devices)','Email device browsers'].filter((_,i)=>!scenario.e2eJobMissing||i!==2).map(name=>({name,status:'completed',conclusion:'success'}))});
  if(path.endsWith('/rules/branches/main'))return reply([]);
  if(path.endsWith('/branches/main/protection')) {
    if(scenario.policyDenied)return reply({message:'Resource not accessible'},403);
    policyReads++;
    const count=scenario.policyChanged&&policyReads>1?1:scenario.count;
    return reply({required_pull_request_reviews:scenario.policyMissing?{}:{required_approving_review_count:count},required_status_checks:{checks:[{context:'CI Required Gate',app_id:15368}]}});
  }
  if(path.endsWith('/git/ref/heads/main'))return reply({object:{sha:merged?'c'.repeat(40):main}});
  if(path.includes('/compare/'))return reply({status:scenario.behind?'behind':'ahead'});
  if(path.endsWith('/permission'))return reply({permission:scenario.permission||'write'});
  if(path==='/user')return reply({login:scenario.selfReviewer?'owner':'verifier',type:scenario.botReviewer?'Bot':'User'});
  if(path.endsWith('/reviews') && method==='POST') {approved=true;return reply({id:1});}
  if(path.endsWith('/merge') && method==='PUT') {merged=true;return reply({merged:true,sha:'c'.repeat(40)});}
  if(path.endsWith('/actions/workflows/ci.yml/dispatches') && method==='POST')return new Response(null,{status:204});
  throw Error('UNEXPECTED_FIXTURE_REQUEST '+method+' '+path);
};
`;
async function run(t, scenario) {
  const folder=await mkdtemp(join(tmpdir(),'paris-merge-driver-'));
  t.after(()=>rm(folder,{recursive:true,force:true}));
  const hook=join(folder,'fetch-fixture.mjs');
  await writeFile(hook,preload);
  const env={PATH:process.env.PATH,SCENARIO:JSON.stringify(scenario),GH_TOKEN:'fixture-workflow-token',PARIS_POLICY_TOKEN:'fixture-policy-token',PARIS_ID_TOKEN:'fixture-identity',REPAIR_ID:'fixture-repair',PR_NUMBER:'42',EXPECTED_HEAD_SHA:HEAD,REPAIR_REPOSITORY:'fixture/repository',ADMIN_URL:'https://admin.example.test',GITHUB_RUN_ID:'123',PARIS_MERGE_CHECK_ONLY:String(scenario.checkOnly??false)};
  if(scenario.verifier)env.PARIS_VERIFIER_TOKEN='fixture-verifier-token';
  const child=spawnSync(process.execPath,['--import',hook,'scripts/paris-protected-merge.mjs'],{cwd:new URL('../..',import.meta.url),env,encoding:'utf8',timeout:10000});
  const evidence=JSON.parse(child.stdout.split('\n').find(line=>line.startsWith('FIXTURE_EVIDENCE '))?.slice('FIXTURE_EVIDENCE '.length)||'{}');
  return {...child,evidence};
}

test('verified zero policy merges exact head with workflow token and never submits a review',async t=>{
  const r=await run(t,{count:0});
  assert.equal(r.status,0,r.stderr);
  assert.deepEqual(r.evidence.writes.map(w=>w.method+' '+w.path),['PUT /repos/fixture/repository/pulls/42/merge','POST /repos/fixture/repository/actions/workflows/ci.yml/dispatches']);
  assert.equal(r.evidence.writes[0].body.sha,HEAD);
  assert.equal(r.evidence.writes[1].body.inputs.requested_sha,'c'.repeat(40));
  assert.ok(!r.evidence.reads.includes('/user'));
});
test('zero policy ignores an expired optional verifier PAT when the authorized job token and policy reader are available',async t=>{
  const r=await run(t,{count:0,verifier:true,expiredVerifier:true});
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.evidence.writes.filter(w=>w.path.endsWith('/reviews')).length,0);
});
test('zero-policy check-only proves readiness without any GitHub writes',async t=>{
  const r=await run(t,{count:0,checkOnly:true});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/"checkOnly":true,"ready":true/);
  assert.deepEqual(r.evidence.writes,[]);
});
test('positive policy retains an actual independent verifier approval',async t=>{
  const r=await run(t,{count:1,verifier:true});
  assert.equal(r.status,0,r.stderr);
  assert.deepEqual(r.evidence.writes.map(w=>w.method),['POST','PUT','POST']);
  assert.equal(r.evidence.writes[0].body.event,'APPROVE');
});
test('check-only never manufactures a positive-policy approval',async t=>{
  const r=await run(t,{count:1,verifier:true,checkOnly:true});
  assert.equal(r.status,1);
  assert.match(r.stderr,/APPROVALS_INSUFFICIENT/);
  assert.deepEqual(r.evidence.writes,[]);
});
for(const scenario of [
  {count:0,authorized:false},{policyMissing:true},{count:null},{count:'0'},
  {count:0,e2eMissing:true},{count:0,e2ePending:true},{count:0,e2eFailure:true},{count:0,e2eJobMissing:true},{count:0,e2eRegressed:true},{count:0,failedCheck:true},{count:0,failedOptional:true},{count:0,policyDenied:true},{count:0,malformedReviews:true},{count:0,headMoved:true},{count:0,changeRequest:true},
  {count:0,changeRequest:true,permission:'unknown'},{count:0,behind:true},
  {count:0,policyChanged:true},{count:0,checkRegressed:true},
  {count:1},{count:1,verifier:true,selfReviewer:true},{count:1,verifier:true,botReviewer:true},
])test('unsafe or unverified merge remains unwritten: '+JSON.stringify(scenario),async t=>{
  const r=await run(t,scenario);
  assert.equal(r.status,1,r.stdout);
  assert.deepEqual(r.evidence.writes,[]);
});
