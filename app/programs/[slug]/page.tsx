import { createAdminClient } from '@/lib/supabase/admin';

import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { programs } from '@/app/data/programs';
import { ProgramTemplate } from '@/components/programs/ProgramTemplate';
import { VisualProgramTemplate } from '@/components/programs/VisualProgramTemplate';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PROGRAM_CATEGORIES } from '@/components/programs/ProgramPageWrapper';
import { EligibilityNotice } from '@/components/EligibilityNotice';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { PROGRAMS } from '@/lib/ai/programRegistry';

// Programs that use the new visual-first template (DB canonical slugs + aliases)
const VISUAL_TEMPLATE_PROGRAMS = [
  'barber-apprenticeship',
  'cna-cert',
  'esthetician',
  'hvac-technician',
  'cdl-training',
  'tax-prep',
  'business-startup',
  'peer-recovery-specialist',
  'beauty-career-educator',
  'phlebotomy-technician',
  // Aliases that may still be hit before redirect
  'barber', 'cna', 'cna-certification', 'healthcare', 'beauty',
  'esthetician-apprenticeship', 'hvac', 'skilled-trades', 'business',
  'tax-preparation', 'cdl', 'jri',
];

// Cache program pages for 10 minutes - eliminates 21s+ load times
export const revalidate = 600;

type Params = Promise<{ slug: string }>;

const SITE_URL = 'https://www.elevateforhumanity.org';


// Load program from JSON file or TypeScript data
async function loadProgram(slug: string): Promise<Program | null> {
  // First, try to load from JSON file
  const jsonPath = path.join(process.cwd(), 'data', 'programs', `${slug}.json`);

  if (fs.existsSync(jsonPath)) {
    try {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(fileContent);
      return data as Program;
    } catch (error) { /* Error handled silently */ }
  }

  // Fallback to TypeScript data
  return programs.find((p) => p.slug === slug) || null;
}

// Generate static paths for all programs at build time
export async function generateStaticParams() {
  const programSlugs: string[] = [];

  // Get slugs from TypeScript data
  programSlugs.push(...programs.map((p) => p.slug));

  // Get slugs from JSON files
  const jsonDir = path.join(process.cwd(), 'data', 'programs');
  if (fs.existsSync(jsonDir)) {
    const files = fs.readdirSync(jsonDir);
    const jsonSlugs = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''));
    programSlugs.push(...jsonSlugs);
  }

  // Get all active slugs from DB
  try {
    const supabase = createAdminClient();
    const { data: dbPrograms } = await supabase
      .from('programs')
      .select('slug')
      .eq('status', 'active');
    if (dbPrograms) {
      programSlugs.push(...dbPrograms.map((p: { slug: string }) => p.slug));
    }
  } catch {
    // DB unavailable at build time — static data only
  }

  // Remove duplicates
  const uniqueSlugs = [...new Set(programSlugs)];

  return uniqueSlugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  let program = await loadProgram(slug);

  // Fallback to DB if no static data
  if (!program) {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase
          .from('programs')
          .select('name, description')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();
        program = data;
      }
    } catch { /* DB unavailable */ }
  }

  if (!program) {
    return {
      title: 'Program Not Found | Elevate for Humanity',
      description: 'The requested program could not be found.',
    };
  }

  return {
    title: `${program.name} | Career Training | Elevate for Humanity`,
    description: program.shortDescription || program.description,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/programs/${slug}`,
    },
    openGraph: {
      title: program.name,
      description: program.shortDescription,
      type: 'website',
      url: `https://www.elevateforhumanity.org/programs/${slug}`,
    },
  };
}

