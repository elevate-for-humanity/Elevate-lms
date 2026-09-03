import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, GraduationCap, Handshake, ShieldCheck } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Career Training',
    description:
      'Career and technical education pathways designed around industry credentials, occupational skills, and practical training.',
    icon: GraduationCap,
  },
  {
    title: 'Funding Navigation',
    description:
      'Support identifying applicable workforce funding pathways, including WIOA, Workforce Ready Grant, Job Ready Indy, and other approved sources when available.',
    icon: ShieldCheck,
  },
  {
    title: 'Employer Connections',
    description:
      'Employer engagement, work-based learning coordination, apprenticeship support, and career-services assistance.',
    icon: Handshake,
  },
  {
    title: 'Career Services',
    description:
      'Resume support, interview preparation, job-search guidance, credential preparation, and transition-to-employment assistance.',
    icon: BriefcaseBusiness,
  },
];

export async function HomeOutcomes() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-20">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-brand-red-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white">
            WORKFORCE PATHWAYS
          </span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Training, Funding, Credentials, and Career Support
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-300">
            Elevate for Humanity is building a connected workforce-development experience that helps participants move from application and funding review into training, credential preparation, apprenticeship or work-based learning, and career services.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-slate-700 bg-slate-950/60 p-5 text-center">
          <p className="text-sm leading-6 text-slate-300">
            As a newer platform, Elevate does not publish placement, completion, wage, or participant-volume claims unless those figures are supported by verified reporting data and a defined reporting period.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 font-semibold text-white transition-colors hover:text-green-400"
          >
            Explore Career Programs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
