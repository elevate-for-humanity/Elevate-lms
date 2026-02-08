"use client";

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Bell, Circle, Award, BookOpen, AlertCircle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'success',
    icon: Circle,
    color: 'text-green-600',
    title: 'Module Completed',
    message: 'You completed Module 2 in CNA Certification',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 2,
    type: 'achievement',
    icon: Award,
    color: 'text-orange-600',
    title: 'New Certificate',
    message: 'Your Barber Apprenticeship certificate is ready',
    time: '1 day ago',
    unread: true,
  },
  {
    id: 3,
    type: 'reminder',
    icon: AlertCircle,
    color: 'text-brand-blue-600',
    title: 'Assignment Due Soon',
    message: 'Module 3 Quiz due in 2 days',
    time: '1 day ago',
    unread: true,
  },
  {
    id: 4,
    type: 'info',
    icon: BookOpen,
    color: 'text-brand-blue-600',
    title: 'New Course Available',
    message: 'Check out the new HVAC Advanced module',
    time: '3 days ago',
    unread: false,
  },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-10 w-10 text-black" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-brand-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-black">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notif.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${notif.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black text-sm">
                          {notif.title}
                        </p>
                        <p className="text-sm text-black mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.time}
                        </p>
                      </div>
                      {notif.unread && (
                        <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <button className="text-sm text-brand-blue-600 hover:text-blue-700 font-medium">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
