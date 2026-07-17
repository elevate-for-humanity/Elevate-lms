import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { resolveBarberLessonVideoUrl } from '@/lib/barber/resolve-lesson-video-url';
import { BARBER_COURSE_ID } from '@/lib/barber/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Barber lesson video preview',
  robots: { index: false, follow: false },
};

// PUBLIC ROUTE: internal QA — lists barber RTI videos with native HTML5 player
export default async function BarberVideosPreviewPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-xl font-bold text-slate-900">Barber video preview</h1>
        <p className="mt-2 text-slate-600">Supabase env not configured in this environment.</p>
      </main>
    );
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: lessons } = await db
    .from('course_lessons')
    .select('slug, title, video_url, order_index')
    .eq('course_id', BARBER_COURSE_ID)
    .order('order_index');

  const items = (lessons ?? []).map((lesson) => ({
    slug: lesson.slug,
    title: lesson.title,
    playbackUrl: resolveBarberLessonVideoUrl(lesson.slug, lesson.video_url),
  }));

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900">Barber RTI — video preview</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use the player controls to play audio. If a lesson shows “No URL”, upload MP4s with{' '}
          <code className="text-xs bg-slate-200 px-1 rounded">pnpm tsx scripts/upload-videos-to-supabase.ts</code>
          .
        </p>
        <ul className="mt-8 space-y-10">
          {items.map((item) => (
            <li key={item.slug} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                {item.title}{' '}
                <span className="text-slate-400 font-normal text-sm">({item.slug})</span>
              </h2>
              {item.playbackUrl ? (
                <video
                  className="mt-3 w-full rounded-lg bg-black aspect-video"
                  src={item.playbackUrl}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <p className="mt-3 text-sm text-amber-700">No playback URL — video not generated yet.</p>
              )}
              <p className="mt-2 text-xs text-slate-500 break-all">{item.playbackUrl ?? '—'}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
