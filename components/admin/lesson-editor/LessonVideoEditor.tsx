'use client';

/**
 * LessonVideoEditor
 * Edits: media_asset_id (canonical) or video_file (legacy path fallback),
 *        poster_image, transcript, captions_file,
 *        runtime_seconds, completion_threshold_percent.
 *
 * Preferred: set media_asset_id to reference a registered media_assets row.
 * Legacy: video_file path string still works for existing lessons.
 */

import { useState } from 'react';
import type { VideoConfig } from '@/lib/curriculum/lesson-content-schema';

interface Props {
  video: VideoConfig;
  onChange: (video: VideoConfig) => void;
  /** Optional: pre-loaded asset ID already linked to this lesson */
  mediaAssetId?: string | null;
  onMediaAssetChange?: (assetId: string | null) => void;
}

export default function LessonVideoEditor({
  video,
  onChange,
  mediaAssetId,
  onMediaAssetChange,
}: Props) {
  const set = (patch: Partial<VideoConfig>) => onChange({ ...video, ...patch });
  const [assetIdInput, setAssetIdInput] = useState(mediaAssetId ?? '');

  const runtimeDisplay =
    video.runtimeSeconds > 0
      ? `${Math.floor(video.runtimeSeconds / 60)}m ${video.runtimeSeconds % 60}s`
      : 'Not set';

  const usingAsset = !!mediaAssetId;

  return (
    <div className="space-y-4">
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-3 text-xs text-brand-blue-700">
        <strong>Video lessons require all three:</strong> video source, transcript, and runtime
        seconds before publish.
      </div>

      {/* Media asset reference (canonical) */}
      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">Video Source</p>
          {usingAsset && (
            <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded font-medium">
              Asset linked
            </span>
          )}
        </div>

        {/* Asset ID field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Media Asset ID{' '}
            <span className="text-slate-400 font-normal">
              (preferred — links to media_assets registry)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={assetIdInput}
              onChange={(e) => setAssetIdInput(e.target.value)}
              placeholder="UUID from media_assets table"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
            <button
              type="button"
              onClick={() => onMediaAssetChange?.(assetIdInput.trim() || null)}
              className="px-3 py-2 text-xs bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              Link
            </button>
            {usingAsset && (
              <button
                type="button"
                onClick={() => {
                  setAssetIdInput('');
                  onMediaAssetChange?.(null);
                }}
                className="px-3 py-2 text-xs border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                Unlink
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register assets at{' '}
            <code className="bg-slate-100 px-1 rounded">/api/admin/media-assets</code> after
            uploading to Supabase Storage.
          </p>
        </div>

        {/* Legacy path fallback */}
        <div className={usingAsset ? 'opacity-40 pointer-events-none' : ''}>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Legacy File Path{' '}
            <span className="text-slate-400 font-normal">
              (fallback — use asset ID above for new lessons)
            </span>
          </label>
          <input
            type="text"
            value={video.videoFile ?? ''}
            onChange={(e) => set({ videoFile: e.target.value })}
            placeholder="/videos/module-1-intro.mp4 or https://..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Poster image */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Poster Image (thumbnail)
          </label>
          <input
            type="text"
            value={video.posterImage ?? ''}
            onChange={(e) => set({ posterImage: e.target.value })}
            placeholder="/images/video-poster.jpg"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Captions file */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Captions File (.vtt)
          </label>
          <input
            type="text"
            value={video.captionsFile ?? ''}
            onChange={(e) => set({ captionsFile: e.target.value })}
            placeholder="/captions/module-1-intro.vtt"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Runtime seconds */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Runtime (seconds) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={video.runtimeSeconds}
            onChange={(e) => set({ runtimeSeconds: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Display: {runtimeDisplay}</p>
        </div>

        {/* Completion threshold */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Completion Threshold (% watched)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={video.completionThresholdPercent}
            onChange={(e) =>
              set({
                completionThresholdPercent: Math.min(
                  100,
                  Math.max(1, parseInt(e.target.value) || 90),
                ),
              })
            }
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Learner must watch this % before completion is allowed.
          </p>
        </div>
      </div>

      {/* Transcript */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Transcript <span className="text-red-500">*</span>
          <span className="text-slate-400 font-normal ml-1">
            — required for accessibility and publish
          </span>
        </label>
        <textarea
          value={video.transcript}
          onChange={(e) => set({ transcript: e.target.value })}
          rows={8}
          placeholder="Full transcript of the video narration. Required for accessibility compliance and publish gate."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y font-mono"
        />
        <p className="text-xs text-slate-400 mt-1">{video.transcript.length} characters</p>
      </div>
    </div>
  );
}
