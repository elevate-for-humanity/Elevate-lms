'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);

    loadNotifications();
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    loadNotifications();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-black" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-black">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-orange-600 hover:text-brand-orange-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notification.read ? 'bg-brand-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-black mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(
                              notification.created_at
                            ).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-slate-200 rounded flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-black" />
                          </button>
                        )}
                      </div>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="inline-block mt-2 text-xs text-brand-orange-600 hover:text-brand-orange-700 font-semibold"
                          onClick={() => setIsOpen(false)}
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
