#!/usr/bin/env node
/**
 * Generate Intro Video with TTS
 * Creates an engaging intro video for Elevate for Humanity
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Engaging script for Elevate for Humanity
const SCRIPT = `Welcome to Elevate for Humanity.

We're more than a training provider. We're a community-based workforce philanthropy, transforming lives through education and opportunity.

From Marion County to communities across Indiana, we connect people to 100% funded career training. No tuition. No debt. Just real pathways to meaningful careers.

Whether you're starting fresh, making a change, or getting a second chance, we're here to elevate your future.

Because when you rise, we all rise.

Elevate for Humanity. Your partner in career transformation.`;

async function generateTTS() {
  const outputDir = path.join(__dirname, '..', 'public', 'videos');
  const audioPath = path.join(outputDir, 'intro-voiceover.mp3');

  // Ensure directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Use edge-tts to generate audio
  // Using a professional, warm voice
  const voice = 'en-US-GuyNeural'; // Professional male voice
  // Alternative voices:
  // 'en-US-JennyNeural' - Professional female
  // 'en-US-AriaNeural' - Warm female

  try {
    // Generate TTS using edge-tts CLI
    const command = `npx edge-tts --voice "${voice}" --text "${SCRIPT.replace(/"/g, '\\"')}" --write-media "${audioPath}"`;

    await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: path.join(__dirname, '..'),
    });

    // Get audio duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
    );
    const duration = parseFloat(stdout.trim());

    return { audioPath, duration };
  } catch (error) {
    console.error('Error generating TTS:', error);
    throw error;
  }
}

async function combineWithVideo(audioPath, duration) {
  const videoDir = path.join(__dirname, '..', 'public', 'videos');
  const inputVideo = path.join(videoDir, 'logo-animation.mp4');
  const outputVideo = path.join(videoDir, 'intro-with-audio.mp4');

  // Check if input video exists
  try {
    await fs.access(inputVideo);
  } catch {
    return null;
  }

  // Get video duration
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputVideo}"`,
  );
  const videoDuration = parseFloat(stdout.trim());

  // Loop video if audio is longer, or trim audio if video is longer
  let ffmpegCommand;

  if (duration > videoDuration) {
    // Loop video to match audio length
    const loops = Math.ceil(duration / videoDuration);

    ffmpegCommand = `ffmpeg -stream_loop ${loops - 1} -i "${inputVideo}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputVideo}" -y`;
  } else {
    // Trim audio to match video length

    ffmpegCommand = `ffmpeg -i "${inputVideo}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -t ${videoDuration} "${outputVideo}" -y`;
  }

  try {
    await execAsync(ffmpegCommand, {
      maxBuffer: 50 * 1024 * 1024,
    });

    return outputVideo;
  } catch (error) {
    console.error('Error combining video:', error);
    throw error;
  }
}

async function main() {
  try {
    // Generate TTS
    const { audioPath, duration } = await generateTTS();

    // Combine with video
    const videoPath = await combineWithVideo(audioPath, duration);

    if (videoPath) {
    } else {
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
