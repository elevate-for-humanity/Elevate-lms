"use client";

import React from 'react';

import { useState } from 'react';
import { Calendar, Clock, Bell, TrendingUp, BookOpen, Award, Target } from 'lucide-react';
import Link from 'next/link';

interface UpcomingDeadline {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'course';
  dueDate: Date;
  courseTitle: string;
}

interface RecentActivity {
  id: string;
  type: 'completed' | 'started' | 'graded';
  title: string;
  timestamp: Date;
}

interface DashboardSidebarProps {
  upcomingDeadlines?: UpcomingDeadline[];
  recentActivity?: RecentActivity[];
  notifications?: number;
}

export function DashboardSidebar({
  upcomingDeadlines = [],
  recentActivity = [],
  notifications = 0
}: DashboardSidebarProps) {
  const [activeBlock, setActiveBlock] = useState<string>('calendar');

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-orange-600" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link
            href="/learner/courses"
            className="block px-3 py-2 text-sm text-black hover:bg-brand-red-50 hover:text-brand-red-700 rounded-lg transition"
          >
            Browse Courses
          </Link>
          <Link
            href="/learner/assignments"
            className="block px-3 py-2 text-sm text-black hover:bg-brand-red-50 hover:text-brand-red-700 rounded-lg transition"
          >
            View Assignments
          </Link>
          <Link
            href="/learner/grades"
            className="block px-3 py-2 text-sm text-black hover:bg-brand-red-50 hover:text-brand-red-700 rounded-lg transition"
          >
            Check Grades
          </Link>
          <Link
            href="/learner/certificates"
            className="block px-3 py-2 text-sm text-black hover:bg-brand-red-50 hover:text-brand-red-700 rounded-lg transition"
          >
            My Certificates
          </Link>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-orange-600" />
          Upcoming Deadlines
        </h3>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming deadlines</p>
        ) : (
          <div className="space-y-3">
            {upcomingDeadlines.slice(0, 5).map((deadline) => (
              <div key={deadline.id} className="border-l-2 border-brand-orange-400 pl-3">
                <p className="text-sm font-medium text-black">{deadline.title}</p>
                <p className="text-xs text-black">{deadline.courseTitle}</p>
                <p className="text-xs text-brand-orange-600 font-medium mt-1">
                  {formatDate(deadline.dueDate)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Widget */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-blue-600" />
          Calendar
        </h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-black">
            {new Date().getDate()}
          </div>
          <div className="text-sm text-black">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <Link
          href="/learner/calendar"
          className="block mt-3 text-center text-sm text-brand-orange-600 hover:text-brand-red-700 font-medium"
        >
          View Full Calendar →
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  activity.type === 'completed' ? 'bg-brand-green-500' :
                  activity.type === 'graded' ? 'bg-brand-blue-500' :
                  'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-black">{activity.title}</p>
                  <p className="text-xs text-slate-500">
                    {activity.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-orange-600" />
          Notifications
          {notifications > 0 && (
            <span className="ml-auto bg-brand-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
              {notifications}
            </span>
          )}
        </h3>
        <Link
          href="/learner/notifications"
          className="block text-sm text-brand-orange-600 hover:text-brand-red-700 font-medium"
        >
          View All Notifications →
        </Link>
      </div>

      {/* Progress Summary */}
      <div className="   rounded-lg p-4 text-white">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Your Progress
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Courses Completed</span>
            <span className="font-bold">3</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Certificates Earned</span>
            <span className="font-bold">2</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Hours</span>
            <span className="font-bold">45</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeftSidebar() {
  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-4">
      <nav role="navigation" aria-label="Main navigation" className="space-y-1">
        <Link
          href="/lms/dashboard"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-black bg-white rounded-lg"
        >
          <BookOpen className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/learner/courses"
          className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition"
        >
          <BookOpen className="w-4 h-4" />
          My Courses
        </Link>
        <Link
          href="/learner/calendar"
          className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition"
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </Link>
        <Link
          href="/learner/grades"
          className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition"
        >
          <Award className="w-4 h-4" />
          Grades
        </Link>
        <Link
          href="/learner/notifications"
          className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition"
        >
          <Bell className="w-4 h-4" />
          Notifications
        </Link>
      </nav>
    </div>
  );
}
