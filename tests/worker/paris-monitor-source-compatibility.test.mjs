import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const workflow=readFileSync(new URL('../../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const block=workflow.match(/python - <<'PYCODE'\n([\s\S]*?)\n          PYCODE/)[1];
const source=block.split('\n').map(line=>line.slice(10)).join('\n');
const expected='a'.repeat(40),runtime='b'.repeat(40);
const receipt={head_sha:runtime,head_branch:'main',event:'workflow_dispatch',path:'.github/workflows/deploy-admin.yml',status:'completed',conclusion:'success'};
// Execute the actual workflow Python, with every HTTP request intercepted.
const harness=String.raw`
import contextlib,io,json,os,sys,tempfile,urllib.request,urllib.error
from unittest.mock import patch
case=json.load(sys.stdin); urls=[]; failure=None
def respond(req,timeout=None):
 url=req.full_url; urls.append(url)
 if url.endswith('/api/ready'): data=case['health']
 elif '/compare/' in url: data=case.get('comparison',{})
 elif '/actions/runs?' in url:
  if case.get('receipt_error'): raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
  data={'workflow_runs':case.get('runs',[])}
 elif url.endswith('/api/cron/paris-code-repair'):
  phase=json.loads(req.data)['phase']
  data=({'workflowAuthorization':'temporary-job-v1','diagnosticVersion':2,'plannerContinuation':'durable-turn-v1',
   'repository':{'ok':True},'contents':{'ok':True},'workflow':{'ok':True}} if phase=='auth-diagnostic' else {'dispatchRequired':False})
 else: raise AssertionError('Unexpected HTTP request: '+url)
 return io.BytesIO(json.dumps(data).encode())
with tempfile.NamedTemporaryFile() as output:
 env={'GITHUB_SHA':case['expected'],'GITHUB_REPOSITORY':'elevate-for-humanity/Elevate-lms',
  'GH_TOKEN':'test-only','PARIS_ID_TOKEN':'test-only','GITHUB_OUTPUT':output.name}
 with patch.dict(os.environ,env),patch('urllib.request.urlopen',respond),contextlib.redirect_stdout(io.StringIO()):
  try: exec(compile(case['source'],'monitor-workflow','exec'),{})
  except SystemExit as error:
   if error.code not in [None,0]: failure=str(error.code)
  except Exception as error: failure=type(error).__name__
 output.seek(0); result=output.read().decode()
print(json.dumps({'outputs':result,'urls':urls,'failure':failure}))
`;
function run(options={}){
 const data={source,expected,health:{ready:true,agenticExecutorReady:true,commit:runtime},...options};
 const p=spawnSync('python3',['-c',harness],{input:JSON.stringify(data),encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);
}
const reached=result=>result.urls.some(url=>url.endsWith('/api/cron/paris-code-repair'));
test('a queued monitor accepts a newer descendant only with its exact successful Admin release',()=>{
 const result=run({comparison:{status:'behind',files:[{filename:'lib/devstudio/paris-code-engineer.ts'}]},runs:[receipt]});
 assert.equal(result.failure,null);assert.equal(reached(result),true);
 assert.match(result.outputs,new RegExp('runtime_sha='+runtime));
 assert.ok(result.urls.some(url=>url.includes('head_sha='+runtime)));
});
test('a newer runtime without the exact completed release stays blocked',()=>{
 for(const runs of [[],[{...receipt,head_sha:expected}],[{...receipt,conclusion:'failure'}],
  [{...receipt,status:'in_progress'}],[{...receipt,head_branch:'other'}],
  [{...receipt,path:'.github/workflows/deploy-google-marketing-trigger.yml'}],
  [{...receipt,event:'pull_request'}]]){
  const result=run({comparison:{status:'behind'},runs});
  assert.equal(reached(result),false);assert.match(result.outputs,/recovery_blocked=admin_source/);
 }
});
test('an older runtime still blocks changed control-plane source',()=>{
 for(const filename of ['lib/devstudio/paris-code-engineer.ts','apps/admin/app/api/cron/paris-code-repair/route.ts','packages/runtime/index.ts']){
  const result=run({comparison:{status:'ahead',files:[{filename}]},runs:[receipt]});
  assert.equal(reached(result),false);assert.match(result.outputs,/recovery_blocked=admin_source/);
 }
});
test('exact source and unchanged control-plane source can proceed',()=>{
 assert.equal(reached(run({health:{ready:true,agenticExecutorReady:true,commit:expected}})),true);
 assert.equal(reached(run({comparison:{status:'ahead',files:[{filename:'components/header.tsx'}]}})),true);
});
test('divergent source, incomplete changes and renamed control-plane files remain blocked',()=>{
 for(const comparison of [{status:'diverged',files:[]},{status:'ahead'},
  {status:'ahead',files:Array.from({length:300},()=>({filename:'components/x.tsx'}))},
  {status:'ahead',files:[{filename:'components/x.tsx',previous_filename:'lib/planner.ts'}]}]){
  const result=run({comparison,runs:[receipt]});assert.equal(reached(result),false);
 }
});
test('failed release-evidence authorization cannot advance the repair',()=>{
 const result=run({comparison:{status:'behind'},receipt_error:true});
 assert.equal(result.failure,'HTTPError');assert.equal(reached(result),false);
});
