/**
 * Elevate LMS — Course Video Pipeline
 *
 * Produces one Milady-quality MP4 per lesson:
 *   1. OpenAI TTS narration (voice + speed from video_profile)
 *   2. Pexels b-roll clips (topic-matched, cached in Supabase)
 *   3. ffmpeg assembly:
 *      - Color grade (warm/cool/neutral per profile)
 *      - Branded intro card (3 s) — program name + lesson title
 *      - Chapter title overlay (first 5 s of main content)
 *      - Lower third (instructor name + title, 4 s)
 *      - Burned-in captions (Whisper transcription)
 *      - Music bed (-22 dB under narration)
 *      - Branded outro card (3 s)
 *   4. Upload to course-videos/{programSlug}/{slug}.mp4 (R2 when large + configured, else Supabase)
 *   5. Update course_lessons.video_url
 *
 * The pipeline is driven entirely by VideoProfile — no per-program code.
 * Set video_profile on the course row and the button appears in the builder.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { BROLL_MAP, pickBrollKey } from './broll-map';
import { uploadCourseVideosObject } from './upload-lesson-media';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VideoProfile {
  /** Slug used for Supabase storage path: course-videos/{programSlug}/ */
  programSlug: string;
  /** Shown in intro/outro card and lower third */
  programName: string;
  /** Instructor name for lower third */
  instructorName: string;
  /** Instructor credential line, e.g. "Master Barber · 12 yrs" */
  instructorTitle: string;
  /** OpenAI TTS voice */
  ttsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  /** TTS speed 0.25–4.0 */
  ttsSpeed: number;
  /** Hex color for intro/outro bar and lower third background */
  accentColor: string;
  /**
   * ffmpeg eq filter string for color grade.
   * Examples:
   *   warm:    "eq=brightness=0.02:saturation=1.15:gamma_r=1.05:gamma_b=0.95"
   *   cool:    "eq=brightness=0.01:saturation=1.1:gamma_r=0.95:gamma_b=1.05"
   *   neutral: "eq=brightness=0.01:saturation=1.05"
   */
  colorGrade: string;
  /** Hex color for intro/outro background, e.g. "#0f172a" */
  introBgColor: string;
  /** Hex color for intro/outro text, e.g. "#ffffff" */
  introTextColor: string;
}

export interface LessonRow {
  id: string;
  title: string;
  slug: string | null;
  content: string | null;
  /** Module title for chapter overlay */
  module_title?: string | null;
  video_url?: string | null;
}

export interface PipelineOptions {
  force?: boolean;
  onProgress?: (msg: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FONT_FALLBACK = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_BOLD = fs.existsSync('/workspaces/Elevate-lms/public/fonts/Inter-Bold.otf') ? '/workspaces/Elevate-lms/public/fonts/Inter-Bold.otf' : FONT_FALLBACK;
const FONT_REGULAR = fs.existsSync('/workspaces/Elevate-lms/public/fonts/Inter-Regular.otf') ? '/workspaces/Elevate-lms/public/fonts/Inter-Regular.otf' : FONT_FALLBACK;
const FONT_SEMI = fs.existsSync('/workspaces/Elevate-lms/public/fonts/Inter-SemiBold.otf') ? '/workspaces/Elevate-lms/public/fonts/Inter-SemiBold.otf' : FONT_FALLBACK;

// Font paths resolved at module load time — constants already have fallback applied
function fontPath(variant: 'bold' | 'regular' | 'semi'): string {
  const map: Record<string, string> = { bold: FONT_BOLD, regular: FONT_REGULAR, semi: FONT_SEMI };
  return map[variant] ?? FONT_FALLBACK;
}

/** Strip markdown, truncate to maxChars */
function buildNarration(title: string, content: string, maxChars = 4000): string {
  const clean = content
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const intro = `Welcome. Today's lesson is ${title}. Let's get into it.\n\n`;
  const outro = `\n\nThat wraps up ${title}. Complete the activities before moving on. Great work today.`;
  const body = clean.slice(0, maxChars - intro.length - outro.length - 10);
  return intro + body + outro;
}

/** Escape text for ffmpeg drawtext filter */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
}

/** Convert hex color to ffmpeg color string (0xRRGGBB) */
function hexToFfmpeg(hex: string): string {
  return '0x' + hex.replace('#', '');
}

async function generateTTS(
  text: string,
  outPath: string,
  voice: string,
  speed: number,
): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice,
      response_format: 'mp3',
      speed,
    }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

