export const WEBSITE_BUILDER_TRIAL = {
  days: 14,
  credits: 500,
  websiteLimit: 1,
  pageLimit: 5,
  publishToElevateSubdomain: true,
  customDomainPurchase: false,
  whiteLabel: false,
  apiAccess: false,
  includedPreviewCapabilities: [
    'PARIS AI Website Builder',
    'PARIS Sales Assistant',
    'ELLIE Customer Support',
    'LIZZY Operations Assistant',
    'ZORA Compliance Assistant',
    'Marketing Assistant',
    'Grant Writer',
    'Grant Discovery',
    'Image & Brand Asset Builder',
    'Commercial / Reel Video Builder',
    'CRM, Forms & Booking',
    'Email, SMS & Automations',
  ],
} as const;

export const WEBSITE_BUILDER_CREDIT_COSTS = {
  initial_site_generation: 60,
  paris_edit: 8,
  assistant_chat: 12,
  marketing_generation: 25,
  image_generation: 40,
  grant_draft: 80,
  video_generation: 200,
} as const;

export type WebsiteBuilderCreditOperation = keyof typeof WEBSITE_BUILDER_CREDIT_COSTS;
