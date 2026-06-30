import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AI_TEAM_AGENTS } from '@/lib/ai/ai-team-catalog';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `AI Team | ${PLATFORM_DEFAULTS.orgName} Store`,
  description:
    'Hire AI marketing, sales, enrollment, course, developer, and compliance agents for your training business.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/ai-team',
  },
};

export default function AiTeamStorePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Breadcrumbs
          items={[
            { label: 'Store', href: '/store' },
            { label: 'AI Team', href: '/store/ai-team' },
          ]}
        />

        <h1 className="mt-6 text-3xl font-bold text-slate-900">AI Team Marketplace</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Productized AI staff for training providers. Each agent runs tasks in your workspace via the{' '}
          <Link href="/operator" className="text-brand-red-600 underline">
            AI Operator
          </Link>
          .
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {AI_TEAM_AGENTS.map((agent) => (
            <article
              key={agent.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <h2 className="text-lg font-bold text-slate-900">{agent.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{agent.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                ${agent.priceMonthly}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {agent.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-500" />
                    {cap}
                  </li>
                ))}
              </ul>
              <Link
                href={`/store/plans?addon=ai-${agent.id}`}
                className="mt-6 inline-flex rounded-lg bg-brand-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-red-700"
              >
                Add to plan
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-900 p-6 text-center">
          <p className="text-slate-300">
            New here?{' '}
            <Link href="/launch" className="font-bold text-white underline">
              Launch your platform
            </Link>{' '}
            with a 14-day trial, then hire agents as add-ons.
          </p>
        </div>
      </div>
    </div>
  );
}
