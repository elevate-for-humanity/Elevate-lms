"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface NotificationForm {
  title: string;
  body: string;
  url: string;
  icon: string;
  requireInteraction: boolean;
  userId: string;
  broadcast: boolean;
}

export function PushNotificationSender() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    url: '/',
    icon: '/icon-192x192.png',
    requireInteraction: false,
    userId: '',
    broadcast: false,
  });
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  // Log push notification send to DB
  const logNotificationSend = async (status: 'sent' | 'failed', recipientCount?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('push_notification_send_log')
      .insert({
        admin_id: user?.id,
        title: form.title,
        body: form.body,
        broadcast: form.broadcast,
        target_user_id: form.userId || null,
        recipient_count: recipientCount,
        status,
        sent_at: new Date().toISOString()
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.body) {
      toast.error('Title and body are required');
      return;
    }

    if (!form.broadcast && !form.userId) {
      toast.error('User ID is required when not broadcasting');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: form.broadcast ? undefined : form.userId,
          broadcast: form.broadcast,
          notification: {
            title: form.title,
            body: form.body,
            url: form.url,
            icon: form.icon,
            badge: '/icon-72.png',
            requireInteraction: form.requireInteraction,
            vibrate: [200, 100, 200],
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Notification sent to ${data.sentCount} user(s)`);
        // Reset form
        setForm({
          title: '',
          body: '',
          url: '/',
          icon: '/icon-192x192.png',
          requireInteraction: false,
          userId: '',
          broadcast: false,
        });
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const quickTemplates = [
    {
      name: 'Course Enrollment',
      title: 'Course Enrollment Confirmed',
      body: 'You have been enrolled in a new course',
      url: '/student/courses',
    },
    {
      name: 'Achievement Unlocked',
      title: 'Achievement Unlocked! 🏆',
      body: 'You earned a new achievement',
      url: '/student/achievements',
    },
    {
      name: 'Certificate Ready',
      title: 'Certificate Ready',
      body: 'Your certificate is ready to download',
      url: '/student/certificates',
    },
    {
      name: 'Class Reminder',
      title: 'Class Reminder',
      body: 'Your class starts in 15 minutes',
      url: '/student/courses',
    },
  ];

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setForm((prev) => ({
      ...prev,
      title: template.title,
      body: template.body,
      url: template.url,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-black mb-4">
        Send Push Notification
      </h2>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-black mb-2">
          Quick Templates
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickTemplates.map((template) => (
            <button
              key={template.name}
              onClick={() => applyTemplate(template)}
              className="px-3 py-2 bg-gray-100 text-black rounded text-sm hover:bg-gray-200"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notification title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Body *
          </label>
          <textarea
            value={form.body}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, body: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notification message"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            URL
          </label>
          <input
            type="text"
            value={form.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/student/courses"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Icon URL
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, icon: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/icon-192x192.png"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requireInteraction"
            checked={form.requireInteraction}
            onChange={(e) =>
              setForm({ ...form, requireInteraction: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="requireInteraction"
            className="text-sm text-black"
          >
            Require user interaction (notification stays until dismissed)
          </label>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="broadcast"
              checked={form.broadcast}
              onChange={(e) =>
                setForm({ ...form, broadcast: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="broadcast" className="text-sm font-medium text-black">
              Broadcast to all users
            </label>
          </div>

          {!form.broadcast && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                User ID *
              </label>
              <input
                type="text"
                value={form.userId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter user ID"
                required={!form.broadcast}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}
