/**
 * Video Player Index
 * 
 * Single export for all video components.
 * UltraVideoPlayer replaces all legacy players.
 */

export { default as UltraVideoPlayer } from './UltraVideoPlayer';
export type { UltraVideoPlayerProps, Chapter, CaptionTrack } from './UltraVideoPlayer';

// Legacy exports - mapped to UltraVideoPlayer (for backwards compatibility)
export { default as VideoPlayer } from './UltraVideoPlayer';
export { default as CanonicalVideo } from './UltraVideoPlayer';
export { default as ProfessionalVideoPlayer } from './UltraVideoPlayer';
export { default as EnhancedVideoPlayer } from './UltraVideoPlayer';
export { default as AdvancedVideoPlayer } from './UltraVideoPlayer';
export { default as InteractiveVideoPlayer } from './UltraVideoPlayer';
export { default as TikTokStyleVideoPlayer } from './UltraVideoPlayer';
export { default as InstrumentedVideoPlayer } from './UltraVideoPlayer';
