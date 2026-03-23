'use client';

/**
 * LessonVideoEditor
 * Edits: video_file, poster_image, transcript, captions_file,
 *        runtime_seconds, completion_threshold_percent.
 * All fields required for publish on video lesson type.
 */

import type { VideoConfig } from '@/lib/curriculum/lesson-content-schema';

interface Props {
  video: VideoConfig;
  onChange: (video: VideoConfig) => void;
}

export default function LessonVideoEditor({ video, onChange }: Props) {
  const set = (patch: Partial<VideoConfig>) => onChange({ ...video, ...patch });

  const runtimeDisplay = video.runtimeSeconds > 0
    ? `${Math.floor(video.runtimeSeconds / 60)}m ${video.runtimeSeconds % 60}s`
    : 'Not set';

  return (
    <div className="space-y-4">
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-3 text-xs text-brand-blue-700">
        <strong>Video lessons require all three:</strong> video file path, transcript, and runtime seconds before publish.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video file path */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Video File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={video.videoFile ?? ''}
            onChange={e => set({ videoFile: e.target.value })}
            placeholder="/videos/module-1-intro.mp4 or https://..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Relative path from /public or absolute URL. Use Supabase storage path for hosted videos.</p>
        </div>

        {/* Poster image */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Poster Image (thumbnail)</label>
          <input
            type="text"
            value={video.posterImage ?? ''}
            onChange={e => set({ posterImage: e.target.value })}
            placeholder="/images/video-poster.jpg"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Captions file */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Captions File (.vtt)</label>
          <input
            type="text"
            value={video.captionsFile ?? ''}
            onChange={e => set({ captionsFile: e.target.value })}
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
            onChange={e => set({ runtimeSeconds: parseInt(e.target.value) || 0 })}
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
            onChange={e => set({ completionThresholdPercent: Math.min(100, Math.max(1, parseInt(e.target.value) || 90)) })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Learner must watch this % before completion is allowed.</p>
        </div>
      </div>

      {/* Transcript */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Transcript <span className="text-red-500">*</span>
          <span className="text-slate-400 font-normal ml-1">— required for accessibility and publish</span>
        </label>
        <textarea
          value={video.transcript}
          onChange={e => set({ transcript: e.target.value })}
          rows={8}
          placeholder="Full transcript of the video narration. Required for accessibility compliance and publish gate."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y font-mono"
        />
        <p className="text-xs text-slate-400 mt-1">{video.transcript.length} characters</p>
      </div>
    </div>
  );
}
