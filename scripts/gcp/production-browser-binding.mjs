import { pathToFileURL } from 'node:url';
import { google } from './runtime-config.mjs';
export function productionBrowserEnvironment(resource) {
 if(resource?.metadata?.name!=='elevate-studio-browser')throw Error('Exact primary browser service required');
 let url;try{url=new URL(resource.status?.url);}catch{throw Error('Primary browser URL unavailable');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!url.hostname.startsWith('elevate-studio-browser-')||!url.hostname.endsWith('.run.app')||url.hostname.includes('---'))throw Error('Canonical primary browser URL required');
 return {STUDIO_BROWSER_URL:url.origin,STUDIO_BROWSER_PUBLIC_URL:url.origin};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const resource=JSON.parse(google(['run','services','describe','elevate-studio-browser','--region=us-central1','--project=elegant-racer-299721','--format=json']));
 console.log(Object.entries(productionBrowserEnvironment(resource)).map(([key,value])=>key+'='+value).join(','));
}
