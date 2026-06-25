import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPrograms } from '@/lib/lms/api';
import { buildLoginRedirect } from '@/lib/lms/redirect';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Award, BookOpen, ChevronRight, DollarSign } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Programs',
  description:
    'Browse career training programs. WIOA funding available for eligible Indiana residents.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/programs',
  },
};

// Revalidate every 10 minutes for unauthenticated views; authenticated views
// are always fresh via the enrollment query.
export const revalidate = 600;

const DEFAULT_PROGRAM_IMAGE = '/images/pages/admin-dashboard-hero.webp';

export default async function LmsProgramsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programs = await getPrograms();

  // Enrollment state — only available when authenticated
  let enrolledProgramIds = new Set<string>();
  let enrollmentMap = new Map<string, { status: string; progress_percent: number }>();

  if (user) {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('program_id, status, progress_percent')
      .eq('user_id', user.id);

    enrolledProgramIds = new Set(enrollments?.map((e) => e.program_id) || []);
    enrollmentMap = new Map(enrollments?.map((e) => [e.program_id, e]) || []);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAV — shown only when not authenticated (authenticated users have LmsAppShell nav) */}
      {!user && (
        <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/lms">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
              <Image sizes="100vw"
                src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
                alt={PLATFORM_DEFAULTS.orgName}
                width={120}
                height={32}
                className="h-8 w-auto" 
              />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/lms"
                className="text-sm text-slate-600 hover:text-slate-900 font-medium hidden sm:block"
              >
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
      )}

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
            Industry-recognized credentials. Most programs are fully funded for eligible Indiana
            residents through WIOA and WorkOne.
          </p>
        </div>
      </section>

      {/* FUNDING NOTICE */}
      <div className="bg-brand-green-50 border-b border-brand-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-brand-green-700 flex-shrink-0" />
            <span className="text-brand-green-800 text-sm font-bold">
              Funding available for eligible Indiana residents
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-green-800 transition"
            >
              WorkOne / WIOA — Schedule Appointment →
            </a>
            <Link
              href="/snap-et-partner"
              className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-800 transition"
            >
              FSSA / SNAP &amp; TANF Benefits →
            </Link>
            <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              IMPACT Partnership Scholarships
            </span>
            <a
              href="/start"
              className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-slate-900 transition"
            >
              Check My Eligibility →
            </a>
          </div>
        </div>
      </div>

      {/* PROGRAM GRID */}
      <section className="py-12 bg-slate-50 min-h-[400px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {programs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">More programs enrolling now</h2>
              <p className="text-slate-700 text-sm mb-6">
                No published programs are available yet. If you&apos;re already enrolled, sign in to
                access your training.
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
                const imgSrc = p.image ?? DEFAULT_PROGRAM_IMAGE;
                const isEnrolled = enrolledProgramIds.has(p.id);
                const enrollment = enrollmentMap.get(p.id);
                const progress = enrollment?.progress_percent ?? 0;

                return (
                  <article
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group flex flex-col"
                  >
                    {/* Fixed 16:10 ratio */}
                    <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0 bg-slate-100">
                      <Image
                        src={imgSrc}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                      />
                      {p.funded && (
                        <span className="absolute top-3 left-3 bg-brand-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          FUNDED
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="absolute top-3 right-3 bg-brand-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ENROLLED
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-bold text-slate-900 text-base mb-1">{p.title}</h2>
                      {p.description && (
                        <p className="text-sm text-slate-700 mb-4 flex-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        {p.duration && (
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            {p.duration}
                          </span>
                        )}
                        {p.certification && (
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Award aria-label="award" className="w-3 h-3" />
                            {p.certification}
                          </span>
                        )}
                      </div>

                      {/* Progress bar (enrolled only) */}
                      {isEnrolled && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-brand-blue-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* CTA buttons */}
                      {enrollment?.status === 'pending_approval' ? (
                        <div className="block w-full bg-amber-50 text-amber-800 border border-amber-200 text-center py-2.5 rounded-lg text-sm font-medium">
                          Pending Approval
                        </div>
                      ) : isEnrolled ? (
                        <Link
                          href={`/lms/program/${p.id}`}
                          className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
                        >
                          {progress > 0 ? 'Continue Program' : 'Start Program'}
                        </Link>
                      ) : (
                        <div className="flex gap-2 mt-auto">
                          <Link
                            href={`/programs/${p.slug}`}
                            className="flex-1 text-center text-sm font-semibold text-slate-700 border border-slate-200 py-2.5 rounded-lg hover:bg-slate-50 transition"
                          >
                            View Program
                          </Link>
                          <Link
                            href={
                              user
                                ? `/lms/apply?program=${p.slug || p.id}`
                                : buildLoginRedirect(`/programs/${p.slug}/apply`)
                            }
                            className="flex-1 text-center text-sm font-bold text-white bg-brand-red-600 hover:bg-brand-red-700 py-2.5 rounded-lg transition"
                          >
                            Enroll Now
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CTA — shown only when not authenticated */}
      {!user && (
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
      )}
    </div>
  );
}
