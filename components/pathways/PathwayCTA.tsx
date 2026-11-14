import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveDashboardUrl, getRoleLabel } from '@/lib/routing/dashboard-resolver';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';

interface PathwayCTAProps {
  heading?: string;
  body?: string;
  secondary?: { label: string; href: string };
}

const UNAUTHENTICATED_PRIMARY = {
  label: 'Check Eligibility & Apply',
  href: '/start',
};

export default async function PathwayCTA({
  heading = 'Ready to Start?',
  body = 'The first step is checking your eligibility. It takes about 5 minutes online. If you qualify for funding, your entire training can be free.',
  secondary = { label: 'Talk to Someone First', href: '/contact' },
}: PathwayCTAProps) {
  let primary = UNAUTHENTICATED_PRIMARY;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_type')
        .eq('id', user.id)
        .maybeSingle();

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const secondaryRoles = (roleRows ?? [])
        .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
        .filter((role): role is string => typeof role === 'string');
      const effectiveRoles = Array.from(new Set([profile?.role, ...secondaryRoles].filter(Boolean))) as string[];

      if (profile?.role) {
        const isApprentice = effectiveRoles.some((role) =>
          ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(role),
        );
        const href = isApprentice
          ? await resolveStudentHomePath(supabase, user.id, profile.portal_type)
          : resolveDashboardUrl(profile.role, effectiveRoles);

        const roleLabel = isApprentice ? 'Apprentice' : getRoleLabel(profile.role);
        primary = {
          label: roleLabel === 'Student' || roleLabel === 'Learner'
            ? 'Go to My Dashboard'
            : `Go to ${roleLabel} Portal`,
          href,
        };
      }
    }
  } catch {
    // Public page — authentication is optional.
  }

  return (
    <section className="py-14 bg-brand-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">{heading}</h2>
        <p className="text-lg text-white mb-8 max-w-2xl mx-auto">{body}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primary.href}
            className="inline-flex items-center justify-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition"
          >
            {primary.label} <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex items-center justify-center bg-white text-slate-950 px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white hover:bg-slate-100"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
