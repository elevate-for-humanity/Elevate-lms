import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

/**
 * Employer layout gate.
 *
 * Checks onboarding status before granting portal access.
 * Employers must complete all onboarding steps (MOU, insurance, verification)
 * before accessing dashboard, hours, placements, etc.
 *
 * Allowed without full onboarding: /employer (landing), /employer/verification,
 * /employer/documents/upload (needed during onboarding).
 */

// Routes accessible during onboarding (before full activation)
const ONBOARDING_ALLOWED = [
  '/employer/verification',
  '/employer/documents',
  '/employer/documents/upload',
  '/employer/settings',
];

// Sub-routes that require an authenticated employer account
const PORTAL_ROUTES = [
  '/employer/dashboard',
  '/employer/candidates',
  '/employer/jobs',
  '/employer/placements',
  '/employer/hours',
  '/employer/reports',
  '/employer/analytics',
  '/employer/apprenticeships',
  '/employer/opportunities',
  '/employer/shop',
  '/employer/settings',
  '/employer/compliance',
  '/employer/post-job',
  '/employer/verification',
  '/employer/documents',
];

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Public marketing page — no auth required
  if (!user) {
    return <>{children}</>;
  }

  const _admin = await getAdminClient();
  const db = _admin;
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: profile } = await db
    .from('profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single();

  // Non-employer logged-in users can still see the public page
  if (!profile || profile.role !== 'employer') {
    return <>{children}</>;
  }

  // Check onboarding status
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('status')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isActive = onboarding?.status === 'active';
  const isApprovedOnboarding = onboarding?.status === 'approved';

  const navLinks = [
    { href: '/employer/dashboard',       label: 'Dashboard' },
    { href: '/employer/candidates',      label: 'Candidates' },
    { href: '/employer/jobs',            label: 'Jobs' },
    { href: '/employer/post-job',        label: 'Post a Job' },
    { href: '/employer/apprenticeships', label: 'Apprenticeships' },
    { href: '/employer/placements',      label: 'Placements' },
    { href: '/employer/hours',           label: 'Hours' },
    { href: '/employer/shop',            label: 'Shop' },
    { href: '/employer/compliance',      label: 'Compliance' },
    { href: '/employer/analytics',       label: 'Analytics' },
    { href: '/employer/reports',         label: 'Reports' },
    { href: '/employer/settings',        label: 'Settings' },
  ];

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-6 h-14 overflow-x-auto">
          <a href="/employer/dashboard" className="font-black text-brand-blue-700 whitespace-nowrap shrink-0">Employer Portal</a>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-brand-blue-700 whitespace-nowrap transition-colors">{l.label}</a>
          ))}
          <a href="/api/auth/signout" className="ml-auto text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap shrink-0">Sign out</a>
        </div>
      </nav>
      <main>{content}</main>
    </div>
  );

  // If employer is fully active, allow everything
  if (isActive) return shell(children);

  // If approved but still onboarding
  if (isApprovedOnboarding) return shell(children);

  // No onboarding row = application pending admin review
  if (!onboarding) return <>{children}</>;

  // Has an onboarding row but not active/approved → redirect to onboarding
  redirect('/onboarding/employer');
}
