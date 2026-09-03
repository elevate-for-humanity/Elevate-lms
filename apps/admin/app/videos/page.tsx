import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Upload, Video } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAllLiveVideos } from '@/lib/video/registry';
import { VideoCandidateActions } from './VideoCandidateActions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Videos Management | Elevate For Humanity' };

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export default async function VideosPage() {
  await requireAdmin();
  const db = await requireAdminClient();
  const { data: uploadedVideos } = await db
    .from('videos')
    .select('id,title,description,url,video_url,thumbnail_url,duration_seconds,published,category,created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });
  const { data: candidates } = await db.from('video_jobs')
    .select('id,lesson_title,video_url,duration_seconds,quality_evidence,completed_at')
    .eq('asset_kind', 'lesson').eq('status', 'complete').eq('review_status', 'pending_review')
    .order('completed_at', { ascending: false });

  const uploaded = (uploadedVideos ?? [])
    .map((video) => ({
      id: video.id,
      title: video.title || 'Uploaded video',
      description: video.description || '',
      source: video.video_url || video.url || '',
      thumbnail: video.thumbnail_url || null,
      duration: formatDuration(video.duration_seconds),
      category: video.category || 'Training',
      origin: 'Uploaded' as const,
    }))
    .filter((video) => Boolean(video.source));

  const system = getAllLiveVideos().map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    source: video.video_url,
    thumbnail: video.thumbnail_url,
    duration: video.duration,
    category: video.category,
    origin: 'System' as const,
  }));

  const rows = [...system, ...uploaded];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Videos' }]} />
        <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg">
          <div className="relative min-h-52 p-7">
            <Image src="/images/pages/admin-videos-hero.webp" alt="Video management" fill priority sizes="100vw" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">Production media library</p>
              <h1 className="mt-2 text-3xl font-black">Training Videos</h1>
              <p className="mt-2 text-sm text-slate-200">Only verified, published videos with a real playback URL are shown here.</p>
              <Link href="/videos/upload" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"><Upload className="h-4 w-4" />Upload production video</Link>
            </div>
          </div>
        </section>

        {(candidates?.length ?? 0) > 0 && <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <h2 className="text-xl font-black text-slate-950">Replacement videos awaiting approval</h2>
          <p className="mt-1 text-sm text-slate-700">These candidates are not visible to learners until you approve them.</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {candidates!.map((candidate) => {
              const quality = candidate.quality_evidence as { narrationCoverage?: number; visualEvidenceCoverage?: number; expectedSceneCount?: number } | null;
              return <article key={candidate.id} className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                <h3 className="font-black text-slate-950">{candidate.lesson_title}</h3>
                <video controls preload="metadata" className="mt-3 aspect-video w-full rounded-lg bg-black" src={candidate.video_url ?? undefined} />
                <p className="mt-2 text-xs font-bold text-slate-600">{quality?.expectedSceneCount ?? '—'} scenes · {Math.round((quality?.narrationCoverage ?? 0) * 100)}% narration · {Math.round((quality?.visualEvidenceCoverage ?? 0) * 100)}% visual evidence</p>
                <VideoCandidateActions jobId={candidate.id} />
              </article>;
            })}
          </div>
        </section>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Video className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{rows.length}</p><p className="text-xs font-bold text-slate-500">Playable videos</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Play className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-2xl font-black text-slate-950">{system.length}</p><p className="text-xs font-bold text-slate-500">Canonical system videos</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Upload className="h-5 w-5 text-slate-600" /><p className="mt-3 text-2xl font-black text-slate-950">{uploaded.length}</p><p className="text-xs font-bold text-slate-500">Uploaded production videos</p></div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((video) => (
            <article key={`${video.origin}-${video.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video bg-slate-200">
                {video.thumbnail ? <Image src={video.thumbnail} alt={video.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Video className="h-10 w-10 text-slate-500" /></div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3"><h2 className="font-black text-slate-950">{video.title}</h2><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">Live</span></div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description || video.category}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{video.duration}</span><span>{video.category}</span></div>
                <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">{video.origin}</div>
                <a href={video.source} target="_blank" rel="noreferrer" className="mt-4 block rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-black text-slate-700">Open video</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
