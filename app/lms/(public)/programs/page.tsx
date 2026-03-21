import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPrograms } from '@/lib/lms/api';
import { buildLoginRedirect } from '@/lib/lms/redirect';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Clock, Award, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description: 'Browse career training programs. WIOA funding available for eligible Indiana residents.',
};

// Local image fallback map — used when a DB program row has no image_url set.
// Keys are program slugs. Only covers programs with confirmed assets in public/images/pages/.
const IMAGE_FALLBACK: Record<string, string> = {
  'hvac-technician':       '/images/pages/hvac-unit.jpg',
  'cna':                   '/images/pages/cna-nursing-real.jpg',
  'cdl-training':          '/images/pages/cdl-truck-highway.jpg',
  'barber-apprenticeship': '/images/pages/barber-hero-main.jpg',
  'medical-assistant':     '/images/pages/medical-assistant-real.jpg',
  'cybersecurity-analyst': '/images/pages/cybersecurity.jpg',
};

export default async function LmsProgramsPage() {
  const supabase = await createClient();

  const programs = await getPrograms();

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/lms">
            <Image
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt="Elevate for Humanity"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/lms" className="text-sm text-slate-600 hover:text-slate-900 font-medium hidden sm:block">
              Home
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium border border-slate-200 px-3 py-1.5 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href={buildLoginRedirect('/lms/courses')}
              className="text-sm bg-slate-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              Student Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className="py-12 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold text-brand-red-600 uppercase tracking-widest mb-3">
            Career Training Programs
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Find Your Program
          </h1>
          <p className="text-slate-700 text-base max-w-xl">
            Industry-recognized credentials. Most programs are fully funded for eligible Indiana residents through WIOA and WorkOne.
          </p>
        </div>
      </section>

      {/* FUNDING NOTICE */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          <span className="text-green-700 text-sm font-semibold">WIOA funding available</span>
          <span className="text-green-700 text-sm">— Eligible Indiana residents may qualify for fully-funded training.</span>
          <a
            href="https://www.indianacareerconnect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-semibold text-green-800 underline underline-offset-2 whitespace-nowrap"
          >
            Check eligibility →
          </a>
        </div>
      </div>

      {/* PROGRAM GRID or EMPTY STATE */}
      <section className="py-12 bg-slate-50 min-h-[400px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {programs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-2">More programs enrolling now</h2>
              <p className="text-slate-700 text-sm mb-6">
                No published programs are available yet. If you&apos;re already enrolled, sign in to access your training.
              </p>
              <Link
                href={buildLoginRedirect('/lms/courses')}
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-700 transition"
              >
                Student Login <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {programs.map((p) => {
                const imgSrc = p.image ?? IMAGE_FALLBACK[p.slug] ?? null;
                return (
                  <article
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group flex flex-col"
                  >
                    {/* Fixed 16:10 ratio — no stretching */}
                    <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0 bg-slate-100">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : null}
                      {p.funded && (
                        <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          FUNDED
                        </span>
                      )}
                    </div>

                    {/* Content — flex-1 keeps uniform card height */}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-bold text-slate-900 text-base mb-1">{p.title}</h2>
                      {p.description && (
                        <p className="text-sm text-slate-700 mb-4 flex-1 line-clamp-2">{p.description}</p>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        {p.duration && (
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />{p.duration}
                          </span>
                        )}
                        {p.certification && (
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Award className="w-3 h-3" />{p.certification}
                          </span>
                        )}
                      </div>

                      {/* Buttons pinned to bottom */}
                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/programs/${p.slug}`}
                          className="flex-1 text-center text-sm font-semibold text-slate-700 border border-slate-200 py-2.5 rounded-lg hover:bg-slate-50 transition"
                        >
                          View Program
                        </Link>
                        <Link
                          href={buildLoginRedirect(`/programs/${p.slug}/apply`)}
                          className="flex-1 text-center text-sm font-bold text-white bg-brand-red-600 hover:bg-brand-red-700 py-2.5 rounded-lg transition"
                        >
                          Enroll Now
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-12 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Already enrolled?</h2>
          <p className="text-slate-700 text-sm mb-6">
            Sign in to access your courses, track progress, and continue your training.
          </p>
          <Link
            href={buildLoginRedirect('/lms/courses')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition"
          >
            Enter Student Portal <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
