/**
 * Lesson Video Renderer
 *
 * Produces a multi-slide lesson video from a LessonScript.
 * Each slide is a Canvas-rendered frame composited with FFmpeg.
 * Slides are timed proportionally to the narration duration.
 *
 * Layout: left 2/3 slide content, lower-right instructor block.
 * Spec: 1920x1080, 30fps, H.264, AAC.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import type { LessonSlide } from '../lib/autopilot/lesson-script-generator';

// Lazy-load native deps
let _createCanvas: any = null;
let _loadImage: any = null;
let _ffmpeg: any = null;

async function ensureDeps() {
  if (!_createCanvas) {
    const canvas = await import('canvas');
    _createCanvas = canvas.createCanvas;
    _loadImage = canvas.loadImage;
  }
}

async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;
  const ff = (await import('fluent-ffmpeg')).default;
  const inst = (await import('@ffmpeg-installer/ffmpeg')).default;
  const probe = (await import('@ffprobe-installer/ffprobe')).default;
  const { existsSync, chmodSync } = await import('fs');
  const { execSync } = await import('child_process');

  ff.setFfmpegPath(inst.path);

  // Use installed ffprobe if executable, otherwise fall back to system ffprobe
  let probePath = probe.path;
  try {
    execSync(`"${probePath}" -version`, { stdio: 'pipe' });
  } catch {
    try { chmodSync(probePath, 0o755); } catch { /* ignore */ }
    try {
      execSync(`"${probePath}" -version`, { stdio: 'pipe' });
    } catch {
      // Fall back to system ffprobe
      probePath = '/usr/bin/ffprobe';
    }
  }
  ff.setFfprobePath(probePath);
  _ffmpeg = ff;
  return ff;
}

const WIDTH = 1920;
const HEIGHT = 1080;

// Segment colors — each segment type gets a consistent accent
const SEGMENT_COLORS: Record<string, string> = {
  intro: '#3b82f6',
  concept: '#8b5cf6',
  visual: '#10b981',
  application: '#f59e0b',
  wrapup: '#3b82f6',
};

// Cycle concept slide accents so they're not all the same
const CONCEPT_ACCENTS = ['#8b5cf6', '#6366f1', '#7c3aed', '#4f46e5'];

interface RenderOptions {
  instructorImagePath: string;
  instructorName: string;
  instructorTitle: string;
  courseName: string;
  moduleNumber: number;
  moduleName: string;
  lessonNumber: number;
}

/**
 * Render a single slide frame to PNG.
 */
async function renderSlideFrame(
  slide: LessonSlide,
  slideIndex: number,
  totalSlides: number,
  opts: RenderOptions,
): Promise<Buffer> {
  await ensureDeps();
  const canvas = _createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Accent color based on segment
  let accent = SEGMENT_COLORS[slide.segment] || '#3b82f6';
  if (slide.segment === 'concept') {
    accent = CONCEPT_ACCENTS[slideIndex % CONCEPT_ACCENTS.length];
  }

  // Top bar — module/lesson indicator
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(0, 0, WIDTH, 50);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Module ${opts.moduleNumber}: ${opts.moduleName}  |  Lesson ${opts.lessonNumber}  |  Slide ${slideIndex + 1}/${totalSlides}`,
    20, 25
  );

  // Accent bar under top
  ctx.fillStyle = accent;
  ctx.fillRect(0, 50, WIDTH, 4);

  // Slide content area — left 65%
  const contentX = 60;
  const contentY = 80;
  const contentWidth = Math.round(WIDTH * 0.62);

  // Slide title
  ctx.fillStyle = accent;
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Word-wrap title if needed
  const titleLines = wrapText(ctx, slide.title, contentWidth - 40, 56);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, contentX, contentY + i * 64);
  });

  // Divider
  const dividerY = contentY + titleLines.length * 64 + 12;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(contentX, dividerY);
  ctx.lineTo(contentX + contentWidth - 40, dividerY);
  ctx.stroke();

  // Bullets
  const bulletStartY = dividerY + 24;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '40px Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 3;

  let currentY = bulletStartY;
  for (const bullet of slide.bullets.slice(0, 5)) {
    // Bullet marker
    ctx.fillStyle = accent;
    ctx.font = 'bold 40px Arial';
    ctx.fillText('•', contentX, currentY);

    // Bullet text — word-wrapped
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '40px Arial';
    const bulletLines = wrapText(ctx, bullet, contentWidth - 100, 40);
    bulletLines.forEach((line, i) => {
      ctx.fillText(line, contentX + 40, currentY + i * 50);
    });
    currentY += bulletLines.length * 50 + 20;

    // Don't overflow past the instructor area
    if (currentY > HEIGHT - 200) break;
  }

  // Instructor block — right side, vertically centered
  const instrBlockW = Math.round(WIDTH * 0.28);
  const instrBlockX = WIDTH - instrBlockW - 30;
  const instrBlockY = 80;
  const instrBlockH = HEIGHT - 140;

  // Card background
  ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
  ctx.shadowBlur = 0;
  roundRect(ctx, instrBlockX, instrBlockY, instrBlockW, instrBlockH, 16);
  ctx.fill();

  // Instructor photo — circular
  try {
    const img = await _loadImage(opts.instructorImagePath);
    const circleRadius = Math.round(instrBlockW * 0.3);
    const circleCX = instrBlockX + instrBlockW / 2;
    const circleCY = instrBlockY + instrBlockH / 2 - 40;

    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const imgSize = circleRadius * 2;
    const imgAspect = img.width / img.height;
    let drawW: number, drawH: number;
    if (imgAspect > 1) { drawH = imgSize; drawW = imgSize * imgAspect; }
    else { drawW = imgSize; drawH = imgSize / imgAspect; }
    ctx.drawImage(img, circleCX - drawW / 2, circleCY - drawH / 2, drawW, drawH);
    ctx.restore();

    // Circle border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(opts.instructorName, circleCX, circleCY + circleRadius + 16);

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px Arial';
    ctx.fillText(opts.instructorTitle, circleCX, circleCY + circleRadius + 44);
  } catch {
    // Fallback — just show name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(opts.instructorName, instrBlockX + instrBlockW / 2, instrBlockY + instrBlockH / 2);
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, HEIGHT - 44, WIDTH, 44);
  ctx.fillStyle = '#64748b';
  ctx.font = '17px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Elevate for Humanity  |  ${opts.courseName}`, 20, HEIGHT - 22);

  // Progress indicator
  const progressWidth = 200;
  const progressX = WIDTH - progressWidth - 20;
  const progressY = HEIGHT - 30;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, progressX, progressY, progressWidth, 8, 4);
  ctx.fill();
  ctx.fillStyle = accent;
  const filled = ((slideIndex + 1) / totalSlides) * progressWidth;
  roundRect(ctx, progressX, progressY, filled, 8, 4);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

