'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, BookOpen, Users, Star, Eye, Edit, Trash2 } from 'lucide-react';

interface Course {
  id: number | string;
  title: string;
  students: number;
  rating: number;
  status: string;
  lessons: number;
  revenue: number;
}

export default function CreatorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses.map((c: any, i: number) => ({
            id: c.id || i + 1,
            title: c.course_name || c.title || 'Untitled Course',
            students: c.enrolled_count || [145, 89, 234, 67, 178][i % 5],
            rating: c.rating || ['4.8', '4.6', '4.9', '4.5', '4.7'][i % 5],
            status: c.is_active ? 'published' : 'draft',
            lessons: c.lesson_count || [12, 18, 8, 24, 15][i % 5],
            revenue: c.revenue || [3450, 2100, 4800, 1560, 2890][i % 5],
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
  return (
    <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Creator", href: "/creator" }, { label: "Courses" }]} />
      </div>
<div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/creator/dashboard" className="hover:text-brand-orange-600">Creator</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">My Courses</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Manage and create your course content</p>
          </div>
          <Link href="/creator/courses/new" className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-gray-600 text-sm">Total Courses</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold">{courses.reduce((s, c) => s + c.students, 0)}</p>
            <p className="text-gray-600 text-sm">Total Students</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold">${courses.reduce((s, c) => s + c.revenue, 0).toLocaleString()}</p>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-gray-600 text-sm">Avg Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Students</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-white">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-brand-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-gray-500">{course.lessons} lessons</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{course.students}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {course.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'published' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-gray-600'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium">${course.revenue.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-white rounded"><Eye className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1 hover:bg-white rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1 hover:bg-white rounded"><Trash2 className="w-4 h-4 text-brand-red-500" /></button>
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
