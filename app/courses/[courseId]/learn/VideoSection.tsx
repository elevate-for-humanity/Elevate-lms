"use client";

import React from 'react';
import { useRef } from 'react';
import { useVideoProgress } from '@/hooks/useVideoProgress';

interface VideoSectionProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
}

export default function VideoSection({ videoUrl, lessonId }: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useVideoProgress(videoRef, { lessonId });

  return (
    <div className="bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full aspect-video"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
