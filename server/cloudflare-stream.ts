/**
 * Cloudflare Stream Integration
 * Upload and manage videos using Cloudflare Stream
 * https://developers.cloudflare.com/stream/
 */

import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

export interface CloudflareStreamConfig {
  accountId: string;
  apiToken: string;
}

export interface StreamVideo {
  uid: string;
  thumbnail: string;
  thumbnailTimestampPct: number;
  readyToStream: boolean;
  status: {
    state: 'queued' | 'inprogress' | 'ready' | 'error';
    pctComplete: string;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  meta: {
    name?: string;
    title?: string;
    duration?: number;
    format?: string;
    resolution?: string;
    userId?: string;
  };
  created: string;
  modified: string;
  size: number;
  preview: string;
  allowedOrigins: string[];
  requireSignedURLs: boolean;
  uploaded: string;
  uploadExpiry: string | null;
  maxSizeBytes: number;
  maxDurationSeconds: number;
  duration: number;
  input: {
    width: number;
    height: number;
  };
  playback: {
    hls: string;
    dash: string;
  };
  watermark?: {
    uid: string;
  };
}

export interface StreamUploadResponse {
  result: StreamVideo;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

export interface StreamListResponse {
  result: StreamVideo[];
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  total: number;
}

/**
 * Cloudflare Stream Service
 */
export class CloudflareStreamService {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(config: CloudflareStreamConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  /**
   * Upload video to Cloudflare Stream
   */
  async uploadVideo(
    videoPath: string,
    metadata: {
      name: string;
      title?: string;
      userId?: string;
      requireSignedURLs?: boolean;
      allowedOrigins?: string[];
      thumbnailTimestampPct?: number;
    },
  ): Promise<StreamVideo> {
    try {
      const fileBuffer = await readFile(videoPath);
      const fileName = path.basename(videoPath);
      const fileBlob = new Blob([fileBuffer]);
      const form = new FormData();
      form.append('file', fileBlob, fileName);

      // Add metadata
      const meta: Record<string, string> = {
        name: metadata.name,
      };
      if (metadata.title) meta.title = metadata.title;
      if (metadata.userId) meta.userId = metadata.userId;

      form.append('meta', JSON.stringify(meta));

      if (metadata.requireSignedURLs !== undefined) {
        form.append('requireSignedURLs', metadata.requireSignedURLs.toString());
      }

      if (metadata.allowedOrigins && metadata.allowedOrigins.length > 0) {
        form.append('allowedOrigins', metadata.allowedOrigins.join(','));
      }

      if (metadata.thumbnailTimestampPct !== undefined) {
        form.append('thumbnailTimestampPct', metadata.thumbnailTimestampPct.toString());
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: form,
      });

      const data = (await response.json()) as StreamUploadResponse;

      if (!data.success) {
        throw new Error(`Upload failed: ${data.errors.map((e) => e.message).join(', ')}`);
      }

      return data.result;
    } catch (error) {
      throw new Error(
        `Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Upload video via URL (Cloudflare will fetch it)
   */
  async uploadVideoFromUrl(
    url: string,
    metadata: {
      name: string;
      title?: string;
      userId?: string;
      requireSignedURLs?: boolean;
      allowedOrigins?: string[];
    },
  ): Promise<StreamVideo> {
    try {
      const meta: Record<string, string> = {
        name: metadata.name,
      };
      if (metadata.title) meta.title = metadata.title;
      if (metadata.userId) meta.userId = metadata.userId;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          meta,
          requireSignedURLs: metadata.requireSignedURLs || false,
          allowedOrigins: metadata.allowedOrigins || [],
        }),
      });

      const data = (await response.json()) as StreamUploadResponse;

      if (!data.success) {
        throw new Error(`Upload failed: ${data.errors.map((e) => e.message).join(', ')}`);
      }

      return data.result;
    } catch (error) {
      throw new Error(
        `URL upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get video details
   */
  async getVideo(videoId: string): Promise<StreamVideo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${videoId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as StreamUploadResponse;

      if (!data.success) {
        return null;
      }

      return data.result;
    } catch (error) {
      console.error('[cloudflare-stream] getVideo failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * List all videos
   */
  async listVideos(options?: {
    limit?: number;
    after?: string;
    before?: string;
    search?: string;
  }): Promise<{ videos: StreamVideo[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.after) params.append('after', options.after);
      if (options?.before) params.append('before', options.before);
      if (options?.search) params.append('search', options.search);

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as StreamListResponse;

      if (!data.success) {
        throw new Error(`List failed: ${data.errors.map((e) => e.message).join(', ')}`);
      }

      return {
        videos: data.result,
        total: data.total,
      };
    } catch (error) {
      console.error('[cloudflare-stream] listVideos failed:', error instanceof Error ? error.message : error);
      return { videos: [], total: 0 };
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as { success: boolean };

      if (!data.success) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('[cloudflare-stream] deleteVideo failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Update video metadata
   */
  async updateVideoMetadata(
    videoId: string,
    metadata: {
      name?: string;
      requireSignedURLs?: boolean;
      allowedOrigins?: string[];
      thumbnailTimestampPct?: number;
      meta?: Record<string, string>;
    },
  ): Promise<StreamVideo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${videoId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      const data = (await response.json()) as StreamUploadResponse;

      if (!data.success) {
        throw new Error(`Update failed: ${data.errors.map((e) => e.message).join(', ')}`);
      }

      return data.result;
    } catch (error) {
      console.error('[cloudflare-stream] updateVideoMetadata failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Get video embed code
   */
  getEmbedCode(
    videoId: string,
    options?: {
      autoplay?: boolean;
      loop?: boolean;
      muted?: boolean;
      preload?: 'auto' | 'metadata' | 'none';
      controls?: boolean;
    },
  ): string {
    const params = new URLSearchParams();
    if (options?.autoplay) params.append('autoplay', 'true');
    if (options?.loop) params.append('loop', 'true');
    if (options?.muted) params.append('muted', 'true');
    if (options?.preload) params.append('preload', options.preload);
    if (options?.controls === false) params.append('controls', 'false');

    const queryString = params.toString() ? `?${params.toString()}` : '';

    return `<stream src="${videoId}"${queryString}></stream>
<script data-cfasync="false" defer type="text/javascript" src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>`;
  }

  /**
   * Get video iframe embed
   */
  getIframeEmbed(
    videoId: string,
    options?: {
      autoplay?: boolean;
      loop?: boolean;
      muted?: boolean;
      preload?: 'auto' | 'metadata' | 'none';
      controls?: boolean;
    },
  ): string {
    const params = new URLSearchParams();
    if (options?.autoplay) params.append('autoplay', 'true');
    if (options?.loop) params.append('loop', 'true');
    if (options?.muted) params.append('muted', 'true');
    if (options?.preload) params.append('preload', options.preload);
    if (options?.controls === false) params.append('controls', 'false');

    const queryString = params.toString() ? `?${params.toString()}` : '';

    return `<iframe
  src="https://customer-${this.accountId.substring(0, 32)}.cloudflarestream.com/${videoId}/iframe${queryString}"
  style="border: none;"
  height="720"
  width="1280"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>`;
  }

  /**
   * Get direct video URL (HLS)
   */
  getVideoUrl(videoId: string): string {
    return `https://customer-${this.accountId.substring(0, 32)}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(
    videoId: string,
    options?: {
      time?: string; // e.g., "1s", "50%"
      width?: number;
      height?: number;
      fit?: 'crop' | 'clip' | 'scale';
    },
  ): string {
    const params = new URLSearchParams();
    if (options?.time) params.append('time', options.time);
    if (options?.width) params.append('width', options.width.toString());
    if (options?.height) params.append('height', options.height.toString());
    if (options?.fit) params.append('fit', options.fit);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    return `https://customer-${this.accountId.substring(0, 32)}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg${queryString}`;
  }

  /**
   * Generate signed URL for private videos
   */
  async generateSignedUrl(videoId: string, expiresIn: number = 3600): Promise<string> {
    // Note: Signed URLs require additional setup with Cloudflare Stream
    // This is a placeholder - actual implementation requires token generation
    const expiry = Math.floor(Date.now() / 1000) + expiresIn;
    return `https://customer-${this.accountId.substring(0, 32)}.cloudflarestream.com/${videoId}/manifest/video.m3u8?exp=${expiry}`;
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/analytics/views?videoUID=${videoId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = (await response.json()) as { result?: any };
      return data.result;
    } catch (error) {
      console.error('[cloudflare-stream] getVideoAnalytics failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Check if video is ready to stream
   */
  async isVideoReady(videoId: string): Promise<boolean> {
    const video = await this.getVideo(videoId);
    return video?.readyToStream || false;
  }

  /**
   * Wait for video to be ready
   */
  async waitForVideoReady(
    videoId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000, // 5 seconds
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const isReady = await this.isVideoReady(videoId);

      if (isReady) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return false;
  }
}

/**
 * Create Cloudflare Stream service instance
 */
export function createCloudflareStream(): CloudflareStreamService | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return null;
  }

  return new CloudflareStreamService({ accountId, apiToken });
}

// Default instance
export const cloudflareStream = createCloudflareStream();
