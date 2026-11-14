/**
 * Canonical Practice Center profiles.
 * Question content remains independently authored Elevate material.
 * External credential providers are alignment/testing destinations only.
 */
export type PracticeCenterProfile = {
  programSlug: string;
  title: string;
  externalAssessment: string;
  domains: Array<{ key: string; label: string; readinessTarget: number }>;
};

export const PRACTICE_CENTER_PROFILES: Record<string, PracticeCenterProfile> = {
  entrepreneurship: {
    programSlug: 'entrepreneurship',
    title: 'Elevate ESB Practice Center',
    externalAssessment: 'Certiport Entrepreneurship and Small Business (ESB) U.S. v.2',
    domains: [
      { key: 'entrepreneurial-small-business-concepts', label: 'Entrepreneurial & Small Business Concepts', readinessTarget: 80 },
      { key: 'marketing-sales', label: 'Marketing & Sales', readinessTarget: 80 },
      { key: 'production-distribution', label: 'Production & Distribution', readinessTarget: 80 },
      { key: 'business-financials', label: 'Business Financials & Funding', readinessTarget: 80 },
    ],
  },
  'retail-industry-fundamentals': {
    programSlug: 'retail-industry-fundamentals',
    title: 'Elevate Retail Practice Center',
    externalAssessment: 'NRF Foundation RISE Up Retail Industry Fundamentals',
    domains: [
      { key: 'retail-industry', label: 'Retail Industry Foundations', readinessTarget: 80 },
      { key: 'customer-service-sales', label: 'Customer Service & Sales Fundamentals', readinessTarget: 80 },
      { key: 'retail-operations', label: 'Retail Operations, Inventory & Safety', readinessTarget: 80 },
      { key: 'retail-math', label: 'Retail Math, Pricing & Profit', readinessTarget: 80 },
      { key: 'workplace-readiness', label: 'Workplace Professionalism & Readiness', readinessTarget: 80 },
    ],
  },
};
