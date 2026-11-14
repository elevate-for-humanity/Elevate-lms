// Adaptive streaming utilities for mobile video playback

export interface VideoQuality {
  label: string;
  width: number;
  height: number;
  bitrate: number;
  url: string;
}

export class AdaptiveStreamingManager {
  private currentQuality: VideoQuality | null = null;
  private availableQualities: VideoQuality[] = [];
  private autoQuality = true;

  constructor(qualities: VideoQuality[]) {
    this.availableQualities = qualities.sort((a, b) => b.bitrate - a.bitrate);
  }

  /**
   * Select optimal quality based on network conditions
   */
  async selectOptimalQuality(): Promise<VideoQuality> {
    if (!this.autoQuality && this.currentQuality) {
      return this.currentQuality;
    }

    const connection = this.getNetworkInfo();
    const bandwidth = connection.downlink || 10; // Mbps
    const effectiveType = connection.effectiveType || '4g';

    // Select quality based on network speed
    let selectedQuality: VideoQuality;

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      // Low quality for 2G
      selectedQuality = this.availableQualities[this.availableQualities.length - 1];
    } else if (effectiveType === '3g') {
      // Medium quality for 3G
      const midIndex = Math.floor(this.availableQualities.length / 2);
      selectedQuality = this.availableQualities[midIndex];
    } else if (bandwidth < 2) {
      // Low quality for slow connections
      selectedQuality = this.availableQualities[this.availableQualities.length - 1];
    } else if (bandwidth < 5) {
      // Medium quality
      const midIndex = Math.floor(this.availableQualities.length / 2);
      selectedQuality = this.availableQualities[midIndex];
    } else {
      // High quality for fast connections
      selectedQuality = this.availableQualities[0];
    }

    this.currentQuality = selectedQuality;
    return selectedQuality;
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): any {
    const nav = navigator as any;
    return nav.connection || nav.mozConnection || nav.webkitConnection || {};
  }

  /**
   * Monitor network changes and adjust quality
   */
  startNetworkMonitoring(callback: (quality: VideoQuality) => void): () => void {
    const connection = this.getNetworkInfo();

    const handleChange = async () => {
      const newQuality = await this.selectOptimalQuality();
      if (newQuality !== this.currentQuality) {
        callback(newQuality);
      }
    };

    if (connection && 'addEventListener' in connection) {
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }

    return () => {
      // No connection API available - no cleanup needed
    };
  }

  /**
   * Set quality manually
   */
  setQuality(quality: VideoQuality): void {
    this.currentQuality = quality;
    this.autoQuality = false;
  }

  /**
   * Enable auto quality selection
   */
  enableAutoQuality(): void {
    this.autoQuality = true;
  }

  /**
   * Get current quality
   */
  getCurrentQuality(): VideoQuality | null {
    return this.currentQuality;
  }

  /**
   * Get available qualities
   */
  getAvailableQualities(): VideoQuality[] {
    return this.availableQualities;
  }
}

/**
 * Detect if device supports hardware acceleration
 */
export function supportsHardwareAcceleration(): boolean {
  const video = document.createElement('video');
  return !!(
    video.canPlayType &&
    (video.canPlayType('video/mp4; codecs="avc1.42E01E"') ||
      video.canPlayType('video/webm; codecs="vp8, vorbis"'))
  );
}

/**
 * Get optimal video format for device
 */
export function getOptimalVideoFormat(): 'mp4' | 'webm' | 'hls' {
  const video = document.createElement('video');

  // Check for HLS support (iOS Safari)
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    return 'hls';
  }

  // Check for WebM support
  if (video.canPlayType('video/webm; codecs="vp9"')) {
    return 'webm';
  }

  // Default to MP4
  return 'mp4';
}

/**
 * Estimate data usage for video playback
 */
export function estimateDataUsage(
  durationSeconds: number,
  bitrateMbps: number,
): { mb: number; gb: number } {
  const totalMb = (durationSeconds * bitrateMbps) / 8;
  return {
    mb: Math.round(totalMb * 100) / 100,
    gb: Math.round((totalMb / 1024) * 100) / 100,
  };
}

/**
 * Check if device is on metered connection
 */
export function isMeteredConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;

  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  );
}

/**
 * Get recommended buffer size based on network
 */
export function getRecommendedBufferSize(): number {
  const connection = (navigator as any).connection;
  if (!connection) return 30;

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 60; // 60 seconds for slow connections
    case '3g':
      return 45; // 45 seconds for 3G
    case '4g':
    default:
      return 30; // 30 seconds for fast connections
  }
}
