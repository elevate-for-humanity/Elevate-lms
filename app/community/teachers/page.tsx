import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { GraduationCap, Users, FileText, Video, Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/teachers',
  },
  title: 'Teacher Resources | Elevate For Humanity',
  description: 'Resources and tools for instructors and educators.',
};

export const dynamic = 'force-dynamic';

export default async function TeachersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  // Get teacher resources
  const { data: resources } = await db
    .from('resources')
    .select('*')
    .eq('category', 'teachers')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get training videos
  const { data: videos } = await db
    .from('training_videos')
    .select('*')
    .eq('audience', 'teachers')
    .eq('is_active', true)
    .limit(4);

  // Get teacher community discussions
  const { data: discussions } = await db
    .from('discussions')
    .select('id, title, created_at, reply_count')
    .eq('category', 'teachers')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const defaultResources = [
    { title: 'Instructor Handbook', description: 'Complete guide to teaching on the Elevate platform', type: 'pdf' },
    { title: 'Course Creation Guide', description: 'How to create engaging course content', type: 'pdf' },
    { title: 'Assessment Best Practices', description: 'Tips for creating effective assessments', type: 'pdf' },
    { title: 'Student Engagement Strategies', description: 'Techniques for keeping students engaged', type: 'pdf' },
  ];

  const displayResources = resources && resources.length > 0 ? resources : defaultResources;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Teachers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Teacher Resources</h1>
          <p className="text-xl text-brand-green-100 max-w-2xl mx-auto">
            Tools, guides, and community support for instructors
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/community/communityhub" className="text-brand-blue-600 hover:underline mb-8 inline-block">
          ← Back to Community Hub
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resources */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-green-600" />
                Teaching Resources
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {displayResources.map((resource: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                    <h3 className="font-bold mb-2">{resource.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                    <a
                      href={resource.url || '#'}
                      className="inline-flex items-center gap-2 text-brand-green-600 font-medium hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Training Videos */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-brand-green-600" />
                Training Videos
              </h2>
              {videos && videos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {videos.map((video: any) => (
                    <Link
                      key={video.id}
                      href={`/training/${video.id}`}
                      className="bg-white rounded-xl overflow-hidden border hover:shadow-md transition"
                    >
                      <div className="aspect-video bg-gray-200 flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{video.title}</h3>
                        <p className="text-sm text-gray-500">{video.duration}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/resources/instructor-training" className="bg-white rounded-xl p-6 border hover:shadow-lg transition">
                    <Video className="w-10 h-10 text-brand-blue-600 mb-3" />
                    <h3 className="font-bold">Getting Started Guide</h3>
                    <p className="text-sm text-gray-500">15 min • Introduction to the platform</p>
                  </Link>
                  <Link href="/resources/instructor-training" className="bg-white rounded-xl p-6 border hover:shadow-lg transition">
                    <Video className="w-10 h-10 text-brand-green-600 mb-3" />
                    <h3 className="font-bold">Best Practices</h3>
                    <p className="text-sm text-gray-500">20 min • Teaching techniques</p>
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/instructor/dashboard" className="text-brand-green-600 hover:underline">
                    Instructor Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/instructor/courses" className="text-brand-green-600 hover:underline">
                    My Courses
                  </Link>
                </li>
                <li>
                  <Link href="/instructor/students" className="text-brand-green-600 hover:underline">
                    Student Management
                  </Link>
                </li>
                <li>
                  <Link href="/support/help" className="text-brand-green-600 hover:underline">
                    Help Center
                  </Link>
                </li>
              </ul>
            </section>

            {/* Discussions */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-green-600" />
                Teacher Discussions
              </h3>
              {discussions && discussions.length > 0 ? (
                <div className="space-y-3">
                  {discussions.map((discussion: any) => (
                    <Link
                      key={discussion.id}
                      href={`/community/discussions/${discussion.id}`}
                      className="block hover:bg-gray-50 p-2 -mx-2 rounded transition"
                    >
                      <div className="font-medium text-sm">{discussion.title}</div>
                      <div className="text-xs text-gray-500">{discussion.reply_count || 0} replies</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No discussions yet</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
