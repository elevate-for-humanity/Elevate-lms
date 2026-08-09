export const dynamic = 'force-static';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, BookOpen, CheckCircle, FileText, Video, FileQuestion, Users, Award } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Course Builder',
  description: 'Create and manage structured training courses with lessons, media, assessments, publishing, and learner progress tools.',
  keywords: ['course builder', 'LMS', 'online courses', 'training platform', 'course creation'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/course-builder' },
};

const blocks = [
  { icon: Video, title: 'Video Lessons', desc: 'Add hosted or embedded instructional video to course lessons.' },
  { icon: FileText, title: 'Lesson Content', desc: 'Create structured reading, instructions, resources, and supporting material.' },
  { icon: FileQuestion, title: 'Assessments', desc: 'Add quizzes and checks for understanding where the course requires them.' },
  { icon: Users, title: 'Learner Delivery', desc: 'Publish course content into the LMS for assigned learners and cohorts.' },
  { icon: Award, title: 'Completion & Credentials', desc: 'Connect course completion to approved certificate and credential workflows.' },
  { icon: CheckCircle, title: 'Progress Tracking', desc: 'Review course progress and completion data from the learner platform.' },
];

export default function CourseBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Course Builder' }]} />
      </div>

      <PictureFirstPageHero
        image="/images/pages/admin-partners-hero.webp"
        alt="Course-building workspace in the Elevate admin platform"
        eyebrow="Course Builder"
        title="Build Training Courses in the Admin Platform"
        description="Create lessons, media, assessments, and course structures in one canonical Course Builder. This page links to the real Admin workspace instead of maintaining a second interactive mock."
        actions={(
          <>
            <a href={getAdminUrl('/course-builder')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-red-700">Open Course Builder <ArrowRight className="h-5 w-5" /></a>
            <Link href="/store" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 transition-colors hover:border-slate-500">Back to Store</Link>
          </>
        )}
      />

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-brand-blue-700" />
            <h2 className="text-3xl font-black text-slate-950">Core Course-Building Tools</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">Capabilities below describe the current course-building workflow; availability still depends on role, permissions, and the active platform configuration.</p>
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
          <h2 className="mb-10 text-center text-3xl font-black text-slate-950">Course Creation Flow</h2>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ['1', 'Create', 'Create the course shell, title, description, and ownership.'],
              ['2', 'Build', 'Add modules, lessons, media, resources, and assessments.'],
              ['3', 'Review', 'Check learner experience, permissions, requirements, and completion rules.'],
              ['4', 'Publish', 'Publish the approved course and assign it through the LMS.'],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-700 font-black text-white">{step}</div>
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black">Use the real Course Builder</h2>
          <p className="mt-4 text-lg text-slate-300">Course editing belongs in the Admin workspace, where permissions, course records, and learner assignments are connected to production data.</p>
          <a href={getAdminUrl('/course-builder')} className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Open Admin Course Builder <ArrowRight className="h-5 w-5" /></a>
        </div>
      </section>
    </div>
  );
}
