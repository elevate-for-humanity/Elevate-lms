import { AbsoluteFill, Composition } from 'remotion';
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
function CanonicalElevateLesson(props: ElevateLessonProps & Record<string, unknown>) {
  const instructorImageSrc = props.instructorImageSrc?.startsWith('/')
    ? CANONICAL_INSTRUCTOR_IMAGE_URL
    : props.instructorImageSrc;
  return <ElevateLesson {...props} instructorImageSrc={instructorImageSrc} />;
}

/**
 * Keep a governed completion surface behind SlideLesson for the entire encoded
 * composition. The renderer reserves a five-second branded intro/outro budget.
 * After the delivery frame rate moved from 15fps to 30fps, legacy intro/outro
 * frame constants can leave the final 75 frames transparent. H.264 renders
 * transparency as black, which correctly fails the media quality gate. This
 * backing surface makes that reserved completion time intentional and visible
 * instead of learner-facing black footage while the scene composition remains
 * the canonical authority for lesson content, narration, captions, and motion.
 */
function CanonicalSlideLesson(props: SlideLessonProps & Record<string, unknown>) {
  return (
    <AbsoluteFill style={{ background: '#f8fafc' }}>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '0 120px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: props.primaryColor,
          }}
        />
        <div
          style={{
            color: props.accentColor,
            fontSize: 20,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 24,
          }}
        >
          Lesson Complete
        </div>
        <div
          style={{
            color: '#0f172a',
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1.2,
            maxWidth: 1100,
          }}
        >
          {props.lessonTitle}
        </div>
        <div
          style={{
            marginTop: 34,
            padding: '16px 28px',
            borderRadius: 16,
            border: `1px solid ${props.accentColor}55`,
            background: `${props.accentColor}22`,
            color: '#0f172a',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Complete the knowledge check to continue
        </div>
      </AbsoluteFill>
      <SlideLesson {...props} />
    </AbsoluteFill>
  );
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
  openingImageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
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
        component={CanonicalSlideLesson}
        durationInFrames={slideTotalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={slideLessonDefaultProps as SlideLessonProps & Record<string, unknown>}
        calculateMetadata={({ props }) => ({
          durationInFrames: calcSlideLessonFrames(props.scenes),
        })}
      />
    </>
  );
}