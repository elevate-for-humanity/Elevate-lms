import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { directMedia } from '@/lib/video/media-director';
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
    expect(storyboard.scenes.every((scene) => scene.environment.includes('Cinematic small-business owner'))).toBe(true);
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

    expect(vtt).toContain('00:00:03.000 --> 00:00:08.000');
    expect(vtt).toContain('Define the business plan.');
  });
});
