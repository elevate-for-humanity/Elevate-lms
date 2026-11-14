import {pathToFileURL} from 'node:url';
export const portalRoles=['APPRENTICE','HOST_SHOP','LEARNER','PROGRAM_HOLDER','EMPLOYER','INSTRUCTOR','STAFF','CASE_MANAGER','ADMIN'];
export function requirePortalIdentities(env=process.env) {
  const missing=portalRoles.flatMap(role=>['EMAIL','PASSWORD'].map(kind=>`E2E_${role}_${kind}`)).filter(key=>!env[key]?.trim());
  if(missing.length)throw Error('E2E_FIXTURES_MISSING:'+missing.join(','));
  return {roles:portalRoles.length,credentialsComplete:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {console.log(JSON.stringify(requirePortalIdentities()));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
