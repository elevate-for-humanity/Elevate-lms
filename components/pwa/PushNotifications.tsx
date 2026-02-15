'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

// VAPID public key would come from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
}

// Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    permission: 'default',
    subscribed: false,
    loading: true,
  });

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      
      if (!supported) {
        setState(prev => ({ ...prev, supported: false, loading: false }));
        return;
      }

      const permission = Notification.permission;
      let subscribed = false;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }

      setState({
        supported: true,
        permission,
        subscribed,
        loading: false,
      });
    };

    checkSupport();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.supported) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, loading: false }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setState(prev => ({
        ...prev,
        permission: 'granted',
        subscribed: true,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [state.supported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setState(prev => ({ ...prev, subscribed: false, loading: false }));
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

interface NotificationToggleProps {
  className?: string;
}

export function NotificationToggle({ className = '' }: NotificationToggleProps) {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!supported) {
    return null;
  }

  const handleToggle = async () => {
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || permission === 'denied'}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        subscribed 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      } ${loading ? 'opacity-50 cursor-wait' : ''} ${className}`}
    >
      {subscribed ? (
        <>
          <Bell className="w-5 h-5" />
          <span>Notifications On</span>
        </>
      ) : (
        <>
          <BellOff className="w-5 h-5" />
          <span>Enable Notifications</span>
        </>
      )}
    </button>
  );
}

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
}

export function NotificationPermissionBanner({ onDismiss }: NotificationPermissionBannerProps) {
  const { supported, permission, subscribed, loading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('notification-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!supported || permission !== 'default' || subscribed || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
    onDismiss?.();
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      handleDismiss();
    }
  };

  return (
    <div className="bg-brand-blue-600 text-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Get notified about hour approvals and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-3 py-1 bg-white text-brand-blue-600 rounded-lg text-sm font-medium hover:bg-brand-blue-50"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-brand-blue-500 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification types for the app
export type NotificationType = 
  | 'hours_approved'
  | 'hours_rejected'
  | 'milestone_reached'
  | 'weekly_reminder'
  | 'new_apprentice'
  | 'compliance_warning';

export interface AppNotification {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
}

// Helper to create notification payloads
export function createNotificationPayload(notification: AppNotification) {
  const icons: Record<NotificationType, string> = {
    hours_approved: '/icons/check-circle.png',
    hours_rejected: '/icons/x-circle.png',
    milestone_reached: '/icons/award.png',
    weekly_reminder: '/icons/clock.png',
    new_apprentice: '/icons/user-plus.png',
    compliance_warning: '/icons/alert-triangle.png',
  };

  return {
    title: notification.title,
    body: notification.body,
    icon: icons[notification.type] || '/icon-192.png',
    badge: '/icon-192.png',
    tag: notification.type,
    url: notification.url || '/',
    data: notification.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
}
