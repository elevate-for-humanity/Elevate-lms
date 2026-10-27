import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const workflows={marketing:'deploy-google-marketing-trigger.yml',admin:'deploy-admin.yml',lms:'deploy-google-lms-trigger.yml',store:'deploy-google-store-runtime.yml','course-builder':'deploy-google-course-worker.yml'};
export function dispatchRelease(component,{sha,run=(args)=>execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim()}={}) {
 const target=component?.replace(/^elevate-/,'').replace(/-migration$/,'');
 const key=target==='ultimate-worker'?'course-builder':target;
 if(!Object.hasOwn(workflows,key))throw Error('Choose marketing, admin, lms, store, or course-builder; provider webhook URLs are not accepted');
 const repo='elevate-for-humanity/Elevate-lms';
 const latest=run(['api','repos/'+repo+'/git/ref/heads/main','--jq','.object.sha']).trim();
 if(!/^[a-f0-9]{40}$/.test(latest)||sha&&sha!==latest)throw Error('Only current main can deploy; old provider build IDs and stale commits are not deployable');
 run(['api','--method','POST','repos/'+repo+'/actions/workflows/'+workflows[key]+'/dispatches','-f','ref=main']);
 return {component:key,provider:'google-cloud-run',commit:latest,status:'dispatched',verifiedLive:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 const n=process.argv.indexOf('--sha');
 try {console.log(JSON.stringify(dispatchRelease(process.argv[2],{sha:n<0?undefined:process.argv[n+1]})));}
 catch {console.error('Google release dispatch failed; check current main, component, GitHub authentication and Actions access');process.exitCode=1;}
}
