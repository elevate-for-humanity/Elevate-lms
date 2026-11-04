import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probeAll,SURFACES} from './paris-public-probes.mjs';

test('checks only approved public endpoints, sends no credentials and does not follow redirects',async()=>{
 const calls=[];
 const request=async (url,opts)=>{calls.push({url,opts});return {status:200}};
 const r=await probeAll({request});
 assert.equal(r.results.length,SURFACES.length);
 assert.equal(r.classification,'unauthenticated-reachability-only');
 assert.ok(calls.every(x=>x.opts.method==='GET'&&x.opts.redirect==='manual'&&!x.opts.headers));
});
test('refuses nonallowlisted endpoints including a malicious HTTPS URL',async()=>{
 await assert.rejects(()=>probeAll({surfaces:[{name:'evil',url:'https://example.com/',expected:[200]}]}),/NOT_ALLOWLISTED/);
});
test('reports unexpected status without treating it as authenticated acceptance',async()=>{
 const r=await probeAll({request:async()=>({status:503})});
 assert.equal(r.allReachable,false);
 assert.equal(r.results[0].category,'unexpected_http_status');
});
test('reports network errors without including raw error text or secrets',async()=>{
 const r=await probeAll({request:async()=>{throw Error('secret should never appear')}});
 assert.equal(r.results[0].category,'request_failed');
 assert.ok(!JSON.stringify(r).includes('secret should never appear'));
});
