import Link from 'next/link';
import { ArrowRight, Building2, GraduationCap, UsersRound } from 'lucide-react';

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'For learners',
    body: 'Explore a career path, apply, complete training, track progress, and prepare for recognized credentials.',
  },
  {
    icon: Building2,
    title: 'For employers and Host Shops',
    body: 'Connect with apprentices, manage workplace training, complete required documents, and verify progress.',
  },
  {
    icon: UsersRound,
    title: 'For workforce partners',
    body: 'Coordinate referrals, eligibility, training records, outcomes, and participant support in one place.',
  },
];

export function HomeAboutElevate() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">Who Elevate is</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            A workforce and education hub built to connect the whole journey.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Elevate for Humanity is a career-training and workforce-development organization. We
            connect people to practical education, registered apprenticeship pathways, possible
            funding resources, industry credentials, supportive employers, and the technology used
            to manage each step.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Icon className="h-8 w-8 text-brand-blue-700" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-700">{body}</p>
            </article>
          ))}
        </div>
        <Link href="/about" className="mt-8 inline-flex min-h-11 items-center gap-2 font-extrabold text-brand-blue-800 hover:text-brand-red-700">
          Learn more about Elevate <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
