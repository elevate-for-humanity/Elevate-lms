"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useRef, useState } from "react";
import { sendVideoStatement } from "@/lib/xapi/video";

type EnhancedVideoPlayerProps = {
  videoId: string;
  provider: "vimeo" | "file" | "youtube";
  title: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  learnerId: string;
};

export function EnhancedVideoPlayer(props: EnhancedVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount: send "initialized"
    sendVideoStatement({
      verb: "initialized",
      videoId: props.videoId,
      courseId: props.courseId,
      lessonId: props.lessonId,
      learnerId: props.learnerId,
      title: props.title,
    });

    // Log video view to database
    const logVideoView = async () => {
      const supabase = createClient();
      await supabase.from('video_views').insert({
        video_id: props.videoId,
        user_id: props.learnerId,
        course_id: props.courseId,
        lesson_id: props.lessonId,
        started_at: new Date().toISOString(),
      }).catch(() => {});
    };
    logVideoView();

    setIsLoading(false);
  }, [props.videoId, props.courseId, props.lessonId, props.learnerId, props.title]);

  function handlePlay() {
    if (!started) {
      setStarted(true);
      sendVideoStatement({
        verb: "played",
        videoId: props.videoId,
        courseId: props.courseId,
        lessonId: props.lessonId,
        learnerId: props.learnerId,
        title: props.title,
      });
    }
  }

  function handlePause() {
    sendVideoStatement({
      verb: "paused",
      videoId: props.videoId,
      courseId: props.courseId,
      lessonId: props.lessonId,
      learnerId: props.learnerId,
      title: props.title,
    });
  }

  function handleCompleted() {
    if (!completed) {
      setCompleted(true);
      sendVideoStatement({
        verb: "completed",
        videoId: props.videoId,
        courseId: props.courseId,
        lessonId: props.lessonId,
        learnerId: props.learnerId,
        title: props.title,
      });
    }
  }

  const src =
    props.provider === "vimeo"
      ? `${process.env.NEXT_PUBLIC_VIMEO_BASE_URL ?? "https://player.vimeo.com/video"}/${props.videoId}?autoplay=0&title=0&byline=0&portrait=0`
      : props.provider === "youtube"
      ? `https://www.youtube.com/embed/${props.videoId}?rel=0&modestbranding=1`
      : props.videoId; // direct file URL

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-2xl border bg-black relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-white text-sm">Loading video...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          className="h-full w-full"
          onLoad={handlePlay}
          title={props.title}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500">
        <span className="font-medium text-black">{props.title}</span>
        {completed ? (
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed
          </span>
        ) : (
          <button
            type="button"
            onClick={handleCompleted}
            className="rounded-full border border-green-300 px-3 py-2 text-[11px] font-medium text-green-700 hover:bg-green-50 transition"
          >
            Mark complete
          </button>
        )}
      </div>

      {/* Video Controls Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>💡 Tip: Use keyboard shortcuts - Space to play/pause, ← → to skip</p>
        {props.provider === "vimeo" && (
          <p>🎬 Powered by Vimeo - Professional video hosting with analytics</p>
        )}
      </div>
    </div>
  );
}
