import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Monitor, Wrench, Building2 } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

export const metadata: Metadata = {
  title: `Training Delivery Disclosure | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'How training delivery is disclosed at Elevate for Humanity. Delivery mode, hands-on requirements, work-based learning, clinical activity, testing, and instructional sites are program specific.',
  alternates: { canonical: `${SITE_URL}/disclosures/training-delivery` },
};

export default function TrainingDeliveryDisclosure() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400">Institutional disclosure</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Training delivery is program specific</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate does not apply one delivery model to every program. The controlling program page,
            enrollment materials, schedule, apprenticeship standard, clinical requirement, employer
            agreement, testing rule, or other applicable record determines how a learner completes each
            part of training.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">Use the exact program record</h2>
              <p className="mt-2 text-sm leading-6">
                A statement that Elevate operates online coursework, employer-based learning, testing,
                or hands-on activities does not mean every program uses every method. Delivery,
                supervision, hours, required sites, credential authority, and attendance requirements
                must be verified for the selected program.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Monitor,
              title: 'Online or LMS instruction',
              body: 'Some programs use LMS modules, video, assessments, remote instruction, or other online learning. The amount of online instruction and any deadlines or instructor-contact requirements are defined by the specific program.',
            },
            {
              icon: Wrench,
              title: 'Hands-on or work-based learning',
              body: 'Some programs require labs, clinical activity, shop practice, on-the-job learning, or employer-hosted training. A learner may participate only when the applicable program, site, supervision, safety, and authorization requirements are satisfied.',
            },
            {
              icon: Building2,
              title: 'Testing and instructional sites',
              body: 'Testing, orientation, meetings, labs, or other in-person activity occur only at locations approved or authorized for the applicable service. A public address is not evidence that every program or exam is delivered at that location.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-slate-200 p-6">
              <Icon className="h-7 w-7 text-slate-700" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold text-slate-900">Records that control delivery</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ['Program catalog and enrollment disclosures', 'Current duration, delivery mode, tuition, prerequisites, schedule, and required program components.'],
              ['Registered-apprenticeship standards', 'For a registered occupation, the applicable sponsor standards and employer/apprentice records control OJL, RTI, competencies, wages, and completion.'],
              ['Clinical or worksite agreements', 'Where a program requires a third-party site, the applicable affiliation, host, employer, supervision, safety, and participant requirements apply.'],
              ['Credential or licensing authority', 'External certification, examination, registry, and licensing requirements are controlled by the issuing or regulatory body, not by a generic Elevate delivery statement.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Verify delivery before enrollment</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review the current program record and enrollment materials before relying on a delivery,
          location, clinical, OJT, testing, or schedule statement.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/programs" className="rounded-lg bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800">
            Review Programs
          </Link>
          <Link href="/contact" className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-800 hover:bg-slate-50">
            Contact Admissions
          </Link>
        </div>
      </section>
    </main>
  );
}
