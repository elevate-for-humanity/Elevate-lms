import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=resolve('scripts/enforce-branch-protection.sh');
const defaultPolicy={
  required_pull_request_reviews:{required_approving_review_count:0},
  required_status_checks:{strict:true,contexts:['CI Required Gate'],checks:[]},
  allow_force_pushes:{enabled:false},allow_deletions:{enabled:false},
};
function run({policy=defaultPolicy,rules=[],status=200}={}){
  const dir=mkdtempSync(join(tmpdir(),'paris-branch-audit-'));
  try {
    const fakeCurl=join(dir,'curl');
    writeFileSync(join(dir,'classic.json'),JSON.stringify(policy));
    writeFileSync(join(dir,'rules.json'),JSON.stringify(rules));
    writeFileSync(fakeCurl,`#!/bin/bash
set -eu
url="\${!#}"
for arg in "$@"; do
  case "$arg" in -X|--request|-d|--data|--data-raw|--upload-file) exit 97;; esac
done
if [[ "$url" == *'/branches/main/protection' ]]; then cat '${dir}/classic.json'; else cat '${dir}/rules.json'; fi
printf '\\n${status}'
`);
    chmodSync(fakeCurl,0o755);
    return spawnSync('bash',[script],{encoding:'utf8',cwd:resolve('.'),
      env:{...process.env,PATH:dir+':'+process.env.PATH,GH_TOKEN:'synthetic-test-token'},timeout:5000});
  } finally {rmSync(dir,{recursive:true,force:true});}
}
test('read-only audit accepts zero reviews and exact strict CI gate',()=>{
  const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/READ_ONLY_PASS/);
});
test('rejects one required approval without mutating policy',()=>{
  const r=run({policy:{...defaultPolicy,required_pull_request_reviews:{required_approving_review_count:1}}});
  assert.equal(r.status,1);assert.match(r.stderr,/APPROVAL_COUNT_MISMATCH/);
});
test('rejects missing CI gate or nonstrict checks',()=>{
  for(const status of [{strict:true,contexts:[],checks:[]},{strict:false,contexts:['CI Required Gate'],checks:[]}]){
    const r=run({policy:{...defaultPolicy,required_status_checks:status}});
    assert.equal(r.status,1);assert.match(r.stderr,/CLASSIC_CONTRACT_MISMATCH/);
  }
});
test('rejects effective rulesets requiring approving review',()=>{
  const r=run({rules:[{type:'pull_request',parameters:{required_approving_review_count:1}}]});
  assert.equal(r.status,1);assert.match(r.stderr,/RULESET_REVIEW_REQUIREMENT_PRESENT/);
});
test('403 policy read fails closed',()=>{
  const r=run({status:403});assert.equal(r.status,1);assert.match(r.stderr,/API_HTTP_403/);
});
