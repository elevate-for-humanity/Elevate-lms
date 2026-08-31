'use client';

/** MediaPanel — Studio video upload/attachment workspace. */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { Video } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const VideoManagerClient = dynamic(
  () => import('@/components/admin/AdvancedVideoUploader').then((module) => module.default),
  { ssr: false, loading: () => <PanelSkeleton label="Media" /> },
);

export function MediaPanel() {
  const { state, appendAIMemory } = useCourse();
  const { videos } = state;

  const initialVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    url: video.url ?? video.video_url ?? '',
    created_at: video.created_at,
    duration_minutes: video.duration_seconds != null ? Math.round(video.duration_seconds / 60) : null,
  }));

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Video className="w-5 h-5" />}
        title="Media"
        subtitle={`${videos.length} video${videos.length !== 1 ? 's' : ''} available`}
      />
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
