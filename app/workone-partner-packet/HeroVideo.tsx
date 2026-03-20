'use client';

/**
 * WorkOne partner packet hero.
 * Video source is an external signed URL — treated as optional enhancement.
 * Poster is always a local static asset and renders immediately.
 * If the video fails or the URL expires, the poster remains visible.
 */

import CanonicalVideo from '@/components/video/CanonicalVideo';

const POSTER = '/images/pages/workone-partner-packet-page-1.jpg';
const VIDEO_SRC =
  'https://cms-artifacts.artlist.io/content/generated-video-v1/video__2/generated-video-acfed647-8bb1-44ed-8505-876b1d573896.mp4?Expires=2083808563&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=BO~IkvikD0UAyMYmWQoBNskXM7I8fMAXUJW3T-zgJh1jg78q3LhNDpFOLhVcCpTBW1Rscp0c0YXEi-CQ29NDjSUKoclWTKq4q-bPLNxXgOpKLYxr5B5X3LzzDQQYnq5ilkgAvEZ~VzT3P8HEixv9WPRLFnAd5V3f~829SadfMPddUPxQZDZc29hrBn-Kxv-EKfugudcZ3depV1X-T1F5UxzvRMqFCXxjfT658RlSt0IupI0LxtywFYkChqJQmH6A~2JBncMUPerBqqt0Gdyp4ettIltCFvBX70ai6784jneJJrWcBJ0l7GyJPx1WBPAqjAdnCeJwyPC2Spp3~u93pQ__';

export default function WorkOneHeroVideo() {
  return (
    <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden bg-slate-900">
      <CanonicalVideo
        src={VIDEO_SRC}
        poster={POSTER}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
