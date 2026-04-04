#!/usr/bin/env node
/**
 * HVAC Lesson Makeover — Talking-Head Video Generator
 *
 * For each of the first 5 lessons:
 *   1. Generates fresh TTS audio via OpenAI (voice: onyx)
 *   2. Composites Marcus Johnson photo + audio into a 1280x720 MP4 via ffmpeg
 *      - Left half: instructor photo with subtle zoom
 *      - Right half: dark panel with lesson title + key terms
 *      - Lower-third: name bar + module label
 *      - Orange accent bar at bottom
 *   3. Saves to public/hvac/videos/lesson-{uuid}.mp4 (overwrites existing)
 *
 * Usage:
 *   node scripts/generate-hvac-makeover-videos.mjs
 *   node scripts/generate-hvac-makeover-videos.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load env
const envPath = path.join(ROOT, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
}
const OPENAI_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');
const PHOTO   = path.join(ROOT, 'public/images/instructors/marcus-johnson.jpg');
const OUT_DIR = path.join(ROOT, 'public/hvac/videos');
const TMP_DIR = path.join(ROOT, 'temp/hvac-makeover');
const FONT_B  = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_R  = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const LESSONS = [
  {
    defId: 'hvac-01-01',
    uuid:  '2f172cb2-4657-5460-9b93-f9b062ad8dd2',
    title: 'Welcome to HVAC Technician Training',
    module: 'Module 1 — Program Orientation',
    script: `Welcome to the HVAC Technician Training Program. I'm Marcus Johnson, and I'll be your instructor throughout this course.

This is a 16-module program that prepares you for immediate employment as an apprentice HVAC technician. By the time you complete this program, you will hold three industry-recognized credentials: EPA 608 Universal certification, OSHA 10 construction safety certification, and CPR and AED certification.

Let me tell you why this matters. The HVAC industry is facing a severe technician shortage. The Bureau of Labor Statistics projects 13 percent job growth through 2031 — that's nearly double the national average for all occupations. Starting wages for certified technicians run between 16 and 22 dollars per hour. Experienced technicians earn 25 to 40 dollars per hour. Master technicians and those who start their own businesses earn significantly more.

Here's how the program is structured. The first five modules cover fundamentals — how HVAC systems work, electrical basics, heating systems, and the refrigeration cycle. Modules 6 through 10 are dedicated to EPA 608 certification — this is the federal certification you must have before you can legally purchase or handle any refrigerant. Modules 11 through 13 cover hands-on skills: refrigerant handling, ductwork, and troubleshooting. Modules 14 and 15 cover OSHA 10 and CPR. Module 16 is your final exam and career placement.

A few things you need to know right now. Attendance is not optional. WIOA funding requires 80 percent attendance minimum. If you miss class, contact your case manager before the absence, not after. Keep every document you receive — your funding depends on your paperwork being complete.

The HVAC career pathway goes: apprentice, journeyman, master technician, and contractor. You are starting at apprentice. Every hour you work in the field counts toward your journeyman hours. This program gets you certified and job-ready. The rest is up to you.

Let's get started.`,
    keyTerms: ['EPA 608 Universal', 'OSHA 10', 'WIOA Funding', 'Apprentice → Journeyman → Master'],
  },
  {
    defId: 'hvac-01-02',
    uuid:  '96576bf0-cbd5-581f-99aa-f36e48e694fd',
    title: 'WIOA Funding & Support Services',
    module: 'Module 1 — Program Orientation',
    script: `This lesson covers WIOA funding — the Workforce Innovation and Opportunity Act — which is the primary funding source for most students in this program.

WIOA is federal money administered through your local WorkOne office. If you qualify, it covers tuition, tools, transportation assistance, childcare, work clothing, and your certification exam fees. That means EPA 608, OSHA 10, and CPR are all covered. You pay nothing out of pocket.

Here's what WIOA covers and what it doesn't. It covers training costs at approved providers — we are on the Eligible Training Provider List, which means we qualify. It covers support services like bus passes, gas cards, and childcare vouchers. It does not cover living expenses or replace your income.

To access WIOA funding, you need to be registered at your local WorkOne office. If you haven't done that yet, do it today — not tomorrow, today. You will be assigned a case manager. That person controls your funding. Respond to them within 24 hours every time they contact you. If you go silent, your funding gets paused.

Indiana residents have an additional option: the Workforce Ready Grant. The WRG has no income requirements — it's available to any Indiana resident pursuing a high-demand certification. If you don't qualify for WIOA, the WRG may cover your tuition entirely.

For justice-involved individuals, Job Ready Indy provides additional support services and funding pathways. Ask your case manager about this specifically.

Documentation is everything. Keep copies of every document you submit. If your case manager asks for something, get it to them the same day. Missing a documentation deadline is the number one reason students lose funding — not because they were ineligible, but because paperwork was late.

If you have a transportation or childcare emergency that might cause you to miss class, call your case manager before you miss — not after. They have emergency support funds available, but only if you ask in advance.`,
    keyTerms: ['WIOA — Workforce Innovation Act', 'Workforce Ready Grant (WRG)', 'Individual Training Account', 'WorkOne Case Manager'],
  },
  {
    defId: 'hvac-01-03',
    uuid:  '5c5b516c-2e7c-5cae-8231-1f4483c1a912',
    title: 'HVAC Career Pathways',
    module: 'Module 1 — Program Orientation',
    script: `Let's talk about where this career can take you. Understanding the full pathway from day one helps you make better decisions about your training and your first job.

The HVAC career ladder has four levels: apprentice, journeyman, master technician, and contractor.

As an apprentice, you work under the supervision of a licensed journeyman. You're building skills and accumulating on-the-job hours. In Indiana, you need 8,000 hours — roughly four years of full-time work — to qualify for your journeyman exam. Starting wages run 16 to 22 dollars per hour.

A journeyman technician can work independently on most residential and light commercial systems. Journeyman wages typically run 22 to 32 dollars per hour. Many technicians stay at this level for their entire career and do very well.

A master technician has passed the master exam and can pull permits, supervise apprentices, and take on more complex commercial work. Master technicians earn 30 to 45 dollars per hour or more.

A contractor has their business license and runs their own company. This is where the real income potential is — successful HVAC contractors earn six figures. But it requires business skills on top of technical skills.

Now let's talk about specializations. Residential HVAC is the most common entry point — split systems, heat pumps, furnaces, and mini-splits in homes and small buildings. Commercial HVAC involves larger rooftop units, chillers, and building automation systems. Refrigeration covers commercial refrigeration in grocery stores, restaurants, and cold storage. Industrial HVAC handles process cooling and large-scale systems.

EPA 608 Universal certification — which you will earn in this program — qualifies you to work on all of these. That's why Universal matters. Type I only covers small appliances. Type II covers high-pressure systems. Type III covers low-pressure systems. Universal means all four sections passed, all equipment types covered.

The job market right now is exceptional. HVAC technicians are in demand everywhere. Employers are actively recruiting graduates from programs like this one. Your job placement starts in Module 16, but the relationships you build with your instructors and employer partners start now.`,
    keyTerms: ['Apprentice → Journeyman → Master', 'EPA 608 Universal', 'Residential vs Commercial', '8,000 OJT Hours for Journeyman'],
  },
  {
    defId: 'hvac-01-04',
    uuid:  '4097148b-7a06-5784-9807-5e3470d4c091',
    title: 'Orientation Quiz',
    module: 'Module 1 — Program Orientation',
    script: `Before we move into the technical content, let's make sure you have the foundation locked in.

This orientation quiz covers three areas: program requirements, WIOA funding rules, and the HVAC career pathway.

On program requirements: you need 80 percent attendance to maintain your funding. You need to pass each module quiz with a minimum score of 80 percent. Labs require instructor sign-off — you cannot self-certify a lab completion. The EPA 608 exam in Module 16 is proctored — you sit in front of a webcam and a proctor watches you take it.

On WIOA funding: your Individual Training Account pays tuition directly to the training provider. Your case manager at WorkOne manages your funding. You must respond to your case manager within 24 hours. Documentation deadlines are hard deadlines — missing them pauses your funding.

On the career pathway: the four levels are apprentice, journeyman, master, and contractor. Indiana requires 8,000 on-the-job hours for journeyman qualification. EPA 608 Universal requires passing all four sections: Core, Type I, Type II, and Type III. The passing score for each section is 70 percent.

Take your time on the quiz. Read each question carefully. If you're unsure about something, go back and review the lesson before submitting.

After you pass the orientation quiz, we move into Module 2: HVAC Fundamentals and Safety. That's where the technical training begins.`,
    keyTerms: ['80% Attendance Minimum', '70% EPA 608 Pass Score', 'Proctored Exam Format', 'ITA — Individual Training Account'],
  },
  {
    defId: 'hvac-02-01',
    uuid:  'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56',
    title: 'How HVAC Systems Work',
    module: 'Module 2 — HVAC Fundamentals & Safety',
    script: `Welcome to Module 2. This lesson covers how HVAC systems work — the fundamental principles that everything else in this program builds on.

HVAC stands for Heating, Ventilation, and Air Conditioning. Every HVAC system does one or more of three things: it moves heat, it moves air, and it controls humidity. Understanding heat transfer is the foundation of everything.

Here's the key principle: heat always moves from hot to cold. Always. You cannot push heat somewhere — you can only move it from a warmer place to a cooler place. Air conditioning doesn't create cold air. It removes heat from inside your home and dumps it outside. A furnace doesn't create warmth from nothing — it transfers heat from burning gas into your air supply.

Let's walk through a standard split system air conditioner. A split system has two main units: the outdoor condenser unit and the indoor air handler. They're connected by refrigerant lines — a liquid line and a suction line.

The refrigeration cycle has four stages. First, the compressor. The compressor is the heart of the system. It takes low-pressure refrigerant vapor from the indoor unit and compresses it into high-pressure, high-temperature vapor. Think of it like a pump — it's the only component in the system that adds energy.

Second, the condenser. The high-pressure hot vapor flows to the outdoor condenser coil. A fan blows outdoor air across the coil. The refrigerant releases its heat to the outdoor air and condenses from vapor into liquid. This is why the air blowing out of your outdoor unit is hot — it's carrying the heat from inside your house.

Third, the metering device. The high-pressure liquid refrigerant passes through a metering device — either a TXV or a fixed orifice. This drops the pressure dramatically, which causes the refrigerant temperature to drop as well.

Fourth, the evaporator. The cold, low-pressure refrigerant enters the indoor evaporator coil. Warm air from your home blows across the coil. The refrigerant absorbs that heat and boils from liquid into vapor. The air leaving the coil is now cooler — that's your conditioned air. The refrigerant vapor returns to the compressor and the cycle repeats.

For heating, a gas furnace works differently. The gas valve opens, the igniter lights the burner, and the heat exchanger gets hot. The blower motor pushes air across the heat exchanger, picking up heat, and distributes it through your ductwork. The combustion gases — including carbon monoxide — stay inside the heat exchanger and exhaust through the flue. They never mix with your breathing air. A cracked heat exchanger is a carbon monoxide hazard — this is why furnace inspections matter.

Heat pumps can do both heating and cooling. In cooling mode, they work exactly like an air conditioner. In heating mode, they reverse the cycle — the outdoor coil becomes the evaporator, absorbing heat from outdoor air, and the indoor coil becomes the condenser, releasing that heat inside. Heat pumps work efficiently down to about 35 degrees Fahrenheit. Below that, auxiliary electric heat strips kick in.

These four components — compressor, condenser, metering device, evaporator — are on every system you will ever work on. Learn them cold. Everything else in this program builds on this foundation.`,
    keyTerms: ['Compressor → Condenser → Metering Device → Evaporator', 'Heat Moves Hot to Cold', 'Split System Components', 'Heat Pump Reversing Valve'],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  if (DRY_RUN) { console.log('  [dry-run]', cmd.slice(0, 120)); return; }
  execSync(cmd, { stdio: 'pipe', ...opts });
}

async function generateTTS(text, outputPath) {
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice: 'onyx',
      input: text,
      speed: 0.95,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`TTS failed: ${err}`);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outputPath, buf);
  return outputPath;
}

function escFF(s) {
  // Escape string for ffmpeg drawtext
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\u2019")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/&/g, 'and')
    .replace(/%/g, 'pct');
}

async function buildVideo(lesson, audioPath, outputPath) {
  const W = 1280, H = 720;
  const photoW = 560; // left panel width
  const panelX = photoW; // right panel starts here

  // Key terms — max 4, truncated to fit
  const terms = lesson.keyTerms.slice(0, 4);

  // Build ffmpeg drawtext filters for right panel
  const titleLines = wrapText(lesson.title, 28); // ~28 chars per line
  const moduleLabel = escFF(lesson.module);

  let filters = [];

  // 1. Scale photo to fill left panel (560x720), slight zoom via crop
  filters.push(`[0:v]scale=${photoW}:${H}:force_original_aspect_ratio=increase,crop=${photoW}:${H}[photo]`);

  // 2. Dark right panel (720x720)
  const panelW = W - photoW;
  filters.push(`color=c=0x0f172a:size=${panelW}x${H}:rate=25[panel]`);

  // 3. Orange accent strip at bottom of right panel (full width, 6px)
  filters.push(`color=c=0xea580c:size=${W}x6:rate=25[accent]`);

  // 4. Overlay: photo left, panel right
  filters.push(`[photo][panel]hstack=inputs=2[base]`);

  // 5. Overlay accent bar at bottom
  filters.push(`[base][accent]overlay=0:${H - 6}[withaccent]`);

  // 6. Draw module label (top of right panel)
  filters.push(
    `[withaccent]drawtext=fontfile='${FONT_R}':text='${escFF(lesson.module)}':` +
    `fontcolor=0xea580c:fontsize=18:x=${panelX + 32}:y=48[mod]`
  );

  // 7. Draw lesson title (wrapped, bold)
  let yPos = 90;
  let lastFilter = 'mod';
  for (let i = 0; i < titleLines.length; i++) {
    const tag = `title${i}`;
    filters.push(
      `[${lastFilter}]drawtext=fontfile='${FONT_B}':text='${escFF(titleLines[i])}':` +
      `fontcolor=white:fontsize=26:x=${panelX + 32}:y=${yPos}[${tag}]`
    );
    yPos += 36;
    lastFilter = tag;
  }

  // 8. Divider line
  yPos += 16;
  filters.push(
    `[${lastFilter}]drawbox=x=${panelX + 32}:y=${yPos}:w=${panelW - 64}:h=1:color=0x334155:t=fill[div]`
  );
  yPos += 20;
  lastFilter = 'div';

  // 9. "KEY TERMS" label
  filters.push(
    `[${lastFilter}]drawtext=fontfile='${FONT_B}':text='KEY TERMS':` +
    `fontcolor=0x94a3b8:fontsize=14:x=${panelX + 32}:y=${yPos}[kt]`
  );
  yPos += 28;
  lastFilter = 'kt';

  // 10. Each key term
  for (let i = 0; i < terms.length; i++) {
    const tag = `term${i}`;
    const termLines = wrapText('• ' + terms[i], 30);
    for (let j = 0; j < termLines.length; j++) {
      const subTag = `${tag}_${j}`;
      const color = j === 0 ? 'white' : '0xcbd5e1';
      filters.push(
        `[${lastFilter}]drawtext=fontfile='${j === 0 ? FONT_B : FONT_R}':text='${escFF(termLines[j])}':` +
        `fontcolor=${color}:fontsize=18:x=${panelX + 32}:y=${yPos}[${subTag}]`
      );
      yPos += 26;
      lastFilter = subTag;
    }
    yPos += 6;
  }

  // 11. Lower-third name bar on photo side
  // Semi-transparent dark bar
  filters.push(
    `[${lastFilter}]drawbox=x=0:y=${H - 80}:w=${photoW}:h=80:color=0x0f172a@0.85:t=fill[namebg]`
  );
  filters.push(
    `[namebg]drawtext=fontfile='${FONT_B}':text='Marcus Johnson':` +
    `fontcolor=white:fontsize=20:x=20:y=${H - 58}[name]`
  );
  filters.push(
    `[name]drawtext=fontfile='${FONT_R}':text='HVAC Instructor':` +
    `fontcolor=0xea580c:fontsize=15:x=20:y=${H - 34}[final]`
  );

  const filterStr = filters.join(';');

  const cmd = [
    'ffmpeg -y',
    `-loop 1 -i "${PHOTO}"`,
    `-i "${audioPath}"`,
    `-filter_complex "${filterStr}"`,
    `-map "[final]" -map 1:a`,
    `-c:v libx264 -preset fast -crf 22`,
    `-c:a aac -b:a 128k`,
    `-pix_fmt yuv420p`,
    `-shortest`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd);
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== HVAC Lesson Makeover — Talking-Head Generator ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  if (!DRY_RUN) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (let i = 0; i < LESSONS.length; i++) {
    const lesson = LESSONS[i];
    console.log(`[${i + 1}/${LESSONS.length}] ${lesson.title}`);

    const audioPath = path.join(TMP_DIR, `${lesson.uuid}.mp3`);
    const videoPath = path.join(OUT_DIR, `lesson-${lesson.uuid}.mp4`);

    // Step 1: TTS
    process.stdout.write('  → Generating TTS audio...');
    if (!DRY_RUN) {
      await generateTTS(lesson.script, audioPath);
      const dur = execSync(
        `ffprobe -v quiet -print_format json -show_format "${audioPath}"`,
        { encoding: 'utf8' }
      );
      const secs = parseFloat(JSON.parse(dur).format?.duration || '0');
      console.log(` ${Math.round(secs)}s`);
    } else {
      console.log(' [skipped]');
    }

    // Step 2: Composite video
    process.stdout.write('  → Building video...');
    if (!DRY_RUN) {
      buildVideo(lesson, audioPath, videoPath);
      const stat = fs.statSync(videoPath);
      console.log(` ${(stat.size / 1024 / 1024).toFixed(1)}MB → ${videoPath}`);
    } else {
      console.log(' [skipped]');
    }
  }

  console.log('\n✅ Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
