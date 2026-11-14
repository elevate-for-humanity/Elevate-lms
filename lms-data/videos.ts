import { VIDEO_REGISTRY } from '@/lib/video/registry';

export interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  transcriptUrl?: string;
  transcriptText?: string;
  duration: string;
  uploadDate: string;
  category: string;
}

/**
 * LMS video discovery is an adapter over the canonical production registry.
 * VIDEO_REGISTRY contains production-ready records only; there is no draft
 * catalog or second set of MP4/poster URLs here.
 */
export const videos: VideoData[] = Object.values(VIDEO_REGISTRY).map((video) => ({
  id: video.id,
  title: video.title,
  description: video.description,
  videoUrl: video.video_url,
  thumbnailUrl: video.thumbnail_url,
  ...(video.transcript_url ? { transcriptUrl: video.transcript_url } : {}),
  ...(video.transcript_text ? { transcriptText: video.transcript_text } : {}),
  duration: video.duration,
  uploadDate: video.upload_date,
  category: video.category,
}));

export function getVideoById(id: string): VideoData | undefined {
  return videos.find((video) => video.id === id);
}

export function getVideosByCategory(category: string): VideoData[] {
  return videos.filter((video) => video.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(videos.map((video) => video.category)));
}
