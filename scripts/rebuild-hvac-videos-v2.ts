/**
 * Rebuild HVAC Videos V2 — Multi-clip + Captions
 *
 * Per lesson:
 *   1. TTS narration from lesson content
 *   2. Generate 8 unique Sora clips (4s each = 32s unique footage)
 *   3. Concatenate clips to cover full narration (no looping)
 *   4. Generate word-level timestamps via Whisper
 *   5. Burn captions + title bar via FFmpeg
 *   6. Upload to Supabase, update DB
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos-v2.ts
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos-v2.ts --start 0 --limit 2
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const TEMP_DIR = path.join(process.cwd(), 'temp', 'hvac-v2');
const CLIPS_PER_LESSON = 8;
const SORA_CONCURRENCY = 5;
const VOICE: 'onyx' = 'onyx';

// ── Module scene prompts ────────────────────────────────────────────────

const MODULE_SCENES: Record<number, string[]> = {
  1: [
    'a modern HVAC training classroom with students in work uniforms, whiteboards with program schedule',
    'an instructor greeting students at the entrance of a trades training facility',
    'students reviewing course materials at desks in a clean training room',
    'a wide shot of an HVAC training workshop with tools and equipment stations',
    'close-up of HVAC training manuals and safety equipment on a desk',
    'students walking through a workshop looking at different HVAC systems',
    'an instructor pointing at a wall-mounted split AC system explaining components',
    'a group of students in PPE examining a furnace in a training lab',
  ],
  2: [
    'a technician inspecting an outdoor condenser unit with the panel removed',
    'close-up of a compressor, contactor, and capacitor inside a condenser unit',
    'a technician checking refrigerant lines with gauges connected',
    'hands using a multimeter to test voltage on an HVAC contactor',
    'a split system diagram on a whiteboard with arrows showing airflow',
    'a technician replacing a capacitor in an outdoor AC unit',
    'close-up of copper refrigerant lines with insulation at a wall penetration',
    'a technician cleaning condenser coils with a garden hose',
  ],
  3: [
    'close-up of an electrical panel with color-coded wires and circuit breakers',
    'a technician using a multimeter to measure voltage at a disconnect box',
    'hands wiring a thermostat with labeled wire connections',
    'a capacitor being tested with a multimeter showing microfarad reading',
    'a contactor with visible contact points and coil wiring',
    'a technician tracing wires in a furnace electrical compartment',
    'close-up of a wiring diagram taped inside an HVAC unit panel',
    'a technician using an amp clamp on wires coming from a compressor',
  ],
  4: [
    'a residential gas furnace with the front panel removed showing burners',
    'close-up of a gas valve and ignition system inside a furnace',
    'a technician using a combustion analyzer at a furnace flue pipe',
    'flames visible through the sight glass of a gas furnace burner',
    'a technician checking temperature rise with probes in supply and return ducts',
    'close-up of a heat exchanger inside a furnace',
    'a technician replacing an ignitor in a gas furnace',
    'a wall-mounted thermostat displaying heating mode temperature',
  ],
  5: [
    'a split AC system with refrigerant gauges connected showing pressures',
    'close-up of a TXV metering device on an evaporator coil',
    'a technician measuring superheat with temperature clamps on suction line',
    'refrigerant flowing through a sight glass on a liquid line',
    'a PT chart posted on a workshop wall next to gauges',
    'a technician adding refrigerant from a cylinder to a system',
    'close-up of an evaporator coil with condensation forming',
    'a compressor running with suction and discharge lines visible',
  ],
  6: [
    'a classroom with EPA 608 study materials and practice tests on desks',
    'a whiteboard showing refrigerant types ODP and GWP values',
    'close-up of different refrigerant cylinders color coded and labeled',
    'a technician demonstrating proper refrigerant cylinder storage',
    'students studying EPA 608 flashcards at a table',
    'a poster showing the Clean Air Act regulations on a wall',
    'a recovery machine connected to an AC system',
    'a technician weighing a recovery cylinder on a digital scale',
  ],
  7: [
    'a technician recovering refrigerant from a window AC unit',
    'close-up of a recovery machine with gauges and hoses connected',
    'a small appliance system access valve being pierced',
    'a technician using a leak detector on refrigerant fittings',
    'a vacuum pump connected to a system with a micron gauge',
    'close-up of manifold gauge readings during recovery',
    'a technician documenting refrigerant amounts on a service ticket',
    'proper PPE including safety glasses and gloves for refrigerant handling',
  ],
  8: [
    'a large commercial chiller in a mechanical room',
    'a technician checking a purge unit on a low-pressure chiller',
    'close-up of large-diameter refrigerant piping in a mechanical room',
    'a technician reading gauges on a centrifugal chiller',
    'a rooftop commercial HVAC unit being serviced',
    'a technician performing a standing vacuum test',
    'industrial cooling tower visible through a mechanical room window',
    'a technician reviewing maintenance logs on a clipboard',
  ],
  9: [
    'a technician brazing copper tubing with a torch and nitrogen purge',
    'close-up of a proper braze joint on copper refrigerant line',
    'a technician performing a nitrogen pressure test on new piping',
    'a digital manifold showing subcooling and superheat readings',
    'a technician installing a new line set through a wall',
    'close-up of flare fittings being tightened with wrenches',
    'a vacuum pump pulling deep vacuum with micron gauge reading',
    'a technician charging a system by weight using a scale',
  ],
  10: [
    'a technician measuring airflow at a supply register with an anemometer',
    'close-up of a manometer measuring static pressure in ductwork',
    'a technician adjusting a TXV with superheat readings displayed',
    'digital manifold connected showing real-time system performance',
    'a technician performing a Manual J load calculation on a laptop',
    'close-up of temperature probes on supply and return lines',
    'a technician balancing dampers in a duct system',
    'a system running with all gauges showing normal operating pressures',
  ],
  11: [
    'a technician systematically troubleshooting a rooftop unit',
    'close-up of a frozen evaporator coil with ice buildup',
    'a technician checking a blower motor with a multimeter',
    'a dirty air filter being removed from a return air grille',
    'a technician testing a defrost board on a heat pump',
    'close-up of a failed capacitor with a bulging top',
    'a technician checking thermostat wiring at the air handler',
    'a service van with organized tool compartments and parts',
  ],
  12: [
    'a technician installing flex duct in a residential attic',
    'close-up of sheet metal ductwork being sealed with mastic',
    'a technician measuring duct dimensions for proper sizing',
    'a blower door test being performed on a house',
    'a technician sealing duct connections with foil tape',
    'close-up of a duct smoke test showing air leaks',
    'a technician installing a new supply register in a ceiling',
    'insulated ductwork running through a crawl space',
  ],
  13: [
    'a technician performing a system startup checklist on a clipboard',
    'a new HVAC system installed with clean ductwork connections',
    'a technician programming a smart thermostat on a wall',
    'close-up of a commissioning report being filled out',
    'a technician verifying refrigerant charge on a new installation',
    'a homeowner being shown how to use their new thermostat',
    'a technician checking electrical connections one final time',
    'a completed installation with outdoor and indoor units running',
  ],
  14: [
    'students seated at desks taking a proctored certification exam',
    'close-up of an EPA 608 practice test with multiple choice questions',
    'a proctor distributing test materials in a quiet testing room',
    'a student reviewing notes before an exam',
    'a whiteboard showing exam tips and section breakdown',
    'students using calculators during a practice exam',
    'an instructor reviewing common exam mistakes with the class',
    'a student completing the final page of a certification exam',
  ],
  15: [
    'a career counselor reviewing a resume with an HVAC graduate',
    'a technician in clean uniform at a job interview shaking hands',
    'a laptop screen showing HVAC job listings',
    'a technician loading tools into a service van for first day',
    'a mock interview session in a professional office setting',
    'a graduate receiving their EPA 608 certification card',
    'a technician networking at an industry job fair',
    'a professional headshot being taken for a resume',
  ],
  16: [
    'a graduation ceremony with students receiving certificates',
    'students in caps celebrating program completion',
    'an instructor congratulating a graduate with a handshake',
    'a group photo of HVAC program graduates',
    'a graduate holding their certificate of completion proudly',
    'a career services advisor discussing job placement with a graduate',
    'a technician starting their first day at an HVAC company',
    'a wide shot of the training facility with a congratulations banner',
  ],
};

function getModuleNumber(orderIndex: number): number {
  return Math.floor(orderIndex / 100);
}

function getClipPrompts(lessonTitle: string, moduleNum: number): string[] {
  const scenes = MODULE_SCENES[moduleNum] || MODULE_SCENES[2];
  return scenes.map(scene =>
    `Professional HVAC training video. ${scene}. Cinematic quality, warm natural lighting, slow steady camera pan. No text or graphics. 16:9.`
  );
}

// ── HTML to plain text ──────────────────────────────────────────────────

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

// ── TTS ─────────────────────────────────────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<number> {
  const truncated = text.length > 2500 ? text.slice(0, 2500) + '.' : text;
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: VOICE, input: truncated, speed: 0.95,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    const p = execSync(`ffprobe -v quiet -print_format json -show_format "${outPath}"`, { encoding: 'utf-8' });
    return parseFloat(JSON.parse(p).format?.duration || '60');
  } catch { return Math.ceil(truncated.split(/\s+/).length / 150 * 60) + 2; }
}

// ── Whisper for word-level timestamps → SRT captions ────────────────────

async function generateCaptions(audioPath: string, srtPath: string): Promise<void> {
  const audioFile = fs.createReadStream(audioPath);
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile as any,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  // Build SRT from segments
  const segments = (transcription as any).segments || [];
  let srt = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const startTime = formatSRT(seg.start);
    const endTime = formatSRT(seg.end);
    // Split long segments into ~10 word chunks
    const words = seg.text.trim().split(/\s+/);
    if (words.length <= 12) {
      srt += `${i + 1}\n${startTime} --> ${endTime}\n${seg.text.trim()}\n\n`;
    } else {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      srt += `${i + 1}\n${startTime} --> ${endTime}\n${line1}\n${line2}\n\n`;
    }
  }

  if (!srt.trim()) {
    // Fallback: single caption
    srt = `1\n00:00:00,000 --> 00:10:00,000\n[Narration]\n\n`;
  }

  fs.writeFileSync(srtPath, srt);
}

function formatSRT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

// ── Sora clip generation with concurrency ───────────────────────────────

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

async function generateSoraClip(prompt: string): Promise<string | null> {
  try {
    const video = await openai.videos.create({
      model: 'sora-2', prompt, size: '1280x720',
    });
    for (let i = 0; i < 40; i++) {
      await sleep(5000);
      const s = await openai.videos.retrieve(video.id);
      if (s.status === 'completed') return video.id;
      if (s.status === 'failed') return null;
    }
    return null;
  } catch { return null; }
}

async function downloadSoraClip(videoId: string, outPath: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://api.openai.com/v1/videos/${videoId}/content`,
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    if (!resp.ok) return false;
    fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
    return true;
  } catch { return false; }
}

async function generateClipsBatch(prompts: string[], dir: string): Promise<string[]> {
  const paths: string[] = [];

  // Process in batches of SORA_CONCURRENCY
  for (let b = 0; b < prompts.length; b += SORA_CONCURRENCY) {
    const batch = prompts.slice(b, b + SORA_CONCURRENCY);
    const ids = await Promise.all(batch.map(p => generateSoraClip(p)));

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id) {
        const clipPath = path.join(dir, `clip-${String(b + i).padStart(2, '0')}.mp4`);
        const ok = await downloadSoraClip(id, clipPath);
        if (ok) paths.push(clipPath);
      }
    }
  }

  return paths;
}

// ── FFmpeg composite ────────────────────────────────────────────────────

function normalizeClip(inputPath: string, outputPath: string): void {
  execSync(
    `ffmpeg -y -i "${inputPath}" -vf "fps=30,scale=1280:720,format=yuv420p" ` +
    `-c:v libx264 -preset fast -crf 23 -an -movflags +faststart "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

function concatenateClips(clipPaths: string[], outputPath: string, targetDuration: number): void {
  if (clipPaths.length === 0) return;

  const normDir = path.dirname(outputPath);

  // Normalize all clips
  const normPaths: string[] = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const np = path.join(normDir, `norm-${i}.mp4`);
    normalizeClip(clipPaths[i], np);
    normPaths.push(np);
  }

  // Build concat list — repeat clips to fill duration
  const concatFile = path.join(normDir, 'concat.txt');
  let lines = '';
  let totalDur = 0;
  let idx = 0;
  while (totalDur < targetDuration + 4) {
    lines += `file '${normPaths[idx % normPaths.length]}'\n`;
    totalDur += 4; // each clip ~4s
    idx++;
  }
  fs.writeFileSync(concatFile, lines);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-t ${targetDuration} -c:v libx264 -preset fast -crf 23 -an ` +
    `-movflags +faststart "${outputPath}"`,
    { stdio: 'pipe' }
  );

  // Cleanup norm files
  normPaths.forEach(p => { try { fs.unlinkSync(p); } catch {} });
  try { fs.unlinkSync(concatFile); } catch {}
}

function compositeWithCaptions(
  videoPath: string, audioPath: string, srtPath: string,
  outputPath: string, title: string, lessonNum: number, total: number, duration: number
): void {
  const safeTitle = title.replace(/'/g, '').replace(/:/g, ' -')
    .replace(/&/g, 'and').replace(/\\/g, '').slice(0, 55);
  const label = `Lesson ${lessonNum} of ${total}`;

  // Escape SRT path for FFmpeg subtitles filter
  const safeSrt = srtPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');

  const cmd = [
    'ffmpeg -y',
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    '-filter_complex',
    `"[0:v]` +
    // Captions — white text with dark background box at bottom
    `subtitles='${safeSrt}':force_style='FontName=DejaVu Sans,FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=120,Alignment=2',` +
    // Dark bar at very bottom for branding
    `drawbox=x=0:y=ih-70:w=iw:h=70:color=black@0.8:t=fill,` +
    `drawtext=text='${label}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=16:fontcolor=white@0.7:x=24:y=h-52,` +
    `drawtext=text='${safeTitle}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=22:fontcolor=white:x=24:y=h-32,` +
    `drawtext=text='Elevate for Humanity':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=14:fontcolor=white@0.5:x=w-220:y=h-42,` +
    // Fade
    `fade=in:0:30,fade=out:st=${Math.max(0, duration - 1)}:d=1[v]"`,
    '-map "[v]" -map 1:a',
    `-t ${duration}`,
    '-c:v libx264 -preset fast -crf 22',
    '-c:a aac -b:a 128k -ar 44100 -ac 2',
    '-movflags +faststart -shortest',
    `"${outputPath}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
}

// ── Upload ──────────────────────────────────────────────────────────────

async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Upload: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startIdx = parseInt(args[args.indexOf('--start') + 1] || '0');
  const limit = parseInt(args[args.indexOf('--limit') + 1] || '999');

  console.log('=== HVAC Video Rebuild V2 — Multi-clip + Captions ===\n');
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('id, title, content, content_type, order_index, lesson_number')
    .eq('course_id_uuid', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB:', error?.message); process.exit(1); }

  const total = lessons.length;
  const end = Math.min(startIdx + limit, total);
  console.log(`Lessons: ${total} | Processing: ${startIdx}-${end - 1} | Clips/lesson: ${CLIPS_PER_LESSON}`);
  console.log(`Est cost: ~$${((end - startIdx) * CLIPS_PER_LESSON * 0.15 + (end - startIdx) * 0.20).toFixed(0)}`);
  console.log(`Est time: ~${((end - startIdx) * 4).toFixed(0)} min\n`);

  if (dryRun) { console.log('DRY RUN — no changes'); return; }

  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (let i = startIdx; i < end; i++) {
    const lesson = lessons[i];
    const num = i + 1;
    const mod = getModuleNumber(lesson.order_index);
    const dir = path.join(TEMP_DIR, `L${String(num).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`[${num}/${total}] ${lesson.title}`);

    try {
      // 1. TTS
      const plain = htmlToPlain(lesson.content || '');
      const narration = plain.length > 100 ? plain
        : `${lesson.title}. This lesson covers essential HVAC concepts for your EPA 608 certification.`;
      const audioPath = path.join(dir, 'audio.mp3');
      process.stdout.write('  TTS...');
      const dur = await generateTTS(narration, audioPath);
      console.log(` ${dur.toFixed(0)}s`);

      // 2. Captions via Whisper
      const srtPath = path.join(dir, 'captions.srt');
      process.stdout.write('  Captions...');
      await generateCaptions(audioPath, srtPath);
      console.log(' done');

      // 3. Sora clips (8 unique)
      const prompts = getClipPrompts(lesson.title, mod);
      process.stdout.write(`  Sora (${prompts.length} clips)...`);
      const clipPaths = await generateClipsBatch(prompts, dir);
      console.log(` ${clipPaths.length} ok`);

      if (clipPaths.length === 0) {
        console.log('  ❌ No Sora clips generated, skipping');
        fail++;
        fs.rmSync(dir, { recursive: true, force: true });
        continue;
      }

      // 4. Concatenate clips to match audio duration
      const concatPath = path.join(dir, 'video-raw.mp4');
      process.stdout.write('  Concat...');
      concatenateClips(clipPaths, concatPath, dur);
      console.log(' done');

      // 5. Composite with captions + branding
      const finalPath = path.join(dir, 'final.mp4');
      process.stdout.write('  Composite...');
      compositeWithCaptions(concatPath, audioPath, srtPath, finalPath, lesson.title, num, total, dur);
      console.log(' done');

      // 6. Upload
      const storagePath = `hvac/hvac-lesson-${String(num).padStart(3, '0')}.mp4`;
      process.stdout.write('  Upload...');
      const url = await uploadVideo(finalPath, storagePath);
      console.log(' done');

      // 7. Update DB
      await supabase.from('training_lessons').update({ video_url: url }).eq('id', lesson.id);

      const mb = fs.statSync(finalPath).size / 1024 / 1024;
      console.log(`  ✅ ${dur.toFixed(0)}s ${mb.toFixed(1)}MB ${clipPaths.length} clips`);
      ok++;

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    }

    // Cleanup lesson dir
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} ok, ${fail} fail, ${mins} min`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
