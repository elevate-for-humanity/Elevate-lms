/**
 * Image path resolution - fallback only for truly dynamic paths.
 * Use resolveSiteImagePath() before passing src to next/image.
 * 
 * ⚠️ SERVER-ONLY: This module imports 'fs' which is not available in browsers.
 * Only import this in Server Components or pass pre-resolved paths to Client Components.
 */
import { existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_FALLBACK = '/images/heroes/hero-homepage.webp';

export function resolveSiteImagePath(src: string | null | undefined): string {
  if (!src || !src.trim()) return DEFAULT_FALLBACK;
  const trimmed = src.trim();

  // Check if file exists
  if (trimmed.startsWith('/images/') || trimmed.startsWith('/hero-images/') || trimmed.startsWith('/media/')) {
    const publicPath = join(process.cwd(), 'public', trimmed);
    if (existsSync(publicPath)) return trimmed;
    
    // Try alternative extension
    const altExt = trimmed.endsWith('.jpg') ? '.webp' : trimmed.endsWith('.webp') ? '.jpg' : null;
    if (altExt) {
      const altPath = trimmed.slice(0, -4) + altExt;
      if (existsSync(join(process.cwd(), 'public', altPath))) return altPath;
    }
    
    return DEFAULT_FALLBACK;
  }

  return trimmed;
}
