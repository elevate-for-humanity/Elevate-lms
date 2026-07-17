'use client';

import { useState } from 'react';
import { Users, BookOpen, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface Stats {
  totalStudents: number;
  activePrograms: number;
  totalRevenue: number;
  monthlyGrowth: number;
  enrollmentsThisMonth: number;
  completionsThisMonth: number;
}

export default function SiteStatsClient() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activePrograms: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    enrollmentsThisMonth: 0,
    completionsThisMonth: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Site Statistics</h1>
        <div className="flex items-center gap-4">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={fetchStats} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><BookOpen className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Active Programs</p>
              <p className="text-2xl font-bold">{stats.activePrograms}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><DollarSign className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Monthly Growth</p>
              <p className="text-2xl font-bold">{stats.monthlyGrowth}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-500 mb-2">Enrollments This Month</p>
          <p className="text-3xl font-bold text-blue-600">{stats.enrollmentsThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-500 mb-2">Completions This Month</p>
          <p className="text-3xl font-bold text-green-600">{stats.completionsThisMonth}</p>
        </div>
      </div>
    </div>
  );
}
