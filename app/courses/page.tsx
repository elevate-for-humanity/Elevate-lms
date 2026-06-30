import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Award, ExternalLink, ChevronRight, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { PayNowButton } from '@/components/programs/PayNowButton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Short Courses | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Short-term, industry-recognized courses in CPR/First Aid, food safety, retail skills, and more. Enroll online — most complete in 4–8 hours.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/courses' },
};

// Static fallback shown when partner_courses table is empty or unavailable.
// These mirror the content on /partners/hsi and /partners/nrf.
const STATIC_COURSES = [
  {
    id: 'hsi-cpr-aed',
    partner_key: 'hsi',
    partner_name: 'Health & Safety Institute (HSI)',
    title: 'CPR & AED Training',
    description: 'Industry-recognized CPR, AED, and First Aid certification. Hands-on training with real equipment. Small class sizes (max 12).',
    duration_hours: 4,
    credential: 'HSI CPR/AED Certificate',
    category: 'health-safety',
    funding_type: 'paid',
    retail_price_cents: null,
    stripe_price_id: null,
    payment_link: null,
    partner_url: 'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-org-nts-class-sign-up',
    image_url: '/images/healthcare/cpr-certification-group.webp',
  },
  {
    id: 'hsi-first-aid',
    partner_key: 'hsi',
    partner_name: 'Health & Safety Institute (HSI)',
    title: 'First Aid & Emergency Response',
    description: 'Comprehensive first aid training covering wound care, shock, burns, and emergency response protocols.',
    duration_hours: 4,
    credential: 'HSI First Aid Certificate',
    category: 'health-safety',
    funding_type: 'paid',
    retail_price_cents: null,
    stripe_price_id: null,
    payment_link: null,
    partner_url: 'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-org-nts-class-sign-up',
    image_url: '/images/healthcare/cpr-certification-group.webp',
  },
  {
    id: 'nrf-customer-service',
    partner_key: 'nrf',
    partner_name: 'NRF Foundation RISE Up',
    title: 'Customer Service & Sales',
    description: 'NRF Foundation RISE Up credential covering customer service fundamentals, sales techniques, and retail operations.',
    duration_hours: 8,
    credential: 'NRF RISE Up Certificate',
    category: 'retail',
    funding_type: 'paid',
    retail_price_cents: null,
    stripe_price_id: null,
    payment_link: null,
    partner_url: null,
    image_url: '/images/pages/tech-classroom.webp',
  },
  {
    id: 'nrf-retail-industry',
    partner_key: 'nrf',
    partner_name: 'NRF Foundation RISE Up',
    title: 'Retail Industry Fundamentals',
    description: 'Industry-backed credential covering retail operations, inventory, loss prevention, and workplace readiness.',
    duration_hours: 8,
    credential: 'NRF RISE Up Certificate',
    category: 'retail',
    funding_type: 'paid',
    retail_price_cents: null,
    stripe_price_id: null,
    payment_link: null,
    partner_url: null,
    image_url: '/images/pages/tech-classroom.webp',
  },
];

type CourseRow = {
  id: string;
  partner_key: string;
  partner_name: string;
  title: string;
  description: string | null;
  duration_hours: number | null;
  credential: string | null;
  category: string | null;
  funding_type: string;
  retail_price_cents: number | null;
  stripe_price_id: string | null;
  payment_link: string | null;
  partner_url: string | null;
  image_url: string | null;
};

const PARTNER_COLORS: Record<string, string> = {
  hsi: 'bg-red-600',
  nrf: 'bg-blue-700',
  jri: 'bg-purple-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  'health-safety': 'Health & Safety',
  retail: 'Retail',
  workforce: 'Workforce Readiness',
  'food-safety': 'Food Safety',
  technology: 'Technology',
};

