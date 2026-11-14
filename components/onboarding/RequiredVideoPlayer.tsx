'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface RequiredVideoPlayerProps {
  enrollmentId: string;
  videoKey: string;
  title: string;
  src: string;
  poster?: string;
  captionsSrc?: string;
  required?: boolean;
  acknowledgmentRequired?: boolean;
  onCompleted?: () => void;
}

export function RequiredVideoPlayer({
  enrollmentId,
  videoKey,
  title,
  src,
  poster,
  captionsSrc,
  required = true,
  acknowledgmentRequired = false,
  onCompleted,
}: RequiredVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedSecond = useRef(0);

  const [completed, setCompleted] = useState(false);
  const [acknowledged, setAcknowledged] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const saveProgress = useCallback(
    async (ended = false) => {
      const video = videoRef.current;

      if (
        !video ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }

      const currentSeconds = Math.floor(video.currentTime);

      if (
        !ended &&
        currentSeconds - lastSavedSecond.current < 10
      ) {
        return;
      }

      lastSavedSecond.current = currentSeconds;
      setSaving(true);

      try {
        const response = await fetch(
          `/api/onboarding/videos/${encodeURIComponent(videoKey)}/progress`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enrollmentId,
              currentSeconds,
              durationSeconds: video.duration,
              ended,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ?? 'Unable to save video progress',
          );
        }

        if (result.completed) {
          setCompleted(true);

          if (
            !result.acknowledgmentRequired ||
            acknowledged
          ) {
            onCompleted?.();
          }
        }
      } finally {
        setSaving(false);
      }
    },
    [
      acknowledged,
      enrollmentId,
      onCompleted,
      videoKey,
    ],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      void saveProgress(false);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [saveProgress]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      <video
        ref={videoRef}
        controls
        controlsList={
          required ? 'nodownload noplaybackrate' : undefined
        }
        disablePictureInPicture={required}
        poster={poster}
        className="aspect-video w-full rounded-xl bg-black"
        onEnded={() => void saveProgress(true)}
        onPause={() => void saveProgress(false)}
      >
        <source src={src} type="video/mp4" />

        {captionsSrc && (
          <track
            kind="captions"
            src={captionsSrc}
            srcLang="en"
            label="English"
            default
          />
        )}

        Your browser does not support HTML video.
      </video>

      {acknowledgmentRequired && (
        <label className="flex items-start gap-3 rounded-lg border p-4">
          <input
            type="checkbox"
            checked={acknowledged}
            disabled={!completed}
            onChange={(event) => {
              setAcknowledged(event.target.checked);

              if (event.target.checked && completed) {
                onCompleted?.();
              }
            }}
            className="mt-1"
          />

          <span>
            I watched this video and understand the
            requirements explained above.
          </span>
        </label>
      )}

      <p className="text-sm text-gray-600" aria-live="polite">
        {saving
          ? 'Saving progress...'
          : completed
            ? 'Video completed.'
            : 'Watch at least 90% to complete this requirement.'}
      </p>
    </section>
  );
}
