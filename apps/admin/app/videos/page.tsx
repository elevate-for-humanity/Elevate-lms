import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Upload, Video } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';

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
  const { data: videos } = await db
    .from('videos')
    .select('id,title,description,url,video_url,thumbnail_url,duration_seconds,published,category,created_at')
    .order('created_at', { ascending: false });
  const rows = videos ?? [];
  const published = rows.filter((video) => video.published).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Videos' }]} />
        <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg">
          <div className="relative min-h-52 p-7">
            <Image src="/images/pages/admin-videos-hero.webp" alt="Video management" fill priority sizes="100vw" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
            <div className="relative z-10 max-w-2xl"><p className="text-xs font-black uppercase tracking-widest text-blue-200">Media library</p><h1 className="mt-2 text-3xl font-black">Training Videos</h1><p className="mt-2 text-sm text-slate-200">Manage published and draft video assets from the live videos table.</p><Link href="/videos/upload" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"><Upload className="h-4 w-4" />Upload video</Link></div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Video className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{rows.length}</p><p className="text-xs font-bold text-slate-500">Total videos</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Play className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-2xl font-black text-slate-950">{published}</p><p className="text-xs font-bold text-slate-500">Published</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Video className="h-5 w-5 text-slate-600" /><p className="mt-3 text-2xl font-black text-slate-950">{rows.length - published}</p><p className="text-xs font-bold text-slate-500">Draft / unpublished</p></div>
        </div>

        {rows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No videos are stored yet.</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rows.map((video) => {
          const source = video.video_url || video.url;
          return <article key={video.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative aspect-video bg-slate-200">{video.thumbnail_url ? <Image src={video.thumbnail_url} alt={video.title || 'Video thumbnail'} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Video className="h-10 w-10 text-slate-500" /></div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><h2 className="font-black text-slate-950">{video.title || 'Untitled video'}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-black ${video.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{video.published ? 'Published' : 'Draft'}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description || video.category || 'No description'}</p><div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{formatDuration(video.duration_seconds)}</span><span>{video.category || 'Uncategorized'}</span></div><div className="mt-4 flex gap-2"><Link href={`/admin/videos/${video.id}`} className="flex-1 rounded-lg bg-brand-blue-700 px-3 py-2 text-center text-xs font-black text-white">Edit</Link>{source && <a href={source} target="_blank" rel="noreferrer" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-black text-slate-700">Open video</a>}</div></div></article>;
        })}</div>}
      </div>
    </main>
  );
}
