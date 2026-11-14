'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Video, ExternalLink } from 'lucide-react';
import { UltraVideoPlayer } from '@/components/video';

interface DemoVideo {
  section: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

interface DemoVideoPlayerProps {
  planSlug: string;
  title?: string;
  autoLoad?: boolean;
  onVideoLoad?: (videos: DemoVideo[]) => void;
}

export function DemoVideoPlayer({ planSlug, title, autoLoad = true, onVideoLoad }: DemoVideoPlayerProps) {
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoLoad) {
      loadVideos();
    }
  }, [planSlug, autoLoad]);

  const loadVideos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demo/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          sections: ['overview', 'features', 'demo'],
        }),
      });

      if (!response.ok) throw new Error('Failed to load demo videos');

      const data = await response.json();
      setVideos(data.videos || []);
      onVideoLoad?.(data.videos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl">
        <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
        <p className="text-slate-400">Loading demo videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl">
        <Video className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-slate-400 mb-4">Unable to load demo videos</p>
        <button
          onClick={loadVideos}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl">
        <Video className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-slate-400">No demo videos available for this plan</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="space-y-4">
      {/* Title */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-500">
            {currentIndex + 1} of {videos.length}
          </span>
        </div>
      )}

      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <UltraVideoPlayer
          src={currentVideo.videoUrl}
          poster={currentVideo.thumbnail}
          title={currentVideo.section}
          autoPlay={false}
          showControls={true}
        />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {videos.map((video, index) => (
          <button
            key={video.section}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentIndex === index
                ? 'bg-brand-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {video.section.charAt(0).toUpperCase() + video.section.slice(1)}
          </button>
        ))}
      </div>

      {/* Video Info */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Duration: {Math.round(currentVideo.duration)}s</span>
        <a
          href={currentVideo.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Pexels
        </a>
      </div>
    </div>
  );
}
