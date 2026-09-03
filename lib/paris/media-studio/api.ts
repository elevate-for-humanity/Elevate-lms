/**
 * PARIS Media Studio - API Functions
 * Handles media search, generation, and management
 */

import { createClient } from '@supabase/supabase-js';
import type {
  MediaItem,
  MediaCollection,
  MediaSource,
  MediaSearchResult,
  GenerationRequest,
  ImageEditRequest,
  BrandAssets,
  MediaStats,
} from '../types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pexels API (free stock photos)
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_URL = 'https://api.pexels.com/v1';

// Search stock photos
export async function searchStockPhotos(
  query: string,
  options?: {
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'any';
    source?: 'pexels' | 'pixabay';
  }
): Promise<MediaSearchResult> {
  const page = options?.page || 1;
  const perPage = options?.perPage || 20;

  // Search Pexels
  if (PEXELS_API_KEY && options?.source !== 'pixabay') {
    try {
      const params = new URLSearchParams({
        query,
        page: String(page),
        per_page: String(perPage),
      });
      if (options?.orientation) {
        params.set('orientation', options.orientation);
      }

      const response = await fetch(`${PEXELS_URL}/search?${params}`, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          items: data.photos.map((photo: any) => ({
            id: `pexels_${photo.id}`,
            type: 'image' as const,
            url: photo.src.large2x || photo.src.large,
            thumbnailUrl: photo.src.medium,
            title: photo.alt || query,
            altText: photo.alt,
            source: 'pexels' as const,
            sourceCredit: `Photo by ${photo.photographer}`,
            sourceUrl: photo.photographer_url,
            width: photo.width,
            height: photo.height,
            aspectRatio: `${photo.width}:${photo.height}`,
            tags: query.split(' '),
            seoKeywords: [query],
            usedOn: [],
            usedCount: 0,
            createdAt: photo.created_at || new Date().toISOString(),
            updatedAt: photo.updated_at || new Date().toISOString(),
            license: 'Pexels License',
            requiresAttribution: true,
          })),
          total: data.total_results,
          page,
          perPage,
          source: 'pexels',
        };
      }
    } catch (error) {
      console.error('Pexels search failed:', error);
    }
  }

  // Return empty result if both sources fail
  return {
    items: [],
    total: 0,
    page,
    perPage,
    source: 'pexels',
  };
}

