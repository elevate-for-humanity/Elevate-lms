import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';
import {
  ArrowRight,
  Code2,
  Container,
  Database,
  GitBranch,
  Monitor,
  Shield,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Studio | Elevate Platform',
  description:
    'Explore Elevate Dev Studio, the authenticated development workspace for repository, database, deployment, and platform operations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/dev-studio',
  },
  openGraph: {
    title: 'Dev Studio | Elevate Platform',
    description:
      'An authenticated development workspace for Elevate platform operations and configured integrations.',
    type: 'website',
  },
};

const CAPABILITIES = [
  {
    icon: Code2,
    title: 'Development Workspace',
    description:
      'Centralize code-oriented platform workflows in the authenticated Admin Studio instead of exposing development controls on the public site.',
  },
  {
    icon: GitBranch,
    title: 'GitHub Workflows',
    description:
      'Repository, branch, pull-request, and CI/CD workflows can be connected through the configured GitHub integration and permissions.',
  },
  {
    icon: Database,
    title: 'Supabase Operations',
    description:
      'Database and authentication workflows can use the platform Supabase integration subject to role, policy, and environment configuration.',
  },
  {
    icon: Container,
    title: 'Deployment Operations',
    description:
      'Deployment controls can integrate with the configured hosting and container environment. Production actions remain gated by credentials and release checks.',
  },
  {
    icon: Monitor,
    title: 'Health & Diagnostics',
    description:
      'Studio surfaces can expose application health, logs, workflow results, and diagnostics where the underlying service provides verified data.',
  },
  {
    icon: Shield,
    title: 'Authenticated Access',
    description:
      'Operational Studio routes belong to the Admin security boundary and should enforce role-based authorization, auditability, and least-privilege access.',
  },
];

const INTEGRATIONS = ['GitHub', 'Supabase', 'Northflank', 'GitHub Actions'];

export default function DevStudioPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/platform" className="font-bold text-white hover:text-orange-300">
            Elevate Platform
          </Link>
          <a
            href={getAdminUrl('/studio')}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Open Admin Studio
          </a>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-200">
            <Sparkles className="h-4 w-4" />
            Authenticated platform tooling
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">Dev Studio</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-300">
            The development and operations workspace for Elevate platform services. Public pages describe the
            available architecture; actual capabilities depend on the connected repository, database, hosting,
            credentials, and role permissions in the authenticated environment.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={getAdminUrl('/studio')}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-4 font-bold text-white hover:bg-orange-400"
            >
              Open Studio <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/contact"
              className="rounded-xl border border-white/20 px-7 py-4 font-bold text-white hover:bg-white/10"
            >
              Request Platform Information
            </Link>
          </div>
        </div>
      </section>

      <section id="capabilities" className="border-y border-white/10 bg-slate-900/60 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-black md:text-4xl">Capabilities, not unsupported promises</h2>
            <p className="mt-4 text-lg text-slate-300">
              This page intentionally avoids customer-count, productivity, certification, uptime, language-count,
              and deployment claims unless those claims are backed by current evidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <Icon className="h-7 w-7 text-orange-400" />
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-relaxed text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="integrations" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black md:text-4xl">Configured integrations</h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            An integration being supported by the codebase does not mean every environment is connected. Runtime
            status must be verified in the authenticated service before it is represented as active.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((name) => (
              <div key={name} className="rounded-xl border border-white/10 bg-slate-900 p-5 text-center font-semibold">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black">Why this page is public</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Dev Studio is part of the Elevate platform offering, so the product overview belongs on the public
            marketing site. Operational controls remain in the authenticated Admin Studio. That separation keeps
            product discovery public without exposing privileged development functions.
          </p>
        </div>
      </section>
    </main>
  );
}
