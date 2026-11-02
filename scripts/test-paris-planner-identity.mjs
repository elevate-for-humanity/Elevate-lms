import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const workflow=readFileSync(new URL('../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const stage=workflow.slice(workflow.indexOf('      - name: Stage the PARIS patch'));
const program=stage.match(/python - <<'PY'\n([\s\S]*?)          PY\n/)?.[1].split('\n').map(line=>line.slice(10)).join('\n');
function exercise(mode='success') {
 const harness=`import os,json,io,sys,tempfile,urllib.request,urllib.parse,urllib.error\nf=json.load(sys.stdin)\nclock=0\nissued=0\nmutations=0\noutcome=None\ndef response(req,timeout):\n global clock,issued,mutations\n if req.full_url.startswith('https://oidc.example/'):\n  assert req.get_header('Authorization')=='Bearer request-authority-fixture'\n  query=urllib.parse.parse_qs(urllib.parse.urlsplit(req.full_url).query)\n  assert query['audience']==['elevate-paris-code-repair']\n  assert query['api-version']==['2']\n  issued+=1\n  return io.StringIO(json.dumps({'value':'invalid' if f['mode']=='invalid' else 'header.'+str(clock)+'.signature'}))\n assert req.full_url=='https://admin.example/api/cron/paris-code-repair'\n token=req.get_header('Authorization').split(' ')[1]\n assert clock-int(token.split('.')[1])<300,'Expired workflow identity'\n assert req.get_header('X-paris-github-token')=='contents-write-fixture'\n mutations+=1\n if f['mode']=='ambiguous' and mutations==3: raise TimeoutError('ambiguous POST outcome')\n clock+=90\n return io.StringIO(json.dumps({'pending':True,'turn':mutations} if mutations<8 else {'sha':'a'*40,'baseSha':'b'*40}))\nurllib.request.urlopen=response\nwith tempfile.TemporaryDirectory() as directory:\n os.environ.update({'REPAIR_ID':'12345678-1234-1234-1234-123456789abc','GITHUB_RUN_ID':'7','GITHUB_OUTPUT':directory+'/output','ADMIN_URL':'https://admin.example','GH_TOKEN':'contents-write-fixture','PARIS_ID_TOKEN':'header.0.signature','ACTIONS_ID_TOKEN_REQUEST_URL':'https://oidc.example/token?api-version=2&audience=wrong','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'request-authority-fixture'})\n try: exec(f['program'])\n except BaseException as error: outcome=type(error).__name__\n output=open(os.environ['GITHUB_OUTPUT']).read() if os.path.exists(os.environ['GITHUB_OUTPUT']) else ''\n print(json.dumps({'issued':issued,'mutations':mutations,'clock':clock,'outcome':outcome,'output':output}))\n`;
 const stdout=execFileSync('python3',['-c',harness],{input:JSON.stringify({mode,program}),encoding:'utf8'});
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
