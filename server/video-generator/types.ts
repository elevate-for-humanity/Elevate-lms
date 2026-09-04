export type VoiceName = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'onyx' | 'sage' | 'shimmer';
export type VideoStyle =
  | 'trade_demonstration'
  | 'clinical_demonstration'
  | 'technical_diagram'
  | 'workplace_scenario'
  | 'mixed';
export type SceneLayout =
  | 'full_frame'
  | 'lower_third'
  | 'split_left_text'
  | 'split_right_text'
  | 'top_label';
export type SceneTransition = 'cut' | 'fade' | 'crossfade';
export type InstructionalSceneType =
  | 'problem_hook'
  | 'mental_model'
  | 'system_diagram'
  | 'equipment_closeup'
  | 'worked_example'
  | 'field_scenario'
  | 'common_mistake'
  | 'safety_warning'
  | 'memory_recap'
  | 'knowledge_check'
  | 'service_setup'
  | 'sanitation_check'
  | 'procedure_step'
  | 'critical_closeup'
  | 'quality_check'
  | 'cleanup_aftercare'
  | 'evidence_capture';

export type SceneAssetRequirement =
  | 'stock_context'
  | 'generated_diagram'
  | 'original_capture'
  | 'licensed_demonstration';

export interface TeachingModel {
  name: string;
  memoryAnchor: string;
  plainLanguageMap: string;
  misconception: string;
  transferQuestion: string;
}

// ── GPT output (draft) ────────────────────────────────────────────────────────

export interface LessonSceneDraft {
  id: string;
  order: number;
  sceneType: InstructionalSceneType;
  /** What the learner will know or be able to do after this scene */
  instructionalObjective: string;
  dolCompetencyId: string;
  stateRequirement: string;
  examDomain: string;
  demonstrationStep: string;
  evidenceExpectation: string;
  narration: string;
  caption: string;
  subcaption?: string;
  videoQuery: string;
  /** Exactly what should be visible on screen — drives video selection over raw videoQuery */
  visualFocus?: string;
  assetRequirement: SceneAssetRequirement;
  /** Stable step number lets the builder emit one reusable microvideo per procedure step. */
  procedureStepNumber?: number;
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
  teachingModel: TeachingModel;
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
