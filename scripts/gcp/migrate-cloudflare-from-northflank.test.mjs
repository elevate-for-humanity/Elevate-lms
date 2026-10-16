import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCloudflareConfig } from './migrate-cloudflare-from-northflank.mjs';
const existing=()=>({version:1,component:'admin',runtimeEnvironment:{AI_PROVIDER:'elevate',ADMIN_INTERNAL_ORIGIN:'https://admin.example'},volumes:[],runtimeFiles:{}});
const source={CLOUDFLARE_ACCOUNT_ID:'account-123456789',CLOUDFLARE_AI_API_TOKEN:'test-secret',CLOUDFLARE_AI_MODEL:'@cf/meta/llama-3.1-8b-instruct'};
test('imports Cloudflare settings without changing AI provider or other existing config',()=>{
 const next=mergeCloudflareConfig(existing(),source);
 assert.equal(next.runtimeEnvironment.AI_PROVIDER,'elevate');
 assert.equal(next.runtimeEnvironment.CLOUDFLARE_AI_MODEL,source.CLOUDFLARE_AI_MODEL);
 assert.equal(next.runtimeEnvironment.ADMIN_INTERNAL_ORIGIN,'https://admin.example');
});
test('rejects conflicting target credentials instead of overwriting',()=>{
 const target=existing();target.runtimeEnvironment.CLOUDFLARE_AI_API_TOKEN='different';
 assert.throws(()=>mergeCloudflareConfig(target,source),/google_cloudflare_config_conflict/);
});
test('rejects missing required settings and leaves original object unchanged',()=>{
 const target=existing();
 assert.throws(()=>mergeCloudflareConfig(target,{CLOUDFLARE_AI_MODEL:source.CLOUDFLARE_AI_MODEL}),/cloudflare_source_config_incomplete/);
 assert.equal(target.runtimeEnvironment.CLOUDFLARE_AI_MODEL,undefined);
});
