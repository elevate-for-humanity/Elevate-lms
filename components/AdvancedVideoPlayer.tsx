'use client';

import React from 'react';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface AdvancedVideoPlayerProps {
  src: string;
  poster?: string;
  lessonId?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  startTime?: number;
  subtitles?: Array<{
    src: string;
    srclang: string;
    label: string;
  }>;
}

export function AdvancedVideoPlayer({
  src,
  poster,
  lessonId,
  onProgress,
  onComplete,
  startTime = 0,
  subtitles = [],
}: AdvancedVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'playbackRateMenuButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'fullscreenToggle',
          ],
        },
        userActions: {
          hotkeys: function (event: KeyboardEvent) {
            // Space bar toggles play/pause
            if (event.which === 32) {
              event.preventDefault();
              if (this.paused()) {
                this.play().catch(() => {});
              } else {
                this.pause();
              }
            }
            // Left arrow rewinds 10 seconds
            if (event.which === 37) {
              event.preventDefault();
              this.currentTime(Math.max(0, this.currentTime() - 10));
            }
            // Right arrow forwards 10 seconds
            if (event.which === 39) {
              event.preventDefault();
              this.currentTime(Math.min(this.duration(), this.currentTime() + 10));
            }
            // Up arrow increases volume
            if (event.which === 38) {
              event.preventDefault();
              this.volume(Math.min(1, this.volume() + 0.1));
            }
            // Down arrow decreases volume
            if (event.which === 40) {
              event.preventDefault();
              this.volume(Math.max(0, this.volume() - 0.1));
            }
            // F key toggles fullscreen
            if (event.which === 70) {
              event.preventDefault();
              if (this.isFullscreen()) {
                this.exitFullscreen();
              } else {
                this.requestFullscreen();
              }
            }
            // M key toggles mute
            if (event.which === 77) {
              event.preventDefault();
              this.muted(!this.muted());
            }
          },
        },
      }));

      // Set source
      player.src({
        src: src,
        type: 'video/mp4',
      });

      // Set poster
      if (poster) {
        player.poster(poster);
      }

      // Add subtitles
      subtitles.forEach((subtitle) => {
        player.addRemoteTextTrack(
          {
            kind: 'subtitles',
            src: subtitle.src,
            srclang: subtitle.srclang,
            label: subtitle.label,
          },
          false,
        );
      });

      // Resume from last position
      if (startTime > 0) {
        player.one('loadedmetadata', () => {
          player.currentTime(startTime);
        });
      }

      // Track progress
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        const duration = player.duration();

        if (onProgress && duration > 0) {
          onProgress(currentTime, duration);
        }

        // Mark as complete when 90% watched
        if (duration > 0 && currentTime / duration >= 0.9 && onComplete) {
          onComplete();
        }
      });

      // Save progress on pause
      player.on('pause', () => {
        const currentTime = player.currentTime();
        if (lessonId && currentTime > 0) {
          localStorage.setItem(`lesson_${lessonId}_progress`, currentTime.toString());
        }
      });

      // Save progress on end
      player.on('ended', () => {
        if (onComplete) {
          onComplete();
        }
      });

      setIsReady(true);
    }

    // Dispose the player on unmount
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, lessonId, onProgress, onComplete, startTime, subtitles]);

  return (
    <div className="w-full">
      <div ref={videoRef} className="rounded-lg overflow-hidden shadow-lg" />

      {/* Keyboard shortcuts help */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs text-black">
        <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">Space</kbd> Play/Pause
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">←</kbd> Rewind 10s
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">→</kbd> Forward 10s
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">↑</kbd> Volume Up
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">↓</kbd> Volume Down
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">F</kbd> Fullscreen
          </div>
          <div>
            <kbd className="px-2 py-2 bg-white border rounded">M</kbd> Mute
          </div>
        </div>
      </div>
    </div>
  );
}
