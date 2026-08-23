import { Composition } from 'remotion';
import { ElevateLesson, type ElevateLessonProps } from './compositions/ElevateLesson';
import {
  SlideLesson,
  calcSlideLessonFrames,
  type SlideLessonProps,
} from './compositions/SlideLesson';

const CANONICAL_INSTRUCTOR_IMAGE_URL =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/instructors/marcus-johnson.jpg';

/**
 * Runtime render props historically supplied root-relative instructor images.
 * Remotion renders on an ephemeral localhost origin, so those URLs resolve to
 * localhost rather than the bundled/public asset and Chromium rejects them.
 * Normalize only local instructor references at the composition boundary to
 * Elevate's canonical public instructor asset. Remote/custom references remain
 * untouched.
 */
function CanonicalElevateLesson(props: ElevateLessonProps) {
  const instructorImageSrc = props.instructorImageSrc?.startsWith('/')
    ? CANONICAL_INSTRUCTOR_IMAGE_URL
    : props.instructorImageSrc;
  return <ElevateLesson {...props} instructorImageSrc={instructorImageSrc} />;
}

// Default props for Remotion Studio preview
const defaultProps: ElevateLessonProps = {
  title: 'What Is Peer Recovery Support?',
  moduleTitle: 'Foundations of Peer Recovery',
  objective: 'Define peer recovery support and explain the role of a Peer Recovery Specialist.',
  keyPoints: [
    'Peer support is rooted in shared lived experience and mutual respect.',
    'A PRS uses their own recovery journey to support others.',
    'Recovery looks different for everyone — your role is to support their chosen path.',
    'The four dimensions of recovery: Health, Home, Purpose, Community.',
    'Confidentiality is the cornerstone of trust in peer support.',
  ],
  example:
    'Marcus had been in recovery for two years when he met James, who had just been discharged from treatment. Instead of giving advice, Marcus simply said: "I\'ve been where you are. What do you need right now?" That question changed everything.',
  summary:
    'Peer recovery support is a powerful, evidence-based practice built on lived experience, mutual respect, and the belief that recovery is possible for everyone.',
  quizTeaser: 'Ready to test your knowledge? Complete the checkpoint quiz to continue.',
  audioSrc: 'https://example.com/audio.mp3',
  backgroundImageSrc: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
  instructorName: 'Marcus Johnson',
  instructorTitle: 'Workforce Development Specialist',
  instructorImageSrc: CANONICAL_INSTRUCTOR_IMAGE_URL,
  topBarColor: '#f97316',
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  segmentFrames: [150, 180, 180, 150, 150],
};

// Default props for SlideLesson Studio preview
const slideLessonDefaultProps: SlideLessonProps = {
  courseTitle: 'Peer Recovery Specialist',
  lessonTitle: 'Ethics in Peer Recovery',
  primaryColor: '#f97316',
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  logoText: 'Elevate LMS',
  scenes: [
    {
      scene_number: 1,
      title: 'What Ethics Means',
      bullets: [
        'Ethics guide how we support others',
        'Respect, honesty, and clear boundaries',
        'Your role is to support — not direct',
      ],
      narration:
        'Ethics guide how peer recovery specialists support others with respect, honesty, and boundaries.',
      clip_keyword: 'support group',
      clipUrl: null,
      imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
      audioSrc: null,
      durationFrames: 240,
    },
    {
      scene_number: 2,
      title: 'Key Principles',
      bullets: [
        'Respect for autonomy',
        'Confidentiality always',
        'Professional boundaries',
        'Non-judgmental presence',
      ],
      narration:
        'Respect, confidentiality, boundaries, and professional conduct are the pillars of ethical peer support.',
      clip_keyword: 'professional meeting',
      clipUrl: null,
      imageUrl: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
      audioSrc: null,
      durationFrames: 300,
    },
  ],
};

export function RemotionRoot() {
  const totalFrames = defaultProps.segmentFrames.reduce((a, b) => a + b, 0);
  const slideTotalFrames = calcSlideLessonFrames(slideLessonDefaultProps.scenes);

  return (
    <>
      <Composition
        id="ElevateLesson"
        component={CanonicalElevateLesson}
        durationInFrames={totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps as ElevateLessonProps & Record<string, unknown>}
      />
      <Composition
        id="SlideLesson"
        component={SlideLesson}
        durationInFrames={slideTotalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={slideLessonDefaultProps as SlideLessonProps & Record<string, unknown>}
      />
    </>
  );
}