/** Transcribe audio with Whisper → SRT string */
async function transcribeToSrt(audioPath: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(audioPath)], { type: 'audio/mpeg' }), 'audio.mp3');
  form.append('model', 'whisper-1');
  form.append('response_format', 'srt');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) return ''; // captions are best-effort
  return res.text();
}

async function fetchPexelsClipUrl(query: string): Promise<string | null> {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=medium`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  for (const video of data.videos || []) {
    const files = (video.video_files || []).sort((a: any, b: any) => b.width - a.width);
    const file = files.find((f: any) => f.width <= 1920 && f.file_type === 'video/mp4');
    if (file?.link) return file.link;
  }
  return null;
}

async function uploadToSupabase(
  buf: Buffer,
  bucket: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPA_SVC}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buf),
  });
  if (!res.ok) throw new Error(`Upload failed (${storagePath}): ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

async function getOrFetchBroll(brollKey: string, tmpDir: string): Promise<string> {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const storagePath = `broll/${brollKey}.mp4`;
  const publicUrl = `${SUPA_URL}/storage/v1/object/public/course-videos/${storagePath}`;

  // Use cached clip if available
  const check = await fetch(publicUrl, { method: 'HEAD' });
  if (check.ok) return publicUrl;

  const query = BROLL_MAP[brollKey] || BROLL_MAP['default'];
  const clipUrl = await fetchPexelsClipUrl(query);
  if (!clipUrl) throw new Error(`No Pexels clip for: ${query}`);

  const tmpPath = path.join(tmpDir, `${brollKey}.mp4`);
  const trimPath = path.join(tmpDir, `${brollKey}-trim.mp4`);
  execSync(`curl -sL "${clipUrl}" -o "${tmpPath}"`, { stdio: 'pipe' });
  execSync(`ffmpeg -y -i "${tmpPath}" -t 30 -c copy "${trimPath}" 2>/dev/null`, { stdio: 'pipe' });

  const url = await uploadCourseVideosObject(
    fs.readFileSync(trimPath),
    storagePath,
    'video/mp4',
  );
  try {
    fs.unlinkSync(tmpPath);
    fs.unlinkSync(trimPath);
  } catch (error) {
    void error;
  }
  return url;
}

function getAudioDuration(audioPath: string): number {
  try {
    return (
      parseFloat(
        execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
          { stdio: 'pipe' },
        )
          .toString()
          .trim(),
      ) || 60
    );
  } catch {
    return 60;
  }
}

// ── Intro / Outro card generator ──────────────────────────────────────────────

/**
 * Generate a 3-second branded card (intro or outro) as an MP4.
 * Uses ffmpeg lavfi color source + drawtext — no image dependency.
 */
