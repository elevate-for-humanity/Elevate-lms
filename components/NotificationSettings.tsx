"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { NotificationManager } from '@/lib/notifications/manager';

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const manager = NotificationManager.getInstance();
      const status = await manager.getPermissionStatus();
      setEnabled(status.granted);
      setLoading(false);
    }

    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    const manager = NotificationManager.getInstance();

    if (enabled) {
      // Disable notifications
      await manager.unsubscribeFromPush();
      setEnabled(false);
    } else {
      // Enable notifications
      const granted = await manager.requestPermission();
      if (granted) {
        await manager.subscribeToPush();
        setEnabled(true);
      }
    }

    setLoading(false);
  };

  const handleTestNotification = async () => {
    const manager = NotificationManager.getInstance();
    await manager.sendNotification('Test Notification', {
      body: 'This is a test notification from Elevate LMS',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              enabled ? 'bg-brand-blue-100' : 'bg-gray-100'
            }`}
          >
            {enabled ? (
              <Bell size={24} className="text-brand-orange-600" />
            ) : (
              <BellOff size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-black">Push Notifications</h3>
            <p className="text-sm text-black">
              {enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-brand-orange-600' : 'bg-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className="space-y-3 text-sm text-black">
        <p>Receive notifications about:</p>
        <ul className="space-y-2 ml-4">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-brand-green-500" />
            New course releases
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-brand-green-500" />
            Achievement unlocks
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-brand-green-500" />
            Course reminders
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-brand-green-500" />
            Important updates
          </li>
        </ul>
      </div>
      {enabled && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleTestNotification}
            disabled={testSent}
            className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              testSent
                ? 'bg-brand-green-100 text-brand-green-700'
                : 'bg-gray-100 text-black hover:bg-gray-200 active:scale-98'
            }`}
          >
            {testSent ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={16} />
                Test Sent!
              </span>
            ) : (
              'Send Test Notification'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
