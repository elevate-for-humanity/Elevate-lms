/**
 * remotion/compositions/SlideLesson.tsx
 *
 * Scene-based lesson video composition.
 *
 * Structure per lesson:
 *   BrandedIntro  â course title + lesson title (fixed 1s)
 *   Scene[]       â title card + bullet points over stock clip or image
 *   BrandedOutro  â recap + quiz reminder (fixed 2s)
 *
 * Each scene has:
 *   - Background: Pexels video clip (looped) or fallback image
 *   - Overlay: semi-transparent dark panel
 *   - Title: large heading with slide-up animation
 *   - Bullets: staggered fade-in list
 *   - Caption bar: narration text scrolling at the bottom
 *   - Audio: per-scene MP3 from edge-tts
 */

import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  staticFile,
} from 'remotion';
import { instructionalLayoutForScene, type InstructionalLayout } from '../instructional-layout';

// ââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface SceneData {
  scene_number: number;
  title: string;
  bullets: string[];
  narration: string;
  clip_keyword: string;
  /** Resolved Pexels video URL (or null â use image fallback) */
  clipUrl: string | null;
  /** Resolved Pexels/Pollinations image URL */
  imageUrl: string | null;
  /** Absolute path to per-scene MP3 audio */
  audioSrc: string | null;
  /** Duration in frames at 30fps */
  durationFrames: number;
  sceneType?: string;
  memoryAnchor?: string;
}

export interface SlideLessonProps {
  courseTitle: string;
  lessonTitle: string;
  scenes: SceneData[];
  /** Absolute path to full-lesson MP3 (used when per-scene audio is absent) */
  fullAudioSrc?: string;
  // Brand
  primaryColor: string; // e.g. '#f97316'
  accentColor: string; // e.g. '#3b82f6'
  backgroundColor: string; // e.g. '#0f172a'
  surfaceMode?: 'bright' | 'dark';
  logoText?: string; // defaults to 'Elevate LMS'
}

// ââ Constants âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const INTRO_FRAMES = 30; // One readable second; never open on a blank/blurred card.
const OUTRO_FRAMES = 60;

// ââ Animation helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function fadeIn(frame: number, delay = 0, duration = 20): number {
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function slideUp(frame: number, fps: number, delay = 0): number {
  const p = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 130 } });
  return interpolate(p, [0, 1], [36, 0]);
}

// ââ Brand bar âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function BrandBar({ color, logoText, bright = false }: { color: string; logoText: string; bright?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: color,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 16,
            color: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          E
        </div>
        <span
          style={{
            color: bright ? '#0f172a' : '#fff',
            fontWeight: 700,
            fontSize: 16,
            fontFamily: 'sans-serif',
            opacity: 0.85,
          }}
        >
          {logoText}
        </span>
      </div>
    </div>
  );
}