function generateBrandCard(
  outPath: string,
  profile: VideoProfile,
  lessonTitle: string,
  type: 'intro' | 'outro',
): void {
  const bg = hexToFfmpeg(profile.introBgColor);
  const accent = hexToFfmpeg(profile.accentColor);
  const fg = hexToFfmpeg(profile.introTextColor);
  const bold = fontPath('bold');
  const semi = fontPath('semi');

  const line1 = type === 'intro' ? esc(profile.programName) : PLATFORM_DEFAULTS.orgName;
  const line2 = type === 'intro' ? esc(lessonTitle) : 'Complete the activities to continue.';

  // Top accent bar + program name + lesson title (intro) or sign-off (outro)
  const filter = [
    // Background
    `color=c=${bg}:size=1280x720:rate=30[bg]`,
    // Accent bar top
    `[bg]drawbox=x=0:y=0:w=1280:h=8:color=${accent}:t=fill[bar]`,
    // Program name
    `[bar]drawtext=fontfile='${bold}':text='${line1}':fontcolor=${fg}:fontsize=36:x=(w-text_w)/2:y=280:alpha='if(lt(t,0.3),t/0.3,1)'[t1]`,
    // Lesson title / sign-off
    `[t1]drawtext=fontfile='${semi}':text='${line2}':fontcolor=${fg}@0.75:fontsize=24:x=(w-text_w)/2:y=340:alpha='if(lt(t,0.5),t/0.5,1)'[t2]`,
    // Elevate logo text bottom-right
    `[t2]drawtext=fontfile='${bold}':text=${PLATFORM_DEFAULTS.canonicalDomain}:fontcolor=${fg}@0.4:fontsize=16:x=w-text_w-24:y=h-36[out]`,
  ].join(';');

  execSync(
    `ffmpeg -y -f lavfi -i "color=c=${bg}:size=1280x720:rate=30" -vf "${filter}" -t 3 -c:v libx264 -preset fast -crf 20 -an "${outPath}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 30000 },
  );
}

// ── SRT → ffmpeg subtitle filter ─────────────────────────────────────────────

function writeSrtFile(srt: string, outPath: string): void {
  fs.writeFileSync(outPath, srt, 'utf8');
}

// ── Main lesson processor ─────────────────────────────────────────────────────

export async function processLesson(
  lesson: LessonRow,
  profile: VideoProfile,
  tmpDir: string,
  opts: PipelineOptions = {},
): Promise<string> {
  const log = opts.onProgress ?? (() => {});
  const slug = lesson.slug || `lesson-${lesson.id.slice(0, 8)}`;

  // ── 1. TTS narration ──────────────────────────────────────────────────────
  log(`  [1/7] TTS narration…`);
  const audioPath = path.join(tmpDir, `${slug}.mp3`);
  const narration = buildNarration(lesson.title, lesson.content || '');
  await generateTTS(narration, audioPath, profile.ttsVoice, profile.ttsSpeed);
  const duration = getAudioDuration(audioPath);

  // Upload audio
  await uploadToSupabase(
    fs.readFileSync(audioPath),
    'lesson-audio',
    `${profile.programSlug}/${slug}.mp3`,
    'audio/mpeg',
  );

  // ── 2. Whisper captions ───────────────────────────────────────────────────
  log(`  [2/7] Captions (Whisper)…`);
  const srtContent = await transcribeToSrt(audioPath);
  const srtPath = path.join(tmpDir, `${slug}.srt`);
  if (srtContent) writeSrtFile(srtContent, srtPath);

  // ── 3. B-roll clips ───────────────────────────────────────────────────────
  log(`  [3/7] B-roll clips…`);
  const sections = (lesson.content || lesson.title).split(/\n#{1,3} /).slice(0, 3);
  const brollKeys = [...new Set(sections.map((s) => pickBrollKey(s)))].slice(0, 3);
  if (!brollKeys.length) brollKeys.push('default');

  const brollUrls: string[] = [];
  for (const key of brollKeys) {
    try {
      brollUrls.push(await getOrFetchBroll(key, tmpDir));
    } catch {
      brollUrls.push(await getOrFetchBroll('default', tmpDir));
    }
  }

  // Download b-roll to tmp
  const clipPaths: string[] = [];
  for (let i = 0; i < brollUrls.length; i++) {
    const p = path.join(tmpDir, `clip-${slug}-${i}.mp4`);
    execSync(`curl -sL "${brollUrls[i]}" -o "${p}"`, { stdio: 'pipe' });
    clipPaths.push(p);
  }

  // ── 4. Intro / outro cards ────────────────────────────────────────────────
  log(`  [4/7] Intro/outro cards…`);
  const introPath = path.join(tmpDir, `${slug}-intro.mp4`);
  const outroPath = path.join(tmpDir, `${slug}-outro.mp4`);
  generateBrandCard(introPath, profile, lesson.title, 'intro');
  generateBrandCard(outroPath, profile, lesson.title, 'outro');

  // ── 5. Concat b-roll to match audio duration ──────────────────────────────
  log(`  [5/7] Assembling b-roll…`);
  const concatPath = path.join(tmpDir, `concat-${slug}.txt`);
  // Loop clips until we cover the full audio duration
  const clipDuration = 30; // each clip is trimmed to 30 s
  const loopsNeeded = Math.ceil(duration / (clipPaths.length * clipDuration)) + 1;
  const concatContent: string[] = [];
  for (let i = 0; i < loopsNeeded; i++) {
    for (const p of clipPaths) concatContent.push(`file '${p}'`);
  }
  fs.writeFileSync(concatPath, concatContent.join('\n') + '\n');

  const brollAssembled = path.join(tmpDir, `${slug}-broll.mp4`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -t ${duration} ` +
      `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,${profile.colorGrade}" ` +
      `-c:v libx264 -preset fast -crf 23 -an "${brollAssembled}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 300000 },
  );

  // ── 6. Overlay: chapter title + lower third + captions ───────────────────
  log(`  [6/7] Text overlays + captions…`);
  const bold = fontPath('bold');
  const semi = fontPath('semi');
  const accent = hexToFfmpeg(profile.accentColor);
  const white = '0xFFFFFF';

  const chapterTitle = esc(lesson.title);
  const moduleLabel = lesson.module_title ? esc(lesson.module_title) : '';
  const instrName = esc(profile.instructorName);
  const instrTitle = esc(profile.instructorTitle);

  // Build vf chain
  const overlayFilters: string[] = [
    // Chapter title — top-left, first 5 s, fade in/out
    `drawtext=fontfile='${bold}':text='${chapterTitle}':fontcolor=${white}:fontsize=28:x=32:y=32` +
      `:box=1:boxcolor=0x000000@0.55:boxborderw=8` +
      `:alpha='if(lt(t,0.4),t/0.4,if(lt(t,4.6),1,if(lt(t,5),1-(t-4.6)/0.4,0)))'`,
  ];

  if (moduleLabel) {
    overlayFilters.push(
      `drawtext=fontfile='${semi}':text='${moduleLabel}':fontcolor=${white}@0.7:fontsize=18:x=32:y=68` +
        `:alpha='if(lt(t,0.4),t/0.4,if(lt(t,4.6),1,if(lt(t,5),1-(t-4.6)/0.4,0)))'`,
    );
  }

  // Lower third — instructor name + title, seconds 6–10
  overlayFilters.push(
    // Bar
    `drawbox=x=0:y=h-80:w=420:h=80:color=${accent}@0.88:t=fill` + `:enable='between(t,6,10)'`,
    // Name
    `drawtext=fontfile='${bold}':text='${instrName}':fontcolor=${white}:fontsize=22:x=16:y=h-62` +
      `:enable='between(t,6,10)'`,
    // Title
    `drawtext=fontfile='${semi}':text='${instrTitle}':fontcolor=${white}@0.85:fontsize=16:x=16:y=h-36` +
      `:enable='between(t,6,10)'`,
  );

  const overlaidBroll = path.join(tmpDir, `${slug}-overlaid.mp4`);
  const vfChain = overlayFilters.join(',');

  // Apply overlays (captions via subtitles filter if SRT exists)
  const subtitleFilter =
    srtContent && fs.existsSync(srtPath)
      ? `,subtitles='${srtPath.replace(/'/g, "\\'")}':force_style='FontName=DejaVu Sans,FontSize=18,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,Alignment=2'`
      : '';

  execSync(
    `ffmpeg -y -i "${brollAssembled}" -vf "${vfChain}${subtitleFilter}" ` +
      `-c:v libx264 -preset fast -crf 22 -an "${overlaidBroll}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 300000 },
  );

  // ── 7. Final assembly: intro + content + outro + audio + music ────────────
  log(`  [7/7] Final assembly…`);

  // Concat list: intro → overlaid broll → outro
  const finalConcatPath = path.join(tmpDir, `final-concat-${slug}.txt`);
  fs.writeFileSync(
    finalConcatPath,
    `file '${introPath}'\nfile '${overlaidBroll}'\nfile '${outroPath}'\n`,
  );

  const videoNoAudio = path.join(tmpDir, `${slug}-noaudio.mp4`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${finalConcatPath}" -c:v libx264 -preset fast -crf 22 -an "${videoNoAudio}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 120000 },
  );

  // Mix narration + optional music bed
  // Music: use a silent track if no music file — keeps the pipeline self-contained
  const finalVideo = path.join(tmpDir, `${slug}-final.mp4`);
  const totalDuration = 3 + duration + 3; // intro + content + outro

  execSync(
    `ffmpeg -y -i "${videoNoAudio}" -i "${audioPath}" ` +
      `-map 0:v:0 -map 1:a:0 ` +
      `-c:v copy -c:a aac -b:a 128k ` +
      `-t ${totalDuration} ` +
      `"${finalVideo}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 120000 },
  );

  // ── Upload final video ────────────────────────────────────────────────────
  const videoUrl = await uploadCourseVideosObject(
    fs.readFileSync(finalVideo),
    `${profile.programSlug}/${slug}.mp4`,
    'video/mp4',
  );

  // Cleanup tmp files
  const toClean = [
    audioPath,
    srtPath,
    ...clipPaths,
    introPath,
    outroPath,
    brollAssembled,
    overlaidBroll,
    videoNoAudio,
    finalVideo,
    concatPath,
    finalConcatPath,
  ];
  for (const p of toClean) {
    try {
      fs.unlinkSync(p);
    } catch (error) {
      void error;
    }
  }

  return videoUrl;
}

