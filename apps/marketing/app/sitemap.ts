import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.elevateforhumanity.org';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/programs`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/apprenticeships`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/testing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/funding`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/eligibility`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/verify`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/platform`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/platform/sponsors`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/employer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/compliance`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/federal-compliance`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/onboarding`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/career-training`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/community-services`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/demos`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/demos/vr-funding`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/ai`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ];

  const storeRoutes = [
    '/store',
    '/store/plans',
    '/store/apps',
    '/store/apps/website-builder',
    '/store/apps/sam-gov',
    '/store/apps/grants',
    '/store/course-builder',
    '/store/dev-studio',
    '/store/ai-studio',
    '/store/testing',
    '/store/licenses',
    '/store/licensing',
    '/store/licenses/managed-platform',
    '/store/demos',
    '/store/trial',
    '/store/courses',
    '/store/courses/hvac-technician-course-license',
    '/store/digital',
    '/store/compliance',
    '/store/compliance/wioa',
    '/store/compliance/wcag',
    '/store/integrations',
    '/store/workflow-studio',
    '/store/deployment',
    '/store/guides',
    '/store/guides/licensing',
    '/store/guides/capital-readiness',
  ];

  const storeSitemap: MetadataRoute.Sitemap = storeRoutes.map((route, index) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: index === 0 ? 0.95 : route.startsWith('/store/apps/') ? 0.85 : 0.8,
  }));

  const programPages = [
    { slug: 'programs/catalog', priority: 0.9 },
    { slug: 'programs/healthcare', priority: 0.9 },
    { slug: 'programs/cna', priority: 0.9 },
    { slug: 'programs/medical-assistant', priority: 0.8 },
    { slug: 'programs/phlebotomy', priority: 0.8 },
    { slug: 'programs/qma', priority: 0.8 },
    { slug: 'programs/peer-recovery-specialist', priority: 0.8 },
    { slug: 'programs/cpr-first-aid', priority: 0.8 },
    { slug: 'programs/hvac-technician', priority: 0.9 },
    { slug: 'programs/skilled-trades', priority: 0.8 },
    { slug: 'programs/cdl-training', priority: 0.9 },
    { slug: 'programs/electrical', priority: 0.7 },
    { slug: 'programs/plumbing', priority: 0.7 },
    { slug: 'programs/barber-apprenticeship', priority: 0.9 },
    { slug: 'programs/cosmetology-apprenticeship', priority: 0.8 },
    { slug: 'programs/esthetician-apprenticeship', priority: 0.8 },
    { slug: 'programs/nail-technician-apprenticeship', priority: 0.7 },
    { slug: 'programs/technology', priority: 0.8 },
    { slug: 'programs/business', priority: 0.8 },
  ];

  const programSitemap: MetadataRoute.Sitemap = programPages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: page.priority,
  }));

  return [...staticPages, ...storeSitemap, ...programSitemap];
}
