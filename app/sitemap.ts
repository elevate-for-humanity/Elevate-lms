import { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// force-dynamic: generated at request time — pulls live program slugs from DB.
export const dynamic = 'force-dynamic';

const ELEVATE_URL = PLATFORM_DEFAULTS.siteUrl;

const SEO_HUB_PREFIXES = [
  '/workforce-training-indianapolis',
  '/wioa-funded-training-indiana',
  '/healthcare-training-indianapolis',
  '/skilled-trades-training-indiana',
  '/it-certification-training-indianapolis',
  '/employer-workforce-partnerships-indiana',
  '/agency-referral-workforce-training-indiana',
] as const;

// Priority mapping based on route patterns
function getPriority(route: string): number {
  if (route === '/') return 1.0;
  if (route === '/apply' || route === '/programs') return 1.0;
  // SEO authority hubs — buyer-intent local/Indiana search (priority 1.0)
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 1.0;
  if (route.startsWith('/programs/')) return 0.9;
  if (route.startsWith('/apprenticeships')) return 0.9;
  if (route === '/employer/dashboard' || route === '/how-it-works') return 0.9;
  if (route.startsWith('/about') || route === '/contact') return 0.8;
  if (route.startsWith('/funding') || route.startsWith('/career')) return 0.8;
  // State-specific SEO pages - high priority
  if (route.startsWith('/career-training-')) return 0.9;
  if (route.startsWith('/community-services-')) return 0.9;
  if (route === '/testing' || route === '/testing/book') return 0.9;
  if (route.startsWith('/testing/')) return 0.8;
  if (route === '/store') return 0.9;
  if (route.startsWith('/store/guides')) return 0.8;
  if (route.startsWith('/apps')) return 0.8;
  if (route === '/mobile-app' || route === '/install-app') return 0.7;
  if (route.startsWith('/blog') || route.startsWith('/resources')) return 0.7;
  if (route.startsWith('/compliance/wioa')) return 0.5;
  if (route.startsWith('/policies') || route.startsWith('/legal/privacy') || route.startsWith('/legal'))
    return 0.4;
  return 0.6;
}

// Change frequency based on route patterns
function getChangeFreq(
  route: string,
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (route === '/' || route === '/apply') return 'daily';
  if (route.startsWith('/programs') || route.startsWith('/blog')) return 'weekly';
  if (route === '/store' || route.startsWith('/store/')) return 'weekly';
  if (route === '/testing' || route.startsWith('/testing/')) return 'monthly';
  if (route.startsWith('/apps')) return 'monthly';
  // SEO authority hubs — reviewed and updated monthly
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 'monthly';
  // State-specific pages update monthly
  if (route.startsWith('/career-training-') || route.startsWith('/community-services-'))
    return 'monthly';
  if (route.startsWith('/compliance/wioa')) return 'monthly';
  if (route.startsWith('/policies') || route.startsWith('/legal/privacy')) return 'yearly';
  return 'monthly';
}

// Static routes — only pages that actually exist as page.tsx files.
// Routes are dynamically generated from database for programs/[slug]
// and pulled from the /lms routes which exist as page.tsx files.
const STATIC_ROUTES = [
  // Core pages
  '/',
  '/about',
  '/apply',
  '/funding',
  '/portals',
  '/admin',
  '/student',
  // Static content pages
  '/barber-and-beauty-apprenticeships',
  '/funding/grant-programs',
  // Testing center
  '/testing',
  // Store
  '/store',
  // SEO/landing pages (handled by catch-all or specific pages)
  '/contact',
  '/legal/privacy',
  // Auth pages
  '/login',
  '/signup',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Fetch live program slugs from DB — only published/active, non-archived
  let programSlugs: string[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('programs')
      .select('slug')
      .or('published.eq.true,is_active.eq.true')
      .neq('status', 'archived')
      .order('slug');
    programSlugs = (data ?? []).map((r: { slug: string }) => r.slug).filter(Boolean);
  } catch {
    // DB unavailable — sitemap still returns static routes
  }

  // Deduplicate: DB slugs that already have a static route entry
  const staticProgramRoutes = new Set(
    STATIC_ROUTES.filter((r) => r.startsWith('/programs/')).map((r) => r.replace('/programs/', ''))
  );
  const dynamicProgramRoutes = programSlugs
    .filter((slug) => !staticProgramRoutes.has(slug))
    .map((slug) => `/programs/${slug}`);

  const wioaProgramRoutes = programSlugs.flatMap((slug) => [
    `/compliance/wioa/programs/${slug}`,
    `/compliance/wioa/programs/${slug}/initial-eligibility-aggregate-performance`,
    `/compliance/wioa/programs/${slug}/section-188-equal-opportunity-checklist`,
  ]);

  const allRoutes = [...STATIC_ROUTES, ...dynamicProgramRoutes, ...wioaProgramRoutes];

  return allRoutes.map((route) => ({
    url: `${ELEVATE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: getChangeFreq(route),
    priority: getPriority(route),
  }));
}
