"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EmployerWorkforceAnalytics() {
  const [timeRange, setTimeRange] = useState('30');

  const metrics = {
    totalHires: 45,
    activePositions: 12,
    avgTimeToHire: 28,
    retentionRate: 87,
    trainingCompletion: 92,
    skillsGapScore: 68,
  };

  const hiringTrends = [
    { month: 'Jan', hires: 8, applications: 45 },
    { month: 'Feb', hires: 6, applications: 38 },
    { month: 'Mar', hires: 10, applications: 52 },
    { month: 'Apr', hires: 7, applications: 41 },
    { month: 'May', hires: 9, applications: 48 },
    { month: 'Jun', hires: 5, applications: 35 },
  ];

  const skillsDemand = [
    { skill: 'JavaScript', demand: 95, supply: 78 },
    { skill: 'React', demand: 88, supply: 65 },
    { skill: 'Node.js', demand: 82, supply: 58 },
    { skill: 'Python', demand: 75, supply: 70 },
    { skill: 'AWS', demand: 90, supply: 45 },
  ];

  const departmentMetrics = [
    { name: 'Engineering', headcount: 45, openings: 5, avgTenure: '2.3 years' },
    { name: 'Healthcare', headcount: 32, openings: 3, avgTenure: '3.1 years' },
    { name: 'Operations', headcount: 28, openings: 4, avgTenure: '1.8 years' },
  ];

  const maxHires = Math.max(...hiringTrends.map(t => t.hires));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Workforce Analytics</h1>
          <p className="text-brand-red-100">Data-driven insights for strategic workforce planning</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Overview</h2>
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Total Hires</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{metrics.totalHires}</p>
            <p className="text-sm text-brand-green-600">↑ 15% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Active Positions</h3>
            <p className="text-3xl font-bold text-brand-orange-500">{metrics.activePositions}</p>
            <p className="text-sm text-black">Across all departments</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Avg Time to Hire</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{metrics.avgTimeToHire} days</p>
            <p className="text-sm text-brand-green-600">↓ 8% improvement</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Retention Rate</h3>
            <p className="text-3xl font-bold text-brand-green-600">{metrics.retentionRate}%</p>
            <p className="text-sm text-brand-green-600">↑ 3% from last year</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Training Completion</h3>
            <p className="text-3xl font-bold text-purple-600">{metrics.trainingCompletion}%</p>
            <p className="text-sm text-brand-green-600">Above target</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Skills Gap Score</h3>
            <p className="text-3xl font-bold text-yellow-600">{metrics.skillsGapScore}%</p>
            <p className="text-sm text-yellow-600">Needs attention</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Hiring Trends</h3>
            <div className="space-y-3">
              {hiringTrends.map((trend) => (
                <div key={trend.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{trend.month}</span>
                    <span className="text-black">{trend.hires} hires • {trend.applications} applications</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="   h-2 rounded-full"
                        style={{ width: `${(trend.hires / maxHires) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Skills Supply vs Demand</h3>
            <div className="space-y-4">
              {skillsDemand.map((skill) => (
                <div key={skill.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-black">
                      Demand: {skill.demand}% • Supply: {skill.supply}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-orange-600 h-2 rounded-full"
                          style={{ width: `${skill.demand}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full"
                          style={{ width: `${skill.supply}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {skill.demand > skill.supply + 10 && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ High demand, low supply</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Department Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Headcount</th>
                  <th className="text-left py-3 px-4">Open Positions</th>
                  <th className="text-left py-3 px-4">Avg Tenure</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentMetrics.map((dept) => (
                  <tr key={dept.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{dept.name}</td>
                    <td className="py-3 px-4">{dept.headcount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-2 bg-brand-orange-100 text-brand-orange-700 text-xs rounded">
                        {dept.openings} open
                      </span>
                    </td>
                    <td className="py-3 px-4">{dept.avgTenure}</td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="secondary">View Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6   ">
            <h3 className="font-bold mb-3">💡 Insight</h3>
            <p className="text-sm text-black">
              Your time- has improved by 8% this quarter. Consider sharing your recruitment process as a best practice.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-3">🎯 Recommendation</h3>
            <p className="text-sm text-black">
              Partner with Elevate for Humanity to address the AWS skills gap. 15 qualified candidates available.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-3">📈 Trend</h3>
            <p className="text-sm text-black">
              Engineering roles are taking 35% longer to fill. Consider expanding your talent pipeline.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
