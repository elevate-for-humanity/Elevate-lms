'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  type Notification,
} from '@/lib/realtime/notifications';
import { createClient } from '@/lib/supabase/client';

interface UseNotificationsOptions {
  userId: string;
  enabled?: boolean;
  showBrowserNotifications?: boolean;
}

export function useNotifications({
  userId,
  enabled = true,
  showBrowserNotifications = true,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    if (!enabled || !userId) return;

    async function fetchNotifications() {
      setIsLoading(true);
      const supabase = createClient();

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
      setIsLoading(false);
    }

    fetchNotifications();
  }, [userId, enabled]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!enabled || !userId) return;

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permitted
      if (showBrowserNotifications && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icon-192.png',
          tag: notification.id,
        });
      }
    });

    return unsubscribe;
  }, [userId, enabled, showBrowserNotifications]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await markNotificationRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const success = await markAllNotificationsRead(userId);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
    return success;
  }, [userId]);

  // Clear all notifications (local only)
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
  };
}

/**
 * Hook for course-specific real-time updates
 */
export function useCourseRealtime(courseId: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      userId: string;
      action: string;
      timestamp: string;
    }>
  >([]);

  useEffect(() => {
    if (!courseId || !userId) return;

    const supabase = createClient();

    // Subscribe to presence
    const channel = supabase
      .channel(`course:${courseId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((u: any) => u.user_id);
        setOnlineUsers(users);
      })
      .on('broadcast', { event: 'activity' }, ({ payload }) => {
        setRecentActivity((prev) => [payload, ...prev].slice(0, 10));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, userId]);

  const broadcastActivity = useCallback(
    async (action: string) => {
      const supabase = createClient();
      const channel = supabase.channel(`course:${courseId}`);

      await channel.send({
        type: 'broadcast',
        event: 'activity',
        payload: {
          userId,
          action,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [courseId, userId],
  );

  return {
    onlineUsers,
    recentActivity,
    broadcastActivity,
  };
}
