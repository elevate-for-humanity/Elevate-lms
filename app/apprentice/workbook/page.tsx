import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle, Clock, Play } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Workbook | Apprentice Portal',
  description: 'Complete your apprenticeship training modules and coursework.',
};

export const dynamic = 'force-dynamic';

export default async function WorkbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/workbook');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Breadcrumbs 
            items={[
              { label: 'Apprentice Portal', href: '/apprentice', className: 'text-white/70' }, 
              { label: 'Workbook', className: 'text-white' }
            ]}
            className="text-white/70 mb-6"
          />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Training Workbook</h1>
              <p className="text-white/90 text-lg">
                Complete your modules and track your learning progress
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
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-500">Modules Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0%</p>
                <p className="text-sm text-slate-500">Overall Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Start Learning</h2>
                <p className="text-white/80">Begin your training modules</p>
              </div>
            </div>
            <p className="text-white/90 mb-6 max-w-xl">
              Your apprenticeship workbook contains all the required training modules. 
              Complete each module to track your progress toward certification.
            </p>
            <Link
              href="/lms/my-courses"
              className="inline-flex items-center gap-2 bg-white text-violet-700 px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
            >
              Go to My Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Available Modules */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Your Training Modules</h2>
          <div className="space-y-4">
            <div className="p-6 border border-slate-200 rounded-xl hover:border-violet-300 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">No modules assigned yet</h3>
                    <p className="text-sm text-slate-500">Your training modules will appear here once assigned</p>
                  </div>
                </div>
                <Link 
                  href="/lms/courses"
                  className="text-violet-600 font-medium text-sm hover:underline"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">Need Help?</h3>
          <p className="text-sm text-slate-600 mb-4">
            Your training workbook includes all required coursework for your apprenticeship program. 
            Contact your instructor if you don't see any assigned modules.
          </p>
          <Link href="/apprentice" className="text-brand-blue-600 font-medium text-sm hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
