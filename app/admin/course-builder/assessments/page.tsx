export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileQuestion, CheckSquare, Clock, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Assessment Bank | Admin | Elevate For Humanity',
  description: 'Manage quizzes and assessments for courses.',
};

export default async function AssessmentBankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/course-builder/assessments');
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/admin/course-builder"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Builder
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Bank</h1>
              <p className="text-gray-600 mt-1">Create and manage quizzes and assessments</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Create Assessment
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <FileQuestion className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Total Assessments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Questions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Avg. Duration</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-brand-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0%</p>
                <p className="text-sm text-gray-600">Avg. Pass Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="">All Types</option>
              <option value="quiz">Quiz</option>
              <option value="exam">Exam</option>
              <option value="practice">Practice Test</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
          <p className="text-gray-500 mb-6">Create quizzes and exams to test student knowledge</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Create Assessment
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Import Questions</h3>
            <p className="text-sm text-gray-600 mb-4">Upload questions from CSV or Excel</p>
            <button className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700">
              Import →
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Question Bank</h3>
            <p className="text-sm text-gray-600 mb-4">Browse and reuse existing questions</p>
            <button className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700">
              Browse →
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">AI Generate</h3>
            <p className="text-sm text-gray-600 mb-4">Generate questions using AI</p>
            <button className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700">
              Generate →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
