'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Clock, AlertTriangle, GraduationCap,
  BookOpen, Megaphone, Bell, FileText, Shield, Book, LifeBuoy,
  HelpCircle, ClipboardCheck, BarChart3, Settings, Menu, X,
  LogOut, CheckCircle, CalendarDays, Briefcase,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  section: string;
}

const PH = ['program_holder', 'admin', 'staff', 'org_admin'];
const PA = ['partner', 'admin', 'staff', 'org_admin'];

const NAV: NavItem[] = [
  { href: '/program-holder/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: PH, section: 'Overview' },
  { href: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: PA, section: 'Overview' },
  { href: '/program-holder/students', label: 'Students', icon: Users, roles: PH, section: 'Students' },
  { href: '/program-holder/students/pending', label: 'Pending', icon: Clock, roles: PH, section: 'Students' },
  { href: '/program-holder/students/at-risk', label: 'At-Risk', icon: AlertTriangle, roles: PH, section: 'Students' },
  { href: '/partner/students', label: 'My Students', icon: Users, roles: PA, section: 'Students' },
  { href: '/partner/attendance', label: 'Attendance', icon: CalendarDays, roles: PA, section: 'Training' },
  { href: '/partner/hours', label: 'Hours', icon: Clock, roles: PA, section: 'Training' },
  { href: '/partner/competencies', label: 'Competencies', icon: CheckCircle, roles: PA, section: 'Training' },
  { href: '/partner/programs', label: 'Programs', icon: Briefcase, roles: PA, section: 'Training' },
  { href: '/program-holder/grades', label: 'Grades', icon: GraduationCap, roles: PH, section: 'Training' },
  { href: '/program-holder/courses/create', label: 'Create Course', icon: BookOpen, roles: PH, section: 'Training' },
  { href: '/program-holder/documents', label: 'Documents', icon: FileText, roles: PH, section: 'Compliance' },
  { href: '/partner/documents', label: 'Documents', icon: FileText, roles: PA, section: 'Compliance' },
  { href: '/program-holder/verification', label: 'Verification', icon: Shield, roles: PH, section: 'Compliance' },
  { href: '/program-holder/compliance', label: 'Compliance', icon: ClipboardCheck, roles: PH, section: 'Compliance' },
  { href: '/program-holder/mou', label: 'MOU', icon: FileText, roles: PH, section: 'Compliance' },
  { href: '/program-holder/reports', label: 'Reports', icon: BarChart3, roles: PH, section: 'Reports' },
  { href: '/program-holder/campaigns', label: 'Campaigns', icon: Megaphone, roles: PH, section: 'Reports' },
  { href: '/program-holder/notifications', label: 'Notifications', icon: Bell, roles: PH, section: 'Settings' },
  { href: '/program-holder/how-to-use', label: 'How to Use', icon: HelpCircle, roles: PH, section: 'Settings' },
  { href: '/program-holder/documentation', label: 'Documentation', icon: Book, roles: PH, section: 'Settings' },
  { href: '/program-holder/support', label: 'Support', icon: LifeBuoy, roles: PH, section: 'Settings' },
  { href: '/program-holder/settings', label: 'Settings', icon: Settings, roles: PH, section: 'Settings' },
  { href: '/partner/settings', label: 'Settings', icon: Settings, roles: PA, section: 'Settings' },
];

const SECTIONS = ['Overview', 'Students', 'Training', 'Compliance', 'Reports', 'Settings'];

function PortalNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-4 px-2 py-3">
      {SECTIONS.map((section) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (!sectionItems.length) return null;
        return (
          <div key={section}>
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{section}</p>
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-blue-50 text-brand-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-brand-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function PartnerProgramHolderShell({
  children,
  role,
  userName,
  userEmail,
  orgName,
  hasSchoolApplications = false,
}: {
  children: React.ReactNode;
  role: string;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  hasSchoolApplications?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((item) => item.roles.includes(role));
  const allNav: NavItem[] = hasSchoolApplications
    ? [
        ...visibleNav,
        {
          href: '/program-holder/school-applications',
          label: 'School Applications',
          icon: FileText,
          roles: PH,
          section: 'Students',
        },
      ]
    : visibleNav;

  const isPartner = role === 'partner';
  const portalName = isPartner ? 'Host Site Portal' : 'Program Holder Portal';
  const homeHref = isPartner ? '/partner/dashboard' : '/program-holder/dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile navigation participates in normal document flow. Nothing is
          fixed over dashboard content, so pages cannot be hidden underneath it. */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={homeHref} className="text-sm font-bold text-brand-blue-700">{portalName}</Link>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-100 bg-white shadow-lg">
            <PortalNav items={allNav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid min-h-screen w-full lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Desktop sidebar is a real grid column, not a fixed overlay. */}
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
          <div className="sticky top-0 flex max-h-screen flex-col">
            <div className="border-b border-slate-100 px-4 py-4">
              <Link href={homeHref} className="block text-sm font-bold leading-tight text-brand-blue-700">
                {portalName}
              </Link>
              {orgName ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{orgName}</p> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PortalNav items={allNav} pathname={pathname} />
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="truncate text-xs font-medium text-slate-700">{userName}</p>
              <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
              <Link href="/api/auth/signout" className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700">
                <LogOut className="h-3 w-3" /> Sign out
              </Link>
            </div>
          </div>
        </aside>

        <main id="portal-main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
