import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { getAvailableWorkspaces } from '@/lib/devstudio/workspace-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function TasksPage() {
  await requireRole(['super_admin', 'admin']);
  const workspaces = getAvailableWorkspaces().map(({ id, label, route }) => ({
    id,
    label,
    route,
  }));

  return (
    <main className="h-full w-full min-w-0 overflow-hidden bg-white text-gray-950">
      <section className="h-full min-h-0 min-w-0 overflow-hidden bg-white">
        <StudioCommandWorkspace workspaces={workspaces} initialWorkspace="tasks" />
      </section>
    </main>
  );
}
