import type { MetadataRoute } from 'next';
import { ROUTES } from '@/lib/navigation/routes';

const baseUrl = 'https://www.elevateforhumanity.org';
const lastModified = new Date('2026-08-09T00:00:00-04:00');

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: ROUTES.home, changeFrequency: 'weekly', priority: 1 },
    { path: ROUTES.programs, changeFrequency: 'weekly', priority: 0.95 },
    { path: ROUTES.apply, changeFrequency: 'monthly', priority: 0.95 },
    { path: ROUTES.apprenticeships, changeFrequency: 'weekly', priority: 0.95 },
    { path: ROUTES.apprenticeshipsHowItWorks, changeFrequency: 'monthly', priority: 0.85 },
    { path: ROUTES.programsBeauty, changeFrequency: 'weekly', priority: 0.95 },
    { path: ROUTES.apprenticeshipsHostShop, changeFrequency: 'weekly', priority: 0.9 },
    { path: ROUTES.apprenticeshipSponsor, changeFrequency: 'monthly', priority: 0.85 },
    { path: ROUTES.testing, changeFrequency: 'weekly', priority: 0.9 },
    { path: ROUTES.funding, changeFrequency: 'weekly', priority: 0.9 },
    { path: ROUTES.fundingWIOA, changeFrequency: 'monthly', priority: 0.85 },
    { path: '/funding/wrg', changeFrequency: 'monthly', priority: 0.85 },
    { path: ROUTES.fundingJobReadyIndy, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.fundingVocRehab, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.scholarships, changeFrequency: 'monthly', priority: 0.75 },
    { path: ROUTES.eligibility, changeFrequency: 'monthly', priority: 0.85 },
    { path: '/tuition-fees', changeFrequency: 'weekly', priority: 0.85 },
    { path: ROUTES.employers, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.employersHireGraduates, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.forAgencies, changeFrequency: 'monthly', priority: 0.75 },
    { path: ROUTES.about, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.aboutApprovals, changeFrequency: 'monthly', priority: 0.9 },
    { path: ROUTES.successStories, changeFrequency: 'monthly', priority: 0.75 },
    { path: '/institutional-governance', changeFrequency: 'monthly', priority: 0.85 },
    { path: ROUTES.contact, changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.blog, changeFrequency: 'weekly', priority: 0.7 },
    { path: ROUTES.faq, changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/legal', changeFrequency: 'yearly', priority: 0.55 },
    { path: '/accessibility', changeFrequency: 'yearly', priority: 0.55 },
    { path: '/federal-compliance', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compliance/center', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/partners', changeFrequency: 'monthly', priority: 0.8 },
    { path: ROUTES.store, changeFrequency: 'weekly', priority: 0.9 },
    { path: ROUTES.storeDemo, changeFrequency: 'weekly', priority: 0.85 },
    { path: '/store/plans', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/store/trial', changeFrequency: 'weekly', priority: 0.85 },
  ];

  const programRoutes = [
    ROUTES.programsHealthcare,
    ROUTES.programsCNA,
    ROUTES.programsMedicalAssistant,
    ROUTES.programsPhlebotomy,
    ROUTES.programsQMA,
    ROUTES.programsHVAC,
    '/programs/skilled-trades',
    ROUTES.programsCDL,
    ROUTES.programsBarber,
    '/programs/barber-apprenticeship/apply',
    '/programs/barber-apprenticeship/request-info',
    ROUTES.programsCosmetology,
    ROUTES.programsEsthetician,
    ROUTES.programsNailTech,
    ROUTES.programsTechnology,
    '/programs/business',
  ];

  const appStoreRoutes = [
    '/store/apps/website-builder',
    '/store/apps/sam-gov',
    '/store/apps/grants',
    '/store/ai-assistants',
    '/store/course-builder',
    '/store/dev-studio',
    '/store/ai-studio',
    '/store/testing',
  ];

  const seen = new Set<string>();
  return [
    ...coreRoutes.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${path === '/' ? '' : path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...programRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: path.includes('apprenticeship') ? 0.95 : 0.8,
    })),
    ...appStoreRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
