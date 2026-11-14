/**
 * PARIS Media Studio - Type Definitions
 * AI-powered media management and generation
 */

// Media Source
export type MediaSource = 
  | 'pexels'
  | 'pixabay'
  | 'unsplash'
  | 'brand_library'
  | 'ai_generated'
  | 'uploaded'
  | 'favorites';

// Media Type
export type MediaType = 'image' | 'video' | 'gif' | 'document';

// Media Item
export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  altText?: string;
  source: MediaSource;
  sourceCredit?: string;
  sourceUrl?: string;
  
  // Dimensions
  width: number;
  height: number;
  aspectRatio: string;
  
  // File info
  fileSize?: number;
  format?: string;
  
  // SEO
  tags: string[];
  seoKeywords: string[];
  
  // Usage tracking
  usedOn: string[]; // Page URLs where used
  usedCount: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  
  // AI metadata
  aiGenerated?: boolean;
  aiPrompt?: string;
  
  // License
  license: string;
  requiresAttribution: boolean;
}

// Media Collection
export interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  items: string[]; // MediaItem IDs
  type: 'auto' | 'manual';
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Auto Categories
export const MEDIA_CATEGORIES = [
  { id: 'programs', label: 'Programs', icon: '🎓' },
  { id: 'departments', label: 'Departments', icon: '🏢' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'graduations', label: 'Graduations', icon: '🎉' },
  { id: 'employers', label: 'Employers', icon: '🤝' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  { id: 'website', label: 'Website', icon: '🌐' },
  { id: 'brand', label: 'Brand Assets', icon: '🎨' },
] as const;

// Media Generation Request
export interface GenerationRequest {
  prompt: string;
  type: 'hero' | 'banner' | 'social' | 'flyer' | 'infographic' | 'icon' | 'certificate' | 'custom';
  dimensions?: {
    width: number;
    height: number;
  };
  style?: 'professional' | 'modern' | 'minimal' | 'bold' | 'elegant';
  colorScheme?: string[];
  text?: string;
  brandGuidelines?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logo?: string;
  };
}

// Image Edit Request
export interface ImageEditRequest {
  action: 
    | 'remove_background'
    | 'replace_background'
    | 'change_color'
    | 'add_overlay'
    | 'add_text'
    | 'add_watermark'
    | 'upscale'
    | 'crop'
    | 'filter'
    | 'style_transfer';
  
  parameters: Record<string, unknown>;
  
  // For background replacement
  backgroundPrompt?: string;
  
  // For color changes
  targetColor?: string;
  sourceColor?: string;
  
  // For text
  text?: string;
  textStyle?: string;
  
  // For cropping
  cropArea?: { x: number; y: number; width: number; height: number };
  
  // For upscaling
  scale?: 2 | 4;
}

// Brand Assets
export interface BrandAssets {
  logos: {
    primary: string;
    secondary: string;
    icon: string;
    dark: string;
    light: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  icons: string[];
  backgrounds: string[];
  textures: string[];
  templates: string[];
  watermarks: string[];
}

// Media Search Result
export interface MediaSearchResult {
  items: MediaItem[];
  total: number;
  page: number;
  perPage: number;
  source: MediaSource;
}

// Media Marketplace Pack
export interface MediaPack {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImages: string[];
  itemCount: number;
  price: number;
  isPremium: boolean;
}

// Media Usage Stats
export interface MediaStats {
  totalItems: number;
  totalStorage: number;
  mostUsed: MediaItem[];
  recentUploads: MediaItem[];
  usageByCategory: Record<string, number>;
  usageBySource: Record<MediaSource, number>;
}

// Platform-specific dimensions
export const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  'facebook_cover': { width: 820, height: 312, label: 'Facebook Cover' },
  'facebook_post': { width: 1200, height: 630, label: 'Facebook Post' },
  'instagram_post': { width: 1080, height: 1080, label: 'Instagram Post' },
  'instagram_story': { width: 1080, height: 1920, label: 'Instagram Story' },
  'twitter_header': { width: 1500, height: 500, label: 'Twitter Header' },
  'twitter_post': { width: 1200, height: 675, label: 'Twitter Post' },
  'linkedin_cover': { width: 1584, height: 396, label: 'LinkedIn Cover' },
  'linkedin_post': { width: 1200, height: 627, label: 'LinkedIn Post' },
  'youtube_thumbnail': { width: 1280, height: 720, label: 'YouTube Thumbnail' },
  'youtube_banner': { width: 2560, height: 1440, label: 'YouTube Banner' },
  'website_hero': { width: 1920, height: 1080, label: 'Website Hero' },
  'website_banner': { width: 1200, height: 400, label: 'Website Banner' },
  'flyer_a4': { width: 2480, height: 3508, label: 'Flyer A4' },
  'flyer_letter': { width: 2550, height: 3300, label: 'Flyer Letter' },
  'certificate': { width: 3300, height: 2550, label: 'Certificate' },
};
