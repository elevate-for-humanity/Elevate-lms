import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ courseId: string; id: string }>;
};

export default async function CourseDiscussionDetailPage({ params }: Props) {
  const { courseId, id } = await params;
  const supabase = await createClient();

  const { data: discussion } = await supabase
    .from('course_discussions')
    .select('*')
    .eq('id', id)
    .single();

  if (!discussion) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-black">
          <ol className="flex items-center gap-2">
            <li><Link href={`/lms/courses/${courseId}`} className="hover:text-gray-900">Course</Link></li>
            <li>/</li>
            <li><Link href={`/courses/${courseId}/discussions`} className="hover:text-gray-900">Discussions</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Thread</li>
          </ol>
        </nav>

        <div className="rounded-xl border p-6">
          {discussion.title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{discussion.title}</h1>
          )}
          <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
          {discussion.created_at && (
            <p className="text-xs text-black mt-4">
              Posted {new Date(discussion.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <Link
          href={`/courses/${courseId}/discussions`}
          className="inline-block px-5 py-2.5 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Back to Discussions
        </Link>
      </div>
    </div>
  );
}
