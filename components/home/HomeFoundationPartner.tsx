import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  HandHeart,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { LEGAL_PARTNER_LINE } from '@/lib/config/legal-entity';

const pillars = [
  {
    icon: GraduationCap,
    eyebrow: 'Career Training',
    title: 'Elevate for Humanity',
    description:
      'Career and technical training, Registered Apprenticeship pathways, credentials, career preparation, and employer connections.',
  },
  {
    icon: Landmark,
    eyebrow: 'Training Funding',
    title: 'Workforce & Public Programs',
    description:
      'Eligible participants may qualify for approved workforce or public funding. The responsible funding agency determines eligibility, covered costs, and authorization.',
  },
  {
    icon: HandHeart,
    eyebrow: 'Wraparound Support',
    title: 'Selfish Inc. / Rise Forward Foundation',
    description:
      'Community-resource navigation and supportive services designed to help eligible participants address barriers that can interfere with training, employment, and economic stability.',
  },
] as const;

export function HomeFoundationPartner() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-14 sm:py-16" aria-labelledby="foundation-partner-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            <ShieldCheck className="h-4 w-4" /> Training + funding + support
          </span>
          <h2 id="foundation-partner-title" className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Two Organizations. One Complete Mission.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
            Elevate for Humanity focuses on skills, credentials, apprenticeship, and employment pathways. Selfish Inc. d/b/a Rise Forward Foundation supports the broader mission through community and wraparound resources. Public funding, when available, remains controlled by the applicable funding agency.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, eyebrow, title, description }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">{eyebrow}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-emerald-300">
                <BriefcaseBusiness className="h-5 w-5" />
                <p className="text-xs font-black uppercase tracking-[0.18em]">One participant journey</p>
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">Career goal → funding review → training → support → credential → employment</h3>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-300">
                Support is based on program availability and participant eligibility. No website statement, application, or referral guarantees public funding or a specific charitable benefit.
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-400">Foundation partner: {LEGAL_PARTNER_LINE}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/rise-forward-foundation" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 hover:bg-emerald-400">
                Explore Rise Forward <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/eligibility/quiz" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 py-3 font-black text-white hover:bg-white/10">
                Check Funding Eligibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
