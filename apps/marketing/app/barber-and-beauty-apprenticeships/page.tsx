import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Scissors, ShieldCheck } from 'lucide-react';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

const CANONICAL_URL = 'https://www.elevateforhumanity.org/barber-and-beauty-apprenticeships';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship & Beauty Training Pathways',
  description:
    'Explore Elevate for Humanity barber apprenticeship and beauty training pathways. Federal Registered Apprenticeship claims are limited to programs in Elevate’s canonical RAPIDS registry.',
  alternates: { canonical: CANONICAL_URL },
  robots: { index: true, follow: true },
};

const beautyPathways = [
  {
    title: 'Barber Apprenticeship',
    href: '/programs/barber-apprenticeship',
    status: 'Registered Apprenticeship',
    description:
      'Registered occupation 0030CB under Elevate’s approved sponsor standards.',
  },
  {
    title: 'Cosmetology Training Pathway',
    href: '/programs/cosmetology-apprenticeship',
    status: 'Training pathway',
    description:
      'Program details are available for training and enrollment review. No federal RAPIDS claim is made on this page.',
  },
  {
    title: 'Nail Technician Apprenticeship',
    href: '/programs/nail-technician-apprenticeship',
    status: 'Registered Apprenticeship',
    description:
      'Registered Manicurist occupation 2090CB under Elevate’s approved sponsor standards.',
  },
  {
    title: 'Esthetician Apprenticeship',
    href: '/programs/esthetician-apprenticeship',
    status: 'Registered Apprenticeship',
    description:
      'Registered Esthetician occupation 2089CB under Elevate’s approved sponsor standards.',
  },
];

export default function BarberBeautyProgramsPage() {
  const registeredPathways = beautyPathways.filter((program) =>
    getRegisteredProgramStandard(program.href.replace('/programs/', '')),
  );
  return (
    <main className="min-h-screen bg-white">
      <section className="overflow-hidden border-b border-sky-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-red-700">
            Personal Services Training
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5">
            Barber Apprenticeship & Beauty Training Pathways
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
            Elevate separates Registered Apprenticeship status from other beauty training pathways.
            A program is described as federally registered only when it exists in the canonical
            RAPIDS program registry and supporting sponsor standards.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/programs/barber-apprenticeship/apply" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Apply as an Apprentice</Link>
            <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 bg-white px-6 py-3 font-black text-brand-blue-800 hover:bg-sky-50">Become a Host Shop</Link>
          </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border-4 border-white shadow-xl sm:min-h-[420px]">
            <Image src="/images/pexels/cosmetology.webp" alt="Barber and beauty apprentice receiving supervised hands-on training" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {beautyPathways.map((program) => (
            <Link
              key={program.title}
              href={program.href}
              className="border border-slate-200 rounded-2xl p-7 hover:border-brand-red-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <Scissors className="w-6 h-6 text-brand-red-600" />
                <span className="text-xs font-bold rounded-full bg-slate-100 text-slate-700 px-3 py-1">
                  {program.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-5">{program.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{program.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-red-600" />
              <h2 className="font-bold text-slate-900">Registered beauty occupations</h2>
            </div>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Sponsor of record: {RAPIDS_CONFIG.sponsorOfRecord}. The canonical registered-program
              contract currently covers {registeredPathways.length} beauty occupations: Barber,
              Esthetician, and Manicurist. Cosmetology remains a separate training pathway and is
              not represented here as federally registered.
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-amber-950">Funding and licensure disclosure</h2>
            </div>
            <p className="text-sm text-amber-950 mt-3 leading-relaxed">
              Funding, wages, licensing eligibility, completion requirements, and employer placement
              are not guaranteed by this page. Applicants receive the requirements applicable to
              their exact program and enrollment pathway during intake.
            </p>
          </div>
        </div>
      </section>
    
      <section className="border-y border-emerald-200 bg-emerald-50 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">For Indiana employers and Host Shops</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Build your workforce with apprenticeship support</h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-700">
            It is free to apply to join Elevate’s Host Shop network. Approved employers can grow service capacity by hiring and training apprentices, developing future licensed talent, and earning revenue from the apprentice’s supervised work in accordance with wage, licensing, supervision, and program requirements.
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            Eligible employers may also qualify for workforce reimbursement or training-cost support through WorkOne, WIOA, on-the-job training, or another workforce partner. Reimbursement is not automatic or guaranteed; the employer, apprentice, occupation, costs, and funding authorization must be approved by the responsible workforce agency before costs are incurred.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800">
              Become a Host Shop — Free
            </Link>
            <Link href="/funding/wioa" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-emerald-700 bg-white px-6 py-3 font-black text-emerald-800 hover:bg-emerald-50">
              Review workforce funding
            </Link>
          </div>
        </div>
      </section>
</main>
  );
}
