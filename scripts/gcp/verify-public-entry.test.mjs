import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { APPRENTICESHIP_RELEASE_TERMS, assertApprenticeshipPricingContract, assertApprenticeshipPublicCopy } from './apprenticeship-payment-contract.mjs';

const source = readFileSync(new URL('./verify-public-entry.mjs', import.meta.url), 'utf8')
  .replace("import assert from 'node:assert/strict';", '')
  .replace(/^import .* from '\.\/apprenticeship-payment-contract\.mjs';$/m, '');
const execute = new (Object.getPrototypeOf(async function(){}).constructor)(
  'fetch', 'assert', 'process', 'console', 'APPRENTICESHIP_RELEASE_TERMS', 'assertApprenticeshipPricingContract', 'assertApprenticeshipPublicCopy', source);
const canonical = 'https://www.elevateforhumanity.org';

async function inspect(overrides = {}, extraHtml = '') {
  const process = {}, results = [];
  const fetch = async input => {
    const url = new URL(input);
    if (url.origin !== canonical) return {status:301,headers:new Headers({location:canonical+'/'}),body:null};
    if (url.pathname === '/api/version') return {status:200,json:async()=>({commitSha:'a'.repeat(40)})};
    if (url.pathname === '/api/programs/pricing') {
      const slug = url.searchParams.get('slug');
      return {status:200,json:async()=>({tuition_cents:slug==='barber-apprenticeship'?498000:600000,
        program_slug:slug,deposit_min_cents:60000,deposit_default_cents:60000,payment_frequency:slug==='barber-apprenticeship'?'weekly':'monthly',payment_weeks:slug==='barber-apprenticeship'?29:undefined,...overrides})};
    }
    return {status:200,headers:new Headers(),body:null,text:async()=>
      '<h1>Program</h1>self-pay J Noelle Collective /images/partners/j-noelle/official-salon-2026.webp https://jnoellecollective.com/ https://www.vagaro.com/jnoelleandco' + extraHtml};
  };
  await execute(fetch, assert, process, {log:value=>results.push(JSON.parse(value))}, APPRENTICESHIP_RELEASE_TERMS, assertApprenticeshipPricingContract, assertApprenticeshipPublicCopy);
  return {exitCode:process.exitCode, results};
}

test('actual public entry verifier accepts approved $600 apprenticeship deposits', async()=>{
  const result=await inspect();
  assert.equal(result.exitCode,undefined);
  assert.equal(result.results.filter(row=>row.name.startsWith('program:')&&row.passed).length,4);
});

test('actual verifier accepts weekly barber and monthly beauty terms together', async()=>{
  const result=await inspect();
  assert.equal(result.exitCode,undefined);
  const rows=result.results.filter(row=>row.name.startsWith('program:'));
  assert.equal(rows.find(row=>row.name==='program:barber-apprenticeship').paymentFrequency,'weekly');
  assert.equal(rows.find(row=>row.name==='program:barber-apprenticeship').paymentWeeks,29);
  assert.equal(rows.filter(row=>row.paymentFrequency==='monthly'&&row.passed).length,3);
});
test('actual verifier rejects the former monthly barber assumption', async()=>{
  const result=await inspect({payment_frequency:'monthly'});
  assert.equal(result.exitCode,1);
  assert.deepEqual(result.results.filter(row=>!row.passed).map(row=>row.name),['program:barber-apprenticeship']);
});
test('actual verifier rejects weekly terms for the other three programs', async()=>{
  const result=await inspect({payment_frequency:'weekly'});
  assert.equal(result.exitCode,1);
  assert.equal(result.results.filter(row=>!row.passed).length,3);
});
test('actual verifier rejects an incorrect barber term', async()=>{
  const result=await inspect({payment_weeks:3});
  assert.equal(result.exitCode,1);
  assert.deepEqual(result.results.filter(row=>!row.passed).map(row=>row.name),['program:barber-apprenticeship']);
});
test('actual verifier rejects a conflicting minimum deposit', async()=>{
  const result=await inspect({deposit_min_cents:174300});
  assert.equal(result.exitCode,1);
  assert.equal(result.results.filter(row=>!row.passed).length,4);
});
for(const code of ['OCT300','PAYFULL600','50OFFOCT']) test('actual verifier rejects expired public code '+code, async()=>{
  const result=await inspect({},'<p>'+code+'</p>');
  assert.equal(result.exitCode,1);
  assert.equal(result.results.filter(row=>!row.passed).length,4);
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
