"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

export default function InstructorPerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [metrics, setMetrics] = useState({ totalStudents: 0, avgRating: 0, coursesTeaching: 0, completionRate: 0, responseTime: 0, engagement: 0 });
  const [courses, setCourses] = useState<{ name: string; students: number; rating: number; completion: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/instructor/performance?days=${timeRange}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setMetrics(m => d.data.metrics || m);
          setCourses(d.data.courses || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Instructor Performance</h1>
          <p className="text-white">Track your teaching effectiveness</p>
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
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{metrics.totalStudents}</p>
            <p className="text-sm text-brand-green-600">↑ 12% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-brand-orange-500">{metrics.avgRating}</p>
            <p className="text-sm text-black">⭐⭐⭐⭐⭐</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Courses Teaching</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{metrics.coursesTeaching}</p>
            <p className="text-sm text-black">Active courses</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold text-brand-green-600">{metrics.completionRate}%</p>
            <p className="text-sm text-brand-green-600">Above average</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-purple-600">{metrics.responseTime}h</p>
            <p className="text-sm text-brand-green-600">Excellent</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Student Engagement</h3>
            <p className="text-3xl font-bold text-indigo-600">{metrics.engagement}%</p>
            <p className="text-sm text-brand-green-600">Very high</p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Course Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-left py-3 px-4">Students</th>
                  <th className="text-left py-3 px-4">Rating</th>
                  <th className="text-left py-3 px-4">Completion</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{course.name}</td>
                    <td className="py-3 px-4">{course.students}</td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-500">★</span> {course.rating}
                    </td>
                    <td className="py-3 px-4">{course.completion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6   ">
            <h3 className="font-bold mb-2">🎯 Strength</h3>
            <p className="text-sm text-black">
              Your response time is 40% faster than average. Students appreciate your quick feedback!
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">💡 Tip</h3>
            <p className="text-sm text-black">
              Consider adding more interactive elements to boost engagement in React Fundamentals.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">🏆 Achievement</h3>
            <p className="text-sm text-black">
              You've maintained a 4.8+ rating for 6 months straight. Excellent work!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
