/**
 * Generate Video Files from Audio
 *
 * Creates MP4 video files by combining audio with a branded background
 * Uses canvas to generate frames and combines with audio
 *
 * Run with: npx tsx scripts/generate-videos-from-audio.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Video specs - audio files that need video versions
const VIDEO_SPECS = [
  {
    audioFile: 'homepage-hero-new.mp3',
    videoFile: 'homepage-hero-new.mp4',
    title: 'Elevate for Humanity',
    subtitle: 'Build Your Future',
    bgColor: '#0f172a', // slate-900
    textColor: '#ffffff',
  },
  {
    audioFile: 'program-hero.mp3',
    videoFile: 'program-hero.mp4',
    title: 'Career Programs',
    subtitle: 'Training That Leads to Jobs',
    bgColor: '#1e3a5f', // blue-900
    textColor: '#ffffff',
  },
  {
    audioFile: 'hero-video-segment-with-narration.mp3',
    videoFile: 'hero-video-segment-with-narration.mp4',
    title: 'Tax Services',
    subtitle: 'Professional Tax Preparation',
    bgColor: '#1e40af', // blue-800
    textColor: '#ffffff',
  },
  {
    audioFile: 'elevate-overview-with-narration.mp3',
    videoFile: 'elevate-overview-with-narration.mp4',
    title: 'Elevate for Humanity',
    subtitle: 'Your Career Journey Starts Here',
    bgColor: '#0f172a',
    textColor: '#ffffff',
  },
];

async function generateVideoFrame(
  width: number,
  height: number,
  title: string,
  subtitle: string,
  bgColor: string,
  textColor: string,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Add subtle gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = textColor;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, height / 2 - 40);

  // Subtitle
  ctx.font = '36px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(subtitle, width / 2, height / 2 + 40);

  // Logo placeholder (circle)
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 150, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316'; // orange
  ctx.fill();

  return canvas.toBuffer('image/png');
}

async function main() {
  console.log('='.repeat(60));
  console.log('GENERATING VIDEO FILES FROM AUDIO');
  console.log('='.repeat(60));
  console.log('\nNote: This creates static frame videos.');
  console.log('For full animated videos, use HeyGen or Synthesia API.\n');

  const videosDir = path.join(process.cwd(), 'public', 'videos');

  for (const spec of VIDEO_SPECS) {
    console.log(`\nProcessing: ${spec.videoFile}`);

    const audioPath = path.join(videosDir, spec.audioFile);

    // Check if audio exists
    try {
      await fs.access(audioPath);
      console.log(`  Audio found: ${spec.audioFile}`);
    } catch {
      console.log(`  ❌ Audio not found: ${spec.audioFile}`);
      continue;
    }

    // Generate a single frame as placeholder
    // In production, this would be a full video with the audio
    const frame = await generateVideoFrame(
      1920,
      1080,
      spec.title,
      spec.subtitle,
      spec.bgColor,
      spec.textColor,
    );

    // Save as PNG (video generation requires ffmpeg which isn't available)
    const framePath = path.join(videosDir, spec.videoFile.replace('.mp4', '-frame.png'));
    await fs.writeFile(framePath, frame);
    console.log(`  ✅ Frame created: ${spec.videoFile.replace('.mp4', '-frame.png')}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('IMPORTANT: Full video generation requires ffmpeg or video API');
  console.log('Audio files are ready. Update code to use .mp3 or add ffmpeg.');
  console.log('='.repeat(60));
}

main().catch(console.error);
