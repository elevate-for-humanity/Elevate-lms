'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  apprenticeshipDocumentsPath,
  apprenticeshipLmsCoursePath,
  apprenticeshipOrientationPath,
  apprenticeshipRtiLabel,
} from '@/lib/portal/program-portal-paths';
import {
  BARBER_STUDENT_APP_HOME,
  BARBER_STUDENT_APP_SHORT_LABEL,
} from '@/lib/barber/student-app';

function isActive(pathname: string, href: string, tabId: string): boolean {
  if (tabId === 'dashboard') return pathname === '/apprentice';
  if (tabId === 'course') return pathname.startsWith('/lms/courses/');
  if (tabId === 'orientation') return pathname.startsWith('/apprentice/orientation');
  if (tabId === 'documents') return pathname.includes('/documents');
  if (tabId === 'mobile-app') return pathname.startsWith('/pwa/barber');
  const baseHref = href.split('?')[0];
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

export function ApprenticeSubNav({
  programSlug,
  portalPath,
}: {
  programSlug: string;
  portalPath: string;
}) {
  const pathname = usePathname() ?? '';
  const lmsCourseHref = apprenticeshipLmsCoursePath(programSlug);
  const documentsHref = apprenticeshipDocumentsPath(programSlug);
  const orientationHref = apprenticeshipOrientationPath(programSlug);
  const rtiCourseLabelShort = apprenticeshipRtiLabel(programSlug, true) ?? 'Online Course';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: portalPath },
    { id: 'orientation', label: 'Orientation', href: orientationHref },
    ...(lmsCourseHref ? [{ id: 'course', label: rtiCourseLabelShort, href: lmsCourseHref }] : []),
    { id: 'hours', label: 'Hours', href: '/apprentice/hours' },
    { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock' },
    { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies' },
    { id: 'documents', label: 'Documents', href: documentsHref },
    { id: 'billing', label: 'Billing', href: '/apprentice/billing' },
    { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook' },
    ...(programSlug === 'barber-apprenticeship'
      ? [{ id: 'mobile-app', label: BARBER_STUDENT_APP_SHORT_LABEL, href: BARBER_STUDENT_APP_HOME }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href, tab.id);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
