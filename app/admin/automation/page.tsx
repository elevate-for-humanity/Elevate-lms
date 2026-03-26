import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap, 
  Mail, 
  Bell, 
  Clock, 
  
  XCircle, 
  RefreshCw,
  Calendar,
  Users,
  AlertTriangle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Automation Log | Admin',
  description: 'View automation execution history, email delivery, and system events.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AutomationLogPage() {
  const supabase = await createClient();
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/automation');

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/');
  }

  // Fetch delivery logs (emails/SMS sent)
  const { data: deliveryLogs } = await supabase
    .from('delivery_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch recent enrollments (automation trigger)
  const { data: recentEnrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      created_at,
      profiles!enrollments_user_id_fkey(full_name),
      programs(name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // Calculate stats
  const emailsSent = deliveryLogs?.filter(l => l.channel === 'email' && l.status === 'sent').length || 0;
  const emailsFailed = deliveryLogs?.filter(l => l.channel === 'email' && l.status === 'failed').length || 0;
  const smsSent = deliveryLogs?.filter(l => l.channel === 'sms' && l.status === 'sent').length || 0;
  const notificationCount = notifications?.length || 0;

  const stats = [
    { label: 'Emails Sent', value: emailsSent, icon: Mail, color: 'green' },
    { label: 'Emails Failed', value: emailsFailed, icon: XCircle, color: 'red' },
    { label: 'SMS Sent', value: smsSent, icon: Bell, color: 'blue' },
    { label: 'Notifications', value: notificationCount, icon: Bell, color: 'blue' },
  ];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Automation' }]} />
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automation Log</h1>
              <p className="text-gray-600">View system automation execution and delivery status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Delivery Logs */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-blue-500" />
                Email/SMS Delivery Log
              </h2>
              <span className="text-sm text-gray-500">{deliveryLogs?.length || 0} records</span>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {deliveryLogs && deliveryLogs.length > 0 ? (
                deliveryLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${log.status === 'sent' ? 'bg-brand-green-100' : log.status === 'failed' ? 'bg-brand-red-100' : 'bg-yellow-100'}`}>
                          {log.status === 'sent' ? (
                            <span className="text-slate-400 flex-shrink-0">•</span>
                          ) : log.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-brand-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {log.channel?.toUpperCase() || 'Email'}: {log.template_name || 'Message'}
                          </p>
                          <p className="text-gray-500 text-xs truncate max-w-[200px]">
                            To: {log.recipient || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No delivery logs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Enrollments (Automation Triggers) */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-green-500" />
                Enrollment Automations
              </h2>
              <span className="text-sm text-gray-500">{recentEnrollments?.length || 0} recent</span>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {recentEnrollments && recentEnrollments.length > 0 ? (
                recentEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-brand-green-100">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            Enrollment completed
                          </p>
                          <p className="text-gray-500 text-xs">
                            {enrollment.profiles?.full_name || 'Student'} → {enrollment.programs?.name || 'Program'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(enrollment.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent enrollments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cron Job Status */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-blue-500" />
            Scheduled Jobs
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Nudge Emails</span>
                <span className="text-xs px-2 py-1 bg-brand-green-100 text-brand-green-700 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-600">Sends inactivity reminders</p>
              <p className="text-xs text-gray-400 mt-1">Runs daily at 9:00 AM</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Missed Check-ins</span>
                <span className="text-xs px-2 py-1 bg-brand-green-100 text-brand-green-700 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-600">Alerts for missed OJT check-ins</p>
              <p className="text-xs text-gray-400 mt-1">Runs daily at 6:00 PM</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">End of Day Summary</span>
                <span className="text-xs px-2 py-1 bg-brand-green-100 text-brand-green-700 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-600">Daily progress summaries</p>
              <p className="text-xs text-gray-400 mt-1">Runs daily at 8:00 PM</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Note: Cron jobs are triggered by scheduled cron. Check deployment dashboard for execution logs.
          </p>
        </div>
      </div>
    </div>
  );
}
