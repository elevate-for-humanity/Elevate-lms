/**
 * Push Notification Service
 * Handles push notification subscriptions and sending
 */
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@www.elevateforhumanity.org';
// Initialize web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
export class PushNotificationService {
  /**
   * Send push notification to a single subscription
   */
  async sendToSubscription(
    subscription: PushSubscription,
    notification: PushNotification
  ): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return false;
    }
    try {
      const payload = JSON.stringify(notification);
      await webpush.sendNotification(subscription, payload);
      return true;
    } catch (error) { /* Error handled silently */ 
      // Handle expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.removeSubscription(subscription.endpoint);
      } else {
        // Error: $1
      }
      return false;
    }
  }
  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    notification: PushNotification
  ): Promise<number> {
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      return 0;
    }
    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await this.sendToSubscription(
        sub.subscription,
        notification
      );
      if (success) successCount++;
    }
    return successCount;
  }
  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: PushNotification
  ): Promise<number> {
    let totalSent = 0;
    for (const userId of userIds) {
      const sent = await this.sendToUser(userId, notification);
      totalSent += sent;
    }
    return totalSent;
  }
  /**
   * Broadcast push notification to all subscribed users
   */
  async broadcast(notification: PushNotification): Promise<number> {
    const subscriptions = await this.getAllSubscriptions();
    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await this.sendToSubscription(
        sub.subscription,
        notification
      );
      if (success) successCount++;
    }
    return successCount;
  }
  /**
   * Get all subscriptions for a user
   */
  private async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      const supabase = await createClient();
      const { data, error }: any = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);
      if (error) {
        // Error: $1
        return [];
      }
      return data || [];
    } catch (error) {
      // Error: $1
      return [];
    }
  }
  /**
   * Get all subscriptions
   */
  private async getAllSubscriptions(): Promise<any[]> {
    try {
      const supabase = await createClient();
      const { data, error }: any = await supabase
        .from('push_subscriptions')
        .select('*');
      if (error) {
        // Error: $1
        return [];
      }
      return data || [];
    } catch (error) {
      // Error: $1
      return [];
    }
  }
  /**
   * Remove expired subscription
   */
  private async removeSubscription(endpoint: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch (error) {
      // Error: $1
    }
  }
  /**
   * Send course enrollment notification
   */
  async sendCourseEnrollmentNotification(
    userId: string,
    courseName: string
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Course Enrollment Confirmed',
      body: `You've been enrolled in ${courseName}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/courses',
      tag: 'enrollment',
      vibrate: [200, 100, 200],
    });
  }
  /**
   * Send course completion notification
   */
  async sendCourseCompletionNotification(
    userId: string,
    courseName: string
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Course Completed! 🎉',
      body: `Congratulations on completing ${courseName}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/certificates',
      tag: 'completion',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    });
  }
  /**
   * Send achievement unlocked notification
   */
  async sendAchievementNotification(
    userId: string,
    achievementName: string,
    points: number
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Achievement Unlocked! 🏆',
      body: `${achievementName} (+${points} points)`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/achievements',
      tag: 'achievement',
      vibrate: [100, 50, 100, 50, 100],
    });
  }
  /**
   * Send class reminder notification
   */
  async sendClassReminder(
    userId: string,
    className: string,
    startTime: Date
  ): Promise<void> {
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    await this.sendToUser(userId, {
      title: 'Class Reminder',
      body: `${className} starts at ${timeStr}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/courses',
      tag: 'reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View Course' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }
  /**
   * Send certificate ready notification
   */
  async sendCertificateReadyNotification(
    userId: string,
    courseName: string
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Certificate Ready',
      body: `Your certificate for ${courseName} is ready to download`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/certificates',
      tag: 'certificate',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'download', title: 'Download' },
        { action: 'view', title: 'View' },
      ],
    });
  }
  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(userId: string, amount: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Payment Confirmed',
      body: `Your payment of ${amount} has been processed`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/settings',
      tag: 'payment',
      vibrate: [200, 100, 200],
    });
  }
  /**
   * Send leaderboard position notification
   */
  async sendLeaderboardNotification(
    userId: string,
    position: number,
    change: number
  ): Promise<void> {
    const changeText = change > 0 ? `up ${change}` : `down ${Math.abs(change)}`;
    await this.sendToUser(userId, {
      title: 'Leaderboard Update',
      body: `You're now #${position} (${changeText} positions)`,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/leaderboard',
      tag: 'leaderboard',
      vibrate: [100, 50, 100],
    });
  }
  /**
   * Send new message notification
   */
  async sendMessageNotification(
    userId: string,
    senderName: string,
    preview: string
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: `Message from ${senderName}`,
      body: preview,
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      url: '/lms/messages',
      tag: 'message',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' },
      ],
    });
  }
}
// Singleton instance
let instance: PushNotificationService | null = null;
/**
 * Get singleton instance of PushNotificationService
 */
export function getPushNotificationService(): PushNotificationService {
  if (!instance) {
    instance = new PushNotificationService();
  }
  return instance;
}
