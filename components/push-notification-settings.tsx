"use client";

import React from 'react';

import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function PushNotificationSettings() {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications();

  const [testLoading, setTestLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      await subscribe();
      toast.success('Push notifications enabled');
    } catch (error) { /* Error handled silently */ 
      toast.error('Failed to enable push notifications');
      // Error logged
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      toast.success('Push notifications disabled');
    } catch (error) { /* Error handled silently */ 
      toast.error('Failed to disable push notifications');
      // Error logged
    }
  };

  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        toast.success('Notification permission granted');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) { /* Error handled silently */ 
      toast.error('Failed to request permission');
      // Error logged
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification from Elevate for Humanity',
        icon: '/icon-192x192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'test',
      });
      toast.success('Test notification sent');
    } catch (error) { /* Error handled silently */ 
      toast.error('Failed to send test notification');
      // Error logged
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-black">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-black mt-1">
              Your browser doesn't support push notifications. Try using a modern
              browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <svg
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              isSubscribed ? 'text-green-600' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-black">Push Notifications</h3>
            <p className="text-sm text-black mt-1">
              {isSubscribed
                ? 'You will receive notifications about course updates, achievements, and more.'
                : 'Enable push notifications to stay updated on your learning progress.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Status:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  permission === 'granted'
                    ? 'bg-green-100 text-green-800'
                    : permission === 'denied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {permission === 'granted'
                  ? 'Allowed'
                  : permission === 'denied'
                  ? 'Blocked'
                  : 'Not Set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {permission === 'default' && (
          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium text-sm hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Request Permission'}
          </button>
        )}

        {permission === 'granted' && !isSubscribed && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium text-sm hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Subscribing...' : 'Enable Notifications'}
          </button>
        )}

        {permission === 'granted' && isSubscribed && (
          <>
            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg font-medium text-sm hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Unsubscribing...' : 'Disable Notifications'}
            </button>
            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? 'Sending...' : 'Send Test'}
            </button>
          </>
        )}

        {permission === 'denied' && (
          <div className="text-sm text-black">
            <p>
              Notifications are blocked. To enable them, click the lock icon in your
              browser's address bar and allow notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
