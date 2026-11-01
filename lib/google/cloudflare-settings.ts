export const CLOUDFLARE_RUNTIME_KEYS = ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_AI_MODEL','CLOUDFLARE_API_TOKEN','CLOUDFLARE_ZONE_ID'] as const;
export function isCloudflareRuntimeKey(key:string) {
  return (CLOUDFLARE_RUNTIME_KEYS as readonly string[]).includes(key);
}
export function validateCloudflareUpdates(entries:Array<{key:string;value:string}>) {
  for (const {key,value} of entries.filter(entry=>isCloudflareRuntimeKey(entry.key))) {
    if (key.endsWith('_ID') && !/^[a-f0-9]{32}$/i.test(value)) throw new Error('Cloudflare account and zone IDs must contain exactly 32 hexadecimal characters.');
    if (key.endsWith('_TOKEN') && (value.length<20 || /\s/.test(value) || /^[•*]+$/.test(value))) throw new Error('Enter an unmasked Cloudflare API token without whitespace.');
    if (key==='CLOUDFLARE_AI_MODEL' && !/^@cf\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._/-]+$/.test(value)) throw new Error('Enter a complete Cloudflare Workers AI model identifier.');
  }
}
