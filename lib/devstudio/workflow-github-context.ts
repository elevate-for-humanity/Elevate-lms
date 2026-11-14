import 'server-only';
import {AsyncLocalStorage} from 'node:async_hooks';

// Called only after the repair endpoint verifies the signed workflow identity.
// The job token lives in this request's async scope, never secrets or process.env.
const workflowCredential = new AsyncLocalStorage<string>();
export function currentWorkflowGitHubToken(): string | undefined {
  return workflowCredential.getStore();
}
export async function withWorkflowGitHubToken<T>(token: string, work:()=>Promise<T>):Promise<T> {
  if(!token || token.length<20 || /\s/.test(token))throw Error('PARIS_WORKFLOW_GITHUB_TOKEN_REQUIRED');
  return workflowCredential.run(token,work);
}
