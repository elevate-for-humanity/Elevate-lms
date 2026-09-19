'use client';

import Link from 'next/link';
import { ExternalLink, Film, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import VideoUploadClient from '@/apps/admin/app/videos/upload/VideoUploadClient';

export default function PurchasedMediaPlugin() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-cyan-800 bg-gradient-to-br from-cyan-950 to-slate-950 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Installed Course Builder plugin</p>
          <h1 className="mt-2 text-3xl font-black">Purchased Media</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Search your licensed Envato library, download the correct scene, then upload it to the selected canonical course and lesson. Uploaded media stays pending until playback and course-media checks pass.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://app.envato.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300">
              <ExternalLink className="h-4 w-4" /> Open my purchases
            </a>
            <a href="https://app.envato.com/search/stock-video" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400 px-4 py-3 font-bold text-cyan-100 hover:bg-cyan-950">
              <Film className="h-4 w-4" /> Search scenes
            </a>
            <Link href="/studio/courses" className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-3 font-bold text-slate-100 hover:bg-slate-800">
              Back to Course Builder
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h2 className="font-black text-emerald-100">Licensed upload workflow</h2>
              <p className="mt-1 text-sm text-emerald-100/80">
                Download only media covered by your Envato license. Keep the license certificate with the source asset record.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-slate-950 sm:p-6">
            <VideoUploadClient initialCourseId={courseId} embedded />
          </div>
        </section>
      </div>
    </main>
  );
}
