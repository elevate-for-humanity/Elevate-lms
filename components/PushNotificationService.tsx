"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export function PushNotificationService() {
  const [isEnabled, setIsEnabled] = useState(false);

  const notifications = [
    { id: '1', title: 'New Assignment', body: 'JavaScript project has been posted', time: '5 min ago' },
    { id: '2', title: 'Class Reminder', body: 'React workshop starts in 30 minutes', time: '25 min ago' },
    { id: '3', title: 'Grade Posted', body: 'Your assignment has been graded', time: '2 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Push Notifications</h1>
          <p className="text-white">Stay updated with instant alerts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-1">Enable Push Notifications</h2>
              <p className="text-sm text-black">Get instant updates on your device</p>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isEnabled ? 'bg-brand-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                isEnabled ? 'transform translate-x-6' : ''
              }`} />
            </button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold">{notif.title}</h4>
                  <span className="text-xs text-gray-500">{notif.time}</span>
                </div>
                <p className="text-sm text-black">{notif.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { label: 'Assignment Updates', enabled: true },
              { label: 'Class Reminders', enabled: true },
              { label: 'Grade Notifications', enabled: true },
              { label: 'Course Announcements', enabled: true },
              { label: 'Marketing Messages', enabled: true },
            ].map((pref, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{pref.label}</span>
                <input type="checkbox" defaultChecked={pref.enabled} className="w-5 h-5" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
