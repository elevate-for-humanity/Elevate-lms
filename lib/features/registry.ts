import type { FeatureDefinition } from './types';

export const FEATURE_REGISTRY: FeatureDefinition[] = [
  // ── Global ──────────────────────────────────────────────────────────────
  // Avatar experiments are retained for evaluation but are not mounted by
  // any canonical app layout. Keep them explicitly disabled so audits do not
  // mistake dormant code for a production capability.
  {
    id: 'global-avatar',
    name: 'Global Avatar Guide',
    description: 'Dormant floating video-avatar experiment; not mounted in production.',
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
    name: 'Facebook Pixel',
    description: 'Meta Pixel for conversion tracking.',
    component: '@/components/FacebookPixel',
    surface: 'global',
    category: 'analytics',
    status: 'enabled',
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
    id: 'rotating-hero-banner',
    name: 'Rotating Hero Banner',
    description: 'Auto-advancing image carousel for marketing pages.',
    component: '@/components/RotatingHeroBanner',
    surface: 'marketing',
    category: 'marketing',
    status: 'enabled',
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Email capture form with honeypot spam protection.',
    component: '@/components/NewsletterSignup',
    surface: 'marketing',
    category: 'engagement',
    status: 'enabled',
  },
  {
    id: 'social-media-highlight',
    name: 'Social Media Highlight',
    description: 'Social feed embed / highlight strip.',
    component: '@/components/SocialMediaHighlight',
    surface: 'marketing',
    category: 'marketing',
    status: 'enabled',
  },

  // ── LMS ──────────────────────────────────────────────────────────────────
  {
    id: 'ar-training-modules',
    name: 'AR Training Modules',
    description: 'Augmented-reality 3D model training for technical courses.',
    component: '@/components/ARTrainingModules',
    surface: 'lms-lesson',
    category: 'video',
    status: 'beta',
  },
  {
    id: 'tiktok-video-player',
    name: 'TikTok-Style Video Player',
    description: 'Vertical short-form video player for lesson content.',
    component: '@/components/video/TikTokStyleVideoPlayer',
    surface: 'lms-lesson',
    category: 'video',
    status: 'beta',
  },
  {
    id: 'universal-course-player',
    name: 'Universal Course Player',
    description: 'Iframe-based player for partner LMS / SCORM content.',
    component: '@/components/UniversalCoursePlayer',
    surface: 'lms',
    category: 'video',
    status: 'enabled',
  },

  // ── Admin ────────────────────────────────────────────────────────────────
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
    description: 'Dashboard for tracking graduate job placements and salaries.',
    component: '@/components/JobPlacementTracking',
    surface: 'admin-analytics',
    category: 'tracking',
    status: 'enabled',
  },
  {
    id: 'employer-talent-pipeline',
    name: 'Employer Talent Pipeline',
    description: 'Kanban-style pipeline for employer candidate tracking.',
    component: '@/components/EmployerTalentPipeline',
    surface: 'admin-analytics',
    category: 'tracking',
    status: 'enabled',
  },
  {
    id: 'excel-chart-generator',
    name: 'Excel Chart Generator',
    description: 'Generate and export charts to Excel for reporting.',
    component: '@/components/admin/ExcelChartGenerator',
    surface: 'admin-analytics',
    category: 'analytics',
    status: 'enabled',
  },
];
