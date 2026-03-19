import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  BookOpen, 
  Award, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Clock,
  Settings,
  Trash2,
  Check,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Notifications | Student Portal',
  description: 'View your notifications, alerts, and updates.',
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Notifications" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let notifications: any[] = [];
  let unreadCount = 0;

  try {
    const { data: notificationData } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notificationData) {
      notifications = notificationData;
      unreadCount = notifications.filter(n => !n.read_at).length;
    }
  } catch (error) {
    // Tables may not exist
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return BookOpen;
      case 'assignment': return Calendar;
      case 'grade': return Award;
      case 'message': return MessageSquare;
      case 'alert': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-brand-blue-100 text-brand-blue-600';
      case 'assignment': return 'bg-brand-orange-100 text-brand-orange-600';
      case 'grade': return 'bg-brand-green-100 text-brand-green-600';
      case 'message': return 'bg-brand-blue-100 text-brand-blue-600';
      case 'alert': return 'bg-brand-red-100 text-brand-red-600';
      case 'success': return 'bg-brand-green-100 text-brand-green-600';
      default: return 'bg-white text-slate-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Group notifications by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayNotifications = notifications.filter(n => new Date(n.created_at) >= today);
  const yesterdayNotifications = notifications.filter(n => {
    const date = new Date(n.created_at);
    return date >= yesterday && date < today;
  });
  const olderNotifications = notifications.filter(n => new Date(n.created_at) < yesterday);

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Notifications" }]} />
        </div>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            {unreadCount > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-white transition">
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <Link href="/lms/settings/notifications" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-white transition">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-8">
            {/* Today */}
            {todayNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Today</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                  {todayNotifications.map((notification) => {
                    const IconComponent = getIcon(notification.type);
                    const iconColor = getIconColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white transition ${!notification.read_at ? 'bg-brand-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`${!notification.read_at ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {formatTime(notification.created_at)}
                            </div>
                          </div>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {yesterdayNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Yesterday</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                  {yesterdayNotifications.map((notification) => {
                    const IconComponent = getIcon(notification.type);
                    const iconColor = getIconColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white transition ${!notification.read_at ? 'bg-brand-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`${!notification.read_at ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {formatTime(notification.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Older */}
            {olderNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Earlier</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                  {olderNotifications.map((notification) => {
                    const IconComponent = getIcon(notification.type);
                    const iconColor = getIconColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-white transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-700">{notification.title}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {formatTime(notification.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-600">
              You&apos;re all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
