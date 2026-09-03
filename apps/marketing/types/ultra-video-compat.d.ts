import '@/components/video/UltraVideoPlayer';

declare module '@/components/video/UltraVideoPlayer' {
  interface UltraVideoPlayerProps {
    /** @deprecated Legacy caller compatibility. The consolidated player ignores this flag. */
    playThrough?: boolean;
    /** @deprecated Use showControls. Retained so legacy callers do not fail typecheck. */
    controls?: boolean;
  }
}
