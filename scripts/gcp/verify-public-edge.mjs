// Independent production edge verification. Read-only, cache-busted and fail-safe.
// Connection errors are INCONCLUSIVE, never evidence of an application outage.
import { resolve4, resolve6 } from 'node:dns/promises';
import tls from 'node:tls';
import { pathToFileURL } from 'node:url';

export const origins = Object.freeze({
  marketing: 'https://www.elevateforhumanity.org',
  lms: 'https://app.elevateforhumanity.org',
  admin: 'https://admin.elevateforhumanity.org',
  store: 'https://store.elevateforhumanity.org',
});
const stamp = () => Date.now().toString(36);
const validSha = x => typeof x === 'string' && /^[a-f0-9]{40}$/.test(x);
const problem = e => ({state:'inconclusive',reason:e?.code || e?.name || 'checker_unavailable'});

export async function probeEndpoint(origin, path, {request=fetch, sha=null}={}) {
  const url = new URL(path,origin);
  url.searchParams.set('_edge_audit',stamp());
  try {
    const response = await request(url.toString(),{
      redirect:'manual',
      signal:AbortSignal.timeout(15000),
      headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},
    });
    const contentType=response.headers?.get?.('content-type') || '';
    let body=null;
    if(contentType.includes('json')) {
      try { body=await response.json(); }
      catch { return {path,state:'failed',status:response.status,reason:'invalid_json'}; }
    }
    const reported = body?.commitSha || body?.commit || null;
    const expected = sha && validSha(sha) ? sha : null;
    const mismatch = expected && validSha(reported) && reported !== expected;
    return {path,state:response.ok && !mismatch?'passed':'failed',status:response.status,
      service:body?.service || null,commit:validSha(reported)?reported:null,
      cacheControl:response.headers?.get?.('cache-control') || null,
      ...(mismatch?{reason:'commit_mismatch'}:{})};
  } catch(e) { return {path,...problem(e)}; }
}
export async function probeRedirect(origin,{request=fetch}={}) {
  const path='/program-holder/dashboard';
  const url=new URL(path,origin);url.searchParams.set('_edge_audit',stamp());
  try {
    const response=await request(url.toString(),{
      redirect:'manual',signal:AbortSignal.timeout(15000),
      headers:{'Cache-Control':'no-cache'},
    });
    const location=response.headers?.get?.('location') || '';
    const target=location?new URL(location,url):null;
    const approved=target && target.origin===new URL(origin).origin &&
      target.pathname==='/login' &&
      target.searchParams.get('redirect')===url.pathname+url.search;
    return {path,status:response.status,state:response.status>=300 && response.status<400 && approved?'passed':'failed',
      locationPath:target?.pathname || null,reason:approved?undefined:'unexpected_redirect'};
  } catch(e) { return {path,...problem(e)}; }
}
export async function probeDns(host) {
  try {
    const [v4,v6]=await Promise.allSettled([resolve4(host),resolve6(host)]);
    if(v4.status==='rejected' && v6.status==='rejected')
      return {state:'inconclusive',reason:'dns_lookup_unavailable'};
    return {state:'passed',ipv4:v4.status==='fulfilled'?v4.value:[],ipv6:v6.status==='fulfilled'?v6.value:[]};
  } catch(e){return problem(e);}
}
export function probeTls(host,{connect=tls.connect}={}) {
  return new Promise(resolve=>{
    let settled=false;
    const done=value=>{if(settled)return;settled=true;socket?.destroy?.();resolve(value);};
    let socket;
    try {
      socket=connect({host,port:443,servername:host,rejectUnauthorized:true,timeout:12000},()=>{
        const cert=socket.getPeerCertificate();
        done({state:socket.authorized?'passed':'failed',authorized:socket.authorized,
          subject:cert?.subject?.CN || null,issuer:cert?.issuer?.CN || null,
          validFrom:cert?.valid_from || null,validTo:cert?.valid_to || null,
          subjectAltName:cert?.subjectaltname || null,protocol:socket.getProtocol?.() || null});
      });
      socket.on('timeout',()=>done({state:'inconclusive',reason:'tls_timeout'}));
      socket.on('error',e=>done(problem(e)));
    } catch(e){done(problem(e));}
  });
}
export async function auditEdge({request=fetch,sha=null,dns=probeDns,tlsCheck=probeTls}={}) {
  const results={};
  for(const [service,origin] of Object.entries(origins)){
    const host=new URL(origin).hostname;
    const [dnsResult,tlsResult,version,health,ready,ping]=await Promise.all([
      dns(host),tlsCheck(host),
      probeEndpoint(origin,'/api/version',{request,sha}),
      probeEndpoint(origin,'/api/health',{request}),
      probeEndpoint(origin,'/api/ready',{request}),
      probeEndpoint(origin,'/api/ping',{request}),
    ]);
    results[service]={dns:dnsResult,tls:tlsResult,version,health,ready,ping};
  }
  results.programHolder=await probeRedirect(origins.lms,{request});
  return {expectedCommit:sha,results,allVerified:Object.entries(results).every(([name,entry])=>name==='programHolder'
    ? entry.state==='passed' : ['dns','tls','version','health','ready','ping'].every(key=>entry[key]?.state==='passed'))};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await auditEdge({sha:process.env.EXPECTED_GIT_SHA || null});
  console.log(JSON.stringify(report,null,2));
  if(!report.allVerified)process.exitCode=1;
}
