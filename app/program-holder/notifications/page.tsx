import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { Bell, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Notifications | Program Holder',
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/notifications',
  },
};

export default async function ProgramHolderNotificationsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Notifications" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/notifications');
  }

  // Get notifications for this user
  const { data: notifications } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Notifications" }]} />
        </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">
              Notifications
            </h1>
            <p className="text-black">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'All caught up!'}
            </p>
          </div>
          <Link
            href="/program-holder/settings/notifications"
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
          >
            Notification Settings
          </Link>
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">
              No Notifications Yet
            </h2>
            <p className="text-black">
              You'll see notifications here when students enroll or complete
              milestones.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border p-4 transition ${
                  notification.read
                    ? 'border-gray-200'
                    : 'border-brand-blue-200 bg-brand-blue-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.read ? 'bg-gray-300' : 'bg-brand-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-black mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-black">
                      <span>
                        {new Date(notification.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          className="flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                        >
                          {notification.action_label || 'View'}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <form
                      action={`/api/program-holder/notifications/${notification.id}/mark-read`}
                      method="POST"
                    >
                      <button
                        type="submit"
                        className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Mark Read
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
