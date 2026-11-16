// Functional integration tests explicitly supply their own loopback fixtures.
// Production launch never imports this helper or reads a network-bypass env var.
import {createBrowserEgress} from './cdp-egress.mjs';
export function fixtureEgressFactory(origins){
  const allowed=new Set(origins);
  for(const origin of allowed){
    const url=new URL(origin);
    if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.origin!==origin||!url.port)throw Error('Invalid isolated test fixture');
  }
  return ()=>createBrowserEgress({fixtureDestination:input=>{
    const url=new URL(input);
    if(!allowed.has(url.origin)||url.username||url.password)return null;
    return {url,address:'127.0.0.1',port:Number(url.port)};
  }});
}
