import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, CircleAlert, Handshake } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { buildVendorDashboard } from '@/lib/partners/vendor-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Vendor Partnerships | Elevate Admin',
  robots: { index: false, follow: false },
};

export default async function VendorPartnershipsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; review?: string }>;
}) {
  await requireRole(['super_admin', 'admin']);
  const db = await requireAdminClient();
  const results = await Promise.all([
    db
      .from('partner_lms_providers')
      .select('id,provider_name,provider_type,active,website_url,metadata'),
    db
      .from('programs')
      .select('id,slug,title,is_active,published,archived_at')
      .eq('is_active', true)
      .is('archived_at', null),
    db
      .from('program_partner_lms')
      .select('id,program_id,provider_id,is_required,auto_enroll_on_program_start'),
    db
      .from('partner_courses_catalog')
      .select('id,provider_id,course_name,is_active')
      .eq('is_active', true),
    db
      .from('partner_lms_courses')
      .select('id,provider_id,course_name,is_active')
      .eq('is_active', true),
    db
      .from('partner_course_mappings')
      .select('partner_course_id,internal_program_id,active')
      .eq('active', true),
  ]);
  // A failed read must never look like an empty or ready vendor directory.
  if (results.some((result) => result.error))
    throw new Error('VENDOR_PARTNERSHIP_DATA_UNAVAILABLE');
  const vendors = buildVendorDashboard({
    providers: results[0].data || [],
    programs: results[1].data || [],
    links: results[2].data || [],
    catalog: results[3].data || [],
    importedCourses: results[4].data || [],
    courseMappings: results[5].data || [],
  });
  const params = await searchParams;
  const query = (params?.q || '').trim().toLowerCase();
  const visible = vendors.filter(
    (v) =>
      (!query ||
        `${v.name} ${v.programs.map((p) => p.title).join(' ')}`.toLowerCase().includes(query)) &&
      (params?.review !== 'needed' || v.needsReview),
  );
  const linkedProgramCount = new Set(vendors.flatMap((v) => v.programs.map((p) => p.id))).size;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Partnership directories"
            className="mb-8 flex flex-wrap gap-3 text-sm font-bold"
          >
            <Link href="/partners" className="rounded-lg border border-white/30 px-3 py-2">
              Host Shops
            </Link>
            <Link href="/program-holders" className="rounded-lg border border-white/30 px-3 py-2">
              Program Holders
            </Link>
            <Link
              href="/partners/vendors"
              aria-current="page"
              className="rounded-lg bg-white px-3 py-2 text-slate-950"
            >
              Vendor Partnerships
            </Link>
            <Link href="/employers" className="rounded-lg border border-white/30 px-3 py-2">
              Employers
            </Link>
          </nav>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
            <Handshake className="h-4 w-4" />
            Program delivery partners
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Vendor Partnerships</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Review account evidence, course access and active program connections. An enabled vendor
            record or catalog listing does not confirm a license, enrollment, funding or a working
            integration.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        <section aria-label="Vendor overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Vendor organizations" value={vendors.length} />
          <Metric
            label="Documented account access"
            value={vendors.filter((v) => v.accountConfirmed).length}
          />
          <Metric label="Active programs linked" value={linkedProgramCount} />
          <Metric
            label="Vendors needing review"
            value={vendors.filter((v) => v.needsReview).length}
          />
        </section>
        <form
          method="get"
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1 text-sm font-bold text-slate-800">
            Find a vendor or program
            <input
              name="q"
              defaultValue={params?.q || ''}
              type="search"
              className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"
            />
          </label>
          <label className="text-sm font-bold text-slate-800">
            Review status
            <select
              name="review"
              defaultValue={params?.review || ''}
              className="mt-2 block min-h-11 rounded-lg border border-slate-300 px-3 font-normal"
            >
              <option value="">All vendors</option>
              <option value="needed">Needs review</option>
            </select>
          </label>
          <button className="min-h-11 rounded-lg bg-blue-800 px-5 font-bold text-white">
            Apply filters
          </button>
          <Link
            href="/partners/lms-integrations"
            className="min-h-11 rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold"
          >
            LMS connections
          </Link>
        </form>
        <p className="text-sm text-slate-600">
          Showing {visible.length} of {vendors.length} vendor organizations. Duplicate database
          records are grouped. Active program links include unpublished programs, labeled below.
        </p>
        {visible.length ? (
          visible.map((vendor) => (
            <article
              key={vendor.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{vendor.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {vendor.enabled ? 'Enabled in Elevate' : 'Disabled in Elevate'} ·{' '}
                    {vendor.recordCount} database record{vendor.recordCount === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-2 text-xs font-black ${vendor.needsReview ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-950'}`}
                >
                  {vendor.needsReview ? 'Needs review' : 'Setup documented'}
                </span>
              </div>
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.5fr]">
                <div className="space-y-4">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="font-black text-slate-900">Account evidence</dt>
                      <dd className="mt-1 text-slate-600">
                        {vendor.accountDetail ||
                          (vendor.accountConfirmed
                            ? 'Account access documented in source correspondence'
                            : 'Access needs confirmation')}
                      </dd>
                    </div>
                    {vendor.loginStatus && (
                      <div>
                        <dt className="font-black text-slate-900">Latest login check</dt>
                        <dd className="mt-1 text-slate-600">{vendor.loginStatus}</dd>
                      </div>
                    )}
                    {vendor.authorizedScope && (
                      <div>
                        <dt className="font-black text-slate-900">Verified scope and limits</dt>
                        <dd className="mt-1 text-slate-600">{vendor.authorizedScope}</dd>
                      </div>
                    )}
                    {vendor.proctorStatus && (
                      <div>
                        <dt className="font-black text-slate-900">Proctor setup</dt>
                        <dd className="mt-1 text-slate-600">{vendor.proctorStatus}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-black text-slate-900">Course access</dt>
                      <dd className="mt-1 text-slate-600">{vendor.courseStatus}</dd>
                    </div>
                    <div>
                      <dt className="font-black text-slate-900">Delivery</dt>
                      <dd className="mt-1 text-slate-600">{vendor.delivery}</dd>
                    </div>
                    <div>
                      <dt className="font-black text-slate-900">Website logo</dt>
                      <dd className="mt-1 text-slate-600">{vendor.logoStatus}</dd>
                    </div>
                    {vendor.contractStatus && (
                      <div>
                        <dt className="font-black text-slate-900">
                          Agreement — {vendor.contractStatus}
                        </dt>
                        <dd className="mt-1 text-slate-600">{vendor.contractSummary}</dd>
                        {vendor.contractDocument && (
                          <dd className="mt-1 text-xs text-slate-500">{vendor.contractDocument}</dd>
                        )}
                        {vendor.contractSource && (
                          <dd className="mt-2">
                            <a
                              href={vendor.contractSource}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-800 underline"
                            >
                              Open agreement correspondence
                            </a>
                          </dd>
                        )}
                      </div>
                    )}
                  </dl>
                  {vendor.warnings.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h3 className="flex items-center gap-2 text-sm font-black text-amber-950">
                        <CircleAlert className="h-4 w-4" />
                        Outstanding setup
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                        {vendor.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {vendor.nextAction && (
                    <p className="text-sm leading-6 text-slate-700">
                      <strong>Next action:</strong> {vendor.nextAction}
                    </p>
                  )}
                  {vendor.checkedAt && (
                    <p className="text-xs text-slate-500">
                      Evidence reviewed {vendor.checkedAt}. See the latest login check for live
                      access verification.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <Link
                      href={`/partners/lms-integrations/${vendor.id}`}
                      className="text-blue-800 underline"
                    >
                      Review vendor details
                    </Link>
                    {vendor.website && (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-800 underline"
                      >
                        Vendor website
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                    {vendor.portal && (
                      <a
                        href={vendor.portal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-800 underline"
                      >
                        Open vendor portal
                      </a>
                    )}
                  </div>
                  {vendor.evidence.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">
                        Source correspondence
                      </h3>
                      <ul className="mt-2 space-y-2 text-sm">
                        {vendor.evidence.map((e) => (
                          <li key={e.url}>
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-800 underline"
                            >
                              {e.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  {vendor.supplementalMaterials.length > 0 && (
                    <section className="mb-6 rounded-xl border border-slate-200 p-4">
                      <h3 className="font-black text-slate-950">Additional portal materials</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {vendor.supplementalPaymentModel}
                      </p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {vendor.supplementalMaterials.map((material) => (
                          <li key={material}>{material}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {vendor.preparedCourses.length > 0 && (
                    <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <h3 className="font-black text-slate-950">Prepared vendor courses</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-700">
                        Course shells are separate from student enrollment, paid materials and exam
                        eligibility.
                      </p>
                      <ul className="mt-3 space-y-2 text-sm">
                        {vendor.preparedCourses.map((course) => (
                          <li key={course.url}>
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-blue-800 underline"
                            >
                              {course.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <h3 className="flex items-center gap-2 font-black text-slate-950">
                    <BookOpen className="h-5 w-5 text-blue-800" />
                    Active program alignment
                  </h3>
                  {vendor.programs.length ? (
                    <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
                      {vendor.programs.map((program) => (
                        <li key={program.id} className="p-3">
                          <p className="font-bold text-slate-950">{program.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {program.slug} · {program.published ? 'Published' : 'Unpublished'} ·{' '}
                            {program.required
                              ? 'Required association'
                              : 'Planned / optional association'}
                            {program.importedCourseCount
                              ? ` · ${program.importedCourseCount} imported course mappings`
                              : ''}
                            {program.automatic
                              ? ' · Automatic enrollment enabled'
                              : ' · Staff enrollment review'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                      No active program association is recorded.
                    </p>
                  )}
                  <details className="mt-4 rounded-xl bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-800">
                      Course inventory: {vendor.catalog.length} catalog listings ·{' '}
                      {vendor.importedCourses.length} imported courses
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {vendor.importedCourses.map((c) => (
                        <li key={c.id}>
                          {c.course_name} <span className="text-xs">(imported)</span>
                        </li>
                      ))}
                      {vendor.catalog.map((c) => (
                        <li key={c.id}>
                          {c.course_name}{' '}
                          <span className="text-xs">(catalog listing; entitlement separate)</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            No vendors match these filters.
          </p>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}
