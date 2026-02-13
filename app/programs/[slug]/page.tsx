export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { programs, type Program } from '@/app/data/programs';
import { ProgramTemplate } from '@/components/programs/ProgramTemplate';
import { VisualProgramTemplate } from '@/components/programs/VisualProgramTemplate';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PROGRAM_CATEGORIES } from '@/components/programs/ProgramPageWrapper';
import { EligibilityNotice } from '@/components/EligibilityNotice';

// Programs that use the new visual-first template
const VISUAL_TEMPLATE_PROGRAMS = [
  'barber',
  'barber-apprenticeship',
  'cna',
  'cna-certification',
  'healthcare',
  'beauty',
  'esthetician-apprenticeship',
  'hvac',
  'skilled-trades',
  'business',
  'tax-preparation',
  'cdl',
  'jri',
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
  const program = await loadProgram(slug);

  if (!program) {
    return {
      title: 'Program Not Found | Elevate for Humanity',
      description: 'The requested program could not be found.',
    };
  }

  return {
    title: `${program.name} | Free Training | Elevate for Humanity`,
    description: program.shortDescription,
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

  let program: Program | null = null;

  let dbOutcomes: { outcome: string }[] = [];
  let dbRequirements: { requirement: string }[] = [];

  try {
    const supabase = createPublicClient();

    if (!supabase) {
      // Fallback to static data if Supabase unavailable
      program = await loadProgram(slug);
    } else {
      // Try database first
      const { data: dbProgram } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .single();

      program = dbProgram || await loadProgram(slug);

      // Fetch outcomes from DB if program found
      if (program?.id) {
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
    }
  } catch (err) {
    // Database error - try static fallback
    try {
      program = await loadProgram(slug);
    } catch {
      // Both failed - return 404 instead of 502
      return notFound();
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
    whatYouLearn: program.what_you_learn || program.whatYouLearn,
    careerOutcomes: dbOutcomes.length > 0 
      ? dbOutcomes.map(o => o.outcome) 
      : (program.career_outcomes || program.careerOutcomes || program.outcomes),
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
      <div className="min-h-screen bg-gray-50">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-slate-50 rounded-lg">
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
                <p className="text-2xl font-bold text-green-700">
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
              <div className="mb-8 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
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
              href={program.ctaPrimary?.href || '/apply'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition font-semibold"
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
        </div>
        </div>
      </div>
    );
  }

  // Check if this program should use the visual-first template
  const useVisualTemplate = VISUAL_TEMPLATE_PROGRAMS.includes(slug);

  if (useVisualTemplate) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>
        <VisualProgramTemplate program={program} slug={slug} />
      </div>
    );
  }

  // Render full program template for complete data with breadcrumbs
  return (
    <div className="min-h-screen bg-gray-50">
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
