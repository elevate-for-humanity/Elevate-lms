import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {COST_ASSET_SCOPE,inventoryFailureReason} from './audit-cost-resources.mjs';

const project='elegant-racer-299721';
const root='us-central1-docker.pkg.dev/'+project+'/elevate';
const digestPattern=/^sha256:[a-f0-9]{64}$/;
export const MINIMUM_IMAGE_AGE_DAYS=7;
export function imageCleanupPlan(images,{referenced=[],children=[],now=Date.now()}={}) {
 const protectedImages=new Set([...referenced,...children]);
 const packages=new Map();
 for(const image of images){
  if(!image.package?.startsWith(root+'/')||!digestPattern.test(image.version||''))throw Error('IMAGE_INVENTORY_INVALID');
  const list=packages.get(image.package)||[];list.push(image);packages.set(image.package,list);
 }
 const remove=[];
 for(const rows of packages.values()){
  rows.sort((a,b)=>Date.parse(b.createTime)-Date.parse(a.createTime));
  for(const [index,item] of rows.entries()){
   const full=item.package+'@'+item.version,created=Date.parse(item.createTime);
   const updated=item.updateTime===undefined?created:Date.parse(item.updateTime);
   // Keep every tagged image, every retained revision/job/VM reference, every
   // manifest child, at least ten versions per package, and seven days.
   if(index<10||!Number.isFinite(created)||!Number.isFinite(updated)||now-Math.max(created,updated)<MINIMUM_IMAGE_AGE_DAYS*86400000||
      !Array.isArray(item.tags)||item.tags.length||protectedImages.has(full))continue;
   remove.push({image:full,createdAt:item.createTime});
  }
 }
 const known=images.filter(x=>Array.isArray(x.tags)&&Number.isFinite(Date.parse(x.createTime))&&Number.isFinite(Date.parse(x.updateTime||x.createTime)));
 return {repository:root,imagesInspected:images.length,eligibilityReviewComplete:known.length===images.length,
  summary:{tagged:images.filter(x=>Array.isArray(x.tags)&&x.tags.length).length,untagged:images.filter(x=>Array.isArray(x.tags)&&!x.tags.length).length,unverifiableMetadata:images.length-known.length},
  retention:{minimumVersionsPerPackage:10,minimumAgeDays:MINIMUM_IMAGE_AGE_DAYS,allTaggedImages:true,allRuntimeReferences:true,allManifestChildren:true},remove};
}

/** Normalize the documented DockerImage API instead of formatter-dependent
 * gcloud display rows. Empty protobuf tag arrays can be omitted in JSON. */