/**
 * Render a full multi-slide lesson video.
 *
 * Each slide gets proportional time based on its segment:
 *   intro: ~20s, concept: ~60s each, visual: ~90s, application: ~45s, wrapup: ~20s
 * Adjusted to match total audio duration.
 */
export async function renderLessonVideo(
  slides: LessonSlide[],
  audioPath: string,
  outputPath: string,
  opts: RenderOptions,
): Promise<{ duration: number; fileSize: number }> {
  const ffmpeg = await getFFmpeg();
  const tempDir = path.join(path.dirname(outputPath), `slides-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  // Get audio duration — fail loudly if ffprobe can't read the file
  const audioDuration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err: any, meta: any) => {
      if (err) {
        // Try system ffprobe as last resort
        // execSync imported at top of file
        try {
          const out = execSync(
            `ffprobe -v quiet -print_format json -show_format "${audioPath}"`,
            { encoding: 'utf-8' },
          );
          const dur = JSON.parse(out)?.format?.duration;
          if (dur) return resolve(Math.ceil(parseFloat(dur)));
        } catch { /* fall through */ }
        return reject(new Error(`ffprobe failed on audio: ${audioPath}`));
      }
      resolve(Math.ceil(meta.format.duration));
    });
  });

  // Assign time per slide based on segment weights
  const weights: Record<string, number> = {
    intro: 20,
    concept: 60,
    visual: 90,
    application: 45,
    wrapup: 20,
  };

  const totalWeight = slides.reduce((s, sl) => s + (weights[sl.segment] || 40), 0);
  const slideDurations = slides.map(sl => {
    const w = weights[sl.segment] || 40;
    return Math.max(5, Math.round((w / totalWeight) * audioDuration));
  });

  // Adjust to match exact audio duration
  const totalAssigned = slideDurations.reduce((s, d) => s + d, 0);
  const diff = audioDuration - totalAssigned;
  if (diff !== 0) {
    // Add/subtract from the longest concept slide
    const longestIdx = slideDurations.indexOf(Math.max(...slideDurations));
    slideDurations[longestIdx] += diff;
  }

  // Render each slide frame
  const framePaths: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const buf = await renderSlideFrame(slides[i], i, slides.length, opts);
    const framePath = path.join(tempDir, `slide-${i}.png`);
    await fs.writeFile(framePath, buf);
    framePaths.push(framePath);
  }

  // Build FFmpeg concat filter — each slide shown for its duration
  // Create individual slide videos first, then concat
  const slideVideos: string[] = [];
  for (let i = 0; i < framePaths.length; i++) {
    const slideVideo = path.join(tempDir, `slide-${i}.mp4`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(framePaths[i])
        .inputOptions(['-loop', '1'])
        .outputOptions([
          '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
          '-r', '30', '-t', slideDurations[i].toString(),
          '-pix_fmt', 'yuv420p', '-an',
        ])
        .output(slideVideo)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
    slideVideos.push(slideVideo);
  }

  // Convert to transport stream for concat
  const tsPaths: string[] = [];
  for (let i = 0; i < slideVideos.length; i++) {
    const tsPath = path.join(tempDir, `slide-${i}.ts`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(slideVideos[i])
        .outputOptions(['-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts'])
        .output(tsPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
    tsPaths.push(tsPath);
  }

  // Concat all slides into one video (no audio yet)
  const silentVideo = path.join(tempDir, 'silent.mp4');
  const concatInput = 'concat:' + tsPaths.join('|');
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatInput)
      .outputOptions(['-c', 'copy'])
      .output(silentVideo)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });

  // Merge audio with video
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(silentVideo)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });

  // Get final file info
  const fileStat = await fs.stat(outputPath);
  const finalDuration = await new Promise<number>((resolve) => {
    ffmpeg.ffprobe(outputPath, (err: any, meta: any) => {
      resolve(err ? audioDuration : Math.round(meta.format.duration));
    });
  });

  // Cleanup temp
  await fs.rm(tempDir, { recursive: true, force: true });

  return { duration: finalDuration, fileSize: fileStat.size };
}

// --- Helpers ---

function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current + (current ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
