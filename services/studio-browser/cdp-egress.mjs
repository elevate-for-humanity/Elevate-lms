import http from 'node:http';
import net from 'node:net';
import dns from 'node:dns/promises';

// Only globally routable destinations may be reached by browser traffic.
export function isPrivateAddress(input) {
  const address=String(input).toLowerCase().replace(/^\[|\]$/g,'');
  if(net.isIPv4(address)){
    const [a,b,c]=address.split('.').map(Number);
    return a===0||a===10||a===127||a>=224||
      (a===100&&b>=64&&b<=127)||(a===169&&b===254)||
      (a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0||b===2))||
      (a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113);
  }
  // Reject unspecified, mapped IPv4, local, multicast and transition ranges.
  if(!net.isIPv6(address)||! /^[23]/.test(address))return true;
  const [first,second]=address.split(':').map(part=>parseInt(part||'0',16));
  return first===0x2002||(first===0x2001&&(second<0x200||second===0xdb8));
}

export async function publicDestination(input,{lookup=dns.lookup}={}){
  const url=new URL(input);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||
    (url.port&&!['80','443'].includes(url.port)))throw Error('BROWSER_EGRESS_DENIED');
  const host=url.hostname.replace(/^\[|\]$/g,'');
  const records=net.isIP(host)?[{address:host,family:net.isIP(host)}]:await lookup(host,{all:true});
  if(!records.length||records.some(record=>isPrivateAddress(record.address)))throw Error('BROWSER_EGRESS_DENIED');
  return {url,address:records[0].address,port:Number(url.port||(url.protocol==='https:'?443:80))};
}

/** Chromium sends HTTP, CONNECT, redirects, frames and worker requests here.
 * DNS is checked for every connection and the checked IP is used for the socket;
 * Chromium never resolves the public hostname again after this check. TLS stays
 * end-to-end, preserving browser certificate and SNI validation. */
export async function createBrowserEgress({lookup=dns.lookup,request=http.request,connect=net.connect}={}){
  const sockets=new Set();
  const track=socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));return socket;};
  const deny=response=>{
    if(response instanceof http.ServerResponse){if(!response.headersSent)response.writeHead(403);response.end('Browser destination unavailable');}
    else if(!response.destroyed){response.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');}
  };
  const forward=async(req,res,head)=>{
    try{
      const target=await publicDestination(req.url,{lookup});
      if(target.url.protocol!=='http:')throw Error('BROWSER_EGRESS_DENIED');
      const headers={...req.headers,host:target.url.host};
      delete headers['proxy-authorization'];delete headers['proxy-connection'];
      const upstream=request({hostname:target.address,port:target.port,method:req.method,
        path:target.url.pathname+target.url.search,headers,agent:false},response=>{
        if(head){response.resume();return deny(res);}
        res.writeHead(response.statusCode,response.headers);response.pipe(res);
      });
      upstream.on('socket',track);
      upstream.setTimeout(30_000,()=>upstream.destroy());
      upstream.once('error',()=>deny(res));
      req.once('aborted',()=>upstream.destroy());
      if(head){
        upstream.once('upgrade',(response,socket,pending)=>{
          if(res.destroyed)return socket.destroy();
          res.write(`HTTP/1.1 ${response.statusCode} Switching Protocols\r\n`+
            Object.entries(response.headers).map(([key,value])=>`${key}: ${value}\r\n`).join('')+'\r\n');
          if(pending.length)res.write(pending);if(head.length)socket.write(head);
          socket.pipe(res);res.pipe(socket);res.once('close',()=>socket.destroy());
        });
      }
      if(head)upstream.end();else req.pipe(upstream);
    }catch{deny(res);}
  };
  const server=http.createServer((req,res)=>{void forward(req,res);});
  server.on('connection',track);
  server.on('upgrade',(req,socket,head)=>{void forward(req,socket,head);});
  server.on('connect',(req,client,head)=>{void(async()=>{
    try{
      const target=await publicDestination('https://'+req.url,{lookup});
      if(target.url.pathname!=='/'||target.url.search||target.url.hash)throw Error('BROWSER_EGRESS_DENIED');
      const upstream=track(connect({host:target.address,port:target.port}));
      upstream.setTimeout(60_000,()=>upstream.destroy());
      upstream.once('error',()=>deny(client));
      upstream.once('connect',()=>{
        if(client.destroyed)return upstream.destroy();
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if(head.length)upstream.write(head);
        upstream.pipe(client);client.pipe(upstream);
      });
      client.once('close',()=>upstream.destroy());
    }catch{deny(client);}
  })();});
  server.on('clientError',(_error,socket)=>socket.destroy());
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {url:`http://127.0.0.1:${server.address().port}`,close:async()=>{
    for(const socket of sockets)socket.destroy();
    await new Promise(resolve=>server.close(resolve));
  }};
}
