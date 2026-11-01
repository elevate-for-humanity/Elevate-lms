import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Exercise the real middleware with framework, auth and tenant lookup boundaries stubbed.
const source = readFileSync(new URL('../../apps/marketing/middleware.ts', import.meta.url), 'utf8')
  .replace(/^import [\s\S]*? from ['"][^'"]+['"];\n/gm, '');
const boundaries = `
const hasSupabaseAuthCookie=()=>false;
const response=(kind,status=200)=>({kind,status,headers:new Headers(),cookies:{set(){}}});
const NextResponse={next:()=>response('next'),redirect:(url,status=307)=>({...response('redirect',status),url:String(url)})};
const createMiddlewareSupabaseClient=()=>({auth:{getUser:async()=>({data:{user:null},error:null})}});
const rewriteCustomDomainRequest=async()=>response('tenant');
const rewriteTenantAppHostRequest=async()=>response('tenant-app');
const tenantSlugFromAppHost=()=>null;
`;
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64');
const rolesUrl=moduleUrl(readFileSync(new URL('../../lib/rbac/role-matrix.ts',import.meta.url),'utf8'));
const lmsHostUrl=moduleUrl(readFileSync(new URL('../../lib/routing/lms-host.ts',import.meta.url),'utf8'));
const portalUrl=moduleUrl(readFileSync(new URL('../../lib/routing/portal-map.ts',import.meta.url),'utf8')
  .replace("'@/lib/rbac/role-matrix'",JSON.stringify(rolesUrl))
  .replace("'./lms-host'",JSON.stringify(lmsHostUrl)));
const runtimeUrl=moduleUrl(readFileSync(new URL('../../lib/health/public-runtime-service.ts',import.meta.url),'utf8'));
const withdrawalsUrl=moduleUrl(readFileSync(new URL('../../lib/programs/withdrawn-programs.mjs',import.meta.url),'utf8'));
const routingImports=`import {ADMIN_HOST,LMS_HOST,MARKETING_HOST,getPortalKeyFromPath,PORTAL_MAP} from ${JSON.stringify(portalUrl)};\nimport {getPublicRuntimeService} from ${JSON.stringify(runtimeUrl)};\nimport {isWithdrawnProgramRequest} from ${JSON.stringify(withdrawalsUrl)};\n`;
const { middleware } = await import(moduleUrl(routingImports+boundaries+source));

function request(host, path) {
  const url = new URL('https://' + host + path);
  return {headers:new Headers({host}),nextUrl:url,cookies:{set(){}}};
}
for (const host of ['elevate-marketing-migration-aabnh2y32a-uc.a.run.app','elevate-marketing-migration-484736877039.us-central1.run.app','preview.northflank.app']) {
  test(host + ' serves operational health without tenant routing', async () => {
    const result=await middleware(request(host,'/api/health'));
    assert.equal(result.kind,'next');
    assert.equal(result.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
  });
  test(host + ' still authenticates protected portals', async () => {
    const result=await middleware(request(host,'/case-manager'));
    assert.equal(result.kind,'redirect');
    assert.equal(new URL(result.url).hostname,'lms.elevateforhumanity.org');
    assert.equal(new URL(result.url).pathname,'/login');
  });
}
test('unrelated custom domain still uses tenant routing', async () => {
  assert.equal((await middleware(request('client.example.org','/'))).kind,'tenant');
});
test('lookalike provider suffix is not trusted', async () => {
  assert.equal((await middleware(request('preview.run.app.attacker.example','/programs'))).kind,'tenant');
});
test('public apex keeps its canonical redirect', async () => {
  const result=await middleware(request('elevateforhumanity.org','/programs'));
  assert.equal(result.status,308);
  assert.equal(result.url,'https://www.elevateforhumanity.org/programs');
});
