"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Award, BookOpen, AlertCircle } from 'lucide-react';

const defaultNotifications = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    color: 'text-green-600',
    title: 'Module Completed',
    message: 'You completed Module 2 in CNA Certification',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 2,
    type: 'achievement',
    icon: Award,
    color: 'text-orange-600',
    title: 'New Certificate',
    message: 'Your Barber Apprenticeship certificate is ready',
    time: '1 day ago',
    unread: true,
  },
];

const iconMap: Record<string, any> = {
  success: Circle,
  achievement: Award,
  reminder: AlertCircle,
  info: BookOpen,
};

const colorMap: Record<string, string> = {
  success: 'text-green-600',
  achievement: 'text-orange-600',
  reminder: 'text-brand-orange-600',
  info: 'text-brand-orange-600',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState(defaultNotifications);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => n.unread).length;

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          const formatted = data.map(n => ({
            id: n.id,
            type: n.notification_type || 'info',
            icon: iconMap[n.notification_type] || BookOpen,
            color: colorMap[n.notification_type] || 'text-brand-orange-600',
            title: n.title,
            message: n.message,
            time: getRelativeTime(n.created_at),
            unread: !n.read_at,
          }));
          setNotifs(formatted);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const markAsRead = async (notifId: number) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notifId)
      .catch(() => {});
    
    setNotifs(prev => prev.map(n => 
      n.id === notifId ? { ...n, unread: false } : n
    ));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-10 w-10 text-black" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-brand-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-black">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-orange-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notif.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${notif.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black text-sm">
                          {notif.title}
                        </p>
                        <p className="text-sm text-black mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.time}
                        </p>
                      </div>
                      {notif.unread && (
                        <div className="w-2 h-2 bg-brand-orange-600 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <button className="text-sm text-brand-orange-600 hover:text-blue-700 font-medium">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
