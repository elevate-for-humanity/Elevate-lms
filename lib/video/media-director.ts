import 'server-only';

import crypto from 'node:crypto';

export type MediaOperation =
  | 'textToVideo'
  | 'imageToVideo'
  | 'videoToVideo'
  | 'extend'
  | 'remix'
  | 'loop'
  | 'interpolate';

export type CameraMove =
  | 'locked'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'dolly-in'
  | 'dolly-out'
  | 'truck-left'
  | 'truck-right'
  | 'orbit'
  | 'handheld'
  | 'crane';

export type ShotSize =
  | 'extreme-wide'
  | 'wide'
  | 'medium'
  | 'medium-close'
  | 'close-up'
  | 'extreme-close-up';
export type Transition = 'cut' | 'crossfade' | 'dip-black' | 'match-cut' | 'whip' | 'none';
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
  | 'knowledge_check';

export interface MediaCharacterReference {
  id: string;
  name?: string;
  referenceImageUrl?: string;
  appearancePrompt?: string;
  voiceId?: string;
  consentRecordId?: string;
}

export interface MediaScene {
  id: string;
  order: number;
  durationSeconds: number;
  operation: MediaOperation;
  subject: string;
  environment: string;
  action: string;
  visualStyle: string;
  shotSize: ShotSize;
  cameraMove: CameraMove;
  lighting: string;
  dialogue?: string;
  sound?: string;
  transition: Transition;
  referenceImageUrl?: string;
  sourceVideoUrl?: string;
  characterIds: string[];
  negativePrompt?: string;
  seed?: number;
  /** Persisted evidence of the source selected for this rendered scene. */
  resolvedProvider?: string;
  resolvedModel?: string;
  /** Instructional phase and the exact action the picture must prove. */
  procedurePhase?: string;
  requiredVisualEvidence?: string;
  sceneType?: InstructionalSceneType;
  memoryAnchor?: string;
  mediaSource: 'pexels' | 'elevate-owned' | 'elevate-motion';
  overlayTemplate: string;
  contentHash: string;
  reviewStatus: 'draft' | 'approved' | 'rejected';
}

export interface MediaStoryboard {
  version: '1.0';
  title: string;
  objective: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  width: number;
  height: number;
  fps: number;
  characters: MediaCharacterReference[];
  scenes: MediaScene[];
  promptHash: string;
  captionUrl?: string;
  transcriptUrl?: string;
}

export interface MediaDirectorInput {
  title: string;
  objective?: string;
  script: string;
  sceneData?: Record<string, unknown>;
  characters?: MediaCharacterReference[];
  defaultDurationSeconds?: number;
}

export const MIN_LESSON_VIDEO_SCENES = 6;
export const MAX_LESSON_VIDEO_SCENES = 10;
const DEFAULT_SCRIPT_SCENES = 8;

/** Preserve all ordered narration while converting legacy sentence-per-scene
 * storyboards into bounded instructional segments. */
