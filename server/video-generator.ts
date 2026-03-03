/**
 * Video Generator Worker
 * Uses FFmpeg to generate videos from scenes
 * This runs as a background worker or separate service
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Heavy native deps loaded at runtime only — typed as `any` so the
// file tracer cannot follow the import path into native binaries.
let _ffmpeg: any = null;
let _createCanvas: any = null;
let _loadImage: any = null;
let _registerFont: any = null;

async function ensureDeps() {
  if (_ffmpeg) return;
  const ff = (await import('fluent-ffmpeg')).default;
  const canvasMod = await import('canvas');
  _ffmpeg = ff;
  _createCanvas = canvasMod.createCanvas;
  _loadImage = canvasMod.loadImage;
  _registerFont = canvasMod.registerFont;
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface Scene {
  id: string;
  type: 'title' | 'content' | 'image' | 'split';
  duration: number;
  script: string;
  voiceOver: boolean;
  background: string;
  textPosition: 'center' | 'top' | 'bottom';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  image?: string;
  audioUrl?: string;
}

interface VideoConfig {
  id: string;
  title: string;
  scenes: Scene[];
  format: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '720p' | '4K';
  backgroundMusic?: boolean;
}

export class VideoGenerator {
  private tempDir: string;
  private outputDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.outputDir = path.join(__dirname, '../output');
  }

  async initialize() {
    await mkdir(this.tempDir, { recursive: true });
    await mkdir(this.outputDir, { recursive: true });
  }

  async generateVideo(config: VideoConfig): Promise<string> {
    await this.initialize();


    // Get video dimensions based on format
    const dimensions = this.getDimensions(config.format, config.resolution);

    // Generate frames for each scene
    const sceneVideos: string[] = [];

    for (let i = 0; i < config.scenes.length; i++) {
      const scene = config.scenes[i];

      const sceneVideo = await this.generateScene(scene, dimensions, i);
      sceneVideos.push(sceneVideo);
    }

    // Concatenate all scenes
    const finalVideo = await this.concatenateScenes(sceneVideos, config.id);

    // Add background music if requested
    if (config.backgroundMusic) {
      await this.addBackgroundMusic(finalVideo);
    }

    return finalVideo;
  }

  private getDimensions(
    format: string,
    resolution: string
  ): { width: number; height: number } {
    const resMap = {
      '1080p': 1080,
      '720p': 720,
      '4K': 2160,
    };

    const height = resMap[resolution] || 1080;

    switch (format) {
      case '16:9':
        return { width: Math.round((height * 16) / 9), height };
      case '9:16':
        return { width: Math.round((height * 9) / 16), height };
      case '1:1':
        return { width: height, height };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  private async generateScene(
    scene: Scene,
    dimensions: { width: number; height: number },
    index: number
  ): Promise<string> {
    // Create canvas for this scene
    const canvas = _createCanvas!(dimensions.width, dimensions.height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Add background image if provided
    if (scene.image) {
      try {
        const img = await _loadImage!(scene.image);
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      } catch (error) {
        // Image load failed, continue without background
      }
    }

    // Add text
    if (scene.script) {
      this.drawText(ctx as any, scene.script, dimensions, scene.textPosition);
    }

    // Save frame as image
    const framePath = path.join(this.tempDir, `scene-${index}-frame.png`);
    const buffer = canvas.toBuffer('image/png');
    await writeFile(framePath, buffer);

    // Convert static image to video with duration
    const sceneVideoPath = path.join(this.tempDir, `scene-${index}.mp4`);

    await new Promise<void>((resolve, reject) => {
      let command = _ffmpeg!()
        .input(framePath)
        .inputOptions(['-loop 1', `-t ${scene.duration}`])
        .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-r 30']);

      // Add audio if available
      if (scene.audioUrl) {
        command = command.input(scene.audioUrl);
      }

      command
        .output(sceneVideoPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return sceneVideoPath;
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    dimensions: { width: number; height: number },
    position: 'center' | 'top' | 'bottom'
  ) {
    // Set text style
    const fontSize = Math.round(dimensions.height / 20);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Word wrap
    const maxWidth = dimensions.width * 0.8;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Calculate Y position
    let y: number;
    const lineHeight = fontSize * 1.5;
    const totalHeight = lines.length * lineHeight;

    switch (position) {
      case 'top':
        y = dimensions.height * 0.2;
        break;
      case 'bottom':
        y = dimensions.height * 0.8 - totalHeight / 2;
        break;
      case 'center':
      default:
        y = dimensions.height / 2 - totalHeight / 2;
    }

    // Draw each line
    lines.forEach((line, index) => {
      ctx.fillText(line.trim(), dimensions.width / 2, y + index * lineHeight);
    });
  }

  private async concatenateScenes(
    sceneVideos: string[],
    videoId: string
  ): Promise<string> {
    const outputPath = path.join(this.outputDir, `${videoId}.mp4`);
    const fileListPath = path.join(this.tempDir, 'filelist.txt');

    // Create file list for FFmpeg concat
    const fileList = sceneVideos.map((v) => `file '${v}'`).join('\n');
    await writeFile(fileListPath, fileList);

    return new Promise((resolve, reject) => {
      _ffmpeg!()
        .input(fileListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private async addBackgroundMusic(videoPath: string): Promise<void> {
    // Add background music at low volume
    // This would integrate with a music library
  }

  async cleanup(videoId: string) {
    // Clean up temporary files
    const files = await fs.promises.readdir(this.tempDir);
    for (const file of files) {
      if (file.includes(videoId)) {
        await fs.promises.unlink(path.join(this.tempDir, file));
      }
    }
  }
}

// Example usage
export async function generateVideoFromConfig(
  config: VideoConfig
): Promise<string> {
  await ensureDeps();
  const generator = new VideoGenerator();
  const videoPath = await generator.generateVideo(config);
  return videoPath;
}
