"use client";

import React from 'react';

import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
CheckCircle, } from 'lucide-react';

interface Metrics {
  totalUsers: number;
  activeStudents: number;
  totalEnrollments: number;
  completedCourses: number;
  totalApplications: number;
  recentLogins24h: number;
  activeCourses: number;
  totalCertificates: number;
  completionRate: number;
}

interface RecentActivity {
  timestamp: string;
  courseTitle: string;
  type: string;
}

interface MetricsData {
  timestamp: string;
  verified: boolean;
  metrics: Metrics;
  recentActivity: RecentActivity[];
  dataSource: string;
  lastUpdated: string;
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/public/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('Unable to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-brand-blue-600" />
          <span className="ml-3 text-black">Loading live metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-6">
        <p className="text-brand-red-700">{error || 'Metrics unavailable'}</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: metrics.metrics.totalUsers.toLocaleString('en-US'),
      icon: Users,
      color: 'blue',
      description: 'Registered platform users',
    },
    {
      label: 'Active Students',
      value: metrics.metrics.activeStudents.toLocaleString('en-US'),
      icon: BookOpen,
      color: 'green',
      description: 'Enrolled in last 30 days',
    },
    {
      label: 'Total Enrollments',
      value: metrics.metrics.totalEnrollments.toLocaleString('en-US'),
      icon: TrendingUp,
      color: 'purple',
      description: 'All-time course enrollments',
    },
    {
      label: 'Completed Courses',
      value: metrics.metrics.completedCourses.toLocaleString('en-US'),
      icon: CheckCircle,
      color: 'green',
      description: 'Successfully completed',
    },
    {
      label: 'Applications',
      value: metrics.metrics.totalApplications.toLocaleString('en-US'),
      icon: BarChart3,
      color: 'orange',
      description: 'Total program applications',
    },
    {
      label: 'Recent Logins',
      value: metrics.metrics.recentLogins24h.toLocaleString('en-US'),
      icon: Activity,
      color: 'blue',
      description: 'Last 24 hours',
    },
    {
      label: 'Active Courses',
      value: metrics.metrics.activeCourses.toLocaleString('en-US'),
      icon: BookOpen,
      color: 'indigo',
      description: 'Published and available',
    },
    {
      label: 'Certificates Issued',
      value: metrics.metrics.totalCertificates.toLocaleString('en-US'),
      icon: Award,
      color: 'yellow',
      description: 'Total certificates awarded',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-brand-blue-50 text-brand-blue-600',
    green: 'bg-brand-green-50 text-brand-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-brand-orange-50 text-brand-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / 1000
    );
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Verification Badge */}
      <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 flex items-center gap-3">
        <span className="text-slate-500 flex-shrink-0">•</span>
        <div>
          <p className="text-sm font-semibold text-brand-green-900">
            • Live Data Verified
          </p>
          <p className="text-xs text-brand-green-700">
            Real-time metrics from production database • Last updated:{' '}
            {formatTimeAgo(metrics.lastUpdated)}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-10 w-10" />
                </div>
                <Activity className="h-4 w-4 text-brand-green-500 animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-black mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-slate-500">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            Course Completion Rate
          </h3>
          <span className="text-2xl font-bold text-brand-green-600">
            {metrics.metrics.completionRate}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-1000"
            style={{ width: `${metrics.metrics.completionRate}%` }}
          />
        </div>
        <p className="text-sm text-black mt-2">
          {metrics.metrics.completedCourses.toLocaleString('en-US')} of{' '}
          {metrics.metrics.totalEnrollments.toLocaleString('en-US')} enrollments
          completed
        </p>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Recent Activity</h3>
          <span className="ml-auto text-xs text-slate-500">Live updates</span>
        </div>
        <div className="space-y-3">
          {metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    New enrollment: {activity.courseTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-black text-center">
          <strong>Data Source:</strong> {metrics.dataSource} •
          <strong> Updated:</strong>{' '}
          {new Date(metrics.lastUpdated).toLocaleString('en-US')} •
          <strong> Verified:</strong> {metrics.verified ? '• Yes' : '✗ No'}
        </p>
      </div>
    </div>
  );
}
