import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.elevateforhumanity.org';
  
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/programs`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/apprenticeships`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/testing`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/funding`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/store`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/eligibility`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/apply`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/verify`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/platform`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/platform/sponsors`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/partners`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/employers`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/compliance`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/federal-compliance`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/onboarding`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/career-training`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/community-services`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/demos`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/demos/vr-funding`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  const programPages = [
    // Healthcare
    { slug: 'programs/healthcare', priority: 0.9 },
    { slug: 'programs/cna', priority: 0.8 },
    { slug: 'programs/medical-assistant', priority: 0.8 },
    { slug: 'programs/phlebotomy', priority: 0.8 },
    { slug: 'programs/qma', priority: 0.7 },
    { slug: 'programs/emt-apprenticeship', priority: 0.8 },
    { slug: 'programs/peer-recovery-specialist', priority: 0.7 },
    { slug: 'programs/direct-support-professional', priority: 0.7 },
    { slug: 'programs/drug-collector', priority: 0.7 },
    { slug: 'programs/cpr-first-aid', priority: 0.7 },
    // Trades
    { slug: 'programs/hvac-technician', priority: 0.9 },
    { slug: 'programs/skilled-trades', priority: 0.8 },
    { slug: 'programs/building-services-technician', priority: 0.8 },
    { slug: 'programs/electrical', priority: 0.8 },
    { slug: 'programs/cdl-training', priority: 0.9 },
    { slug: 'programs/welding', priority: 0.8 },
    // Beauty
    { slug: 'programs/barber-apprenticeship', priority: 0.9 },
    { slug: 'programs/cosmetology-apprenticeship', priority: 0.8 },
    { slug: 'programs/esthetician-apprenticeship', priority: 0.8 },
    { slug: 'programs/nail-technician-apprenticeship', priority: 0.7 },
    // Technology
    { slug: 'programs/technology', priority: 0.8 },
    { slug: 'programs/it-help-desk', priority: 0.8 },
    { slug: 'programs/cybersecurity-analyst', priority: 0.8 },
    // Business
    { slug: 'programs/finance-bookkeeping-accounting', priority: 0.8 },
    { slug: 'programs/bookkeeping', priority: 0.7 },
  ];

  const programSitemap = programPages.map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.priority,
  }));

  return [...staticPages, ...programSitemap];
}
