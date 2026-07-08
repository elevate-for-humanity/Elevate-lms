import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * AI Studio DevInt Container
 *
 * Institutional operating charter for the Elevate AI Studio. Keep this file as
 * the single source of truth for AI Studio responsibilities and guardrails.
 */
export const AI_STUDIO_DEVINT_CONTAINER = {
  platform: {
    name: PLATFORM_DEFAULTS.orgName,
    domains: [
      'LMS',
      'Workforce Development',
      'Apprenticeships',
      'Career Services',
      'Education',
      'Compliance',
      'Case Management',
      'Student Success',
      'Funding',
      'AI Operations',
    ],
    environments: {
      production: PLATFORM_DEFAULTS.siteUrl,
      admin: 'https://admin.elevateforhumanity.org',
      local: process.env.NEXT_PUBLIC_SITE_URL || '',
    },
  },
  architecture: {
    frontend: {
      framework: 'Next.js App Router',
      styling: 'Tailwind',
      auth: 'Supabase Auth',
      state: ['React Context', 'Server Components', 'Client Components'],
    },
    backend: {
      database: 'Supabase Postgres',
      storage: 'Supabase Storage',
      realtime: true,
      rowLevelSecurity: true,
    },
    ai: {
      providers: ['OpenAI', 'Anthropic', 'Gemini', 'Groq'],
      orchestration: 'Central AI Service Layer',
      rules: [
        'Never call providers directly from UI',
        'All AI requests route through server-side service layers',
        'All prompts centrally governed',
        'All AI actions logged',
        'Rate limits enforced',
        'Tenant-safe isolation',
      ],
    },
  },
  coreSystems: {
    auth: {
      purpose: 'Single identity system',
      responsibilities: [
        'Login',
        'Role Resolution',
        'Session Management',
        'Onboarding',
        'Permission Gates',
        'Admin Access',
        'Student Access',
        'Partner Access',
      ],
      rules: [
        'One canonical profile model',
        'One onboarding flow',
        'No duplicate auth systems',
        'No inline role logic',
        'All roles use canonical guards',
        'Missing profiles redirect safely',
      ],
    },
    enrollmentEngine: {
      responsibilities: [
        'Applications',
        'Approvals',
        'Enrollment States',
        'Funding Status',
        'Program Access',
        'Apprenticeship Tracking',
      ],
      rules: [
        'Single enrollment state machine',
        'No legacy state variants',
        'Centralized enrollment logic',
        'All transitions audited',
      ],
    },
    courseBuilder: {
      purpose: 'Institutional curriculum engine',
      responsibilities: [
        'Program Creation',
        'Module Management',
        'Lesson Builder',
        'Quiz Builder',
        'Assignments',
        'Video Curriculum',
        'SCORM',
        'AI Curriculum Generation',
        'Competencies',
        'Assessments',
        'Certificates',
        'RTI Tracking',
        'Apprenticeship Hours',
        'Progress Tracking',
        'Drip Scheduling',
      ],
      rules: [
        'No direct DB assumptions in UI',
        'No unsafe nested relational joins',
        'All curriculum data validated',
        'Builder must never white-screen',
        'All arrays guarded',
        'All fetches error-handled',
        'No undefined .map()',
        'No direct provider calls',
        'All saves transactional',
      ],
      stabilization: [
        'Defensive DTO normalization',
        'Graceful fallback rendering',
        'Schema-safe loaders',
        'Structured runtime logging',
        'Network failure handling',
        'Optimistic update rollback',
      ],
    },
  },
  aiStudio: {
    mission: 'Autonomous institutional operations system',
    capabilities: [
      'Curriculum Generation',
      'Student Risk Detection',
      'Career Recommendations',
      'Case Notes',
      'Compliance Monitoring',
      'Funding Guidance',
      'Program Mapping',
      'ETPL Optimization',
      'Grant Assistance',
      'Automated Communications',
      'Workforce Intelligence',
      'Scheduling',
      'Document Generation',
      'Audit Assistance',
      'Student Support',
    ],
    agents: {
      curriculumAgent: ['Generate programs', 'Create lessons', 'Create quizzes', 'Align competencies', 'Generate rubrics'],
      complianceAgent: ['Track deadlines', 'Monitor regulations', 'Validate documentation', 'Detect missing compliance items'],
      studentSuccessAgent: ['Track student engagement', 'Detect dropout risk', 'Recommend interventions', 'Monitor attendance'],
      workforceAgent: ['Labor market analysis', 'Employer matching', 'Career pathways', 'Demand forecasting'],
      fundingAgent: ['WIOA tracking', 'Grant alignment', 'Funding eligibility', 'ETPL optimization'],
    },
  },
  governance: {
    criticalRules: [
      'No blind AI rewrites',
      'No schema changes without migration review',
      'No direct DB access from UI',
      'No duplicated auth logic',
      'No duplicated route systems',
      'No duplicated program models',
      'All APIs typed',
      'All loaders resilient',
      'All runtime failures logged',
      'All environment configs validated',
    ],
    validationHierarchy: [
      'Runtime correctness first',
      'Auth stability second',
      'Enrollment stability third',
      'Course Builder stability fourth',
      'Dashboard stability fifth',
      'Repo-wide type cleanup later',
    ],
  },
  infrastructure: {
    requiredEnv: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'TEST_ADMIN_EMAIL',
      'TEST_ADMIN_PASSWORD',
    ],
    browserAutomationRules: [
      'Avoid pkill -f',
      'Scoped PID cleanup only',
      'Capture first runtime error',
      'Capture first failed request',
    ],
  },
  stabilizationPlan: {
    phase1: ['Fix login/auth', 'Restore environment parity', 'Stabilize Course Builder', 'Fix enrollment gates', 'Repair dashboard loaders'],
    phase2: ['Centralize APIs', 'Normalize schema', 'Consolidate routes', 'Extract service layers'],
    phase3: ['Reduce type debt', 'Improve CI', 'Add contract testing', 'Add observability', 'Add runtime analytics'],
  },
  antiPatterns: [
    'Hardcoded filesystem assumptions',
    'Inline Supabase queries in UI',
    'Unsafe relational inference',
    'Multiple auth systems',
    'Blind AI migrations',
    'Duplicate route trees',
    'Direct provider calls',
    'Unchecked nested arrays',
    'Global rewrites without diagnostics',
  ],
  finalDirective: {
    objective:
      'Build a resilient institutional operating system capable of scaling workforce development, education, apprenticeships, compliance, and student success through AI-assisted automation while maintaining operational stability and governance.',
  },
} as const;

export function getDevIntPromptContext() {
  const c = AI_STUDIO_DEVINT_CONTAINER;
  return [
    `Platform: ${c.platform.name}`,
    `Domains: ${c.platform.domains.join(', ')}`,
    `AI Studio mission: ${c.aiStudio.mission}`,
    `Capabilities: ${c.aiStudio.capabilities.join(', ')}`,
    `Course Builder rules: ${c.coreSystems.courseBuilder.rules.join('; ')}`,
    `Governance critical rules: ${c.governance.criticalRules.join('; ')}`,
    `Validation order: ${c.governance.validationHierarchy.join(' > ')}`,
    `Anti-patterns: ${c.antiPatterns.join('; ')}`,
    `Final directive: ${c.finalDirective.objective}`,
  ].join('\n');
}
