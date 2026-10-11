import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ENCHANTED_HEARTS, formatUsd } from '@/lib/partners/enchanted-hearts';
export const metadata: Metadata = {
  title: 'Healthcare Training | Elevate for Humanity',
  description: 'Explore Elevate healthcare training, tuition, and enrollment options.',
};
export default function HealthcareTrainingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-fuchsia-300">Elevate for Humanity</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Build your healthcare career</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Explore nursing assistant, medication aide, home health, CPR, and practical skills
            training. Apply through Elevate for enrollment support and career coordination.
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Training resumes January 2027. Confirm your class and payment instructions with Elevate.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2 lg:grid-cols-3">
        {ENCHANTED_HEARTS.programs.map((program) => (
          <article
            key={program.publicSlug}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <Image
              src="/images/healthcare/program-cna-training.jpg"
              alt="Healthcare skills training"
              width={600}
              height={300}
              className="mb-5 h-40 w-full rounded-xl object-cover"
            />
            <p className="text-sm font-bold text-fuchsia-700">{program.duration}</p>
            <h2 className="mt-3 text-xl font-black">{program.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{program.summary}</p>
            <p className="mt-5 text-3xl font-black">{formatUsd(program.retailPriceCents)}</p>
            <Link
              href={`/programs/healthcare-training/${program.publicSlug}`}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-center font-bold text-white"
            >
              View program and enrollment
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
