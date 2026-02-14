/**
 * Role-specific Dashboard Component
 * Displays different content based on user role
 */

import Link from 'next/link';

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
      { label: 'Active Students', value: '2,500+' },
      { label: 'Job Placements', value: '95%' },
      { label: 'Programs', value: '28' },
      { label: 'Partners', value: '15' },
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
    primaryAction: { label: 'My Classes', href: '/instructor/classes' },
    secondaryAction: { label: 'Assignments', href: '/instructor/assignments' },
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
      { label: 'Total Students', value: '2,500+' },
      { label: 'Active Programs', value: '28' },
      { label: 'Pending Apps', value: '45' },
      { label: 'This Month', value: '120' },
    ],
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Full system administration and management',
    primaryAction: { label: 'System Settings', href: '/admin/settings' },
    secondaryAction: { label: 'User Management', href: '/admin/users' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="   text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.title}</h1>
            <p className="text-xl text-brand-blue-100 mb-8">{config.description}</p>
            {userName && (
              <p className="text-lg text-brand-blue-200">Welcome back, {userName}!</p>
            )}
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
                  className="px-8 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition border-2 border-gray-300"
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
