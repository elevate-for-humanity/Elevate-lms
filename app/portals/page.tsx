import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Handshake,
  Users,
  Briefcase,
  UserCircle,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/portals',
  },
  title: 'Portals | Elevate For Humanity',
  description:
    'Access your personalized portal. Whether you are a student, employer, partner, parent, staff member, or client, find your dedicated dashboard here.',
  keywords: [
    'student portal',
    'employer portal',
    'partner portal',
    'parent portal',
    'staff portal',
    'client portal',
    'dashboard',
    'login',
  ],
};

const portals = [
  {
    icon: GraduationCap,
    title: 'Student Portal',
    description:
      'Access your courses, track progress, view grades, manage your schedule, and connect with instructors and career services.',
    href: '/student-portal',
    color: 'blue',
    features: ['Course Materials', 'Grade Tracking', 'Career Services', 'Schedule Management'],
  },
  {
    icon: Building2,
    title: 'Employer Portal',
    description:
      'Manage your apprentices, track their training progress, access compliance documents, and connect with program coordinators.',
    href: '/employer-portal',
    color: 'green',
    features: ['Apprentice Management', 'Training Progress', 'Compliance Documents', 'Hiring Tools'],
  },
  {
    icon: Handshake,
    title: 'Partner Portal',
    description:
      'Collaborate on programs, access partnership resources, track referrals, and manage your organization\'s involvement with Elevate.',
    href: '/partner-portal',
    color: 'purple',
    features: ['Program Collaboration', 'Referral Tracking', 'Resource Library', 'Impact Reports'],
  },
  {
    icon: Users,
    title: 'Parent Portal',
    description:
      'Monitor your student\'s progress, view attendance records, communicate with instructors, and stay informed about program updates.',
    href: '/parent-portal',
    color: 'orange',
    features: ['Progress Monitoring', 'Attendance Records', 'Instructor Communication', 'Program Updates'],
  },
  {
    icon: Briefcase,
    title: 'Staff Portal',
    description:
      'Access administrative tools, manage students and courses, track attendance, run reports, and coordinate program operations.',
    href: '/staff-portal',
    color: 'teal',
    features: ['Student Management', 'Attendance Tracking', 'Reports & Analytics', 'Course Administration'],
  },
  {
    icon: UserCircle,
    title: 'Client Portal',
    description:
      'Manage your account, view services, access project deliverables, and communicate with your dedicated Elevate team.',
    href: '/client-portal',
    color: 'indigo',
    features: ['Account Management', 'Service Overview', 'Project Deliverables', 'Team Communication'],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
  purple: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
};

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Portals' },
        ]}
      />
      {/* Hero Section */}
      <section className="bg-slate-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Access Your Portal</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Choose your portal below to access your personalized dashboard, resources, and tools.
            Each portal is designed to support your specific role in the Elevate community.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Secure Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>24/7 Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span>Real-Time Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portals.map((portal) => {
              const colors = colorClasses[portal.color];
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.title}
                  href={portal.href}
                  className={`group bg-white rounded-2xl p-6 shadow-sm border ${colors.border} hover:shadow-lg hover:border-transparent transition-all duration-300`}
                >
                  <div className={`w-14 h-14 ${colors.light} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700">
                    {portal.title}
                  </h2>
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed">{portal.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {portal.features.map((feature) => (
                      <span
                        key={feature}
                        className={`text-xs px-2 py-1 ${colors.light} ${colors.text} rounded-full`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className={`flex items-center gap-2 ${colors.text} font-semibold text-sm`}>
                    <span>Access Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need Help Accessing Your Portal?</h2>
          <p className="text-lg text-slate-600 mb-8">
            If you're having trouble logging in or need assistance finding the right portal,
            our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access for Returning Users */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Returning User?</h2>
            <p className="text-slate-400">Sign in directly to your portal dashboard</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/login?redirect=/student-portal/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <GraduationCap className="w-6 h-6 text-blue-400" />
              <span className="font-semibold">Student Sign In</span>
            </Link>
            <Link
              href="/login?redirect=/employer-portal/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Building2 className="w-6 h-6 text-green-400" />
              <span className="font-semibold">Employer Sign In</span>
            </Link>
            <Link
              href="/login?redirect=/staff-portal/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Briefcase className="w-6 h-6 text-teal-400" />
              <span className="font-semibold">Staff Sign In</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
