import Link from 'next/link';
import { ArrowRight, BadgeDollarSign, Building2, GraduationCap, Users } from 'lucide-react';

const POWER_UP_URL = 'https://www.in.gov/dwd/power-up/';

export function HomePowerUpIndiana() {
  return (
    <section
      className="border-y border-blue-900 bg-slate-950 px-4 py-12 sm:py-16"
      aria-labelledby="power-up-indiana-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-300">
              Indiana employers
            </p>
            <h2
              id="power-up-indiana-heading"
              className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Power up your workforce with skills employees can use on the job.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              Power Up Indiana helps eligible Hoosier employers develop current workers through
              employer-led training, advancement, and wage growth. Training reimbursement may be
              available when the employer, worker, training, and costs meet Indiana Department of
              Workforce Development requirements.
            </p>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Elevate can help employers identify relevant training and organize the next steps.
              Eligibility and reimbursement are determined by Indiana DWD—not guaranteed by
              Elevate.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/contact?topic=power-up-indiana"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950 hover:bg-amber-300"
              >
                Plan Employer Training <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <a
                href={POWER_UP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white/50 px-6 py-3 font-black text-white hover:border-white hover:bg-slate-800"
              >
                Review Official DWD Information
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" aria-label="Power Up Indiana employer benefits">
            {[
              {
                icon: Users,
                title: 'Develop current employees',
                copy: 'Build internal talent pipelines and prepare workers for advancement.',
              },
              {
                icon: GraduationCap,
                title: 'Choose relevant training',
                copy: 'Connect workforce needs with practical skills and credential pathways.',
              },
              {
                icon: BadgeDollarSign,
                title: 'Explore reimbursement',
                copy: 'Review eligible training costs and reimbursement requirements with DWD.',
              },
              {
                icon: Building2,
                title: 'Employers of all sizes',
                copy: 'The state describes the initiative as open to businesses across industries.',
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <Icon className="h-7 w-7 text-amber-300" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-200">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
