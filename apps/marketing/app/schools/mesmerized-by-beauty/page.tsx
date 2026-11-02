import type { Metadata } from 'next';
import Link from 'next/link';
import DowntownTrainingGallery from '@/components/partners/DowntownTrainingGallery';
import { DOWNTOWN_TRAINING_ADDRESS } from '@/lib/partners/downtown-training';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty | Downtown Nail & Esthetician Programs',
  description: `Explore Mesmerized by Beauty nail and esthetician programs overseen by Jozanna George at ${DOWNTOWN_TRAINING_ADDRESS}, Indianapolis.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/schools/mesmerized-by-beauty' },
  openGraph: {
    images: [
      {
        url: '/images/partners/mesmerized-by-beauty/downtown-nail-program.webp',
        alt: 'Mesmerized by Beauty downtown nail program space',
      },
    ],
  },
};

export default function Page() {
  return (
    <main className="bg-white text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20">
        <p className="font-bold uppercase tracking-widest text-blue-800">
          Elevate Barber &amp; Beauty Network
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
          Mesmerized by Beauty
        </h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-700">
          Nail and esthetician programs overseen by <strong>Jozanna George</strong> at our downtown
          Indianapolis location.
        </p>
        <address className="mt-5 text-lg not-italic text-slate-700">
          {DOWNTOWN_TRAINING_ADDRESS}, Indianapolis, IN
        </address>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/programs/nail-technician-apprenticeship"
            className="inline-flex min-h-12 items-center rounded-xl bg-blue-800 px-6 py-3 font-bold text-white"
          >
            Explore nail training
          </Link>
          <Link
            href="/programs/esthetician-apprenticeship"
            className="inline-flex min-h-12 items-center rounded-xl border border-blue-800 px-6 py-3 font-bold text-blue-800"
          >
            Explore esthetician training
          </Link>
        </div>
      </section>
      <DowntownTrainingGallery />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="text-2xl font-black">Find your place in beauty.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Ask Elevate about schedules, program requirements, and downtown training availability.
          Enrollment, supervision, required hours, examinations, and state licensing requirements
          apply.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex min-h-12 items-center font-bold text-blue-800 underline"
        >
          Contact Elevate about the downtown programs
        </Link>
      </section>
    </main>
  );
}