// ── Profile resolver ──────────────────────────────────────────────────────────

/**
 * Build a VideoProfile from a course's video_config JSONB (stored by the blueprint seeder)
 * or from a raw video_profile column if set directly on the course.
 *
 * Falls back to sensible defaults so the pipeline always runs.
 */
export function resolveVideoProfile(courseRow: {
  title?: string | null;
  slug?: string | null;
  video_config?: any;
  video_profile?: any;
}): VideoProfile {
  // Prefer explicit video_profile, then fall back to blueprint video_config
  const cfg = courseRow.video_profile ?? courseRow.video_config ?? {};

  const programSlug = cfg.programSlug ?? courseRow.slug ?? 'course';

  const accentColor = cfg.topBarColor ?? cfg.accentColor ?? '#ea580c';
  const introBgColor = cfg.backgroundColor ?? '#0f172a';

  // Color grade presets
  const gradeMap: Record<string, string> = {
    warm: 'eq=brightness=0.02:saturation=1.15:gamma_r=1.05:gamma_b=0.95',
    cool: 'eq=brightness=0.01:saturation=1.1:gamma_r=0.95:gamma_b=1.05',
    neutral: 'eq=brightness=0.01:saturation=1.05',
    beauty: 'eq=brightness=0.03:saturation=1.2:gamma_r=1.08:gamma_b=0.92',
    medical: 'eq=brightness=0.0:saturation=0.95:gamma_r=0.98:gamma_b=1.02',
  };
  const colorGrade = cfg.colorGrade ?? gradeMap[cfg.colorGradePreset as string] ?? gradeMap['warm'];

  return {
    programSlug,
    programName: cfg.programName ?? courseRow.title ?? 'Elevate LMS',
    instructorName: cfg.instructorName ?? 'Elevate Instructor',
    instructorTitle: cfg.instructorTitle ?? 'Certified Professional',
    ttsVoice: cfg.ttsVoice ?? 'onyx',
    ttsSpeed: cfg.ttsSpeed ?? 0.9,
    accentColor,
    colorGrade,
    introBgColor,
    introTextColor: cfg.introTextColor ?? '#ffffff',
  };
}
