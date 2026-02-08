"use client";

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users, TrendingUp, DollarSign, Award, Download,
  Calendar, Filter, BarChart3, PieChart, LineChart
} from 'lucide-react';
export function AdminReportingDashboard() {
  const [dateRange, setDateRange] = useState('30days');
  const [reportType, setReportType] = useState('overview');
  const metrics = [
    {
      title: 'Total Students',
      value: '2,547',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Enrollments',
      value: '1,834',
      change: '+8.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Completion Rate',
      value: '87.2%',
      change: '+3.1%',
      trend: 'up',
      icon: Award,
      color: 'text-brand-red-600',
      bgColor: 'bg-brand-red-100',
    },
    {
      title: 'Revenue (MTD)',
      value: '$124,580',
      change: '+15.7%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-brand-blue-600',
      bgColor: 'bg-red-100',
    },
  ];
  const programPerformance = [
    { name: 'CNA Certification', students: 342, completion: 92, revenue: 45600, placement: 94 },
    { name: 'HVAC Technician', students: 256, completion: 88, revenue: 38400, placement: 91 },
    { name: 'Barber Apprenticeship', students: 189, completion: 95, revenue: 28350, placement: 96 },
    { name: 'Web Development', students: 167, completion: 85, revenue: 25050, placement: 88 },
    { name: 'Truck Driving CDL', students: 145, completion: 90, revenue: 21750, placement: 93 },
  ];
  const recentActivity = [
    { type: 'enrollment', student: 'Sarah Johnson', program: 'CNA', time: '5 min ago' },
    { type: 'completion', student: 'Michael Chen', program: 'HVAC', time: '12 min ago' },
    { type: 'payment', student: 'Emily Rodriguez', amount: '$299', time: '23 min ago' },
    { type: 'enrollment', student: 'David Kim', program: 'Web Dev', time: '1 hour ago' },
    { type: 'completion', student: 'Lisa Williams', program: 'Barber', time: '2 hours ago' },
  ];
  const exportReport = (format: string) => {
    //
    alert(`Report exported as ${format.toUpperCase()}`);
  };
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
          <p className="text-black">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={metric.color} size={24} />
                  </div>
                  <span className={`text-sm font-semibold ${metric.trend === 'up' ? 'text-green-600' : 'text-brand-blue-600'}`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-black">{metric.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrollment Trends</CardTitle>
              <LineChart className="text-gray-400" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {[65, 72, 68, 85, 92, 88, 95, 90, 98, 102, 108, 115].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full    rounded-t transition-all hover:opacity-80"
                    style={{ height: `${(value / 115) * 100}%` }}
                  />
                  <div className="text-xs text-black mt-2">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Revenue by Program */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue by Program</CardTitle>
              <PieChart className="text-gray-400" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programPerformance.slice(0, 5).map((program, index) => {
                const colors = ['bg-brand-blue-600', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];
                const percentage = (program.revenue / 159150 * 100).toFixed(1);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{program.name}</span>
                      <span className="text-sm text-black">${program.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index]} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Program Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Program Performance</CardTitle>
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Program</th>
                  <th className="text-right py-3 px-4 font-semibold">Students</th>
                  <th className="text-right py-3 px-4 font-semibold">Completion</th>
                  <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold">Placement</th>
                </tr>
              </thead>
              <tbody>
                {programPerformance.map((program, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium">{program.name}</td>
                    <td className="py-3 px-4 text-right">{program.students}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-2 bg-green-100 text-green-800 rounded text-sm font-semibold">
                        {program.completion}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ${program.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-2 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                        {program.placement}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'enrollment' ? 'bg-blue-600' :
                  activity.type === 'completion' ? 'bg-green-600' :
                  'bg-orange-600'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">
                    {activity.type === 'enrollment' && `${activity.student} enrolled in ${activity.program}`}
                    {activity.type === 'completion' && `${activity.student} completed ${activity.program}`}
                    {activity.type === 'payment' && `${activity.student} made a payment of ${activity.amount}`}
                  </div>
                  <div className="text-sm text-black">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
