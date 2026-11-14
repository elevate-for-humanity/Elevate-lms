/**
 * remotion/compositions/ElevateLesson.tsx
 *
 * Remotion composition for Elevate LMS lesson videos.
 * Five segments timed to the audio track:
 *   0  – intro      (title card + instructor name)
 *   1  – concept    (lesson objective + key point 1-2)
 *   2  – visual     (background image + key point 3-4)
 *   3  – application (real-world example)
 *   4  – wrapup     (summary + quiz teaser)
 *
 * Props are injected by remotion-render.ts at render time.
 */

import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ElevateLessonProps {
  title: string;
  moduleTitle: string;
  objective: string;
  keyPoints: string[]; // 3–5 bullet points
  example: string; // real-world example text
  summary: string; // 1-2 sentence wrap-up
  quizTeaser?: string; // "Test your knowledge: ..." optional
  audioSrc: string; // absolute path or data URI to MP3
  backgroundImageSrc?: string; // Pexels image URL or local path
  instructorName: string;
  instructorTitle: string;
  instructorImageSrc?: string;
  // Brand
  topBarColor: string; // e.g. '#f97316'
  accentColor: string; // e.g. '#3b82f6'
  backgroundColor: string; // e.g. '#0f172a'
  // Segment durations in frames (30fps)
  segmentFrames: [number, number, number, number, number];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fadeIn(frame: number, fps: number, delay = 0, duration = 20) {
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function slideUp(frame: number, fps: number, delay = 0) {
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
  return interpolate(progress, [0, 1], [40, 0]);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopBar({ color, title }: { color: string; title: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        background: color,
      }}
    />
  );
}

function Logo({ accentColor }: { accentColor: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 18,
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        E
      </div>
      <span
        style={{
          color: '#0f172a',
          fontWeight: 700,
          fontSize: 18,
          fontFamily: 'sans-serif',
          opacity: 0.9,
        }}
      >
        Elevate LMS
      </span>
    </div>
  );
}

function ModuleTag({ text, accentColor }: { text: string; accentColor: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 48,
        background: accentColor + '33',
        border: `1px solid ${accentColor}66`,
        borderRadius: 20,
        padding: '6px 16px',
        color: accentColor,
        fontSize: 14,
        fontFamily: 'sans-serif',
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );
}

// ── Segment 0: Intro ──────────────────────────────────────────────────────────

function IntroSegment({
  props,
  frame,
  fps,
}: {
  props: ElevateLessonProps;
  frame: number;
  fps: number;
}) {
  const titleOpacity = fadeIn(frame, fps, 10, 25);
  const titleY = slideUp(frame, fps, 10);
  const subOpacity = fadeIn(frame, fps, 25, 20);
  const instructorOpacity = fadeIn(frame, fps, 40, 20);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #fff7ed 0%, #fef3c7 44%, #cffafe 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TopBar color={props.topBarColor} title={props.title} />
      <Logo accentColor={props.accentColor} />
      <ModuleTag text={props.moduleTitle} accentColor={props.accentColor} />

      {/* Center content */}
      <div style={{ textAlign: 'center', padding: '0 120px', maxWidth: 1200 }}>
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontSize: 64,
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: 'sans-serif',
            lineHeight: 1.15,
            marginBottom: 24,
          }}
        >
          {props.title}
        </div>
        <div
          style={{
            opacity: subOpacity,
            fontSize: 26,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          {props.objective}
        </div>
      </div>

      {/* Instructor strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: instructorOpacity,
        }}
      >
        {props.instructorImageSrc && (
          <Img
            src={props.instructorImageSrc}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${props.topBarColor}`,
              objectFit: 'cover',
            }}
          />
        )}
        <div>
          <div
            style={{ color: '#0f172a', fontWeight: 700, fontSize: 18, fontFamily: 'sans-serif' }}
          >
            {props.instructorName}
          </div>
          <div style={{ color: '#475569', fontSize: 14, fontFamily: 'sans-serif' }}>
            {props.instructorTitle}
          </div>
        </div>
      </div>

      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${props.accentColor}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
}

// ── Segment 1: Concept ────────────────────────────────────────────────────────

function ConceptSegment({
  props,
  frame,
  fps,
}: {
  props: ElevateLessonProps;
  frame: number;
  fps: number;
}) {
  const points = props.keyPoints.slice(0, 2);
  return (
    <AbsoluteFill
      style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #f5f3ff 50%, #fff7ed 100%)' }}
    >
      <TopBar color={props.topBarColor} title={props.title} />
      <Logo accentColor={props.accentColor} />

      <div
        style={{ padding: '100px 80px 60px', display: 'flex', flexDirection: 'column', gap: 32 }}
      >
        <div
          style={{
            opacity: fadeIn(frame, fps, 5, 20),
            fontSize: 20,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Key Concepts
        </div>

        {points.map((point, i) => (
          <div
            key={i}
            style={{
              opacity: fadeIn(frame, fps, 15 + i * 20, 20),
              transform: `translateY(${slideUp(frame, fps, 15 + i * 20)}px)`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              background: '#ffffffee',
              borderRadius: 16,
              padding: '28px 32px',
              borderLeft: `4px solid ${props.topBarColor}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: props.topBarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 18,
                fontFamily: 'sans-serif',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{ color: '#0f172a', fontSize: 26, fontFamily: 'sans-serif', lineHeight: 1.5 }}
            >
              {point}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ── Segment 2: Visual ─────────────────────────────────────────────────────────

function VisualSegment({
  props,
  frame,
  fps,
}: {
  props: ElevateLessonProps;
  frame: number;
  fps: number;
}) {
  const points = props.keyPoints.slice(2);
  return (
    <AbsoluteFill style={{ background: '#f8fafc' }}>
      {/* Background image with overlay */}
      {props.backgroundImageSrc && (
        <>
          <Img
            src={props.backgroundImageSrc}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.48,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #ffffffed 0%, #ffffffb8 55%, #fff7ed9e 100%)',
            }}
          />
        </>
      )}

      <TopBar color={props.topBarColor} title={props.title} />
      <Logo accentColor={props.accentColor} />

      <div
        style={{
          position: 'relative',
          padding: '100px 80px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <div
          style={{
            opacity: fadeIn(frame, fps, 5, 20),
            fontSize: 20,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Continued
        </div>

        {points.map((point, i) => (
          <div
            key={i}
            style={{
              opacity: fadeIn(frame, fps, 15 + i * 20, 20),
              transform: `translateY(${slideUp(frame, fps, 15 + i * 20)}px)`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              background: '#fffffff0',
              borderRadius: 16,
              padding: '28px 32px',
              borderLeft: `4px solid ${props.accentColor}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: props.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 18,
                fontFamily: 'sans-serif',
                flexShrink: 0,
              }}
            >
              {i + 3}
            </div>
            <div
              style={{ color: '#0f172a', fontSize: 26, fontFamily: 'sans-serif', lineHeight: 1.5 }}
            >
              {point}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ── Segment 3: Application ────────────────────────────────────────────────────

function ApplicationSegment({
  props,
  frame,
  fps,
}: {
  props: ElevateLessonProps;
  frame: number;
  fps: number;
}) {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 48%, #ccfbf1 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TopBar color={props.topBarColor} title={props.title} />
      <Logo accentColor={props.accentColor} />

      <div style={{ padding: '0 100px', maxWidth: 1400, textAlign: 'center' }}>
        <div
          style={{
            opacity: fadeIn(frame, fps, 5, 20),
            fontSize: 20,
            color: props.topBarColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 32,
          }}
        >
          Real-World Application
        </div>

        <div
          style={{
            opacity: fadeIn(frame, fps, 15, 25),
            transform: `translateY(${slideUp(frame, fps, 15)}px)`,
            background: '#ffffffee',
            borderRadius: 24,
            padding: '48px 56px',
            borderTop: `4px solid ${props.topBarColor}`,
          }}
        >
          {/* Quote mark */}
          <div
            style={{
              fontSize: 80,
              color: props.topBarColor,
              fontFamily: 'Georgia, serif',
              lineHeight: 0.5,
              marginBottom: 24,
              opacity: 0.6,
            }}
          >
            "
          </div>
          <div
            style={{
              color: '#1e293b',
              fontSize: 28,
              fontFamily: 'sans-serif',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {props.example}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Segment 4: Wrap-up ────────────────────────────────────────────────────────

function WrapupSegment({
  props,
  frame,
  fps,
}: {
  props: ElevateLessonProps;
  frame: number;
  fps: number;
}) {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #ede9fe 0%, #cffafe 50%, #fff7ed 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TopBar color={props.topBarColor} title={props.title} />
      <Logo accentColor={props.accentColor} />

      <div style={{ padding: '0 100px', maxWidth: 1200, textAlign: 'center' }}>
        <div
          style={{
            opacity: fadeIn(frame, fps, 5, 20),
            fontSize: 20,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 32,
          }}
        >
          Summary
        </div>

        <div
          style={{
            opacity: fadeIn(frame, fps, 15, 25),
            transform: `translateY(${slideUp(frame, fps, 15)}px)`,
            color: '#0f172a',
            fontSize: 36,
            fontFamily: 'sans-serif',
            lineHeight: 1.5,
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          {props.summary}
        </div>

        {props.quizTeaser && (
          <div
            style={{
              opacity: fadeIn(frame, fps, 40, 20),
              background: props.accentColor + '22',
              border: `1px solid ${props.accentColor}55`,
              borderRadius: 16,
              padding: '20px 32px',
              color: props.accentColor,
              fontSize: 22,
              fontFamily: 'sans-serif',
            }}
          >
            🎯 {props.quizTeaser}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${props.topBarColor}, ${props.accentColor})`,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Main composition ──────────────────────────────────────────────────────────

export function ElevateLesson(props: ElevateLessonProps & Record<string, unknown>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [s0, s1, s2, s3, s4] = props.segmentFrames;
  const starts = [0, s0, s0 + s1, s0 + s1 + s2, s0 + s1 + s2 + s3];

  function segmentFrame(segIndex: number) {
    return frame - starts[segIndex];
  }

  function activeSegment() {
    if (frame < starts[1]) return 0;
    if (frame < starts[2]) return 1;
    if (frame < starts[3]) return 2;
    if (frame < starts[4]) return 3;
    return 4;
  }

  const seg = activeSegment();
  const sf = segmentFrame(seg);

  return (
    <AbsoluteFill>
      {/* Audio track */}
      <Audio src={props.audioSrc} />

      {/* Segments */}
      {seg === 0 && <IntroSegment props={props} frame={sf} fps={fps} />}
      {seg === 1 && <ConceptSegment props={props} frame={sf} fps={fps} />}
      {seg === 2 && <VisualSegment props={props} frame={sf} fps={fps} />}
      {seg === 3 && <ApplicationSegment props={props} frame={sf} fps={fps} />}
      {seg === 4 && <WrapupSegment props={props} frame={sf} fps={fps} />}
    </AbsoluteFill>
  );
}
