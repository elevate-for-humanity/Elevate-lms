import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  FileCheck,
  FileText,
  Layers,
  RefreshCw,
  ShieldCheck,
  Video,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Factory | Elevate',
  description: 'Create and validate structured workforce courses through Elevate’s canonical Course Factory, including blueprints, lessons, assessments, publishing, and media workflows.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/course-factory' },
};

const capabilities = [
  { icon: Layers, title: 'Canonical Blueprints', description: 'Start from program and credential blueprints that define modules, lesson structure, objectives, competencies, and completion rules.' },
  { icon: Brain, title: 'AI-Assisted Content', description: 'Generate or enrich lesson content through the canonical Course Factory rather than parallel course-generation systems.' },
  { icon: FileCheck, title: 'Assessment Generation', description: 'Create module assessments and final-exam content according to blueprint rules and configured passing requirements.' },
  { icon: Award, title: 'Credential Mapping', description: 'Store credential and competency references with the course so alignment can be reviewed and audited.' },
  { icon: Video, title: 'Media Workflow', description: 'Queue lesson-media jobs through the shared video pipeline and track their production status against the course record.' },
  { icon: ShieldCheck, title: 'Validation Before Publish', description: 'Run structural validation and persistence checks before a generated course is treated as a publishable LMS resource.' },
];

const lifecycle = [
  ['1', 'Resolve the program', 'Course Factory identifies the program and applicable blueprint or approved generation input.'],
  ['2', 'Build the course structure', 'Modules and lessons are generated from one canonical contract instead of duplicate builders.'],
  ['3', 'Generate learning content', 'Lesson content and assessment material are created or refreshed according to the selected build mode.'],
  ['4', 'Validate the result', 'Expected structure, required lessons, assessments, and publication data are checked before completion.'],
  ['5', 'Persist and publish', 'Course, module, lesson, and assessment records are written through the shared publishing layer.'],
  ['6', 'Queue media', 'Configured lesson-media jobs enter the canonical video queue and remain separately observable from course publication.'],
] as const;

const controls = [
  'Replace, refresh, and missing-only build modes',
  'Dry-run validation without database mutation',
  'Blueprint-defined module and lesson expectations',
  'Assessment and final-exam generation hooks',
  'Course persistence through the shared publisher',
  'Observable media-job status rather than fake video labels',
];

export default function CourseFactoryPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-400">Canonical course-generation system</p>
            <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">Course Factory</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">
              Build structured workforce courses through one generation, validation, publishing, assessment, and media pipeline.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={getAdminUrl('/studio/courses/create')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 font-black text-slate-950 hover:bg-emerald-400">Open Course Builder <ArrowRight className="h-4 w-4" /></a>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/25 px-7 py-3 font-bold text-white hover:bg-white/10">Request a Demonstration</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-black text-slate-950">What the production system actually does</h2><p className="mt-3 leading-7 text-slate-600">Capabilities are described from the canonical runtime contract rather than unsupported speed, savings, volume, or customer claims.</p></div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => <article key={capability.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><capability.icon className="h-8 w-8 text-emerald-700" /><h3 className="mt-4 text-xl font-black text-slate-950">{capability.title}</h3><p className="mt-2 leading-7 text-slate-600">{capability.description}</p></article>)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black text-slate-950">Course lifecycle</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map(([step, title, description]) => <article key={step} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-black text-white">{step}</div><h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3><p className="mt-2 leading-7 text-slate-600">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div><p className="text-sm font-black uppercase tracking-[0.14em] text-brand-blue-700">Release controls</p><h2 className="mt-2 text-3xl font-black text-slate-950">A generated course is not complete just because JSON exists.</h2><p className="mt-4 leading-8 text-slate-600">Production acceptance requires the generated records to exist, validate, publish, render in the LMS, and expose real assessment and media state. Course Factory keeps those concerns inside one governed path.</p></div>
        <div className="rounded-3xl bg-slate-950 p-7 text-white">
          <h3 className="text-xl font-black">Runtime controls</h3>
          <ul className="mt-5 space-y-3">{controls.map((control) => <li key={control} className="flex gap-3 text-sm font-semibold leading-6 text-slate-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />{control}</li>)}</ul>
        </div>
      </section>

      <section className="bg-brand-blue-700 py-14 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8"><div><h2 className="text-3xl font-black">Evaluate Course Factory with a real program.</h2><p className="mt-2 text-blue-100">Review the generated modules, lessons, assessments, persistence, and media status—not a mockup.</p></div><a href={getAdminUrl('/studio/courses/create')} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-brand-blue-800">Open Builder <ArrowRight className="h-4 w-4" /></a></div>
      </section>
    </main>
  );
}
