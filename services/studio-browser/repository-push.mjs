import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const ORIGIN='https://github.com/elevate-for-humanity/Elevate-lms.git';
// Git normalizes variable names to lowercase when matching config keys.
export const unsafeGitConfigurationPattern='^(url\\..*\\.(insteadof|pushinsteadof)|remote\\..*\\.pushurl|http\\.(.*\\.)?(extraheader|proxy|sslverify|sslcainfo|sslcapath|followredirects)|core\\.(gitproxy|sshcommand)|protocol\\..*\\.allow)$';
/** Use a short-lived server credential for one non-force push; never save it in git config. */
export async function pushWorkspaceRepository({root,branch,expectedSha,token},run=execute) {
  if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/.test(branch||'') || branch.includes('..') || branch.includes('//') || !/^[a-f0-9]{40}$/.test(expectedSha||'')) throw Error('invalid_repository_push');
  if(typeof token!=='string'||token.length<20||/\s/.test(token)||[...token].some(char=>char.charCodeAt(0)<32))throw Error('github_credentials_unavailable');
  const base={cwd:root,timeout:30000,maxBuffer:1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}};
  const read=async args=>(await run('git',args,base)).stdout.trim();
  await read(['check-ref-format','--branch',branch]);
  if(await read(['remote','get-url','origin'])!==ORIGIN)throw Error('repository_origin_mismatch');
  if(await read(['symbolic-ref','--short','HEAD'])!==branch || await read(['rev-parse','HEAD'])!==expectedSha)throw Error('repository_changed_refresh_before_push');
  // Refuse config that could redirect credential-bearing requests or execute a helper.
  let overrides='',configUnverified=false;
  try{overrides=await read(['config','--get-regexp',unsafeGitConfigurationPattern]);}
  catch(error){configUnverified=error.code!==1;}
  // Keep raw git output out of errors; repository config can contain credentials.
  if(configUnverified)throw Error('repository_config_unverified');
  if(overrides)throw Error('repository_credential_routing_unverified');
  const enforced={
    'http.https://github.com/.extraheader':'Authorization: Basic '+Buffer.from('x-access-token:'+token).toString('base64'),
    'credential.helper':'','core.hooksPath':'/dev/null','http.sslVerify':'true',
    'http.followRedirects':'false','http.proxy':'','http.sslCAInfo':'/etc/ssl/certs/ca-certificates.crt',
  };
  const env={...base.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_ALLOW_PROTOCOL:'https',GIT_CONFIG_COUNT:String(Object.keys(enforced).length)};
  Object.entries(enforced).forEach(([key,value],index)=>{env['GIT_CONFIG_KEY_'+index]=key;env['GIT_CONFIG_VALUE_'+index]=value;});
  try {
    await run('git',['push','--porcelain',ORIGIN,'HEAD:refs/heads/'+branch],{...base,env,timeout:90000});
    const remote=(await run('git',['ls-remote','--exit-code','--heads',ORIGIN,'refs/heads/'+branch],{...base,env})).stdout.trim().split(/\s+/)[0];
    if(remote!==expectedSha)throw Error('readback');
    return {ok:true,branch,sha:remote,repository:'elevate-for-humanity/Elevate-lms',verified:true};
  } catch { throw Error('github_push_not_verified_check_remote_before_retry'); }
}
