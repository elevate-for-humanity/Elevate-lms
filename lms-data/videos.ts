import { VIDEO_REGISTRY } from '@/lib/video/registry';

export interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  transcriptUrl?: string;
  transcriptText?: string;
  duration: string; // ISO 8601 duration format
  uploadDate: string; // ISO 8601 date
  category: string;
}

/**
 * LMS video discovery is an adapter over the canonical platform video registry.
 * Do not maintain a second set of MP4/poster URLs here: that previously allowed
 * the LMS library to drift back to missing /videos/*.mp4 assets while Marketing
 * was already using the CDN-backed canonical records.
 */
export const videos: VideoData[] = Object.values(VIDEO_REGISTRY)
  .filter((video) => video.status === 'live')
  .map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    videoUrl: video.video_url,
    thumbnailUrl: video.thumbnail_url,
    transcriptUrl: video.transcript_url,
    transcriptText: video.transcript_text,
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
