import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata = {
  title: 'Employment & Participant Support | Elevate for Humanity',
  description:
    'One-on-one employment support services including job readiness, applications, interview prep, employer matching, and retention support.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employment-support' },
};

export default function EmploymentSupportPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'Employment & Participant Support' }]} />

      <div className="mb-8 mt-4">
        <p className="text-sm font-semibold tracking-wide text-slate-600">
          Support Services
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Employment & Participant Support Services
        </h1>
        <p className="mt-4 text-lg leading-7 text-slate-700">
          Elevate for Humanity provides structured career training and individualized, one-on-one
          support to help participants pursue competitive community employment. Our model is not
          training-only. We support participants through the steps required to move from enrollment
          to job placement and retention.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          What we provide
        </h2>

        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          <li>One-on-one career coaching and goal planning</li>
          <li>Job readiness support (professional expectations, workplace communication, soft skills)</li>
          <li>Resume and application assistance</li>
          <li>Interview preparation and practice</li>
          <li>Employer connections and job matching through partner relationships</li>
          <li>Support addressing barriers to employment (transportation coordination and referral support as available)</li>
          <li>Follow-up support after placement to help promote retention</li>
        </ul>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            Note: We provide employment assistance and employer connections. Job placement is not guaranteed and
            depends on participant readiness, local hiring demand, and employer selection.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">
            Serving individuals with barriers to employment
          </h3>
          <p className="mt-3 text-slate-700">
            We routinely support individuals facing employment barriers, including individuals with disabilities,
            justice involvement, low-income status, and other factors that impact access to work. Support is individualized
            based on participant needs and employment goals.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">
            How this connects to training
          </h3>
          <p className="mt-3 text-slate-700">
            Participants may receive industry training (ex: HVAC certifications) while also receiving individualized
            employment support. Training builds skills. One-on-one support drives placement and retention.
          </p>
          <div className="mt-4">
            <Link
              href="/programs"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Want to partner with us?</h2>
        <p className="mt-3 text-slate-700">
          Employers can apply to partner with Elevate for Humanity to support work-based learning, hiring pipelines,
          and community employment opportunities.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/employers"
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Employer Partnerships
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Contact
          </Link>
        </div>
      </section>
    </main>
  );
}
