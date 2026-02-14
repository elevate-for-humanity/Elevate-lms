"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export function NotificationCenter() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Assignment Graded',
      message: 'Your JavaScript assignment has been graded. Score: 95/100',
      timestamp: '5 minutes ago',
      read: false,
      actionUrl: '/lms/assignments/1',
    },
    {
      id: '2',
      type: 'info',
      title: 'New Course Available',
      message: 'Advanced React Patterns is now available for enrollment',
      timestamp: '1 hour ago',
      read: false,
      actionUrl: '/courses/advanced-react',
    },
    {
      id: '3',
      type: 'warning',
      title: 'Assignment Due Soon',
      message: 'Database Design project is due in 2 days',
      timestamp: '3 hours ago',
      read: true,
      actionUrl: '/lms/assignments/2',
    },
    {
      id: '4',
      type: 'success',
      title: 'Certificate Issued',
      message: 'Your Full-Stack Development certificate is ready',
      timestamp: '1 day ago',
      read: true,
      actionUrl: '/lms/certificates',
    },
    {
      id: '5',
      type: 'info',
      title: 'Live Session Reminder',
      message: 'React Advanced workshop starts in 30 minutes',
      timestamp: '2 days ago',
      read: true,
    },
  ];

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠️';
      case 'error': return '✕';
      default: return 'ℹ️';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-brand-blue-100 text-brand-blue-700 border-brand-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Notifications</h1>
          <p className="text-red-100">Stay updated with real-time alerts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-brand-orange-600 text-white' : 'bg-white text-black border'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'unread' ? 'bg-brand-orange-600 text-white' : 'bg-white text-black border'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <Button variant="secondary" size="sm">Mark All as Read</Button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`p-4 border-l-4 ${
              !notification.read ? 'bg-brand-blue-50' : ''
            } ${getColor(notification.type)}`}>
              <div className="flex gap-4">
                <div className="text-2xl">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-brand-orange-600 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-black mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{notification.timestamp}</span>
                    {notification.actionUrl && (
                      <Button size="sm" variant="secondary">View</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-black mb-2">No notifications</p>
            <p className="text-gray-500">You're all caught up!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
