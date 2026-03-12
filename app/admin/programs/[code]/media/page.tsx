import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Film, Image as ImageIcon } from 'lucide-react';

export const metadata: Metadata = { title: 'Program Media | Elevate Admin' };

export default async function ProgramMediaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const { data: program } = await db.from('programs').select('id, title').or(`code.eq.${code},slug.eq.${code}`).single();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  // Count lessons with video URLs
  const { data: lessons } = await db
    .from('training_lessons')
    .select('id, title, video_url')
    .eq('course_id', (await db.from('training_courses').select('id').eq('program_id', program.id).limit(50)).data?.map((c: any) => c.id)?.[0] || '')
    .limit(200);

  const withVideo = lessons?.filter((l: any) => l.video_url) || [];
  const withoutVideo = lessons?.filter((l: any) => !l.video_url) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li><Link href="/admin/programs" className="hover:text-brand-blue-600">Programs</Link></li>
          <li>/</li>
          <li><Link href={`/admin/programs/${code}/dashboard`} className="hover:text-brand-blue-600">{program.title}</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Media</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Media — {program.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-5 h-5 text-brand-blue-600" />
            <h3 className="font-medium text-gray-900">Lesson Videos</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{withVideo.length}</p>
          <p className="text-sm text-gray-500">of {(lessons?.length || 0)} lessons have video</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-medium text-gray-900">Missing Video</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{withoutVideo.length}</p>
          <p className="text-sm text-gray-500">lessons without video content</p>
        </div>
      </div>

      {withoutVideo.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden mb-8">
          <div className="px-4 py-3 bg-amber-50 border-b">
            <h3 className="font-medium text-amber-800">Lessons Missing Video</h3>
          </div>
          <ul className="divide-y max-h-96 overflow-y-auto">
            {withoutVideo.map((l: any) => (
              <li key={l.id} className="px-4 py-3 text-sm text-gray-700">{l.title || l.id}</li>
            ))}
          </ul>
        </div>
      )}

      {withVideo.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b">
            <h3 className="font-medium text-green-800">Lessons With Video</h3>
          </div>
          <ul className="divide-y max-h-96 overflow-y-auto">
            {withVideo.map((l: any) => (
              <li key={l.id} className="px-4 py-3 text-sm flex items-center justify-between">
                <span className="text-gray-700">{l.title || l.id}</span>
                <span className="text-xs text-gray-400 font-mono truncate max-w-xs">{l.video_url?.slice(0, 60)}...</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
