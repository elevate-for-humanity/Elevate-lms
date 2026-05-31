export type TenantSiteConfig = {
  template: {
    id: string;
    name: string;
    fonts?: { heading: string; body: string; googleFontsUrl?: string };
    colors?: Record<string, string>;
    style?: Record<string, string>;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    textColor?: string;
    logoText: string;
    tagline?: string;
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    features: Array<{ title: string; description: string }>;
  };
  programs: Array<{
    name: string;
    description: string;
    duration?: string;
    level?: string;
  }>;
  stats?: {
    students?: number;
    completionRate?: string;
    employers?: number;
    rating?: string;
  };
  testimonial?: { quote: string; author: string };
  navigation: Array<{ label: string; href: string }>;
  footer: { description: string; contactEmail?: string };
  seo?: { title: string; description: string; keywords?: string[] };
  meta?: Record<string, unknown>;
};

export type PublishedTenantSite = {
  id: string;
  subdomain: string;
  siteName: string;
  organizationId: string | null;
  config: TenantSiteConfig;
};
