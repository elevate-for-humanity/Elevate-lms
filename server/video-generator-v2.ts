/* eslint-disable */
/**
 * Video Generator V2
 * Main orchestrator for video generation pipeline
 */

import path from 'path';
import fs from 'fs/promises';
import { generateTextToSpeech, estimateAudioDuration } from './tts-service';
import {
  renderScene,
  concatenateVideos,
  addBackgroundMusic,
  cleanupTempFiles,
  getVideoDimensions,
  RenderScene,
  RenderOptions,
} from './video-renderer';

export interface VideoScene {
  id: string;
  type: 'title' | 'content' | 'image' | 'video' | 'split';
  duration: number;
  script: string;
  voiceOver: boolean;
  background: string;
  textPosition: 'center' | 'top' | 'bottom';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  image?: string;
  textStyle?: {
    fontSize: number;
    color: string;
    fontWeight: string;
  };
}

export interface VideoGenerationRequest {
  title: string;
  scenes: VideoScene[];
  settings: {
    format: '16:9' | '9:16' | '1:1';
    resolution: '720p' | '1080p' | '4K';
    voiceOver: boolean;
    backgroundMusic: boolean;
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    musicPath?: string;
    musicVolume?: number;
  };
  userId?: string;
}

export interface VideoGenerationResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoPath?: string;
  duration?: number;
  error?: string;
  progress?: number;
}

/**
 * Generate complete video from scenes
 */
export async function generateVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResponse> {
  const jobId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const tempDir = path.join(process.cwd(), 'temp', jobId);
  const outputDir = path.join(process.cwd(), 'output');

  try {

    // Create directories
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Determine render options
    const dimensions = getVideoDimensions(request.settings.format);
    const renderOptions: RenderOptions = {
      width: dimensions.width,
      height: dimensions.height,
      fps: 30,
      format: request.settings.format,
      quality:
        request.settings.resolution === '4K'
          ? 'ultra'
          : request.settings.resolution === '1080p'
            ? 'high'
            : 'medium',
    };

    // Process each scene
    const sceneVideoPaths: string[] = [];
    let totalDuration = 0;

    for (let i = 0; i < request.scenes.length; i++) {
      const scene = request.scenes[i];

      // Generate TTS audio if voice-over is enabled
      let audioPath: string | undefined;
      if (request.settings.voiceOver && scene.voiceOver && scene.script) {
        const voice = request.settings.voice || 'alloy';
        const audioBuffer = await generateTextToSpeech(
          scene.script,
          voice,
          1.0
        );
        audioPath = path.join(tempDir, `scene-${i + 1}-audio.mp3`);
        await fs.writeFile(audioPath, audioBuffer);
      }

      // Prepare render scene
      const renderSceneData: RenderScene = {
        id: scene.id,
        type: scene.type,
        duration: scene.duration,
        script: scene.script,
        background: scene.background,
        textPosition: scene.textPosition,
        animation: scene.animation,
        audioPath: audioPath,
        imagePath: scene.image,
        textStyle: scene.textStyle,
      };

      // Render scene to video
      const sceneVideoPath = path.join(tempDir, `scene-${i + 1}.mp4`);
      await renderScene(renderSceneData, sceneVideoPath, renderOptions);
      sceneVideoPaths.push(sceneVideoPath);
      totalDuration += scene.duration;

    }

    // Concatenate all scenes
    const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
    await concatenateVideos(sceneVideoPaths, concatenatedPath);

    // Add background music if enabled
    let finalVideoPath: string;
    if (request.settings.backgroundMusic && request.settings.musicPath) {
      finalVideoPath = path.join(outputDir, `${jobId}.mp4`);
      const musicVolume = request.settings.musicVolume || 0.3;
      await addBackgroundMusic(
        concatenatedPath,
        request.settings.musicPath,
        finalVideoPath,
        musicVolume
      );
    } else {
      // Move concatenated video to output
      finalVideoPath = path.join(outputDir, `${jobId}.mp4`);
      await fs.copyFile(concatenatedPath, finalVideoPath);
    }

    // Clean up temporary files
    await cleanupTempFiles(tempDir);


    return {
      jobId,
      status: 'completed',
      videoPath: finalVideoPath,
      duration: totalDuration,
      progress: 100,
    };
  } catch (error) {

    // Clean up on error
    await cleanupTempFiles(tempDir).catch(() => {});

    return {
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      progress: 0,
    };
  }
}

/**
 * Process scene timeline and validate
 */
export function processTimeline(scenes: VideoScene[]): {
  valid: boolean;
  totalDuration: number;
  errors: string[];
} {
  const errors: string[] = [];
  let totalDuration = 0;

  if (scenes.length === 0) {
    errors.push('At least one scene is required');
  }

  scenes.forEach((scene, index) => {
    // Validate duration
    if (scene.duration <= 0) {
      errors.push(`Scene ${index + 1}: Duration must be greater than 0`);
    }
    if (scene.duration > 300) {
      errors.push(`Scene ${index + 1}: Duration cannot exceed 300 seconds`);
    }

    // Validate script
    if (!scene.script || scene.script.trim().length === 0) {
      errors.push(`Scene ${index + 1}: Script text is required`);
    }

    // Validate background
    if (!scene.background) {
      errors.push(`Scene ${index + 1}: Background is required`);
    }

    totalDuration += scene.duration;
  });

  // Check total duration
  if (totalDuration > 600) {
    errors.push('Total video duration cannot exceed 10 minutes (600 seconds)');
  }

  return {
    valid: errors.length === 0,
    totalDuration,
    errors,
  };
}

/**
 * Estimate video generation time
 */
export function estimateGenerationTime(scenes: VideoScene[]): number {
  // Rough estimate: 2-3 seconds per second of video
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const estimatedSeconds = totalDuration * 2.5;
  return Math.ceil(estimatedSeconds);
}

/**
 * Get video generation status
 */
export interface VideoJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentScene?: number;
  totalScenes?: number;
  estimatedTimeRemaining?: number;
  videoPath?: string;
  error?: string;
}

// In-memory job tracking (in production, use Redis or database)
const jobStatuses = new Map<string, VideoJobStatus>();

export function updateJobStatus(
  jobId: string,
  status: Partial<VideoJobStatus>
): void {
  const existing = jobStatuses.get(jobId) || {
    jobId,
    status: 'pending',
    progress: 0,
  };

  jobStatuses.set(jobId, { ...existing, ...status });
}

export function getJobStatus(jobId: string): VideoJobStatus | undefined {
  return jobStatuses.get(jobId);
}

export function clearJobStatus(jobId: string): void {
  jobStatuses.delete(jobId);
}
