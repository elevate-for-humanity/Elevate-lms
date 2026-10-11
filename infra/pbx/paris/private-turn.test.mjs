import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {privateTurnOptions} from './private-turn.mjs';
test('private HTTPS connects to loopback and verifies the existing public hostname certificate',()=>{
 const result=privateTurnOptions('https://phone.elevateforhumanity.org/internal/paris/turn','test-token'.repeat(4));
 assert.equal(result.hostname,'127.0.0.1');assert.equal(result.servername,'phone.elevateforhumanity.org');
 assert.equal(result.headers.Host,'phone.elevateforhumanity.org');assert.equal(result.rejectUnauthorized,true);assert.equal(result.port,443);
});
test('plaintext, external destinations, altered ports, credentials and query strings are rejected',()=>{
 for(const url of ['http://phone.elevateforhumanity.org/internal/paris/turn','https://example.com/internal/paris/turn',
 'https://phone.elevateforhumanity.org:444/internal/paris/turn','https://user@phone.elevateforhumanity.org/internal/paris/turn',
 'https://phone.elevateforhumanity.org/internal/paris/turn?token=anything'])assert.throws(()=>privateTurnOptions(url,'test-token'.repeat(4)));
});
test('supported Node WebSocket sends ARI Authorization during the real upgrade',{timeout:5000},async()=>{
 const server=createServer();let observed,upgraded,client;
 server.on('upgrade',(req,socket)=>{
  upgraded=socket;
  observed=req.headers.authorization;
  const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  client=new WebSocket(`ws://127.0.0.1:${server.address().port}/ari/events`,{headers:{Authorization:'Basic dGVzdDp0ZXN0'}});
  await new Promise((resolve,reject)=>{client.addEventListener('open',resolve,{once:true});client.addEventListener('error',reject,{once:true});});
  assert.equal(observed,'Basic dGVzdDp0ZXN0');
 }finally{client?.close();upgraded?.destroy();await new Promise(resolve=>server.close(resolve));}
});
