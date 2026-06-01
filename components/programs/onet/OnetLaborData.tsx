/**
 * OnetLaborData — Server Component
 *
 * Displays live O*NET labor market data for a program page.
 * Fetches data server-side; renders nothing if API key is absent or SOC not mapped.
 *
 * Usage:
 *   import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';
 *   <OnetLaborData slug="hvac-technician" />
 *
 * Attribution: Required by O*NET Web Services Data License.
 */
import { getOnetSnapshot } from '@/lib/onet/client';
import { getSocCode } from '@/lib/onet/soc-map';
import { TrendingUp, Briefcase, BookOpen, Wrench, Star, ExternalLink } from 'lucide-react';

interface Props {
  slug: string;
  /** Override SOC code if slug mapping is insufficient */
  socCode?: string;
}

export async function OnetLaborData({ slug, socCode }: Props) {
  const soc = socCode ?? getSocCode(slug);
  if (!soc) return null;

  const data = await getOnetSnapshot(soc);
  if (!data) return null;

  return (
    <section className="py-12 bg-slate-50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold text-brand-blue-600 uppercase tracking-widest mb-1">
              Labor Market Data
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Career Outlook: {data.title}
            </h2>
            <p className="text-slate-500 text-sm mt-1">SOC {data.soc} · O*NET {new Date().getUTCFullYear()}</p>
          </div>
          {data.brightOutlook && (
            <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 text-brand-green-800 px-4 py-2 rounded-full text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              Bright Outlook
              {data.brightOutlookReasons.length > 0 && (
                <span className="font-normal text-brand-green-700">
                  — {data.brightOutlookReasons.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Job Zone */}
          {data.jobZone > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Preparation Level
                </h3>
              </div>
              <p className="text-slate-900 font-semibold mb-1">{data.jobZoneTitle}</p>
              <p className="text-slate-600 text-sm">{data.jobZoneEducation}</p>
            </div>
          )}

          {/* Sample Job Titles */}
          {data.sampleTitles.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-brand-blue-500" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Job Titles in This Field
                </h3>
              </div>
              <ul className="space-y-1">
                {data.sampleTitles.map((title) => (
                  <li key={title} className="text-slate-700 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-400 flex-shrink-0" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Skills */}
          {data.topSkills.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-brand-red-500" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Key Skills
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Areas */}
          {data.topKnowledge.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Knowledge Areas
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.topKnowledge.map((k) => (
                  <span
                    key={k}
                    className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Core Tasks */}
        {data.coreTasks.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-3">
              What You&apos;ll Do on the Job
            </h3>
            <ul className="space-y-2">
              {data.coreTasks.map((task) => (
                <li key={task} className="text-slate-700 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 flex-shrink-0 mt-1.5" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apprenticeship badge */}
        {data.hasApprenticeships && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <span className="text-2xl">🔨</span>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                DOL Registered Apprenticeship Available
              </p>
              <p className="text-amber-800 text-xs">
                O*NET confirms registered apprenticeship pathways exist for this occupation.
              </p>
            </div>
          </div>
        )}

        {/* O*NET Attribution — required by O*NET Web Services Data License */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <a
            href="https://services.onetcenter.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="This site incorporates information from O*NET Web Services. Click to learn more."
            className="flex-shrink-0"
          >
            {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
            <img
              src="https://www.onetcenter.org/image/link/onet-in-it.svg"
              alt="O*NET in-it"
              width={130}
              height={60}
              style={{ border: 'none' }}
            />
          </a>
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              This site incorporates information from{' '}
              <a
                href="https://services.onetcenter.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700"
              >
                O*NET Web Services
              </a>{' '}
              by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
              O*NET® is a trademark of USDOL/ETA.
            </p>
            <a
              href={`https://www.onetonline.org/link/summary/${data.soc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-blue-600 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View full O*NET profile for {data.title}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
