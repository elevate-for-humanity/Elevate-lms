import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  HandHeart,
  HeartHandshake,
  Landmark,
  ShieldCheck,
  TreePine,
  Users,
} from 'lucide-react';
import { LEGAL_PARTNER_LINE } from '@/lib/config/legal-entity';

export const metadata: Metadata = {
  title: 'Rise Forward Foundation | Selfish Inc. Community Support Partner',
  description:
    'Learn how Selfish Inc. d/b/a Rise Forward Foundation works alongside Elevate for Humanity to support eligible participants with community-resource navigation and wraparound services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-forward-foundation',
  },
};

const supportAreas = [
  {
    icon: HandHeart,
    title: 'Barrier-reduction support',
    text: 'Resource navigation and supportive-service referrals that may help eligible participants address barriers to completing training or entering employment.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Financial capability & tax support',
    text: 'Community-facing financial-literacy, tax-support, and related services when available through the Foundation or its partner network.',
  },
  {
    icon: Users,
    title: 'Community connection',
    text: 'Connections to community programs, nonprofit resources, workshops, outreach, and support networks based on availability and eligibility.',
  },
  {
    icon: HeartHandshake,
    title: 'Career-readiness support',
    text: 'Supportive resources that complement training and career services without replacing employer hiring decisions or public-funding eligibility rules.',
  },
] as const;

export default function RiseForwardFoundationPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-emerald-900 bg-slate-950 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              <TreePine className="h-4 w-4" /> Selfish Inc. d/b/a Rise Forward Foundation
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Support beyond the classroom.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
              Elevate for Humanity focuses on career training, credentials, apprenticeship, and employer pathways. Rise Forward Foundation supports the broader mission by helping eligible participants connect with community and wraparound resources that can reduce barriers to progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply/student" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-slate-950 hover:bg-emerald-400">
                Apply for Training <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/check-eligibility" className="inline-flex min-h-12 items-center rounded-xl border border-white/30 px-6 py-3 font-black text-white hover:bg-white/10">
                Prepare for Funding Review
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-7 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">How the partnership works</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white p-5 text-slate-950">
                <p className="text-xs font-black uppercase tracking-wide text-brand-red-700">Elevate for Humanity</p>
                <p className="mt-2 font-black">Training, credentials, apprenticeship, career preparation, employer connections.</p>
              </div>
              <div className="rounded-2xl border border-white/15 p-5">
                <div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-cyan-300" /><p className="font-black">Workforce & public funding</p></div>
                <p className="mt-2 text-sm leading-6 text-slate-300">When available, the applicable agency—not Elevate or the Foundation—determines participant eligibility, approved costs, and funding authorization.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
                <div className="flex items-center gap-2"><HandHeart className="h-5 w-5 text-emerald-300" /><p className="font-black">Rise Forward Foundation</p></div>
                <p className="mt-2 text-sm leading-6 text-slate-200">Community and wraparound support based on available programs, resources, and participant eligibility.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">The dual-engine model</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Two organizations. One participant-centered mission.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-700">
              A credential can open a door, but transportation, finances, family responsibilities, wellness, and other barriers can still affect completion. The partnership is designed to keep training and community support connected while maintaining clear legal and funding responsibilities.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {supportAreas.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <Icon className="h-7 w-7 text-emerald-700" />
                <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-brand-blue-700" />
              <div>
                <h2 className="text-2xl font-black text-slate-950">Clear responsibility. Clear disclosures.</h2>
                <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-700">
                  Public workforce funding, charitable support, and career training are separate functions. Applying to Elevate does not guarantee WIOA, Workforce Ready Grant, another voucher, or a specific Foundation benefit. Each source has its own eligibility, availability, documentation, and authorization requirements.
                </p>
                <p className="mt-4 text-sm font-bold text-slate-900">Legal partner: {LEGAL_PARTNER_LINE}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-950 p-7 text-white">
              <BriefcaseBusiness className="h-7 w-7 text-cyan-300" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Step 1</p>
              <h3 className="mt-2 text-xl font-black">Choose a career pathway</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Review the exact program, credential goal, requirements, tuition, schedule, and funding disclosure.</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-7 text-white">
              <Landmark className="h-7 w-7 text-cyan-300" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Step 2</p>
              <h3 className="mt-2 text-xl font-black">Verify funding separately</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">If third-party funding is requested, obtain the required eligibility decision and written authorization from the responsible agency.</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-7 text-white">
              <HandHeart className="h-7 w-7 text-emerald-300" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Step 3</p>
              <h3 className="mt-2 text-xl font-black">Connect to available support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Eligible participants may be connected to Rise Forward Foundation or other community resources for available wraparound support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald-900 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black">Training is the pathway. Support helps people stay on it.</h2>
          <p className="mt-4 text-base font-medium leading-7 text-emerald-50">
            Start with the career program that fits your goal, verify the funding path that applies to you, and ask about available supportive resources during the enrollment process.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/programs" className="rounded-xl bg-white px-6 py-3 font-black text-emerald-950 hover:bg-emerald-50">Explore Programs</Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-6 py-3 font-black text-white hover:bg-white/10">Contact Admissions</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
