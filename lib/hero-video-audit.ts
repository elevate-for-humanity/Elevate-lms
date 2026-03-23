/**
 * Development-only audit helper for hero video elements.
 * Import and call inside HeroVideo/PageVideoHero useEffect blocks.
 * No-ops in production.
 */

export interface HeroVideoAuditResult {
  ok: boolean;
  errors: string[];
}

export function validateHeroVideoElement(
  video: HTMLVideoElement | null,
): HeroVideoAuditResult {
  if (process.env.NODE_ENV !== 'development') {
    return { ok: true, errors: [] };
  }

  const errors: string[] = [];

  if (!video) {
    return { ok: false, errors: ['Hero video element missing'] };
  }

  if (!video.autoplay) errors.push('Hero video must autoplay');
  if (!video.muted)    errors.push('Hero video must start muted');
  if (!video.loop)     errors.push('Hero video must loop');
  if (!video.playsInline) errors.push('Hero video must use playsInline');
  if (!video.poster)   errors.push('Hero video must have a poster image');

  return { ok: errors.length === 0, errors };
}
