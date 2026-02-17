"use client";

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BookOpen, Award, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/realtime/notifications';

interface Notification {
  id: string;
  type: 'course' | 'certificate' | 'message' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const unsubscribe = subscribeToNotifications(user.id, (payload) => {
        const newNotif = payload as any;
        setNotifications((prev) => [{
          id: newNotif.id,
          type: newNotif.type || 'system',
          title: newNotif.title || 'New notification',
          message: newNotif.message || '',
          time: 'Just now',
          read: false,
        }, ...prev]);
      });
      return () => unsubscribe();
    });
  }, []);

  const fetchNotifications = async () => {
    const supabase = createClient();
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
      setNotifications(
        data.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: getTimeAgo(n.created_at),
          read: n.read,
        }))
      );
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id);

    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5 text-brand-blue-600" />;
      case 'certificate':
        return <Award className="w-5 h-5 text-brand-orange-600" />;
      case 'message':
        return <Bell className="w-5 h-5 text-brand-green-600" />;
      default:
        return <span className="text-slate-400 flex-shrink-0">•</span>;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition"
      >
        <Bell className="w-6 h-6 text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                      !notification.read ? 'bg-brand-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-black">
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex-shrink-0 text-slate-400 hover:text-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-black mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500">
                            {notification.time}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-black">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 text-center">
                <button className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
