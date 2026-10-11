import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getEnchantedHeartsProgram, formatUsd } from '@/lib/partners/enchanted-hearts';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const program = getEnchantedHeartsProgram((await params).slug);
  return {
    title: program ? `${program.title} | Elevate for Humanity` : 'Program not found',
    description: program?.summary,
  };
}
export default async function HealthcareProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const program = getEnchantedHeartsProgram((await params).slug);
  if (!program) notFound();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/programs/healthcare-training" className="font-bold text-fuchsia-300">
            All Elevate healthcare programs
          </Link>
          <h1 className="mt-6 text-4xl font-black">{program.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{program.summary}</p>
          <p className="mt-4 font-bold">{program.duration}</p>
          <Image
            src="/images/healthcare/program-cna-training.jpg"
            alt="Healthcare training"
            width={1200}
            height={500}
            className="mt-8 h-64 w-full rounded-2xl object-cover"
          />
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black">What you will learn</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
            {program.learning.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="mt-8 text-2xl font-black">Entry requirements</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
            {program.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="mt-8 text-2xl font-black">Schedule and format</h2>
          <p className="mt-4 leading-7 text-slate-700">{program.schedule}</p>
          <p className="mt-4 leading-7 text-slate-600">
            Application support, coordinated classroom and practical training, student dashboard
            access, and career navigation. Program prerequisites, class dates, and seat availability
            are confirmed during enrollment.
          </p>
        </article>
        <article className="rounded-2xl border border-fuchsia-200 bg-white p-6">
          <h2 className="font-bold">Elevate program tuition</h2>
          <p className="mt-3 text-4xl font-black">{formatUsd(program.retailPriceCents)}</p>
          <Link
            href={`/enroll/${program.programId}?partner=healthcare-training`}
            className="mt-6 block rounded-xl bg-fuchsia-700 px-5 py-3 text-center font-black text-white"
          >
            Review enrollment through Elevate
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Training resumes January 2027. Elevate will confirm eligibility, class availability and
            payment instructions before collecting tuition.
          </p>
        </article>
      </section>
    </main>
  );
}
