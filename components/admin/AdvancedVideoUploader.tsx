'use client';

import { useState } from 'react';
import { Upload, AlertCircle, Loader2, FileVideo, CheckCircle2 } from 'lucide-react';

type VideoRecord = {
  id: string;
  title: string;
  url: string;
  created_at?: string | null;
  duration_minutes?: number | null;
};

type Props = {
  embedded?: boolean;
  initialVideos?: VideoRecord[];
  onVideoAttached?: (videoUrl: string) => void;
};

type EnhanceVideoResponse = {
  success?: boolean;
  url?: string;
  videoUrl?: string;
  outputUrl?: string;
  error?: string;
};

export default function AdvancedVideoUploader({
  embedded = false,
  initialVideos = [],
  onVideoAttached,
}: Props) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!videoFile) {
      setError('Select a video file first.');
      return;
    }

    setProcessing(true);
    setProgress(15);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (voiceoverText.trim()) formData.append('voiceoverText', voiceoverText.trim());
      formData.append('musicVolume', '0.3');
      formData.append('voiceoverVolume', '1');

      const response = await fetch('/api/media/enhance-video-full', {
        method: 'POST',
        body: formData,
      });
      setProgress(75);
      const payload = (await response.json().catch(() => ({}))) as EnhanceVideoResponse;
      if (!response.ok) throw new Error(payload.error || 'Video processing failed.');

      const url = payload.url || payload.videoUrl || payload.outputUrl;
      if (!url) throw new Error('The processor finished without returning a video URL.');

      setProgress(100);
      setResultUrl(url);
      onVideoAttached?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section className={embedded ? 'space-y-5' : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'}>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
          <FileVideo className="h-5 w-5 text-violet-700" /> Video Builder
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Upload a source video, add optional narration, process it, then attach the finished media to the course or marketing workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Source video</span>
          <input
            type="file"
            accept="video/*"
            className="mt-3 block w-full text-sm"
            onChange={(event) => setVideoFile(event.currentTarget.files?.[0] ?? null)}
          />
          {videoFile && <span className="mt-2 block text-xs font-semibold text-emerald-700">{videoFile.name}</span>}
        </label>

        <label className="text-sm font-bold text-slate-700">
          Optional natural voiceover script
          <textarea
            value={voiceoverText}
            onChange={(event) => setVoiceoverText(event.currentTarget.value)}
            rows={6}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900"
            placeholder="Explain the product, lesson, or offer in a natural voice…"
          />
        </label>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleProcess()}
          disabled={processing || !videoFile}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileVideo className="h-4 w-4" />}
          {processing ? 'Processing…' : 'Process Video'}
        </button>
        {processing && <span className="text-xs font-bold text-slate-500">{progress}%</span>}
        {resultUrl && (
          <a href={resultUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Open finished video
          </a>
        )}
      </div>

      {initialVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-slate-900">Available videos</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {initialVideos.map((video) => (
              <button
                type="button"
                key={video.id}
                onClick={() => onVideoAttached?.(video.url)}
                className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
              >
                <div className="text-sm font-black text-slate-900">{video.title}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {video.duration_minutes != null ? `${video.duration_minutes} min` : 'Video'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export { AdvancedVideoUploader };
