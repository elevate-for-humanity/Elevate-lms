import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import {access} from 'node:fs/promises';
import {createBrowserEgress,publicDestination,isPrivateAddress} from './cdp-egress.mjs';
import {launchBrowser} from './cdp-browser.mjs';
const publicLookup=async()=>[{address:'93.184.216.34',family:4}];
async function proxyGet(proxy,url){return new Promise((resolve,reject)=>{
 const p=new URL(proxy);const request=http.get({hostname:p.hostname,port:p.port,path:url,agent:false},response=>{
  response.resume();response.once('end',()=>resolve({status:response.statusCode,location:response.headers.location}));
 });request.once('error',reject);
});}
test('denies private, mapped, special-use and unsupported destinations',async()=>{
 for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::','::1','::ffff:7f00:1','fc00::1','fe80::1','2001:0000::1','2002:7f00:1::'])assert.equal(isPrivateAddress(address),true,address);
 for(const address of ['8.8.8.8','93.184.216.34','2001:4860:4860::8888'])assert.equal(isPrivateAddress(address),false,address);
 for(const target of ['file:///etc/passwd','ftp://public.test','http://user:secret@public.test','https://public.test:8443'])await assert.rejects(publicDestination(target,{lookup:publicLookup}));
 await assert.rejects(publicDestination('http://mixed.test',{lookup:async()=>[{address:'8.8.8.8'},{address:'127.0.0.1'}]}));
});
test('rechecks redirects and pins the socket to the checked public IP',async t=>{
 let calls=0;const destinations=[];
 const fixture=http.createServer((_req,res)=>{res.writeHead(302,{location:'http://127.0.0.1/private'});res.end();});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>fixture.close(r)));
 const proxy=await createBrowserEgress({lookup:publicLookup,request:(options,callback)=>{
  calls++;destinations.push(options.hostname);return http.request({...options,hostname:'127.0.0.1',port:fixture.address().port},callback);
 }});t.after(()=>proxy.close());
 const first=await proxyGet(proxy.url,'http://public.test/redirect');assert.equal(first.status,302);
 assert.equal((await proxyGet(proxy.url,first.location)).status,403);
 assert.deepEqual(destinations,['93.184.216.34']);assert.equal(calls,1);
});
test('a DNS change to a private address cannot open a second socket',async t=>{
 let resolution=0,dials=0;
 const proxy=await createBrowserEgress({lookup:async()=>[{address:++resolution===1?'93.184.216.34':'127.0.0.1'}],connect:options=>{
  assert.equal(options.host,'93.184.216.34');dials++;const socket=new net.Socket();queueMicrotask(()=>socket.destroy(Error('fixture unavailable')));return socket;
 }});t.after(()=>proxy.close());
 const connect=()=>new Promise((resolve,reject)=>{
  const p=new URL(proxy.url);const req=http.request({host:p.hostname,port:p.port,method:'CONNECT',path:'public.test:443'});
  req.once('connect',(response,socket)=>{socket.destroy();resolve(response.statusCode);});req.once('error',reject);req.end();
 });
 assert.equal(await connect(),403);assert.equal(await connect(),403);assert.equal(dials,1);
});
test('Chromium cannot bypass the proxy for localhost navigation',{skip:process.env.STUDIO_BROWSER_LIVE_EGRESS_TEST!=='1'},async t=>{
 try{await access('/usr/bin/chromium');}catch{t.skip('Chromium is not installed');return;}
 let hits=0;const fixture=http.createServer((_req,res)=>{hits++;res.end('private data');});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>fixture.close(r)));
 const browser=await launchBrowser({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});t.after(()=>browser.close());
 const context=await browser.newContext();const page=await context.newPage();
 await page.goto(`http://127.0.0.1:${fixture.address().port}/private`).catch(()=>{});
 assert.equal(hits,0);
});
