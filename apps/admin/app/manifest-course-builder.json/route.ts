import { workspaceManifest } from '../workspace-manifest';

export function GET() {
  return workspaceManifest('course-builder');
}
