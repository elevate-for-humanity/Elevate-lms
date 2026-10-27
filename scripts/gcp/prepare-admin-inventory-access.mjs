import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
export const INVENTORY_PERMISSIONS=['monitoring.timeSeries.list','run.jobs.get','run.jobs.list','run.revisions.get','run.services.get','run.services.list'];
const roleId='elevateApplicationInventoryReader';
const role='projects/'+PROJECT+'/roles/'+roleId;
const member='serviceAccount:elevate-admin-runtime@'+PROJECT+'.iam.gserviceaccount.com';
// Owner preparation only: no application, secret, database or traffic mutation.
export function prepareAdminInventoryAccess({run=google,apply=false}={}){
 let existing;try{existing=JSON.parse(run(['iam','roles','describe',roleId,'--project='+PROJECT,'--format=json']));}
 catch(e){if(e.code!=='not_found')throw Error('ADMIN_INVENTORY_ROLE_READ_UNAVAILABLE',{cause:e});}
 if(existing&&(existing.deleted||JSON.stringify([...existing.includedPermissions||[]].sort())!==JSON.stringify([...INVENTORY_PERMISSIONS].sort())))throw Error('ADMIN_INVENTORY_EXISTING_ROLE_CONFLICT');
 const hasBinding=policy=>policy.bindings?.some(b=>b.role===role&&!b.condition&&b.members?.includes(member))===true;
 const before=JSON.parse(run(['projects','get-iam-policy',PROJECT,'--format=json']));
 const summary={role,member,permissions:INVENTORY_PERMISSIONS,roleExists:Boolean(existing),bindingVerified:hasBinding(before),changed:false,applicationDeployed:false,trafficChanged:false};
 if(!apply)return {...summary,mode:'inspect-only'};
 if(!existing){
  run(['iam','roles','create',roleId,'--project='+PROJECT,'--title=Elevate application inventory reader','--permissions='+INVENTORY_PERMISSIONS.join(','),'--stage=GA','--quiet']);
  const created=JSON.parse(run(['iam','roles','describe',roleId,'--project='+PROJECT,'--format=json']));
  if(created.deleted||JSON.stringify([...created.includedPermissions||[]].sort())!==JSON.stringify([...INVENTORY_PERMISSIONS].sort()))throw Error('ADMIN_INVENTORY_ROLE_READBACK_FAILED');
 }
 if(!summary.bindingVerified)run(['projects','add-iam-policy-binding',PROJECT,'--member='+member,'--role='+role,'--condition=None','--quiet']);
 const after=JSON.parse(run(['projects','get-iam-policy',PROJECT,'--format=json']));
 if(!hasBinding(after))throw Error('ADMIN_INVENTORY_BINDING_READBACK_FAILED');
 return {...summary,mode:'prepared',roleExists:true,bindingVerified:true,changed:!existing||!summary.bindingVerified};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(prepareAdminInventoryAccess({apply:process.env.ADMIN_INVENTORY_APPLY==='true'})));}catch(e){console.error(JSON.stringify({error:/^ADMIN_INVENTORY_[A-Z_]+$/.test(e.message)?e.message:'ADMIN_INVENTORY_OWNER_PREPARATION_REQUIRED',applicationDeployed:false,trafficChanged:false}));process.exitCode=1;}}
