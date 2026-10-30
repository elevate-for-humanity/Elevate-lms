import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVerifier, repairQuickBooksProduction } from './repair-quickbooks-production.mjs';

test('recovers either existing verifier alias without generating a replacement', () => {
  assert.equal(resolveVerifier([{ QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN: 'existing' }]), 'existing');
  assert.equal(resolveVerifier([{ QB_WEBHOOK_VERIFIER_TOKEN: 'existing' }]), 'existing');
  assert.equal(resolveVerifier([{}]), '');
});
test('fails closed when stored verifier sources disagree without disclosing their values', () => {
  assert.throws(() => resolveVerifier([{QB_WEBHOOK_VERIFIER_TOKEN:'private-one'}], ['private-two']), /^Error: QB_VERIFIER_CONFLICT$/);
});
test('requires all owning runtime configurations before any mutation', () => {
  const calls=[];
  assert.throws(() => repairQuickBooksProduction({apply:true,run:args=>{calls.push(args);return '[]';}}), /QB_RUNTIME_CONFIG_UNAVAILABLE/);
  assert.equal(calls.length,1);
  assert.equal(calls[0][1],'list');
});

for (const enabled of [true, false]) {
  test(`audits a ${enabled ? 'populated' : 'prepared empty'} standalone verifier using the supported Google CLI arguments`, () => {
    const components = ['admin', 'marketing', 'lms', 'store'];
    const standalone = 'elevate-quickbooks-webhook-verifier';
    const calls = [];
    const run = args => {
      calls.push(args);
      if (args[0] === 'secrets' && args[1] === 'list') {
        return JSON.stringify([...components.map(c => `elevate-${c}-runtime-config`), standalone].map(name => ({ name })));
      }
      if (args[0] === 'secrets' && args[2] === 'list') {
        assert.equal(args[3], standalone, 'secrets versions list requires positional SECRET');
        assert.equal(args.includes('--secret'), false, 'list does not support the access command secret flag');
        return JSON.stringify(enabled ? [{ name: `${standalone}/versions/1`, state: 'ENABLED' }] : []);
      }
      if (args[0] === 'secrets' && args[2] === 'access') {
        const secret = args[args.indexOf('--secret') + 1];
        if (secret === standalone) return 'private-existing-verifier';
        const component = secret.replace('elevate-', '').replace('-runtime-config', '');
        return JSON.stringify({ version: 1, component, volumes: [], runtimeFiles: {}, runtimeEnvironment: {} });
      }
      if (args[1] === 'services' && args[2] === 'describe') return JSON.stringify({ status: { traffic: [{ percent: 100, revisionName: args[3] }] } });
      if (args[1] === 'revisions' && args[2] === 'describe') return JSON.stringify({ spec: { containers: [{ env: [] }] } });
      throw Error('Unexpected or mutating operation during audit');
    };
    const report = repairQuickBooksProduction({ run });
    assert.equal(report.mode, 'audit');
    assert.equal(report.existingVerifierFound, enabled);
    assert.equal(report.companyAuthorizationVerified, false);
    assert.equal(report.webhookDeliveryVerified, false);
    assert.equal(JSON.stringify(report).includes('private-existing-verifier'), false);
    assert.equal(calls.some(args => args.includes('add') || args.includes('update')), false);
  });
}

test('applies production and recovered verifier while preserving unrelated settings and verifying serving revisions', async () => {
  const {readFileSync}=await import('node:fs');
  const components=['admin','marketing','lms','store'];
  const configs=Object.fromEntries(components.map(component=>[component,{version:1,component,volumes:[],runtimeFiles:{},runtimeEnvironment:{UNCHANGED:'retained',QB_ENVIRONMENT:'sandbox',...(component==='marketing'?{QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN:'private-existing'}:{})}}]));
  const environments=Object.fromEntries(components.map(component=>[component,{UNCHANGED:'retained'}]));
  const calls=[];
  const run=args=>{
    calls.push(args);
    if(args[0]==='secrets'&&args[1]==='list')return JSON.stringify(components.map(c=>({name:'projects/example/secrets/elevate-'+c+'-runtime-config'})));
    if(args[0]==='secrets'&&args[1]==='versions'){
      const c=(args.includes('--secret')?args[args.indexOf('--secret')+1]:args[3]).replace('elevate-','').replace('-runtime-config','');
      if(args[2]==='access')return JSON.stringify(configs[c]);
      if(args[2]==='add'){configs[c]=JSON.parse(readFileSync(args[args.indexOf('--data-file')+1],'utf8'));return 'version';}
    }
    const c=(args[3]||'').replace('elevate-','').replace('-migration','');
    if(args[1]==='services'&&args[2]==='describe')return JSON.stringify({status:{traffic:[{percent:100,revisionName:c}]}});
    if(args[1]==='revisions')return JSON.stringify({spec:{containers:[{image:'unchanged-image',env:Object.entries(environments[args[3]]).map(([name,value])=>({name,value}))}]}});
    if(args[1]==='services'&&args[2]==='update'){
      Object.assign(environments[c],JSON.parse(readFileSync(args[args.indexOf('--flags-file')+1],'utf8'))['--update-env-vars']);return 'ready';
    }
    throw Error('Unexpected call');
  };
  const report=repairQuickBooksProduction({run,apply:true});
  assert.equal(report.existingVerifierFound,true);
  assert.equal(JSON.stringify(report).includes('private-existing'),false);
  for(const c of components){assert.equal(environments[c].QB_ENVIRONMENT,'production');assert.equal(environments[c].UNCHANGED,'retained');assert.equal(environments[c].QB_WEBHOOK_VERIFIER_TOKEN,'private-existing');assert.equal(configs[c].runtimeEnvironment.UNCHANGED,'retained');}
  assert.equal(JSON.stringify(calls).includes('private-existing'),false);
});
