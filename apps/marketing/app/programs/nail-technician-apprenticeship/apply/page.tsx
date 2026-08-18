import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply — Nail Technician Apprenticeship',
  description: `Apply to the ${PLATFORM_DEFAULTS.orgName} nail technician apprenticeship as an apprentice or approved host nail salon.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship/apply',
  },
};

export default function NailApplyIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
              { label: 'Apply' },
            ]}
          />
          <Link
            href="/programs/nail-technician-apprenticeship"
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
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Choose the correct Nail Technician application</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
            Apprentices complete the full student application. Nail salons use the universal beauty
            host-site application with licensing, insurance, workers&apos; compensation,
            supervisor-license, EIN/W-9, and worksite verification.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-2">
        <ApplicationCard
          image="/images/pages/nail-technician.webp"
          title="I’m an Apprentice"
          description="Complete the full student application for the Nail Technician Apprenticeship, including funding and background information."
          href="/apply/student?program=nail-technician-apprenticeship"
          cta="Start Student Application"
        />
        <ApplicationCard
          image="/images/pages/barber-apprenticeship.webp"
          title="I’m a Partner Nail Salon"
          description="Apply to host apprentices using the one beauty host-site compliance application for licensed businesses."
          href="/partners/host-shop/apply"
          cta="Start Host Site Application"
        />
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
