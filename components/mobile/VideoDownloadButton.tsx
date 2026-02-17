"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import {
  OfflineVideoManager,
  DownloadProgress,
} from '@/lib/video/offline-video';

interface VideoDownloadButtonProps {
  videoId: string;
  lessonId: string;
  videoUrl: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoDownloadButton({
  videoId,
  lessonId,
  videoUrl,
  size = 'md',
}: VideoDownloadButtonProps) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDownloadStatus();
  }, [videoId]);

  const checkDownloadStatus = async () => {
    const manager = OfflineVideoManager.getInstance();
    const available = await manager.isVideoAvailableOffline(videoId);
    setIsDownloaded(available);
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setError(null);

    const manager = OfflineVideoManager.getInstance();

    const onProgress = (prog: DownloadProgress) => {
      setProgress(Math.round(prog.percent));
    };

    const success = await manager.downloadVideo(
      videoId,
      lessonId,
      videoUrl,
      onProgress
    );

    if (success) {
      setIsDownloaded(true);
    } else {
      setError('Download failed');
    }

    setIsDownloading(false);
    setProgress(0);
  };

  const handleDelete = async () => {
    const manager = OfflineVideoManager.getInstance();
    const success = await manager.deleteOfflineVideo(videoId);

    if (success) {
      setIsDownloaded(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (isDownloaded) {
    return (
      <button
        onClick={handleDelete}
        className={`${sizeClasses[size]} rounded-lg bg-brand-green-100 text-brand-green-600 hover:bg-brand-green-200 active:scale-95 transition-all relative`}
        title="Delete offline video"
      >
        <Check size={iconSizes[size]} />
      </button>
    );
  }

  if (isDownloading) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-brand-blue-100 text-brand-orange-600 relative`}
      >
        <Loader2 size={iconSizes[size]} className="animate-spin" />
        {progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{progress}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={`${sizeClasses[size]} rounded-lg bg-gray-100 text-black hover:bg-gray-200 active:scale-95 transition-all`}
      title="Download for offline viewing"
    >
      <Download size={iconSizes[size]} />
    </button>
  );
}
