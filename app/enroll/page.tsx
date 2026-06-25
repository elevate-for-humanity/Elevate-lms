import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { loadPublicProgramList } from '@/lib/programs/public-program-list';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Complete Your Application',
  description:
    'Enter your contact information, location, and program selection. If funded, we ask eligibility questions. If self-pay, we focus on enrollment and payment options.',
};

export const dynamic = 'force-dynamic';

export default async function EnrollPage() {
  const { programs: catalog } = await loadPublicProgramList();
  const programs = catalog.map((p) => ({
    id: p.slug,
    name: p.title,
    slug: p.slug,
    description: p.description,
    duration_weeks: p.duration ? parseInt(p.duration, 10) || null : null,
    is_free: p.funding_eligible,
    price: null,
    total_cost: null,
    funding_eligible: p.funding_eligible,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Enroll' }]} />
        </div>
      </div>

      {/* Hero - Image only */}
      <div className="relative h-[40vh] min-h-[300px]">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image sizes="100vw"
          src="/images/pages/programs-hero.webp"
          alt="Enroll in Training"
          fill
          className="object-cover"
          priority 
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Application</h2>
          <p className="text-slate-600 mb-6">
            Enter your contact information, location, and the program you're applying for. If your
            training is funded, we'll also ask questions tied to eligibility. If you're self-pay,
            we'll focus on enrollment and payment options.
          </p>

          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/apply?program=${program.slug ?? program.id}`}
                  className="block p-6 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{program.name}</h3>
                      {program.description && (
                        <p className="text-slate-600 mt-1 text-sm line-clamp-2">
                          {program.description}
                        </p>
                      )}
                      {program.duration_weeks && (
                        <p className="text-sm text-slate-500 mt-2">
                          Duration: {program.duration_weeks} weeks
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4 text-right">
                      {program.is_free === true ? (
                        <span className="inline-block px-3 py-1 bg-brand-green-100 text-brand-green-800 text-sm font-medium rounded-full">
                          Free
                        </span>
                      ) : program.funding_eligible === true ? (
                        <div>
                          <span className="inline-block px-3 py-1 bg-brand-green-100 text-brand-green-800 text-sm font-medium rounded-full">
                            Free with WIOA/WRG
                          </span>
                          {program.price || program.total_cost ? (
                            <p className="text-xs text-slate-500 mt-1">
                              or $
                              {(
                                (program.price || program.total_cost || 0) as number
                              ).toLocaleString()}{' '}
                              self-pay
                            </p>
                          ) : null}
                        </div>
                      ) : program.price || program.total_cost ? (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          ${((program.price || program.total_cost || 0) as number).toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-brand-green-100 text-brand-green-800 text-sm font-medium rounded-full">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No programs currently available for enrollment.</p>
              <Link href="/programs" className="text-blue-600 hover:underline">
                View all programs
              </Link>
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">Need Help?</h3>
          <p className="text-blue-800 mb-4">
            Our enrollment team is here to help you find the right program and funding options.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
