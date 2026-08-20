'use client';

import { useEffect, useState, ComponentType } from 'react';

interface PageAudioProps {
  voiceoverSrc?: string;
  ambientMusicSrc?: string;
  disabled?: boolean;
}

/**
 * Smart page-audio loader. Audio only renders when the caller provides a
 * verified source; there is no implicit fallback path that can 404.
 */
export default function PageAudio({
  voiceoverSrc,
  ambientMusicSrc,
  disabled = false,
}: PageAudioProps) {
  const [hasVideo, setHasVideo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkForVideo = () => {
      const videos = document.querySelectorAll('video');
      const hasPlayingVideo = Array.from(videos).some((v) => !v.paused || v.autoplay);
      setHasVideo(hasPlayingVideo || videos.length > 0);
    };

    checkForVideo();
    const timer = setTimeout(checkForVideo, 500);
    return () => clearTimeout(timer);
  }, []);

  const [AudioComponent, setAudioComponent] = useState<{
    AmbientMusic: ComponentType<{ src: string }> | null;
    VoiceoverWithMusic: ComponentType<{ audioSrc: string }> | null;
  }>({ AmbientMusic: null, VoiceoverWithMusic: null });

  useEffect(() => {
    Promise.all([
      import('./AmbientMusic').then((m) => m.default).catch(() => null),
      import('./VoiceoverWithMusic').then((m) => m.default).catch(() => null),
    ]).then(([Ambient, Voiceover]) => {
      setAudioComponent({ AmbientMusic: Ambient, VoiceoverWithMusic: Voiceover });
    });
  }, []);

  if (!mounted || disabled) return null;

  if (voiceoverSrc && AudioComponent.VoiceoverWithMusic) {
    return <AudioComponent.VoiceoverWithMusic audioSrc={voiceoverSrc} />;
  }

  if (hasVideo || !ambientMusicSrc) return null;

  if (AudioComponent.AmbientMusic) {
    return <AudioComponent.AmbientMusic src={ambientMusicSrc} />;
  }

  return null;
}
