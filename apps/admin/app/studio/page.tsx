// Admin-owned AI operating surface. Studio capabilities run through one stateful, conversation-first tool orchestrator.
import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import {
  getAvailableWorkspaces,
  type StudioWorkspaceId,
} from '@/lib/devstudio/workspace-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  await requireRole(['super_admin', 'admin']);
  const requestedWorkspace = (await searchParams).workspace;
  const availableWorkspaces = getAvailableWorkspaces();
  const initialWorkspace = availableWorkspaces.some(
    (workspace) => workspace.id === requestedWorkspace,
  )
    ? (requestedWorkspace as StudioWorkspaceId)
    : undefined;

  const workspaces = availableWorkspaces.map(
    ({ id, label, description, route, healthEndpoint }) => ({
      id,
      label,
      description,
      route,
      healthEndpoint,
    }),
  );

  return (
    <main className="h-[100dvh] w-full min-w-0 overflow-hidden bg-white text-gray-950">
      <div className="flex h-full w-full min-w-0 flex-col">
        <section className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          <span className="sr-only">
            Advanced capability surfaces are available through the unified command workspace.
          </span>
          <div id="admin-ai-workspace" className="h-full min-h-0 min-w-0">
            <StudioCommandWorkspace
              workspaces={workspaces.map(({ id, label, route }) => ({ id, label, route }))}
              initialWorkspace={initialWorkspace}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
