import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Bell, CheckCircle, Info, AlertTriangle, Award, BookOpen, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Notifications | Student Portal | Elevate For Humanity',
  description: 'View your notifications.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'achievement': return Award;
    case 'course': return BookOpen;
    case 'event': return Calendar;
    default: return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-500 bg-green-100';
    case 'warning': return 'text-yellow-500 bg-yellow-100';
    case 'achievement': return 'text-blue-500 bg-blue-100';
    case 'course': return 'text-blue-500 bg-blue-100';
    case 'event': return 'text-orange-500 bg-orange-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

export default async function StudentNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/student/notifications');
  }

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Count unread
  const unreadCount = notifications?.filter(n => !n.read_at).length || 0;

  // Group by date
  const groupedNotifications: Record<string, typeof notifications> = {};
  notifications?.forEach(notification => {
    const date = new Date(notification.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groupedNotifications[date]) {
      groupedNotifications[date] = [];
    }
    groupedNotifications[date]!.push(notification);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Student", href: "/portal/student/dashboard" }, { label: "Notifications" }]} />
<div className="max-w-3xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/portal/student/dashboard" className="hover:text-orange-600">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Notifications</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={async () => {
              'use server';
              const supabase = await createClient();
              await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .is('read_at', null);
            }}>
              <button type="submit" className="text-sm text-orange-600 hover:text-orange-700">
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-gray-500 mb-3">{date}</h2>
                <div className="bg-white rounded-xl border divide-y">
                  {items?.map((notification: any) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);
                    
                    return (
                      <div key={notification.id} 
                        className={`p-4 flex gap-4 ${!notification.read_at ? 'bg-orange-50/50' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.read_at && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(notification.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            {notification.link && (
                              <Link href={notification.link} className="text-xs text-orange-600 hover:text-orange-700">
                                View details →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-900">No notifications</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
