/**
 * Uses GPT-4o vision to label each barber infection-control clip.
 * Extracts 3 frames per clip, sends to GPT-4o, gets a 1-line description
 * and a category tag. Outputs a JSON map: clipFile → { description, category }
 *
 * Categories:
 *   handwashing       — person washing hands at sink
 *   gloves_ppe        — putting on / wearing gloves or PPE
 *   barbicide_soak    — tools/combs/implements submerged in blue/green disinfectant jar
 *   tool_cleaning     — brushing/wiping/spraying tools
 *   autoclave         — autoclave machine, sterilization pouches, heat/pressure equipment
 *   tool_storage      — clean tools laid out, stored, or in case
 *   barbershop_general — barbershop interior, chair, station, general shop
 *   client_service    — barber cutting/shaving a client
 *   neck_strip_cape   — neck strip, cape, draping
 *   sharps_disposal   — sharps container, blade disposal
 *   first_aid         — wound care, bandage, first aid kit
 *   inspection        — clipboard, checklist, inspector
 *   other             — anything else
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const CLIPS_DIR = path.join(process.cwd(), 'public/videos/barber-infection-clips');
const THUMBS_DIR = path.join(CLIPS_DIR, 'thumbs');
const OUT_FILE = path.join(CLIPS_DIR, 'clip-labels.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const CATEGORIES = [
  'handwashing', 'gloves_ppe', 'barbicide_soak', 'tool_cleaning',
  'autoclave', 'tool_storage', 'barbershop_general', 'client_service',
  'neck_strip_cape', 'sharps_disposal', 'first_aid', 'inspection', 'other'
];

async function labelClip(clipFile: string): Promise<{ description: string; category: string }> {
  const base = path.basename(clipFile, '.mp4');
  // Extract 3 frames: 1s, middle, near end
  const dur = parseFloat(execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${clipFile}"`,
    { encoding: 'utf-8' }
  ).trim()) || 8;

  const frames: string[] = [];
  for (const t of [1, dur / 2, dur - 1].map(x => Math.max(0.5, x))) {
    const fp = path.join(THUMBS_DIR, `${base}-t${t.toFixed(0)}.jpg`);
    execSync(
      `ffmpeg -y -ss ${t} -i "${clipFile}" -vframes 1 -q:v 3 -vf "scale=480:270" "${fp}"`,
      { stdio: 'pipe' }
    );
    frames.push(fp);
  }

  const imageContents = frames.map(fp => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:image/jpeg;base64,${fs.readFileSync(fp).toString('base64')}`,
      detail: 'low' as const,
    },
  }));

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `These are 3 frames from a short video clip used in a barber apprenticeship infection-control lesson.
Describe what is happening in ONE sentence (max 15 words).
Then on a new line write only the single best category from this list:
${CATEGORIES.join(', ')}

Format:
DESCRIPTION: <one sentence>
CATEGORY: <one word from list>`,
        },
        ...imageContents,
      ],
    }],
  });

  const text = res.choices[0].message.content || '';
  const descMatch = text.match(/DESCRIPTION:\s*(.+)/i);
  const catMatch = text.match(/CATEGORY:\s*(\w+)/i);
  return {
    description: descMatch?.[1]?.trim() || 'unknown',
    category: catMatch?.[1]?.trim().toLowerCase() || 'other',
  };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  fs.mkdirSync(THUMBS_DIR, { recursive: true });

  const clips = fs.readdirSync(CLIPS_DIR)
    .filter(f => f.endsWith('.mp4'))
    .sort();

  // Load existing results if any
  const existing: Record<string, { description: string; category: string }> =
    fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8')) : {};

  console.log(`\nLabeling ${clips.length} clips...\n`);

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    if (existing[clip]) {
      console.log(`⏭  [${i+1}/${clips.length}] ${clip} — ${existing[clip].category}`);
      continue;
    }
    process.stdout.write(`[${i+1}/${clips.length}] ${clip}...`);
    try {
      const label = await labelClip(path.join(CLIPS_DIR, clip));
      existing[clip] = label;
      fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
      console.log(` ${label.category} — ${label.description}`);
    } catch (e: any) {
      console.error(` ERROR: ${e.message}`);
      existing[clip] = { description: 'error', category: 'other' };
    }
  }

  console.log(`\nDone. Labels saved to ${OUT_FILE}`);

  // Print summary by category
  const byCat: Record<string, string[]> = {};
  for (const [file, label] of Object.entries(existing)) {
    if (!byCat[label.category]) byCat[label.category] = [];
    byCat[label.category].push(file);
  }
  console.log('\n=== BY CATEGORY ===');
  for (const [cat, files] of Object.entries(byCat).sort()) {
    console.log(`\n${cat} (${files.length}):`);
    files.forEach(f => console.log(`  ${f} — ${existing[f].description}`));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