// Get curated photos from Pexels
export async function getCuratedPhotos(page = 1, perPage = 20): Promise<MediaSearchResult> {
  if (!PEXELS_API_KEY) {
    return { items: [], total: 0, page, perPage, source: 'pexels' };
  }

  try {
    const response = await fetch(`${PEXELS_URL}/curated?page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        items: data.photos.map((photo: any) => ({
          id: `pexels_${photo.id}`,
          type: 'image' as const,
          url: photo.src.large2x || photo.src.large,
          thumbnailUrl: photo.src.medium,
          title: photo.alt || 'Curated Photo',
          source: 'pexels' as const,
          sourceCredit: `Photo by ${photo.photographer}`,
          width: photo.width,
          height: photo.height,
          aspectRatio: `${photo.width}:${photo.height}`,
          tags: [],
          seoKeywords: [],
          usedOn: [],
          usedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          license: 'Pexels License',
          requiresAttribution: true,
        })),
        total: data.total_results,
        page,
        perPage,
        source: 'pexels',
      };
    }
  } catch (error) {
    console.error('Pexels curated failed:', error);
  }

  return { items: [], total: 0, page, perPage, source: 'pexels' };
}

// Search brand library
export async function searchBrandLibrary(
  query: string,
  orgId: string
): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('source', 'brand_library')
    .or(`title.ilike.%${query}%,tags.cs.{${query}}`);

  if (error || !data) return [];
  return data as MediaItem[];
}

// Generate image with AI
export async function generateImage(
  request: GenerationRequest
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  // This would integrate with an AI image generation API
  // For now, return a placeholder
  
  const { type, dimensions, style } = request;
  
  // Simulate generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a placeholder image URL
  const width = dimensions?.width || 1920;
  const height = dimensions?.height || 1080;
  
  return {
    success: true,
    imageUrl: `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
  };
}

// Edit existing image
export async function editImage(
  imageUrl: string,
  request: ImageEditRequest
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  // This would integrate with image editing APIs
  // For background removal, could use remove.bg or similar
  
  switch (request.action) {
    case 'remove_background':
      // Would call remove.bg API
      return { success: true, imageUrl: imageUrl + '?nobg=true' };
    
    case 'upscale':
      const scale = request.scale || 2;
      return { 
        success: true, 
        imageUrl: `https://picsum.photos/${1920 * scale}/${1080 * scale}` 
      };
    
    default:
      return { success: true, imageUrl };
  }
}

// Save image to brand library
export async function saveToBrandLibrary(
  item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>,
  orgId: string
): Promise<MediaItem | null> {
  const newItem: MediaItem = {
    ...item,
    id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('media_items')
    .insert({
      ...newItem,
      org_id: orgId,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as MediaItem;
}

// Get brand assets
export async function getBrandAssets(orgId: string): Promise<BrandAssets | null> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    // Return default Elevate brand assets
    return getDefaultBrandAssets();
  }

  return data as BrandAssets;
}

// Default Elevate brand assets
function getDefaultBrandAssets(): BrandAssets {
  return {
    logos: {
      primary: '/images/brand/logo-primary.svg',
      secondary: '/images/brand/logo-secondary.svg',
      icon: '/images/brand/logo-icon.svg',
      dark: '/images/brand/logo-dark.svg',
      light: '/images/brand/logo-light.svg',
    },
    colors: {
      primary: '#DC2626',
      secondary: '#1E3A5F',
      accent: '#F59E0B',
      text: '#1F2937',
      background: '#FFFFFF',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    icons: [],
    backgrounds: [],
    textures: [],
    templates: [],
    watermarks: [],
  };
}

// Get media statistics
export async function getMediaStats(orgId: string): Promise<MediaStats> {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('org_id', orgId);

  if (error || !data) {
    return {
      totalItems: 0,
      totalStorage: 0,
      mostUsed: [],
      recentUploads: [],
      usageByCategory: {},
      usageBySource: {} as Record<MediaSource, number>,
    };
  }

  const items = data as MediaItem[];

  // Sort by usage
  const mostUsed = [...items].sort((a, b) => b.usedCount - a.usedCount).slice(0, 10);
  
  // Sort by date
  const recentUploads = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  // Count by category
  const usageByCategory: Record<string, number> = {};
  items.forEach(item => {
    const category = item.tags[0] || 'uncategorized';
    usageByCategory[category] = (usageByCategory[category] || 0) + 1;
  });

  // Count by source
  const usageBySource: Record<MediaSource, number> = {} as Record<MediaSource, number>;
  items.forEach(item => {
    usageBySource[item.source] = (usageBySource[item.source] || 0) + 1;
  });

  return {
    totalItems: items.length,
    totalStorage: items.reduce((sum, item) => sum + (item.fileSize || 0), 0),
    mostUsed,
    recentUploads,
    usageByCategory,
    usageBySource,
  };
}

// Delete media item
export async function deleteMediaItem(id: string): Promise<boolean> {
  // Check if used on any pages
  const { data } = await supabase
    .from('media_items')
    .select('used_on')
    .eq('id', id)
    .single();

  if (data && (data.used_on as string[]).length > 0) {
    throw new Error(`This image is used on ${(data.used_on as string[]).length} pages`);
  }

  const { error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', id);

  return !error;
}

// Update media usage
export async function trackMediaUsage(
  id: string,
  pageUrl: string,
  action: 'add' | 'remove'
): Promise<void> {
  const { data } = await supabase
    .from('media_items')
    .select('used_on, used_count')
    .eq('id', id)
    .single();

  if (!data) return;

  let usedOn = data.used_on as string[] || [];
  const usedCount = data.used_count || 0;

  if (action === 'add' && !usedOn.includes(pageUrl)) {
    usedOn.push(pageUrl);
  } else if (action === 'remove') {
    usedOn = usedOn.filter(url => url !== pageUrl);
  }

  await supabase
    .from('media_items')
    .update({
      used_on: usedOn,
      used_count: action === 'add' ? usedCount + 1 : Math.max(0, usedCount - 1),
    })
    .eq('id', id);
}

// Create collection
export async function createCollection(
  name: string,
  orgId: string,
  type: 'auto' | 'manual' = 'manual'
): Promise<MediaCollection | null> {
  const collection: MediaCollection = {
    id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    items: [],
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('media_collections')
    .insert({
      ...collection,
      org_id: orgId,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as MediaCollection;
}

// Get collections
export async function getCollections(orgId: string): Promise<MediaCollection[]> {
  const { data, error } = await supabase
    .from('media_collections')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as MediaCollection[];
}

// Optimize image for web
export async function optimizeImage(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): Promise<string> {
  // In production, this would use an image optimization service
  // like Cloudinary, imgix, or a custom solution
  
  const params = new URLSearchParams();
  if (options?.width) params.set('w', String(options.width));
  if (options?.height) params.set('h', String(options.height));
  if (options?.quality) params.set('q', String(options.quality));
  if (options?.format) params.set('f', options.format);

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// Generate alt text with AI
export async function generateAltText(imageUrl: string): Promise<string> {
  // In production, this would use a vision AI API
  // For now, return a placeholder
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'Generated alt text for this image';
}

// Search with unified results
export async function unifiedMediaSearch(
  query: string,
  options?: {
    sources?: MediaSource[];
    page?: number;
    perPage?: number;
    orgId?: string;
  }
): Promise<Record<MediaSource, MediaSearchResult>> {
  const sources = options?.sources || ['pexels', 'brand_library', 'ai_generated'];
  const results: Record<MediaSource, MediaSearchResult> = {} as Record<MediaSource, MediaSearchResult>;

  // Search Pexels
  if (sources.includes('pexels')) {
    results.pexels = await searchStockPhotos(query, {
      page: options?.page,
      perPage: options?.perPage,
    });
  }

  // Search brand library
  if (sources.includes('brand_library') && options?.orgId) {
    const items = await searchBrandLibrary(query, options.orgId);
    results.brand_library = {
      items,
      total: items.length,
      page: options?.page || 1,
      perPage: options?.perPage || 20,
      source: 'brand_library',
    };
  }

  // AI generated would be a separate search
  if (sources.includes('ai_generated')) {
    results.ai_generated = {
      items: [],
      total: 0,
      page: options?.page || 1,
      perPage: options?.perPage || 20,
      source: 'ai_generated',
    };
  }

  return results;
}
