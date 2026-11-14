import type { Metadata } from 'next';
import Link from 'next/link';
import DowntownTrainingGallery from '@/components/partners/DowntownTrainingGallery';
import { DOWNTOWN_TRAINING_ADDRESS } from '@/lib/partners/downtown-training';
import DowntownClientInquiry from '@/components/partners/DowntownClientInquiry';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty | Coming Soon to Downtown Indianapolis',
  description: 'Discover Mesmerized by Beauty’s upcoming downtown Indianapolis location. Ask about nail and esthetic services, opening information, or training opportunities.',
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
          A new downtown Indianapolis destination is on the way. Interested in nail or esthetic
          services? Tell us what you’re looking for and ask about the opening.
        </p>
        <p className="mt-4 font-bold text-blue-800">Coming soon · Opening date to be announced</p>
        <address className="mt-5 text-lg not-italic text-slate-700">
          Planned location: {DOWNTOWN_TRAINING_ADDRESS}, Indianapolis, IN
        </address>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="#downtown-client-inquiry"
            className="inline-flex min-h-12 items-center rounded-xl bg-blue-800 px-6 py-3 font-bold text-white"
          >
            Ask about beauty services
          </Link>
          <Link
            href="#beauty-training"
            className="inline-flex min-h-12 items-center rounded-xl border border-blue-800 px-6 py-3 font-bold text-blue-800"
          >
            Looking for training?
          </Link>
        </div>
      </section>
      <section id="downtown-client-inquiry" aria-labelledby="client-inquiry-heading" className="scroll-mt-24 bg-blue-50 px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 id="client-inquiry-heading" className="text-3xl font-black">Be part of what’s next downtown.</h2>
          <p className="mb-6 mt-4 leading-7 text-slate-700">Send your service inquiry to the Elevate team for Mesmerized by Beauty. The service menu, pricing, opening date, and appointment availability will be shared after confirmation.</p>
          <DowntownClientInquiry />
          <p className="mt-5 leading-7">Prefer to talk? <a href={siteConfig.phone.href} className="font-bold text-blue-800 underline">Call Elevate</a> or <a href={`mailto:${siteConfig.email.general}?subject=Mesmerized%20by%20Beauty%20downtown%20client%20inquiry`} className="font-bold text-blue-800 underline">email the team</a>.</p>
        </div>
      </section>
      <DowntownTrainingGallery />
      <section id="beauty-training" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12">
        <h2 className="text-2xl font-black">Find your place in beauty.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Ask Elevate about schedules, program requirements, and downtown training availability.
          Enrollment, supervision, required hours, examinations, and state licensing requirements
          apply.
        </p>
        <div className="mt-5 flex flex-wrap gap-6 font-bold text-blue-800 underline">
          <Link href="/programs/nail-technician-apprenticeship">Explore nail training</Link>
          <Link href="/programs/esthetician-apprenticeship">Explore esthetician training</Link>
        </div>
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
