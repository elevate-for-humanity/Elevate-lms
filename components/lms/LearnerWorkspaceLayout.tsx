import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import { createClient } from '@/lib/supabase/server';

export default async function LearnerWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(['student', 'learner', 'admin', 'staff']);
  const supabase = await createClient();
  const { data: photoProfile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: photoProfile?.avatar_url || undefined,
      }}
      role="student"
    >
      {children}
      <ParisFloatingWrapper surface="learner" />
    </PlatformShell>
  );
}
