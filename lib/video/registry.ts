/**
 * Video Registry - Canonical source of truth for all video content
 * 
 * Every video must be mapped to a single canonical record (video_id) with:
 * - title, page_slug(s), video_url, transcript_url/text
 * - language, version, status (draft/live), updated_at
 */

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  transcript_url?: string;
  transcript_text?: string;
  duration: string; // ISO 8601 duration format (e.g., PT1M30S)
  upload_date: string; // ISO 8601 date
  category: string;
  page_slugs: string[]; // Pages where this video appears
  language: string;
  version: number;
  status: 'draft' | 'live' | 'archived';
  updated_at: string;
  mime_type: string;
  cors_enabled: boolean;
  cdn_cache_key?: string;
}

export interface VideoPlaybackEvent {
  event_type: 'load_start' | 'can_play' | 'play' | 'pause' | 'ended' | 'error' | 'progress';
  video_id: string;
  page_slug: string;
  timestamp: string;
  current_time?: number;
  duration?: number;
  error_message?: string;
  user_id?: string;
  session_id?: string;
}

// Canonical video registry - single source of truth
export const VIDEO_REGISTRY: Record<string, VideoRecord> = {
  'hero-home': {
    id: 'hero-home',
    title: 'Elevate for Humanity - Free Career Training Programs',
    description: 'Discover 100% free, funded workforce training programs in Indianapolis. WIOA-funded programs in healthcare, skilled trades, technology, and business.',
    video_url: '/videos/hero-home.mp4',
    thumbnail_url: '/images/pages/healthcare-grad.jpg',
    duration: 'PT1M30S',
    upload_date: '2025-01-01',
    category: 'Overview',
    page_slugs: ['/', '/home'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'cna-hero': {
    id: 'cna-hero',
    title: 'CNA Training Program - Certified Nursing Assistant',
    description: 'Free CNA training in Indianapolis. State-approved program, 6-8 weeks, job placement assistance.',
    video_url: '/videos/cna-hero.mp4',
    thumbnail_url: '/images/pages/comp-pathway-healthcare.jpg',
    duration: 'PT45S',
    upload_date: '2025-01-01',
    category: 'Healthcare',
    page_slugs: ['/programs/healthcare', '/programs/cna'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'barber-hero': {
    id: 'barber-hero',
    title: 'Barber Apprenticeship Program - Licensed Barber Training',
    description: 'Registered barber apprenticeship in Indianapolis. Earn while you learn, 2000 hours, state licensure pathway.',
    video_url: 'https://cms-artifacts.artlist.io/content/generated-video-v1/video__3/video-7b329d1f-3f92-4ec5-acdf-9d2d7ff6de5f.mp4?Expires=2083752835&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=PwinNDJ~aDGbHoMI8-Hfr28QIj7s~0mwzn92P-muIHO0bW86~4gW6MzRyslLtk~TOzdfX8aTYA9OeGF-sbBPwCBUw8gTpXO6QvhwpJsFW5DiLHnEP6q6vCTvQ-jEpwV20izIuWVSpY-txGY7bDGHhkSq6-wP26b0J-lstFIMwxRHQjJ9rKmX9i4pzNruZJEQ2ILvO-LdWivm98j5TMLm09HgYzesifHFPPzUzNH7NlYwwvIO2-NtXWEuixrQFdJ2Zt4ocgdmqP9auvaeYr9hbS~F6k6CBybWLlnGoLggGkluqp1vFzt-eIslYgFKl8m4Du4UFJawNl3KmcyA9uTWtA__',
    thumbnail_url: '/images/pages/barber-gallery-1.jpg',
    duration: 'PT1M',
    upload_date: '2025-01-01',
    category: 'Skilled Trades',
    page_slugs: ['/programs/barber-apprenticeship', '/barber-apprenticeship'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'cdl-hero': {
    id: 'cdl-hero',
    title: 'CDL Training - Commercial Driver License Program',
    description: 'Free CDL training in Indianapolis. Class A, B, and C commercial driving licenses. WIOA-funded, job placement with local carriers.',
    video_url: '/videos/cdl-hero.mp4',
    thumbnail_url: '/images/pages/hvac-technician.jpg',
    duration: 'PT50S',
    upload_date: '2025-01-01',
    category: 'Transportation',
    page_slugs: ['/programs/cdl', '/programs/cdl-transportation'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'hvac-hero': {
    id: 'hvac-hero',
    title: 'HVAC Technician Training Program',
    description: 'Free HVAC training in Indianapolis. Learn heating, ventilation, air conditioning, and refrigeration. EPA certification included.',
    video_url: '/videos/hvac-hero-final.mp4',
    thumbnail_url: '/images/pages/hvac-technician.jpg',
    duration: 'PT40S',
    upload_date: '2025-01-01',
    category: 'Skilled Trades',
    page_slugs: ['/programs/hvac', '/programs/skilled-trades'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'programs-overview': {
    id: 'programs-overview',
    title: 'Programs Overview - All Training Programs',
    description: 'Overview of all free career training programs at Elevate for Humanity.',
    video_url: '/videos/programs-overview-video-with-narration.mp4',
    thumbnail_url: '/images/pages/workforce-training.jpg',
    duration: 'PT30S',
    upload_date: '2025-01-01',
    category: 'Overview',
    page_slugs: ['/programs'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'training-providers': {
    id: 'training-providers',
    title: 'Training Providers - Partner Network',
    description: 'Learn about our network of training providers and partners.',
    video_url: '/videos/training-providers-video-with-narration.mp4',
    thumbnail_url: '/images/pages/training-classroom.jpg',
    duration: 'PT1M10S',
    upload_date: '2025-01-01',
    category: 'About',
    page_slugs: ['/training-providers'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started - How to Apply',
    description: 'Step-by-step guide to applying for free career training programs.',
    video_url: '/videos/getting-started-hero.mp4',
    thumbnail_url: '/images/pages/comp-home-hero.jpg',
    duration: 'PT35S',
    upload_date: '2025-01-01',
    category: 'How To',
    page_slugs: ['/how-it-works', '/getstarted'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  // Demo videos
  'demo-lms-overview': {
    id: 'demo-lms-overview',
    title: 'LMS Platform Overview',
    description: 'See how students navigate courses, track progress, and earn certificates.',
    video_url: '/videos/demos/lms-overview.mp4',
    thumbnail_url: '/images/pages/demos-hero.jpg',
    duration: 'PT15M',
    upload_date: '2025-01-01',
    category: 'Demo',
    page_slugs: ['/demos'],
    language: 'en',
    version: 1,
    status: 'draft',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'demo-employer-portal': {
    id: 'demo-employer-portal',
    title: 'Employer Portal Demo',
    description: 'Learn how employers track sponsored employees and access reports.',
    video_url: '/videos/demos/employer-portal.mp4',
    thumbnail_url: '/images/pages/demos-hero.jpg',
    duration: 'PT10M',
    upload_date: '2025-01-01',
    category: 'Demo',
    page_slugs: ['/demos'],
    language: 'en',
    version: 1,
    status: 'draft',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'demo-admin-dashboard': {
    id: 'demo-admin-dashboard',
    title: 'Admin Dashboard Tour',
    description: 'Explore the administrative tools for managing programs and students.',
    video_url: '/videos/demos/admin-dashboard.mp4',
    thumbnail_url: '/images/pages/demos-hero.jpg',
    duration: 'PT20M',
    upload_date: '2025-01-01',
    category: 'Demo',
    page_slugs: ['/demos'],
    language: 'en',
    version: 1,
    status: 'draft',
    updated_at: '2025-01-01T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
};

/**
 * Get video by ID from the canonical registry
 */
export function getVideoById(videoId: string): VideoRecord | null {
  return VIDEO_REGISTRY[videoId] || null;
}

/**
 * Get video for a specific page slug
 */
export function getVideoForPage(pageSlug: string): VideoRecord | null {
  const normalizedSlug = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
  
  for (const video of Object.values(VIDEO_REGISTRY)) {
    if (video.status === 'live' && video.page_slugs.includes(normalizedSlug)) {
      return video;
    }
  }
  return null;
}

/**
 * Get all videos by category
 */
export function getVideosByCategory(category: string): VideoRecord[] {
  return Object.values(VIDEO_REGISTRY).filter(
    (video) => video.status === 'live' && video.category === category
  );
}

/**
 * Get all live videos
 */
export function getAllLiveVideos(): VideoRecord[] {
  return Object.values(VIDEO_REGISTRY).filter((video) => video.status === 'live');
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  Object.values(VIDEO_REGISTRY).forEach((video) => {
    if (video.status === 'live') {
      categories.add(video.category);
    }
  });
  return Array.from(categories);
}

/**
 * Generate cache-busting URL for video
 */
export function getVideoCacheUrl(video: VideoRecord): string {
  // For external URLs, return as-is
  if (video.video_url.startsWith('http')) {
    return video.video_url;
  }
  
  // For local URLs, append version parameter for cache busting
  const versionParam = `v=${video.version}&t=${new Date(video.updated_at).getTime()}`;
  const separator = video.video_url.includes('?') ? '&' : '?';
  return `${video.video_url}${separator}${versionParam}`;
}

/**
 * Validate video record has all required fields
 */
export function validateVideoRecord(video: Partial<VideoRecord>): string[] {
  const errors: string[] = [];
  
  if (!video.id) errors.push('Missing video ID');
  if (!video.title) errors.push('Missing title');
  if (!video.video_url) errors.push('Missing video URL');
  if (!video.thumbnail_url) errors.push('Missing thumbnail URL');
  if (!video.page_slugs || video.page_slugs.length === 0) {
    errors.push('Missing page slugs');
  }
  
  return errors;
}
