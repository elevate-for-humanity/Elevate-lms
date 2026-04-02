/**
 * Generate D-ID talking-head walkthrough videos for the platform demo pages.
 *
 * Pipeline per scene:
 *   1. GPT-4o writes a 45–60 second narration script for the scene
 *   2. OpenAI TTS (alloy voice) converts the script to MP3
 *   3. D-ID lip-syncs the instructor photo to the audio
 *   4. MP4 saved to public/videos/demo/[scene-id].mp4
 *
 * Run:
 *   npx tsx scripts/generate-demo-videos.ts
 *   npx tsx scripts/generate-demo-videos.ts --scene admin-overview   (single scene)
 *   npx tsx scripts/generate-demo-videos.ts --dry-run                (print scripts only)
 *
 * Requirements:
 *   - OPENAI_API_KEY in .env.local
 *   - DID_API_KEY in .env.local
 *   - Site deployed OR use --local to upload audio via Supabase
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

import * as fs from 'fs';
import * as path from 'path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DID_KEY    = process.env.DID_API_KEY;
const SITE_URL   = 'https://www.elevateforhumanity.org';
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'videos', 'demo', 'audio');
const VIDEO_DIR = path.join(process.cwd(), 'public', 'videos', 'demo');
const PHOTO_URL = `${SITE_URL}/images/team/elizabeth-greene-headshot.jpg`;
const PHOTO_LOCAL = path.join(process.cwd(), 'public', 'images', 'team', 'elizabeth-greene-headshot.jpg');

const DRY_RUN   = process.argv.includes('--dry-run');
const SINGLE    = process.argv.includes('--scene')
  ? process.argv[process.argv.indexOf('--scene') + 1]
  : null;

// ─── Scene Definitions ───────────────────────────────────────────────────────

interface DemoScene {
  id: string;
  title: string;
  portal: 'admin' | 'learner' | 'employer' | 'wioa';
  scriptPrompt: string;
}

const SCENES: DemoScene[] = [
  // ── Admin Portal ──────────────────────────────────────────────────────────
  {
    id: 'admin-overview',
    title: 'Admin Dashboard Overview',
    portal: 'admin',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate for Humanity admin dashboard.
      The admin portal is used by Elevate staff to manage workforce training programs.
      Cover: the main dashboard stats (active enrollments, applications pending, compliance alerts),
      the left navigation (Applications, Enrollments, Programs, Compliance, Reports, Funding),
      and how staff use it daily to track student progress and workforce outcomes.
      Tone: professional, confident, clear. No filler words. Speak directly to a potential partner or employer watching this demo.
    `,
  },
  {
    id: 'admin-applications',
    title: 'Application Management',
    portal: 'admin',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate application management system.
      Cover: how applications come in from the public site, how staff review eligibility,
      how WIOA and WRG funding sources are matched to applicants,
      how staff approve or defer applications, and how the intake pipeline moves students
      from applicant to enrolled learner.
      Tone: professional, confident, clear. No filler words.
    `,
  },
  {
    id: 'admin-compliance',
    title: 'Compliance & Reporting',
    portal: 'admin',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate compliance and reporting tools.
      Cover: WIOA documentation requirements, how the system auto-generates compliance reports
      for workforce boards, attendance tracking, credential verification,
      and how audit-ready records are maintained for DOL registered apprenticeship programs.
      Tone: professional, confident, clear. No filler words.
    `,
  },
  {
    id: 'admin-enrollment',
    title: 'Enrollment Tracking',
    portal: 'admin',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate enrollment tracking system.
      Cover: how staff monitor student progress across all active programs,
      how completion milestones trigger credential issuance,
      how the system tracks theory hours and OJT hours separately,
      and how program holders and employers are notified when students complete training.
      Tone: professional, confident, clear. No filler words.
    `,
  },

  // ── Learner Portal ────────────────────────────────────────────────────────
  {
    id: 'learner-overview',
    title: 'Learner Dashboard',
    portal: 'learner',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate learner dashboard.
      This is what students see after they enroll in a workforce training program.
      Cover: the course progress tracker, upcoming lessons, checkpoint quizzes,
      the credential pathway showing what certifications they are working toward,
      and how students access their transcript and certificates.
      Tone: warm, encouraging, clear. Speak to a prospective student watching this demo.
    `,
  },
  {
    id: 'learner-course',
    title: 'Course Experience',
    portal: 'learner',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate course experience.
      Cover: the lesson page with video instruction, reading materials, flashcards,
      practice quizzes, and hands-on lab activities. Explain how checkpoint quizzes
      gate module progression, how the AI tutor helps students who get stuck,
      and how completion of all modules triggers automatic certificate issuance.
      Tone: warm, encouraging, clear. No filler words.
    `,
  },
  {
    id: 'learner-certificates',
    title: 'Credentials & Certificates',
    portal: 'learner',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate credentials system.
      Cover: how students earn digital certificates upon program completion,
      how certificates are publicly verifiable at elevateforhumanity.org/verify,
      how credentials are linked to DOL registered apprenticeship records,
      and how employers can verify a candidate's training history instantly.
      Tone: warm, confident, clear. No filler words.
    `,
  },

  // ── Employer Portal ───────────────────────────────────────────────────────
  {
    id: 'employer-overview',
    title: 'Employer Portal Overview',
    portal: 'employer',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate employer portal.
      This is what hiring partners and employers see when they log in.
      Cover: the dashboard showing active apprentices, open job postings,
      available hiring incentives (WOTC, OJT reimbursements), and the candidate pipeline
      of trained graduates ready to hire. Explain how employers post jobs and
      connect directly with credentialed candidates from Elevate programs.
      Tone: professional, direct, results-focused. Speak to an employer watching this demo.
    `,
  },
  {
    id: 'employer-candidates',
    title: 'Candidate Pipeline',
    portal: 'employer',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate candidate pipeline for employers.
      Cover: how employers browse pre-screened, credentialed graduates from Elevate programs,
      how candidate profiles show verified training hours, certifications earned, and program completion,
      how employers can filter by program type and credential,
      and how the hiring workflow connects to OJT reimbursement tracking.
      Tone: professional, direct, results-focused. No filler words.
    `,
  },

  // ── WIOA / Workforce ──────────────────────────────────────────────────────
  {
    id: 'wioa-overview',
    title: 'WIOA & Workforce Funding',
    portal: 'wioa',
    scriptPrompt: `
      You are narrating a 50-second walkthrough of the Elevate WIOA and workforce funding tools.
      Cover: how Elevate is ETPL listed and accepts WIOA Individual Training Accounts,
      how the system tracks WRG, JRI, and other funding sources per participant,
      how compliance documentation is auto-generated for workforce development boards,
      and how program outcomes are reported to meet DOL performance metrics.
      Tone: professional, authoritative, clear. Speak to a workforce board or case manager watching this demo.
    `,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function didHeaders() {
  return {
    Authorization: `Basic ${DID_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function generateScript(scene: DemoScene): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You write concise, professional narration scripts for software product demo videos. Output only the spoken narration — no stage directions, no scene labels, no markdown. 45–60 seconds when read aloud at a natural pace.',
        },
        { role: 'user', content: scene.scriptPrompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`GPT-4o error: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function generateAudio(script: string, outputPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: script,
      voice: 'alloy',
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`TTS error: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buf);
}

async function uploadAudioToSupabase(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/demo-audio/${storagePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
      },
      body: buf,
    }
  );
  if (!res.ok) throw new Error(`Supabase upload failed: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/demo-audio/${storagePath}`;
}

async function submitDIDTalk(audioUrl: string): Promise<string> {
  const res = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: didHeaders() as any,
    body: JSON.stringify({
      source_url: PHOTO_URL,
      script: { type: 'audio', audio_url: audioUrl },
      config: { fluent: true, pad_audio: 0.5, stitch: true },
    }),
  });
  if (!res.ok) throw new Error(`D-ID submit error: ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function pollDIDTalk(talkId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`https://api.d-id.com/talks/${talkId}`, { headers: didHeaders() as any });
    const data = await res.json();
    if (data.status === 'done') return data.result_url;
    if (data.status === 'error') throw new Error(`D-ID failed: ${JSON.stringify(data)}`);
    process.stdout.write('.');
  }
  throw new Error(`D-ID timed out for talk ${talkId}`);
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buf);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function processScene(scene: DemoScene): Promise<void> {
  const videoPath = path.join(VIDEO_DIR, `demo-${scene.id}.mp4`);
  const audioPath = path.join(AUDIO_DIR, `demo-${scene.id}.mp3`);

  if (fs.existsSync(videoPath)) {
    console.log(`  ⏭  Skipping ${scene.id} — video already exists`);
    return;
  }

  console.log(`\n▶ ${scene.title} (${scene.id})`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] Script prompt:\n');
    console.log(scene.scriptPrompt.trim());
    console.log(`\n  Output would be: ${videoPath}`);
    return;
  }

  // Step 1 — GPT-4o script
  console.log('  1/4 Generating script...');
  const script = await generateScript(scene);
  console.log(`  Script (${script.split(' ').length} words):\n  "${script.slice(0, 120)}..."`);

  // Step 2 — OpenAI TTS
  console.log('  2/4 Generating audio...');
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  await generateAudio(script, audioPath);
  console.log(`  Audio saved: ${audioPath}`);

  // Step 3 — Upload audio to Supabase for D-ID to fetch
  console.log('  3/4 Uploading audio...');
  const audioUrl = await uploadAudioToSupabase(audioPath, `demo-${scene.id}.mp3`);
  console.log(`  Audio URL: ${audioUrl}`);

  // Step 4 — D-ID video
  console.log('  4/4 Generating D-ID video...');
  const talkId = await submitDIDTalk(audioUrl);
  console.log(`  D-ID talk ID: ${talkId} — polling`);
  const resultUrl = await pollDIDTalk(talkId);
  console.log(`\n  Result URL: ${resultUrl}`);

  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  await downloadVideo(resultUrl, videoPath);
  console.log(`  ✅ Video saved: ${videoPath}`);
}

async function main() {
  if (!OPENAI_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!DID_KEY && !DRY_RUN) { console.error('DID_API_KEY not set'); process.exit(1); }

  const scenes = SINGLE
    ? SCENES.filter(s => s.id === SINGLE)
    : SCENES;

  if (scenes.length === 0) {
    console.error(`Scene "${SINGLE}" not found. Valid IDs:\n${SCENES.map(s => `  ${s.id}`).join('\n')}`);
    process.exit(1);
  }

  console.log(`Generating ${scenes.length} demo video(s)${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  for (const scene of scenes) {
    await processScene(scene);
  }

  console.log('\n✅ Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
