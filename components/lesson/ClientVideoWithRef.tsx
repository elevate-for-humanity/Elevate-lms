'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { UltraVideoPlayer } from '@/components/video';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';

type Props = {
  src?: string;
  poster?: string;
  lessonId: string;
  courseId?: string;
  title?: string;
};

export interface ClientVideoRef {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

const ClientVideoWithRef = forwardRef<ClientVideoRef, Props>(
  ({ src, poster, lessonId, courseId, title }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => (videoRef.current ? videoRef.current.currentTime || 0 : 0),
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, seconds);
        }
      },
    }));

    return (
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div>
          <UltraVideoPlayer
            src={src}
            poster={poster}
            lessonId={lessonId}
            courseId={courseId}
            title={title}
            className="w-full"
          />
        </div>
        <LessonSidebar lessonId={lessonId} getCurrentTime={() => 0} seekTo={() => {}} />
      </div>
    );
  }
);

ClientVideoWithRef.displayName = 'ClientVideoWithRef';

export default ClientVideoWithRef;
