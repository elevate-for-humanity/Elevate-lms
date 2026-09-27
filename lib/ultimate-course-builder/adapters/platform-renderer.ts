import type { UltimateRenderPort } from '../core/ports';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
function storyboard(input: any) {
  const raw =
    input.artifacts?.storyboard?.storyboard ??
    input.artifacts?.synchronization?.timeline?.scenes?.storyboard?.storyboard ??
    input.artifacts?.scene_construction?.scenes?.storyboard?.storyboard ??
    input.storyboard;
  const scenes = Array.isArray(raw) ? raw : raw?.scenes;
  if (!Array.isArray(scenes) || scenes.length < 2)
    throw new Error('ULTIMATE_RENDER_MULTISCENE_STORYBOARD_REQUIRED');
  return {
    version: raw?.version ?? 1,
    width: raw?.width ?? 1920,
    height: raw?.height ?? 1080,
    fps: raw?.fps ?? 30,
    scenes,
  };
}
export class UltimatePlatformRenderer implements UltimateRenderPort {
  async render(input: any) {
    const board = storyboard(input);
    for (const s of board.scenes ?? [])
      if (!s.sourceVideoUrl && !s.referenceImageUrl)
        throw new Error('ULTIMATE_ENVATO_VISUAL_REQUIRED:' + String(s.id ?? 'scene'));
    const dir = path.join(os.tmpdir(), 'ultimate-render', String(input.lessonId));
    await mkdir(dir, { recursive: true });
    const manifest = path.join(dir, 'storyboard.json');
    await writeFile(
      manifest,
      JSON.stringify(
        { courseTitle: input.courseTitle, lessonId: input.lessonId, storyboard: board },
        null,
        2,
      ),
    );
    // A storyboard file is an input to rendering, not playable learner media.
    // Stop the build until an actual encoded and stored video is available.
    throw new Error(`ULTIMATE_VIDEO_RENDER_NOT_IMPLEMENTED:${manifest}`);
  }
}
