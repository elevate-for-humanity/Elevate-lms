import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowRight, Play, Clock, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Course | Apprentice Portal',
  description: 'Watch video lessons and RTI training for your apprenticeship.',
};

export const dynamic = 'force-dynamic';

export default async function CoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/course');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Breadcrumbs 
            items={[
              { label: 'Apprentice Portal', href: '/apprentice', className: 'text-white/70' }, 
              { label: 'Course', className: 'text-white' }
            ]}
            className="text-white/70 mb-6"
          />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Video Course</h1>
              <p className="text-white/90 text-lg">
                Watch RTI training videos and instructional content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-500">Videos Watched</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0h</p>
                <p className="text-sm text-slate-500">Watch Time</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0%</p>
                <p className="text-sm text-slate-500">Completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Start Watching</h2>
                <p className="text-white/80">Access RTI training videos</p>
              </div>
            </div>
            <p className="text-white/90 mb-6 max-w-xl">
              Your apprenticeship includes RTI (Related Technical Instruction) video training. 
              Watch videos to complete your required training hours.
            </p>
            <Link
              href="/lms/courses"
              className="inline-flex items-center gap-2 bg-white text-cyan-700 px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
            >
              Browse Video Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Available Videos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Your Video Training</h2>
          <div className="space-y-4">
            <div className="p-6 border border-slate-200 rounded-xl hover:border-cyan-300 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">No videos assigned yet</h3>
                    <p className="text-sm text-slate-500">Your video training will appear here once assigned</p>
                  </div>
                </div>
                <Link 
                  href="/lms/courses"
                  className="text-cyan-600 font-medium text-sm hover:underline"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RTI Info */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-3">About RTI Training</h3>
          <p className="text-sm text-amber-800 mb-4">
            RTI (Related Technical Instruction) consists of at least 144 hours per year of 
            classroom training. These video courses count toward your RTI requirement.
          </p>
          <div className="flex items-center gap-4 text-sm text-amber-700">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Indiana DOL Required
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              144 Hours/Year
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8">
          <Link href="/apprentice" className="text-brand-blue-600 font-medium text-sm hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
