/**
 * Canonical production video registry.
 *
 * Only verified, playable production videos belong here. Draft/demo placeholders
 * and generated records without a real media URL must never be registered.
 */

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  transcript_url?: string;
  transcript_text?: string;
  duration: string;
  upload_date: string;
  category: string;
  page_slugs: string[];
  language: string;
  version: number;
  status: 'live';
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

const R2 = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos';
const BASE_DATE = '2026-08-11T00:00:00Z';

export const VIDEO_REGISTRY: Record<string, VideoRecord> = {
  'preview-medical-assistant': {
    id: 'preview-medical-assistant',
    title: 'Medical Assistant program preview',
    description: 'Existing Medical Assistant program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-medical-assistant.mp4',
    thumbnail_url: '/images/pages/medical-assistant-lab.webp',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Healthcare',
    page_slugs: ['/programs/medical-assistant'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'preview-phlebotomy': {
    id: 'preview-phlebotomy',
    title: 'Phlebotomy program preview',
    description: 'Existing Phlebotomy program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-phlebotomy.mp4',
    thumbnail_url: '/images/healthcare/video-thumbnail-phlebotomy.jpg',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Healthcare',
    page_slugs: ['/programs/phlebotomy'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'preview-cybersecurity': {
    id: 'preview-cybersecurity',
    title: 'Cybersecurity program preview',
    description: 'Existing Cybersecurity program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-cybersecurity.mp4',
    thumbnail_url: '/images/pages/cybersecurity-hero.webp',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Technology',
    page_slugs: ['/programs/cybersecurity'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'preview-excel': {
    id: 'preview-excel',
    title: 'Microsoft Excel program preview',
    description: 'Existing Microsoft Excel program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-excel.mp4',
    thumbnail_url: '/images/heroes/hero-homepage.webp',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Business',
    page_slugs: ['/programs/excel'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'preview-osha-10': {
    id: 'preview-osha-10',
    title: 'OSHA 10 program preview',
    description: 'Existing OSHA 10 program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-osha-10.mp4',
    thumbnail_url: '/images/pages/hvac-technician.webp',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Safety',
    page_slugs: ['/programs/osha-10'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'preview-tax-preparation': {
    id: 'preview-tax-preparation',
    title: 'Tax Preparation program preview',
    description: 'Existing Tax Preparation program preview.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-tax-preparation.mp4',
    thumbnail_url: '/images/pages/office-admin-desk.jpg',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Business',
    page_slugs: ['/programs/tax-preparation'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: '2026-10-08T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'hero-home': {
    id: 'hero-home',
    title: 'Elevate for Humanity overview',
    description: 'Primary Elevate for Humanity marketing hero.',
    video_url: `${R2}/hero-home-fast.mp4`,
    thumbnail_url: '/images/heroes/hero-homepage.webp',
    duration: 'PT1M30S',
    upload_date: '2025-01-01',
    category: 'Overview',
    page_slugs: ['/'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'barber-hero': {
    id: 'barber-hero',
    title: 'Barber apprenticeship training',
    description: 'Dedicated barber apprenticeship marketing hero.',
    video_url: `${R2}/barber-hero-final.mp4`,
    thumbnail_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/barber-hero-new.webp',
    duration: 'PT45S',
    upload_date: '2026-08-21',
    category: 'Personal Services',
    page_slugs: ['/programs/barber-apprenticeship'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'cna-hero': {
    id: 'cna-hero',
    title: 'CNA training program',
    description: 'Dedicated CNA program hero. Self-funded program; no funding claims.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-cna.mp4',
    thumbnail_url: '/images/pages/comp-pathway-healthcare.webp',
    duration: 'PT45S',
    upload_date: '2025-01-01',
    category: 'Healthcare',
    page_slugs: ['/programs/cna'],
    language: 'en',
    version: 3,
    status: 'live',
    updated_at: '2026-08-26T00:00:00Z',
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'cdl-hero': {
    id: 'cdl-hero',
    title: 'CDL training',
    description: 'Dedicated CDL program hero.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-cdl.mp4',
    thumbnail_url: '/images/pages/cdl-hero.webp',
    duration: 'PT50S',
    upload_date: '2025-01-01',
    category: 'Transportation',
    page_slugs: ['/programs/cdl-training'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'hvac-hero': {
    id: 'hvac-hero',
    title: 'HVAC technician training',
    description: 'Dedicated HVAC program hero.',
    video_url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-hvac-technician.mp4',
    thumbnail_url: '/images/pages/hvac-technician.webp',
    duration: 'PT32.28S',
    upload_date: '2026-03-07',
    category: 'Skilled Trades',
    page_slugs: ['/programs/hvac-technician'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'programs-overview': {
    id: 'programs-overview',
    title: 'Programs overview',
    description: 'Overview of Elevate career-training pathways.',
    video_url: `${R2}/programs-overview-video-with-narration.mp4`,
    thumbnail_url: '/images/hero/hero-hands-on-training.webp',
    duration: 'PT30S',
    upload_date: '2025-01-01',
    category: 'Overview',
    page_slugs: ['/programs'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'training-providers': {
    id: 'training-providers',
    title: 'Training providers',
    description: 'Training-provider network overview.',
    video_url: `${R2}/training-providers-video-with-narration.mp4`,
    thumbnail_url: '/images/pages/training-classroom.webp',
    duration: 'PT1M10S',
    upload_date: '2025-01-01',
    category: 'Partners',
    page_slugs: ['/for-providers'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'getting-started': {
    id: 'getting-started',
    title: 'How to get started',
    description: 'Application and enrollment overview.',
    video_url: `${R2}/getting-started-hero.mp4`,
    thumbnail_url: '/images/pages/comp-home-hero.webp',
    duration: 'PT35S',
    upload_date: '2025-01-01',
    category: 'How To',
    page_slugs: ['/how-it-works'],
    language: 'en',
    version: 2,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'platform-technology': {
    id: 'platform-technology',
    title: 'Elevate platform technology',
    description: 'Dedicated platform/technology hero.',
    video_url: `${R2}/it-technology.mp4`,
    thumbnail_url: '/images/hero/admin-hero.webp',
    duration: 'PT45S',
    upload_date: '2026-08-01',
    category: 'Platform',
    page_slugs: ['/platform'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
  'store-marketplace': {
    id: 'store-marketplace',
    title: 'Elevate Store marketplace commercial',
    description: 'Dedicated Elevate Store marketplace hero commercial.',
    video_url: `${R2}/store-marketplace.mp4`,
    thumbnail_url: '/images/pages/store-licensing-hero.webp',
    duration: 'PT1M',
    upload_date: '2026-08-01',
    category: 'Store',
    page_slugs: ['/store'],
    language: 'en',
    version: 1,
    status: 'live',
    updated_at: BASE_DATE,
    mime_type: 'video/mp4',
    cors_enabled: true,
  },
};

/** One marketing hero page key -> one verified production video ID. */
export const HERO_VIDEO_BY_PAGE_KEY: Readonly<Record<string, string>> = Object.freeze({
  home: 'hero-home',
  programs: 'programs-overview',
  cna: 'cna-hero',
  'medical-assistant': 'preview-medical-assistant',
  'phlebotomy': 'preview-phlebotomy',
  'cybersecurity': 'preview-cybersecurity',
  'excel': 'preview-excel',
  'osha-10': 'preview-osha-10',
  'tax-preparation': 'preview-tax-preparation',
  'barber-apprenticeship': 'barber-hero',
  'cdl-training': 'cdl-hero',
  'hvac-technician': 'hvac-hero',
  'how-it-works': 'getting-started',
  'for-providers': 'training-providers',
  platform: 'platform-technology',
  store: 'store-marketplace',
});

export function getVideoById(videoId: string): VideoRecord | null {
  return VIDEO_REGISTRY[videoId] || null;
}

export function getHeroVideoForPageKey(pageKey: string): VideoRecord | null {
  const id = HERO_VIDEO_BY_PAGE_KEY[pageKey];
  return id ? getVideoById(id) : null;
}

export function getVideoForPage(pageSlug: string): VideoRecord | null {
  const normalizedSlug = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
  return Object.values(VIDEO_REGISTRY).find((video) => video.page_slugs.includes(normalizedSlug)) || null;
}

export function getVideosByCategory(category: string): VideoRecord[] {
  return Object.values(VIDEO_REGISTRY).filter((video) => video.category === category);
}

export function getAllLiveVideos(): VideoRecord[] {
  return Object.values(VIDEO_REGISTRY);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(Object.values(VIDEO_REGISTRY).map((video) => video.category)));
}

export function getVideoCacheUrl(video: VideoRecord): string {
  if (video.video_url.startsWith('http')) return video.video_url;
  const versionParam = `v=${video.version}&t=${new Date(video.updated_at).getTime()}`;
  const separator = video.video_url.includes('?') ? '&' : '?';
  return `${video.video_url}${separator}${versionParam}`;
}

export function validateVideoRecord(video: Partial<VideoRecord>): string[] {
  const errors: string[] = [];
  if (!video.id) errors.push('Missing video ID');
  if (!video.title) errors.push('Missing title');
  if (!video.video_url) errors.push('Missing video URL');
  if (!video.thumbnail_url) errors.push('Missing thumbnail URL');
  if (!video.page_slugs?.length) errors.push('Missing page slugs');
  return errors;
}
