'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Scissors, Users, Briefcase, LayoutDashboard,
  ChevronRight, Menu, X, Clock, Award, TrendingUp,
  AlertCircle, CheckCircle, GraduationCap, Building2,
  DollarSign, FileText, Settings, Bell,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  email: string;
  avatar_url?: string;
  enrollment_status?: string;
  onboarding_completed?: boolean;
}

interface Props {
  profile: Profile | null;
  role: string;
  tabs: string[];
  defaultTab: string;
  educationData: any;
  tradesData: any;
  workforceData: any;
  businessData: any;
  adminData: any;
}

// ── Tab config ───────────────────────────────────────────────────────────────

const TAB_META: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  admin:      { label: 'Admin',      icon: <LayoutDashboard className="w-4 h-4" />, color: 'bg-red-600',    description: 'Site-wide metrics and management' },
  education:  { label: 'Education',  icon: <BookOpen className="w-4 h-4" />,        color: 'bg-blue-600',   description: 'Courses, progress, and learning' },
  trades:     { label: 'Trades',     icon: <Scissors className="w-4 h-4" />,        color: 'bg-purple-600', description: 'Apprenticeship hours and shop management' },
  workforce:  { label: 'Workforce',  icon: <Users className="w-4 h-4" />,           color: 'bg-green-600',  description: 'Applications, enrollments, and placements' },
  business:   { label: 'Business',   icon: <Briefcase className="w-4 h-4" />,       color: 'bg-amber-600',  description: 'Programs, providers, and employers' },
};

// ── Deep-link shortcuts per tab ──────────────────────────────────────────────