export default async function CoursesPage() {
  // Try to load from DB; fall back to static list
  let courses: CourseRow[] = [];
  const admin = getAdminClient();
  if (admin) {
    const { data } = await admin
      .from('partner_courses')
      .select(
        'id, partner_key, partner_name, title, description, duration_hours, credential, ' +
        'category, funding_type, retail_price_cents, stripe_price_id, payment_link, ' +
        'partner_url, image_url',
      )
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });
    if (data && data.length > 0) {
      courses = data as CourseRow[];
    }
  }
  if (courses.length === 0) {
    courses = STATIC_COURSES as CourseRow[];
  }

  // Group by partner
  const byPartner: Record<string, CourseRow[]> = {};
  for (const c of courses) {
    if (!byPartner[c.partner_key]) byPartner[c.partner_key] = [];
    byPartner[c.partner_key].push(c);
  }
  const partners = Object.keys(byPartner);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Short Courses' }]} />
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Partner Short Courses
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Short Courses &amp; Certifications
          </h1>
          <p className="text-slate-300 text-base max-w-2xl mb-8">
            Industry-recognized credentials you can earn in hours, not weeks. Delivered through
            our partner network — HSI, NRF Foundation, and more.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-slate-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              <BookOpen className="w-4 h-4" />
              View Full Programs
            </Link>
            <Link
              href="/apprenticeships"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-slate-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Apprenticeships
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Differentiator strip */}
      <div className="bg-brand-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
          <span>✓ Complete in 4–8 hours</span>
          <span>✓ Industry-recognized credentials</span>
          <span>✓ Enroll immediately — no waitlist</span>
          <span>✓ Klarna, Afterpay &amp; Zip accepted</span>
        </div>
      </div>

      {/* Course sections by partner */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {partners.map((partnerKey) => {
          const partnerCourses = byPartner[partnerKey];
          const partnerName = partnerCourses[0].partner_name;
          const badgeColor = PARTNER_COLORS[partnerKey] ?? 'bg-slate-700';

          return (
            <section key={partnerKey}>
              {/* Partner header */}
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
                <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${badgeColor}`}>
                  {partnerKey.toUpperCase()}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{partnerName}</h2>
                <span className="text-sm text-slate-400">
                  {partnerCourses.length} course{partnerCourses.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Course cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {partnerCourses.map((course) => {
                  const price = course.retail_price_cents
                    ? `$${(course.retail_price_cents / 100).toLocaleString()}`
                    : null;
                  const hasCheckout = !!(course.payment_link || course.stripe_price_id);
                  const categoryLabel = course.category
                    ? (CATEGORY_LABELS[course.category] ?? course.category)
                    : null;

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl border border-slate-200 flex flex-col hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      {course.image_url && (
                        <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-slate-100 flex-shrink-0">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
                          <Image
                            src={course.image_url}
                            alt={course.title}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" placeholder="empty"
                          />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 p-5">
                        {/* Category pill */}
                        {categoryLabel && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            {categoryLabel}
                          </span>
                        )}

                        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">
                          {course.title}
                        </h3>

                        {course.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">
                            {course.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                          {course.duration_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.duration_hours}h
                            </span>
                          )}
                          {course.credential && (
                            <span className="flex items-center gap-1">
                              <Award aria-label="award" className="w-3 h-3" />
                              {course.credential}
                            </span>
                          )}
                          {price && (
                            <span className="font-semibold text-slate-700">{price}</span>
                          )}
                        </div>

                        {/* CTA */}
                        {hasCheckout && price ? (
                          <PayNowButton
                            slug={course.id}
                            cost={price}
                            stripeCheckoutHref={course.payment_link ?? undefined}
                            label={`Enroll — ${price}`}
                            className="py-2.5 text-xs rounded-lg"
                          />
                        ) : course.partner_url ? (
                          <a
                            href={course.partner_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full text-center text-sm font-semibold bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-2.5 rounded-lg transition-colors"
                          >
                            Enroll
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Link
                            href={`/contact?subject=${encodeURIComponent(course.title)}`}
                            className="block w-full text-center text-sm font-semibold border border-brand-blue-300 text-brand-blue-700 py-2.5 rounded-lg hover:bg-brand-blue-50 transition-colors"
                          >
                            Request Info
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="bg-slate-50 border-t border-slate-200 py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Need a full credential program?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Short courses build foundational skills. For career-changing credentials — CNA, HVAC,
            Medical Assistant, and more — explore our full programs. Many are fully funded for
            eligible Indiana residents.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse Full Programs
            </Link>
            <Link
              href="/check-eligibility"
              className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 hover:border-slate-400 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
