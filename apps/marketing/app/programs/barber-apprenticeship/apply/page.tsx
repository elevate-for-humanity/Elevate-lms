import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply — Barber Apprenticeship',
  description: `Apply to the ${PLATFORM_DEFAULTS.orgName} barber apprenticeship as an apprentice or approved Host Site.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply',
  },
};

export default function BarberApplyIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
              { label: 'Apply' },
            ]}
          />
          <Link
            href="/programs/barber-apprenticeship"
            className="mt-4 inline-flex text-sm font-bold text-brand-blue-700 hover:underline"
          >
            Back to Program
          </Link>
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
            Apprenticeship applications
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Choose the correct Barber application</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Future apprentices can submit a free inquiry or complete the paid enrollment application. Barbershops use the universal Host
            Site compliance application with business licensing, insurance, workers&apos;
            compensation, supervisor-license, EIN/W-9, and worksite verification.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <ApplicationCard
          image="/images/pages/barber-fade.webp"
          title="Free Inquiry"
          description="Ask questions and request admissions follow-up. This does not require payment and does not create an enrollment."
          href="/programs/barber-apprenticeship/request-info"
          cta="Submit Free Inquiry"
        />
        <ApplicationCard
          image="/images/pages/barber-apprentice-learning.webp"
          title="Enrollment Application"
          description="Review payment and BNPL choices, complete verified checkout, then apply with PARIS or the standard form."
          href="/apply/student/interview?program=barber-apprenticeship&intent=enrollment"
          cta="Start Enrollment"
        />
        <ApplicationCard
          image="/images/pages/barber-shop-interior.webp"
          title="I’m a Host Shop / Employer"
          description="Apply to host Barber apprentices using the universal beauty Host Site compliance application."
          href="/partners/host-shop/apply?program=barber"
          cta="Start Host Site Application"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          Self-pay applicants can review the server-priced $600 minimum deposit, pay-in-full,
          payment estimate, and available BNPL options from the Barber program page. Payment does
          not replace the student application or secure government-ID/SSN verification.
        </div>
      </section>
    </main>
  );
}

function ApplicationCard({
  image,
  title,
  description,
  href,
  cta,
}: {
  image: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/9] bg-slate-100">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
        <Link
          href={href}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
