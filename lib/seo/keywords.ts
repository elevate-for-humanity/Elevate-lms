import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// SEO Keywords by Page Type
export const SEO_KEYWORDS = {
  homepage: [
    'free workforce training Indianapolis',
    'WIOA funded programs Indiana',
    'apprenticeships Indianapolis',
    'career training Indiana',
    'DOL registered apprenticeship',
    'WRG funding Indiana',
    'JRI training programs',
    'free job training Indianapolis',
  ],

  barber: [
    'barber apprenticeship Indianapolis',
    'free barber school Indiana',
    'DOL registered barber program',
    'earn while learning barber',
    'Indiana barber license',
    'WIOA barber training',
    'paid barber apprenticeship',
  ],

  hvac: [
    'HVAC training Indianapolis',
    'free HVAC school Indiana',
    'HVAC apprenticeship',
    'HVAC technician certification',
    'EPA certification Indiana',
    'WIOA HVAC training',
  ],

  cna: [
    'CNA training Indianapolis',
    'CNA classes Indiana',
    'certified nursing assistant',
    'CNA certification Indianapolis',
    'CNA program Indiana',
    'nursing assistant training',
  ],

  medicalAssistant: [
    'medical assistant training Indianapolis',
    'free medical assistant classes Indiana',
    'WIOA medical assistant program',
    'WRG medical assistant funding',
    'medical assistant certification',
  ],

  funding: [
    'WIOA eligibility Indiana',
    'WRG funding Indianapolis',
    'JRI training funding',
    'free workforce training funding',
    'Indiana workforce grants',
    'WorkOne funding',
  ],
};

// Generate meta description with keywords
export function generateMetaDescription(
  pageType: keyof typeof SEO_KEYWORDS,
  customText?: string,
): string {
  const keywords = SEO_KEYWORDS[pageType] || SEO_KEYWORDS.homepage;
  const baseText = customText || 'Free workforce training and apprenticeships in Indianapolis.';
  return `${baseText} ${keywords.slice(0, 3).join(', ')}.`;
}

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const baseUrl = PLATFORM_DEFAULTS.siteUrl;
  return `${baseUrl}${path}`;
}
