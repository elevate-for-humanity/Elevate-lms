import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('./verify-public-entry.mjs', import.meta.url), 'utf8')
  .replace("import assert from 'node:assert/strict';", '');
const execute = new (Object.getPrototypeOf(async function(){}).constructor)(
  'fetch', 'assert', 'process', 'console', source);
const canonical = 'https://www.elevateforhumanity.org';

async function inspect(overrides = {}) {
  const process = {}, results = [];
  const fetch = async input => {
    const url = new URL(input);
    if (url.origin !== canonical) return {status:301,headers:new Headers({location:canonical+'/'}),body:null};
    if (url.pathname === '/api/version') return {status:200,json:async()=>({commitSha:'a'.repeat(40)})};
    if (url.pathname === '/api/programs/pricing') {
      const slug = url.searchParams.get('slug');
      return {status:200,json:async()=>({tuition_cents:slug==='barber-apprenticeship'?498000:600000,
        deposit_default_cents:60000,payment_frequency:'monthly',...overrides})};
    }
    return {status:200,headers:new Headers(),body:null,text:async()=>
      '<h1>Program</h1>self-pay J Noelle Collective /images/partners/j-noelle/official-salon-2026.webp https://jnoellecollective.com/ https://www.vagaro.com/jnoelleandco'};
  };
  await execute(fetch, assert, process, {log:value=>results.push(JSON.parse(value))});
  return {exitCode:process.exitCode, results};
}

test('actual public entry verifier accepts approved $600 apprenticeship deposits', async()=>{
  const result=await inspect();
  assert.equal(result.exitCode,undefined);
  assert.equal(result.results.filter(row=>row.name.startsWith('program:')&&row.passed).length,4);
});
test('actual public entry verifier rejects retired percentage-based deposits', async()=>{
  const result=await inspect({deposit_default_cents:150000});
  assert.equal(result.exitCode,1);
  assert.equal(result.results.filter(row=>row.name.startsWith('program:')&&!row.passed).length,4);
});
test('actual public entry verifier still rejects tuition drift', async()=>{
  const result=await inspect({tuition_cents:1});
  assert.equal(result.exitCode,1);
  assert.equal(result.results.filter(row=>row.name.startsWith('program:')&&!row.passed).length,4);
});
