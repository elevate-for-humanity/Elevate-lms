'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

const POSTER = '/images/pages/workone-partner-packet-page-1.jpg';
// External signed URL — treated as optional enhancement; poster renders on error
const VIDEO_SRC =
  'https://cms-artifacts.artlist.io/content/generated-video-v1/video__2/generated-video-acfed647-8bb1-44ed-8505-876b1d573896.mp4?Expires=2083808563&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=BO~IkvikD0UAyMYmWQoBNskXM7I8fMAXUJW3T-zgJh1jg78q3LhNDpFOLhVcCpTBW1Rscp0c0YXEi-CQ29NDjSUKoclWTKq4q-bPLNxXgOpKLYxr5B5X3LzzDQQYnq5ilkgAvEZ~VzT3P8HEixv9WPRLFnAd5V3f~829SadfMPddUPxQZDZc29hrBn-Kxv-EKfugudcZ3depV1X-T1F5UxzvRMqFCXxjfT658RlSt0IupI0LxtywFYkChqJQmH6A~2JBncMUPerBqqt0Gdyp4ettIltCFvBX70ai6784jneJJrWcBJ0l7GyJPx1WBPAqjAdnCeJwyPC2Spp3~u93pQ__';

export default function WorkOneHeroVideo() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = wrapperRef.current?.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
    setMuted(video.muted);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden bg-slate-900"
    >
      <CanonicalVideo
        src={VIDEO_SRC}
        poster={POSTER}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlayOnMount
      />

      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
      >
        {muted ? (
          <>
            <VolumeX className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Tap to hear</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
            <span className="hidden sm:inline">Mute</span>
          </>
        )}
      </button>
    </div>
  );
}
