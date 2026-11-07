/** Media API contracts. Missing measured values remain null. */
export type MediaSource = 'pexels' | 'pixabay' | 'brand_library' | 'ai_generated';
export interface MediaItem {
  id: string; type: string; url: string; title: string; source: MediaSource;
  thumbnailUrl?: string; description?: string; altText?: string;
  sourceCredit?: string; sourceUrl?: string; width?: number; height?: number;
  aspectRatio?: string; fileSize?: number | null; format?: string;
  tags: string[]; seoKeywords: string[]; usedOn: string[]; usedCount: number | null;
  createdAt: string; updatedAt: string; license?: string; requiresAttribution?: boolean;
}
export interface MediaCollection {
  id: string; name: string; items: string[]; type: 'auto' | 'manual';
  description?: string; coverImage?: string; category?: string; createdAt: string; updatedAt: string;
}
export interface MediaSearchResult {
  items: MediaItem[]; total: number | null; page: number; perPage: number; source: MediaSource; error?: string;
}
export interface GenerationRequest { prompt: string; dimensions?: {width:number;height:number}; style?: string; }
export interface ImageEditRequest { action: string; scale?: number; }
export interface BrandAssets {
  logos: {primary?: string; secondary?: string; icon?: string; dark?: string; light?: string};
  colors: {primary?: string; secondary?: string; accent?: string; text?: string; background?: string};
  fonts: {heading?: string; body?: string};
  icons: unknown[]; backgrounds: unknown[]; textures: unknown[]; templates: unknown[]; watermarks: unknown[];
}
export interface MediaStats {
  totalItems: number; totalStorage: number | null; mostUsed: MediaItem[]; recentUploads: MediaItem[];
  usageByCategory: Record<string,number>; usageBySource: Record<MediaSource,number>;
}