// Main page component - Server Component by default
export default async function ProgramDetailPage({
  params,
}: {
  params: Params;
}) {
  let slug: string;
  
  try {
    slug = (await params).slug;
  } catch {
    return notFound();
  }

  // Validate slug format to prevent bad queries
  if (!slug || typeof slug !== 'string' || slug.length > 100) {
    return notFound();
  }

  // Slugs that have dedicated page.tsx files (real content, not redirects).
  // The catch-all must skip these to avoid shadowing them.
  // Redirect-only pages (cdl, cna, hvac, beauty, etc.) are NOT listed here
  // because Next.js serves the redirect page first, not the catch-all.
  // Every directory under app/programs/ that has its own page.tsx.
  // The catch-all must not render these — Next.js should serve the static page.
  const DEDICATED_PAGES = [
    // Individual program pages
    'barber-apprenticeship', 'bookkeeping', 'business',
    'cad-drafting', 'cdl', 'cdl-training', 'cna', 'cna-certification',
    'cosmetology-apprenticeship', 'cpr-first-aid', 'culinary-apprenticeship',
    'cybersecurity-analyst', 'diesel-mechanic', 'electrical',
    'entrepreneurship', 'finance-bookkeeping-accounting',
    'forklift', 'construction-trades-certification',
    'graphic-design', 'hvac-technician', 'it-help-desk',
    'medical-assistant', 'nail-technician-apprenticeship',
    'network-administration', 'network-support-technician',
    'office-administration', 'peer-recovery-specialist',
    'pharmacy-technician', 'plumbing', 'project-management',
    'sanitation-infection-control', 'software-development',
    'tax-preparation', 'web-development', 'welding',
    // Category landing pages
    'healthcare', 'skilled-trades', 'technology',
    'micro-programs', 'federal-funded', 'apprenticeships',
  ];
  if (DEDICATED_PAGES.includes(slug)) {
    return notFound();
  }

  let program: Program | null = null;

  let dbOutcomes: { outcome: string }[] = [];
  let dbRequirements: { requirement: string }[] = [];

  // Try static data first (fast, no network)
  program = await loadProgram(slug);

  // If no static data, query DB using canonical data layer
  if (!program) {
    try {
      const { getProgramBySlug: getDbProgram } = await import('@/lib/db/programs');
      const dbProgram = await getDbProgram(slug);
      // Map DbProgram shape to the display shape expected by this page
      program = {
        ...dbProgram,
        name: dbProgram.title,
        // Map DB funding to display-compatible shape
        fundingOptions: dbProgram.program_funding
          ?.filter(f => f.is_active)
          .map(f => f.type) ?? [],
      };
    } catch {
      // Program not in DB — will 404 below
    }
  }

  // Fetch outcomes/requirements from DB if program has an ID
  if (program?.id) {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data: outcomes } = await supabase
          .from('program_outcomes')
          .select('outcome')
          .eq('program_id', program.id)
          .order('outcome_order', { ascending: true });

        const { data: requirements } = await supabase
          .from('program_requirements')
          .select('requirement')
          .eq('program_id', program.id)
          .order('requirement_order', { ascending: true });

        dbOutcomes = outcomes || [];
        dbRequirements = requirements || [];
      }
    } catch {
      // Non-fatal — page renders without outcomes/requirements
    }
  }

  // Return 404 if program not found
  if (!program) {
    return notFound();
  }

  // Get category for breadcrumbs
  const category = PROGRAM_CATEGORIES[slug];
  const breadcrumbItems = [
    { label: 'Programs', href: '/programs' },
    ...(category ? [{ label: category.name, href: category.href }] : []),
    { label: program.name || slug },
  ];

  // Map database fields to display fields
  const displayProgram = {
    name: program.name || program.title,
    description: program.full_description || program.description || program.longDescription || program.shortDescription || program.excerpt,
    shortDescription: program.excerpt || program.shortDescription || program.description,
    duration: program.duration_weeks ? `${program.duration_weeks} weeks` : program.duration || program.estimated_weeks ? `${program.estimated_weeks} weeks` : null,
    hours: program.training_hours || program.estimated_hours,
    credential: program.credential_name || program.credential_type,
    deliveryMethod: program.delivery_method,
    cost: program.total_cost,
    salaryMin: program.salary_min,
    salaryMax: program.salary_max,
    whatYouLearn: (() => {
      const raw = program.what_you_learn || program.whatYouLearn;
      if (!raw) return null;
      if (!Array.isArray(raw)) return [String(raw)];
      return raw.map((item: any) => {
        if (typeof item === 'string') return item;
        return item?.topic || item?.title || item?.statement || String(item);
      });
    })(),
    careerOutcomes: (() => {
      const raw = dbOutcomes.length > 0
        ? dbOutcomes.map(o => o.outcome)
        : (program.career_outcomes || program.careerOutcomes || program.outcomes);
      if (!Array.isArray(raw)) return raw ? [String(raw)] : [];
      // Flatten objects to strings — DB may return {outcome:string} or {statement:string}
      return raw.map((item: any) => {
        if (typeof item === 'string') return item;
        return item?.outcome || item?.statement || item?.title || JSON.stringify(item);
      });
    })(),
    prerequisites: dbRequirements.length > 0
      ? dbRequirements.map(r => r.requirement).join(', ')
      : program.prerequisites,
    fundingEligible: program.funding_eligible || program.wioa_approved,
    placementRate: program.placement_rate,
    completionRate: program.completion_rate,
  };

  // If program has minimal data (from simple JSON), render simple template
  if (!program.heroTitle || !program.whatYouLearn) {
    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>
        
        <div className="py-16 px-6 bg-white text-black">
          <div className="max-w-4xl mx-auto">
            {/* Eligibility Notice */}
            <EligibilityNotice variant="banner" className="mb-6" />
            
            <h1 className="text-3xl font-bold mb-6">{displayProgram.name}</h1>
            
            {/* Program Quick Facts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-white rounded-lg">
              {displayProgram.duration && (
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{displayProgram.duration}</p>
                </div>
              )}
              {displayProgram.hours && (
                <div>
                  <p className="text-sm text-gray-500">Training Hours</p>
                  <p className="font-semibold">{displayProgram.hours} hours</p>
                </div>
              )}
              {displayProgram.credential && (
                <div>
                  <p className="text-sm text-gray-500">Credential</p>
                  <p className="font-semibold">{displayProgram.credential}</p>
                </div>
              )}
              {displayProgram.deliveryMethod && (
                <div>
                  <p className="text-sm text-gray-500">Format</p>
                  <p className="font-semibold capitalize">{displayProgram.deliveryMethod}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">About This Program</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {displayProgram.description}
              </p>
            </div>

            {/* Salary Range */}
            {(displayProgram.salaryMin || displayProgram.salaryMax) && (
              <div className="mb-8 p-4 bg-white rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Earning Potential</h2>
                <p className="text-2xl font-bold text-brand-green-700">
                  ${displayProgram.salaryMin?.toLocaleString() || '—'} - ${displayProgram.salaryMax?.toLocaleString() || '—'} / year
                </p>
              </div>
            )}

            {/* What You'll Learn */}
            {displayProgram.whatYouLearn && displayProgram.whatYouLearn.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">What You'll Learn</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {(Array.isArray(displayProgram.whatYouLearn) ? displayProgram.whatYouLearn : [displayProgram.whatYouLearn]).map((item: string, idx: number) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Career Outcomes */}
            {displayProgram.careerOutcomes && displayProgram.careerOutcomes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Career Outcomes</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {(Array.isArray(displayProgram.careerOutcomes) ? displayProgram.careerOutcomes : [displayProgram.careerOutcomes]).map((item: string, idx: number) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {displayProgram.prerequisites && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Prerequisites</h2>
                <p className="text-gray-700">{displayProgram.prerequisites}</p>
              </div>
            )}

            {/* Funding Badge */}
            {displayProgram.fundingEligible && (
              <div className="mb-8 inline-block px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium">
                • Funding Available (WIOA Eligible)
              </div>
            )}

            {/* Cost */}
            {displayProgram.cost && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Program Cost</h2>
                <p className="text-2xl font-bold">${Number(displayProgram.cost).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Financial assistance may be available</p>
              </div>
            )}

          <div className="mt-10 flex gap-4">
            <Link
              href={program.ctaPrimary?.href || `/apply?program=${slug}`}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-xl transition font-semibold"
            >
              {program.ctaPrimary?.label || 'Apply Now'}
            </Link>
            <Link
              href="/programs"
              className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-xl transition"
            >
              Back to Programs
            </Link>
          </div>
          {PROGRAMS[slug] && (
            <div className="mt-6 bg-white rounded-xl p-6">
              <ProgramTutorCTA
                programSlug={slug}
                programName={displayProgram.title}
                applyHref={program.ctaPrimary?.href || `/apply?program=${slug}`}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Check if this program should use the visual-first template
  const useVisualTemplate = VISUAL_TEMPLATE_PROGRAMS.includes(slug);

  if (useVisualTemplate) {
    return <VisualProgramTemplate program={program} slug={slug} />;
  }

  // Render full program template for complete data with breadcrumbs
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.name,
    description: program.shortDescription || program.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Elevate for Humanity Career & Technical Institute',
      url: 'https://www.elevateforhumanity.org',
    },
    url: `https://www.elevateforhumanity.org/programs/${slug}`,
    ...(program.duration && { timeRequired: program.duration }),
    ...(program.tuition && { offers: { '@type': 'Offer', price: program.tuition, priceCurrency: 'USD' } }),
    educationalCredentialAwarded: program.credential || program.name,
    isAccessibleForFree: !program.price && program.fundingEligible !== false,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>
      <ProgramTemplate program={program} />
    </div>
  );
}
