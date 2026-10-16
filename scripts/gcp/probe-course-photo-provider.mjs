import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {generateTeachingPhoto} from '../../lib/ultimate-course-builder/adapters/google-teaching-photo.mjs';
const region='us-east1',name='elevate-course-photo-probe';
const source=JSON.parse(google(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region=us-central1','--format=json']));
const job={apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:structuredClone(source.spec)};
job.spec.template.spec.taskCount=1;job.spec.template.spec.parallelism=1;
const task=job.spec.template.spec.template.spec;
task.maxRetries=0;task.timeoutSeconds=300;
task.containers[0].resources={limits:{cpu:'1',memory:'1Gi'}};
const code="import {createHash} from 'node:crypto';\n"+generateTeachingPhoto.toString()+"\nconst image=await generateTeachingPhoto('Photorealistic instructional illustration of a clean barber workstation with combs, cape and clipper guards neatly separated. No people, no text, no invented guard measurements.');if(!['image/png','image/jpeg','image/webp'].includes(image.mimeType)||!image.bytes?.length)throw Error('IMAGE_FORMAT_INVALID');console.log(JSON.stringify({photoProviderVerified:true,provider:image.provider,model:image.model,bytes:image.bytes.length,sha256:createHash('sha256').update(image.bytes).digest('hex')}));";
task.containers[0].command=['node'];task.containers[0].args=['--input-type=module','-e',code];
const capacity=await inspectRegionalCapacity({region,task});
console.log(JSON.stringify({kind:'photoProbeCapacity',...capacity}));
if(!capacity.fits)throw Error('PHOTO_PROBE_CAPACITY_UNAVAILABLE');
const directory=mkdtempSync(join(tmpdir(),'photo-probe-'));
try{
 const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(job),{mode:0o600});
 google(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
 google(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--wait','--quiet']);
 console.log(JSON.stringify({photoProviderProbeCompleted:true,usesExistingCourseIdentity:true}));
}finally{rmSync(directory,{recursive:true,force:true});}
