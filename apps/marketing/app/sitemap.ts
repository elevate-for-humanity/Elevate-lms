import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.elevateforhumanity.org';
  const now = new Date();

  const coreRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/programs', changeFrequency: 'weekly', priority: 0.95 },
    { path: '/apply', changeFrequency: 'monthly', priority: 0.95 },
    { path: '/host-shop', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/host-shop/apply', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/apprenticeships', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/testing', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/funding', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/funding/wioa', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/funding/wrg', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/jri', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/scholarships', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/eligibility/quiz', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/tuition-fees', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/approvals', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/legal', changeFrequency: 'yearly', priority: 0.55 },
    { path: '/accessibility', changeFrequency: 'yearly', priority: 0.55 },
    { path: '/federal-compliance', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/compliance/center', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/partners', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/employer', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/for-agencies', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/store', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/store/demo', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/store/plans', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/store/trial', changeFrequency: 'weekly', priority: 0.85 },
  ];

  const programRoutes = [
    '/programs/healthcare',
    '/programs/cna',
    '/programs/medical-assistant',
    '/programs/phlebotomy',
    '/programs/qma',
    '/programs/hvac-technician',
    '/programs/skilled-trades',
    '/programs/cdl-training',
    '/programs/barber-apprenticeship',
    '/programs/barber-apprenticeship/apply',
    '/programs/barber-apprenticeship/request-info',
    '/programs/cosmetology-apprenticeship',
    '/programs/esthetician-apprenticeship',
    '/programs/nail-technician-apprenticeship',
    '/programs/technology',
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

  return [
    ...coreRoutes.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${path === '/' ? '' : path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...programRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path.includes('barber-apprenticeship') ? 0.9 : 0.8,
    })),
    ...appStoreRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
