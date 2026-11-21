import { workspaceManifest } from '@/lib/pwa/workspace-manifest';

export function GET() {
  return workspaceManifest('email');
}
