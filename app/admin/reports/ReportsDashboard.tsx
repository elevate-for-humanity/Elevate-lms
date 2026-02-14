'use client';

import React from 'react';

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  totalStudents: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedCourses: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  totalCertificates: number;
  completionRate: number;
  approvalRate: number;
}

interface Enrollment {
  id: string;
  created_at: string;
  status: string;
  courses?: { title: string };
  profiles?: { full_name: string };
}

interface ProgramStat {
  courses?: { title: string };
}

interface ReportsDashboardProps {
  stats: Stats;
  recentEnrollments: Enrollment[];
  programStats: ProgramStat[];
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export default function ReportsDashboard({
  stats,
  recentEnrollments,
  programStats,
}: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState('30');

  // Process enrollment trend data
  const enrollmentTrendData = recentEnrollments
    .reduce((acc: Array<{ date: string; enrollments: number }>, enrollment) => {
      const date = new Date(enrollment.created_at).toLocaleDateString();
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.enrollments += 1;
      } else {
        acc.push({ date, enrollments: 1 });
      }
      return acc;
    }, [])
    .slice(-7); // Last 7 days

  // Process status distribution
  const statusData = [
    { name: 'Active', value: stats.activeEnrollments },
    { name: 'Completed', value: stats.completedCourses },
    { name: 'Pending', value: stats.pendingApplications },
  ];

  // Process program popularity
  const programPopularityData = programStats.reduce<
    Array<{ name: string; enrollments: number }>
  >((acc, item: Enrollment) => {
    const courseTitle = item.courses?.title || 'Unknown';
    const existing = acc.find((p) => p.name === courseTitle);
    if (existing) {
      existing.enrollments += 1;
    } else {
      acc.push({ name: courseTitle, enrollments: 1 });
    }
    return acc;
  }, []);
  const programPopularity = programPopularityData
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-black">
              Total Students
            </h3>
            <svg
              className="w-8 h-8 text-brand-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-black">
            {stats.totalStudents}
          </p>
          <p className="text-sm text-black mt-1">Registered users</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-black">
              Total Enrollments
            </h3>
            <svg
              className="w-8 h-8 text-brand-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-black">
            {stats.totalEnrollments}
          </p>
          <p className="text-sm text-brand-green-600 mt-1">
            {stats.activeEnrollments} active
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-black">
              Completion Rate
            </h3>
            <svg
              className="w-8 h-8 text-brand-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-black">
            {stats.completionRate}%
          </p>
          <p className="text-sm text-black mt-1">
            {stats.completedCourses} completed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-black">
              Certificates Issued
            </h3>
            <svg
              className="w-8 h-8 text-brand-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-black">
            {stats.totalCertificates}
          </p>
          <p className="text-sm text-black mt-1">Total awarded</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Enrollment Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Enrollment Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Program Popularity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top 5 Most Popular Programs
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programPopularity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="enrollments" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Enrollments Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Recent Enrollments (Last 30 Days)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEnrollments.length > 0 ? (
                recentEnrollments.slice(0, 10).map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      {enrollment.profiles?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {enrollment.courses?.title || 'Unknown Course'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          enrollment.status === 'active'
                            ? 'bg-brand-green-100 text-green-800'
                            : enrollment.status === 'completed'
                              ? 'bg-brand-blue-100 text-brand-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {new Date(enrollment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-black"
                  >
                    No recent enrollments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-black mb-2">
            Total Applications
          </h3>
          <p className="text-3xl font-bold text-black">
            {stats.totalApplications}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-black mb-2">
            Pending Review
          </h3>
          <p className="text-3xl font-bold text-brand-orange-600">
            {stats.pendingApplications}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-black mb-2">
            Approval Rate
          </h3>
          <p className="text-3xl font-bold text-brand-green-600">
            {stats.approvalRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
