// components/marketing/VideoStrip.tsx
import Link from 'next/link';

const videos = [
  {
    tag: 'For everyone · ~1:00',
    title: 'Elevate overview in 60 seconds',
    body: 'Who we serve, how funding works, and what Elevate actually does for real people.',
    href: '/videos/overview',
    duration: '1:00',
  },
  {
    tag: 'Barber & Re-entry · ~2:30',
    title: 'From incarceration to the barbershop',
    body: 'How re-entry coaching plus barber apprenticeship becomes a real second-chance pathway.',
    href: '/videos/barber-reentry',
    duration: '2:30',
  },
  {
    tag: 'Employers & partners · ~2:00',
    title: 'Build funded talent pipelines with Elevate',
    body: 'What HR, hiring managers, and workforce boards need to know in one short video.',
    href: '/videos/employers',
    duration: '2:00',
  },
];

export function VideoStrip() {
  return (
    <section className="   ">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
            Watch how Elevate works
          </h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
            Short videos you can use for learners, employers, and partners.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            These are perfect for QR codes on flyers, link-in-bio, and
            presentations. The goal: explain Elevate in real language, in under
            three minutes.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.title}
              href={video.href}
              className="group flex flex-col rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-800 transition hover:-translate-y-1 hover:ring-emerald-400/60"
            >
              <div className="relative mb-4 overflow-hidden rounded-2xl bg-white">
                <div className="aspect-video" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-950">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] text-white">
                      ▶
                    </span>
                    {video.duration} · Watch now
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {video.tag}
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-50">
                {video.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{video.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
