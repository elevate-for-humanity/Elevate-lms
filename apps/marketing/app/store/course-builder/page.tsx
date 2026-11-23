export const dynamic = 'force-static';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  Video,
  FileQuestion,
  Users,
  Award,
} from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import { COURSE_BUILDER_MONTHLY_ALLOWANCE } from '@/lib/course-builder/credits';
import {
  COURSE_BUILDER_MONTHLY_PRICE,
  COURSE_DRAFT_SIZES,
  courseBuilderRequestHref,
} from '@/lib/course-builder/offer';

export const metadata: Metadata = {
  title: 'Course Builder',
  description:
    'Create and manage structured training courses with lessons, media, assessments, publishing, and learner progress tools.',
  keywords: ['course builder', 'LMS', 'online courses', 'training platform', 'course creation'],
  alternates: { canonical: 'https://store.elevateforhumanity.org/store/course-builder' },
};

const blocks = [
  {
    icon: Video,
    title: 'Video Lessons',
    desc: 'Add hosted or embedded instructional video to course lessons.',
  },
  {
    icon: FileText,
    title: 'Lesson Content',
    desc: 'Create structured reading, instructions, resources, and supporting material.',
  },
  {
    icon: FileQuestion,
    title: 'Assessments',
    desc: 'Add quizzes and checks for understanding where the course requires them.',
  },
  {
    icon: Users,
    title: 'Learner Delivery',
    desc: 'Publish course content into the LMS for assigned learners and cohorts.',
  },
  {
    icon: Award,
    title: 'Completion & Credentials',
    desc: 'Connect course completion to approved certificate and credential workflows.',
  },
  {
    icon: CheckCircle,
    title: 'Progress Tracking',
    desc: 'Review course progress and completion data from the learner platform.',
  },
];

const monthlyPrice = `$${COURSE_BUILDER_MONTHLY_PRICE}/month`;

export default function CourseBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Course Builder' }]} />
      </div>

      <HeroVideo
        mediaFit="cover"
        posterAlt="Illustrative adult learners working with an instructor at laptops"
        posterImage="/images/refresh-20261014/business.webp"
        microLabel="Elevate Course Creation & Learning Platform"
        belowHeroHeadline="Create courses at the size you need"
        belowHeroSubheadline={`See what ${monthlyPrice} and ${COURSE_BUILDER_MONTHLY_ALLOWANCE.toLocaleString()} monthly credits can cover. Request availability, a one-time credit pack, or a higher monthly allowance.`}
        ctas={[
          { label: 'View plans and credits', href: '#course-credits' },
          {
            label: 'Try the course creation demo',
            href: '/store/demo/capability/course_builder',
            variant: 'secondary',
          },
        ]}
        trustIndicators={[
          'Interactive lesson contract',
          'Natural AI narration',
          'Human review before publishing',
          'Credit-based generation',
        ]}
        transcript="Elevate Course Builder turns authored curriculum into colorful, narrated, interactive lessons with assessments, practice activities, media, LMS delivery, and progress tracking."
        analyticsName="course-builder-store"
      />

      <section id="course-credits" className="scroll-mt-24 border-b border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
              Monthly plan
            </p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">{monthlyPrice}</h2>
            <p className="mt-2 text-lg font-semibold text-slate-700">
              {COURSE_BUILDER_MONTHLY_ALLOWANCE.toLocaleString()} credits for course drafts
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Each example uses the same monthly allowance. You can mix sizes, such as one
              standard draft and two short drafts. Ask for a quote for courses over 25 lessons,
              narration, video, or additional AI work. Sales confirms scope and availability before payment.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {COURSE_DRAFT_SIZES.map(({ name, lessons, credits }) => (
              <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-bold text-slate-900">{name} course</h3>
                <p className="mt-1 text-sm text-slate-700">{lessons} lessons per draft</p>
                <p className="mt-1 text-sm text-slate-700">{credits.toLocaleString()} credits per draft</p>
                <p className="mt-3 text-lg font-black text-brand-blue-800">
                  Up to {Math.floor(COURSE_BUILDER_MONTHLY_ALLOWANCE / credits)}{' '}
                  {credits <= COURSE_BUILDER_MONTHLY_ALLOWANCE / 2 ? 'drafts' : 'draft'} per month
                </p>
              </div>
            ))}
          </div>
          <Link href={courseBuilderRequestHref('course-builder-monthly-plan')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">
            Request the ${COURSE_BUILDER_MONTHLY_PRICE} plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-brand-blue-700" />
            <h2 className="text-3xl font-black text-slate-950">Core Course-Building Tools</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">
              Capabilities below describe the current course-building workflow; availability still
              depends on role, permissions, and the active platform configuration.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <block.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="font-bold text-slate-950">{block.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-black text-slate-950">
            Course Creation Flow
          </h2>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ['1', 'Create', 'Create the course shell, title, description, and ownership.'],
              ['2', 'Build', 'Add modules, lessons, media, resources, and assessments.'],
              [
                '3',
                'Review',
                'Check learner experience, permissions, requirements, and completion rules.',
              ],
              ['4', 'Publish', 'Publish the approved course and assign it through the LMS.'],
            ].map(([step, title, desc]) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-700 font-black text-white">
                  {step}
                </div>
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Need credits for more courses?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="text-xl font-bold">One-time credit pack</h3>
              <p className="mt-2 text-slate-300">Add capacity for an upcoming course or a one-time batch.</p>
              <Link href={courseBuilderRequestHref('course-builder-one-time-credits')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700">
                Request a credit-pack quote <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="text-xl font-bold">Higher monthly allowance</h3>
              <p className="mt-2 text-slate-300">Choose recurring capacity based on how many courses your team builds each month.</p>
              <Link href={courseBuilderRequestHref('course-builder-monthly-upgrade')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-200">
                Request an upgrade quote <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
