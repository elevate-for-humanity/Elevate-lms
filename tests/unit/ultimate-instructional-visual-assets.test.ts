import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { materializeInstructionalVisualAssets } from '@/lib/ultimate-course-builder/adapters/instructional-visual-assets';
import { prepareUltimateStoryboardInput } from '@/lib/ultimate-course-builder/adapters/platform-renderer';
import { produceTeachingVisual } from '@/lib/ultimate-course-builder/instructional/teaching-visual';

function input() {
  const scenes = Array.from({ length: 13 }, (_, i) => {
    const text = `Record the actual duration for procedure ${i + 1}. Ask the designated reviewer to check the entry.`;
    return {
      id: `s${i}`,
      dialogue: text,
      teachingPoint: text,
      teachingVisual: produceTeachingVisual(text, 'practice'),
    };
  });
  return {
    artifacts: {
      storyboard: { storyboard: { scenes } },
      visual_assignment: {
        media: {
          readyAssets: [],
          assignments: scenes.map((s) => ({
            sceneId: s.id,
            assetId: `instructional:${s.id}`,
            assignmentMethod: 'instructional-render',
            generatedInstructionalVisual: true,
          })),
        },
      },
    },
  };
}

describe('materialized instructional assets', () => {
  it('uploads actual distinct PNGs and resolves saved assignments without inventing stock licenses', async () => {
    const upload = vi.fn(async (buffer: Buffer, path: string, mime: string) => {
      expect((await sharp(buffer).metadata()).width).toBe(1280);
      expect(mime).toBe('image/png');
      return `https://media.example.org/${path}`;
    });
    const actual = await materializeInstructionalVisualAssets(input(), upload);
    expect(upload).toHaveBeenCalledTimes(13);
    const assets = actual.artifacts.visual_assignment.media.readyAssets;
    expect(new Set(assets.map((a: any) => a.public_url)).size).toBe(13);
    expect(assets.every((a: any) => !a.entitlement_id && !a.license_evidence_url)).toBe(true);
    const prepared = prepareUltimateStoryboardInput(actual);
    expect(
      (prepared.sceneData as any).scenes.every(
        (s: any) =>
          s.reference_image_url && s.resolved_model === 'script-bound-instructional-image',
      ),
    ).toBe(true);
  });
  it('rejects an instructional plan quoting a different lesson before upload', async () => {
    const actual = input();
    actual.artifacts.storyboard.storyboard.scenes[0].teachingVisual = produceTeachingVisual(
      'A different lesson.',
      'practice',
    );
    const upload = vi.fn();
    await expect(materializeInstructionalVisualAssets(actual, upload)).rejects.toThrow(
      'NOT_SCRIPT_BOUND',
    );
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects mismatched scene ownership before upload', async () => {
    const actual = input();
    actual.artifacts.visual_assignment.media.assignments[0].assetId = 'instructional:another-scene';
    await expect(materializeInstructionalVisualAssets(actual, vi.fn())).rejects.toThrow(
      'MAPPING_REQUIRED',
    );
  });
  it('cannot approve a placeholder instructional ID without an uploaded image', () => {
    expect(() => prepareUltimateStoryboardInput(input())).toThrow('VISUALS_REQUIRED');
  });
});
