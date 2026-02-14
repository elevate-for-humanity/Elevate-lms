'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  Upload,
  Search,
  Filter,
  Download,
  BarChart3,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { createClient } from '@/lib/supabase/client';

interface DashboardProps {
  role: string;
  userId: string;
}

export default function EnhancedDashboard({ role, userId }: DashboardProps) {
  const [stats, setStats] = useState({
    notifications: 0,
    messages: 0,
    achievements: 0,
    progress: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    // Load notifications count
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Load messages count
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    // Load achievements count
    const { count: achCount } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Load user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    setStats({
      notifications: notifCount || 0,
      messages: msgCount || 0,
      achievements: achCount || 0,
      progress: progress?.total_points || 0,
    });

    // Load recent activity
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentActivity(notifications || []);
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-black">
              {stats.notifications}
            </span>
          </div>
          <p className="text-sm text-black">Unread Notifications</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-brand-blue-600" />
            <span className="text-2xl font-bold text-black">
              {stats.messages}
            </span>
          </div>
          <p className="text-sm text-black">New Messages</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-black">
              {stats.achievements}
            </span>
          </div>
          <p className="text-sm text-black">Achievements</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-black">
              {stats.progress}
            </span>
          </div>
          <p className="text-sm text-black">Total Points</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <a
            href="/messages"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <MessageSquare className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">
              Messages
            </span>
          </a>

          <a
            href="/calendar"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Calendar className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">
              Calendar
            </span>
          </a>

          <a
            href="/documents"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Upload className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">
              Documents
            </span>
          </a>

          <a
            href="/achievements"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Award className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">
              Achievements
            </span>
          </a>

          <a
            href="/search"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Search className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">Search</span>
          </a>

          <a
            href="/reports"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-black mb-2" />
            <span className="text-xs font-semibold text-black">
              Reports
            </span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-black mb-4">
          Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-black text-sm">
                    {activity.title}
                  </p>
                  <p className="text-sm text-black">{activity.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
