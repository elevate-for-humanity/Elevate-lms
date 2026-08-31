'use client';

/** MediaPanel — Studio video upload/attachment workspace. */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useCourse } from '../CourseProvider';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Video } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const VideoManagerClient = dynamic(
  () => import('@/components/admin/AdvancedVideoUploader').then((module) => module.default),
  { ssr: false, loading: () => <PanelSkeleton label="Media" /> },
);

export function MediaPanel() {
  const { state, appendAIMemory } = useCourse();
  const { videos } = state;
  const [queueing, setQueueing] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueResult, setQueueResult] = useState<string | null>(null);

  async function queueMissingLessonVideos() {
    if (queueing) return;
    setQueueing(true);
    setQueueError(null);
    setQueueResult(null);

    try {
      const response = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'queue-media',
          courseId: state.course.id,
          onlyMissing: true,
          force: false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        result?: { queued?: number; microclipsQueued?: number; skipped?: number; failed?: number };
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error || `Video queue request failed (HTTP ${response.status}).`);
      }

      const queued = (payload.result.queued ?? 0) + (payload.result.microclipsQueued ?? 0);
      const failed = payload.result.failed ?? 0;
      const message =
        failed > 0
          ? `${queued} video jobs queued; ${failed} could not be queued and remain retryable.`
          : `${queued} missing lesson video jobs queued successfully.`;
      setQueueResult(message);
      appendAIMemory({ role: 'action', content: message, source: 'media' });
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : 'Unable to queue lesson videos.');
    } finally {
      setQueueing(false);
    }
  }

  const initialVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    url: video.url ?? video.video_url ?? '',
    created_at: video.created_at,
    duration_minutes:
      video.duration_seconds != null ? Math.round(video.duration_seconds / 60) : null,
  }));

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Video className="w-5 h-5" />}
        title="Media"
        subtitle={`${videos.length} video${videos.length !== 1 ? 's' : ''} available`}
      />
      <section className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
              <Sparkles className="h-5 w-5 text-violet-700" aria-hidden="true" />
              Lesson video generation
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Queue every lesson that does not already have a generated video. Existing completed
              videos are preserved and duplicate jobs are skipped.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void queueMissingLessonVideos()}
            disabled={queueing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {queueing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            {queueing ? 'Queueing videos…' : 'Generate missing videos'}
          </button>
        </div>
        {queueResult ? (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {queueResult}
          </p>
        ) : null}
        {queueError ? (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-bold text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {queueError}
          </p>
        ) : null}
      </section>
      <VideoManagerClient
        embedded
        initialVideos={initialVideos}
        onVideoAttached={(videoUrl: string) => {
          appendAIMemory({
            role: 'action',
            content: `Video URL copied for attachment: ${videoUrl}`,
            source: 'media',
          });
        }}
      />
    </div>
  );
}
