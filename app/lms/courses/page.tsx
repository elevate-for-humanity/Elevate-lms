import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config`;

export const metadata: Metadata = {
  title: `My Courses | ${PLATFORM_DEFAULTS.orgName} LMS`,
  description: `Access your enrolled courses and track your learning progress.',
};

export default function LMSCoursesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-slate-500 mt-1">Track your enrolled courses and progress.</p>
        </div>
      </section>
      
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Courses Yet</h2>
            <p className="text-slate-500 mb-6">Browse available programs to start your learning journey.</p>
            <Link href="/programs" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
