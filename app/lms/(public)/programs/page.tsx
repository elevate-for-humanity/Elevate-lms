import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Clock, Award, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description: 'Browse career training programs. WIOA funding available for eligible Indiana residents.',
};

// Static catalog — source of truth until all programs are in the DB.
// Slug must match the programs.slug column for the "Enroll Now" link to work.
const CATALOG = [
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    desc: 'EPA 608 certification. Refrigeration, electrical, and system diagnostics.',
    duration: '16 weeks',
    credential: 'EPA 608',
    image: '/images/pages/hvac-unit.jpg',
    funded: true,
  },
  {
    slug: 'cna',
    title: 'CNA / Nursing Assistant',
    desc: 'State-certified nursing assistant training for entry-level healthcare careers.',
    duration: '6 weeks',
    credential: 'State CNA',
    image: '/images/pages/cna-nursing-real.jpg',
    funded: true,
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    desc: 'Commercial driver license training. Class A and B available.',
    duration: '8 weeks',
    credential: 'CDL Class A',
    image: '/images/pages/cdl-truck-highway.jpg',
    funded: true,
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    desc: 'Indiana DOL registered apprenticeship. Earn while you learn.',
    duration: '52 weeks',
    credential: 'Indiana Barber License',
    image: '/images/pages/barber-hero-main.jpg',
    funded: true,
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    desc: 'Clinical and administrative skills for medical office careers.',
    duration: '12 weeks',
    credential: 'CCMA',
    image: '/images/pages/medical-assistant-real.jpg',
    funded: true,
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    desc: 'CompTIA Security+ and network defense fundamentals.',
    duration: '12 weeks',
    credential: 'CompTIA Security+',
    image: '/images/pages/cybersecurity.jpg',
    funded: false,
  },
];

export default async function LmsProgramsPage() {
  // Logged-in users belong in the authenticated LMS
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/lms/courses');

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
              href="/login?redirect=/lms/dashboard"
              className="text-sm bg-slate-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              Student Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold text-brand-red-600 uppercase tracking-widest mb-3">
            Career Training Programs
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Find Your Program
          </h1>
          <p className="text-slate-500 text-base max-w-xl">
            Industry-recognized credentials. Most programs are fully funded for eligible Indiana residents through WIOA and WorkOne.
          </p>
        </div>
      </section>

      {/* FUNDING NOTICE */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-green-700 text-sm font-semibold">
            WIOA funding available
          </span>
          <span className="text-green-600 text-sm">
            — Eligible Indiana residents may qualify for fully-funded training.
          </span>
          <a
            href="https://www.indianacareerconnect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-semibold text-green-700 underline underline-offset-2 whitespace-nowrap"
          >
            Check eligibility →
          </a>
        </div>
      </div>

      {/* PROGRAM GRID */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATALOG.map((p) => (
              <div
                key={p.slug}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {p.funded && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      FUNDED
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-slate-900 text-base mb-1">{p.title}</h2>
                  <p className="text-sm text-slate-500 mb-4 flex-1">{p.desc}</p>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {p.duration}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Award className="w-3 h-3" />
                      {p.credential}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/programs/${p.slug}`}
                      className="flex-1 text-center text-sm font-semibold text-slate-700 border border-slate-200 py-2 rounded-lg hover:bg-slate-50 transition"
                    >
                      View Program
                    </Link>
                    <Link
                      href={`/programs/${p.slug}/apply`}
                      className="flex-1 text-center text-sm font-bold text-white bg-brand-red-600 hover:bg-brand-red-700 py-2 rounded-lg transition"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Already enrolled?</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in to access your courses, track progress, and continue your training.
          </p>
          <Link
            href="/login?redirect=/lms/dashboard"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition"
          >
            Enter Student Portal <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
