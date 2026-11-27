import {pathToFileURL} from 'node:url';
export const portalRoles=['APPRENTICE','HOST_SHOP','LEARNER','PROGRAM_HOLDER','EMPLOYER','INSTRUCTOR','STAFF','CASE_MANAGER','ADMIN'];
export function requirePortalIdentities(env=process.env) {
  const roles = env.EMPLOYER_ONLY === 'true' ? ['EMPLOYER'] : portalRoles;
  const production = env.PORTAL_E2E_SECRET_SCOPE === 'production';
  const missing=roles.flatMap(role=>['EMAIL','PASSWORD'].map(kind=>`E2E_${role}_${kind}`)).filter(key=>!env[key]?.trim());
  if (missing.length) {
    const secretNames = production ? missing.map(key => `PRODUCTION_${key}`) : missing;
    throw Error('E2E_FIXTURES_MISSING:' + secretNames.join(','));
  }
  if (production) {
    if (env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '') !== 'https://cuxzzpsyufcewtmicszk.supabase.co') {
      throw Error('PRODUCTION_E2E_SUPABASE_TARGET_MISMATCH');
    }
    const addresses = roles.map(role => env[`E2E_${role}_EMAIL`].trim().toLowerCase());
    if (new Set(addresses).size !== addresses.length) throw Error('PRODUCTION_E2E_ROLE_IDENTITIES_MUST_BE_DISTINCT');
  }
  return {roles:roles.length,credentialsComplete:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {console.log(JSON.stringify(requirePortalIdentities()));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
