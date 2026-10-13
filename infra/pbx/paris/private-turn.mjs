import {request as httpsRequest} from 'node:https';
export function privateTurnOptions(raw,token){
  const url=new URL(raw);
  if(url.protocol!=='https:' || url.hostname!=='phone.elevateforhumanity.org' ||
    (url.port && url.port!=='443') || url.pathname!=='/internal/paris/turn' || url.username || url.password || url.search || url.hash)
    throw Error('PARIS_PRIVATE_TURN_URL_INVALID');
  if(typeof token!=='string' || token.length<32 || /[\r\n]/.test(token))throw Error('PARIS_TURN_TOKEN_INVALID');
  return {hostname:'127.0.0.1',port:443,servername:url.hostname,path:url.pathname,method:'POST',rejectUnauthorized:true,signal:AbortSignal.timeout(30000),
    headers:{Host:url.hostname,Authorization:`Bearer ${token}`,'Content-Type':'application/json'}};
}
export async function privateTurn(raw,body,token,request=httpsRequest){
  const options=privateTurnOptions(raw,token);
  return new Promise((resolve,reject)=>{
    const req=request(options,res=>{
      if(res.statusCode!==200){res.resume();reject(Error(`PARIS_TURN_HTTP_${res.statusCode}`));return;}
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>300000){res.destroy();reject(Error('PARIS_TURN_RESPONSE_TOO_LARGE'));}else chunks.push(chunk);});
      res.on('error',()=>reject(Error('PARIS_TURN_RESPONSE_FAILED')));
      res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(Error('PARIS_TURN_INVALID_RESPONSE'));}});
    });
    req.setTimeout(30000,()=>req.destroy(Error('PARIS_TURN_TIMEOUT')));
    req.on('error',()=>reject(Error('PARIS_TURN_TRANSPORT_FAILED')));
    req.end(JSON.stringify(body));
  });
}
