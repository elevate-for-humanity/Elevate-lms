import { workspaceManifest } from '../workspace-manifest';

export function GET() {
  return workspaceManifest('email');
}
