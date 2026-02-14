import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Discussion | Elevate For Humanity',
  description: 'Participate in course discussions.',
};

export default async function DiscussionPage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await supabase.from('courses').select('*').eq('id', params.courseId).single();
  const { data: discussions } = await supabase.from('discussions').select('*, profiles!inner(full_name)').eq('course_id', params.courseId).order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/courses/${params.courseId}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">← Back to Course</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{course?.title} - Discussion</h1>
          <p className="text-gray-600 mt-1">Connect with fellow learners and instructors</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="font-semibold mb-3">Start a Discussion</h2>
          <textarea className="w-full border rounded-lg px-3 py-2 mb-3" rows={3} placeholder="Share your thoughts or ask a question..." />
          <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Post</button>
        </div>
        <div className="space-y-4">
          {discussions && discussions.length > 0 ? discussions.map((post: any) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center"><span className="text-brand-blue-600 font-medium">{(post.profiles?.full_name || 'U')[0]}</span></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{post.profiles?.full_name || 'User'}</span>
                    <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                  <div className="flex gap-4 mt-2">
                    <button className="text-sm text-gray-500 hover:text-brand-blue-600">Reply</button>
                    <button className="text-sm text-gray-500 hover:text-brand-blue-600">Like</button>
                  </div>
                </div>
              </div>
            </div>
          )) : <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">No discussions yet. Be the first to start one!</div>}
        </div>
      </div>
    </div>
  );
}
