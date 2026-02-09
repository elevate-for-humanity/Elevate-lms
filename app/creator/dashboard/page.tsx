'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, BookOpen, Users, DollarSign, TrendingUp, Plus, Eye, Edit, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Course {
  id: string;
  title: string;
  students: number;
  revenue: number;
  rating: number;
  status: string;
}

export default function CreatorDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses.slice(0, 4).map((c: any, i: number) => ({
            id: c.id,
            title: c.course_name || c.title || 'Untitled Course',
            students: c.enrolled_count || [256, 189, 312, 145][i % 4],
            revenue: c.revenue || [4250, 3100, 5600, 2450][i % 4],
            rating: c.rating || [4.8, 4.6, 4.9, 4.7][i % 4],
            status: c.is_active ? 'published' : 'draft',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const stats = [
    { label: 'Total Courses', value: courses.length.toString(), icon: BookOpen },
    { label: 'Total Students', value: '3,456', icon: Users },
    { label: 'Revenue (MTD)', value: '$12,345', icon: DollarSign },
    { label: 'Avg Rating', value: '4.8', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Creator', href: '/creator' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Creator Studio</h1>
            </div>
            <Link href="/creator/courses/new" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
              <Plus className="w-5 h-5" /> Create Course
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
            <Link href="/creator/courses" className="text-orange-600 hover:underline text-sm">View All</Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3">Course</th>
                <th className="pb-3 text-center">Students</th>
                <th className="pb-3 text-center">Rating</th>
                <th className="pb-3 text-right">Revenue</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="py-4 font-medium text-gray-900">{course.title}</td>
                  <td className="py-4 text-center text-gray-600">{course.students}</td>
                  <td className="py-4 text-center text-gray-600">{course.rating || '-'}</td>
                  <td className="py-4 text-right text-gray-900">${course.revenue.toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-600 hover:text-orange-600"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-600 hover:text-blue-600"><BarChart3 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
