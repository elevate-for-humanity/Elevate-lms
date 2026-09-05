import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, MapPin, Users } from 'lucide-react';
import { EMPLOYER_TALENT_PATHWAYS } from '@/lib/marketing/employer-talent-network';

const SITE_URL = 'https://www.elevateforhumanity.org';
export const metadata: Metadata = {
  title: 'Indiana Employer Talent Network | Elevate for Humanity',
  description:
    'Indiana employers can connect with trained candidates, post jobs, and explore workforce and OJT partnership options across six career pathways.',
  alternates: { canonical: `${SITE_URL}/employers/talent-network` },
};

export default function EmployerTalentNetworkPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Elevate for Humanity Indiana Employer Talent Network',
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'State', name: 'Indiana' },
    serviceType: 'Employer recruiting and workforce partnership coordination',
    url: `${SITE_URL}/employers/talent-network`,
  };
  return (
    <main className="bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
            Indiana Employer Talent Network
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            Build a reliable talent pipeline—by industry and by region.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            Join employers using Elevate’s shared hiring portal to post openings, review candidates,
            coordinate work-based learning, and ask workforce partners about eligible OJT support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/apply/employer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-black"
            >
              Join the Employer Network <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://app.elevateforhumanity.org/employer/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-black"
            >
              Open Employer Portal
            </a>
          </div>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-wider text-red-700">
            Choose a talent pathway
          </p>
          <h2 className="mt-2 text-3xl font-black">One network. Six employer markets.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/employers/hvac-partners"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm hover:border-cyan-500"
            >
              <BriefcaseBusiness className="h-9 w-9 text-cyan-700" />
              <h3 className="mt-4 text-2xl font-black">HVAC</h3>
              <p className="mt-3 leading-7 text-slate-700">
                Contractors can explore technician recruiting, candidate introductions, and OJT
                coordination.
              </p>
              <span className="mt-5 inline-flex font-black text-blue-800">
                Explore HVAC network →
              </span>
            </Link>
            {EMPLOYER_TALENT_PATHWAYS.map((pathway) => (
              <Link
                key={pathway.slug}
                href={`/employers/talent-network/${pathway.slug}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm hover:border-blue-500"
              >
                <Users className="h-9 w-9 text-blue-800" />
                <h3 className="mt-4 text-2xl font-black">{pathway.name}</h3>
                <p className="mt-3 leading-7 text-slate-700">{pathway.summary}</p>
                <span className="mt-5 inline-flex font-black text-blue-800">
                  Open employer pathway →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Value
            icon={<BriefcaseBusiness />}
            title="Post real openings"
            text="Share the role, wage, schedule, location, start date, and required qualifications."
          />
          <Value
            icon={<Users />}
            title="Review candidate fit"
            text="Use the employer portal and Elevate introductions when matching candidates are available."
          />
          <Value
            icon={<MapPin />}
            title="Explore local support"
            text="Ask the appropriate workforce agency whether the employer, participant, and job qualify for written OJT authorization."
          />
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm font-semibold leading-6 text-slate-300">
          Participation does not guarantee candidates, hiring, credential completion, funding,
          reimbursement, retention, or business results. Employers make their own hiring decisions
          and remain responsible for onboarding, supervision, wages, safety, and applicable law.
        </p>
      </section>
    </main>
  );
}

function Value({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <div className="text-cyan-300">{icon}</div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-slate-300">{text}</p>
    </article>
  );
}
