import 'server-only';

export type GoogleServiceKey='marketing'|'lms'|'admin'|'store';
export type GoogleServiceSummary={id:string;key:GoogleServiceKey;label:string;url:string;healthPath:string};

const PROJECT='elegant-racer-299721';
const REGION='us-central1';
export function getGoogleServices():GoogleServiceSummary[]{return [
 {key:'marketing',id:'elevate-marketing-migration',label:'Marketing / Public Site',url:process.env.NEXT_PUBLIC_PUBLIC_SITE_URL||'https://www.elevateforhumanity.org',healthPath:'/api/health'},
 {key:'lms',id:'elevate-lms-migration',label:'LMS / Student App',url:process.env.NEXT_PUBLIC_LMS_URL||process.env.NEXT_PUBLIC_APP_URL||'https://app.elevateforhumanity.org',healthPath:'/api/health'},
 {key:'admin',id:'elevate-admin-migration',label:'Admin Dashboard',url:process.env.NEXT_PUBLIC_ADMIN_URL||'https://admin.elevateforhumanity.org',healthPath:'/api/health'},
 {key:'store',id:'elevate-store-migration',label:'Store',url:process.env.NEXT_PUBLIC_STORE_URL||'https://store.elevateforhumanity.org',healthPath:'/api/health'},
];}
export function googleProjectId(){return PROJECT}
export function googleRegion(){return REGION}
export function isGoogleRuntimeReady(){return Boolean(process.env.GOOGLE_CLOUD_PROJECT||process.env.GCP_PROJECT||process.env.K_SERVICE)}
export async function getGoogleService(service:GoogleServiceSummary){
 const response=await fetch(service.url.replace(/\/$/,'')+service.healthPath,{cache:'no-store',signal:AbortSignal.timeout(8000)});
 const body=await response.json().catch(()=>({}));
 return {status:response.ok?'healthy':'unhealthy',commit:body.commit||body.commitSha||null,ready:body.ready===true,healthy:body.healthy===true};
}
