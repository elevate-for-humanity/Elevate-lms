import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Partner Dashboard | Elevate for Humanity' };

export default function PartnerDashboardPage() {
  const stats = [
    { icon: Users, label: 'Active Students', value: '47', color: 'blue' },
    { icon: DollarSign, label: 'Revenue MTD', value: '$12,450', color: 'green' },
    { icon: TrendingUp, label: 'Completion Rate', value: '89%', color: 'blue' },
    { icon: Calendar, label: 'Sessions This Week', value: '12', color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "(Partner)", href: "/(partner)" }, { label: "Dashboard" }]} />
      </div>
<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/partner/attendance/record" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span>Record Attendance</span><ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/partner/students" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span>View Students</span><ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/partner/reports" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span>Generate Reports</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-600">No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
