/**
 * PathwayCTA — Role-based call-to-action section for pathway pages.
 *
 * Renders different primary buttons based on auth state:
 *   - Not logged in       → "Check Eligibility & Apply" → /start
 *   - student / learner   → "Go to My Dashboard" → /learner/dashboard
 *   - instructor          → "Go to Instructor Portal" → /instructor/dashboard
 *   - admin / admin / staff → "Go to Admin" → /admin/dashboard
 *   - employer            → "Go to Employer Portal" → /employer/dashboard
 *   - partner             → "Go to Partner Portal" → /partner/dashboard
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface PathwayCTAProps {
  heading?: string;
  body?: string;
  /** Override the secondary button label/href. Defaults to "Talk to Someone First" → /contact */
  secondary?: { label: string; href: string };
}

const ROLE_DESTINATIONS: Record<string, { label: string; href: string }> = {
  student: { label: 'Go to My Dashboard', href: '/learner/dashboard' },
  learner: { label: 'Go to My Dashboard', href: '/learner/dashboard' },
  instructor: { label: 'Go to Instructor Portal', href: '/admin/instructor/dashboard' },
  admin: { label: 'Go to Admin Dashboard', href: '/admin/dashboard' },
  admin: { label: 'Go to Admin Dashboard', href: '/admin/dashboard' },
  staff: { label: 'Go to Admin Dashboard', href: '/admin/dashboard' },
  org_admin: { label: 'Go to Admin Dashboard', href: '/admin/dashboard' },
  employer: { label: 'Go to Employer Portal', href: '/employer/dashboard' },
  partner: { label: 'Go to Partner Portal', href: '/partner/dashboard' },
  program_holder: { label: 'Go to Program Holder Dashboard', href: '/program-holder/dashboard' },
  case_manager: { label: 'Go to Staff Portal', href: '/admin/staff-portal/dashboard' },
};

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const dest = profile?.role ? ROLE_DESTINATIONS[profile.role] : undefined;
      if (dest) primary = dest;
    }
  } catch {
    // Public page — auth is optional. Fall through to unauthenticated CTA.
  }

  return (
    <section className="py-14 bg-brand-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{heading}</h2>
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
            className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-900 px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white/30"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
