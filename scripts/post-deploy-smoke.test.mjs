import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const healthy={ready:true,healthy:true,commit:'a'.repeat(40),dependencies:{supabase:{ok:true}}};
function smoke(health,{httpFailure=false,links=true}={}) {
  const directory=mkdtempSync(join(tmpdir(),'elevate-smoke-test-'));
  try {
    writeFileSync(join(directory,'curl'),`#!/usr/bin/env bash
case "\${*: -1}" in
*/api/ready) printf 200;;
*/api/health) ${httpFailure?'exit 22':'printf "%s" "$SMOKE_HEALTH"'};;
*/programs) printf "%s" "$SMOKE_LINKS";;
esac
`,{mode:0o755});
    return spawnSync('bash',['scripts/post-deploy-smoke.sh'],{encoding:'utf8',env:{...process.env,
      PATH:directory+':'+process.env.PATH,SMOKE_HEALTH:JSON.stringify(health),
      SMOKE_LINKS:links?'<a href="/programs/hvac">HVAC</a>':''}});
  }finally {rmSync(directory,{recursive:true,force:true});}
}
test('accepts current live dependency contract without retired activation fields',()=>{
  assert.equal(smoke(healthy).status,0);
});
test('rejects failed dependency even when HTTP and ready are successful',()=>{
  assert.notEqual(smoke({...healthy,dependencies:{supabase:{ok:false}}}).status,0);
});
test('rejects unhealthy runtime, unknown commit, unavailable health and missing links',()=>{
  assert.notEqual(smoke({...healthy,healthy:false}).status,0);
  assert.notEqual(smoke({...healthy,commit:'unknown'}).status,0);
  assert.notEqual(smoke(healthy,{httpFailure:true}).status,0);
  assert.notEqual(smoke(healthy,{links:false}).status,0);
});
