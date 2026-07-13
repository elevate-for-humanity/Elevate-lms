/**
 * Video Player Index
 * 
 * Consolidated exports for all video components.
 * Use UltraVideoPlayer for all new development.
 * 
 * @deprecated Legacy players - use UltraVideoPlayer instead
 */

export { UltraVideoPlayer, default as UltraVideoPlayer } from './UltraVideoPlayer';
export type { UltraVideoPlayerProps } from './UltraVideoPlayer';

// Legacy players - @deprecated, use UltraVideoPlayer
export { default as VideoPlayer } from './VideoPlayer';
export { default as CanonicalVideo } from './CanonicalVideo';
export { default as ProfessionalVideoPlayer } from './ProfessionalVideoPlayer';
export { default as EnhancedVideoPlayer } from './EnhancedVideoPlayer';
export { default as AdvancedVideoPlayer } from './AdvancedVideoPlayer';
export { default as InteractiveVideoPlayer } from './InteractiveVideoPlayer';
export { default as TikTokStyleVideoPlayer } from './TikTokStyleVideoPlayer';
export { default as InstrumentedVideoPlayer } from './InstrumentedVideoPlayer';

// Utility exports
export { default as VideoErrorBoundary } from './VideoErrorBoundary';
export { default as VideoSource } from './VideoSource';
