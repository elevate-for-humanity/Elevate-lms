'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Bell, Clock, Users, 
  AlertCircle, FileText, Trash2, Check, Loader2, 
  BellOff, Building2
} from 'lucide-react';

type NotificationType = 'hours_submitted' | 'apprentice_joined' | 'report_ready' | 'reminder' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  hours_submitted: <Clock className="w-5 h-5 text-amber-400" />,
  apprentice_joined: <Users className="w-5 h-5 text-brand-green-400" />,
  report_ready: <FileText className="w-5 h-5 text-brand-blue-400" />,
  reminder: <AlertCircle className="w-5 h-5 text-brand-blue-400" />,
  system: <Bell className="w-5 h-5 text-slate-400" />,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  hours_submitted: 'bg-amber-500/20',
  apprentice_joined: 'bg-brand-green-500/20',
  report_ready: 'bg-brand-blue-500/20',
  reminder: 'bg-brand-blue-500/20',
  system: 'bg-slate-700',
};

// Mock data for demo
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'hours_submitted',
    title: 'Hours Pending Approval',
    message: 'James W. submitted 32 hours for the week ending Jan 24.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actionUrl: '/pwa/shop-owner/approve-hours',
  },
  {
    id: '2',
    type: 'hours_submitted',
    title: 'Hours Pending Approval',
    message: 'Deja Williams submitted 28 hours for the week ending Jan 24.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actionUrl: '/pwa/shop-owner/approve-hours',
  },
  {
    id: '3',
    type: 'apprentice_joined',
    title: 'New Apprentice',
    message: 'Tyrone Davis has been assigned to your shop.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actionUrl: '/pwa/shop-owner/apprentices',
  },
  {
    id: '4',
    type: 'report_ready',
    title: 'Monthly Report Ready',
    message: 'Your January 2025 compliance report is ready for download.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    actionUrl: '/pwa/shop-owner/reports',
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Weekly Reminder',
    message: 'Don\'t forget to approve pending hours before Friday.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export default function ShopOwnerNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 500);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (id: string) => {
    setMarkingRead(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setMarkingRead(null);
  };

  const markAllAsRead = async () => {
    setMarkingRead('all');
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingRead(null);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-brand-blue-400 text-sm">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingRead === 'all'}
              className="text-brand-blue-400 text-sm font-medium hover:text-brand-blue-300 disabled:opacity-50"
            >
              {markingRead === 'all' ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-white font-medium mb-2">No notifications</h2>
            <p className="text-slate-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative bg-slate-800 rounded-xl overflow-hidden ${
                  !notification.read ? 'border-l-4 border-brand-blue-500' : ''
                }`}
              >
                {notification.actionUrl ? (
                  <Link
                    href={notification.actionUrl}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className="block p-4"
                  >
                    <NotificationContent notification={notification} formatTime={formatTime} />
                  </Link>
                ) : (
                  <div className="p-4">
                    <NotificationContent notification={notification} formatTime={formatTime} />
                  </div>
                )}
                
                <div className="flex border-t border-slate-700">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={markingRead === notification.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white hover:bg-slate-700 text-sm"
                    >
                      {markingRead === notification.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-brand-red-400 hover:bg-slate-700 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-slate-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

function NotificationContent({ 
  notification, 
  formatTime 
}: { 
  notification: Notification; 
  formatTime: (date: string) => string;
}) {
  return (
    <div className="flex gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${NOTIFICATION_COLORS[notification.type]}`}>
        {NOTIFICATION_ICONS[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium ${notification.read ? 'text-slate-300' : 'text-white'}`}>
            {notification.title}
          </h3>
          <span className="text-slate-500 text-xs flex-shrink-0">
            {formatTime(notification.createdAt)}
          </span>
        </div>
        <p className={`text-sm mt-1 ${notification.read ? 'text-slate-500' : 'text-slate-400'}`}>
          {notification.message}
        </p>
      </div>
    </div>
  );
}
