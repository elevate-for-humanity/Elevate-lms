export type VoiceName = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'onyx' | 'sage' | 'shimmer';
export type VideoStyle = 'barber_broll' | 'barbershop_lifestyle' | 'tools_closeup' | 'mixed';
export type SceneLayout = 'full_frame' | 'lower_third' | 'split_left_text' | 'split_right_text' | 'top_label';
export type SceneTransition = 'cut' | 'fade' | 'crossfade';

// ── GPT output (draft) ────────────────────────────────────────────────────────

export interface LessonSceneDraft {
  id: string;
  order: number;
  /** What the learner will know or be able to do after this scene */
  instructionalObjective?: string;
  narration: string;
  caption: string;
  subcaption?: string;
  videoQuery: string;
  /** Exactly what should be visible on screen — drives video selection over raw videoQuery */
  visualFocus?: string;
  layout: SceneLayout;
  minClipSeconds?: number;
  maxClipSeconds?: number;
  transitionIn?: SceneTransition;
  transitionOut?: SceneTransition;
}

export interface LessonRenderPlanDraft {
  lessonId: string;
  title: string;
  voice: VoiceName;
  videoStyle: VideoStyle;
  targetResolution: '1920x1080' | '1280x720';
  scenes: LessonSceneDraft[];
}

// ── Pipeline-resolved assets ──────────────────────────────────────────────────

export interface SceneAudioAsset {
  sceneId: string;
  audioPath: string;
  durationSeconds: number;
}

export interface SceneVideoAsset {
  sceneId: string;
  source: 'pexels' | 'local' | 'fallback';
  videoPath: string;
  width: number;
  height: number;
  durationSeconds: number;
  attributionUrl?: string;
  queryUsed: string;
}

export interface SceneTiming {
  sceneId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  audioDurationSeconds: number;
  tailPadSeconds: number;
}

export interface RenderedScenePlan {
  id: string;
  order: number;
  narration: string;
  caption: string;
  subcaption?: string;
  layout: SceneLayout;
  transitionIn: SceneTransition;
  transitionOut: SceneTransition;
  audio: SceneAudioAsset;
  video: SceneVideoAsset;
  timing: SceneTiming;
  outputPath?: string;
}

export interface FinalLessonRenderPlan {
  lessonId: string;
  title: string;
  voice: VoiceName;
  videoStyle: VideoStyle;
  targetWidth: number;
  targetHeight: number;
  scenes: RenderedScenePlan[];
  finalVideoPath?: string;
  totalDurationSeconds: number;
}

// ── Render options ────────────────────────────────────────────────────────────

export interface SceneRenderOptions {
  width: number;
  height: number;
  fps: number;
  fontPath: string;
  headlineFontSize: number;
  subcaptionFontSize: number;
  marginX: number;
  marginBottom: number;
  overlayOpacity: number;
}
