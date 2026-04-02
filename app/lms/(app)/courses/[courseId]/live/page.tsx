import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Session | Elevate For Humanity',
  description: 'Join live course sessions.',
};

export default async function LivePage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await supabase.from('training_courses').select('*').eq('id', params.courseId).single();
  const { data: sessions } = await supabase.from('live_sessions').select('*').eq('course_id', params.courseId).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(5);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/lms/courses/${params.courseId}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">← Back to Course</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{course?.title} - Live Sessions</h1>
          <p className="text-gray-600 mt-1">Join live classes and interact with instructors</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="aspect-video bg-white rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <p>No live session in progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Upcoming Sessions</h2></div>
          <div className="divide-y">
            {sessions && sessions.length > 0 ? sessions.map((session: any) => (
              <div key={session.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.title || 'Live Session'}</p>
                  <p className="text-sm text-gray-500">{new Date(session.scheduled_at).toLocaleString()}</p>
                </div>
                <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm">Set Reminder</button>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No upcoming sessions scheduled</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
