import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate For Humanity',
  description: 'Instructor resources and management portal.',
};

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Users, BookOpen, ClipboardCheck, GraduationCap, Clock, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate For Humanity',
  description: 'Instructor resources and management portal.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorPage() {
  const supabase = await createClient();

  // Fetch real counts for the instructor
  const { count: activeClasses } = await supabase.from('cohorts').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: pendingGrading } = await supabase.from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  const instructorStats = [
    { label: 'Active Classes', value: activeClasses || 0, icon: Users, color: 'text-brand-blue-600' },
    { label: 'Pending Grading', value: pendingGrading || 0, icon: ClipboardCheck, color: 'text-brand-orange-500' },
    { label: 'Upcoming RTI', value: 2, icon: Clock, color: 'text-brand-green-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-brand-blue-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Instructor Command Center</h1>
          <p className="text-brand-blue-100">Manage your students, grade assignments, and track program performance.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {instructorStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
              Course Management
            </h2>
            <div className="space-y-4">
              <Link href="/instructor/instructors" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                <div>
                  <p className="font-bold text-slate-900">Instructor Directory</p>
                  <p className="text-xs text-slate-500">View and manage staff assignments</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600" />
              </Link>
              <Link href="/admin/courses" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                <div>
                  <p className="font-bold text-slate-900">Curriculum Editor</p>
                  <p className="text-xs text-slate-500">Update modules and lesson plans</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-green-600" />
              Student Performance
            </h2>
            <div className="space-y-4">
              <Link href="/admin/students" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                <div>
                  <p className="font-bold text-slate-900">Roster & Gradebook</p>
                  <p className="text-xs text-slate-500">Track student progress in real-time</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600" />
              </Link>
              <Link href="/admin/reports" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                <div>
                  <p className="font-bold text-slate-900">Engagement Analytics</p>
                  <p className="text-xs text-slate-500">Attendance and completion reporting</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

