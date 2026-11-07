import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const ORIGIN='https://github.com/elevate-for-humanity/Elevate-lms.git';
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
  try{overrides=await read(['config','--get-regexp','^(url\\..*\\.(insteadOf|pushInsteadOf)|remote\\..*\\.pushurl|http\\..*\\.extraheader)$']);}
  catch(error){configUnverified=error.code!==1;}
  // Keep raw git output out of errors; repository config can contain credentials.
  if(configUnverified)throw Error('repository_config_unverified');
  if(overrides)throw Error('repository_credential_routing_unverified');
  const env={...base.env,GIT_CONFIG_COUNT:'3',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'Authorization: Basic '+Buffer.from('x-access-token:'+token).toString('base64'),GIT_CONFIG_KEY_1:'credential.helper',GIT_CONFIG_VALUE_1:'',GIT_CONFIG_KEY_2:'core.hooksPath',GIT_CONFIG_VALUE_2:'/dev/null'};
  try {
    await run('git',['push','--porcelain','origin','HEAD:refs/heads/'+branch],{...base,env,timeout:90000});
    const remote=(await run('git',['ls-remote','--exit-code','--heads','origin','refs/heads/'+branch],{...base,env})).stdout.trim().split(/\s+/)[0];
    if(remote!==expectedSha)throw Error('readback');
    return {ok:true,branch,sha:remote,repository:'elevate-for-humanity/Elevate-lms',verified:true};
  } catch { throw Error('github_push_not_verified_check_remote_before_retry'); }
}
