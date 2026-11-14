'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPushNotificationClient,
  NotificationPermissionState,
} from '@/lib/notifications/push-client';
import { getServiceWorkerManager } from '@/lib/offline/service-worker-manager';

export interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const client = getPushNotificationClient();

  // Initialize and check permission state
  useEffect(() => {
    const init = async () => {
      try {
        // Wait for service worker to be ready
        const swManager = getServiceWorkerManager();
        const registration = swManager.getRegistration();

        if (registration) {
          await client.init(registration);
          const permissionState = await client.getPermissionState();
          setState(permissionState);
        }
      } catch (error) {
        /* Error handled silently */
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Re-check when service worker becomes ready
    const interval = setInterval(() => {
      const swManager = getServiceWorkerManager();
      if (swManager.isReady()) {
        init();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [client]);

  // Monitor permission changes
  useEffect(() => {
    if (!state.isSupported) return;

    const checkPermission = async () => {
      const permissionState = await client.getPermissionState();
      setState(permissionState);
    };

    // Check permission periodically
    const interval = setInterval(checkPermission, 5000);

    return () => clearInterval(interval);
  }, [client, state.isSupported]);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.subscribe();
      const permissionState = await client.getPermissionState();
      setState(permissionState);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.unsubscribe();
      const permissionState = await client.getPermissionState();
      setState(permissionState);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const permission = await client.requestPermission();
      const permissionState = await client.getPermissionState();
      setState(permissionState);
      return permission;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return {
    permission: state.permission,
    isSupported: state.isSupported,
    isSubscribed: state.isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
