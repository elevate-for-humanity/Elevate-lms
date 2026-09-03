/**
 * Role-specific Dashboard Component
 * Displays different content based on user role
 */

import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';

interface RoleDashboardProps {
  role: 'board' | 'delegate' | 'instructor' | 'partner' | 'staff' | 'admin';
  userName?: string;
}

const roleConfig = {
  board: {
    title: 'Workforce Board Dashboard',
    description: 'Monitor workforce development metrics and program outcomes',
    primaryAction: { label: 'View Reports', href: '/board/reports' },
    secondaryAction: { label: 'Manage Programs', href: '/board/programs' },
    stats: [
      { label: 'Active Students', value: '—' },
      { label: 'Career Services', value: '—' },
      { label: 'Programs', value: '—' },
      { label: 'Partners', value: '—' },
    ],
  },
  delegate: {
    title: 'Delegate Dashboard',
    description: 'Manage your assigned students and track their progress',
    primaryAction: { label: 'View Students', href: '/delegate/students' },
    secondaryAction: { label: 'Reports', href: '/delegate/reports' },
    stats: [
      { label: 'Assigned Students', value: '45' },
      { label: 'Active Cases', value: '38' },
      { label: 'Completed', value: '12' },
      { label: 'Pending', value: '7' },
    ],
  },
  instructor: {
    title: 'Instructor Dashboard',
    description: 'Manage your classes, assignments, and student progress',
    primaryAction: { label: 'My Classes', href: getAdminUrl('/instructor/classes') },
    secondaryAction: { label: 'Assignments', href: getAdminUrl('/instructor/assignments') },
    stats: [
      { label: 'Active Students', value: '120' },
      { label: 'Classes', value: '5' },
      { label: 'Assignments', value: '23' },
      { label: 'Avg Grade', value: '87%' },
    ],
  },
  partner: {
    title: 'Partner Dashboard',
    description: 'Track enrollments and manage your training programs',
    primaryAction: { label: 'View Enrollments', href: '/partner/enrollments' },
    secondaryAction: { label: 'Attendance', href: '/partner/attendance' },
    stats: [
      { label: 'Active Students', value: '85' },
      { label: 'Programs', value: '6' },
      { label: 'Completion Rate', value: '92%' },
      { label: 'Avg Rating', value: '4.8' },
    ],
  },
  staff: {
    title: 'Staff Dashboard',
    description: 'Access staff tools and resources',
    primaryAction: { label: 'Student Management', href: '/portal/staff/students' },
    secondaryAction: { label: 'Reports', href: '/portal/staff/reports' },
    stats: [
      { label: 'Total Students', value: '—' },
      { label: 'Active Programs', value: '—' },
      { label: 'Pending Apps', value: '—' },
      { label: 'This Month', value: '—' },
    ],
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Full system administration and management',
    primaryAction: { label: 'System Settings', href: getAdminUrl('/settings') },
    secondaryAction: { label: 'User Management', href: getAdminUrl('/staff') },
    stats: [
      { label: 'Total Users', value: '3,200+' },
      { label: 'Active Programs', value: '28' },
      { label: 'Partners', value: '15' },
      { label: 'Revenue', value: '$2.5M' },
    ],
  },
};

export default function RoleDashboard({ role, userName }: RoleDashboardProps) {
  const config = roleConfig[role];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="   text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.title}</h1>
            <p className="text-xl text-white mb-8">{config.description}</p>
            {userName && <p className="text-lg text-white">Welcome back, {userName}!</p>}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {config.stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="text-sm text-black mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold text-brand-blue-600">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={config.primaryAction.href}
                  className="px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                >
                  {config.primaryAction.label}
                </Link>
                <Link
                  href={config.secondaryAction.href}
                  className="px-8 py-3 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition border-2 border-slate-300"
                >
                  {config.secondaryAction.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
