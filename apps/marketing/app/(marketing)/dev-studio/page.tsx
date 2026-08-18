import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';
import {
  ArrowRight,
  Brain,
  Code2,
  Container,
  Database,
  GitBranch,
  Monitor,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Studio | AI-Powered Development Environment | Elevate',
  description:
    'Build, test, deploy, and manage Elevate workforce applications from an authenticated development workspace with AI assistance, GitHub, Supabase, Northflank, health checks, logs, and release controls.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dev-studio' },
  openGraph: {
    title: 'Dev Studio | Elevate Platform',
    description:
      'AI-assisted development, repository workflows, database operations, deployment controls, and platform diagnostics in one authenticated workspace.',
    type: 'website',
  },
};

const CAPABILITIES = [
  {
    icon: Brain,
    title: 'AI-Assisted Development',
    description:
      'Studio includes AI-agent, skills, memory, conversation-history, and isolated WebContainer sandbox architecture for code-oriented platform work.',
  },
  {
    icon: Code2,
    title: 'Integrated Code Workspace',
    description:
      'Work with project files, code-oriented tooling, previews, API workflows, and development tasks from the authenticated Studio surface.',
  },
  {
    icon: GitBranch,
    title: 'GitHub & CI/CD',
    description:
      'Repository, branch, commit, pull-request, build-status, and GitHub Actions workflows are integrated into the platform architecture.',
  },
  {
    icon: Database,
    title: 'Supabase Operations',
    description:
      'Database, authentication, storage, schema, and administrative data workflows are integrated through Supabase and platform authorization controls.',
  },
  {
    icon: Container,
    title: 'Northflank Deployment Center',
    description:
      'Marketing, LMS, and Admin services have Northflank deployment configuration, health checks, build provenance, logs, and deployment-status integration.',
  },
  {
    icon: Monitor,
    title: 'Health, Logs & Diagnostics',
    description:
      'Studio architecture includes health surfaces, build status, deployment status, application logs, error tracking, and runtime diagnostics.',
  },
  {
    icon: Rocket,
    title: 'Release & Rollback Controls',
    description:
      'Release gates, deployment history, previous-deployment recovery, Git rollback, and database recovery mechanisms support controlled production changes. Zero-downtime is not advertised unless runtime evidence proves it.',
  },
  {
    icon: Shield,
    title: 'Security Architecture',
    description:
      'Role-based access, Supabase authentication, API guards, audit logging, secret management, and protected Admin Studio routes are part of the platform. Elevate does not claim an organization-level SOC 2 certification here without the corresponding audit report.',
  },
  {
    icon: Terminal,
    title: 'Multi-Language Development',
    description:
      'The Studio uses Monaco/WebContainer-oriented development tooling and supports modern web and server-side project workflows. A fixed “50+ languages” count is not advertised until a maintained support matrix verifies the exact number.',
  },
];

const INTEGRATIONS = ['GitHub', 'GitHub Actions', 'Supabase', 'Northflank', 'Sentry', 'Cloudflare'];

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-200">
            <Sparkles className="h-4 w-4" /> AI-powered development environment
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">Dev Studio</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-300">
            Build and operate Elevate workforce applications from one authenticated development workspace. Studio brings together AI assistance, repository workflows, Supabase operations, deployments, logs, health checks, and release controls.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={getAdminUrl('/studio')}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-4 font-bold text-white hover:bg-orange-400"
            >
              Open Studio <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/platform"
              className="rounded-xl border border-white/20 px-7 py-4 font-bold text-white hover:bg-white/10"
            >
              Explore Platform
            </Link>
          </div>
        </div>
      </section>

      <section id="capabilities" className="border-y border-white/10 bg-slate-900/60 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-black md:text-4xl">Enterprise development capabilities</h2>
            <p className="mt-4 text-lg text-slate-300">
              These capabilities are described from the repository architecture and implemented integration surfaces. Claims that require independent certification, measured productivity studies, or runtime SLA evidence are stated separately instead of being invented.
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
          <h2 className="text-3xl font-black md:text-4xl">Platform integrations</h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Studio is architected around the same services used by the Elevate platform. Runtime connection status still depends on the credentials and environment assigned to the authenticated workspace.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="text-3xl font-black">Public product. Protected operations.</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Dev Studio belongs in the public Elevate platform catalog. Repository access, database administration, deployments, secrets, logs, and other privileged actions remain behind the authenticated Admin security boundary.
          </p>
        </div>
      </section>
    </main>
  );
}
