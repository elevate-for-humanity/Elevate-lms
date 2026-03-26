import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import RequestInfoForm from './RequestInfoForm';
import { getProgramBySlug } from '@/lib/programs/get-program';

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = await getProgramBySlug(params.slug);
  if (!program) return { title: 'Request Information | Elevate for Humanity' };
  return {
    title: `Request Information — ${program.title} | Elevate for Humanity`,
    description: `Get answers about the ${program.title} program — funding options, schedule, credentials, and enrollment.`,
  };
}

export default async function RequestInfoPage({ params }: Props) {
  const program = await getProgramBySlug(params.slug);
  if (!program) notFound();

  const programPageHref = `/programs/${params.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: program.title, href: programPageHref },
            { label: 'Request Information' },
          ]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href={programPageHref}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {program.title}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-wide mb-1">{program.category}</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Information</h1>
          <p className="text-slate-600 text-lg">
            Get answers about the <strong>{program.title}</strong> program — funding, schedule, credentials, and how to enroll.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <RequestInfoForm
              slug={params.slug}
              programTitle={program.title}
              applyHref={program.cta.applyHref}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Program quick facts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Program Details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="font-semibold text-slate-800">{program.durationWeeks} weeks</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Hours/Week</dt>
                  <dd className="font-semibold text-slate-800">{program.hoursPerWeekMin}–{program.hoursPerWeekMax} hrs</dd>
                </div>
                {program.credentials?.[0] && (
                  <div>
                    <dt className="text-slate-500">Primary Credential</dt>
                    <dd className="font-semibold text-slate-800">{program.credentials[0].name}</dd>
                  </div>
                )}
                {program.enrollmentTracks?.[0]?.nextCohortDate && (
                  <div>
                    <dt className="text-slate-500">Next Start</dt>
                    <dd className="font-semibold text-slate-800">{program.enrollmentTracks[0].nextCohortDate}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Ready to apply */}
            <div className="bg-brand-blue-50 rounded-xl border border-brand-blue-100 p-5">
              <h3 className="font-bold text-brand-blue-900 mb-2 text-sm">Ready to Apply?</h3>
              <p className="text-brand-blue-800 text-sm mb-3">Free to apply. Takes 5 minutes.</p>
              <Link
                href={program.cta.applyHref}
                className="block w-full text-center bg-brand-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-blue-700 transition"
              >
                Apply Now
              </Link>
            </div>

            {/* Call us */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Prefer to call?</h3>
              </div>
              <a
                href="tel:3173143757"
                className="text-brand-blue-600 font-bold hover:underline"
              >
                (317) 314-3757
              </a>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">Mon–Fri, 9am–5pm ET</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
