import { getSecret } from '@/lib/secrets';

export async function probeCloudflareControlPlane() {
  const checkedAt = new Date().toISOString();
  const result = {configured:false, reachable:false, writeVerified:false, checkedAt};
  try {
    const [rawToken, rawZone, rawAccount] = await Promise.all([
      getSecret('CLOUDFLARE_API_TOKEN'), getSecret('CLOUDFLARE_ZONE_ID'), getSecret('CLOUDFLARE_ACCOUNT_ID'),
    ]);
    const token=rawToken?.trim(), zone=rawZone?.trim(), account=rawAccount?.trim();
    if (!token || !zone) return {...result,status:'not_configured',detail:'Cloudflare control-plane API token or zone ID is missing; Workers AI credentials do not provide zone control.'};
    result.configured=true;
    if (!/^[a-f0-9]{32}$/i.test(zone)) return {...result,status:'invalid_configuration',detail:'Cloudflare control-plane zone ID is invalid.'};
    const response=await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}`,{
      headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},
      cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10_000),
    });
    const data=await response.json().catch(()=>null);
    if (!response.ok) return {...result,status:[401,403].includes(response.status)?'authentication_failed':'unreachable',
      detail:`Cloudflare zone probe returned HTTP ${response.status}.`};
    if (data?.success!==true || data?.result?.id!==zone || (account && data?.result?.account?.id!==account)) {
      return {...result,status:'identity_unverified',detail:'Cloudflare did not verify the configured zone and account identity.'};
    }
    return {...result,reachable:true,status:'reachable',detail:'Cloudflare zone read access verified. Cache-purge and DNS-write authority remain unverified until authorized operations succeed.'};
  } catch {
    return {...result,status:'unreachable',detail:'Cloudflare control-plane probe could not complete.'};
  }
}

/** A successful receipt means Cloudflare accepted the purge, not cache eviction. */
export async function purgeCloudflareCache(): Promise<Record<string, unknown>> {
  const [rawToken, rawZoneId] = await Promise.all([
    getSecret('CLOUDFLARE_API_TOKEN'), getSecret('CLOUDFLARE_ZONE_ID'),
  ]);
  const token=rawToken?.trim(), zoneId=rawZoneId?.trim();
  if (!token || !zoneId) throw new Error('Cloudflare cache control requires an API token and zone ID');
  if (!/^[a-f0-9]{32}$/i.test(zoneId)) throw new Error('Cloudflare zone ID is invalid');
  let response: Response;
  try {
    response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST', redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ purge_everything: true }),
    });
  } catch {
    throw new Error('Cloudflare cache purge could not be reached');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || typeof data?.result?.id !== 'string') {
    throw new Error(`Cloudflare cache purge was not accepted (HTTP ${response.status})`);
  }
  return { status: 'success', message: 'Cloudflare accepted the cache purge', receipt_id: data.result.id };
}