const TAB_LINKS: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: 'Review Queue',        href: '/admin/review-queue' },
    { label: 'All Applications',    href: '/admin/applications' },
    { label: 'Students',            href: '/admin/students' },
    { label: 'Enrollments',         href: '/admin/enrollments' },
    { label: 'Signatures',          href: '/admin/signatures' },
    { label: 'Performance',         href: '/admin/performance-dashboard' },
    { label: 'ETPL Tracking',       href: '/admin/dashboard/etpl' },
    { label: 'Curriculum Builder',  href: '/admin/curriculum' },
  ],
  education: [
    { label: 'My Courses',          href: '/lms/courses' },
    { label: 'Learner Dashboard',   href: '/learner/dashboard' },
    { label: 'Instructor Portal',   href: '/instructor/dashboard' },
    { label: 'Mentor Portal',       href: '/mentor/dashboard' },
    { label: 'Creator Studio',      href: '/creator/dashboard' },
    { label: 'Schedule',            href: '/schedule/select' },
  ],
  trades: [
    { label: 'Barber App',          href: '/pwa/barber' },
    { label: 'Cosmetology App',     href: '/pwa/cosmetology' },
    { label: 'Esthetician App',     href: '/pwa/esthetician' },
    { label: 'Nail Tech App',       href: '/pwa/nail-tech' },
    { label: 'Partner Shop Portal', href: '/partner/dashboard' },
    { label: 'Log Hours',           href: '/pwa/barber/log-hours' },
  ],
  workforce: [
    { label: 'Case Manager Portal', href: '/case-manager/dashboard' },
    { label: 'Staff Portal',        href: '/staff-portal/dashboard' },
    { label: 'Workforce Board',     href: '/workforce-board/dashboard' },
    { label: 'Employer Portal',     href: '/employer/dashboard' },
    { label: 'WorkOne Appointment', href: 'https://www.indianacareerconnect.com', },
    { label: 'FSSA Benefits',       href: 'https://www.in.gov/fssa/dfr/' },
  ],
  business: [
    { label: 'Program Holder Portal', href: '/program-holder/dashboard' },
    { label: 'Program Handbook',      href: '/program-holder/handbook' },
    { label: 'Training Provider',     href: '/provider/dashboard' },
    { label: 'Employer Portal',       href: '/employer/dashboard' },
    { label: 'All Programs',          href: '/lms/programs' },
    { label: 'Compliance',            href: '/partners/compliance' },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function Stat({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`${color} text-white rounded-lg p-2 flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {href && <Link href={href} className="text-xs text-blue-600 hover:underline flex items-center gap-1">{linkLabel ?? 'View all'} <ChevronRight className="w-3 h-3" /></Link>}
    </div>
  );
}

// ── Tab panels ───────────────────────────────────────────────────────────────

function AdminPanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Users"        value={data.totalUsers}        icon={<Users className="w-4 h-4" />}        color="bg-slate-700" />
        <Stat label="Pending Apps"       value={data.pendingApps}       icon={<AlertCircle className="w-4 h-4" />}  color="bg-amber-500" />
        <Stat label="Active Enrollments" value={data.activeEnrollments} icon={<BookOpen className="w-4 h-4" />}     color="bg-blue-600" />
        <Stat label="Certificates"       value={data.certificates}      icon={<Award className="w-4 h-4" />}        color="bg-green-600" />
      </div>
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TAB_LINKS.admin.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between">
              {l.label} <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EducationPanel({ data, role }: { data: any; role: string }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Enrolled Programs"   value={data.enrollments.length}  icon={<GraduationCap className="w-4 h-4" />} color="bg-blue-600" />
        <Stat label="Lessons Completed"   value={data.completedLessons}    icon={<CheckCircle className="w-4 h-4" />}   color="bg-green-600" />
        {data.taughtCourses.length > 0 &&
          <Stat label="Courses Teaching"  value={data.taughtCourses.length} icon={<BookOpen className="w-4 h-4" />}     color="bg-purple-600" />}
      </div>

      {data.enrollments.length > 0 && (
        <div>
          <SectionHeader title="My Programs" href="/lms/courses" />
          <div className="space-y-2">
            {data.enrollments.map((e: any) => (
              <Link key={e.id} href={e.programs?.slug ? `/lms/courses/${e.id}` : '/lms/courses'}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{e.programs?.title ?? 'Program'}</p>
                  <p className="text-xs text-slate-500">{e.progress_percent ?? 0}% complete · {e.status}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.taughtCourses.length > 0 && (
        <div>
          <SectionHeader title="Courses I Teach" href="/instructor/dashboard" />
          <div className="space-y-2">
            {data.taughtCourses.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{c.course_name}</p>
                <span className="text-xs text-slate-500">{c.enrolled_count ?? 0} enrolled</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Quick Links" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TAB_LINKS.education.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between">
              {l.label} <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradesPanel({ data }: { data: any }) {
  if (!data) return null;
  const DISCIPLINE_LABELS: Record<string, string> = {
    'barber-apprenticeship': 'Barber (2,000 hrs)',
    cosmetology:             'Cosmetology (1,500 hrs)',
    'nail-tech':             'Nail Tech (450 hrs)',
    esthetician:             'Esthetician (700 hrs)',
  };
  const disciplines = Object.keys(data.byDiscipline);
  return (
    <div className="space-y-6">
      {disciplines.length > 0 && (
        <div>
          <SectionHeader title="Apprenticeship Hours" />
          <div className="space-y-3">
            {disciplines.map(d => {
              const logged = data.byDiscipline[d] ?? 0;
              const target = data.targets[d] ?? 2000;
              const pct = Math.min(100, Math.round((logged / target) * 100));
              return (
                <div key={d} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800">{DISCIPLINE_LABELS[d] ?? d}</p>
                    <p className="text-sm font-bold text-slate-900">{logged.toLocaleString()} / {target.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.partner && (
        <div>
          <SectionHeader title="Partner Shop" href="/partner/dashboard" />
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">Type: {data.partner.partners?.partner_type ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              {data.partner.partners?.mou_signed
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <span className="text-sm text-slate-700">MOU {data.partner.partners?.mou_signed ? 'Signed' : 'Pending'}</span>
            </div>
            <div className="flex items-center gap-2">
              {data.partner.partners?.onboarding_completed
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <span className="text-sm text-slate-700">Onboarding {data.partner.partners?.onboarding_completed ? 'Complete' : 'Incomplete'}</span>
            </div>
          </div>
        </div>
      )}

      {data.pendingHours.length > 0 && (
        <div>
          <SectionHeader title="Pending Hour Approvals" href="/partner/dashboard" />
          <div className="space-y-2">
            {data.pendingHours.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {h.profiles?.first_name} {h.profiles?.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{h.discipline} · {h.hours} hrs</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Quick Links" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TAB_LINKS.trades.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between">
              {l.label} <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkforcePanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pending Apps"       value={data.pendingApps.length}  icon={<FileText className="w-4 h-4" />}    color="bg-amber-500" />
        <Stat label="Active Enrollments" value={data.activeEnrollments}   icon={<Users className="w-4 h-4" />}       color="bg-blue-600" />
        <Stat label="Completions"        value={data.completions}         icon={<Award className="w-4 h-4" />}        color="bg-green-600" />
      </div>

      {data.pendingApps.length > 0 && (
        <div>
          <SectionHeader title="Applications Needing Review" href="/admin/review-queue" linkLabel="Review all" />
          <div className="space-y-2">
            {data.pendingApps.slice(0, 6).map((a: any) => (
              <Link key={a.id} href={`/admin/applications/${a.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-slate-500">{a.program_interest} · {a.status}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Funding Resources" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
            className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 font-medium hover:bg-green-100 flex items-center justify-between">
            WorkOne / WIOA Appointment <ChevronRight className="w-3 h-3" />
          </a>
          <a href="https://www.in.gov/fssa/dfr/" target="_blank" rel="noopener noreferrer"
            className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 font-medium hover:bg-blue-100 flex items-center justify-between">
            FSSA / SNAP & TANF Benefits <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div>
        <SectionHeader title="Quick Links" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TAB_LINKS.workforce.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between">
              {l.label} <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessPanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Programs"           value={data.programs.length}     icon={<BookOpen className="w-4 h-4" />}    color="bg-amber-600" />
        <Stat label="Active Enrollments" value={data.activeEnrollments}   icon={<Users className="w-4 h-4" />}       color="bg-blue-600" />
        <Stat label="Certificates"       value={data.certificates}        icon={<Award className="w-4 h-4" />}        color="bg-green-600" />
      </div>

      {data.programs.length > 0 && (
        <div>
          <SectionHeader title="Programs" href="/lms/programs" />
          <div className="space-y-2">
            {data.programs.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{p.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Quick Links" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TAB_LINKS.business.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between">
              {l.label} <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MyDashboard({ profile, role, tabs, defaultTab, educationData, tradesData, workforceData, businessData, adminData }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [menuOpen, setMenuOpen] = useState(false);

  const name = profile?.full_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Welcome';
  const activeMeta = TAB_META[activeTab];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${activeMeta.color} text-white rounded-lg p-1.5`}>{activeMeta.icon}</div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">{name}</p>
              <p className="text-xs text-slate-500 capitalize">{role.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="p-2 text-slate-500 hover:text-slate-900">
              <Bell className="w-5 h-5" />
            </Link>
            <Link href="/account" className="p-2 text-slate-500 hover:text-slate-900">
              <Settings className="w-5 h-5" />
            </Link>
            {/* Hamburger — shows all portals */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-500 hover:text-slate-900 lg:hidden">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hamburger dropdown */}
        {menuOpen && (
          <div className="absolute top-14 right-0 left-0 bg-white border-b border-slate-200 shadow-lg z-50 lg:hidden">
            <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Admin Dashboard',       href: '/admin/dashboard',           roles: ['admin','super_admin','org_admin','staff'] },
                { label: 'Learner Dashboard',      href: '/learner/dashboard',         roles: ['student','admin','super_admin'] },
                { label: 'LMS Courses',            href: '/lms/courses',               roles: ['student','instructor','admin','super_admin'] },
                { label: 'Instructor Portal',      href: '/instructor/dashboard',      roles: ['instructor','admin','super_admin'] },
                { label: 'Mentor Portal',          href: '/mentor/dashboard',          roles: ['mentor','admin','super_admin'] },
                { label: 'Program Holder',         href: '/program-holder/dashboard',  roles: ['program_holder','delegate','admin','super_admin'] },
                { label: 'Training Provider',      href: '/provider/dashboard',        roles: ['provider_admin','admin','super_admin'] },
                { label: 'Partner Shop',           href: '/partner/dashboard',         roles: ['partner','admin','super_admin'] },
                { label: 'Employer Portal',        href: '/employer/dashboard',        roles: ['employer','admin','super_admin'] },
                { label: 'Staff Portal',           href: '/staff-portal/dashboard',    roles: ['staff','admin','super_admin'] },
                { label: 'Case Manager',           href: '/case-manager/dashboard',    roles: ['case_manager','admin','super_admin'] },
                { label: 'Workforce Board',        href: '/workforce-board/dashboard', roles: ['workforce_board','admin','super_admin'] },
                { label: 'Barber App',             href: '/pwa/barber',                roles: ['student','partner','admin','super_admin'] },
                { label: 'Cosmetology App',        href: '/pwa/cosmetology',           roles: ['student','partner','admin','super_admin'] },
              ].filter(item => item.roles.includes(role) || ['admin','super_admin'].includes(role))
               .map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  {item.label} <ChevronRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Industry tab selector */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Select Industry</p>
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const meta = TAB_META[tab];
              const isActive = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? `${meta.color} text-white shadow-sm`
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {meta.icon}
                  {meta.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">{activeMeta.description}</p>
        </div>

        {/* Tab content */}
        {activeTab === 'admin'     && <AdminPanel     data={adminData} />}
        {activeTab === 'education' && <EducationPanel data={educationData} role={role} />}
        {activeTab === 'trades'    && <TradesPanel    data={tradesData} />}
        {activeTab === 'workforce' && <WorkforcePanel data={workforceData} />}
        {activeTab === 'business'  && <BusinessPanel  data={businessData} />}
      </div>
    </div>
  );
}
