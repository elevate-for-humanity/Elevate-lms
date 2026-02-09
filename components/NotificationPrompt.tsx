"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationManager } from '@/lib/notifications/manager';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      const manager = NotificationManager.getInstance();
      const status = await manager.getPermissionStatus();

      // Show prompt if permission is not yet requested and not dismissed
      const wasDismissed = localStorage.getItem(
        'notification-prompt-dismissed'
      );
      if (status.prompt && !wasDismissed) {
        // Wait 10 seconds before showing prompt
        setTimeout(() => setShow(true), 10000);
      }
    }

    checkPermission();
  }, []);

  const supabase = createClient();

  const handleEnable = async () => {
    const manager = NotificationManager.getInstance();
    const granted = await manager.requestPermission();

    if (granted) {
      await manager.subscribeToPush();
      
      // Log notification opt-in to DB
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          push_enabled: true,
          opted_in_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      // Log the event
      await supabase
        .from('notification_events')
        .insert({
          user_id: user?.id,
          event_type: 'push_enabled',
          timestamp: new Date().toISOString()
        });

      setShow(false);
    }
  };

  const handleDismiss = async () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');

    // Log dismissal to DB
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('notification_events')
      .insert({
        user_id: user?.id,
        event_type: 'prompt_dismissed',
        timestamp: new Date().toISOString()
      });
  };

  if (!show || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-brand-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-black mb-1">Stay Updated</h3>
            <p className="text-sm text-black mb-3">
              Get notified about new courses, achievements, and important
              updates.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                className="px-4 py-2 bg-brand-orange-600 text-white font-medium text-sm rounded-lg hover:bg-brand-orange-700 active:scale-95 transition-transform"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 text-black font-medium text-sm rounded-lg hover:bg-gray-200 active:scale-95 transition-transform"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
