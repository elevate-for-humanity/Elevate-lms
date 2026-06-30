import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Building2,
  Briefcase,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Users,
  GraduationCap,
} from 'lucide-react';

// PUBLIC ROUTE — no auth required.
export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: `Employer Directory | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Browse Elevate employer partners hiring graduates in Indiana. Find OJT sponsors, apprenticeship hosts, and WOTC-participating employers.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers/directory',
  },
  openGraph: {
    title: `Employer Directory | ${PLATFORM_DEFAULTS.orgName}`,
    description:
      'Employer partners hiring Elevate graduates — OJT, apprenticeships, and direct placement.',
  },
};

type Employer = {
  id: string;
  business_name: string | null;
  company_name: string | null;
  industry: string | null;
  company_size: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  is_hiring: boolean;
  accepts_ojt: boolean;
  accepts_apprentices: boolean;
  wotc_participant: boolean;
  verified_at: string | null;
  active_job_count: number;
};

async function getEmployers(): Promise<Employer[]> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from('employer_directory')
      .select('*')
      .order('active_job_count', { ascending: false });
    return (data as Employer[]) ?? [];
  } catch {
    return [];
  }
}

export default async function EmployerDirectoryPage() {
  const employers = await getEmployers();

  const hiring = employers.filter((e) => e.is_hiring || e.active_job_count > 0);
  const ojtSponsors = employers.filter((e) => e.accepts_ojt);
  const apprenticeHosts = employers.filter((e) => e.accepts_apprentices);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Employers', href: '/employers' },
              { label: 'Directory' },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3">
            Employer Directory
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Verified employer partners hiring Elevate graduates. Browse OJT sponsors,
            apprenticeship hosts, and WOTC-participating employers across Indiana.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="bg-brand-blue-800/40 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
              {employers.length} verified employers
            </span>
            {ojtSponsors.length > 0 && (
              <span className="bg-brand-blue-800/40 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                {ojtSponsors.length} OJT sponsors
              </span>
            )}
            {apprenticeHosts.length > 0 && (
              <span className="bg-brand-blue-800/40 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                {apprenticeHosts.length} apprenticeship hosts
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Employer CTA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Want to be listed here?</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Apply to become an Elevate employer partner. Post jobs, sponsor OJT, and access
              WOTC tax credits.
            </p>
          </div>
          <Link
            href="/apply/employer"
            className="flex-shrink-0 text-sm font-semibold text-white bg-brand-red-600 hover:bg-brand-red-700 px-5 py-2.5 rounded-lg transition-colors"
          >
            Apply as Employer →
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Verified Partners',
              value: employers.length,
              icon: BadgeCheck,
              color: 'text-brand-green-600',
            },
            {
              label: 'Currently Hiring',
              value: hiring.length,
              icon: Briefcase,
              color: 'text-blue-600',
            },
            {
              label: 'OJT Sponsors',
              value: ojtSponsors.length,
              icon: GraduationCap,
              color: 'text-purple-600',
            },
            {
              label: 'Apprenticeship Hosts',
              value: apprenticeHosts.length,
              icon: Users,
              color: 'text-amber-600',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-xl p-4 text-center"
            >
              <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Employer grid */}
        {employers.length > 0 ? (
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">
              All Employer Partners
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employers.map((employer) => (
                <EmployerCard key={employer.id} employer={employer} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold">No employers listed yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              <Link
                href="/apply/employer"
                className="text-blue-600 hover:underline"
              >
                Be the first employer partner →
              </Link>
            </p>
          </div>
        )}

        {/* Program info strip */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 grid sm:grid-cols-3 gap-6">
          {[
            {
              title: 'On-the-Job Training (OJT)',
              desc: 'Get reimbursed up to 50% of wages while training a new hire. WIOA-funded through WorkOne.',
              href: '/employer/apprenticeships',
            },
            {
              title: 'WOTC Tax Credits',
              desc: 'Earn up to $9,600 per eligible hire through the Work Opportunity Tax Credit program.',
              href: '/employer/wotc',
            },
            {
              title: 'Apprenticeship Sponsorship',
              desc: 'Host a registered apprentice and build your pipeline with DOL-recognized credentials.',
              href: '/employer/apprenticeships',
            },
          ].map(({ title, desc, href }) => (
            <div key={title}>
              <p className="font-bold text-blue-900 mb-1">{title}</p>
              <p className="text-sm text-blue-700 mb-2">{desc}</p>
              <Link
                href={href}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Learn more <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        {/* Job board link */}
        <div className="text-center">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
          >
            <Briefcase className="w-4 h-4" />
            Browse all open positions on the Job Board →
          </Link>
        </div>

      </div>
    </div>
  );
}

function EmployerCard({ employer }: { employer: Employer }) {
  const name = employer.business_name ?? employer.company_name ?? 'Employer';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-4">
        {/* Logo or placeholder */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {employer.logo_url ? (
            // IMAGE-CONTRACT: allow raw img because employer logo_url is an external user-supplied URL incompatible with next/image domain config
            <img
              src={employer.logo_url}
              alt={name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="w-6 h-6 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900 text-sm leading-snug">{name}</p>
              {employer.industry && (
                <p className="text-xs text-slate-500 mt-0.5">{employer.industry}</p>
              )}
              {(employer.city || employer.state) && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {[employer.city, employer.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {employer.active_job_count > 0 && (
              <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {employer.active_job_count} open
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {employer.accepts_ojt && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                OJT
              </span>
            )}
            {employer.accepts_apprentices && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Apprenticeship
              </span>
            )}
            {employer.wotc_participant && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                WOTC
              </span>
            )}
            {employer.is_hiring && (
              <span className="text-xs font-semibold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 inline-block" />
                Hiring
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <Link
              href={`/jobs?employer=${employer.id}`}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View jobs <ChevronRight className="w-3 h-3" />
            </Link>
            {employer.website_url && (
              <a
                href={employer.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
