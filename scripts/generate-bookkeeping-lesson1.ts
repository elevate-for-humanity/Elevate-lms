/**
 * Generate Bookkeeping Lesson 1 video with instructor avatar composite.
 *
 * Uses the repo's own pipeline:
 *   server/video-renderer.ts  → Canvas composite frames (slide + instructor avatar)
 *   server/tts-service.ts     → OpenAI TTS (nova voice)
 *   FFmpeg                    → scene rendering + concatenation
 *
 * Layout: 75% slide content (left) + 22% instructor avatar card (bottom-right)
 * Matches Coursera / Google Career Certificates visual style.
 *
 * Run: npx tsx scripts/generate-bookkeeping-lesson1.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { generateTextToSpeech } from '../server/tts-service';
import { createInstructorCompositeFrame } from '../server/video-renderer';

// Lazy-load native deps
let _ffmpeg: any = null;
async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;
  const ff = (await import('fluent-ffmpeg')).default;
  const ffmpegInstaller = (await import('@ffmpeg-installer/ffmpeg')).default;
  const ffprobeInstaller = (await import('@ffprobe-installer/ffprobe')).default;
  ff.setFfmpegPath(ffmpegInstaller.path);
  ff.setFfprobePath(ffprobeInstaller.path);
  _ffmpeg = ff;
  return ff;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LESSON_ID = 'b500b9d3-cf78-42d3-ba91-cb2b33c9eecf';
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/team/elizabeth-greene-headshot.jpg');
const INSTRUCTOR_NAME = 'Elizabeth Greene';
const INSTRUCTOR_TITLE = 'Founder & Program Director';
const VOICE = 'nova'; // Angela's voice

const WIDTH = 1920;
const HEIGHT = 1080;

interface LessonScene {
  id: string;
  slideTitle: string;
  slideText: string;       // displayed on screen
  narration: string;       // spoken by TTS (can differ from displayed text)
  accentColor?: string;
}

// Each scene = one teaching slide with instructor avatar + TTS narration
const SCENES: LessonScene[] = [
  {
    id: 'title',
    slideTitle: 'Welcome to Bookkeeping & QuickBooks',
    slideText:
      'Elevate for Humanity\n\n' +
      'Bookkeeping & QuickBooks Certified User Program\n\n' +
      '5-Week Certiport-Aligned Program\n' +
      '• QuickBooks Certified User (QBCU)\n' +
      '• Microsoft Office Specialist Excel (MOS)\n\n' +
      'Median Salary: $47,440/year (BLS)',
    narration:
      'Welcome to the Elevate for Humanity Bookkeeping and QuickBooks Certified User program. ' +
      'This five-week program prepares you for two Certiport certifications: ' +
      'QuickBooks Certified User and Microsoft Office Specialist Excel. ' +
      'The Bureau of Labor Statistics reports a median annual salary of forty-seven thousand four hundred forty dollars for bookkeeping clerks.',
    accentColor: '#3b82f6',
  },
  {
    id: 'structure',
    slideTitle: 'Program Structure — 9 Modules',
    slideText:
      'Module 1: Orientation & Bookkeeping Foundations\n' +
      'Module 2: QBO Administration\n' +
      'Module 3: Sales & Money-In\n' +
      'Module 4: Vendors & Money-Out\n' +
      'Module 5: Bank Accounts & Transaction Rules\n' +
      'Module 6: Basic Reports & Views\n' +
      'Module 7: Payroll & Tax Compliance\n' +
      'Module 8: MOS Excel for Accounting\n' +
      'Module 9: Exam Prep & Career Launch\n\n' +
      'Hybrid delivery: AI lessons + GMetrix + hands-on QBO',
    narration:
      'This program has nine modules. Module one covers Orientation and Bookkeeping Foundations. ' +
      'Module two is QBO Administration. Module three covers Sales and Money-In. ' +
      'Module four is Vendors and Money-Out. Module five covers Bank Accounts and Transaction Rules. ' +
      'Module six is Basic Reports and Views. Module seven covers Payroll and Tax Compliance. ' +
      'Module eight is MOS Excel for Accounting. And module nine is Exam Prep with Career Launch. ' +
      'The program uses a hybrid model combining AI-instructed lessons with GMetrix practice exams and hands-on QuickBooks Online exercises.',
    accentColor: '#8b5cf6',
  },
  {
    id: 'credentials',
    slideTitle: 'Credentials You Will Earn',
    slideText:
      '1. QuickBooks Certified User (QBCU)\n' +
      '   Validates bookkeeping tasks in QuickBooks Online\n' +
      '   Administered by Certiport\n\n' +
      '2. Microsoft Office Specialist — Excel\n' +
      '   Validates spreadsheet & data analysis skills\n' +
      '   Administered by Certiport\n\n' +
      '✓ Both exams at our Authorized Testing Center\n' +
      '✓ Elevate covers ALL exam voucher costs',
    narration:
      'Upon successful completion, you earn two industry-recognized Certiport certifications. ' +
      'First, QuickBooks Certified User, which validates your ability to perform bookkeeping tasks in QuickBooks Online. ' +
      'Second, Microsoft Office Specialist Excel, which validates your spreadsheet and data analysis skills. ' +
      'Both exams are administered at our Certiport Authorized Testing Center. Elevate covers all exam voucher costs.',
    accentColor: '#10b981',
  },
  {
    id: 'exam',
    slideTitle: 'The QBCU Exam — 5 Domains',
    slideText:
      '50 minutes  |  ~40 questions  |  5 domains\n\n' +
      'Domain 1: QBO Administration\n' +
      'Domain 2: Sales & Money-In\n' +
      'Domain 3: Vendors & Money-Out\n' +
      'Domain 4: Bank Accounts & Transaction Rules\n' +
      'Domain 5: Basic Reports & Views\n\n' +
      'Each domain is weighted — proficiency required across all five.\n' +
      'Our program maps directly to each domain.',
    narration:
      'The QuickBooks Certified User exam is fifty minutes long with approximately forty questions. ' +
      'It covers five domains. Domain one: QBO Administration. Domain two: Sales and Money-In. ' +
      'Domain three: Vendors and Money-Out. Domain four: Bank Accounts and Transaction Rules. ' +
      'Domain five: Basic Reports and Views. ' +
      'Each domain is weighted and you must demonstrate proficiency across all five. ' +
      'Our program maps directly to these domains with dedicated modules, hands-on exercises, and GMetrix practice exams for each one.',
    accentColor: '#f59e0b',
  },
  {
    id: 'qbo-setup',
    slideTitle: 'Setting Up QuickBooks Online',
    slideText:
      'You will use a QBO practice company throughout this program.\n\n' +
      '• Intuit provides free QBO access for education\n' +
      '• Login via QuickBooks Online Accountant portal\n' +
      '• Credentials provided during orientation\n\n' +
      'Action Items:\n' +
      '→ Bookmark qbo.intuit.com\n' +
      '→ Store credentials securely\n' +
      '→ Used for ALL hands-on exercises starting Module 1',
    narration:
      'You will use a QuickBooks Online practice company throughout this program. ' +
      'Intuit provides free QBO access for education through the QuickBooks Online Accountant portal. ' +
      'During orientation, your program coordinator will provide your login credentials. ' +
      'Bookmark qbo.intuit.com and keep your credentials safe. ' +
      'You will use this practice company for all hands-on exercises starting in Module one.',
    accentColor: '#3b82f6',
  },
  {
    id: 'gmetrix',
    slideTitle: 'GMetrix Practice Tests',
    slideText:
      'GMetrix = Official Certiport practice test platform\n\n' +
      'Setup Steps:\n' +
      '1. Go to gmetrix.net\n' +
      '2. Create your student account\n' +
      '3. Enter access code from Elevate\n' +
      '4. Select "QuickBooks Certified User"\n\n' +
      'Complete at least 2 full practice exams\n' +
      'before scheduling your certification test',
    narration:
      'GMetrix is the official Certiport practice test platform. ' +
      'You will use GMetrix to take timed practice exams that simulate the real QBCU certification test. ' +
      'To activate: go to gmetrix.net, create your student account, enter the access code provided by Elevate, ' +
      'and select the QuickBooks Certified User practice test. ' +
      'Complete at least two full GMetrix practice exams before scheduling your certification test.',
    accentColor: '#8b5cf6',
  },
  {
    id: 'certiport',
    slideTitle: 'Certiport Exam Registration',
    slideText:
      'Register at certiport.com\n\n' +
      '• Create your Certiport ID in Week 1\n' +
      '• Program coordinator schedules your exam\n' +
      '• Exam at our Authorized Testing Center\n\n' +
      '✓ Elevate covers full exam voucher cost\n' +
      '✓ Retake voucher available if needed',
    narration:
      'When you are ready to take the certification exam, register through Certiport at certiport.com. ' +
      'Create your Certiport ID during the first week so it is ready when exam day arrives. ' +
      'Your program coordinator will schedule your exam at our Authorized Testing Center. ' +
      'Elevate covers the full cost of your exam voucher. If you do not pass on the first attempt, a retake voucher is available.',
    accentColor: '#10b981',
  },
  {
    id: 'role',
    slideTitle: 'What Bookkeepers Do',
    slideText:
      'Core Responsibilities:\n' +
      '• Record financial transactions\n' +
      '• Manage accounts payable & receivable\n' +
      '• Reconcile bank statements\n' +
      '• Process payroll\n' +
      '• Prepare financial reports\n' +
      '• Maintain records for tax compliance\n\n' +
      'Daily Tasks in QuickBooks:\n' +
      'Invoices → Payments → Categorize → Reconcile → Report',
    narration:
      'Bookkeepers record financial transactions, manage accounts payable and receivable, ' +
      'reconcile bank statements, process payroll, prepare financial reports, and maintain accurate records for tax compliance. ' +
      'Daily responsibilities include entering invoices and payments in QuickBooks, categorizing expenses, ' +
      'reconciling bank feeds, running profit and loss reports, and communicating with vendors and customers about account status.',
    accentColor: '#f59e0b',
  },
  {
    id: 'careers',
    slideTitle: 'Career Pathways',
    slideText:
      'Entry-Level Positions:\n' +
      '• Bookkeeper\n' +
      '• Accounts Payable / Receivable Clerk\n' +
      '• Payroll Clerk\n\n' +
      'With Experience:\n' +
      '• Full-Charge Bookkeeper\n' +
      '• Accounting Assistant\n' +
      '• Office Manager\n' +
      '• Independent Contractor\n\n' +
      'QuickBooks is used by 80%+ of US small businesses',
    narration:
      'Entry-level positions include bookkeeper, accounts payable clerk, accounts receivable clerk, and payroll clerk. ' +
      'With experience, you can advance to full-charge bookkeeper, accounting assistant, or office manager. ' +
      'Many bookkeepers also work as independent contractors serving multiple small businesses. ' +
      'The QuickBooks Certified User credential is specifically requested by employers and clients who use QuickBooks, ' +
      'which represents over eighty percent of small businesses in the United States.',
    accentColor: '#3b82f6',
  },
  {
    id: 'checklist',
    slideTitle: 'Getting Started — 4 Steps',
    slideText:
      'Complete before Lesson 2:\n\n' +
      '☐ 1. Bookmark this LMS & save login credentials\n\n' +
      '☐ 2. Create Certiport ID at certiport.com\n\n' +
      '☐ 3. Activate GMetrix with your access code\n\n' +
      '☐ 4. Verify QBO login at qbo.intuit.com\n\n' +
      'Issues? Contact your program coordinator immediately.',
    narration:
      'Before moving to Lesson two, complete these four setup tasks. ' +
      'Step one: Bookmark this LMS and save your login credentials. ' +
      'Step two: Create your Certiport ID at certiport.com. ' +
      'Step three: Activate your GMetrix account with the access code from your orientation packet. ' +
      'Step four: Verify you can log into QuickBooks Online at qbo.intuit.com with the credentials provided. ' +
      'If you have any issues with access or setup, contact your program coordinator immediately. ' +
      'Once all four steps are complete, you are ready for Lesson two: Enrollment, Funding, and Support Services.',
    accentColor: '#10b981',
  },
];

async function renderScene(
  scene: LessonScene,
  index: number,
  tempDir: string
): Promise<string> {
  const sceneDir = path.join(tempDir, `scene-${index}`);
  await fs.mkdir(sceneDir, { recursive: true });

  // 1. Generate TTS audio
  console.log(`  [${index + 1}/${SCENES.length}] TTS: "${scene.slideTitle}"`);
  const audioBuffer = await generateTextToSpeech(scene.narration, VOICE, 1.0);
  const audioPath = path.join(sceneDir, 'audio.mp3');
  await fs.writeFile(audioPath, audioBuffer);

  // Get audio duration with ffprobe
  const ffmpeg = await getFFmpeg();
  const audioDuration = await new Promise<number>((resolve) => {
    ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
      if (err || !metadata?.format?.duration) {
        // Estimate from word count
        const words = scene.narration.split(/\s+/).length;
        resolve(Math.ceil((words / 150) * 60) + 2);
      } else {
        resolve(Math.ceil(metadata.format.duration) + 1); // +1s padding
      }
    });
  });

  // 2. Create composite frame (slide + instructor avatar)
  console.log(`  [${index + 1}/${SCENES.length}] Frame: ${WIDTH}x${HEIGHT}, ${audioDuration}s`);
  const frameBuffer = await createInstructorCompositeFrame(
    scene.slideText,
    WIDTH,
    HEIGHT,
    {
      instructorImagePath: INSTRUCTOR_PHOTO,
      instructorName: INSTRUCTOR_NAME,
      instructorTitle: INSTRUCTOR_TITLE,
      slideTitle: scene.slideTitle,
      accentColor: scene.accentColor,
      fontSize: 54,
      titleFontSize: 72,
    }
  );
  const framePath = path.join(sceneDir, 'frame.png');
  await fs.writeFile(framePath, frameBuffer);

  // 3. Render to video with FFmpeg (static frame + audio)
  const videoPath = path.join(sceneDir, 'scene.mp4');
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(framePath)
      .inputOptions(['-loop', '1'])
      .input(audioPath)
      .outputOptions([
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-crf', '20',
        '-preset', 'fast',
        '-r', '30',
        '-t', audioDuration.toString(),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
      ])
      .output(videoPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });

  const stat = await fs.stat(videoPath);
  console.log(`  [${index + 1}/${SCENES.length}] Done: ${(stat.size / 1024 / 1024).toFixed(1)} MB, ${audioDuration}s`);
  return videoPath;
}

async function main() {
  console.log('=== Bookkeeping Lesson 1 — Instructor Composite Video ===');
  console.log(`Pipeline: Canvas composite → OpenAI TTS (${VOICE}) → FFmpeg`);
  console.log(`Layout: 75% slide content + 22% instructor avatar`);
  console.log(`Scenes: ${SCENES.length}`);
  console.log(`Instructor: ${INSTRUCTOR_NAME}`);
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set');
    process.exit(1);
  }

  const tempDir = path.join(process.cwd(), 'temp', `lesson1-${Date.now()}`);
  const outputDir = path.join(process.cwd(), 'output');
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const startTime = Date.now();

  // Render each scene
  const scenePaths: string[] = [];
  for (let i = 0; i < SCENES.length; i++) {
    const videoPath = await renderScene(SCENES[i], i, tempDir);
    scenePaths.push(videoPath);
  }

  // Concatenate all scenes using TS intermediate format
  console.log('\nConcatenating scenes...');
  const ffmpeg = await getFFmpeg();

  // Convert to transport stream for reliable concat
  const tsPaths: string[] = [];
  for (let i = 0; i < scenePaths.length; i++) {
    const tsPath = path.join(tempDir, `scene-${i}.ts`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(scenePaths[i])
        .outputOptions(['-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts'])
        .output(tsPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
    tsPaths.push(tsPath);
  }

  const outputPath = path.join(outputDir, 'bookkeeping-lesson-001.mp4');
  const concatInput = 'concat:' + tsPaths.join('|');

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatInput)
      .outputOptions(['-c', 'copy', '-movflags', '+faststart'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const stat = await fs.stat(outputPath);
  console.log(`\n✅ Video generated: ${outputPath}`);
  console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Time: ${elapsed}s`);

  // Upload to Supabase
  console.log('\nUploading to Supabase...');
  const videoBuffer = await fs.readFile(outputPath);
  const storagePath = 'lessons/bookkeeping-lesson-001.mp4';

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/media/${storagePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      },
      body: videoBuffer,
    }
  );

  if (uploadRes.ok) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
    console.log(`✅ Uploaded: ${publicUrl}`);

    // Update lesson row
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/training_lessons?id=eq.${LESSON_ID}`,
      {
        method: 'PATCH',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ video_url: publicUrl }),
      }
    );
    console.log(updateRes.ok ? '✅ Lesson row updated' : `⚠️ Lesson update failed: ${await updateRes.text()}`);
  } else {
    console.error('Upload failed:', await uploadRes.text());
  }

  // Cleanup temp
  await fs.rm(tempDir, { recursive: true, force: true });
  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
