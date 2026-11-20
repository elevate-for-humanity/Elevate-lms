import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const workflow=readFileSync(new URL('../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const startup=workflow.match(/run: &obtain_workflow_identity \|\n\s+node - <<'NODE'\n([\s\S]*?)\n\s+NODE/)[1];
const stage=workflow.slice(workflow.indexOf('      - name: Stage the PARIS patch'));
const program=stage.match(/python - <<'PY'\n([\s\S]*?)          PY\n/)?.[1].split('\n').map(line=>line.slice(10)).join('\n');
function exerciseStartup(mode) {
 const harness=`
 const mode = process.argv[1];
 let issued = 0;
 let exported = 0;
 require('node:timers/promises').setTimeout = async () => {};
 require('node:fs').appendFileSync = (path, body) => {
   if (path !== 'fixture' || body !== 'PARIS_ID_TOKEN=header.payload.signature\\n') throw Error('Unexpected token export');
   exported++;
 };
 global.fetch = async () => {
   issued++;
   return {ok: true, json: async () => {
     if (mode === 'body_timeout' && issued === 1) throw new DOMException('timed out', 'TimeoutError');
     if (mode === 'malformed') throw new SyntaxError('malformed JSON');
     return {value: 'header.payload.signature'};
   }};
 };
 process.on('exit', () => console.log(JSON.stringify({issued, exported})));
 `;
 const result=spawnSync(process.execPath,['-e',harness+'\n'+startup,mode],{
  encoding:'utf8',env:{...process.env,ACTIONS_ID_TOKEN_REQUEST_URL:'https://oidc.example/token',
   ACTIONS_ID_TOKEN_REQUEST_TOKEN:'fixture',AUDIENCE:'elevate-paris-code-repair',
   PARIS_IDENTITY_HTTP_TIMEOUT_SECONDS:'10',GITHUB_ENV:'fixture'},
 });
 return {status:result.status,...JSON.parse(result.stdout.trim().split('\n').at(-1))};
}
function exercise(mode='success',settings={}) {
 const harness=`import os,json,io,sys,tempfile,time,urllib.request,urllib.parse,urllib.error\nf=json.load(sys.stdin)\nclock=0\nissued=0\nmutations=0\noutcome=None\ndef response(req,timeout):\n global clock,issued,mutations\n if req.full_url.startswith('https://oidc.example/'):\n  assert req.get_header('Authorization')=='Bearer request-authority-fixture'\n  query=urllib.parse.parse_qs(urllib.parse.urlsplit(req.full_url).query)\n  assert query['audience']==['elevate-paris-code-repair']\n  assert query['api-version']==['2']\n  issued+=1\n  if f['mode']=='oidc_unavailable' or (f['mode']=='oidc_recovers' and issued<=2): raise urllib.error.HTTPError(req.full_url,504,'timeout',{},io.BytesIO())\n  if f['mode']=='oidc_forbidden': raise urllib.error.HTTPError(req.full_url,403,'forbidden',{},io.BytesIO())\n  if issued==1 and f['mode']=='oidc_connection_timeout': raise urllib.error.URLError(TimeoutError('connection timed out'))\n  if f['mode']=='oidc_connection_error': raise urllib.error.URLError(ConnectionRefusedError('connection refused'))\n  if issued==1 and f['mode']=='oidc_body_timeout':\n   class StalledResponse(io.StringIO):\n    def read(self): raise TimeoutError('body timed out')\n   return StalledResponse()\n  return io.StringIO(json.dumps({'value':'invalid' if f['mode']=='invalid' else 'header.'+str(clock)+'.signature'}))\n assert req.full_url=='https://admin.example/api/cron/paris-code-repair'\n token=req.get_header('Authorization').split(' ')[1]\n assert clock-int(token.split('.')[1])<300,'Expired workflow identity'\n assert req.get_header('X-paris-github-token')=='contents-write-fixture'\n mutations+=1\n if f['mode']=='ambiguous' and mutations==3: raise TimeoutError('ambiguous POST outcome')\n clock+=90\n return io.StringIO(json.dumps({'pending':True,'turn':mutations} if mutations<8 else {'sha':'a'*40,'baseSha':'b'*40}))\nurllib.request.urlopen=response\ntime.sleep=lambda _: None\nwith tempfile.TemporaryDirectory() as directory:\n os.environ.update({'REPAIR_ID':'12345678-1234-1234-1234-123456789abc','GITHUB_RUN_ID':'7','GITHUB_OUTPUT':directory+'/output','ADMIN_URL':'https://admin.example','GH_TOKEN':'contents-write-fixture','PARIS_ID_TOKEN':'header.0.signature','ACTIONS_ID_TOKEN_REQUEST_URL':'https://oidc.example/token?api-version=2&audience=wrong','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'request-authority-fixture','PARIS_IDENTITY_HTTP_TIMEOUT_SECONDS':'10','PARIS_REPAIR_BUDGET_MINUTES':'15','PARIS_PREPARE_REQUEST_TIMEOUT_SECONDS':'20','PARIS_REPAIR_MAX_TURNS':'10'})\n os.environ.update(f['settings'])\n try: exec(f['program'])\n except BaseException as error: outcome=type(error).__name__\n output=open(os.environ['GITHUB_OUTPUT']).read() if os.path.exists(os.environ['GITHUB_OUTPUT']) else ''\n print(json.dumps({'issued':issued,'mutations':mutations,'clock':clock,'outcome':outcome,'output':output}))\n`;
 const stdout=execFileSync('python3',['-c',harness],{input:JSON.stringify({mode,program,settings}),encoding:'utf8'});
 return JSON.parse(stdout.trim().split('\n').at(-1));
}
test('planner mutations remain authorized beyond five minutes by issuing one identity per turn',()=>{
 const result=exercise();
 assert.equal(result.outcome,null);
 assert.equal(result.issued,8);
 assert.equal(result.mutations,8);
 assert.ok(result.clock>600);
 assert.ok(result.output.includes('sha='+'a'.repeat(40)));
});
test('invalid identity issuance cannot start a repair mutation',()=>{
 const result=exercise('invalid');
 assert.equal(result.outcome,'SystemExit');
 assert.equal(result.issued,1);
 assert.equal(result.mutations,0);
});
test('ambiguous planner POST failures do not replay work or generate validation evidence',()=>{
 const result=exercise('ambiguous');
 assert.equal(result.outcome,'TimeoutError');
 assert.equal(result.issued,3);
 assert.equal(result.mutations,3);
 assert.equal(result.output,'');
});
test('missing or invalid bounded settings cannot start planner mutations',()=>{
 for(const settings of [
  {PARIS_REPAIR_BUDGET_MINUTES:''},{PARIS_REPAIR_BUDGET_MINUTES:'0'},
  {PARIS_REPAIR_BUDGET_MINUTES:'1441'},
  {PARIS_IDENTITY_HTTP_TIMEOUT_SECONDS:''},{PARIS_IDENTITY_HTTP_TIMEOUT_SECONDS:'301'},
 ]){
  const result=exercise('success',settings);
  assert.equal(result.outcome,'SystemExit');
  assert.equal(result.issued,0);assert.equal(result.mutations,0);assert.equal(result.output,'');
 }
});
test('configured planner continuation cap stops without candidate evidence or replay',()=>{
 const result=exercise('success',{PARIS_REPAIR_MAX_TURNS:'2'});
 assert.equal(result.outcome,'SystemExit');
 assert.equal(result.issued,3);assert.equal(result.mutations,3);assert.equal(result.output,'');
});

test('a transient identity outage recovers before dispatching exactly one mutation per planner turn',()=>{
 const result=exercise('oidc_recovers');
 assert.equal(result.outcome,null);
 assert.equal(result.issued,10);
 assert.equal(result.mutations,8);
});
test('persistent outage and forbidden identity fail closed without sending a repair mutation',()=>{
 const unavailable=exercise('oidc_unavailable');
 const forbidden=exercise('oidc_forbidden');
 for(const [result,attempts] of [[unavailable,3],[forbidden,1]]){
  assert.equal(result.outcome,'SystemExit');
  assert.equal(result.issued,attempts);
  assert.equal(result.mutations,0);
 }
});

test('startup retries a stalled identity response body but rejects malformed JSON immediately',()=>{
 assert.deepEqual(exerciseStartup('body_timeout'),{status:0,issued:2,exported:1});
 assert.deepEqual(exerciseStartup('malformed'),{status:1,issued:1,exported:0});
});

test('planner retries connection and response-body timeouts without replaying mutations',()=>{
 for(const mode of ['oidc_connection_timeout','oidc_body_timeout']){
  const result=exercise(mode);
  assert.equal(result.outcome,null);
  assert.equal(result.issued,9);
  assert.equal(result.mutations,8);
 }
 const result=exercise('oidc_connection_error');
 assert.equal(result.outcome,'URLError');
 assert.equal(result.issued,1);
 assert.equal(result.mutations,0);
});
