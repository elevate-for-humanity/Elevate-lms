/**
 * Lesson Video Renderer — v2
 *
 * Layout: left 58% large photo panel, right 42% dark text panel.
 * Text panel: white title, progressive bullet highlights, pointer line to image.
 * Spec: 1920x1080, 30fps, H.264, AAC.
 */

import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import type { LessonSlide } from '../lib/autopilot/lesson-script-generator';

const IMAGE_CACHE_DIR = path.join(process.cwd(), 'public', 'videos', 'slide-image-cache');

async function fetchSlideImage(prompt: string | undefined): Promise<string | null> {
  if (!prompt) return null;
  const cacheKey = crypto.createHash('md5').update(prompt).digest('hex');
  const cachePath = path.join(IMAGE_CACHE_DIR, `${cacheKey}.jpg`);
  if (fssync.existsSync(cachePath)) return cachePath;
  await fs.mkdir(IMAGE_CACHE_DIR, { recursive: true });

  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: pexelsKey } },
      );
      if (res.ok) {
        const data = await res.json() as { photos: { src: { large: string } }[] };
        const url = data.photos?.[0]?.src?.large;
        if (url) {
          const img = await fetch(url);
          if (img.ok) {
            await fs.writeFile(cachePath, Buffer.from(await img.arrayBuffer()));
            return cachePath;
          }
        }
      }
    } catch { /* fall through */ }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Photorealistic professional training photo: ${prompt}. Clean, well-lit, no text overlays.`,
          n: 1, size: '1792x1024', quality: 'standard', style: 'natural',
        }),
      });
      if (res.ok) {
        const data = await res.json() as { data: { url: string }[] };
        const url = data.data?.[0]?.url;
        if (url) {
          const img = await fetch(url);
          if (img.ok) {
            await fs.writeFile(cachePath, Buffer.from(await img.arrayBuffer()));
            return cachePath;
          }
        }
      }
    } catch { /* fall through */ }
  }
  return null;
}

let _createCanvas: any;
let _loadImage: any;

async function ensureDeps() {
  if (_createCanvas) return;
  const canvas = await import('canvas');
  _createCanvas = canvas.createCanvas;
  _loadImage = canvas.loadImage;
}

const WIDTH  = 1920;
const HEIGHT = 1080;
const VIS_W  = Math.round(WIDTH * 0.58);
const TXT_X  = VIS_W;
const TXT_W  = WIDTH - VIS_W;
const TXT_PAD = 48;

const SEGMENT_COLORS: Record<string, string> = {
  intro: '#f59e0b', concept: '#3b82f6', technique: '#10b981',
  application: '#8b5cf6', wrapup: '#f59e0b',
};
const CONCEPT_ACCENTS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

export interface RenderOptions {
  courseName: string;
  moduleName: string;
  moduleNumber: number;
  lessonNumber: number;
  instructorName: string;
  instructorTitle: string;
  instructorImagePath: string;
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
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

// Pointer line from text panel edge into the visual panel
function drawPointerLine(
  ctx: any,
  fromY: number,
  toRelX: number, toRelY: number,
  accent: string,
) {
  const fromX = TXT_X + 4;
  const toX = toRelX * VIS_W;
  const toY = toRelY * HEIGHT;

  ctx.save();
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  const cpX = (fromX + toX) / 2;
  ctx.bezierCurveTo(cpX, fromY, cpX, toY, toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pulsing target rings
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(toX, toY, 32, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(toX, toY, 16, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(toX, toY, 7, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.restore();
}

async function renderSlideFrame(
  slide: LessonSlide,
  slideIndex: number,
  totalSlides: number,
  opts: RenderOptions,
  imagePath: string | null,
  activeBulletIndex: number = -1,
): Promise<Buffer> {
  await ensureDeps();
  const canvas = _createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const accent = slide.segment === 'concept'
    ? CONCEPT_ACCENTS[slideIndex % CONCEPT_ACCENTS.length]
    : (SEGMENT_COLORS[slide.segment] || '#f59e0b');

  // ── LEFT — visual panel ───────────────────────────────────────────────────
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, VIS_W, HEIGHT);

  if (imagePath) {
    try {
      const img = await _loadImage(imagePath);
      const imgAspect = img.width / img.height;
      const panelAspect = VIS_W / HEIGHT;
      let dw: number, dh: number, dx: number, dy: number;
      if (imgAspect > panelAspect) {
        dh = HEIGHT; dw = HEIGHT * imgAspect;
        dx = -(dw - VIS_W) / 2; dy = 0;
      } else {
        dw = VIS_W; dh = VIS_W / imgAspect;
        dx = 0; dy = -(dh - HEIGHT) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);

      // Right-edge vignette blending into text panel
      const vig = ctx.createLinearGradient(VIS_W - 160, 0, VIS_W, 0);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(10,15,30,0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(VIS_W - 160, 0, 160, HEIGHT);

      // Bottom vignette
      const bot = ctx.createLinearGradient(0, HEIGHT - 140, 0, HEIGHT);
      bot.addColorStop(0, 'rgba(0,0,0,0)');
      bot.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = bot;
      ctx.fillRect(0, HEIGHT - 140, VIS_W, 140);
    } catch { /* keep dark bg */ }
  } else {
    // Instructor photo centered
    try {
      const img = await _loadImage(opts.instructorImagePath);
      const size = Math.round(VIS_W * 0.5);
      const ix = (VIS_W - size) / 2;
      const iy = (HEIGHT - size) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(VIS_W / 2, HEIGHT / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, ix, iy, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(VIS_W / 2, HEIGHT / 2, size / 2 + 5, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.stroke();
    } catch {
      ctx.fillStyle = accent + '18';
      ctx.fillRect(0, 0, VIS_W, HEIGHT);
    }
  }

  // Slide counter badge
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 20, HEIGHT - 58, 110, 38, 8);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = 'bold 19px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${slideIndex + 1} / ${totalSlides}`, 75, HEIGHT - 39);

  // Progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, HEIGHT - 6, VIS_W, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(0, HEIGHT - 6, (VIS_W * (slideIndex + 1)) / totalSlides, 6);

  // ── RIGHT — text panel ────────────────────────────────────────────────────
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(TXT_X, 0, TXT_W, HEIGHT);

  // Accent left border
  ctx.fillStyle = accent;
  ctx.fillRect(TXT_X, 0, 5, HEIGHT);

  // Segment tag
  ctx.fillStyle = accent + '28';
  roundRect(ctx, TXT_X + TXT_PAD, 28, 150, 34, 7);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(slide.segment.toUpperCase(), TXT_X + TXT_PAD + 14, 45);

  // Module label top right
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '15px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(opts.moduleName, TXT_X + TXT_W - TXT_PAD, 45);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  const titleLines = wrapText(ctx, slide.title, TXT_W - TXT_PAD * 2);
  titleLines.forEach((line, i) => ctx.fillText(line, TXT_X + TXT_PAD, 100 + i * 56));
  ctx.shadowBlur = 0;

  // Divider
  const divY = 100 + titleLines.length * 56 + 18;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TXT_X + TXT_PAD, divY);
  ctx.lineTo(TXT_X + TXT_W - TXT_PAD, divY);
  ctx.stroke();

  // Bullets with progressive highlight
  const bullets = slide.bullets.slice(0, 4);
  const pointerTargets: [number, number][] = [
    [0.22, 0.28], [0.55, 0.5], [0.72, 0.38], [0.38, 0.72],
  ];

  let bulletY = divY + 30;
  const maxBulletW = TXT_W - TXT_PAD * 2 - 40;

  for (let bi = 0; bi < bullets.length; bi++) {
    const isActive = bi === activeBulletIndex;
    const isDone   = bi < activeBulletIndex;
    const bLines   = wrapText(ctx, bullets[bi], maxBulletW);
    const rowH     = bLines.length * 46 + 20;

    // Active row highlight
    if (isActive) {
      ctx.fillStyle = accent + '20';
      roundRect(ctx, TXT_X + TXT_PAD - 10, bulletY - 10, TXT_W - TXT_PAD * 2 + 20, rowH, 10);
      ctx.fill();
    }

    // Bullet indicator
    const dotX = TXT_X + TXT_PAD + 10;
    const dotY = bulletY + 18;
    ctx.beginPath();
    ctx.arc(dotX, dotY, isActive ? 9 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? accent : (isDone ? accent + '80' : 'rgba(255,255,255,0.25)');
    ctx.fill();

    // Text
    ctx.fillStyle = isActive ? '#ffffff' : (isDone ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.45)');
    ctx.font = isActive ? 'bold 35px Arial' : '35px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    bLines.forEach((line, li) => {
      ctx.fillText(line, TXT_X + TXT_PAD + 32, bulletY + li * 46);
    });

    // Pointer line for active bullet
    if (isActive && imagePath && bi < pointerTargets.length) {
      const [rx, ry] = pointerTargets[bi];
      drawPointerLine(ctx, dotY, rx, ry, accent);
    }

    bulletY += rowH;
    if (bulletY > HEIGHT - 120) break;
  }

  // Instructor footer
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(TXT_X, HEIGHT - 76, TXT_W, 76);
  ctx.fillStyle = accent;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.instructorName, TXT_X + TXT_PAD, HEIGHT - 46);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '15px Arial';
  ctx.fillText(opts.instructorTitle, TXT_X + TXT_PAD, HEIGHT - 24);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('Elevate for Humanity', TXT_X + TXT_W - TXT_PAD, HEIGHT - 35);

  return canvas.toBuffer('image/png');
}

