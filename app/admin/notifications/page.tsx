"use client";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Send, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
export const dynamic = 'force-dynamic';

function QuickTemplate({
  title,
  body,
  onClick,
}: {
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue-500 hover:bg-gray-50 transition text-left"
    >
      <h3 className="font-semibold text-black mb-1">{title}</h3>
      <p className="text-sm text-black">{body}</p>
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    targetAudience: 'all-students',
    url: '/',
    icon: '/icon-192x192.png',
  });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendNotification = async () => {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) { /* Error handled silently */ 
      setResult({ success: false, error: 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-notifications-hero.jpg" alt="Notifications" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-notifications-detail.jpg"
          alt="Notifications"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Notifications' }]} />
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-brand-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-black">
                Push Notifications
              </h1>
              <p className="text-black mt-1">
                Send instant notifications to students and staff
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Notifications' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                Create Notification
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={notification.title}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setNotification({
                        ...notification,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Class Reminder"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Message
                  </label>
                  <textarea
                    value={notification.body}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setNotification({ ...notification, body: e.target.value })
                    }
                    placeholder="e.g., Your class starts in 30 minutes"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Target Audience
                  </label>
                  <select
                    value={notification.targetAudience}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setNotification({
                        ...notification,
                        targetAudience: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="all-students">All Students</option>
                    <option value="active-students">Active Students</option>
                    <option value="all-staff">All Staff</option>
                    <option value="barber-students">
                      Barber Program Students
                    </option>
                    <option value="cna-students">CNA Program Students</option>
                    <option value="cdl-students">CDL Program Students</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Click Action URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={notification.url}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setNotification({ ...notification, url: e.target.value })
                    }
                    placeholder="/lms/courses"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-black mt-1">
                    Where users go when they click the notification
                  </p>
                </div>

                <button
                  onClick={sendNotification}
                  disabled={
                    sending || !notification.title || !notification.body
                  }
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  <span>{sending ? 'Sending...' : 'Send Notification'}</span>
                </button>
              </div>

              {/* Result */}
              {result && (
                <div
                  className={`mt-6 p-4 rounded-lg ${
                    result.success
                      ? 'bg-brand-green-50 border border-brand-green-200'
                      : 'bg-brand-red-50 border border-brand-red-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {result.success ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <AlertCircle className="w-5 h-5 text-brand-orange-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${result.success ? 'text-brand-green-900' : 'text-brand-red-900'}`}
                      >
                        {result.success
                          ? 'Notification Sent!'
                          : 'Failed to Send'}
                      </h3>
                      {result.summary && (
                        <p
                          className={`text-sm mt-1 ${result.success ? 'text-brand-green-700' : 'text-brand-red-700'}`}
                        >
                          Sent to {result.summary.sent} of{' '}
                          {result.summary.total} users
                          {result.summary.failed > 0 &&
                            ` (${result.summary.failed} failed)`}
                        </p>
                      )}
                      {result.error && (
                        <p className="text-sm text-brand-red-700 mt-1">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Templates */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Quick Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickTemplate
                  title="Class Reminder"
                  body="Your class starts in 30 minutes"
                  onClick={() =>
                    setNotification({
                      ...notification,
                      title: 'Class Reminder',
                      body: 'Your class starts in 30 minutes',
                      url: '/lms/courses',
                    })
                  }
                />
                <QuickTemplate
                  title="Assignment Due"
                  body="Assignment due tomorrow at 11:59 PM"
                  onClick={() =>
                    setNotification({
                      ...notification,
                      title: 'Assignment Due',
                      body: 'Assignment due tomorrow at 11:59 PM',
                      url: '/lms/assignments',
                    })
                  }
                />
                <QuickTemplate
                  title="New Message"
                  body="You have a new message from your instructor"
                  onClick={() =>
                    setNotification({
                      ...notification,
                      title: 'New Message',
                      body: 'You have a new message from your instructor',
                      url: '/lms/messages',
                    })
                  }
                />
                <QuickTemplate
                  title="Certificate Ready"
                  body="Your certificate is ready to download!"
                  onClick={() =>
                    setNotification({
                      ...notification,
                      title: 'Certificate Ready',
                      body: 'Your certificate is ready to download!',
                      url: '/lms/certificates',
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Preview & Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold text-black mb-4">Preview</h3>

              {/* Notification Preview */}
              <div className="border-2 border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Image
                    src={notification.icon}
                    alt="Icon"
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-sm">
                      {notification.title || 'Notification Title'}
                    </div>
                    <div className="text-sm text-black mt-1">
                      {notification.body ||
                        'Notification message will appear here'}
                    </div>
                    <div className="text-xs text-black mt-2">
                      Elevate for Humanity • now
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-black mb-1">
                    Target Audience
                  </div>
                  <div className="text-sm font-medium text-black">
                    {notification.targetAudience
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">
                    Estimated Recipients
                  </div>
                  <div className="text-sm font-medium text-black">
                    {notification.targetAudience === 'all-students'
                      ? 'All students'
                      : notification.targetAudience === 'active-students'
                        ? 'Active students'
                        : notification.targetAudience === 'all-staff'
                          ? 'All staff'
                          : 'Selected group'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Click Action</div>
                  <div className="text-sm text-black truncate">
                    {notification.url}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-2 text-xs text-black">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Notifications are sent instantly to all users with push
                    notifications enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Notification Management
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Configure system alerts, reminders, and student notifications.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/notifications"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                View Notifications
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
