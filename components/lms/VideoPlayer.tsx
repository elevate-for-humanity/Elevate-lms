"use client";

import React from 'react';
/* eslint-disable no-useless-escape */

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
}

export default function VideoPlayer({
  url,
  title,
  onProgress,
  onComplete,
  autoplay = false,
}: VideoPlayerProps) {
  const [videoType, setVideoType] = useState<
    'youtube' | 'vimeo' | 'direct' | null
  >(null);
  const [videoId, setVideoId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!url) return;

    // Detect video type and extract ID
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setVideoType('youtube');
      const match = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (match) setVideoId(match[1]);
    } else if (url.includes('vimeo.com')) {
      setVideoType('vimeo');
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match) setVideoId(match[1]);
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      setVideoType('direct');
    }
  }, [url]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (onProgress) onProgress(10); // Started watching
  };

  if (!url) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm opacity-75">No video URL provided</p>
        </div>
      </div>
    );
  }

  // YouTube Player
  if (videoType === 'youtube' && videoId) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={handlePlay}
        />
      </div>
    );
  }

  // Vimeo Player
  if (videoType === 'vimeo' && videoId) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&title=0&byline=0&portrait=0`}
          title={title || 'Video'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={handlePlay}
        />
      </div>
    );
  }

  // Direct video file
  if (videoType === 'direct') {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={url}
          controls
          autoPlay={autoplay}
          playsInline
          className="w-full h-full"
          onPlay={handlePlay}
          onEnded={onComplete}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            const percent = (video.currentTime / video.duration) * 100;
            if (onProgress) onProgress(percent);
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback for unrecognized URLs
  return (
    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-center text-white p-6">
        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-sm opacity-75 mb-2">Unsupported video format</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue-400 hover:text-brand-blue-300 text-sm underline"
        >
          Open video in new tab
        </a>
      </div>
    </div>
  );
}
