/* eslint-disable */
/**
 * Video Rendering Engine
 * Uses FFmpeg to render videos from scenes
 */

import fs from 'fs/promises';
import path from 'path';

// Heavy native deps loaded at runtime only — keeps them out of the
// Netlify server handler's file-trace graph.
// Typed as `any` intentionally so the tracer cannot follow the import path.
let _ffmpeg: any = null;
let _createCanvas: any = null;
let _loadImage: any = null;
let _registerFont: any = null;

async function ensureDeps() {
  if (_ffmpeg) return;
  // String concatenation prevents Turbopack from statically resolving these optional native deps
  const ff = (await import(/* webpackIgnore: true */ 'fluent-' + 'ffmpeg')).default;
  const ffmpegInstaller = (await import(/* webpackIgnore: true */ '@ffmpeg-installer/' + 'ffmpeg')).default;
  const ffprobeInstaller = (await import(/* webpackIgnore: true */ '@ffprobe-installer/' + 'ffprobe')).default;
  const canvasMod = await import(/* webpackIgnore: true */ 'can' + 'vas');
  ff.setFfmpegPath(ffmpegInstaller.path);
  ff.setFfprobePath(ffprobeInstaller.path);
  _ffmpeg = ff;
  _createCanvas = canvasMod.createCanvas;
  _loadImage = canvasMod.loadImage;
  _registerFont = canvasMod.registerFont;
}

export interface RenderScene {
  id: string;
  type: 'title' | 'content' | 'image' | 'video' | 'split';
  duration: number;
  script: string;
  background: string; // Color hex or image/video URL
  textPosition: 'center' | 'top' | 'bottom';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  audioPath?: string; // Path to TTS audio file
  imagePath?: string; // Path to background image
  videoPath?: string; // Path to background video
  textStyle?: {
    fontSize: number;
    color: string;
    fontWeight: string;
  };
}

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  format: '16:9' | '9:16' | '1:1';
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  width: 1920,
  height: 1080,
  fps: 30,
  format: '16:9',
  quality: 'high',
};

/**
 * Get video dimensions based on format
 */