export function compactLegacySceneData(
  sceneData: Record<string, unknown>,
  maximumScenes = MAX_LESSON_VIDEO_SCENES,
): { sceneData: Record<string, unknown>; compacted: boolean; originalSceneCount: number } {
  const scenes = Array.isArray(sceneData.scenes)
    ? sceneData.scenes.filter((scene): scene is Record<string, unknown> =>
        Boolean(scene && typeof scene === 'object'),
      )
    : [];
  if (scenes.length <= maximumScenes) {
    return { sceneData, compacted: false, originalSceneCount: scenes.length };
  }
  if (!Number.isInteger(maximumScenes) || maximumScenes < 1) {
    throw new Error('MEDIA_SCENE_LIMIT_INVALID');
  }

  const compactedScenes = Array.from({ length: maximumScenes }, (_, index) => {
    const start = Math.floor((index * scenes.length) / maximumScenes);
    const end = Math.floor(((index + 1) * scenes.length) / maximumScenes);
    const group = scenes.slice(start, Math.max(start + 1, end));
    const first = group[0] ?? {};
    const joined = (keys: string[]) =>
      group
        .flatMap((scene) => keys.map((key) => scene[key]))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
        .join(' ');
    const narration = joined(['dialogue', 'narration']);
    const action = joined(['action', 'visual_prompt']);
    const evidence = joined(['required_visual_evidence']);
    return {
      ...first,
      id: `segment-${index + 1}`,
      action: action || narration,
      dialogue: narration || action,
      required_visual_evidence: evidence || action || narration,
      duration_seconds: undefined,
      legacy_scene_range: { start: start + 1, end, count: group.length },
    };
  });

  return {
    sceneData: {
      ...sceneData,
      scenes: compactedScenes,
      segmentation: {
        strategy: 'ordered-contiguous-compaction',
        original_scene_count: scenes.length,
        segment_count: compactedScenes.length,
      },
    },
    compacted: true,
    originalSceneCount: scenes.length,
  };
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function operationValue(value: unknown, hasImage: boolean, hasVideo: boolean): MediaOperation {
  const allowed: MediaOperation[] = [
    'textToVideo',
    'imageToVideo',
    'videoToVideo',
    'extend',
    'remix',
    'loop',
    'interpolate',
  ];
  if (typeof value === 'string' && allowed.includes(value as MediaOperation))
    return value as MediaOperation;
  if (hasVideo) return 'videoToVideo';
  if (hasImage) return 'imageToVideo';
  return 'textToVideo';
}

function shotSizeValue(value: unknown): ShotSize {
  const allowed: ShotSize[] = [
    'extreme-wide',
    'wide',
    'medium',
    'medium-close',
    'close-up',
    'extreme-close-up',
  ];
  return typeof value === 'string' && allowed.includes(value as ShotSize)
    ? (value as ShotSize)
    : 'medium';
}

function cameraValue(value: unknown): CameraMove {
  const allowed: CameraMove[] = [
    'locked',
    'pan-left',
    'pan-right',
    'tilt-up',
    'tilt-down',
    'dolly-in',
    'dolly-out',
    'truck-left',
    'truck-right',
    'orbit',
    'handheld',
    'crane',
  ];
  return typeof value === 'string' && allowed.includes(value as CameraMove)
    ? (value as CameraMove)
    : 'dolly-in';
}

function transitionValue(value: unknown): Transition {
  const allowed: Transition[] = ['cut', 'crossfade', 'dip-black', 'match-cut', 'whip', 'none'];
  return typeof value === 'string' && allowed.includes(value as Transition)
    ? (value as Transition)
    : 'cut';
}

function sceneTypeValue(value: unknown, index: number, total: number): InstructionalSceneType {
  const allowed: InstructionalSceneType[] = [
    'problem_hook',
    'mental_model',
    'system_diagram',
    'equipment_closeup',
    'worked_example',
    'field_scenario',
    'common_mistake',
    'safety_warning',
    'memory_recap',
    'knowledge_check',
  ];
  if (typeof value === 'string' && allowed.includes(value as InstructionalSceneType))
    return value as InstructionalSceneType;
  const arc: InstructionalSceneType[] = [
    'problem_hook',
    'mental_model',
    'system_diagram',
    'equipment_closeup',
    'worked_example',
    'common_mistake',
    'memory_recap',
    'knowledge_check',
  ];
  return (
    arc[Math.min(arc.length - 1, Math.floor((index * arc.length) / Math.max(1, total)))] ??
    'worked_example'
  );
}

function promptHash(input: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function procedurePhase(text: string, index: number, total: number): string {
  const normalized = text.toLowerCase();
  if (/saniti|disinfect|ppe|wash|safety|infection control/.test(normalized)) return 'safety';
  if (/tool|supply|equipment|material/.test(normalized)) return 'tools';
  if (/consult|assess|analy|inspect|prepare|section|drape/.test(normalized)) return 'preparation';
  if (/check|verify|inspect|quality|symmetr|finish/.test(normalized)) return 'quality-check';
  if (/clean|aftercare|record|dispose|recover/.test(normalized)) return 'recovery';
  if (index === 0) return 'orientation';
  if (index === total - 1) return 'quality-check';
  return 'procedure';
}

function scriptScenes(script: string, title: string): Record<string, unknown>[] {
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const sceneCount = Math.min(DEFAULT_SCRIPT_SCENES, Math.max(1, sentences.length));
  const groups = Array.from({ length: sceneCount }, (_, index) => {
    const start = Math.floor((index * sentences.length) / sceneCount);
    const end = Math.floor(((index + 1) * sentences.length) / sceneCount);
    return sentences.slice(start, Math.max(start + 1, end)).join(' ');
  });
  return groups.map((action, index) => {
    const phase = procedurePhase(action, index, groups.length);
    const detail = /angle|position|blade|guard|hand|finger|line|section|tool/i.test(action);
    return {
      action,
      scene_type: sceneTypeValue(undefined, index, groups.length),
      subject: title,
      dialogue: action,
      procedure_phase: phase,
      required_visual_evidence: action,
      shot_size: detail ? 'close-up' : index === 0 ? 'wide' : 'medium-close',
      camera_move: detail ? 'locked' : 'dolly-in',
      transition: 'cut',
    };
  });
}

/**
 * Canonical scene planner used by Course Factory, the standalone media studio,
 * and GPU rendering. Structured scene_data wins; otherwise a deterministic
 * storyboard is produced from the lesson script so every render has explicit
 * camera, motion, continuity, and provenance inputs.
 */
export function directMedia(input: MediaDirectorInput): MediaStoryboard {
  const raw = input.sceneData ?? {};
  const rawScenes = Array.isArray(raw.scenes) ? raw.scenes : [];
  if (rawScenes.length > MAX_LESSON_VIDEO_SCENES) {
    throw new Error(`MEDIA_SCENE_LIMIT_EXCEEDED:${rawScenes.length}:${MAX_LESSON_VIDEO_SCENES}`);
  }
  const characters = Array.isArray(input.characters) ? input.characters : [];
  const defaultDuration = numberValue(
    raw.duration_seconds ?? raw.target_duration_seconds,
    input.defaultDurationSeconds ?? 5,
    1,
    90,
  );

  const sourceScenes: Record<string, unknown>[] = rawScenes.length
    ? rawScenes.filter((scene): scene is Record<string, unknown> =>
        Boolean(scene && typeof scene === 'object'),
      )
    : scriptScenes(input.script, input.title);

  const fallbackScene: Record<string, unknown> = {
    action: input.script,
    subject: input.title,
  };

  const scenes = (sourceScenes.length ? sourceScenes : [fallbackScene]).map(
    (scene, index): MediaScene => {
      const referenceImageUrl =
        stringValue(scene.reference_image_url ?? scene.referenceImageUrl, stringValue(raw.reference_image_url ?? raw.referenceImageUrl)) || undefined;
      const sourceVideoUrl =
        stringValue(scene.source_video_url ?? scene.sourceVideoUrl, stringValue(raw.source_video_url ?? raw.sourceVideoUrl)) || undefined;
      const action = stringValue(
        scene.action,
        stringValue(scene.visual_prompt ?? scene.visualPrompt, stringValue(raw.visual_prompt ?? raw.visualPrompt, input.script)),
      );
      const subject = stringValue(scene.subject, input.title);
      const environment = stringValue(
        scene.environment,
        stringValue(
          scene.visual_prompt ?? scene.visualPrompt,
          stringValue(
            raw.visual_prompt,
            stringValue(raw.environment, 'professional real-world environment'),
          ),
        ),
      );
      const visualStyle = stringValue(
        scene.visual_style ?? scene.visualStyle,
        stringValue(
          raw.visual_style ?? raw.visualStyle,
          'branded educational motion graphics with licensed documentary footage',
        ),
      );
      const lighting = stringValue(
        scene.lighting,
        stringValue(raw.lighting, 'natural motivated lighting'),
      );
      const rawCharacterIds = scene.character_ids ?? scene.characterIds;
      const characterIds = Array.isArray(rawCharacterIds)
        ? rawCharacterIds.filter((id): id is string => typeof id === 'string')
        : characters.map((character) => character.id);

      const mediaSource = ['pexels', 'elevate-owned', 'elevate-motion'].includes(
        String(scene.media_source ?? scene.mediaSource),
      )
        ? ((scene.media_source ?? scene.mediaSource) as MediaScene['mediaSource'])
        : index < Math.ceil(sourceScenes.length * 0.6)
          ? 'pexels'
          : 'elevate-motion';
      const overlayTemplate = stringValue(scene.overlay_template ?? scene.overlayTemplate, 'elevate-callout-v1');
      const id = stringValue(scene.id, `scene-${index + 1}`);
      const contentHash = crypto
        .createHash('sha256')
        .update(
          JSON.stringify({ id, action, dialogue: scene.dialogue, mediaSource, overlayTemplate }),
        )
        .digest('hex');
      return {
        id,
        order: index + 1,
        durationSeconds: numberValue(scene.duration_seconds ?? scene.durationSeconds, defaultDuration, 1, 90),
        operation: operationValue(
          scene.operation,
          Boolean(referenceImageUrl),
          Boolean(sourceVideoUrl),
        ),
        subject,
        environment,
        action,
        visualStyle,
        shotSize: shotSizeValue(scene.shot_size ?? scene.shotSize),
        cameraMove: cameraValue(scene.camera_move ?? scene.cameraMove),
        lighting,
        dialogue: stringValue(scene.dialogue, stringValue(scene.narration)) || undefined,
        sound: stringValue(scene.sound) || undefined,
        transition: transitionValue(scene.transition),
        referenceImageUrl,
        sourceVideoUrl,
        characterIds,
        negativePrompt:
          stringValue(scene.negative_prompt ?? scene.negativePrompt, stringValue(raw.negative_prompt ?? raw.negativePrompt)) || undefined,
        seed: Number.isFinite(Number(scene.seed)) ? Number(scene.seed) : undefined,
        procedurePhase: stringValue(scene.procedure_phase ?? scene.procedurePhase) || undefined,
        requiredVisualEvidence: stringValue(scene.required_visual_evidence ?? scene.requiredVisualEvidence, action) || undefined,
        sceneType: sceneTypeValue(scene.scene_type ?? scene.sceneType, index, sourceScenes.length),
        memoryAnchor:
          stringValue(
            scene.memory_anchor ?? scene.memoryAnchor,
            stringValue((raw.teaching_model as Record<string, unknown> | undefined)?.memory_anchor),
          ) || undefined,
        mediaSource,
        overlayTemplate,
        contentHash: stringValue(scene.content_hash ?? scene.contentHash, contentHash),
        reviewStatus: ['approved', 'rejected'].includes(String(scene.review_status ?? scene.reviewStatus))
          ? ((scene.review_status ?? scene.reviewStatus) as MediaScene['reviewStatus'])
          : 'draft',
      };
    },
  );

  const storyboardBase = {
    version: '1.0' as const,
    title: input.title,
    objective: input.objective || input.title,
    aspectRatio: (raw.aspect_ratio === '9:16' || raw.aspect_ratio === '1:1'
      ? raw.aspect_ratio
      : '16:9') as MediaStoryboard['aspectRatio'],
    width: numberValue(raw.width, 1280, 256, 1920),
    height: numberValue(raw.height, 704, 256, 1080),
    fps: numberValue(raw.fps, 24, 12, 60),
    characters,
    scenes,
  };

  return { ...storyboardBase, promptHash: promptHash(storyboardBase) };
}

export function scenePrompt(scene: MediaScene, characters: MediaCharacterReference[] = []): string {
  const refs = characters
    .filter((character) => scene.characterIds.includes(character.id))
    .map(
      (character) =>
        `${character.name || character.id}: ${character.appearancePrompt || 'preserve reference identity exactly'}`,
    )
    .join('; ');

  return [
    scene.visualStyle,
    `Subject: ${scene.subject}`,
    `Environment: ${scene.environment}`,
    `Action: ${scene.action}`,
    `Shot: ${scene.shotSize}`,
    `Camera: ${scene.cameraMove}`,
    `Lighting: ${scene.lighting}`,
    refs ? `Character continuity: ${refs}` : '',
    scene.dialogue ? `Dialogue: ${scene.dialogue}` : '',
    scene.sound ? `Sound: ${scene.sound}` : '',
    scene.procedurePhase ? `Instructional phase: ${scene.procedurePhase}` : '',
    scene.requiredVisualEvidence
      ? `The picture must visibly demonstrate: ${scene.requiredVisualEvidence}`
      : '',
    scene.negativePrompt ? `Avoid: ${scene.negativePrompt}` : '',
  ]
    .filter(Boolean)
    .join('. ');
}
