import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Download, ShieldCheck } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

export const metadata: Metadata = {
  title: 'Install Course Builder',
  description: 'Install the Elevate Course Builder progressive web app.',
  manifest: '/manifest-course-builder.json',
  robots: { index: false, follow: false },
};

// The install surface for Course Builder lives inside the app itself: this
// route sits under /studio/courses, links the Course Builder manifest
// (start_url /studio/courses, scope /studio/courses/), and is covered by the
// Admin service worker registered at scope '/' by the root layout. That
// pairing is what lets Chrome fire beforeinstallprompt here — the static
// launcher at /install/course-builder.html is only an offline draft pad and
// is not the installable app (PWA audit 2026-11-28, RC-2).
export default function CourseBuilderInstallPage() {
  return (
    <main className="h-full overflow-y-auto bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
            <BookOpen className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Install Course Builder</h1>
          <p className="mt-4 text-base font-medium leading-7 text-slate-700">
            Install Course Builder as an app on a supported desktop, Android phone, or tablet. It opens straight into the course production workspace, under the same authenticated account.
          </p>

          <PwaInstallButton
            label="Install Course Builder"
            installedLabel="Course Builder Installed"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white hover:bg-blue-800"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Download className="h-5 w-5 text-slate-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Chrome / Edge / Android</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                Use the Install Course Builder button when available. The browser will open its native installation prompt.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ShieldCheck className="h-5 w-5 text-slate-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">iPhone / iPad</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                In Safari, use Share, then Add to Home Screen. iOS does not expose the same install-prompt API as Chrome or Edge.
              </p>
            </div>
          </div>

          <Link
            href="/studio/courses"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-900 hover:bg-slate-100"
          >
            Open Course Builder instead
          </Link>
        </section>
      </div>
    </main>
  );
}