export function getVideoDimensions(format: RenderOptions['format']): {
  width: number;
  height: number;
} {
  switch (format) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

/**
 * Get FFmpeg quality settings
 */
function getQualitySettings(quality: RenderOptions['quality']): {
  crf: number;
  preset: string;
} {
  switch (quality) {
    case 'low':
      return { crf: 28, preset: 'veryfast' };
    case 'medium':
      return { crf: 23, preset: 'fast' };
    case 'high':
      return { crf: 18, preset: 'medium' };
    case 'ultra':
      return { crf: 15, preset: 'slow' };
    default:
      return { crf: 18, preset: 'medium' };
  }
}

/**
 * Create a text overlay image using Canvas
 */
export async function createTextOverlay(
  text: string,
  width: number,
  height: number,
  options: {
    position: 'center' | 'top' | 'bottom';
    fontSize: number;
    color: string;
    fontWeight: string;
    backgroundColor?: string;
  }
): Promise<Buffer> {
  await ensureDeps();
  const canvas = _createCanvas!(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Text settings
  ctx.fillStyle = options.color;
  ctx.font = `${options.fontWeight} ${options.fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap
  const maxWidth = width * 0.8;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Calculate vertical position
  const lineHeight = options.fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  let startY: number;

  switch (options.position) {
    case 'top':
      startY = height * 0.2;
      break;
    case 'bottom':
      startY = height * 0.8 - totalHeight / 2;
      break;
    case 'center':
    default:
      startY = (height - totalHeight) / 2;
      break;
  }

  // Draw text with shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight + lineHeight / 2;
    ctx.fillText(line, width / 2, y);
  });

  return canvas.toBuffer('image/png');
}

/**
 * Create a solid color background image
 */
export async function createColorBackground(
  color: string,
  width: number,
  height: number
): Promise<Buffer> {
  await ensureDeps();
  const canvas = _createCanvas!(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return canvas.toBuffer('image/png');
}

/**
 * Render a single scene to video
 */
export async function renderScene(
  scene: RenderScene,
  outputPath: string,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const { width, height } = getVideoDimensions(options.format);
      const { crf, preset } = getQualitySettings(options.quality);

      // Create temporary directory for scene assets
      const tempDir = path.join(process.cwd(), 'temp', scene.id);
      await fs.mkdir(tempDir, { recursive: true });

      // Create background
      let backgroundPath: string;
      if (scene.videoPath) {
        backgroundPath = scene.videoPath;
      } else if (scene.imagePath) {
        backgroundPath = scene.imagePath;
      } else if (scene.background.startsWith('#')) {
        // Solid color background
        const colorBuffer = await createColorBackground(
          scene.background,
          width,
          height
        );
        backgroundPath = path.join(tempDir, 'background.png');
        await fs.writeFile(backgroundPath, colorBuffer);
      } else {
        // Assume it's a gradient or image URL - create solid color for now
        const colorBuffer = await createColorBackground(
          '#000000',
          width,
          height
        );
        backgroundPath = path.join(tempDir, 'background.png');
        await fs.writeFile(backgroundPath, colorBuffer);
      }

      // Create text overlay
      const textOverlay = await createTextOverlay(scene.script, width, height, {
        position: scene.textPosition,
        fontSize: scene.textStyle?.fontSize || 64,
        color: scene.textStyle?.color || '#FFFFFF',
        fontWeight: scene.textStyle?.fontWeight || 'bold',
        backgroundColor: 'transparent',
      });
      const textOverlayPath = path.join(tempDir, 'text-overlay.png');
      await fs.writeFile(textOverlayPath, textOverlay);

      // Build FFmpeg command
      await ensureDeps();
      const command = _ffmpeg!();

      // Add background input
      if (scene.videoPath) {
        command.input(backgroundPath).inputOptions(['-stream_loop', '-1']);
      } else {
        command.input(backgroundPath).inputOptions(['-loop', '1']);
      }

      // Add text overlay
      command.input(textOverlayPath).inputOptions(['-loop', '1']);

      // Add audio if available
      if (scene.audioPath) {
        command.input(scene.audioPath);
      }

      // Complex filter for overlay
      command.complexFilter([
        {
          filter: 'overlay',
          options: { x: 0, y: 0 },
          inputs: ['0:v', '1:v'],
          outputs: 'overlayed',
        },
        {
          filter: 'format',
          options: 'yuv420p',
          inputs: 'overlayed',
          outputs: 'formatted',
        },
      ]);

      // Output options
      command
        .outputOptions([
          '-map',
          '[formatted]',
          ...(scene.audioPath ? ['-map', '2:a'] : []),
          '-c:v',
          'libx264',
          '-crf',
          crf.toString(),
          '-preset',
          preset,
          '-r',
          options.fps.toString(),
          '-t',
          scene.duration.toString(),
          '-pix_fmt',
          'yuv420p',
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
        })
        .on('progress', () => {
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Concatenate multiple video files
 */
export async function concatenateVideos(
  videoPaths: string[],
  outputPath: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create concat file
      const concatFilePath = path.join(
        path.dirname(outputPath),
        'concat-list.txt'
      );
      const concatContent = videoPaths.map((p) => `file '${p}'`).join('\n');
      await fs.writeFile(concatFilePath, concatContent);

      _ffmpeg!()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('start', (commandLine) => {
        })
        .on('progress', () => {
        })
        .on('end', async () => {
          // Clean up concat file
          await fs.unlink(concatFilePath).catch(() => {});
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add background music to video
 */
export async function addBackgroundMusic(
  videoPath: string,
  musicPath: string,
  outputPath: string,
  musicVolume: number = 0.3
): Promise<string> {
  return new Promise((resolve, reject) => {
    _ffmpeg!()
      .input(videoPath)
      .input(musicPath)
      .complexFilter([
        `[1:a]volume=${musicVolume}[music]`,
        '[0:a][music]amix=inputs=2:duration=first[aout]',
      ])
      .outputOptions([
        '-map',
        '0:v',
        '-map',
        '[aout]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    _ffmpeg!.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
  }
}
