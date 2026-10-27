import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
// Import the deployed module with all of its helpers. Serializing the provider
// function drops its imports and cannot validate the actual runtime path.
export const photoProbeCode = `
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {generateTeachingPhoto} from './lib/ultimate-course-builder/adapters/google-teaching-photo.mjs';
const image=await generateTeachingPhoto('Photorealistic instructional illustration of a clean barber workstation with combs, cape and clipper guards neatly separated. No people, no text, no invented guard measurements.',{maxAttempts:1,timeoutMs:120000});
if(!['image/png','image/jpeg','image/webp'].includes(image.mimeType)||!image.bytes?.length)throw Error('IMAGE_FORMAT_INVALID');
const decoded=await sharp(image.bytes).raw().toBuffer({resolveWithObject:true});
if(decoded.info.width<512||decoded.info.height<288)throw Error('IMAGE_DIMENSIONS_INVALID');
console.log(JSON.stringify({photoProviderVerified:true,provider:image.provider,model:image.model,bytes:image.bytes.length,width:decoded.info.width,height:decoded.info.height,sha256:createHash('sha256').update(image.bytes).digest('hex')}));
`;

export async function probeCoursePhotoProvider({run=google,capacityCheck=inspectRegionalCapacity}={}){
const region='us-east1',name='elevate-course-photo-probe';
const source=JSON.parse(run(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region=us-central1','--format=json']));
const job={apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:structuredClone(source.spec)};
job.spec.template.spec.taskCount=1;job.spec.template.spec.parallelism=1;
const task=job.spec.template.spec.template.spec;
task.maxRetries=0;task.timeoutSeconds=300;
task.containers[0].resources={limits:{cpu:'1',memory:'1Gi'}};
task.containers[0].command=['node'];task.containers[0].args=['--input-type=module','-e',photoProbeCode];
const capacity=await capacityCheck({region,task});
console.log(JSON.stringify({kind:'photoProbeCapacity',...capacity}));
if(!capacity.fits)throw Error('PHOTO_PROBE_CAPACITY_UNAVAILABLE');
const directory=mkdtempSync(join(tmpdir(),'photo-probe-'));
try{
 const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(job),{mode:0o600});
 run(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
 run(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--wait','--quiet']);
 console.log(JSON.stringify({photoProviderProbeCompleted:true,usesExistingCourseIdentity:true,image:task.containers[0].image}));
}finally{rmSync(directory,{recursive:true,force:true});}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await probeCoursePhotoProvider();
