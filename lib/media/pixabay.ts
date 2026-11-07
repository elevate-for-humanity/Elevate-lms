import 'server-only';
import type {MediaSearchResult} from '@/lib/paris/media-studio/types';

// Pixabay requires 24-hour caching. This bounded server cache contains search
// metadata only; selected images still need durable upload before publication.
const cache = new Map<string,{expires:number;result:MediaSearchResult}>();
export async function searchPixabay(query: string, options: {page?:number;perPage?:number;orientation?:'landscape'|'portrait'|'any'} = {}): Promise<MediaSearchResult> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error('PIXABAY_API_KEY is not configured.');
  if (query.length > 100) throw new Error('Pixabay search is limited to 100 characters.');
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const perPage = Math.max(3, Math.min(200, Math.trunc(options.perPage ?? 20)));
  const orientation = options.orientation === 'landscape' ? 'horizontal' : options.orientation === 'portrait' ? 'vertical' : 'all';
  const cacheKey = JSON.stringify([query,page,perPage,orientation]);
  const saved = cache.get(cacheKey);
  if (saved && saved.expires > Date.now()) return saved.result;
  const params = new URLSearchParams({key,q:query,page:String(page),per_page:String(perPage),orientation,image_type:'photo',safesearch:'true'});
  const response = await fetch(`https://pixabay.com/api/?${params}`, {signal:AbortSignal.timeout(30_000),redirect:'error'});
  if (!response.ok) throw new Error(`Pixabay search failed (${response.status}).`);
  const payload = await response.json();
  if (!Array.isArray(payload.hits) || !Number.isFinite(payload.totalHits)) throw new Error('PIXABAY_RESPONSE_INVALID');
  const result: MediaSearchResult = {source:'pixabay',page,perPage,total:payload.totalHits,items:payload.hits.map((hit: {id:number;largeImageURL:string;previewURL:string;tags:string;user:string;pageURL:string;imageWidth:number;imageHeight:number}) => ({
    id:`pixabay_${hit.id}`,type:'image',url:hit.largeImageURL,thumbnailUrl:hit.previewURL,title:hit.tags,source:'pixabay',sourceCredit:`Pixabay / ${hit.user}`,sourceUrl:hit.pageURL,
    width:hit.imageWidth,height:hit.imageHeight,tags:hit.tags.split(',').map(tag=>tag.trim()),seoKeywords:[],usedOn:[],usedCount:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),license:'Pixabay Content License',requiresAttribution:false,
  }))};
  if (cache.size >= 128) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey,{expires:Date.now()+24*60*60*1000,result});
  return result;
}
