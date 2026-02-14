import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, FileText, CheckCircle, Clock, Star,
  AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import PeerReviewSystem from '@/components/PeerReviewSystem';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Peer Review | LMS | Elevate For Humanity',
  description: 'Review and provide feedback on assignments from fellow learners.',
};

export default async function PeerReviewPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/peer-review');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Peer Review' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-blue-600" />
            Peer Review
          </h1>
          <p className="text-gray-600 mt-1">
            Review assignments from fellow learners and receive feedback on your work
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-gray-600 text-sm">Pending Reviews</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-gray-600 text-sm">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-gray-600 text-sm">My Submissions</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">--</div>
                <div className="text-gray-600 text-sm">Avg. Rating Given</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Assignments to Review */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-blue-600" />
                Assignments to Review
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No pending reviews</h3>
                <p className="text-gray-600 text-sm">
                  When assignments are available for peer review, they'll appear here
                </p>
              </div>
            </div>
          </div>

          {/* My Submissions */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                My Submissions
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Submit assignments in your courses to receive peer feedback
                </p>
                <Link
                  href="/lms/courses"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                >
                  Go to My Courses →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-gray-900 mb-6">How Peer Review Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Submit Your Work</h3>
              <p className="text-gray-600 text-sm">
                Complete and submit assignments that have peer review enabled
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Review Others</h3>
              <p className="text-gray-600 text-sm">
                Provide constructive feedback on your peers' submissions
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Receive Feedback</h3>
              <p className="text-gray-600 text-sm">
                Get valuable insights from multiple reviewers on your work
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Review Guidelines
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Be constructive and specific in your feedback</li>
            <li>• Focus on the work, not the person</li>
            <li>• Highlight both strengths and areas for improvement</li>
            <li>• Complete reviews within the deadline to help your peers</li>
          </ul>
        </div>

        {/* Peer Review System */}
        <div className="mt-8">
          <PeerReviewSystem />
        </div>
      </div>
    </div>
  );
}