export async function listRegistryImages(token,{request=fetch}={}){
 const images=[],seen=new Set();let next='';
 do{
  if(seen.has(next))throw Error('IMAGE_PAGINATION_CYCLE');seen.add(next);
  const url=new URL('https://artifactregistry.googleapis.com/v1/projects/'+project+'/locations/us-central1/repositories/elevate/dockerImages');
  url.searchParams.set('pageSize','1000');if(next)url.searchParams.set('pageToken',next);
  const response=await request(url,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('IMAGE_API_HTTP_'+response.status);
  const body=await response.json();
  if(Object.keys(body).some(k=>!['dockerImages','nextPageToken'].includes(k))||!Array.isArray(body.dockerImages||[]))throw Error('IMAGE_API_SCHEMA_UNVERIFIED');
  for(const row of body.dockerImages||[]){
   const [pkg,version,...extra]=(row.uri||'').split('@');
   if(extra.length||!pkg?.startsWith(root+'/')||!digestPattern.test(version||'')||!Array.isArray(row.tags||[]))throw Error('IMAGE_API_SCHEMA_UNVERIFIED');
   images.push({package:pkg,version,tags:row.tags||[],createTime:row.uploadTime,updateTime:row.updateTime||row.uploadTime});
  }
  next=body.nextPageToken||'';
  if(typeof next!=='string'||images.length>4000)throw Error('IMAGE_MANIFEST_AUDIT_LIMIT');
 }while(next);
 return images;
}

const cli=args=>{try{return execFileSync('gcloud',args,{encoding:'utf8',timeout:120000,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}).trim();}
 catch(error){throw Object.assign(Error('IMAGE_INVENTORY_'+inventoryFailureReason(error).toUpperCase()),{operation:args.slice(0,3).join(' ')});}};
const json=args=>JSON.parse(cli([...args,'--project='+project,'--format=json']));
function runtimeReferences(){
 const assets=json(['asset','search-all-resources',...COST_ASSET_SCOPE]);
 if(!Array.isArray(assets))throw Error('ASSET_INVENTORY_INCOMPLETE');
 if(assets.some(a=>a.assetType==='container.googleapis.com/Cluster'))throw Error('GKE_IMAGE_DEPENDENCIES_REQUIRE_REVIEW');
 // Repository builds publish through GitHub Actions. Eligibility is fenced by
 // version age/update time, retained runtime references, manifest children and
 // live tags. It does not require access to the separate Cloud Build service.
 const regions=new Set(['us-central1','us-east1',...assets.filter(a=>/^run.googleapis.com\/(Service|Job|Revision)$/.test(a.assetType)).map(a=>a.location)]);
 const references=new Set();
 function collect(value){
  const raw=JSON.stringify(value);
  for(const match of raw.matchAll(/us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/[a-zA-Z0-9_./-]+(?:@sha256:[a-f0-9]{64}|:[a-zA-Z0-9_.-]+)/g))references.add(match[0]);
 }
 for(const region of regions){
  if(!/^[a-z]+-[a-z]+\d$/.test(region||''))throw Error('RUNTIME_LOCATION_UNRESOLVED');
  collect(json(['run','revisions','list','--region='+region]));
  collect(json(['run','jobs','list','--region='+region]));
 }
 // Metadata is inspected only in memory. It can contain secrets and must never
 // enter logs or artifacts. Container references are the only retained fields.
 collect(json(['compute','instances','list']));
 const resolved=[];
 for(const image of references){
  if(image.includes('@sha256:'))resolved.push(image);
  else {
   const data=json(['artifacts','docker','images','describe',image]);
   const digest=data.image_summary?.digest||data.imageSummary?.digest;
   if(!digestPattern.test(digest||''))throw Error('MUTABLE_RUNTIME_IMAGE_UNRESOLVED');
   resolved.push(image.slice(0,image.lastIndexOf(':'))+'@'+digest);
  }
 }
 return resolved;
}
async function manifestChildren(images){
 const token=cli(['auth','print-access-token']);
 const children=new Set();let cursor=0;
 await Promise.all(Array.from({length:8},async()=>{
  while(cursor<images.length){
   const item=images[cursor++];
   if(!item.package?.startsWith(root+'/')||!digestPattern.test(item.version||''))throw Error('IMAGE_INVENTORY_INVALID');
   const path=item.package.slice('us-central1-docker.pkg.dev/'.length);
   const response=await fetch('https://us-central1-docker.pkg.dev/v2/'+path+'/manifests/'+item.version,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'},signal:AbortSignal.timeout(20000),redirect:'error'});
   if(!response.ok)throw Error('MANIFEST_DEPENDENCIES_UNVERIFIED');
   const body=await response.json();
   if(body.schemaVersion!==2)throw Error('MANIFEST_SCHEMA_UNVERIFIED');
   for(const child of body.manifests||[]){
    if(!digestPattern.test(child.digest||''))throw Error('MANIFEST_CHILD_UNVERIFIED');
    children.add(item.package+'@'+child.digest);
   }
  }
 }));
 return [...children];
}

export async function cleanupOldImages({apply=false}={}){
 const references=runtimeReferences();
 const token=cli(['auth','print-access-token']);
 const images=await listRegistryImages(token);
 if(!Array.isArray(images)||images.length>4000)throw Error('IMAGE_MANIFEST_AUDIT_LIMIT');
 const children=await manifestChildren(images);
 const plan=imageCleanupPlan(images,{referenced:references,children});
 if(!plan.eligibilityReviewComplete)throw Error('IMAGE_VERSION_METADATA_INCOMPLETE');
 mkdirSync('audit-reports',{recursive:true});
 writeFileSync('audit-reports/image-cleanup-plan.json',JSON.stringify(plan,null,2));
 const receipts=[];
 if(apply){
  // Recheck dependencies immediately before mutation. Abort if a deployment
  // appeared during manifest inspection. Never force-delete a concurrent tag.
  const fresh=runtimeReferences();
  if(JSON.stringify([...fresh].sort())!==JSON.stringify([...references].sort()))throw Error('RUNTIME_REFERENCES_CHANGED');
  const latest=await listRegistryImages(token);
  const stillSafe=new Set(imageCleanupPlan(latest,{referenced:fresh,children}).remove.map(x=>x.image));
  for(const item of plan.remove.slice(0,100)){
   if(!stillSafe.has(item.image))continue;
   // No --delete-tags: a concurrently applied tag makes deletion fail safely.
   cli(['artifacts','docker','images','delete',item.image,'--project='+project,'--quiet']);
   receipts.push({image:item.image,deleted:true,at:new Date().toISOString()});
   writeFileSync('audit-reports/image-cleanup-receipts.json',JSON.stringify(receipts,null,2));
   console.log(JSON.stringify({action:'image_deleted',...receipts.at(-1)}));
  }
 }
 return {...plan,apply,deleted:receipts.length,eligibleNotAttempted:apply?Math.max(0,plan.remove.length-100):plan.remove.length,receipts};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await cleanupOldImages({apply:process.argv.includes('--apply')})));}
 catch(error){console.error(JSON.stringify({action:'IMAGE_CLEANUP_STOPPED',reason:/^[A-Z_]+$/.test(error.message||'')?error.message:'INVENTORY_ACCESS_OR_COMMAND_FAILED',operation:error.operation||null}));process.exitCode=1;}
}
