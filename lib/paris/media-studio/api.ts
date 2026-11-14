import { searchPixabay } from '@/lib/media/pixabay';
import { editImageBytes, optimizeImageBytes, describeImageBytes } from '@/lib/media/image-operations';
import 'server-only';
import { aiGenerateImage } from '@/lib/ai/ai-service';
/**
 * PARIS Media Studio - API Functions
 * Handles media search, generation, and management
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { requireSavedRow, requireQuerySuccess } from '../database-receipt';
import type {
  MediaItem,
  MediaCollection,
  MediaSource,
  MediaSearchResult,
  GenerationRequest,
  ImageEditRequest,
  BrandAssets,
  MediaStats,
} from './types';

// Pexels API (free stock photos)
const PEXELS_URL = 'https://api.pexels.com/v1';

function mediaFromRow(row: Record<string, any>): MediaItem {
  return { id: row.id, type: row.type, url: row.url, title: row.title, source: row.source,
    thumbnailUrl: row.thumbnail_url, description: row.description, altText: row.alt_text,
    sourceCredit: row.source_credit, sourceUrl: row.source_url, width: row.width, height: row.height,
    aspectRatio: row.aspect_ratio, fileSize: row.file_size == null ? null : Number(row.file_size), format: row.format,
    tags: row.tags ?? [], seoKeywords: row.seo_keywords ?? [], usedOn: row.used_on ?? [], usedCount: row.used_count ?? null,
    createdAt: row.created_at, updatedAt: row.updated_at, license: row.license, requiresAttribution: row.requires_attribution };
}
function collectionFromRow(row: Record<string, any>): MediaCollection {
  return {id:row.id,name:row.name,description:row.description,coverImage:row.cover_image,items:row.items ?? [],
    type:row.type,category:row.category,createdAt:row.created_at,updatedAt:row.updated_at};
}

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
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  const page = options?.page || 1;
  const perPage = options?.perPage || 20;

  if (options?.source === 'pixabay') return searchPixabay(query, options);
  if (!PEXELS_API_KEY) throw new Error('PEXELS_API_KEY is not configured.');

  // Search Pexels
  {
      const params = new URLSearchParams({
        query,
        page: String(page),
        per_page: String(perPage),
      });
      if (options?.orientation && options.orientation !== 'any') {
        params.set('orientation', options.orientation);
      }

      const response = await fetch(`${PEXELS_URL}/search?${params}`, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (!response.ok) throw new Error(`Pexels search failed (${response.status}).`);
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
  }

  throw new Error('PARIS_STOCK_SEARCH_UNAVAILABLE: Provider access failed or the selected source is not configured.');
}

// Get curated photos from Pexels
export async function getCuratedPhotos(page = 1, perPage = 20): Promise<MediaSearchResult> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY is not configured.');
  }

    const response = await fetch(`${PEXELS_URL}/curated?page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) throw new Error(`Pexels curated search failed (${response.status}).`);
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

  throw new Error('PARIS_STOCK_SEARCH_UNAVAILABLE');
}

// Search brand library
export async function searchBrandLibrary(
  query: string,
  orgId: string
): Promise<MediaItem[]> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('source', 'brand_library')
    .or(`title.ilike.%${query}%,tags.cs.{${query}}`);

  requireQuerySuccess({error}, 'search_brand_library');
  if (!data) return [];
  return data.map(mediaFromRow);
}

// Generate image with AI
export async function generateImage(
  request: GenerationRequest
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  if (!request.prompt?.trim()) return { success: false, error: 'An image prompt is required.' };
  const dimensions = request.dimensions;
  const size = !dimensions || dimensions.width === dimensions.height ? '1024x1024'
    : dimensions.width > dimensions.height ? '1792x1024' : '1024x1792';
  try {
    const images = await aiGenerateImage({
      prompt: [request.prompt, request.style, request.text].filter(Boolean).join('\n'),
      count: 1, size, format: 'url',
    });
    const image = images[0];
    const imageUrl = image?.url || (image?.b64Json ? `data:image/png;base64,${image.b64Json}` : undefined);
    if (!imageUrl) throw new Error('Image provider returned no image.');
    return { success: true, imageUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Image generation failed.' };
  }
}

// Transform actual image bytes locally or use the authorized image-edit provider.
export async function editImage(
  imageUrl: string,
  request: ImageEditRequest,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try { return { success: true, imageUrl: await editImageBytes(imageUrl, request) }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Image editing failed.' }; }
}

// Save image to brand library
export async function saveToBrandLibrary(
  item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>,
  orgId: string
): Promise<MediaItem | null> {
  const supabase = await requireAdminClient();
  const newItem: MediaItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('media_items')
    .insert({
      id: newItem.id, type: newItem.type, url: newItem.url, title: newItem.title, source: newItem.source,
      thumbnail_url: newItem.thumbnailUrl, description: newItem.description, alt_text: newItem.altText,
      source_credit: newItem.sourceCredit, source_url: newItem.sourceUrl,
      width: newItem.width, height: newItem.height, aspect_ratio: newItem.aspectRatio, file_size: newItem.fileSize,
      format: newItem.format, tags: newItem.tags, seo_keywords: newItem.seoKeywords,
      used_on: newItem.usedOn, used_count: newItem.usedCount, created_at: newItem.createdAt, updated_at: newItem.updatedAt,
      license: newItem.license, requires_attribution: newItem.requiresAttribution,
      org_id: orgId,
      ai_generated: newItem.source === 'ai_generated',
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) return null;
  return mediaFromRow(data);
}

// Get brand assets
export async function getBrandAssets(orgId: string): Promise<BrandAssets | null> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('org_id', orgId)
    .single();

  requireQuerySuccess({error}, 'read_brand_assets');
  if (!data) {
    return null;
  }

  return { logos:{primary:data.logo_primary,secondary:data.logo_secondary,icon:data.logo_icon,dark:data.logo_dark,light:data.logo_light},
    colors:{primary:data.color_primary,secondary:data.color_secondary,accent:data.color_accent,text:data.color_text,background:data.color_background},
    fonts:{heading:data.font_heading,body:data.font_body},icons:data.icons ?? [],backgrounds:data.backgrounds ?? [],
    textures:data.textures ?? [],templates:data.templates ?? [],watermarks:data.watermarks ?? [] };
}

// Get media statistics
export async function getMediaStats(orgId: string): Promise<MediaStats> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('org_id', orgId);

  requireQuerySuccess({error}, 'read_media_statistics');
  if (!data) {
    return {
      totalItems: 0,
      totalStorage: 0,
      mostUsed: [],
      recentUploads: [],
      usageByCategory: {},
      usageBySource: {} as Record<MediaSource, number>,
    };
  }

  const items = data.map(mediaFromRow);

  // Sort by usage
  const mostUsed = [...items].sort((a, b) => (b.usedCount ?? -1) - (a.usedCount ?? -1)).slice(0, 10);
  
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
    totalStorage: items.some(item => item.fileSize == null) ? null : items.reduce((sum, item) => sum + item.fileSize!, 0),
    mostUsed,
    recentUploads,
    usageByCategory,
    usageBySource,
  };
}

// Delete media item
export async function deleteMediaItem(id: string): Promise<boolean> {
  const supabase = await requireAdminClient();
  // Check if used on any pages
  const { data, error: readError } = await supabase
    .from('media_items')
    .select('used_on')
    .eq('id', id)
    .single();
  requireQuerySuccess({error: readError}, 'read_media_before_delete');
  if (!data) return false;

  if (readError) throw readError;
  if (data && (data.used_on as string[]).length > 0) {
    throw new Error(`This image is used on ${(data.used_on as string[]).length} pages`);
  }

  const { data: deleted, error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', id).select('id').single();

  return !error && Boolean(deleted?.id);
}

// Update media usage
export async function trackMediaUsage(
  id: string,
  pageUrl: string,
  action: 'add' | 'remove'
): Promise<void> {
  const supabase = await requireAdminClient();
  const { data, error: readError } = await supabase
    .from('media_items')
    .select('used_on, used_count')
    .eq('id', id)
    .single();
  requireQuerySuccess({error: readError}, 'read_media_usage');

  if (!data) throw new Error('PARIS_MEDIA_USAGE_ROW_MISSING');

  let usedOn = data.used_on as string[] || [];

  if (action === 'add' && !usedOn.includes(pageUrl)) {
    usedOn.push(pageUrl);
  } else if (action === 'remove') {
    usedOn = usedOn.filter(url => url !== pageUrl);
  }

  const saved = await supabase
    .from('media_items')
    .update({
      used_on: usedOn,
      used_count: usedOn.length,
    })
    .eq('id', id).select('id').single();
  requireSavedRow(saved, 'track_media_usage');
}

// Create collection
export async function createCollection(
  name: string,
  orgId: string,
  type: 'auto' | 'manual' = 'manual'
): Promise<MediaCollection | null> {
  const supabase = await requireAdminClient();
  const collection: MediaCollection = {
    id: crypto.randomUUID(),
    name,
    items: [],
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('media_collections')
    .insert({
      id:collection.id,name:collection.name,items:collection.items,type:collection.type,
      created_at:collection.createdAt,updated_at:collection.updatedAt,
      org_id: orgId,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) return null;
  return collectionFromRow(data);
}

// Get collections
export async function getCollections(orgId: string): Promise<MediaCollection[]> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('media_collections')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  requireQuerySuccess({error}, 'get_media_collections');
  if (!data) return [];
  return data.map(collectionFromRow);
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
  if (!options || Object.keys(options).length === 0) return url;
  return optimizeImageBytes(url, options);
}

// Describe the actual normalized image through the authorized vision provider.
export async function generateAltText(imageUrl: string): Promise<string> {
  return describeImageBytes(imageUrl);
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

  // Search actual saved AI artifacts within the requested organization.
  if (sources.includes('ai_generated')) {
    if (!options?.orgId) throw new Error('PARIS_MEDIA_ORGANIZATION_REQUIRED');
    const supabase = await requireAdminClient();
    const {data,error} = await supabase.from('media_items').select('*').eq('org_id',options.orgId).eq('ai_generated',true).ilike('title',`%${query}%`);
    requireQuerySuccess({error}, 'search_generated_media');
    const items = (data ?? []).map(mediaFromRow);
    results.ai_generated = {
      items,
      total: items.length,
      page: options?.page || 1,
      perPage: options?.perPage || 20,
      source: 'ai_generated',
    };
  }

  return results;
}
