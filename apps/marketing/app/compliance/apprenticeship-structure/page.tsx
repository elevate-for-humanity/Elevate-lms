import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Users, Building } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export const metadata: Metadata = {
  title: 'Apprenticeship Structure | Compliance',
  description: 'Understand how Elevate apprenticeship programs combine occupation-specific on-the-job learning, related technical instruction, documentation, supervision, and completion requirements.',
};

export default function ApprenticeshipStructurePage() {
  const barber = getRegisteredProgramStandard('barber-apprenticeship');
  const structure = [
    { label: 'On-the-Job Learning (OJL)', desc: 'Paid, supervised work-based learning at an approved employer or host site. Work records remain part of the apprenticeship evidence; the registered occupation determines whether hours or competencies control completion.' },
    { label: 'Related Technical Instruction (RTI)', desc: 'Structured theory and technical instruction delivered through the approved curriculum. RTI requirements are occupation-specific and must be documented and verified.' },
    { label: 'Competency & Documentation', desc: 'Work evidence, competencies, mentor verification, required documents, RTI, wages, and completion evidence are recorded throughout the apprenticeship.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/apprenticeship-structure.webp"
        alt="Apprenticeship compliance records and training documentation"
        eyebrow="Compliance"
        title="Registered Apprenticeship Structure"
        description="Registered Apprenticeships follow occupation-specific standards. Elevate combines supervised on-the-job learning, related technical instruction, mentor verification, and documented completion requirements."
        actions={(
          <>
            <Link href="/programs/apprenticeships" className="rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">View Apprenticeships</Link>
            <Link href="/partners/host-shop/apply" className="rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Host Site Application</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Core Structure</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-slate-700">Do not use one hour total for every occupation. The registered standard for each program controls the RTI, competencies, supervision, wage progression, evidence, and completion basis.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {structure.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-6">
                <Award className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-2 font-bold text-slate-950">{item.label}</h3>
                <p className="text-sm leading-6 text-slate-700">{item.desc}</p>
              </div>
            ))}
          </div>

          {barber ? (
            <div className="mt-8 rounded-xl border border-brand-blue-200 bg-brand-blue-50 p-6">
              <p className="font-bold text-slate-950">Barber Apprenticeship example — RAPIDS {barber.standard.rapidsCode}</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">The approved Barber occupation is competency-based. Completion requires all {barber.completion.competencyCount} verified competencies plus {barber.completion.requiredRtiHours} verified RTI hours, together with the required placement, supervision, wage, and sponsor records. Work/OJL hours are retained as auditable evidence; they are not a fixed completion denominator for this occupation.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">Participant Requirements</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-950"><Users className="h-5 w-5 text-brand-blue-700" /> Apprentices</h3>
              <ul className="space-y-3">
                {['Complete the formal application and eligibility steps', 'Complete secure identity and required document verification', 'Meet the occupation-specific entry requirements', 'Work under an approved employer/host site when required', 'Complete and document the registered occupation’s RTI, competencies, work evidence, and required assessments'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-950"><Building className="h-5 w-5 text-brand-blue-700" /> Employers / Host Sites</h3>
              <ul className="space-y-3">
                {['Complete the Host Site application and compliance review', 'Maintain the required business and professional licensing', 'Maintain required liability insurance and workers’ compensation/exemption documentation', 'Provide qualified supervision and verify work records and competencies', 'Maintain wage, worksite, safety, RTI, and apprenticeship records as required'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">Apprenticeship Flow</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { step: '1', title: 'Apply', desc: 'Submit the complete student or host-site application.' },
              { step: '2', title: 'Verify', desc: 'Complete eligibility, identity, licensing, documents, and worksite review.' },
              { step: '3', title: 'Train', desc: 'Complete the occupation-specific work, RTI, competency, and supervision requirements.' },
              { step: '4', title: 'Complete', desc: 'Satisfy the registered completion basis, required assessments, records, and credential/licensure steps.' },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-700 text-lg font-bold text-white">{s.step}</div>
                <h3 className="mb-1 font-bold text-slate-950">{s.title}</h3>
                <p className="text-sm text-slate-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Ready to Start?</h2>
          <p className="mb-8 text-slate-700">Choose the apprenticeship first so the correct occupation-specific requirements are applied.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply/student" className="rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Student Application</Link>
            <Link href="/partners/host-shop/apply" className="rounded-lg border-2 border-slate-300 px-8 py-4 font-bold text-slate-800 transition-colors hover:bg-slate-50">Host Site Application</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
