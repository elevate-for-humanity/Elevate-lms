import { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileQuestion,
  FileText,
  GraduationCap,
  Sparkles,
  Video,
} from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Course Factory | AI-Assisted Curriculum Generation',
  description:
    'Create structured course drafts with AI-assisted lessons, assessments, video scripts, credential mapping, review, and publishing workflows.',
};

const features = [
  {
    icon: Sparkles,
    title: 'AI-Assisted Lesson Drafts',
    description:
      'Generate structured lesson drafts from approved blueprints, learning objectives, and competency requirements for staff review.',
  },
  {
    icon: Video,
    title: 'Video Production Workflow',
    description:
      'Create lesson video scripts and queue supported media-production steps while keeping final review inside the course workflow.',
  },
  {
    icon: FileQuestion,
    title: 'Assessment Builder',
    description:
      'Create quizzes, practice questions, and competency checks that can be reviewed before they are published to learners.',
  },
  {
    icon: FileText,
    title: 'Blueprint Library',
    description:
      'Use structured blueprints for supported workforce and apprenticeship programs, including required module and lesson contracts.',
  },
  {
    icon: Award,
    title: 'Credential and Competency Mapping',
    description:
      'Map curriculum content to configured certification objectives, registered-program competencies, and program requirements where those mappings are available.',
  },
  {
    icon: Clock,
    title: 'Structured Production Pipeline',
    description:
      'Move course work through draft, validation, review, publishing, and runtime checks without maintaining a separate content-production system.',
  },
] as const;

const programs = [
  { name: 'Healthcare', programs: ['Medical Assistant', 'CNA', 'Phlebotomy', 'EKG', 'Pharmacy Tech'] },
  { name: 'Trades', programs: ['HVAC', 'Electrical', 'Plumbing', 'CDL', 'Welding'] },
  { name: 'Beauty', programs: ['Barber', 'Cosmetology', 'Esthetics', 'Nail Technician'] },
  { name: 'Safety', programs: ['OSHA-aligned safety', 'EPA 608 preparation', 'First Aid/CPR'] },
] as const;

const workflow = [
  {
    title: 'Choose or configure a blueprint',
    detail: 'Start from a supported blueprint or define the required modules, lessons, objectives, and competency mappings.',
  },
  {
    title: 'Generate draft content',
    detail: 'Use the Course Factory generation pipeline to create lesson and assessment drafts against the configured schema.',
  },
  {
    title: 'Validate the course',
    detail: 'Run deterministic structure checks and review generated content before it is treated as publishable curriculum.',
  },
  {
    title: 'Publish to the LMS',
    detail: 'Publish approved course content to the canonical LMS records used by learner runtime routes.',
  },
] as const;

export default function CourseFactoryPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-emerald-500 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-teal-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm">
              <GraduationCap className="h-4 w-4" />
              Course Builder + Course Factory
            </div>
            <h1 className="text-5xl font-black tracking-tight md:text-6xl">Course Factory</h1>
            <p className="mt-6 text-xl leading-8 text-slate-300">
              Build structured course drafts from program blueprints, generate lesson and assessment content, validate the result, and publish approved curriculum into the LMS from one production workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={getAdminUrl('/studio/courses/create')}
                className="rounded-lg bg-emerald-600 px-8 py-4 font-bold text-white transition hover:bg-emerald-500"
              >
                Open Course Builder
              </a>
              <Link
                href="/store/demo"
                className="rounded-lg border border-white/30 bg-white/10 px-8 py-4 font-bold text-white transition hover:bg-white/20"
              >
                Request Platform Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Production capabilities</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">One governed course-production workflow</h2>
            <p className="mt-4 text-slate-600">
              Course Factory assists the drafting process; required review, validation, source evidence, and program-specific approval remain part of the publishing workflow.
            </p>
          </div>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Icon className="h-6 w-6 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Configured program coverage</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Blueprints support multiple workforce categories</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Program availability depends on the blueprints and regulatory mappings configured in the platform. A listed category does not replace instructor, licensing, certification, or agency approval requirements.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {programs.map((group) => (
                <article key={group.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-black text-slate-950">{group.name}</h3>
                  <ul className="mt-4 space-y-2">
                    {group.programs.map((program) => (
                      <li key={program} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {program}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <BookOpen className="h-6 w-6 text-emerald-700" />
              </div>
              <h2 className="text-3xl font-black text-slate-950">From blueprint to LMS runtime</h2>
              <p className="mt-4 leading-7 text-slate-600">
                The production contract connects course blueprints, generated draft content, deterministic validation, persistence, and the LMS runtime instead of treating AI output as an automatically approved course.
              </p>
            </div>
            <ol className="space-y-4">
              {workflow.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-700 to-teal-700 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black">Open the production Course Builder</h2>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-50">
            Create or refresh a course, review the generated structure, run validation, and publish only when the course satisfies its program contract.
          </p>
          <a
            href={getAdminUrl('/studio/courses/create')}
            className="mt-8 inline-flex rounded-lg bg-white px-8 py-4 font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            Open Course Builder
          </a>
        </div>
      </section>
    </main>
  );
}
