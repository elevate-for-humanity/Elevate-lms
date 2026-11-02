// @vitest-environment node
import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=readFileSync('.github/workflows/paris-code-repair.yml','utf8');
const start=source.indexOf('          # Require the deployed control plane');
const finish=source.indexOf("          endpoint='https://admin.elevateforhumanity.org/api/cron/paris-code-repair'",start);
const guard=source.slice(start,finish).split('\n').map(line=>line.slice(10)).join('\n');
function check(fixture:unknown){
 const program=`import os,json,re,urllib.request,io,sys\nf=json.load(sys.stdin)\nos.environ.update({'GITHUB_SHA':'a'*40,'GITHUB_REPOSITORY':'elevate-for-humanity/Elevate-lms','GH_TOKEN':'fixture'})\ndef response(req,timeout):\n return io.StringIO(json.dumps(f['health'] if req.full_url.endswith('/api/health') else f['comparison']))\nurllib.request.urlopen=response\n`+guard+"\nprint('COMPATIBLE')\n";
 return execFileSync('python3',['-c',program],{input:JSON.stringify(fixture),encoding:'utf8'});
}
it('accepts the exact healthy runtime and a later workflow changing only browser/UI/docs',()=>{
 expect(check({health:{healthy:true,commit:'a'.repeat(40)}})).toContain('COMPATIBLE');
 expect(check({health:{healthy:true,commit:'b'.repeat(40)},comparison:{status:'ahead',files:[{filename:'services/studio-browser/cdp-snapshot.mjs'},{filename:'docs/audit.md'}]}})).toContain('COMPATIBLE');
});
it('defers unhealthy, divergent, renamed server code and incomplete comparison evidence',()=>{
 const health={healthy:true,commit:'b'.repeat(40)};
 for(const comparison of [{status:'diverged',files:[]},{status:'ahead',files:[{filename:'lib/ai/runtime/code-repair.ts'}]},{status:'ahead',files:[{filename:'docs/moved.txt',previous_filename:'lib/auth/guard.ts'}]},{status:'ahead',files:Array.from({length:300},()=>({filename:'docs/audit.md'}))},{status:'ahead'}])expect(check({health,comparison})).not.toContain('COMPATIBLE');
 expect(check({health:{healthy:false,commit:'a'.repeat(40)}})).not.toContain('COMPATIBLE');
});
