
"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  TrendingUp,
  Award,
  Target,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Deadline {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'course';
  dueDate: Date;
  courseTitle: string;
  courseId: string;
}

interface Activity {
  id: string;
  type: 'completed' | 'started' | 'graded' | 'enrolled';
  title: string;
  timestamp: Date;
  link?: string;
}

interface ProgressStats {
  coursesCompleted: number;
  certificatesEarned: number;
  totalHours: number;
  currentStreak: number;
}

export function RightSidebar() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    coursesCompleted: 0,
    certificatesEarned: 0,
    totalHours: 0,
    currentStreak: 0,
  });
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboardData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load upcoming deadlines
      await loadDeadlines(user.id);

      // Load recent activity
      await loadActivity(user.id);

      // Load progress stats
      await loadStats(user.id);

      // Load notifications count
      await loadNotifications(user.id);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  }

  async function loadDeadlines(userId: string) {
    // Get assignments with upcoming deadlines
    const { data: assignments } = await supabase
      .from('assignments')
      .select(
        `
        id,
        title,
        due_date,
        course_id,
        courses (
          title
        )
      `
      )
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(5);

    if (assignments) {
      const formattedDeadlines: Deadline[] = assignments.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'assignment' as const,
        dueDate: new Date(a.due_date),
        courseTitle: (a.courses as string)?.title || 'Unknown Course',
        courseId: a.course_id,
      }));
      setDeadlines(formattedDeadlines);
    }
  }

  async function loadActivity(userId: string) {
    // Get recent activity from logs
    const { data: logs } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logs) {
      const formattedActivity: Activity[] = logs.map((log) => ({
        id: log.id,
        type: log.activity_type as any,
        title: log.metadata?.title || 'Activity',
        timestamp: new Date(log.created_at),
        link: log.metadata?.link,
      }));
      setActivities(formattedActivity);
    }
  }

  async function loadStats(userId: string) {
    // Get completed courses
    const { count: completedCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get certificates
    const { count: certCount } = await supabase
      .from('issued_certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    setStats({
      coursesCompleted: completedCount || 0,
      certificatesEarned: certCount || 0,
      totalHours: 45, // Calculate from lesson progress
      currentStreak: 3, // Calculate from activity logs
    });
  }

  async function loadNotifications(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setNotifications(count || 0);
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 p-4 space-y-4 overflow-y-auto">
      {/* Quick Actions */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-orange-600" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link
            href="/lms/courses"
            className="block px-3 py-2 text-sm text-black hover:bg-white hover:text-brand-red-700 rounded-lg transition"
          >
            Browse Courses
          </Link>
          <Link
            href="/lms/assignments"
            className="block px-3 py-2 text-sm text-black hover:bg-white hover:text-brand-red-700 rounded-lg transition"
          >
            View Assignments
          </Link>
          <Link
            href="/lms/grades"
            className="block px-3 py-2 text-sm text-black hover:bg-white hover:text-brand-red-700 rounded-lg transition"
          >
            Check Grades
          </Link>
          <Link
            href="/lms/certificates"
            className="block px-3 py-2 text-sm text-black hover:bg-white hover:text-brand-red-700 rounded-lg transition"
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
        {deadlines.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming deadlines</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <Link
                key={deadline.id}
                href={`/lms/courses/${deadline.courseId}`}
                className="block border-l-2 border-brand-orange-400 pl-3 hover:bg-slate-50 -ml-4 pl-4 py-2 transition"
              >
                <p className="text-sm font-medium text-black">
                  {deadline.title}
                </p>
                <p className="text-xs text-black">{deadline.courseTitle}</p>
                <p className="text-xs text-brand-orange-600 font-medium mt-1">
                  {formatDate(deadline.dueDate)}
                </p>
              </Link>
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
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
        <Link
          href="/lms/calendar"
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
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    activity.type === 'completed'
                      ? 'bg-brand-green-500'
                      : activity.type === 'graded'
                        ? 'bg-brand-blue-500'
                        : activity.type === 'enrolled'
                          ? 'bg-purple-500'
                          : 'bg-yellow-500'
                  }`}
                />
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
          href="/lms/notifications"
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
            <span className="font-bold">{stats.coursesCompleted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Certificates Earned</span>
            <span className="font-bold">{stats.certificatesEarned}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Hours</span>
            <span className="font-bold">{stats.totalHours}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Current Streak</span>
            <span className="font-bold">{stats.currentStreak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
