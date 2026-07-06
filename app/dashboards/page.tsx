import { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Users, GraduationCap, Building2, Shield, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboards | Elevate for Humanity',
  description: 'Access your personalized dashboard based on your role.',
};

const dashboards = [
  { title: 'Student Dashboard', href: '/student/dashboard', icon: GraduationCap, desc: 'Track your progress, courses, and assignments' },
  { title: 'Instructor Dashboard', href: '/instructor/dashboard', icon: Users, desc: 'Manage classes, students, and grades' },
  { title: 'Employer Dashboard', href: '/employer/dashboard', icon: Building2, desc: 'View apprentices, post jobs, manage partnerships' },
  { title: 'Apprentice Dashboard', href: '/apprentice/dashboard', icon: User, desc: 'Track hours, log work, view progress' },
  { title: 'Admin Dashboard', href: '/admin', icon: Shield, desc: 'Platform administration and analytics' },
];

export default function DashboardsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Select Your Dashboard</h1>
          <p className="text-blue-100">Choose the dashboard that matches your role.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dash) => (
              <Link key={dash.href} href={dash.href} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group">
                <dash.icon className="w-12 h-12 text-brand-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">{dash.title}</h2>
                <p className="text-slate-600 text-sm">{dash.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
