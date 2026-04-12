import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, Award, FileText, Plus, ExternalLink, 
  Download, Share2, Eye, Calendar, Trophy, Flame, Star
} from 'lucide-react';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'My Portfolio | LMS | Elevate For Humanity',
  description: 'Showcase your achievements, certificates, and completed projects.',
};

export default async function PortfolioPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/portfolio');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_date', { ascending: false });

  const { data: completedCourses } = await supabase
    .from('program_enrollments')
    .select('id, status, course_id, completed_at, progress_percent, course:courses ( id, title, description, thumbnail_url, slug )')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'My Portfolio' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-brand-blue-600" />
              My Portfolio
            </h1>
            <p className="text-gray-600 mt-1">
              Showcase your achievements and share with employers
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-white text-gray-700">
              <Share2 className="w-4 h-4" />
              Share Portfolio
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {certificates?.length || 0}
                </div>
                <div className="text-gray-600 text-sm">Certificates Earned</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedCourses?.length || 0}
                </div>
                <div className="text-gray-600 text-sm">Courses Completed</div>
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
                <div className="text-gray-600 text-sm">Projects Added</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Certificates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Certificates & Credentials
                </h2>
              </div>
              {certificates && certificates.length > 0 ? (
                <div className="divide-y">
                  {certificates.map((cert: any) => (
                    <div key={cert.id} className="p-6 hover:bg-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{cert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{cert.issuer}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Issued {new Date(cert.issued_at).toLocaleDateString()}
                            </span>
                            {cert.credential_id && (
                              <span>ID: {cert.credential_id}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-white rounded-lg" title="View">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg" title="Download">
                            <Download className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg" title="Share">
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No certificates yet</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Complete courses to earn certificates and credentials
                  </p>
                  <Link
                    href="/lms/courses"
                    className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                  >
                    Browse Courses →
                  </Link>
                </div>
              )}
            </div>

            {/* Completed Courses */}
            <div className="bg-white rounded-xl shadow-sm border mt-6">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Completed Courses
                </h2>
              </div>
              {completedCourses && completedCourses.length > 0 ? (
                <div className="divide-y">
                  {completedCourses.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-6 hover:bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {enrollment.course?.title || 'Course'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Completed {new Date(enrollment.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/lms/courses/${enrollment.course_id}`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                        >
                          View Course
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <h3 className="font-medium text-gray-900 mb-2">No completed courses</h3>
                  <p className="text-gray-600 text-sm">
                    Your completed courses will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Add Project */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Add to Portfolio</h2>
              <p className="text-gray-600 text-sm mb-4">
                Showcase your work by adding projects, case studies, or work samples.
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            </div>

            {/* Gamification Stats */}
            <div className="bg-brand-orange-500 rounded-xl p-6 mb-6">
              <PointsDisplay userId={user.id} />
            </div>

            {/* Learning Streak */}
            <div className="mb-6">
              <StreakTracker userId={user.id} />
            </div>

            {/* Portfolio Tips */}
            <div className="bg-brand-blue-50 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio Tips</h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Add descriptions to your certificates explaining what you learned</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Include projects that demonstrate your skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Share your portfolio link on LinkedIn and resumes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Keep your portfolio updated as you complete new courses</span>
                </li>
              </ul>
            </div>

            {/* Badges Earned */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Recent Badges
                </h2>
                <Link href="/lms/badges" className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">First Steps</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg opacity-40">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">Locked</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg opacity-40">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">Locked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
