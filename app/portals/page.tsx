import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Shield,
  Handshake,
  Briefcase,
  Users,
  Building2,
  Crown,
  ClipboardList,
  UserCheck,
  Home,
  Palette,
  Scissors,
  HeartPulse,
  Wrench,
  Heart,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portals | Elevate for Humanity',
  description: 'Access your personalized portal based on your role.',
};

const portals = [
  {
    title: 'Student Portal',
    href: '/lms/dashboard',
    icon: GraduationCap,
    desc: 'Access courses, assignments, grades, and certificates',
    color: 'bg-brand-blue-600',
  },
  {
    title: 'Admin Portal',
    href: '/admin',
    icon: Shield,
    desc: 'Platform administration and management',
    color: 'bg-slate-700',
  },
  {
    title: 'Partner Portal',
    href: '/partner/dashboard',
    icon: Handshake,
    desc: 'Manage partnerships, programs, and host shops',
    color: 'bg-purple-600',
  },
  {
    title: 'Staff Portal',
    href: '/admin/staff-portal/dashboard',
    icon: Users,
    desc: 'Student management and enrollment support',
    color: 'bg-emerald-600',
  },
  {
    title: 'Employer Portal',
    href: '/employer/dashboard',
    icon: Briefcase,
    desc: 'Post jobs, manage apprentices, view partnerships',
    color: 'bg-amber-600',
  },
  {
    title: 'Instructor Portal',
    href: '/admin/instructor/dashboard',
    icon: Crown,
    desc: 'Class management, student progress, and grades',
    color: 'bg-rose-600',
  },
  {
    title: 'Host Shop Portal',
    href: '/host-shop/dashboard',
    icon: Scissors,
    desc: 'Track apprentices, OJT hours, and competencies',
    color: 'bg-teal-600',
  },
  {
    title: 'Apprentice Portal',
    href: '/apprentice',
    icon: UserCheck,
    desc: 'Track hours, competencies, and training progress',
    color: 'bg-orange-600',
  },
  {
    title: 'Workforce Board',
    href: '/workforce-board/dashboard',
    icon: Building2,
    desc: 'Career services, job matching, and placement',
    color: 'bg-indigo-600',
  },
  {
    title: 'Program Holder Portal',
    href: '/partner/dashboard',
    icon: ClipboardList,
    desc: 'Program management and compliance',
    color: 'bg-cyan-600',
  },
  {
    title: 'Parent Portal',
    href: '/parent-portal/dashboard',
    icon: Heart,
    desc: 'Track student progress and communications',
    color: 'bg-pink-600',
  },
  {
    title: 'Mentor Portal',
    href: '/mentor/dashboard',
    icon: HeartPulse,
    desc: 'Mentorship programs and mentee tracking',
    color: 'bg-violet-600',
  },
  {
    title: 'Case Manager Portal',
    href: '/case-manager/dashboard',
    icon: ClipboardList,
    desc: 'Client case management and referrals',
    color: 'bg-sky-600',
  },
  {
    title: 'Provider Portal',
    href: '/provider/dashboard',
    icon: Building2,
    desc: 'Training provider management',
    color: 'bg-lime-600',
  },
  {
    title: 'Workforce Portal',
    href: '/workforce/dashboard',
    icon: Wrench,
    desc: 'Workforce development and job training',
    color: 'bg-gray-600',
  },
  {
    title: 'Cosmetology Host Shop',
    href: '/cosmetology-host-shop/dashboard',
    icon: Palette,
    desc: 'Cosmetology apprenticeship management',
    color: 'bg-fuchsia-600',
  },
];

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Access Your Portal</h1>
          <p className="text-blue-200 text-lg">Select the portal that matches your role.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.href}
                  href={portal.href}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl ${portal.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">
                    {portal.title}
                  </h2>
                  <p className="text-sm text-slate-500">{portal.desc}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Need access to a portal?</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

