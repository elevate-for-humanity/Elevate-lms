import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import {
  BarChart3, Users, BookOpen, AlertTriangle,
  Settings, Brain, DollarSign, Shield,
  Briefcase, Megaphone, Wrench, ChevronRight,
} from 'lucide-react';
import { AdminGreeting } from '@/components/admin/AdminGreeting';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(cents / 100);
}
function fmtNum(n: number) { return new Intl.NumberFormat('en-US').format(n); }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


const NAV_SECTIONS = [
  { label: 'Operations', href: '/admin/dashboard',      icon: BarChart3,  description: 'Dashboard, analytics, monitoring',    color: 'bg-blue-50 text-blue-700' },
  { label: 'Students',   href: '/admin/students',       icon: Users,      description: 'Applications, enrollments, progress', color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Programs',   href: '/admin/programs',       icon: BookOpen,   description: 'Courses, curriculum, credentials',    color: 'bg-violet-50 text-violet-700' },
  { label: 'Build',      href: '/admin/course-builder', icon: Wrench,     description: 'Course builder, media, content',      color: 'bg-orange-50 text-orange-700' },
  { label: 'AI',         href: '/admin/ai-console',     icon: Brain,      description: 'AI studio, copilot, automation',      color: 'bg-pink-50 text-pink-700' },
  { label: 'Funding',    href: '/admin/funding',        icon: DollarSign, description: 'Grants, WIOA, payroll, WOTC',         color: 'bg-amber-50 text-amber-700' },
  { label: 'Partners',   href: '/admin/employers',      icon: Briefcase,  description: 'Employers, partners, providers',      color: 'bg-cyan-50 text-cyan-700' },
  { label: 'Marketing',  href: '/admin/marketing',      icon: Megaphone,  description: 'CRM, campaigns, blog, store',         color: 'bg-rose-50 text-rose-700' },
  { label: 'Compliance', href: '/admin/compliance',     icon: Shield,     description: 'Audit, documents, governance',        color: 'bg-slate-100 text-slate-700' },
  { label: 'System',     href: '/admin/settings',       icon: Settings,   description: 'Settings, users, integrations',       color: 'bg-indigo-50 text-indigo-700' },
];

export default async function AdminLandingPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();

  const firstName = data.profile?.full_name?.split(' ')[0] ?? 'Admin';
  const pendingApps = data.counts.pendingApplications;

  const stats = [
    { label: 'Applications waiting',  value: fmtNum(data.counts.pendingApplications),        href: '/admin/applications?status=submitted', urgent: data.counts.pendingApplications > 0 },
    { label: 'Active enrollments',    value: fmtNum(data.counts.activeEnrollments),           href: '/admin/enrollments',                   urgent: false },
    { label: 'Revenue this month',    value: fmtUsd(data.counts.revenueThisMonthCents),       href: '/admin/reporting',                     urgent: false },
    { label: 'Certificates issued',   value: fmtNum(data.counts.certificatesIssued),          href: '/admin/certificates',                  urgent: false },
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="relative w-full aspect-[21/6] sm:aspect-[21/5] overflow-hidden bg-white border-b border-gray-100">
        <Image
          src="/images/pages/admin-dashboard-hero.jpg"
          alt="Admin dashboard"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Greeting */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Admin Portal</p>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-none">
          <AdminGreeting name={firstName} />
        </h1>
        {pendingApps > 0 && (
          <Link
            href="/admin/applications?status=submitted"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {fmtNum(pendingApps)} application{pendingApps !== 1 ? 's' : ''} waiting for review
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Quick stats */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">At a glance</p>
        <div className="divide-y divide-slate-100">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center justify-between py-5 group hover:bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors"
            >
              <span className="text-base sm:text-lg font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {s.label}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-3xl sm:text-4xl font-black tabular-nums ${s.urgent ? 'text-amber-600' : 'text-slate-900'}`}>
                  {s.value}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick nav grid */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">All sections</p>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-8">Where do you want to go?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.label}
                href={section.href}
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{section.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{section.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pending applications */}
      {data.recentApplications.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Needs action</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Pending applications</h2>
            </div>
            <Link href="/admin/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentApplications.slice(0, 8).map((app) => (
              <Link
                key={app.id}
                href={app.href}
                className="flex items-center justify-between py-4 group hover:bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {app.full_name ?? `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim() || 'Unknown applicant'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{app.program_interest ?? 'No program specified'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.urgent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {app.age_days === 0 ? 'Today' : app.age_days === 1 ? '1 day ago' : `${app.age_days}d ago`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* At-risk learners */}
      {data.inactiveLearners.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Retention</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">At-risk learners</h2>
            </div>
            <Link href="/admin/at-risk" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.inactiveLearners.slice(0, 5).map((learner) => (
              <Link
                key={learner.enrollmentId}
                href={learner.href}
                className="flex items-center justify-between py-4 group hover:bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{learner.fullName ?? 'Unknown learner'}</p>
                  <p className="text-sm text-slate-500 truncate">{learner.email ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-slate-400">Enrolled {fmtDate(learner.enrolledAt)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent students */}
      {data.recentStudents.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">New this week</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Recent students</h2>
            </div>
            <Link href="/admin/students" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All students <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentStudents.slice(0, 8).map((student) => (
              <Link
                key={student.id}
                href={student.href}
                className="flex items-center justify-between py-4 group hover:bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{student.full_name ?? 'Unknown student'}</p>
                  <p className="text-sm text-slate-500 truncate">{student.program_name ?? student.email ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-slate-400">{fmtDate(student.created_at)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top programs */}
      {data.topPrograms.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Enrollment</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Top programs</h2>
            </div>
            <Link href="/admin/programs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All programs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.topPrograms.map((prog) => (
              <div key={prog.id} className="flex items-center justify-between py-4">
                <p className="font-semibold text-slate-900 truncate min-w-0 mr-4">{prog.name}</p>
                <div className="flex items-center gap-6 flex-shrink-0 text-sm">
                  <span className="text-slate-500">{fmtNum(prog.learners)} learners</span>
                  <span className="font-semibold text-slate-900">{prog.completionRate}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}
