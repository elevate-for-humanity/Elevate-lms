export type HealthStatus = 'todo' | 'in-progress' | 'done';

export interface SiteHealthItem {
  id: string;
  category: 'Docs' | 'Content' | 'Config' | 'Testing' | 'Integrations';
  label: string;
  description: string;
  status: HealthStatus;
  docsLink?: string;
}

export const siteHealthChecklist: SiteHealthItem[] = [
  {
    id: 'docs-structure',
    category: 'Docs',
    label: 'Docs moved out of root into /docs',
    description:
      'All old markdown files reviewed, active docs moved to docs/current, old ones to docs/archive.',
    status: 'in-progress',
    docsLink: '/docs/README.md',
  },
  {
    id: 'docs-route-map',
    category: 'Docs',
    label: 'Route map documented',
    description:
      "High-level route structure documented so we don't recreate conflicting dynamic routes.",
    status: 'done',
    docsLink: '/docs/ROUTE_MAP.md',
  },
  {
    id: 'content-jri-scorm',
    category: 'Content',
    label: 'JRI SCORM modules uploaded',
    description:
      'All JRI SCORM zips unzipped into /public/scorm/jri/module-* with working index.html.',
    status: 'todo',
  },
  {
    id: 'content-stripe-products',
    category: 'Integrations',
    label: 'Real Stripe products configured',
    description:
      'Each program in billingConfig.ts uses real Stripe product + price IDs instead of example IDs.',
    status: 'todo',
    docsLink: '/docs/ENV_CONFIG.md',
  },
  {
    id: 'content-images',
    category: 'Content',
    label: 'Placeholder images replaced',
    description:
      'Homepage, program pages, and success stories use real, high-resolution images from your library.',
    status: 'in-progress',
  },
  {
    id: 'content-program-copy',
    category: 'Content',
    label: 'Program pages fully written',
    description:
      'Each program landing page explains funding, schedule, outcomes, and next steps for WRG/WIOA/JRI/WEX/OJT.',
    status: 'todo',
  },
  {
    id: 'config-env-vars',
    category: 'Config',
    label: 'Critical env vars set in production',
    description:
      'NEXT_PUBLIC_SITE_URL, STRIPE_SECRET_KEY, and OPENAI_API_KEY all set with correct production values.',
    status: 'todo',
    docsLink: '/docs/ENV_CONFIG.md',
  },
  {
    id: 'testing-enrollment',
    category: 'Testing',
    label: 'Enrollment flow tested end-to-end',
    description:
      'From program page → enroll → funding explanation → Stripe (if applicable) → dashboard access.',
    status: 'todo',
  },
  {
    id: 'testing-scorm',
    category: 'Testing',
    label: 'SCORM/JRI playback tested',
    description:
      'Each JRI module opens from /student/jri/[id], loads, and completes without errors.',
    status: 'todo',
  },
  {
    id: 'testing-mobile',
    category: 'Testing',
    label: 'Mobile responsiveness checked',
    description:
      'Homepage, dashboards, and enrollment pages tested on phone size. Hero images, chat widget, and popups aligned.',
    status: 'todo',
  },
  {
    id: 'testing-ai',
    category: 'Testing',
    label: 'AI tutor & AI console tested',
    description:
      "AI features respond correctly with real OpenAI key and don't show test/demo text to learners.",
    status: 'todo',
  },
];
