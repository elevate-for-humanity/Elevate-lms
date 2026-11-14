import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'enrollment_approved'
  | 'enrollment_pending'
  | 'course_completed'
  | 'lesson_unlocked'
  | 'achievement_earned'
  | 'message_received'
  | 'deadline_reminder'
  | 'announcement'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to course progress updates
 */
export function subscribeToCourseProgress(
  userId: string,
  courseId: string,
  onProgress: (progress: { lesson_id: string; completed: boolean }) => void,
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`progress:${userId}:${courseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lesson_progress',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onProgress(payload.new as { lesson_id: string; completed: boolean });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to live chat messages
 */
export function subscribeToChatMessages(
  roomId: string,
  onMessage: (message: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
  }) => void,
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`chat:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onMessage(
          payload.new as { id: string; user_id: string; content: string; created_at: string },
        );
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to presence (who's online)
 */
export function subscribeToPresence(
  roomId: string,
  userId: string,
  onPresenceChange: (users: { user_id: string; online_at: string }[]) => void,
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`presence:${roomId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state)
        .flat()
        .map((presence: any) => ({
          user_id: String(presence?.user_id ?? presence?.presence_ref ?? ''),
          online_at: String(presence?.online_at ?? new Date().toISOString()),
        }))
        .filter((u) => u.user_id.length > 0);
      onPresenceChange(users);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  return !error;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return count || 0;
}

/**
 * Send a notification (server-side only)
 */
export async function sendNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data,
    read: false,
  });

  return !error;
}
