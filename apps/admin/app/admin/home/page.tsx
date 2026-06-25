import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { 
  Users, BookOpen, Award, Settings, BarChart3, Shield, 
  FileText, Bell, CreditCard, Building2, GraduationCap,
  ChevronRight, CheckCircle2, Activity
} from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Admin Portal | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Manage your workforce development programs, students, and operations.',
};

interface NavCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const MAIN_NAV_CARDS: NavCard[] = [
  {
    title: 'Programs',
    description: 'Manage credential-bearing workforce programs, curriculum, and course content.',
    href: '/admin/programs',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'bg-brand-blue-600',
  },
  {
    title: 'Students',
    description: 'Track enrollment, progress, certifications, and learner outcomes.',
    href: '/admin/students',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-brand-green-600',
  },
  {
    title: 'Courses',
    description: 'Build and manage course curriculum, lessons, quizzes, and labs.',
    href: '/admin/courses',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-brand-purple-600',
  },
  {
    title: 'Credentials',
    description: 'Issue and verify certifications, badges, and credentials.',
    href: '/admin/certificates',
    icon: <Award className="w-6 h-6" />,
    color: 'bg-brand-orange-600',
  },
  {
    title: 'Reports',
    description: 'Analytics on enrollment, revenue, compliance, and program performance.',
    href: '/admin/reports',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'bg-brand-red-600',
  },
  {
    title: 'Partners',
    description: 'Manage employer partnerships, host shops, and program holders.',
    href: '/admin/partners',
    icon: <Building2 className="w-6 h-6" />,
    color: 'bg-teal-600',
  },
];

const QUICK_ACTIONS = [
  { label: 'Add New Student', href: '/admin/students/new', icon: <Users className="w-4 h-4" /> },
  { label: 'Create Program', href: '/admin/programs/new', icon: <GraduationCap className="w-4 h-4" /> },
  { label: 'Schedule Orientation', href: '/admin/operations', icon: <Activity className="w-4 h-4" /> },
  { label: 'View Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'System Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  { label: 'Compliance Reports', href: '/admin/compliance', icon: <Shield className="w-4 h-4" /> },
];

const FEATURES = [
  'WIOA & WRG Funding Management',
  'ETPL Compliance & Reporting',
  'EPA 608 Certification Tracking',
  'Enrollment & Attendance Tracking',
  'Credential Verification System',
  'Employer Partnership Portal',
];

export default async function AdminHomePage() {
  const auth = await requireRole(['admin', 'staff', 'admin']);
  const { profile } = auth;
  const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Admin';

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-72 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/admin-dashboard-hero.webp"
          alt="Admin Portal"
          fill
          className="object-cover object-center"
          priority
          placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/90 to-brand-blue-900/40" />
        <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
            {PLATFORM_DEFAULTS.orgName}
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            Admin Portal
          </h1>
          <p className="mt-3 text-slate-200 text-sm sm:text-base max-w-xl">
            Welcome back, {firstName}. Manage your workforce development programs, 
            track student progress, and oversee operations.
          </p>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-brand-blue-50 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Navigation Cards */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage Your Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MAIN_NAV_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-blue-200 transition-all duration-200"
            >
              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${card.color} text-white mb-4`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-blue-700 transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="px-6 pb-4">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue-600 group-hover:gap-2 transition-all">
                  Manage {card.title}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-green-400 shrink-0" />
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Navigation */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Additional Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
            { label: 'Compliance', href: '/admin/compliance', icon: <Shield className="w-5 h-5" /> },
            { label: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
            { label: 'Documents', href: '/admin/documents', icon: <FileText className="w-5 h-5" /> },
            { label: 'Billing', href: '/admin/billing', icon: <CreditCard className="w-5 h-5" /> },
            { label: 'Dev Studio', href: '/admin/studio', icon: <Activity className="w-5 h-5" /> },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-md transition-all text-center"
            >
              <div className="text-slate-600">{item.icon}</div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
