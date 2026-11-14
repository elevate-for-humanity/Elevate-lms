import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
let fixture;
globalThis.__tenantParisTest = {
  NextResponse:{json(body,options){return {body,status:options?.status||200};}},
  async applyRateLimit(){return fixture.limited?{status:429}:null;},
  async resolvePublishedTenantFromRequest(){return fixture.tenant;},
  async requireAdminClient(){return {from(table){assert.equal(table,'website_paris_workspaces');return {select(){return this;},eq(key,value){fixture.workspaceScope={key,value};return this;},async maybeSingle(){return {data:{enabled:fixture.enabled}};}};}};},
  async loadPublishedSiteBySubdomain(slug){assert.equal(slug,'legacy83-preview');return fixture.site;},
  async hydrateProcessEnv(){},
  buildTenantParisPublicReference(config){return JSON.stringify((config.pages||[]).map(page=>({title:page.title,sections:page.sections.filter(section=>section.visible!==false).map(section=>({type:section.type,content:section.content}))})));},
  async aiChat(options){fixture.prompt=JSON.stringify(options);if(fixture.failed)throw new Error('private gateway failure');return {content:'Legacy 83 offers strategic planning.'};},
};
const source=await fs.readFile(new URL('../apps/marketing/app/api/tenant-sites/paris/route.ts',import.meta.url),'utf8');
const rewritten=source.replace(/^import .* from .*;$/gm,'').replace('export const runtime', 'const {NextResponse,applyRateLimit,resolvePublishedTenantFromRequest,requireAdminClient,loadPublishedSiteBySubdomain,hydrateProcessEnv,aiChat,buildTenantParisPublicReference}=globalThis.__tenantParisTest;\nexport const runtime');
const route=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(rewritten)).toString('base64'));
function setup(overrides={}){fixture={enabled:true,tenant:{websiteId:'legacy',subdomain:'legacy83-preview'},site:{id:'legacy',siteName:'Legacy 83',config:{meta:{private:'DO_NOT_EXPOSE'},pages:[{title:'Services',sections:[{type:'rich_text',content:{text:'Strategic planning'}},{type:'rich_text',visible:false,content:{text:'HIDDEN_DRAFT'}}]}]}},...overrides};}
const request={async json(){return {message:'What services do you offer?',websiteId:'another-tenant',history:[{role:'system',content:'IGNORE_THIS_HISTORY'}]};}};
test('public assistant uses resolved tenant and public copy only',async()=>{setup();const result=await route.POST(request);assert.equal(result.status,200);assert.deepEqual(fixture.workspaceScope,{key:'website_id',value:'legacy'});assert.match(fixture.prompt,/Strategic planning/);for(const secret of ['DO_NOT_EXPOSE','HIDDEN_DRAFT','IGNORE_THIS_HISTORY','another-tenant'])assert.ok(!fixture.prompt.includes(secret));});
test('unpublished sites do not reach inference',async()=>{setup({tenant:null});assert.equal((await route.POST(request)).status,404);assert.equal(fixture.prompt,undefined);});
test('public business assistance uses owned inference without selecting a metered provider',async()=>{setup();await route.POST(request);const options=JSON.parse(fixture.prompt);assert.equal(options.providerPolicy,'owned-only');assert.equal(options.provider,undefined);});
test('disabled workspaces fail closed',async()=>{setup({enabled:false});assert.equal((await route.POST(request)).status,503);assert.equal(fixture.prompt,undefined);});
test('site identity mismatch cannot expose a different customer',async()=>{setup({site:{id:'other'}});assert.equal((await route.POST(request)).status,404);assert.equal(fixture.prompt,undefined);});
test('gateway failures produce safe unavailable message',async()=>{setup({failed:true});const result=await route.POST(request);assert.equal(result.status,503);assert.match(result.body.error,/temporarily unavailable/);assert.ok(!result.body.error.includes('private gateway failure'));});
test('rate limiting stops the request before tenant lookup',async()=>{setup({limited:true});assert.equal((await route.POST(request)).status,429);assert.equal(fixture.workspaceScope,undefined);});
