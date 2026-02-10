import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Users, DollarSign, TrendingUp, Calendar, ArrowRight,
  ClipboardList, FileText, Bell, BarChart, Clock, CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Dashboard | Elevate for Humanity',
  description: 'Manage your students, track outcomes, and access partner tools.',
};

export default function PartnerDashboardPage() {
  const stats = [
    { icon: Users, label: 'Active Students', value: '47', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: DollarSign, label: 'Revenue MTD', value: '$12,450', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: TrendingUp, label: 'Completion Rate', value: '89%', color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: Calendar, label: 'Sessions This Week', value: '12', color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const quickActions = [
    { label: 'Record Attendance', href: '/partner/attendance/record', icon: ClipboardList },
    { label: 'View Students', href: '/partner/students', icon: Users },
    { label: 'Generate Reports', href: '/partner/reports', icon: FileText },
    { label: 'View Analytics', href: '/partner/analytics', icon: BarChart },
    { label: 'Manage Schedule', href: '/partner/schedule', icon: Calendar },
    { label: 'Notifications', href: '/partner/notifications', icon: Bell },
  ];

  const recentActivity = [
    { action: 'New enrollment', detail: 'Marcus Johnson enrolled in HVAC Technician', time: '2 hours ago' },
    { action: 'Hours verified', detail: '24 hours verified for Barber Apprenticeship cohort', time: '4 hours ago' },
    { action: 'Report generated', detail: 'Monthly outcomes report for January 2026', time: '1 day ago' },
    { action: 'Payment received', detail: '$3,200 funding disbursement processed', time: '2 days ago' },
  ];

  const upcomingTasks = [
    { task: 'Submit Q1 performance report', due: 'Due Feb 15', status: 'pending' },
    { task: 'Review new student applications (3)', due: 'Due Feb 12', status: 'pending' },
    { task: 'Complete WIOA compliance checklist', due: 'Due Feb 28', status: 'pending' },
    { task: 'Schedule advisory board meeting', due: 'Due Mar 1', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Dashboard' }]} />
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back. Here is your program overview.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition text-center">
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.action}</p>
                    <p className="text-gray-600 text-sm">{item.detail}</p>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Tasks</h2>
            <div className="space-y-3">
              {upcomingTasks.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.task}</p>
                      <p className="text-xs text-gray-500">{item.due}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
