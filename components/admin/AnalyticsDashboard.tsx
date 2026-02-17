"use client";

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-tenant-id': 'default' // implemented
  }
}).then((r) => r.json());

export default function AnalyticsDashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/analytics/overview', fetcher, {
    refreshInterval: 15000 // Refresh every 15 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-slate-50 p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-8 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-brand-red-200 bg-brand-red-50 p-4">
        <p className="text-sm text-brand-orange-600">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Active Users</p>
          <p className="text-3xl font-semibold text-black">{data.activeUsers}</p>
          <p className="text-xs text-slate-400 mt-1">Last 15 minutes</p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Courses in Progress</p>
          <p className="text-3xl font-semibold text-brand-blue-600">{data.coursesInProgress}</p>
          <p className="text-xs text-slate-400 mt-1">Currently active</p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Completions Today</p>
          <p className="text-3xl font-semibold text-brand-green-600">{data.completionsToday}</p>
          <p className="text-xs text-slate-400 mt-1">Since midnight</p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">New Enrollments</p>
          <p className="text-3xl font-semibold text-purple-600">{data.enrollmentsToday}</p>
          <p className="text-xs text-slate-400 mt-1">Today</p>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-right">
        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
