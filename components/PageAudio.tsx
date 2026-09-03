'use client';

import { useEffect, useState, ComponentType } from 'react';

interface PageAudioProps {
  // For pages with voiceover (like homepage)
  voiceoverSrc?: string;
  // For pages without video - plays soft ambient music
  ambientMusicSrc?: string;
  // Disable all audio
  disabled?: boolean;
}

/**
 * Smart audio component for pages.
 *
 * Usage:
 * - Homepage with voiceover: <PageAudio voiceoverSrc="/audio/welcome.mp3" />
 * - Program pages (no video): <PageAudio ambientMusicSrc="/audio/ambient-soft.mp3" />
 * - Pages with video hero: <PageAudio disabled /> or don't include
 *
 * The component auto-detects if there's a video on the page and won't play
 * ambient music if video is present.
 */
export default function PageAudio({
  voiceoverSrc,
  ambientMusicSrc = '/audio/ambient-soft.mp3',
  disabled = false,
}: PageAudioProps) {
  const [hasVideo, setHasVideo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if page has a video element
    const checkForVideo = () => {
      const videos = document.querySelectorAll('video');
      const hasPlayingVideo = Array.from(videos).some((v) => !v.paused || v.autoplay);
      setHasVideo(hasPlayingVideo || videos.length > 0);
    };

    // Check immediately and after a short delay (for dynamic content)
    checkForVideo();
    const timer = setTimeout(checkForVideo, 500);

    return () => clearTimeout(timer);
  }, []);

  const [AudioComponent, setAudioComponent] = useState<{
    AmbientMusic: ComponentType<{ src: string }> | null;
    VoiceoverWithMusic: ComponentType<{ audioSrc: string }> | null;
  }>({ AmbientMusic: null, VoiceoverWithMusic: null });

  useEffect(() => {
    // Load audio components after mount
    Promise.all([
      import('./AmbientMusic').then((m) => m.default).catch(() => null),
      import('./VoiceoverWithMusic').then((m) => m.default).catch(() => null),
    ]).then(([Ambient, Voiceover]) => {
      setAudioComponent({
        AmbientMusic: Ambient,
        VoiceoverWithMusic: Voiceover,
      });
    });
  }, []);

  if (!mounted || disabled) return null;

  // If voiceover is provided, use that (homepage)
  if (voiceoverSrc && AudioComponent.VoiceoverWithMusic) {
    return <AudioComponent.VoiceoverWithMusic audioSrc={voiceoverSrc} />;
  }

  // If page has video, don't play ambient music
  if (hasVideo) return null;

  // Play ambient music on pages without video
  if (AudioComponent.AmbientMusic) {
    return <AudioComponent.AmbientMusic src={ambientMusicSrc} />;
  }

  return null;
}
