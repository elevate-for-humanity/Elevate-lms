import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Read-only guard: never enable billing, change accounts, or print payment details.
export function verifyBilling(project, run = execFileSync) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project || '')) throw new Error('A valid Google project ID is required');
  let info;
  try {
    info = JSON.parse(run('gcloud', ['billing', 'projects', 'describe', project, '--format=json'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
    }));
  } catch {
    throw new Error('Cannot verify project billing. Check the deployment identity’s billing-read permissions and Google connectivity before retrying. No billing settings were changed.');
  }
  if (info.projectId !== project || info.billingEnabled !== true || !info.billingAccountName) {
    throw new Error('Project billing is not confirmed active. Build stopped before resource creation or image upload. Review Google Cloud Billing; changing IAM AI roles will not resolve disabled billing.');
  }
  return { project, billingEnabled: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.info(JSON.stringify(verifyBilling(process.env.GOOGLE_CLOUD_PROJECT || 'elegant-racer-299721'))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
