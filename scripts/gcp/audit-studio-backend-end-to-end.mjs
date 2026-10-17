import { google, loadGoogleConfig, PROJECT } from './runtime-config.mjs';

const REGION = 'us-central1';
const OLD = /(?:^|\.)(?:northflank\.app|northflank\.com|code\.run)$/i;
export function inspectGoogleBindings(config, resource, browser) {
  const env = config.runtimeEnvironment ?? {};
  const rows = resource?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  const image = resource?.spec?.template?.spec?.containers?.[0]?.image ?? '';
  const byName = new Map(rows.map(row => [row.name, row]));
  const failures = [];
  for (const name of ['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL','STUDIO_BROWSER_SECRET']) {
    const row=byName.get(name);
    if(!row) failures.push('admin_missing_'+name);
    if(name.endsWith('_URL')) {
      const value=row?.value || env[name];
      if(!value) failures.push('browser_url_missing_'+name);
      else {
        try {const u=new URL(value);if(u.protocol!=='https:'||OLD.test(u.hostname))failures.push('browser_legacy_or_insecure_'+name);}
        catch {failures.push('browser_url_invalid_'+name);}
      }
    }
  }
  for(const name of ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_MODEL','CLOUDFLARE_AI_API_TOKEN']) {
    if(!env[name]) failures.push('google_config_missing_'+name);
    if(!byName.has(name) && env.ELEVATE_RUNTIME_CONFIG_PROVIDER==='google-secret-manager') failures.push('admin_unbound_'+name);
  }
  const browserEnv=browser?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  const browserImage=browser?.spec?.template?.spec?.containers?.[0]?.image ?? null;
  if(!image) failures.push('admin_container_image_missing');
  if(browser&&!browserImage) failures.push('studio_browser_container_image_unverified');
  // Browser is permitted on the existing Google Compute Engine VM, not solely Cloud Run.
  // Validate its live authenticated health separately; absence of a Run image alone is not a failure.
  if(image.includes('northflank')||String(browserImage).includes('northflank'))failures.push('legacy_container_image_reference');
  return {failures,adminImagePresent:Boolean(image),studioBrowserImagePresent:Boolean(browserImage),
    adminRevision:resource?.status?.latestReadyRevisionName??null,
    browserRevision:browser?.status?.latestReadyRevisionName??null,
    browserEnvironmentKeyCount:browserEnv.length};
}
export async function auditGoogleStudio({run=google,request=fetch}={}) {
  const config=loadGoogleConfig('admin',run);
  const read=(service)=>JSON.parse(run(['run','services','describe',service,'--region',REGION,'--project',PROJECT,'--format=json']));
  const admin=read('elevate-admin-migration');
  let browser=null;
  for(const name of ['elevate-studio-browser','elevate-studio-browser-migration']) {
    try { browser=read(name);break; }catch { /* Report if neither exists. */ }
  }
  const audit=inspectGoogleBindings(config,admin,browser);
  const env=config.runtimeEnvironment;
  const browserUrl=env.STUDIO_BROWSER_URL;
  const probes={};
  // Current production browser may be a Google Compute Engine VM. Its identity
  // is proven by Google inventory and the HTTPS health endpoint, not a fake
  // requirement that the browser also be a Cloud Run service.
  if(!browser) {
    try {
      const instances=JSON.parse(run(['compute','instances','list','--project',PROJECT,'--format=json']));
      const owned=instances.filter(instance => /^elevate-studio-browser(?:-|$)/.test(instance.name) &&
        instance.status === 'RUNNING');
      probes.browserVmRunning=owned.length>0;
      if(!owned.length) audit.failures.push('studio_browser_google_vm_not_running');
    } catch { audit.failures.push('studio_browser_google_vm_inventory_unavailable'); }
  }
  if(browserUrl) {
    try {
      const url=new URL(browserUrl);
      if(url.protocol==='https:'&&!OLD.test(url.hostname)) {
        const response=await request(new URL('/health',url),{redirect:'manual',signal:AbortSignal.timeout(10000)});
        probes.browserHealth=response.status;
        if(response.status!==200) audit.failures.push('studio_browser_health_http_'+response.status);
      }
    } catch {audit.failures.push('studio_browser_health_unreachable');}
  }
  const account=env.CLOUDFLARE_ACCOUNT_ID;
  const token=env.CLOUDFLARE_AI_API_TOKEN;
  const model=env.CLOUDFLARE_AI_MODEL;
  if(account&&token&&model?.startsWith('@cf/')) {
    try {
      const url=new URL('https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+'/ai/models/search');
      url.searchParams.set('search',model);
      url.searchParams.set('per_page','1');
      const response=await request(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
      probes.cloudflareAuth=response.status;
      if(!response.ok)audit.failures.push('cloudflare_model_catalog_http_'+response.status);
    } catch {audit.failures.push('cloudflare_model_catalog_unreachable');}
  }
  return {passed:audit.failures.length===0,failures:audit.failures,probes,
    adminRevision:audit.adminRevision,browserRevision:audit.browserRevision,
    adminImagePresent:audit.adminImagePresent,studioBrowserImagePresent:audit.studioBrowserImagePresent};
}
if(import.meta.url===new URL('file://'+process.argv[1]).href) {
  auditGoogleStudio().then(result=>{console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;})
   .catch(()=>{console.error('Google Studio backend diagnostic could not read production runtime');process.exitCode=1;});
}
