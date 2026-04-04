#!/usr/bin/env node
/**
 * Build talking-head videos for HVAC lessons 1-5.
 * Audio already generated in temp/hvac-makeover/.
 * Composites Marcus Johnson photo + audio into 1280x720 MP4.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT   = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO  = path.join(ROOT, 'public/images/instructors/marcus-johnson.jpg');
const TMP    = path.join(ROOT, 'temp/hvac-makeover');
const OUT    = path.join(ROOT, 'public/hvac/videos');
const FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const LESSONS = [
  { uuid: '2f172cb2-4657-5460-9b93-f9b062ad8dd2', title: 'Welcome to HVAC Training',        module: 'Module 1 - Orientation',          terms: 'EPA 608 Universal | OSHA 10 | WIOA | Apprentice Pathway' },
  { uuid: '96576bf0-cbd5-581f-99aa-f36e48e694fd', title: 'WIOA Funding & Support',           module: 'Module 1 - Orientation',          terms: 'WIOA | Workforce Ready Grant | ITA | WorkOne' },
  { uuid: '5c5b516c-2e7c-5cae-8231-1f4483c1a912', title: 'HVAC Career Pathways',             module: 'Module 1 - Orientation',          terms: 'Apprentice to Master | EPA 608 Universal | 8000 OJT Hours' },
  { uuid: '4097148b-7a06-5784-9807-5e3470d4c091', title: 'Orientation Quiz',                 module: 'Module 1 - Orientation',          terms: '80% Attendance | 70% Pass Score | Proctored Exam' },
  { uuid: 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56', title: 'How HVAC Systems Work',            module: 'Module 2 - Fundamentals & Safety', terms: 'Compressor | Condenser | Metering Device | Evaporator' },
];

function esc(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\u2019')
    .replace(/:/g, '\\:')
    .replace(/\[/g, '(').replace(/\]/g, ')')
    .replace(/,/g, ' ').replace(/&/g, 'and').replace(/%/g, 'pct');
}

function buildFilter(lesson) {
  const t = esc(lesson.title);
  const m = esc(lesson.module);
  const terms = esc(lesson.terms);

  return [
    `[0:v]scale=560:720:force_original_aspect_ratio=increase,crop=560:720[photo]`,
    `color=c=0x0f172a:size=720x720:rate=25[panel]`,
    `color=c=0xea580c:size=1280x6:rate=25[accent]`,
    `[photo][panel]hstack=inputs=2[base]`,
    `[base][accent]overlay=0:714[wa]`,
    `[wa]drawtext=fontfile='${FONT_R}':text='${m}':fontcolor=0xea580c:fontsize=17:x=592:y=44[mod]`,
    `[mod]drawtext=fontfile='${FONT_B}':text='${t}':fontcolor=white:fontsize=26:x=592:y=80[tit]`,
    `[tit]drawbox=x=592:y=140:w=640:h=1:color=0x334155:t=fill[div]`,
    `[div]drawtext=fontfile='${FONT_B}':text='KEY TERMS':fontcolor=0x94a3b8:fontsize=13:x=592:y=158[kt]`,
    `[kt]drawtext=fontfile='${FONT_R}':text='${terms}':fontcolor=0xe2e8f0:fontsize=17:x=592:y=184:line_spacing=10[trm]`,
    `[trm]drawbox=x=0:y=638:w=560:h=82:color=0x0f172a@0.88:t=fill[nb]`,
    `[nb]drawtext=fontfile='${FONT_B}':text='Marcus Johnson':fontcolor=white:fontsize=20:x=20:y=658[nm]`,
    `[nm]drawtext=fontfile='${FONT_R}':text='HVAC Instructor - Elevate for Humanity':fontcolor=0xea580c:fontsize=14:x=20:y=682[final]`,
  ].join(';');
}

for (const lesson of LESSONS) {
  const audioPath = path.join(TMP, `${lesson.uuid}.mp3`);
  const outPath   = path.join(OUT, `lesson-${lesson.uuid}.mp4`);

  if (!fs.existsSync(audioPath)) {
    console.log(`⚠️  No audio for ${lesson.uuid} — skipping`);
    continue;
  }

  process.stdout.write(`Building: ${lesson.title} ... `);
  const filter = buildFilter(lesson);
  const cmd = `ffmpeg -y -loop 1 -i "${PHOTO}" -i "${audioPath}" -filter_complex "${filter}" -map "[final]" -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -pix_fmt yuv420p -shortest -movflags +faststart "${outPath}"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
    const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
    console.log(`✅ ${mb}MB`);
  } catch (e) {
    console.log(`❌ ${e.stderr?.toString().slice(-200)}`);
  }
}

console.log('\nDone.');