export async function renderSlideFrameForPreview(
  slide: LessonSlide,
  slideIndex: number,
  totalSlides: number,
  opts: RenderOptions,
): Promise<Buffer> {
  const imagePath = await fetchSlideImage(slide.imagePrompt).catch(() => null);
  return renderSlideFrame(slide, slideIndex, totalSlides, opts, imagePath, 0);
}

async function getFFmpeg() {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  try {
    const ffmpegPath = (await import('@ffmpeg-installer/ffmpeg')).path;
    ffmpeg.setFfmpegPath(ffmpegPath);
  } catch { /* use system ffmpeg */ }
  return ffmpeg;
}

export async function renderLessonVideo(
  slides: LessonSlide[],
  audioPath: string,
  outputPath: string,
  opts: RenderOptions,
): Promise<{ duration: number; fileSize: number }> {
  const ffmpeg = await getFFmpeg();
  const tempDir = path.join(path.dirname(outputPath), `slides-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const audioDuration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err: any, meta: any) => {
      if (err) {
        try {
          const out = execSync(`ffprobe -v quiet -print_format json -show_format "${audioPath}"`, { encoding: 'utf-8' });
          const dur = JSON.parse(out)?.format?.duration;
          if (dur) return resolve(Math.ceil(parseFloat(dur)));
        } catch { /* fall through */ }
        return reject(new Error(`ffprobe failed: ${audioPath}`));
      }
      resolve(Math.ceil(meta.format.duration));
    });
  });

  const weights: Record<string, number> = {
    intro: 20, concept: 60, technique: 50, application: 45, wrapup: 20,
  };
  const totalWeight = slides.reduce((s, sl) => s + (weights[sl.segment] || 40), 0);
  const slideDurations = slides.map(sl =>
    Math.max(5, Math.round(((weights[sl.segment] || 40) / totalWeight) * audioDuration))
  );
  const totalAssigned = slideDurations.reduce((s, d) => s + d, 0);
  const diff = audioDuration - totalAssigned;
  if (diff !== 0) slideDurations[slideDurations.indexOf(Math.max(...slideDurations))] += diff;

  const slideImages = await Promise.all(
    slides.map(slide => fetchSlideImage(slide.imagePrompt).catch(() => null))
  );

  // Build frames: intro frame + one frame per bullet per slide
  const framePaths: string[] = [];
  const frameDurations: number[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const totalDur = slideDurations[i];
    const bulletCount = Math.max(1, slide.bullets.slice(0, 4).length);
    const introTime = Math.max(1, Math.round(totalDur * 0.12));
    const perBullet = Math.max(1, Math.round((totalDur - introTime) / bulletCount));

    // Intro frame
    const introBuf = await renderSlideFrame(slide, i, slides.length, opts, slideImages[i], -1);
    const introPath = path.join(tempDir, `f${i}-intro.png`);
    await fs.writeFile(introPath, introBuf);
    framePaths.push(introPath);
    frameDurations.push(introTime);

    // Per-bullet frames
    for (let bi = 0; bi < bulletCount; bi++) {
      const buf = await renderSlideFrame(slide, i, slides.length, opts, slideImages[i], bi);
      const fp = path.join(tempDir, `f${i}-b${bi}.png`);
      await fs.writeFile(fp, buf);
      framePaths.push(fp);
      const isLast = bi === bulletCount - 1;
      frameDurations.push(isLast
        ? Math.max(1, totalDur - introTime - perBullet * (bulletCount - 1))
        : perBullet
      );
    }
  }

  // Render each frame as a clip
  const slideVideos: string[] = [];
  for (let i = 0; i < framePaths.length; i++) {
    const sv = path.join(tempDir, `clip-${i}.mp4`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(framePaths[i]).inputOptions(['-loop', '1'])
        .outputOptions(['-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
          '-r', '30', '-t', Math.max(1, frameDurations[i]).toString(),
          '-pix_fmt', 'yuv420p', '-an'])
        .output(sv)
        .on('end', () => resolve()).on('error', (e: Error) => reject(e)).run();
    });
    slideVideos.push(sv);
  }

  // TS wrap for concat
  const tsPaths: string[] = [];
  for (let i = 0; i < slideVideos.length; i++) {
    const ts = path.join(tempDir, `clip-${i}.ts`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg().input(slideVideos[i])
        .outputOptions(['-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts'])
        .output(ts).on('end', () => resolve()).on('error', (e: Error) => reject(e)).run();
    });
    tsPaths.push(ts);
  }

  const silentVideo = path.join(tempDir, 'silent.mp4');
  await new Promise<void>((resolve, reject) => {
    ffmpeg().input('concat:' + tsPaths.join('|'))
      .outputOptions(['-c', 'copy']).output(silentVideo)
      .on('end', () => resolve()).on('error', (e: Error) => reject(e)).run();
  });

  // Re-encode video so the muxer can write moov at the front (+faststart).
  // Use execSync (blocking) — fluent-ffmpeg's async wrapper can exit before the
  // child process finishes on long videos, leaving a corrupt file with no moov atom.
  const tmpOut = outputPath + '.tmp.mp4';
  execSync(
    `ffmpeg -y -i "${silentVideo}" -i "${audioPath}" ` +
    `-c:v libx264 -crf 22 -preset fast -pix_fmt yuv420p ` +
    `-c:a aac -b:a 128k -ar 48000 ` +
    `-shortest -movflags +faststart ` +
    `"${tmpOut}"`,
    { stdio: 'pipe' },
  );
  // Atomic rename so a partial encode never overwrites a good file
  await fs.rename(tmpOut, outputPath);

  const fileStat = await fs.stat(outputPath);
  const finalDuration = await new Promise<number>(resolve => {
    ffmpeg.ffprobe(outputPath, (err: any, meta: any) => resolve(err ? audioDuration : Math.round(meta.format.duration)));
  });

  await fs.rm(tempDir, { recursive: true, force: true });
  return { duration: finalDuration, fileSize: fileStat.size };
}
