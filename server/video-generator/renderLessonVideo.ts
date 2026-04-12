/**
 * Master orchestrator for the scene-based lesson video pipeline.
 *
 * Pipeline:
 *   LessonRenderPlanDraft (GPT output)
 *     → generateAllSceneAudio   (one MP3 per scene, ffprobe duration)
 *     → fetchBestSceneVideo     (Pexels video per scene, cached)
 *     → buildSceneTimeline      (resolve timing, assemble RenderedScenePlan[])
 *     → renderSceneVideo        (FFmpeg per scene: bg video + caption + audio)
 *     → concatSceneVideos       (concat + faststart final pass)
 *     → cleanup temp dir
 */

import fs from 'fs/promises';
import path from 'path';
import type { LessonRenderPlanDraft, FinalLessonRenderPlan, RenderedScenePlan, SceneTiming } from './types';
import { generateAllSceneAudio } from './generateSceneAudio';
import { fetchBestSceneVideo } from './fetchBestSceneVideo';
import { renderSceneVideo } from './renderSceneVideo';
import { concatSceneVideos } from './concatSceneVideos';

const TAIL_PAD = 0.5; // seconds of silence after each scene's audio

export async function renderLessonVideo(
  draft: LessonRenderPlanDraft,
  outputPath: string,
): Promise<FinalLessonRenderPlan> {
  const [targetWidth, targetHeight] = draft.targetResolution === '1920x1080'
    ? [1920, 1080] : [1280, 720];

  const tempDir = path.join(path.dirname(outputPath), `render-${draft.lessonId}-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    const scenes = [...draft.scenes].sort((a, b) => a.order - b.order);

    // 1. Generate all scene audio (parallel would be faster but TTS rate limits)
    console.log(`\n🎙  Generating audio for ${scenes.length} scenes...`);
    const audioAssets = await generateAllSceneAudio(scenes, draft.voice, tempDir);
    const audioMap = new Map(audioAssets.map(a => [a.sceneId, a]));

    // 2. Fetch background videos — sequential to enforce no-repeat rule
    console.log(`\n📹  Fetching scene videos...`);
    const usedVideoIds = new Set<number>();
    const videoAssets = [];
    for (const scene of scenes) {
      const audio = audioMap.get(scene.id)!;
      const asset = await fetchBestSceneVideo(
        scene.id,
        scene.videoQuery,
        audio.durationSeconds,
        { lessonId: draft.lessonId, usedVideoIds, visualFocus: scene.visualFocus },
      );
      videoAssets.push(asset);
    }
    const videoMap = new Map(videoAssets.map(v => [v.sceneId, v]));

    // 3. Build timeline — resolve timing for each scene
    let cursor = 0;
    const resolvedScenes: RenderedScenePlan[] = scenes.map(scene => {
      const audio = audioMap.get(scene.id)!;
      const video = videoMap.get(scene.id)!;
      const durationSeconds = audio.durationSeconds + TAIL_PAD;

      const timing: SceneTiming = {
        sceneId: scene.id,
        startSeconds: cursor,
        endSeconds: cursor + durationSeconds,
        durationSeconds,
        audioDurationSeconds: audio.durationSeconds,
        tailPadSeconds: TAIL_PAD,
      };
      cursor += durationSeconds;

      return {
        id: scene.id,
        order: scene.order,
        narration: scene.narration,
        caption: scene.caption,
        subcaption: scene.subcaption,
        layout: scene.layout,
        transitionIn: scene.transitionIn ?? 'cut',
        transitionOut: scene.transitionOut ?? 'cut',
        audio,
        video,
        timing,
      };
    });

    // 4. Render each scene
    console.log(`\n🎬  Rendering ${resolvedScenes.length} scenes...`);
    const scenePaths: string[] = [];
    for (const scene of resolvedScenes) {
      console.log(`  ▶ ${scene.id} (${scene.timing.durationSeconds.toFixed(1)}s) — "${scene.caption}"`);
      const scenePath = await renderSceneVideo(scene, tempDir, { width: targetWidth, height: targetHeight });
      scene.outputPath = scenePath;
      scenePaths.push(scenePath);
    }

    // 5. Concatenate
    console.log(`\n🔗  Concatenating scenes → ${path.basename(outputPath)}`);
    await concatSceneVideos(scenePaths, outputPath, tempDir);

    const plan: FinalLessonRenderPlan = {
      lessonId: draft.lessonId,
      title: draft.title,
      voice: draft.voice,
      videoStyle: draft.videoStyle,
      targetWidth,
      targetHeight,
      scenes: resolvedScenes,
      finalVideoPath: outputPath,
      totalDurationSeconds: cursor,
    };

    return plan;

  } finally {
    // Always clean up temp dir
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
