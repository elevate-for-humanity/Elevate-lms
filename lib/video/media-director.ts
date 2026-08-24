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

function promptHash(input: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function sentenceScenes(script: string): string[] {
  return script
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
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
    : sentenceScenes(input.script).map((sentence) => ({
        action: sentence,
        subject: input.title,
        visual_prompt: stringValue(raw.visual_prompt),
      }));

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
    scene.negativePrompt ? `Avoid: ${scene.negativePrompt}` : '',
  ].filter(Boolean).join('. ');
}
