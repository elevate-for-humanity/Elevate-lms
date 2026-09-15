import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  compactLegacySceneData,
  directMedia,
  MAX_LESSON_VIDEO_SCENES,
} from '@/lib/video/media-director';
import { buildStoryboardWebVtt } from '@/lib/video/remotion-render';

describe('canonical media storyboard compatibility', () => {
  it('preserves legacy visual prompts and expands narration into multiple scenes', () => {
    const storyboard = directMedia({
      title: 'Business Plans, Pitch Decks, and Lean Canvas',
      objective: 'Compare the three planning tools.',
      script: 'Explain the business plan. Demonstrate a pitch deck. Complete a Lean Canvas.',
      sceneData: {
        visual_prompt: 'Cinematic small-business owner using visible planning documents',
        target_duration_seconds: 180,
      },
    });

    expect(storyboard.scenes).toHaveLength(3);
    expect(
      storyboard.scenes.every((scene) =>
        scene.environment.includes('Cinematic small-business owner'),
      ),
    ).toBe(true);
    expect(storyboard.scenes.every((scene) => scene.durationSeconds === 15)).toBe(true);
  });

  it('keeps explicit structured scenes authoritative', () => {
    const storyboard = directMedia({
      title: 'Lean Canvas',
      script: 'Explain the canvas.',
      sceneData: {
        visual_prompt: 'fallback visual',
        scenes: [
          {
            subject: 'Nine-section Lean Canvas',
            action: 'Highlight each section in order',
            environment: 'Exact animated instructional diagram',
            duration_seconds: 10,
          },
        ],
      },
    });

    expect(storyboard.scenes).toHaveLength(1);
    expect(storyboard.scenes[0].subject).toBe('Nine-section Lean Canvas');
    expect(storyboard.scenes[0].environment).toBe('Exact animated instructional diagram');
  });
});

describe('lesson media production bounds', () => {
  it('compacts all legacy scenes into ordered bounded segments without losing narration', () => {
    const scenes = Array.from({ length: 77 }, (_, index) => ({
      id: `legacy-${index + 1}`,
      dialogue: `Narration sentence ${index + 1}.`,
      action: `Demonstration ${index + 1}.`,
      required_visual_evidence: `Evidence ${index + 1}.`,
    }));
    const result = compactLegacySceneData({ scenes, source_contract: { fingerprint: 'source-1' } });
    expect(result.compacted).toBe(true);
    expect(result.originalSceneCount).toBe(77);
    expect(result.sceneData.source_contract).toEqual({ fingerprint: 'source-1' });
    const compacted = result.sceneData.scenes as Array<Record<string, unknown>>;
    expect(compacted).toHaveLength(MAX_LESSON_VIDEO_SCENES);
    expect(compacted.map((scene) => String(scene.dialogue)).join(' ')).toContain(
      'Narration sentence 77.',
    );
    expect(compacted[0]?.legacy_scene_range).toEqual({ start: 1, end: 7, count: 7 });
    expect(compacted.at(-1)?.legacy_scene_range).toEqual({ start: 70, end: 77, count: 8 });
  });

  it('coalesces long scripts into eight narration-preserving scenes', () => {
    const script = Array.from(
      { length: 77 },
      (_, i) => `Sentence ${i + 1} teaches required detail.`,
    ).join(' ');
    const storyboard = directMedia({ title: 'Bounded lesson', script });
    expect(storyboard.scenes).toHaveLength(8);
    expect(storyboard.scenes.map((scene) => scene.dialogue).join(' ')).toContain('Sentence 77');
  });

  it('rejects oversized persisted storyboards before narration or rendering', () => {
    const scenes = Array.from({ length: MAX_LESSON_VIDEO_SCENES + 1 }, (_, i) => ({
      id: `scene-${i + 1}`,
      action: `Action ${i + 1}`,
    }));
    expect(() =>
      directMedia({ title: 'Oversized', script: 'Script.', sceneData: { scenes } }),
    ).toThrow(
      `MEDIA_SCENE_LIMIT_EXCEEDED:${MAX_LESSON_VIDEO_SCENES + 1}:${MAX_LESSON_VIDEO_SCENES}`,
    );
  });
});

describe('storyboard caption adapter', () => {
  it('uses the actual scene timeline after the branded intro', () => {
    const vtt = buildStoryboardWebVtt([
      {
        scene_number: 1,
        title: 'Plan',
        bullets: ['Define the plan'],
        narration: 'Define the business plan.',
        clip_keyword: 'business plan',
        clipUrl: null,
        imageUrl: null,
        audioSrc: null,
        durationFrames: 150,
      },
    ]);

    expect(vtt).toContain('00:00:01.000 --> 00:00:06.000');
    expect(vtt).toContain('Define the business plan.');
  });
});
