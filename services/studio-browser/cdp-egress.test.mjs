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
 for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::','::1','::ffff:7f00:1','fc00::1','fe80::1','2001:0000::1','2002:7f00:1::','192.0.0.1','192.0.2.1','192.168.0.1'])assert.equal(isPrivateAddress(address),true,address);
 for(const address of ['8.8.8.8','93.184.216.34','192.0.78.24','192.2.2.2','192.0.0.9','192.0.0.10','2001:4860:4860::8888'])assert.equal(isPrivateAddress(address),false,address);
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
test('the production foundation exception admits only exact unexpired synthetic fixtures',async()=>{
 const {foundationFixtureDestination}=await import('./server.mjs');
 const nonce='11111111-1111-4111-a111-111111111111';const fixtures=new Map([[nonce,{expiresAt:200}]]);
 const input=`http://127.0.0.1:3100/foundation-fixture/${nonce}/start`;
 const options={fixtures,fixturePort:3100,now:100};
 assert.equal(foundationFixtureDestination(input,options).address,'127.0.0.1');
 for(const denied of [input.replace('/start','/api/secrets'),input.replace('3100','3101'),input.replace('127.0.0.1','localhost'),input+'?redirect=/api',input.replace(nonce,'22222222-2222-4222-a222-222222222222')])assert.equal(foundationFixtureDestination(denied,options),null);
 assert.equal(foundationFixtureDestination(input,{...options,now:201}),null);
});
test('a partial HTTP response closes the browser-facing stream promptly',async t=>{
 const origin=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Length':'1000'});res.write('partial');setImmediate(()=>res.socket.destroy());});
 await new Promise(r=>origin.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>origin.close(r)));
 const proxy=await createBrowserEgress({lookup:publicLookup,request:(options,callback)=>http.request({...options,hostname:'127.0.0.1',port:origin.address().port},callback)});t.after(()=>proxy.close());
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('downstream was left open')),2000);const finish=()=>{clearTimeout(timeout);resolve();};
  const p=new URL(proxy.url);const req=http.get({hostname:p.hostname,port:p.port,path:'http://public.test/partial'},res=>{res.resume();res.once('aborted',finish);res.once('error',finish);res.once('end',finish);});req.once('error',finish);
 });
});
test('reset CONNECT sockets are contained and do not terminate the proxy',async t=>{
 const origin=net.createServer(socket=>{socket.on('error',()=>{});socket.on('data',()=>socket.resetAndDestroy());});
 await new Promise(r=>origin.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>origin.close(r)));
 const proxy=await createBrowserEgress({lookup:publicLookup,connect:options=>net.connect({...options,host:'127.0.0.1',port:origin.address().port})});t.after(()=>proxy.close());
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('reset tunnel stayed open')),2000);const p=new URL(proxy.url);
  const req=http.request({host:p.hostname,port:p.port,method:'CONNECT',path:'public.test:443'});
  req.once('error',()=>{clearTimeout(timeout);resolve();});req.once('connect',(_response,socket)=>{socket.on('error',()=>{});socket.once('close',()=>{clearTimeout(timeout);resolve();});socket.write('TLS fixture');});req.end();
 });
 assert.equal((await proxyGet(proxy.url,'http://127.0.0.1/private')).status,403);
});
test('reset upgraded sockets are contained on both sides',async t=>{
 const origin=http.createServer();origin.on('upgrade',(_req,socket)=>{socket.on('error',()=>{});socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n');socket.on('data',()=>socket.resetAndDestroy());});
 await new Promise(r=>origin.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>origin.close(r)));
 const proxy=await createBrowserEgress({lookup:publicLookup,request:(options,callback)=>http.request({...options,hostname:'127.0.0.1',port:origin.address().port},callback)});t.after(()=>proxy.close());
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('reset upgrade stayed open')),2000);const p=new URL(proxy.url);
  const req=http.request({host:p.hostname,port:p.port,path:'http://public.test/socket',headers:{Connection:'Upgrade',Upgrade:'fixture'}});
  req.once('error',()=>{clearTimeout(timeout);resolve();});req.once('upgrade',(_response,socket)=>{socket.on('error',()=>{});socket.once('close',()=>{clearTimeout(timeout);resolve();});socket.write('upgrade fixture');});req.end();
 });
 assert.equal((await proxyGet(proxy.url,'http://127.0.0.1/private')).status,403);
});

test('an upstream close without an error closes the browser CONNECT socket',async t=>{
 const origin=net.createServer(socket=>socket.end());await new Promise(r=>origin.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>origin.close(r)));
 const proxy=await createBrowserEgress({lookup:publicLookup,connect:options=>net.connect({...options,host:'127.0.0.1',port:origin.address().port})});t.after(()=>proxy.close());
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('closed upstream left client open')),1000);const p=new URL(proxy.url);
  const req=http.request({host:p.hostname,port:p.port,method:'CONNECT',path:'public.test:443'});
  req.once('error',()=>{clearTimeout(timeout);resolve();});req.once('connect',(_response,socket)=>{socket.on('error',()=>{});socket.resume();socket.once('close',()=>{clearTimeout(timeout);resolve();});});req.end();
 });
});
