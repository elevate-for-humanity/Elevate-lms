import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdaptiveLearningPath from '@/components/AdaptiveLearningPath';
import CompetencyTracking from '@/components/CompetencyTracking';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/adaptive' },
  title: 'Adaptive Learning | Elevate For Humanity',
  description: 'Personalized adaptive learning experiences.',
};

export default async function AdaptivePage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Adaptive Learning</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Adaptive Learning</h1>
          <p className="text-gray-600 mt-2">Personalized learning path based on your progress</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Learning Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Learning Style</p><p className="font-medium">Visual Learner</p></div>
            <div><p className="text-sm text-gray-500">Pace</p><p className="font-medium">Moderate</p></div>
            <div><p className="text-sm text-gray-500">Strengths</p><p className="font-medium">Problem Solving</p></div>
            <div><p className="text-sm text-gray-500">Focus Areas</p><p className="font-medium">Technical Skills</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Recommended Next Steps</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg hover:bg-white cursor-pointer">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Complete Module 3 Quiz</p><p className="text-sm text-gray-500">Based on your progress</p></div>
                <span className="text-brand-blue-600">→</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-white cursor-pointer">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Review: Data Analysis Basics</p><p className="text-sm text-gray-500">Strengthen your foundation</p></div>
                <span className="text-brand-blue-600">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Adaptive Learning Path */}
        <div className="mt-8">
          <AdaptiveLearningPath />
        </div>

        {/* Competency Tracking */}
        <div className="mt-8">
          <CompetencyTracking />
        </div>
      </div>
    </div>
  );
}
