import {describe,it,expect} from 'vitest';
import policy from '@/config/google-runtime-policy.json';
import {CLOUDFLARE_RUNTIME_KEYS,validateCloudflareUpdates} from '@/lib/google/cloudflare-settings';
describe('Cloudflare runtime configuration contract',()=>{
 it('binds every Admin connection setting and limits LMS to AI access',()=>{
  for(const key of CLOUDFLARE_RUNTIME_KEYS) expect(policy.components.admin.keys).toContain(key);
  for(const key of ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_AI_MODEL']) expect(policy.components.lms.keys).toContain(key);
  expect(policy.components.lms.keys).not.toContain('CLOUDFLARE_API_TOKEN');
  expect(policy.components.lms.keys).not.toContain('CLOUDFLARE_ZONE_ID');
 });
 it.each([
  {key:'CLOUDFLARE_ZONE_ID',value:'https://dash.cloudflare.com/zone'},
  {key:'CLOUDFLARE_ACCOUNT_ID',value:'wrong-account'},
  {key:'CLOUDFLARE_AI_API_TOKEN',value:'••••••••'},
  {key:'CLOUDFLARE_API_TOKEN',value:'token with whitespace'.repeat(2)},
  {key:'CLOUDFLARE_AI_MODEL',value:'llama'},
 ])('rejects invalid saved connection settings: $key',entry=>expect(()=>validateCloudflareUpdates([entry])).toThrow());
 it('accepts complete valid account, zone, separate tokens and model settings',()=>{
  expect(()=>validateCloudflareUpdates([
   {key:'CLOUDFLARE_ACCOUNT_ID',value:'a'.repeat(32)},
   {key:'CLOUDFLARE_ZONE_ID',value:'b'.repeat(32)},
   {key:'CLOUDFLARE_AI_API_TOKEN',value:'ai-'.repeat(15)},
   {key:'CLOUDFLARE_API_TOKEN',value:'control-'.repeat(6)},
   {key:'CLOUDFLARE_AI_MODEL',value:'@cf/meta/llama-4-scout-17b-16e-instruct'},
  ])).not.toThrow();
 });
});
