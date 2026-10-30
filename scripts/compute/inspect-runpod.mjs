import {pathToFileURL} from 'node:url';

const API = 'https://api.runpod.io/v2/';
const fail = code => { throw new Error(`RUNPOD_INSPECTION_${code}`); };
const number = value => Number.isFinite(value) && value >= 0 ? value : null;
const label = value => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').slice(0,200) : null;

/** Read-only account inventory. Never returns environment variables, commands or keys. */
export async function inspectRunpod({apiKey, request = fetch, now = () => new Date()} = {}) {
  if (typeof apiKey !== 'string' || apiKey.length < 24 || /\s/.test(apiKey)) fail('KEY_REQUIRED');
  async function read(path, query = {}) {
    const url = new URL(path, API);
    for (const [name,value] of Object.entries(query)) url.searchParams.set(name, value);
    let response;
    try {
      response = await request(url, {
        method:'GET', redirect:'error', signal:AbortSignal.timeout(20000),
        headers:{Authorization:`Bearer ${apiKey}`, Accept:'application/json'},
      });
    } catch { fail('REQUEST_FAILED'); }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      fail(`HTTP_${response.status}`);
    }
    let data;
    try { data = await response.json(); } catch { fail('INVALID_JSON'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) fail('INVALID_RESPONSE');
    return data;
  }
  async function list(path, key) {
    const items = [], seen = new Set();
    let cursor;
    for (let page = 0; page < 20; page++) {
      const data = await read(path, {limit:'100', ...(cursor ? {cursor} : {})});
      if (!Array.isArray(data[key]) || typeof data.pagination?.hasNextPage !== 'boolean') fail('INVALID_PAGE');
      items.push(...data[key]);
      if (!data.pagination.hasNextPage) return items;
      const next = data.pagination.nextCursor;
      if (typeof next !== 'string' || !next || seen.has(next)) fail('INVALID_CURSOR');
      seen.add(next); cursor = next;
    }
    fail('PAGE_LIMIT');
  }
  const [pods,endpoints,volumes,cpuCatalog,gpuCatalog] = await Promise.all([
    list('pods','pods'), list('serverless','endpoints'), list('network-volumes','networkVolumes'),
    read('catalog/cpus',{include:'AVAILABILITY',product:'POD',vcpuCount:'4'}),
    read('catalog/gpus',{include:'AVAILABILITY',product:'POD',cloud:'SECURE',count:'1',countryCodes:'US'}),
  ]);
  if (!Array.isArray(cpuCatalog.cpus) || !Array.isArray(gpuCatalog.gpus)) fail('INVALID_CATALOG');
  const locations = item => (Array.isArray(item.dataCenters) ? item.dataCenters : []).map(dc => ({id:label(dc.id),availability:label(dc.availability)}));
  return {
    checkedAt:now().toISOString(), readOnly:true, apiVersion:2,
    resourcesCreated:0, configurationChanged:false, productionActivated:false,
    pods:pods.map(pod => ({id:label(pod.id),name:label(pod.name),status:label(pod.status),
      dataCenter:label(pod.dataCenterId),quotedComputeUsdPerHour:number(pod.cost),
      // A stopped Pod still has a quoted compute rate; it is not current spend.
      gpu:pod.gpu ? {id:label(pod.gpu.id),count:number(pod.gpu.count)} : null,
      cpu:pod.cpu ? {id:label(pod.cpu.id),vcpuCount:number(pod.cpu.vcpuCount)} : null})),
    endpoints:endpoints.map(endpoint => ({id:label(endpoint.id),name:label(endpoint.name)})),
    networkVolumes:volumes.map(volume => ({id:label(volume.id),name:label(volume.name),sizeGb:number(volume.size),dataCenter:label(volume.dataCenter),type:label(volume.type)})),
    cpuOptions:cpuCatalog.cpus.map(cpu => ({id:label(cpu.id),name:label(cpu.name),
      minVcpu:number(cpu.vcpu?.min),maxVcpu:number(cpu.vcpu?.max),ramGbPerVcpu:number(cpu.ramGbPerVcpu),
      usdPerVcpuHour:number(cpu.price?.securePerVcpu),availabilityForFourVcpus:label(cpu.availability),dataCenters:locations(cpu)})),
    gpuOptions:gpuCatalog.gpus.filter(gpu => gpu.secure && gpu.memory >= 24 && gpu.memory <= 48)
      .map(gpu => ({id:label(gpu.id),vramGb:number(gpu.memory),usdPerGpuHour:number(gpu.price?.secure),availability:label(gpu.availability),dataCenters:locations(gpu)})),
    limitations:['Catalog prices exclude storage and taxes.','Inventory does not prove model inference or production readiness.','No paid resource is started by this inspection.'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  inspectRunpod({apiKey:process.env.RUNPOD_API_KEY}).then(result => console.log(JSON.stringify(result,null,2)))
    .catch(error => {
      const code = /^RUNPOD_INSPECTION_[A-Z_0-9]+$/.test(error.message) ? error.message : 'RUNPOD_INSPECTION_FAILED';
      console.error(JSON.stringify({readOnly:true,passed:false,error:code})); process.exitCode=1;
    });
}
