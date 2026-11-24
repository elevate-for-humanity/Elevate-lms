import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { FORKLIFT_MANUFACTURING as plan } from '@/lib/programs/forklift-manufacturing';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Forklift and Manufacturing Operations | Elevate for Humanity',
  description: '48 online hours of forklift foundations, assembly and quality-inspection learning, including simulations and workbooks, followed by employer-led practical training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/forklift' },
};

export default async function ForkliftProgramPage() {
  const loaded = await loadProgramForPage(plan.slug);
  if (!loaded) notFound();
  return (
    <main className="bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <Image src={loaded.program.heroImage} alt={loaded.program.heroImageAlt} fill priority sizes="100vw" className="object-cover object-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/15" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Link href="/programs" className="text-base font-semibold text-slate-200 underline">All programs</Link>
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Manufacturing and logistics</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">{plan.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">{plan.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/apply?program=forklift" className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Request enrollment information</Link>
            <a href="#curriculum" className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-6 py-3 font-bold text-white">Explore the curriculum</a>
          </div>
        </div>
      </section>

      <section aria-label="Program schedule" className="border-b border-slate-200 bg-slate-50 px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div><p className="text-sm font-bold uppercase tracking-wide text-slate-600">Online learning</p><p className="mt-2 text-4xl font-black">48 hours</p><p className="mt-2 leading-7 text-slate-700">Lessons, simulations, workbook tasks and assessments are included in the planned hours.</p></div>
          <div><p className="text-sm font-bold uppercase tracking-wide text-slate-600">Employer practice</p><p className="mt-2 text-4xl font-black">2–4 weeks</p><p className="mt-2 leading-7 text-slate-700">An estimated practical phase. Training continues until job-specific competence is demonstrated.</p></div>
          <div><p className="text-sm font-bold uppercase tracking-wide text-slate-600">Suggested pace</p><p className="mt-2 text-4xl font-black">4–6 weeks</p><p className="mt-2 leading-7 text-slate-700">Two online weeks at 24 hours per week, then employer practice. Scheduling and learner needs may extend this.</p></div>
        </div>
      </section>

      <section id="curriculum" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-red-700">One coordinated program</p>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">Three skill areas. One 48-hour online course.</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Build a portfolio as you learn. Each two-hour lesson plan combines reading, a worked example, applied practice, a workbook assignment and a knowledge check. Planned hours are learning budgets; actual participation is recorded separately.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plan.blocks.map(block => <article key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <p className="text-sm font-bold text-brand-blue-800">{block.hours} hours · {block.lessons} lessons</p>
            <h3 className="mt-3 text-2xl font-black">{block.title}</h3>
            <ul className="mt-5 space-y-3 text-base leading-7 text-slate-700">{block.topics.map(topic => <li key={topic} className="border-t border-slate-200 pt-3">{topic}</li>)}</ul>
          </article>)}
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div><p className="text-sm font-bold uppercase tracking-wide text-cyan-200">Virtual practice</p><h2 className="mt-3 text-3xl font-black">Work through decisions you will encounter on the job.</h2><p className="mt-5 text-lg leading-8 text-slate-200">Use fictional work orders, capacity plates, drawings and inspection records. Enter measurements, put steps in order, explain decisions and review feedback before trying again.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{plan.virtualActivities.map(activity => <li key={activity} className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-base leading-7">{activity}</li>)}</ol>
        </div>
        <p className="mx-auto mt-10 max-w-6xl rounded-xl border border-cyan-800 bg-cyan-950/60 p-5 text-base leading-7 text-cyan-50">{plan.practicalDisclosure}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div><h2 className="text-3xl font-black">What happens at the employer site?</h2><p className="mt-5 text-base leading-8 text-slate-700">A qualified trainer demonstrates the equipment and job procedures, supervises practice, and evaluates performance at the workplace. Assembly and inspection tasks can be coordinated within the same practical phase. We do not add separate blocks of calendar weeks unless the employer’s training plan needs them.</p><p className="mt-4 text-base leading-8 text-slate-700">The training record identifies the learner, trainer, equipment, dates, observed skills and any further practice needed. Only the employer can authorize independent operation after the required training and evaluation.</p></div>
        <div><h2 className="text-3xl font-black">Completion and credentials</h2><p className="mt-5 text-base leading-8 text-slate-700">{plan.credentialDisclosure}</p><p className="mt-4 text-base leading-8 text-slate-700">The employer reviews the technical material and adapts training to its truck types, site hazards and job requirements before using it for operator training.</p><h3 className="mt-6 text-xl font-bold">Tuition and funding</h3><p className="mt-3 text-base leading-8 text-slate-700">{plan.fundingDisclosure}</p></div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl"><h2 className="text-3xl font-black">Course materials</h2><p className="mt-4 max-w-3xl leading-8 text-slate-700">Review the learning plan, complete the workbook’s job packets, and use the employer guide to plan supervised practice. These materials support training; they do not replace the employer’s equipment manuals or site procedures.</p><div className="mt-6 flex flex-wrap gap-4">
          <a href="/docs/forklift-manufacturing/Program_Syllabus.pdf" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-brand-blue-800">48-hour syllabus</a>
          <Link href="/contact?program=forklift" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-brand-blue-800">Ask about the next cohort</Link>
        </div></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8"><h2 className="text-3xl font-black">Plan your training</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Admissions will confirm tuition, access to the online course, and the employer practical arrangement before you begin. Employers can discuss a group built around their entry-level production or material-handling roles.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/contact?program=forklift" className="inline-flex min-h-12 items-center rounded-xl bg-brand-blue-800 px-6 py-3 font-bold text-white">Talk with admissions</Link><Link href="/contact?program=forklift&interest=employer-training" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-6 py-3 font-bold">Discuss an employer partnership</Link></div><p className="mt-10 text-sm leading-7 text-slate-600">Training references: {plan.sources.map((source,index) => <span key={source.url}>{index > 0 ? ' · ' : ''}<a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></span>)}</p></section>
    </main>
  );
}
