'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus, Users, FileText } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  status: string;
  modules_count?: number;
}

export default function StudioPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Fetch courses
      const { data } = await supabase
        .from('courses')
        .select('id, title, status')
        .order('created_at', { ascending: false })
        .limit(20);

      setCourses(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Course Studio</h1>
            <p className="text-slate-600">Create and manage your training courses</p>
          </div>
          <Link
            href="/admin/studio/course"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Course
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/studio/course" className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create Course</h3>
            <p className="text-slate-600 text-sm">Build a new training course with AI assistance</p>
          </Link>
          <Link href="/admin/courses" className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <FileText className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Courses</h3>
            <p className="text-slate-600 text-sm">View and edit existing courses</p>
          </Link>
          <Link href="/admin/dev-studio" className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <Users className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dev Studio</h3>
            <p className="text-slate-600 text-sm">Developer tools and system monitoring</p>
          </Link>
        </div>

        {/* Course List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Courses</h2>
          </div>
          {courses.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {courses.map(course => (
                <Link
                  key={course.id}
                  href={`/admin/studio/course?courseId=${course.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                    <div>
                      <h3 className="font-medium text-slate-900">{course.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        course.status === 'published' ? 'bg-green-100 text-green-700' :
                        course.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400">Edit →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No courses yet</p>
              <Link href="/admin/studio/course" className="text-blue-600 hover:text-blue-700 font-medium">
                Create your first course →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