// ââ Branded Intro âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function BrandedIntro({ props, frame }: { props: SlideLessonProps; frame: number }) {
  const { fps } = useVideoConfig();
  const bright = props.surfaceMode === 'bright';
  return (
    <AbsoluteFill
      style={{
        background: bright
          ? `linear-gradient(135deg, ${props.backgroundColor} 0%, #dbeafe 100%)`
          : `linear-gradient(135deg, ${props.backgroundColor} 0%, #1e293b 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <BrandBar color={props.primaryColor} logoText={props.logoText ?? 'Elevate LMS'} bright={bright} />

      {/* Decorative orb */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${props.accentColor}28 0%, transparent 70%)`,
        }}
      />

      <div style={{ textAlign: 'center', padding: '0 120px', maxWidth: 1200 }}>
        <div
          style={{
            opacity: fadeIn(frame, 0, 1),
            fontSize: 18,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          {props.courseTitle}
        </div>
        <div
          style={{
            opacity: fadeIn(frame, 0, 1),
            transform: `translateY(${slideUp(frame, fps, 0)}px)`,
            fontSize: 60,
            fontWeight: 900,
            color: bright ? '#0f172a' : '#fff',
            fontFamily: 'sans-serif',
            lineHeight: 1.15,
          }}
        >
          {props.lessonTitle}
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${props.primaryColor}, ${props.accentColor})`,
        }}
      />
    </AbsoluteFill>
  );
}

// ââ Caption bar âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function CaptionBar({
  text,
  frame,
  primaryColor,
  bright,
}: {
  text: string;
  frame: number;
  primaryColor: string;
  bright: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: bright ? 'rgba(255,255,255,0.94)' : 'rgba(0,0,0,0.72)',
        borderTop: `2px solid ${primaryColor}55`,
        padding: '14px 60px',
        opacity: fadeIn(frame, 10, 15),
      }}
    >
      <p
        style={{
          color: bright ? '#0f172a' : '#f1f5f9',
          fontSize: 22,
          fontFamily: 'sans-serif',
          lineHeight: 1.5,
          margin: 0,
          textAlign: 'center',
          textShadow: bright ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {text}
      </p>
    </div>
  );
}

function InstructionalGraphic({
  layout,
  frame,
  props,
}: {
  layout: InstructionalLayout;
  frame: number;
  props: SlideLessonProps;
}) {
  const card = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(148,163,184,0.45)',
    borderRadius: 14,
    color: '#0f172a',
    fontFamily: 'sans-serif',
    fontWeight: 800,
    boxShadow: '0 14px 35px rgba(15,23,42,0.16)',
  } as const;

  if (layout.kind === 'comparison' || layout.kind === 'refrigeration-cycle') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${layout.kind === 'refrigeration-cycle' ? 4 : 3}, 1fr)`, gap: 20 }}>
        {layout.columns.map((column, index) => (
          <div key={column.title} style={{ ...card, padding: 28, opacity: fadeIn(frame, 16 + index * 10, 16) }}>
            <div style={{ color: props.primaryColor, fontSize: 28, marginBottom: 12 }}>{column.title}</div>
            <div style={{ fontSize: 22, lineHeight: 1.35, fontWeight: 650 }}>{column.purpose}</div>
          </div>
        ))}
      </div>
    );
  }

  const columns = layout.kind === 'lean-canvas' ? 3 : layout.kind === 'pitch-deck' ? 4 : 3;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
      {layout.items.map((item, index) => (
        <div
          key={item}
          style={{
            ...card,
            padding: layout.kind === 'activity' ? '16px 20px' : '18px 14px',
            minHeight: layout.kind === 'lean-canvas' ? 76 : 62,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: fadeIn(frame, 14 + index * 6, 14),
            transform: `translateY(${Math.max(0, 14 - Math.max(0, frame - index * 6))}px)`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: layout.kind === 'activity' ? 7 : 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: props.primaryColor,
              color: '#fff',
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            {layout.kind === 'activity' ? 'â' : index + 1}
          </div>
          <div style={{ fontSize: layout.kind === 'lean-canvas' ? 17 : 18, lineHeight: 1.2 }}>{item}</div>
        </div>
      ))}
    </div>
  );
}

