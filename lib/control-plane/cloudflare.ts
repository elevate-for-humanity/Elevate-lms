import { getSecret } from '@/lib/secrets';

/** A successful receipt means Cloudflare accepted the purge, not cache eviction. */
export async function purgeCloudflareCache(): Promise<Record<string, unknown>> {
  const [token, zoneId] = await Promise.all([
    getSecret('CLOUDFLARE_API_TOKEN'), getSecret('CLOUDFLARE_ZONE_ID'),
  ]);
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
