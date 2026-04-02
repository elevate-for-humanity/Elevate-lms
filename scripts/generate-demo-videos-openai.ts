/**
 * Generate demo walkthrough videos using OpenAI TTS + ffmpeg.
 * Each video = instructor photo + narration audio → real MP4.
 * No D-ID required.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path as string;

const OUT_DIR   = 'public/videos/demo';
const AUDIO_DIR = `${OUT_DIR}/audio`;
const PHOTO     = 'public/images/team/instructors/instructor-trades.jpg';

mkdirSync(OUT_DIR,   { recursive: true });
mkdirSync(AUDIO_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Scene definitions — id must match scenes.ts videoSrc paths
// ---------------------------------------------------------------------------
const SCENES = [
  {
    id: 'admin-overview',
    title: 'Admin Dashboard Overview',
    prompt: `You are narrating a 50-second walkthrough of the Elevate for Humanity admin dashboard for workforce training. Describe: real-time enrollment stats, program health indicators, pending applications, and quick-action buttons. Speak clearly and professionally. No filler words.`,
  },
  {
    id: 'admin-applications',
    title: 'Application Management',
    prompt: `Narrate a 50-second walkthrough of the admin applications queue. Cover: filtering by status (pending/approved/denied), reviewing applicant documents, approving or denying with one click, and bulk actions. Professional tone.`,
  },
  {
    id: 'admin-compliance',
    title: 'WIOA Compliance Dashboard',
    prompt: `Narrate a 50-second walkthrough of the WIOA compliance dashboard. Cover: participant eligibility tracking, documentation status, reporting deadlines, and automated compliance alerts. Professional tone.`,
  },
  {
    id: 'admin-enrollment',
    title: 'Enrollment Management',
    prompt: `Narrate a 50-second walkthrough of the enrollment management screen. Cover: enrolling a learner into a program, setting cohort dates, tracking enrollment status, and sending confirmation emails. Professional tone.`,
  },
  {
    id: 'learner-overview',
    title: 'Learner Dashboard',
    prompt: `Narrate a 50-second walkthrough of the learner dashboard on Elevate for Humanity. Cover: course progress, upcoming lessons, achievement badges, and quick links to resume learning. Encouraging and clear tone.`,
  },
  {
    id: 'learner-course',
    title: 'Course Experience',
    prompt: `Narrate a 50-second walkthrough of the LMS course page. Cover: the module accordion, lesson types (video, reading, flashcards, checkpoint quiz), progress tracking, and the activity menu. Clear and motivating tone.`,
  },
  {
    id: 'learner-certificates',
    title: 'Credentials & Certificates',
    prompt: `Narrate a 50-second walkthrough of the learner credentials page. Cover: earned certificates, credential verification links, downloadable PDFs, and the certification pathway. Professional and encouraging tone.`,
  },
  {
    id: 'employer-overview',
    title: 'Employer Portal Overview',
    prompt: `Narrate a 50-second walkthrough of the employer portal on Elevate for Humanity. Cover: posting jobs, browsing trained candidates, tracking apprenticeship hours, and WOTC tax incentive tools. Professional tone.`,
  },
  {
    id: 'employer-candidates',
    title: 'Candidate Pipeline',
    prompt: `Narrate a 50-second walkthrough of the employer candidate pipeline. Cover: filtering graduates by credential, reviewing profiles, sending interview requests, and tracking hiring outcomes. Professional tone.`,
  },
  {
    id: 'wioa-overview',
    title: 'WIOA Funding Overview',
    prompt: `Narrate a 50-second walkthrough of the WIOA funding management tools. Cover: eligibility determination, funding authorization, IEP tracking, and DOL reporting exports. Professional and authoritative tone.`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function generateAudio(text: string, outPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice: 'onyx',
      input: text,
      speed: 0.95,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS error: ${err}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

async function generateScript(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You write concise, professional video narration scripts. Output only the spoken words — no stage directions, no timestamps, no labels. 80–100 words maximum.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`GPT error: ${await res.text()}`);
  const json = await res.json() as any;
  return json.choices[0].message.content.trim();
}

function makeVideo(photoPath: string, audioPath: string, outPath: string): void {
  // Combine still image + audio into MP4
  // -loop 1: loop the image, -i audio, -shortest: end when audio ends
  // -vf scale: ensure even dimensions for h264
  const cmd = [
    FFMPEG,
    '-y',
    '-loop 1',
    `-i "${photoPath}"`,
    `-i "${audioPath}"`,
    '-c:v libx264',
    '-tune stillimage',
    '-c:a aac',
    '-b:a 192k',
    '-pix_fmt yuv420p',
    '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"',
    '-shortest',
    `"${outPath}"`,
  ].join(' ');
  execSync(cmd, { stdio: 'pipe' });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!OPENAI_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!existsSync(PHOTO)) { console.error(`Instructor photo not found: ${PHOTO}`); process.exit(1); }

  console.log(`Generating ${SCENES.length} demo videos (OpenAI TTS + ffmpeg)...\n`);

  for (const scene of SCENES) {
    const videoPath = join(OUT_DIR, `demo-${scene.id}.mp4`);
    const audioPath = join(AUDIO_DIR, `demo-${scene.id}.mp3`);

    if (existsSync(videoPath)) {
      console.log(`⏭  ${scene.title} — already exists, skipping`);
      continue;
    }

    console.log(`▶ ${scene.title} (${scene.id})`);

    try {
      // 1. Generate script
      process.stdout.write('  1/3 Generating script... ');
      const script = await generateScript(scene.prompt);
      console.log(`${script.split(' ').length} words`);

      // 2. Generate audio
      process.stdout.write('  2/3 Generating audio... ');
      await generateAudio(script, audioPath);
      console.log(`saved`);

      // 3. Combine into video
      process.stdout.write('  3/3 Rendering video... ');
      makeVideo(PHOTO, audioPath, videoPath);
      console.log(`✅ ${videoPath}`);

    } catch (err: any) {
      console.error(`\n  ❌ Failed: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main();
