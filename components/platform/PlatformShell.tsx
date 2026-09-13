'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import type { ParisLearnerContext } from '@/components/paris/ParisFloatingWrapper';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown, LogOut, ShieldCheck, Users, Download, CalendarDays, Mail } from 'lucide-react';
import type {
  UserRole,
  NavSection,
  BreadcrumbItem,
  ActionItem,
} from '@/lib/navigation/navigation-config';
import { getNavigationForRole, ROLE_DISPLAY_NAMES } from '@/lib/navigation/navigation-config';

interface PlatformShellProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  role: UserRole;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
  notifications?: number;
  children: React.ReactNode;
  paris?: Partial<ParisLearnerContext> | false;
}

function isActiveHref(href: string, pathname: string): boolean {
  try {
    const url = new URL(href, 'https://local.invalid');
    return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
  } catch {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
}

export function PlatformShell({ user, role, actions = [], children, paris }: PlatformShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const baseSections = getNavigationForRole(role);
  const sections =
    role === 'program_holder'
      ? baseSections.map((section) => ({
          ...section,
          items: [
            ...section.items,
            {
              id: 'at-risk',
              label: 'At-Risk Students',
              href: '/program-holder/students/at-risk',
              icon: Users,
            },
            {
              id: 'onboarding',
              label: 'Onboarding',
              href: '/program-holder/onboarding',
              icon: ShieldCheck,
            },
            {
              id: 'agreement',
              label: 'MOU & Agreement',
              href: '/program-holder/rights-responsibilities',
              icon: ShieldCheck,
            },
            { id: 'meetings', label: 'Meetings', href: '/program-holder/meetings', icon: CalendarDays },
            { id: 'office-mail', label: 'Office Mail', href: '/program-holder/inbox', icon: Mail },
            { id: 'install-app', label: 'Install App', href: '/install', icon: Download },
          ],
        }))
      : baseSections;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const userInitials =
    user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user.full_name
        ? user.full_name
            .split(' ')
            .map((name) => name[0])
            .join('')
            .slice(0, 2)
        : 'U';

  const userName =
    user.full_name ||
    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'User');

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 lg:hidden"
              aria-label="Open portal navigation"
              aria-expanded={sidebarOpen}
              aria-controls="portal-navigation-drawer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-red-600 shadow-sm">
                <span className="text-sm font-black text-white">E</span>
              </div>
              <div className="hidden min-w-0 md:block">
                <span className="block truncate font-black text-slate-950">
                  {ROLE_DISPLAY_NAMES[role]}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3 shrink-0" /> Secure role-restricted session
                </span>
              </div>
            </Link>
          </div>

          <div className="mx-8 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search your portal..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium text-slate-950 transition-all placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions.length > 0 && (
              <div className="mr-4 hidden items-center gap-2 lg:flex">
                {actions.slice(0, 2).map((action) =>
                  action.href ? (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="h-4 w-4" />}
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onClick}
                      className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="h-4 w-4" />}
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            )}

            <div className="group relative">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
                aria-label="Open account menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-black text-white">
                  {userInitials}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 lg:block" />
              </button>

              <div className="invisible absolute right-0 z-[80] mt-2 w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white py-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="font-bold text-slate-950">{userName}</p>
                  <p className="truncate text-sm text-slate-600">{user.email}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Authenticated with Supabase
                  </p>
                </div>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left font-bold text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out securely
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close portal navigation"
          className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
            menuButtonRef.current?.focus();
          }}
        />
      )}

      <div className="flex min-w-0">
        <aside
          ref={drawerRef}
          id="portal-navigation-drawer"
          role={sidebarOpen ? 'dialog' : undefined}
          aria-modal={sidebarOpen ? true : undefined}
          aria-label={`${ROLE_DISPLAY_NAMES[role]} navigation`}
          className={`fixed inset-y-0 left-0 z-[70] block h-dvh w-[min(20rem,calc(100vw-2.5rem))] bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100dvh-4rem)] lg:w-64 lg:shrink-0 lg:translate-x-0 lg:visible lg:pointer-events-auto lg:shadow-none ${
            sidebarOpen
              ? 'translate-x-0 visible pointer-events-auto'
              : '-translate-x-full invisible pointer-events-none lg:visible lg:pointer-events-auto'
          }`}
        >
          <div className="flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)] lg:pt-0">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-800 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-xs font-black uppercase tracking-wider text-slate-300">
                  {ROLE_DISPLAY_NAMES[role]}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Use this menu to move through your workspace.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
                aria-label="Close portal navigation"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              aria-label={`${ROLE_DISPLAY_NAMES[role]} navigation links`}
            >
              {sections.map((section) => (
                <div key={section.id} className="mb-7n8Û‹h‘éì¶»§q«^t                  <p className="font-medium">{row.applicant_phone || 'No phone on file'}</p>
                    <div className="mt-1 flex gap-2">
                      {row.applicant_phone && (
                        <a className="font-bold text-blue-700" href={`tel:${row.applicant_phone}`}>
                          Call
                        </a>
                      )}
                      {row.applicant_email && (
                        <a
                          className="font-bold text-blue-700"
                          href={`mailto:${row.applicant_email}`}
                        >
                          Email
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US') : 'â€”'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Programs({ data }: { data: any }) {
  const label = data.programs[0]?.title || data.programs[0]?.name || 'Program Delivery';
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Delivery"
        title={label}
        description="Review approved program ownership, delivery readiness, credentials, and course assignments."
      />
      <ProgramCards programs={data.programs} courseAssignments={data.courseAssignments} />
    </div>
  );
}

function ProgramCards({
  programs,
  courseAssignments,
  compact = false,
}: {
  programs: any[];
  courseAssignments: any[];
  compact?: boolean;
}) {
  if (!programs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        No approved programs are connected yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {programs.map((program: any) => {
        const courses = courseAssignments.filter((item: any) => item.program_id === program.id);
        return (
          <article
            key={program.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className={`relative ${compact ? 'h-36' : 'h-48'} bg-slate-200`}>
              <Image
                src={getProgramCardImage(program.slug || program.id)}
                alt={`${program.title || program.name || 'Training program'} hands-on training`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className={compact ? 'p-5' : 'p-6'}>
              <BookOpen className="h-7 w-7 text-blue-700" />
              <h3 className="mt-3 text-2xl font-black">{program.title || program.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {program.slug} Â· {program.is_active ? 'Active' : program.status || 'Inactive'}
              </p>
              {!compact && (
                <>
                  <dl className="mt-5 space-y-3 text-sm">
                    <Row
                      label="Credential"
                      value={program.credential_name || 'Credential pathway'}
                    />
                    <Row
                      label="Program hours"
                      value={
                        program.total_hours ? String(program.total_hours) : 'Review program record'
                      }
                    />
                    <Row label="Course assignments" value={String(courses.length)} />
                  </dl>
                  {!courses.length && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                      This program is assigned, but no delivery course is connected yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
function Hours({
  rows,
  programs,
  enrollments,
}: {
  rows: any[];
  programs: any[];
  enrollments: any[];
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Training Operations"
        title="Training Hours"
        description="Record what each student completed daily or weekly, enter training hours, and submit progress for Admin review."
      />
      <ProgramHolderTrainingLogForm enrollments={enrollments} programs={programs} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Submitted training logs</h2>
        <p className="mt-1 text-sm text-slate-600">
          Admin can review every submitted entry. Entries remain read-only after submission.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Date</th>
                <th className="p-3">Student</th>
                <th className="p-3">Program</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Work completed</th>
                <th className="p-3">Approval</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="p-3">{row.work_date || 'â€”'}</td>
                    <td className="p-3 font-semibold">
                      {enrollments.find((item) => item.user_id === row.user_id)?.full_name ||
                        'Student'}
                    </td>
                    <td className="p-3">{programTitle(programs, null, row.program_slug)}</td>
                    <td className="p-3 font-bold">{row.hours_claimed ?? row.hours ?? 0}</td>
                    <td className="max-w-md p-3 text-slate-700">{row.notes || 'â€”'}</td>
                    <td className="p-3 capitalize">
                      {row.approval_status || row.status || 'pending'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No training logs have been submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Compliance({
  score,
  items,
  atRisk,
}: {
  score: number;
  items: { label: string; complete: boolean }[];
  atRisk: number;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Oversight"
        title="Compliance"
        description="Track the operational requirements that keep the assigned program ready for delivery, payment, and reporting."
      />
      <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-500">Compliance Score</p>
          <p className="mt-2 text-5xl font-black text-blue-700">{score}%</p>
          <p className="mt-3 text-sm text-slate-600">
            {atRisk} enrolled students currently flagged at risk.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Requirements</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <span className="font-semibold">{item.label}</span>
                {item.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function Documents({
  rows,
  isHvac,
  requiresEnchantedHeartsTerms,
}: {
  rows: any[];
  isHvac: boolean;
  requiresEnchantedHeartsTerms: boolean;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Compliance Records"
        title="Documents"
        description="Upload and track protected Program Holder onboarding records for program delivery and payment readiness."
      />
      <ProgramHolderDocumentUpload isHvac={isHvac} />
      <ProgramHolderAcknowledgements requiresEnchantedHeartsTerms={requiresEnchantedHeartsTerms} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Document register</h2>
        <div className="mt-4 space-y-3">
          {rows.length ? (
            rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border p-4">
                <FileText className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-bold">
                    {row.document_type || row.file_name || 'Program document'}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{row.status || 'submitted'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
              No Program Holder documents are on file. Use the protected upload above to submit
              onboarding records for review.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Reports({
  rows,
  enrolled,
  active,
  completed,
  programLabel,
}: {
  rows: any[];
  enrolled: number;
  active: number;
  completed: number;
  programLabel: string;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Outcomes & Reporting"
        title="Reports"
        description={`Enrollment and completion figures are generated from canonical ${programLabel} enrollment records.`}
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total Enrolled" value={enrolled} helper="Confirmed enrollments" />
        <Metric label="Currently Active" value={active} helper="In training" />
        <Metric label="Completed" value={completed} helper="Program completions" />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Submitted reports</h2>
        <p className="mt-2 text-sm text-slate-600">
          {rows.length
            ? `${rows.length} reports are on file.`
            : 'No submitted Program Holder reports are on file.'}
        </p>
      </section>
    </div>
  );
}
function Payouts({ schedules, panel }: { schedules: any[]; panel?: React.ReactNode }) {
  const pending = schedules.reduce(
    (sum, row) =>
      sum +
      (row.increment_1_status === 'paid' ? 0 : Number(row.increment_1_cents || 0)) +
      (row.increment_2_status === 'paid' ? 0 : Number(row.increment_2_cents || 0)),
    0,
  );
  const paid = schedules.reduce(
    (sum, row) =>
      sum +
      (row.increment_1_status === 'paid' ? Number(row.increment_1_cents || 0) : 0) +
      (row.increment_2_status === 'paid' ? Number(row.increment_2_cents || 0) : 0),
    0,
  );
  const usd = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Payments & Reconciliation"
        title="Payouts"
        description="Connect a secure payout destination, review scheduled funds, and access released balances. QuickBooks records approved payments separately for accounting."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Scheduled" value={usd(pending)} helper="Not yet marked paid" />
        <Metric label="Paid" value={usd(paid)} helper="Completed payout increments" />
        <Metric
          label="Payout schedules"
          value={schedules.length}
          helper="Enrollment-linked schedules"
        />
      </section>
      {panel}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Release schedule</h2>
        <p className="mt-2 text-sm text-slate-600">
          Funds become available only after Elevate receives and approves the corresponding funding
          payment. Connecting a card does not release unapproved funds.
        </p>
        {!schedules.length ? (
          <div className="mt-5 rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
            No funds have been loaded or scheduled yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {schedules.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-xl border border-slate-200 p-4 sm:grid-cols-3"
              >
                <span className="font-bold">{usd(Number(row.total_payout_cents || 0))}</span>
                <span className="text-sm capitalize">
                  First: {row.increment_1_status || 'pending'}
                </span>
                <span className="text-sm capitalize">
                  Second: {row.increment_2_status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function Settings({
  holder,
  profile,
  notificationPreferences,
  phone,
}: {
  holder: any;
  profile: any;
  notificationPreferences: any;
  phone: string;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Account Configuration"
        title="Settings"
        description="Review the Program Holder account and connected operational services."
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Organization</h2>
          <dl className="mt-4 space-y-3">
            <Row
              label="Name"
              value={holder?.organization_name || holder?.name || 'Program Holder'}
            />
            <Row label="Account status" value={holder?.status || 'Unknown'} />
            <Row
              label="Internal LMS"
              value={holder?.is_using_internal_lms ? 'Connected' : 'Not connected'}
            />
            <Row label="Payout setup" value={holder?.payout_status || 'Not started'} />
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">QuickBooks accounting</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Elevate manages QuickBooks centrally for authorized payout, expense, and revenue
            reconciliation. Program Holders do not need to connect a separate accounting account.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
            Managed by Elevate
          </span>
        </div>
      </section>
      <UniversalProfilePhotoEditor
        currentUrl={profile?.avatar_url}
        name={profile?.full_name || holder?.organization_name || holder?.name || 'Program Holder'}
      />
      <ProgramHolderNotificationPreferences initial={notificationPreferences} phone={phone} />
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-bold text-right">{value}</dd>
    </div>
  );
}
function AdminBoundary() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <ShieldCheck className="h-8 w-8 text-blue-700" />
      <h1 className="mt-4 text-3xl font-black">Program Holder administrator preview</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Select a Program Holder in Admin or use the audited support preview to inspect a
        holder-scoped workspace. No learner data is attached to the administrator session.
      </p>
      <Link
        href="https://admin.elevateforhumanity.org/program-holders"
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
      >
        Open Program Holder management
      </Link>
    </div>
  );
}
