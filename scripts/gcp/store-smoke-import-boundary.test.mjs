import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fetchSmoke} from './smoke-fetch.mjs';

const source=readFileSync(new URL('./smoke-marketing-container.mjs',import.meta.url),'utf8');

test('Store smoke never eagerly loads the Marketing-only Cheerio parser',()=>{
  assert.doesNotMatch(source,/^import\s+.*homepage-content\.mjs/m);
  const marketing=source.indexOf("if (component === 'marketing')");
  const store=source.indexOf("if (component === 'store')");
  const imported=source.indexOf("await import('./homepage-content.mjs')");
  assert.ok(marketing>=0 && imported>marketing && store>imported,
    'Marketing-only HTML parsing must happen inside its Marketing branch');
});
test('container smoke still verifies Store pages and exact image identity',()=>{
  assert.match(source,/assertStorePageChrome\(html, path\)/);
  assert.match(source,/assert\.equal\(identity\.commitSha, sha\)/);
  assert.match(source,/const image = `elevate-\$\{component\}:\$\{sha\}`/);
});

test('hung Store smoke fetch rejects instead of exiting 13 on an unrefed deadline',()=>{
 const url=new URL('./smoke-fetch.mjs',import.meta.url).href;
 const code='import {fetchSmoke} from '+JSON.stringify(url)+'; try{await fetchSmoke("http://127.0.0.1:3000/api/ping",{},40,"json",()=>new Promise(()=>{}));process.exitCode=2}catch(error){if(!/timed out/.test(error.message))process.exitCode=3}';
 const run=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:4000});
 assert.equal(run.status,0,'request must reject without event-loop exit: '+run.stderr);
});
test('timeout bounds response body and preserves host identity and status',async()=>{
 let signal,host;
 const hung=async (_url,options)=>{signal=options.signal;return {status:200,json:()=>new Promise(()=>{})}};
 await assert.rejects(fetchSmoke('http://localhost/api/ping',{},20,'json',hung),/timed out after 20 ms/);
 assert.equal(signal.aborted,true);
 const ok=async (_url,options)=>{host=options.headers.host;return {status:503,json:async()=>({ready:false})}};
 assert.deepEqual(await fetchSmoke('http://localhost/api/health',{headers:{host:'customer.example'}},100,'json',ok),{status:503,body:{ready:false}});
 assert.equal(host,'customer.example');
});
test('all Store smoke network requests are bounded and independent from Cheerio',()=>{
 assert.doesNotMatch(source,/AbortSignal\.timeout/);
 assert.doesNotMatch(source,/\bawait\s+fetch\(/);
 assert.match(source,/fetchSmoke\(root \+ '\/api\/ping'/);
});
