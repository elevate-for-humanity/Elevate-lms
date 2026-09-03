/**
 * Push Notification Client
 * Client-side push notification management
 */
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
}
export class PushNotificationClient {
  private registration: ServiceWorkerRegistration | null = null;
  /**
   * Initialize push notifications
   */
  async init(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration;
  }
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }
  /**
   * Get current permission state
   */
  async getPermissionState(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) {
      return {
        permission: 'denied',
        isSupported: false,
        isSubscribed: false,
      };
    }
    const subscription = await this.getSubscription();
    return {
      permission: Notification.permission,
      isSupported: true,
      isSubscribed: subscription !== null,
    };
  }
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }
    const permission = await Notification.requestPermission();
    return permission;
  }
  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }
    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }
    // Subscribe to push notifications
    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
    // Send subscription to server
    await this.saveSubscription(subscription);
    return subscription;
  }
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return true;
      }
      // Unsubscribe from push manager
      const success = await subscription.unsubscribe();
      if (success) {
        // Remove subscription from server
        await this.removeSubscription(subscription);
      }
      return success;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return false;
    }
  }
  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }
    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return null;
    }
  }
  /**
   * Save subscription to server
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
  }
  /**
   * Remove subscription from server
   */
  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }
  }
  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as BufferSource;
  }
  /**
   * Show local notification (for testing)
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }
    await this.registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72.png',
      ...options,
    });
  }
}
// Singleton instance
let instance: PushNotificationClient | null = null;
/**
 * Get singleton instance of PushNotificationClient
 */
export function getPushNotificationClient(): PushNotificationClient {
  if (!instance) {
    instance = new PushNotificationClient();
  }
  return instance;
}
