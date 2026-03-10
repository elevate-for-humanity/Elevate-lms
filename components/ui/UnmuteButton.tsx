'use client';

import { Volume2 } from 'lucide-react';

interface UnmuteButtonProps {
  onClick: () => void;
}

/**
 * Shown when the browser blocks unmuted autoplay.
 * Positioned bottom-right of the hero container (parent must be relative).
 */
export function UnmuteButton({ onClick }: UnmuteButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Unmute video"
      className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm transition-all"
    >
      <Volume2 className="w-4 h-4" />
      Tap to unmute
    </button>
  );
}
