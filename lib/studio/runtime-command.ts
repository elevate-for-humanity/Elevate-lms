import 'server-only';
import {hydrateProcessEnv} from '@/lib/secrets';

/** The existing Studio container executes commands; the Admin web process
 * forwards them and never substitutes its own filesystem as the workspace. */
export async function executeStudioCommand(command: string) {
  await hydrateProcessEnv();
  const base = (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/,'');
  const secret = process.env.STUDIO_BROWSER_SECRET;
  if (!base || !secret) throw new Error('STUDIO_COMMAND_RUNTIME_NOT_CONFIGURED');
  const call = async (endpoint:string,body:Record<string,unknown>) => {
    const response=await fetch(`${base}${endpoint}`,{method:'POST',
      headers:{'content-type':'application/json','x-studio-browser-secret':secret},
      body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
    const result=await response.json();
    if(!response.ok) throw new Error(`Studio command runtime rejected request (HTTP ${response.status})`);
    return result;
  };
  await call('/workspace/repository/sync',{
    repoUrl:'https://github.com/elevate-for-humanity/Elevate-lms.git',branch:'main',
  });
  const result=await call('/workspace/exec',{command,timeoutMs:30000});
  if(!Number.isInteger(result.exitCode)) throw new Error('STUDIO_COMMAND_RESULT_MISSING');
  return {stdout:String(result.stdout || ''),stderr:String(result.stderr || ''),exitCode:result.exitCode};
}
