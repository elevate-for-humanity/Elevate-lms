import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Learner Portal',
  description: 'Access your courses, track progress, and manage your career training journey.',
  robots: { index: false, follow: false },
};

const navItems = [
  { href: '/learner/dashboard',          label: 'Dashboard' },
  { href: '/lms/courses',                label: 'My Programs' },
  { href: '/lms/programs',               label: 'Programs' },
  { href: '/lms/certificates',           label: 'Certificates' },
  { href: '/lms/assignments',            label: 'Assignments' },
  { href: '/lms/grades',                 label: 'Grades' },
  { href: '/lms/calendar',               label: 'Schedule' },
  { href: '/lms/notifications',          label: 'Notifications' },
  { href: '/lms/support',                label: 'Support' },
];

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/learner/dashboard" className="text-base font-extrabold text-slate-900 shrink-0 tracking-tight">
                Learner Portal
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-semibold text-slate-800 hover:text-brand-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-brand-blue-600 shrink-0"
            >
              ← My Dashboard
            </Link>
          </div>
        </div>

        {/* Mobile nav — horizontally scrollable */}
        <div className="md:hidden border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-800 hover:text-brand-blue-700 whitespace-nowrap px-3 py-1.5 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
