export type TenantSiteProduct = {
  name: string;
  /** Canonical persisted offer used to create checkout for this product. */
  offerId?: string;
  description?: string;
  price?: string;
  compareAtPrice?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  category?: string;
  badge?: string;
};

export type TenantSiteContact = {
  email?: string;
  phone?: string;
  address?: string;
  bookingUrl?: string;
  hours?: string[];
};

export type TenantSiteSectionType =
  | 'hero'
  | 'rich_text'
  | 'features'
  | 'services'
  | 'products'
  | 'testimonial'
  | 'stats'
  | 'gallery'
  | 'image'
  | 'video'
  | 'faq'
  | 'team'
  | 'pricing'
  | 'cta'
  | 'contact_form'
  | 'booking';

export type TenantSiteSection = {
  id: string;
  type: TenantSiteSectionType;
  visible?: boolean;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type TenantSitePage = {
  id: string;
  slug: string;
  title: string;
  navLabel?: string;
  showInNavigation?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  sections: TenantSiteSection[];
};

export type TenantSiteClaim = {
  key: string;
  value: unknown;
  text?: string;
  source: string | null;
  verifiedAt: string | null;
  status: 'verified' | 'owner_attested' | 'owner_verification_required';
};

export type TenantSiteConfig = {
  schemaVersion?: 1 | 2;
  pages?: TenantSitePage[];
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
    logoImage?: string;
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    heroCtaHref?: string;
    heroImage?: string;
    heroImageAlt?: string;
    announcement?: string;
    features: Array<{ title: string; description: string; image?: string }>;
  };
  programs: Array<{
    name: string;
    description: string;
    duration?: string;
    level?: string;
    image?: string;
  }>;
  products?: TenantSiteProduct[];
  contact?: TenantSiteContact;
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
  claims?: TenantSiteClaim[];
  meta?: Record<string, unknown>;
};

export type PublishedTenantSite = {
  id: string;
  subdomain: string;
  siteName: string;
  organizationId: string | null;
  config: TenantSiteConfig;
};
