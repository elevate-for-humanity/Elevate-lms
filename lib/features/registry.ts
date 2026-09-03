import type { FeatureDefinition } from './types';

/**
 * Registry of product capabilities that have an intentional runtime owner.
 *
 * Status rules:
 * - enabled: mounted by a canonical production surface
 * - beta: mounted by a canonical surface but intentionally limited
 * - disabled: retained code/capability under evaluation; not a production claim
 *
 * Do not add placeholders or nonexistent component paths to this registry.
 */
export const FEATURE_REGISTRY: FeatureDefinition[] = [
  // ── Global / guidance ────────────────────────────────────────────────────
  {
    id: 'global-avatar',
    name: 'Contextual Portal Guide',
    description: 'Dormant contextual video-guide experiment; redesign as explicit user-triggered help before activation.',
    component: '@/components/GlobalAvatar',
    surface: 'global',
    category: 'avatar',
    status: 'disabled',
  },
  {
    id: 'avatar-chat-bar',
    name: 'Avatar Chat Bar',
    description: 'Dormant avatar/chat experiment; evaluate for merge into canonical learner guidance before activation.',
    component: '@/components/AvatarChatBar',
    surface: 'global',
    category: 'avatar',
    status: 'disabled',
  },
  {
    id: 'facebook-pixel',
    name: 'Meta Pixel',
    description: 'Optional marketing measurement integration; not mounted until consent-aware ownership is implemented.',
    component: '@/components/FacebookPixel',
    surface: 'global',
    category: 'analytics',
    status: 'disabled',
    requiresEnvVar: 'NEXT_PUBLIC_FACEBOOK_PIXEL_ID',
  },
  {
    id: 'paris-career-assistant',
    name: 'PARIS Career Guidance Assistant',
    description: 'Canonical public AI assistant for program discovery and career guidance.',
    component: '@/components/paris/ParisFloatingButton',
    surface: 'marketing',
    category: 'ai',
    status: 'enabled',
  },

  // ── Marketing ────────────────────────────────────────────────────────────
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Retained email-capture component; currently not mounted by the canonical marketing page or footer.',
    component: '@/components/NewsletterSignup',
    surface: 'marketing',
    category: 'engagement',
    status: 'disabled',
  },
  {
    id: 'social-media-highlight',
    name: 'Social Media Highlight',
    description: 'Retained social-content experiment; currently not mounted by the canonical marketing surface.',
    component: '@/components/SocialMediaHighlight',
    surface: 'marketing',
    category: 'marketing',
    status: 'disabled',
  },

  // ── LMS ──────────────────────────────────────────────────────────────────
  {
    id: 'universal-course-player',
    name: 'Universal Course Player',
    description: 'Canonical partner LMS / embedded course player used by LMS integrations.',
    component: '@/components/UniversalCoursePlayer',
    surface: 'lms',
    category: 'video',
    status: 'enabled',
  },

  // ── Admin / compliance / analytics ──────────────────────────────────────
  {
    id: 'credential-integrity-verification',
    name: 'Cryptographic Credential Verification',
    description: 'SHA-256 integrity evidence and live credential-record verification backed by the canonical certificate registry.',
    component: '@/components/BlockchainCredentialVerification',
    surface: 'admin-compliance',
    category: 'compliance',
    status: 'enabled',
  },
  {
    id: 'job-placement-tracking',
    name: 'Job Placement Tracking',
    description: 'Admin analytics capability for tracking graduate job placements and salaries.',
    component: '@/components/JobPlacementTracking',
    surface: 'admin-analytics',
    category: 'tracking',
    status: 'enabled',
  },
  {
    id: 'employer-talent-pipeline',
    name: 'Employer Talent Pipeline',
    description: 'Admin analytics pipeline for employer candidate tracking.',
    component: '@/components/EmployerTalentPipeline',
    surface: 'admin-analytics',
    category: 'tracking',
    status: 'enabled',
  },
  {
    id: 'excel-chart-generator',
    name: 'Excel Chart Generator',
    description: 'Reporting export capability exposed through admin analytics.',
    component: '@/components/admin/ExcelChartGenerator',
    surface: 'admin-analytics',
    category: 'analytics',
    status: 'enabled',
  },
];
