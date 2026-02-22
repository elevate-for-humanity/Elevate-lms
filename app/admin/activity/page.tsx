import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Activity, User, FileText, Settings, Shield, Clock,
  Search, Filter, Download, ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Activity Log | Admin | Elevate For Humanity',
  description: 'View system activity and audit logs.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ActivityLogPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/admin/activity');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/activity');
  }

  // Fetch real activity from audit log
  const { data: activityData } = await db
    .from('audit_logs')
    .select(`
      id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      user_id,
      profiles!audit_logs_user_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const activities = (activityData || []).map((a: any) => {
    const createdAt = new Date(a.created_at);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const timestamp = diffMins < 60 ? `${diffMins} minutes ago` : diffHours < 24 ? `${diffHours} hours ago` : `${diffDays} days ago`;
    
    return {
      id: a.id,
      user: { 
        name: a.profiles?.full_name || (a.user_id ? 'User' : 'System'), 
        email: a.profiles?.email || 'system@elevate.org', 
        avatar: null 
      },
      action: a.action || 'Action',
      target: a.metadata?.target_name || a.target_type || '',
      category: a.target_type || 'System',
      timestamp,
      ip: a.metadata?.ip || 'System',
    };
  });

  const categories = ['All Activity', 'User Management', 'Enrollment', 'Course Management', 'WIOA', 'Certificates', 'System'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'User Management': return User;
      case 'Enrollment': return FileText;
      case 'Course Management': return FileText;
      case 'WIOA': return Shield;
      case 'Certificates': return FileText;
      default: return Activity;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User Management': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'Enrollment': return 'bg-brand-green-100 text-brand-green-700';
      case 'Course Management': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'WIOA': return 'bg-brand-orange-100 text-brand-orange-700';
      case 'Certificates': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Activity' }]} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
              </div>
              <p className="text-gray-600">Monitor system activity and audit trail</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export Log
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search activity..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Categories</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>All time</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Activity List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {activities.map((activity, index) => {
              const Icon = getCategoryIcon(activity.category);
              return (
                <div key={activity.id} className={`p-4 hover:bg-gray-50 ${index !== activities.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {activity.user.avatar ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={activity.user.avatar}
                            alt={activity.user.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Settings className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{activity.user.name}</span>
                        <span className="text-gray-500">{activity.action}</span>
                        <span className="font-medium text-indigo-600">{activity.target}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.timestamp}
                        </span>
                        <span>IP: {activity.ip}</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-gray-600 text-sm">Showing 1-6 of 1,234 activities</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
