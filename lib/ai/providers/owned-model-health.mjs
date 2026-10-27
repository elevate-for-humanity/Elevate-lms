import { resolveOwnedModelConnection } from './owned-model-config.mjs';
import { ownedModelHeaders } from './google-runtime-auth.mjs';

/** Probe the same CPU/GPU selection as inference, without spending inference
 * tokens. Return only diagnostic flags; credentials and endpoints stay server-side. */
export async function probeOwnedModel({env=process.env, request=fetch, headersFor=ownedModelHeaders}={}) {
  const {base, token, configured, tier} = resolveOwnedModelConnection(env);
  if (!base || !token) return {configured, verified:false, status:configured?'google_endpoint_required':'not_configured'};
  let url; try { url = new URL(base); } catch { return {configured:true, verified:false, status:'invalid_endpoint'}; }
  const trustedHost=url.hostname.endsWith('.run.app') || (tier==='gpu' && /^[a-z0-9-]+\.proxy\.runpod\.net$/.test(url.hostname));
  if (url.protocol !== 'https:' || !trustedHost || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    return {configured:true, verified:false, status:'trusted_endpoint_required'};
  }
  try {
    const headers = await headersFor(base, token, {env, request});
    const response = await request(base + '/v1/models', {
      redirect:'manual', headers, cache:'no-store', signal:AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(()=>({}));
    const verified = response.ok && Array.isArray(body.data) && body.data.some(model=>model?.id==='elevate-local');
    return {configured:true, verified, status:verified?'reachable':response.status===401||response.status===403?'authentication_failed':'model_unavailable', httpStatus:response.status};
  } catch { return {configured:true, verified:false, status:'request_failed'}; }
}