// ââ Scene slide âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function SceneSlide({
  scene,
  props,
}: {
  scene: SceneData;
  props: SlideLessonProps;
}) {
  const { fps } = useVideoConfig();
  // useCurrentFrame() is local to the surrounding Sequence. Passing the
  // composition frame from SlideLesson caused later scenes to enter with all
  // motion already completed, leaving long frozen stills in rendered lessons.
  const frame = useCurrentFrame();
  const bright = props.surfaceMode === 'bright';
  const instructionalLayout = instructionalLayoutForScene({ title: scene.title, action: scene.narration, sceneType: scene.sceneType });
  const instructionalBackgroundPosition =
    `${50 + Math.sin(frame / (fps * 2)) * 30}% ${50 + Math.cos(frame / (fps * 2.5)) * 20}%`;
  const sceneProgress = interpolate(
    frame,
    [0, Math.max(1, scene.durationFrames - 1)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const mediaTransform = `scale(${1.035 + sceneProgress * 0.055}) translate(${(scene.scene_number % 2 ? 1 : -1) * sceneProgress * 1.4}%, ${sceneProgress * -0.8}%)`;

  return (
    <AbsoluteFill
      style={{
        background: instructionalLayout
          ? 'linear-gradient(120deg, #eef2f7 0%, #dbeafe 45%, #f8fafc 100%)'
          : props.backgroundColor,
        backgroundSize: instructionalLayout ? '200% 200%' : undefined,
        backgroundPosition: instructionalLayout ? instructionalBackgroundPosition : undefined,
        backgroundRepeat: instructionalLayout ? 'no-repeat' : undefined,
        willChange: instructionalLayout ? 'background-position' : undefined,
      }}
    >
      {/* Background: video clip (looped) or image. Exact teaching graphics own the full frame. */}
      {!instructionalLayout && scene.clipUrl ? (
        <OffthreadVideo
          src={scene.clipUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: bright ? 'brightness(1.1) saturate(1.06) contrast(1.02)' : undefined,
            transform: mediaTransform,
            transformOrigin: scene.scene_number % 2 ? '45% 52%' : '55% 48%',
            willChange: 'transform',
          }}
          muted
        />
      ) : scene.imageUrl ? (
        <Img
          src={scene.imageUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: bright ? 'brightness(1.1) saturate(1.06) contrast(1.02)' : undefined,
            transform: mediaTransform,
            transformOrigin: scene.scene_number % 2 ? '45% 52%' : '55% 48%',
            willChange: 'transform',
          }}
        />
      ) : null}

      {/* Directional scrim keeps cinematic footage readable. Instructional graphics use a clean canvas. */}
      {!instructionalLayout && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bright
              ? 'linear-gradient(90deg, rgba(248,250,252,0.94) 0%, rgba(248,250,252,0.72) 58%, rgba(248,250,252,0.32) 100%)'
              : 'linear-gradient(90deg, rgba(15,23,42,0.50) 0%, rgba(15,23,42,0.28) 58%, rgba(15,23,42,0.08) 100%)',
          }}
        />
      )}

      <BrandBar color={props.primaryColor} logoText={props.logoText ?? 'Elevate LMS'} bright={bright || Boolean(instructionalLayout)} />

      {/* Scene number badge */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 48,
          background: props.primaryColor + '33',
          border: `1px solid ${props.primaryColor}66`,
          borderRadius: 20,
          padding: '5px 14px',
          color: props.primaryColor,
          fontSize: 13,
          fontFamily: 'sans-serif',
          fontWeight: 700,
          opacity: fadeIn(frame, 5, 15),
        }}
      >
        Scene {scene.scene_number}
      </div>

      {/* Content panel */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 60,
          right: 60,
          bottom: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* Scene title */}
        <div
          style={{
            opacity: fadeIn(frame, 8, 22),
            transform: `translateY(${slideUp(frame, fps, 8)}px)`,
            fontSize: instructionalLayout ? 42 : 52,
            fontWeight: 900,
            color: instructionalLayout || bright ? '#0f172a' : '#fff',
            fontFamily: 'sans-serif',
            lineHeight: 1.2,
            textShadow: instructionalLayout || bright ? 'none' : '0 2px 12px rgba(0,0,0,0.6)',
            borderLeft: `5px solid ${props.primaryColor}`,
            paddingLeft: 24,
          }}
        >
          {scene.title}
        </div>

        {instructionalLayout ? (
          <InstructionalGraphic layout={instructionalLayout} frame={frame} props={props} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 8 }}>
            {scene.bullets.map((bullet, i) => (
              <div
                key={i}
                style={{
                  opacity: fadeIn(frame, 22 + i * 14, 18),
                  transform: `translateY(${slideUp(frame, fps, 22 + i * 14)}px)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: props.accentColor, flexShrink: 0, marginTop: 10 }} />
                <div style={{ color: bright ? '#0f172a' : '#e2e8f0', fontSize: 28, fontFamily: 'sans-serif', lineHeight: 1.5, textShadow: bright ? 'none' : '0 1px 6px rgba(0,0,0,0.5)' }}>
                  {bullet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-scene audio */}
      {scene.audioSrc && <Audio src={scene.audioSrc} volume={1.35} />}

      {/* Caption bar */}
      <CaptionBar text={scene.narration} frame={frame} primaryColor={props.primaryColor} bright={bright} />
    </AbsoluteFill>
  );
}

// ââ Branded Outro âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function BrandedOutro({ props, frame }: { props: SlideLessonProps; frame: number }) {
  const { fps } = useVideoConfig();
  const bright = props.surfaceMode === 'bright';
  return (
    <AbsoluteFill
      style={{
        background: bright
          ? 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <BrandBar color={props.primaryColor} logoText={props.logoText ?? 'Elevate LMS'} bright={bright} />

      <div style={{ textAlign: 'center', padding: '0 120px', maxWidth: 1100 }}>
        <div
          style={{
            opacity: fadeIn(frame, 8, 20),
            fontSize: 20,
            color: props.accentColor,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 24,
          }}
        >
          Lesson Complete
        </div>
        <div
          style={{
            opacity: fadeIn(frame, 18, 25),
            transform: `translateY(${slideUp(frame, fps, 18)}px)`,
            fontSize: 42,
            fontWeight: 800,
            color: bright ? '#0f172a' : '#fff',
            fontFamily: 'sans-serif',
            lineHeight: 1.3,
            marginBottom: 40,
          }}
        >
          {props.lessonTitle}
        </div>

        {/* Quiz reminder */}
        <div
          style={{
            opacity: fadeIn(frame, 40, 20),
            background: props.accentColor + '22',
            border: `1px solid ${props.accentColor}55`,
            borderRadius: 16,
            padding: '18px 32px',
            color: props.accentColor,
            fontSize: 22,
            fontFamily: 'sans-serif',
          }}
        >
          Complete the knowledge check to continue â
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${props.primaryColor}, ${props.accentColor})`,
        }}
      />
    </AbsoluteFill>
  );
}

// ââ Main composition ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function SlideLesson(props: SlideLessonProps & Record<string, unknown>) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Build sequence offsets
  let offset = 0;
  const sceneOffsets: number[] = [];
  for (const scene of props.scenes) {
    sceneOffsets.push(offset);
    offset += scene.durationFrames;
  }

  return (
    <AbsoluteFill>
      {/* Optional full-lesson audio track (when per-scene audio is absent) */}
      {props.fullAudioSrc && <Audio src={props.fullAudioSrc} volume={1.35} />}

      {/* Branded intro */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <BrandedIntro props={props} frame={frame} />
      </Sequence>

      {/* Scenes */}
      {props.scenes.map((scene, i) => (
        <Sequence
          key={scene.scene_number}
          from={INTRO_FRAMES + sceneOffsets[i]}
          durationInFrames={scene.durationFrames}
        >
          <SceneSlide scene={scene} props={props} />
        </Sequence>
      ))}

      {/* Branded outro */}
      <Sequence from={INTRO_FRAMES + offset} durationInFrames={OUTRO_FRAMES}>
        <BrandedOutro props={props} frame={frame} />
      </Sequence>
    </AbsoluteFill>
  );
}

// ââ Frame calculator ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** Total frames for a SlideLesson composition given its scenes. */
export function calcSlideLessonFrames(scenes: Pick<SceneData, 'durationFrames'>[]): number {
  return INTRO_FRAMES + scenes.reduce((sum, s) => sum + s.durationFrames, 0) + OUTRO_FRAMES;
}
