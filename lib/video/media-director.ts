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

export type ShotSize = 'extreme-wide' | 'wide' | 'medium' | 'medium-close' | 'close-up' | 'extreme-close-up';
export type Transition = 'cut' | 'crossfade' | 'dip-black' | 'match-cut' | 'whip' | 'none';
export type InstructionalSceneType =
  | 'problem_hook' | 'mental_model' | 'system_diagram' | 'equipment_closeup'
  | 'worked_example' | 'field_scenario' | 'common_mistake' | 'safety_warning'
  | 'memory_recap' | 'knowledge_check';

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

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function operationValue(value: unknown, hasImage: boolean, hasVideo: boolean): MediaOperation {
  const allowed: MediaOperation[] = ['textToVideo', 'imageToVideo', 'videoToVideo', 'extend', 'remix', 'loop', 'interpolate'];
  if (typeof value === 'string' && allowed.includes(value as MediaOperation)) return value as MediaOperation;
  if (hasVideo) return 'videoToVideo';
  if (hasImage) return 'imageToVideo';
  return 'textToVideo';
}

function shotSizeValue(value: unknown): ShotSize {
  const allowed: ShotSize[] = ['extreme-wide', 'wide', 'medium', 'medium-close', 'close-up', 'extreme-close-up'];
  return typeof value === 'string' && allowed.includes(value as ShotSize) ? (value as ShotSize) : 'medium';
}

function cameraValue(value: unknown): CameraMove {
  const allowed: CameraMove[] = ['locked','pan-left','pan-right','tilt-up','tilt-down','dolly-in','dolly-out','truck-left','truck-right','orbit','handheld','crane'];
  return typeof value === 'string' && allowed.includes(value as CameraMove) ? (value as CameraMove) : 'dolly-in';
}

function transitionValue(value: unknown): Transition {
  const allowed: Transition[] = ['cut','crossfade','dip-black','match-cut','whip','none'];
  return typeof value === 'string' && allowed.includes(value as Transition) ? (value as Transition) : 'cut';
}

function sceneTypeValue(value: unknown, index: number, total: number): InstructionalSceneType {
  const allowed: InstructionalSceneType[] = ['problem_hook','mental_model','system_diagram','equipment_closeup','worked_example','field_scenario','common_mistake','safety_warning','memory_recap','knowledge_check'];
  if (typeof value === 'string' && allowed.includes(value as InstructionalSceneType)) return value as InstructionalSceneType;
  const arc: InstructionalSceneType[] = ['problem_hook','mental_model','system_diagram','equipment_closeup','worked_example','common_mistake','memory_recap','knowledge_check'];
  return arc[Math.min(arc.length - 1, Math.floor(index * arc.length / Math.max(1, total)))] ?? 'worked_example';
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
  return sentences.map((action, index) => {
    const phase = procedurePhase(action, index, sentences.length);
    const detail = /angle|position|blade|guard|hand|finger|line|section|tool/i.test(action);
    return {
      action,
      scene_type: sceneTypeValue(undefined, index, sentences.length),
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
  const characters = Array.isArray(input.characters) ? input.characters : [];
  const defaultDuration = numberValue(
    raw.duration_seconds ?? raw.target_duration_seconds,
    input.defaultDurationSeconds ?? 5,
    1,
    15,
  );

  const sourceScenes: Record<string, unknown>[] = rawScenes.length
    ? rawScenes.filter((scene): scene is Record<string, unknown> => Boolean(scene && typeof scene === 'object'))
    : scriptScenes(input.script, input.title);

  const fallbackScene: Record<string, unknown> = {
    action: input.script,
    subject: input.title,
  };

  const scenes = (sourceScenes.length ? sourceScenes : [fallbackScene]).map((scene, index): MediaScene => {
    const referenceImageUrl = stringValue(scene.reference_image_url, stringValue(raw.reference_image_url)) || undefined;
    const sourceVideoUrl = stringValue(scene.source_video_url, stringValue(raw.source_video_url)) || undefined;
    const action = stringValue(
      scene.action,
      stringValue(scene.visual_prompt, stringValue(raw.visual_prompt, input.script)),
    );
    const subject = stringValue(scene.subject, input.title);
    const environment = stringValue(
      scene.environment,
      stringValue(
        scene.visual_prompt,
        stringValue(raw.visual_prompt, stringValue(raw.environment, 'professional real-world environment')),
      ),
    );
    const visualStyle = stringValue(scene.visual_style, stringValue(raw.visual_style, 'cinematic photorealistic educational film'));
    const lighting = stringValue(scene.lighting, stringValue(raw.lighting, 'natural motivated lighting'));
    const characterIds = Array.isArray(scene.character_ids)
      ? scene.character_ids.filter((id): id is string => typeof id === 'string')
      : characters.map((character) => character.id);

    return {
      id: stringValue(scene.id, `scene-${index + 1}`),
      order: index + 1,
      durationSeconds: numberValue(scene.duration_seconds, defaultDuration, 1, 15),
      operation: operationValue(scene.operation, Boolean(referenceImageUrl), Boolean(sourceVideoUrl)),
      subject,
      environment,
      action,
      visualStyle,
      shotSize: shotSizeValue(scene.shot_size),
      cameraMove: cameraValue(scene.camera_move),
      lighting,
      dialogue: stringValue(scene.dialogue) || undefined,
      sound: stringValue(scene.sound) || undefined,
      transition: transitionValue(scene.transition),
      referenceImageUrl,
      sourceVideoUrl,
      characterIds,
      negativePrompt: stringValue(scene.negative_prompt, stringValue(raw.negative_prompt)) || undefined,
      seed: Number.isFinite(Number(scene.seed)) ? Number(scene.seed) : undefined,
      procedurePhase: stringValue(scene.procedure_phase) || undefined,
      requiredVisualEvidence: stringValue(scene.required_visual_evidence, action) || undefined,
      sceneType: sceneTypeValue(scene.scene_type, index, sourceScenes.length),
      memoryAnchor: stringValue(scene.memory_anchor, stringValue((raw.teaching_model as Record<string, unknown> | undefined)?.memory_anchor)) || undefined,
    };
  });

  const storyboardBase = {
    version: '1.0' as const,
    title: input.title,
    objective: input.objective || input.title,
    aspectRatio: (raw.aspect_ratio === '9:16' || raw.aspect_ratio === '1:1' ? raw.aspect_ratio : '16:9') as MediaStoryboard['aspectRatio'],
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
    .map((character) => `${character.name || character.id}: ${character.appearancePrompt || 'preserve reference identity exactly'}`)
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
    scene.requiredVisualEvidence ? `The picture must visibly demonstrate: ${scene.requiredVisualEvidence}` : '',
    scene.negativePrompt ? `Avoid: ${scene.negativePrompt}` : '',
  ].filter(Boolean).join('. ');
}
