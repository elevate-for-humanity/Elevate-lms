import { getRecommendedTemplate } from '@/lib/templates/designs';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export function buildDefaultSiteConfig(params: {
  organizationName: string;
  organizationType?: string;
  industry?: string;
  contactEmail?: string;
}): TenantSiteConfig {
  const { organizationName, organizationType = 'Training Provider', industry = 'General' } =
    params;
  const template = getRecommendedTemplate(industry, organizationType);
  const contactEmail =
    params.contactEmail ??
    `info@${organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.org`;

  return {
    template: {
      id: template.id,
      name: template.name,
      fonts: template.fonts,
      colors: template.colors as unknown as Record<string, string>,
      style: template.style as unknown as Record<string, string>,
    },
    branding: {
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      accentColor: template.colors.accent,
      backgroundColor: template.colors.background,
      textColor: template.colors.text,
      logoText: organizationName,
      tagline: 'Quality training for career advancement',
    },
    homepage: {
      heroTitle: `Welcome to ${organizationName}`,
      heroSubtitle:
        'Industry-recognized training programs designed to help learners build skills and advance their careers.',
      heroCtaText: 'View Programs',
      features: [
        {
          title: 'Expert-Led Training',
          description: 'Learn from instructors with real-world experience in your field.',
        },
        {
          title: 'Flexible Learning',
          description: 'Programs designed for working adults and career changers.',
        },
        {
          title: 'Career Support',
          description: 'Guidance from enrollment through completion and job placement.',
        },
      ],
    },
    programs: [
      {
        name: 'Foundations',
        description: 'Core skills and safety fundamentals for new learners.',
        duration: '4 weeks',
        level: 'Beginner',
      },
      {
        name: 'Professional Track',
        description: 'Hands-on training aligned with employer expectations.',
        duration: '8 weeks',
        level: 'Intermediate',
      },
      {
        name: 'Certification Prep',
        description: 'Exam-ready preparation with practice assessments.',
        duration: '12 weeks',
        level: 'Advanced',
      },
    ],
    stats: { students: 250, completionRate: '92%', employers: 40, rating: '4.8' },
    testimonial: {
      quote:
        'The training team helped me move from entry-level work into a skilled role with clear next steps.',
      author: 'Program Graduate',
    },
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'Programs', href: '/programs' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    footer: {
      description: `${organizationName} provides workforce training and education.`,
      contactEmail,
    },
    seo: {
      title: `${organizationName} | Training Programs`,
      description: `${organizationName} offers professional training and certification pathways.`,
      keywords: ['training', 'workforce', 'certification', organizationName],
    },
    meta: {
      organizationName,
      organizationType,
      industry,
      generatedAt: new Date().toISOString(),
      source: 'default-site-config',
    },
  };
}

export function mergeSiteConfig(
  base: TenantSiteConfig,
  partial: Partial<TenantSiteConfig> & {
    homepage?: Partial<TenantSiteConfig['homepage']>;
    branding?: Partial<TenantSiteConfig['branding']>;
  },
): TenantSiteConfig {
  return {
    ...base,
    ...partial,
    branding: { ...base.branding, ...partial.branding },
    homepage: { ...base.homepage, ...partial.homepage },
    programs: partial.programs ?? base.programs,
    stats: partial.stats ?? base.stats,
    testimonial: partial.testimonial ?? base.testimonial,
    navigation: partial.navigation ?? base.navigation,
    footer: { ...base.footer, ...partial.footer },
    seo: { ...base.seo, ...partial.seo },
    template: partial.template ?? base.template,
    meta: { ...base.meta, ...partial.meta },
  };
}
