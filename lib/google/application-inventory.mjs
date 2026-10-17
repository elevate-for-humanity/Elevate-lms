import {readApplicationUsage} from './application-usage.mjs';

// Read-only Google control-plane view. No environment values, payment records,
// browser state, taxpayer records or mutation endpoints are returned.
const project = 'elegant-racer-299721';
const regions = ['us-central1', 'us-east1'];
const expected = [
  ['Marketing', 'elevate-marketing-migration', 'service'],
  ['LMS', 'elevate-lms-migration', 'service'],
  ['Admin', 'elevate-admin-migration', 'service'],
  ['Store', 'elevate-store-migration', 'service'],
  ['Legacy 83', 'elevate-legacy83', 'service'],
  ['Supersonic Fast Cash', 'elevate-supersonic', 'service'],
  ['Course Builder', 'elevate-course-builder', 'job'],
  ['Studio Browser', 'elevate-studio-browser', 'service'],
];
export function summarizeApplication(resource, revisions = []) {
  const kind = resource.kind;
  const traffic = resource.trafficStatuses || [];
  const serving = traffic.filter(t => Number(t.percent) > 0).map(t => {
    const revision = revisions.find(r => r.name === t.revision);
    const container = revision?.containers?.[0];
    const labelSha = revision?.labels?.['commit-sha'];
    const environmentShas = ['GIT_SHA','GITHUB_SHA','NEXT_PUBLIC_GIT_SHA','NF_GIT_SHA'].map(name=>container?.env?.find(e=>e.name===name)?.value);
    const commit = [labelSha, ...environmentShas].find(value => /^[a-f0-9]{40}$/.test(value || '')) || null;
    return { revision:t.revision.split('/').at(-1), percent:Number(t.percent), commit,
      cpu:container?.resources?.limits?.cpu ?? null, memory:container?.resources?.limits?.memory ?? null };
  });
  const task = resource.template?.template;
  const limits = task?.containers?.[0]?.resources?.limits;
  return {
    name:resource.name?.split('/').at(-1), kind, region:resource.region,
    ready:resource.terminalCondition?.state === 'CONDITION_SUCCEEDED',
    serving,
    configured:kind === 'job' ? {cpu:limits?.cpu ?? null,memory:limits?.memory ?? null,parallelism:resource.template?.parallelism ?? null} : {
      minInstances:resource.scaling?.minInstanceCount ?? resource.template?.scaling?.minInstanceCount ?? 0,
      maxInstances:resource.scaling?.maxInstanceCount ?? resource.template?.scaling?.maxInstanceCount ?? null,
    },
    observedUsage:null,
    billingStatus:'not_verified',
    subscriptionStatus:'not_verified',
  };
}
export async function getApplicationInventory({request=fetch,now=()=>new Date().toISOString()}={}) {
  const failures = [];
  const observedAt = now();
  let token;
  try {
    const response = await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(5000),redirect:'error',cache:'no-store',
    });
    if(!response.ok || response.headers.get('Metadata-Flavor') !== 'Google')throw Error();
    token = (await response.json()).access_token;
    if(typeof token !== 'string' || !token)throw Error();
  } catch { return {observedAt,project,applications:[],expected:expected.map(([label])=>({label,status:'inventory_unavailable'})),failures:[{scope:'identity',code:'google_identity_unavailable'}]}; }
  let remainingReads = 40;
  async function read(url) {
    if(--remainingReads < 0)throw Error('inventory_read_budget_exhausted');
    const response = await request(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000),redirect:'error',cache:'no-store'});
    if(!response.ok)throw Error(response.status === 403 ? 'permission_denied' : 'google_read_failed');
    return response.json();
  }
  const resources = [];
  for(const region of regions) {
    for(const kind of ['service','job']) {
      const collection = kind === 'service' ? 'services' : 'jobs';
      let pageToken = '';
      try {
        do {
          const url=`https://run.googleapis.com/v2/projects/${project}/locations/${region}/${collection}?pageSize=100`+(pageToken?'&pageToken='+encodeURIComponent(pageToken):'');
          const page = await read(url);
          for(const resource of page[collection] || []) {
            const prefix=`projects/${project}/locations/${region}/${collection}/`;
            if(typeof resource.name !== 'string' || !resource.name.startsWith(prefix))throw Error('unexpected_google_resource');
            const revisions = [];
            if(kind === 'service') {
              for(const name of new Set((resource.trafficStatuses || []).filter(t => Number(t.percent)>0).map(t=>t.revision))) {
                if(typeof name !== 'string' || !name.startsWith(resource.name+'/revisions/'))throw Error('unexpected_google_revision');
                try { revisions.push(await read('https://run.googleapis.com/v2/'+name)); }
                catch { failures.push({scope:name,code:'serving_revision_unavailable'}); }
              }
            }
            resources.push(summarizeApplication({...resource,kind,region},revisions));
          }
          pageToken = page.nextPageToken || '';
        } while(pageToken);
      } catch(error) { failures.push({scope:region+'/'+collection,code:error.message === 'permission_denied'?'permission_denied':'inventory_incomplete'}); }
    }
  }
  const incompleteInventory=failures.length>0;
  const usage=resources.some(app=>app.kind==='service')?await readApplicationUsage({read,applications:resources,observedAt}):{applications:resources,failures:[]};
  failures.push(...usage.failures);
  return {observedAt,project,applications:usage.applications,expected:expected.map(([label,name,kind])=>({label,name,kind,
    status:resources.some(r=>r.name===name&&r.kind===kind)?'discovered':incompleteInventory?'not_verified':'not_discovered',
  })),failures};
}
