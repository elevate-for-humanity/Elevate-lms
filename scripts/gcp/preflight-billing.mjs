import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { verifyArtifactUpload } from './preflight-artifact-upload.mjs';

// Read-only project billing check. The CLI also tests/cancels an empty registry
// upload; neither path enables billing, changes accounts or prints payment data.
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
  try {
    const billing=verifyBilling(process.env.GOOGLE_CLOUD_PROJECT || 'elegant-racer-299721');
    const artifact=await verifyArtifactUpload();
    console.info(JSON.stringify({...billing,...artifact}));
  }
  catch (error) { console.error(JSON.stringify({error:error.message,...(error.safeDetails?{details:error.safeDetails}:{})})); process.exitCode = 1; }
}
