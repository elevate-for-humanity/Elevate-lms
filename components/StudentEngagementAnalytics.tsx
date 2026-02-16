"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StudentEngagementAnalytics() {
  const [timeRange, setTimeRange] = useState('30');

  const metrics = {
    activeStudents: 1245,
    engagementRate: 78,
    avgSessionTime: 45,
    completionRate: 68,
    atRiskStudents: 42,
    highPerformers: 156,
  };

  const engagementTrends = [
    { week: 'Week 1', rate: 72, active: 1180 },
    { week: 'Week 2', rate: 75, active: 1200 },
    { week: 'Week 3', rate: 78, active: 1245 },
    { week: 'Week 4', rate: 76, active: 1220 },
  ];

  const activityTypes = [
    { type: 'Video Lessons', percentage: 35, count: 4250 },
    { type: 'Quizzes', percentage: 25, count: 3050 },
    { type: 'Assignments', percentage: 20, count: 2440 },
    { type: 'Discussion Forums', percentage: 12, count: 1460 },
    { type: 'Live Sessions', percentage: 8, count: 975 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Student Engagement Analytics</h1>
          <p className="text-red-100">Monitor and improve student participation</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Engagement Overview</h2>
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Active Students</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{metrics.activeStudents.toLocaleString()}</p>
            <p className="text-sm text-green-600">↑ 8% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Engagement Rate</h3>
            <p className="text-3xl font-bold text-orange-500">{metrics.engagementRate}%</p>
            <p className="text-sm text-green-600">↑ 3% improvement</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Avg Session Time</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{metrics.avgSessionTime} min</p>
            <p className="text-sm text-black">Per student</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold text-green-600">{metrics.completionRate}%</p>
            <p className="text-sm text-green-600">Above target</p>
          </Card>

          <Card className="p-6 bg-yellow-50">
            <h3 className="text-sm text-black mb-2">At-Risk Students</h3>
            <p className="text-3xl font-bold text-yellow-600">{metrics.atRiskStudents}</p>
            <p className="text-sm text-yellow-700">Need intervention</p>
          </Card>

          <Card className="p-6 bg-green-50">
            <h3 className="text-sm text-black mb-2">High Performers</h3>
            <p className="text-3xl font-bold text-green-600">{metrics.highPerformers}</p>
            <p className="text-sm text-green-700">Top 10%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Engagement Trends</h3>
            <div className="space-y-4">
              {engagementTrends.map((trend) => (
                <div key={trend.week}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{trend.week}</span>
                    <span className="text-black">{trend.rate}% • {trend.active} active</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="   h-2 rounded-full"
                      style={{ width: `${trend.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Activity Breakdown</h3>
            <div className="space-y-3">
              {activityTypes.map((activity) => (
                <div key={activity.type} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{activity.type}</span>
                      <span className="text-black">{activity.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-blue-600 h-2 rounded-full"
                        style={{ width: `${activity.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-brand-blue-600">{activity.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6   ">
            <h3 className="font-bold mb-2">⚠️ Alert</h3>
            <p className="text-sm text-black">
              42 students haven't logged in for 7+ days. Consider sending re-engagement emails.
            </p>
            <Button size="sm" className="mt-3 w-full">Send Reminders</Button>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">• Success</h3>
            <p className="text-sm text-black">
              Engagement rate increased 3% this month. Video content is driving participation.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">💡 Insight</h3>
            <p className="text-sm text-black">
              Peak activity hours are 7-9 PM. Schedule live sessions during this window.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
