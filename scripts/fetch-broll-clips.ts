#!/usr/bin/env tsx
/**
 * Downloads precise b-roll clips from Pexels matched to exact scene topics.
 * Each clip key maps directly to a scene heading in the barber course.
 * Multiple clips per topic are stitched into one 90-120s source file.
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { execSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY!;
const OUT_DIR = path.join(process.cwd(), 'public/videos/broll');
const TMP_DIR = path.join(OUT_DIR, 'tmp');
const LOCAL_VIDEO_ROOT = path.join(process.cwd(), 'public/videos');
const FFMPEG_BIN = ffmpegInstaller.path || 'ffmpeg';
const FFPROBE_BIN = ffprobeInstaller.path || 'ffprobe';

for (const bin of [FFMPEG_BIN, FFPROBE_BIN]) {
  try {
    fs.chmodSync(bin, 0o755);
  } catch {}
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

// Every unique scene topic across all barber course lessons.
// All queries are barber/salon-specific so every clip shows barbershop context.
const TOPICS: { key: string; queries: string[]; mustMatch?: RegExp }[] = [
  // Core barbershop atmosphere
  {
    key: 'barbershop-intro',
    queries: [
      'barbershop interior barber chairs mirrors',
      'professional barbershop atmosphere customers',
      'barber shop busy day clients waiting',
    ],
    mustMatch: /barber|hair|salon|clipper|shear|fade/,
  },

  {
    key: 'apprentice-training',
    queries: [
      'barber apprentice learning mentor barbershop',
      'young barber training master barber',
      'barber student watching learning technique',
    ],
    mustMatch: /barber|hair|salon|clipper/,
  },

  {
    key: 'logging-hours-timesheet',
    queries: [
      'barber signing timesheet apprenticeship hours',
      'barber paperwork clipboard hours log',
      'barber writing notes records barbershop',
    ],
    mustMatch: /barber|hair|salon|clipper/,
  },

  {
    key: 'barber-license-exam',
    queries: [
      'barber license certificate professional wall',
      'cosmetology barber state board exam',
      'barber studying exam cosmetology books',
    ],
    mustMatch: /barber|hair|salon|cosmetol/,
  },

  // Sanitation & disinfection — all barber-specific
  {
    key: 'disinfecting-clippers',
    queries: [
      'barber disinfecting clippers barbicide jar',
      'barber cleaning electric clippers spray',
      'barber tools disinfectant solution soaking',
    ],
    mustMatch: /barber|clipper|hair|salon|tool/,
  },

  {
    key: 'disinfecting-scissors',
    queries: [
      'barber cleaning scissors alcohol wipe',
      'barber sterilizing shears tools',
      'salon scissors disinfecting barbershop',
    ],
    mustMatch: /barber|scissor|shear|hair|salon/,
  },

  {
    key: 'washing-hands-barber',
    queries: [
      'barber washing hands sink barbershop',
      'barber hand hygiene before client',
      'barber handwashing soap professional',
    ],
    mustMatch: /barber|hair|salon|hand/,
  },

  {
    key: 'cleaning-barber-station',
    queries: [
      'barber wiping down station between clients',
      'barber cleaning chair cape barbershop',
      'barber sanitizing mirror counter station',
    ],
    mustMatch: /barber|hair|salon|chair/,
  },

  {
    key: 'neck-strip-cape',
    queries: [
      'barber placing neck strip client',
      'barber draping cape around client shoulders',
      'barber preparing client haircut cape',
    ],
    mustMatch: /barber|hair|cape|client|neck/,
  },

  {
    key: 'disposing-single-use',
    queries: [
      'barber disposing razor blade trash',
      'barber throwing away single use items',
      'barber safe disposal sharps barbershop',
    ],
    mustMatch: /barber|hair|razor|blade|salon/,
  },

  {
    key: 'blood-exposure-protocol',
    queries: [
      'barber wearing gloves blood safety',
      'barber gloves protective equipment client',
      'barber safety gloves handling cut',
    ],
    mustMatch: /barber|hair|glove|salon/,
  },

  {
    key: 'osha-barbershop',
    queries: [
      'barbershop safety regulations poster',
      'barber workplace safety compliance',
      'salon safety rules professional barbershop',
    ],
    mustMatch: /barber|hair|salon|safe/,
  },

  {
    key: 'ppe-barber',
    queries: [
      'barber wearing gloves mask apron',
      'barber protective equipment ppe barbershop',
      'barber safety gear gloves working',
    ],
    mustMatch: /barber|hair|glove|salon|mask/,
  },

  {
    key: 'chemical-handling',
    queries: [
      'barber handling chemical products gloves',
      'salon chemical products shelf barbershop',
      'barber mixing chemical hair products safely',
    ],
    mustMatch: /barber|hair|salon|chemical/,
  },

  {
    key: 'patch-test',
    queries: [
      'salon patch test hair color skin',
      'barber allergy test behind ear client',
      'hair color patch test professional salon',
    ],
    mustMatch: /barber|hair|salon|skin|color/,
  },

  {
    key: 'sds-safety-data-sheet',
    queries: [
      'salon reading chemical label safety data',
      'barber chemical product safety information',
      'professional reading product label barbershop',
    ],
    mustMatch: /barber|hair|salon|chemical|product/,
  },

  // Licensing & law
  {
    key: 'indiana-license-renewal',
    queries: [
      'barber license renewal certificate professional',
      'cosmetology license state board renewal',
      'barber framed license wall barbershop',
    ],
    mustMatch: /barber|hair|salon|licens|cosmetol/,
  },

  {
    key: 'state-board-exam-prep',
    queries: [
      'barber student reading textbook barbershop',
      'barber studying cosmetology book notes',
      'barber apprentice learning theory classroom',
    ],
    mustMatch: /barber|hair|salon|cosmetol|book|study/,
  },

  {
    key: 'scope-of-practice',
    queries: [
      'barber performing full service client barbershop',
      'barber complete haircut shave service',
      'professional barber services barbershop',
    ],
    mustMatch: /barber|hair|salon|clipper/,
  },

  // Life skills
  {
    key: 'smart-goals-planning',
    queries: [
      'barber writing career goals notebook',
      'barber planning schedule goals barbershop',
      'professional barber career planning',
    ],
    mustMatch: /barber|hair|salon/,
  },

  {
    key: 'time-management-barber',
    queries: [
      'barber busy schedule multiple clients waiting',
      'barbershop busy day appointments',
      'barber managing time clients queue',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  {
    key: 'ethics-professional',
    queries: [
      'barber professional handshake client trust',
      'barber honest conversation client barbershop',
      'barber professional conduct client',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  // Professional image
  {
    key: 'professional-appearance',
    queries: [
      'barber professional uniform clean appearance',
      'well groomed barber professional attire',
      'barber clean pressed uniform barbershop',
    ],
    mustMatch: /barber|hair|salon/,
  },

  {
    key: 'first-impression-barber',
    queries: [
      'barber greeting client warmly barbershop',
      'barber welcoming new client handshake',
      'barber smiling greeting client door',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  {
    key: 'client-retention',
    queries: [
      'barber loyal client returning barbershop',
      'barber client happy satisfied haircut',
      'barber client relationship regular customer',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  {
    key: 'ergonomics-posture',
    queries: [
      'barber standing correct posture working',
      'barber ergonomic position cutting hair',
      'barber back posture standing long hours',
    ],
    mustMatch: /barber|hair|salon/,
  },

  // Communication
  {
    key: 'client-consultation',
    queries: [
      'barber consulting client mirror discussing haircut',
      'barber talking client before haircut',
      'barber client consultation barbershop',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  {
    key: 'managing-expectations',
    queries: [
      'barber showing client photo haircut reference',
      'barber explaining haircut style client',
      'barber client discussing expectations style',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  {
    key: 'handling-complaints',
    queries: [
      'barber addressing client concern barbershop',
      'barber resolving client complaint professionally',
      'barber client unhappy professional response',
    ],
    mustMatch: /barber|hair|salon|client/,
  },

  // Chemistry
  {
    key: 'ph-scale-hair',
    queries: [
      'hair chemistry ph scale salon',
      'hair structure science professional salon',
      'barber hair chemistry education',
    ],
    mustMatch: /barber|hair|salon/,
  },

  {
    key: 'hair-color-chemical',
    queries: [
      'barber applying hair color client',
      'hair coloring process salon professional',
      'barber mixing hair color developer bowl',
    ],
    mustMatch: /barber|hair|salon|color|colour/,
  },

  {
    key: 'relaxer-texturizer',
    queries: [
      'hair relaxer chemical treatment salon',
      'barber applying relaxer hair client',
      'chemical hair straightening professional salon',
    ],
    mustMatch: /barber|hair|salon|relax|chemical/,
  },

  // Wellness
  {
    key: 'burnout-wellness',
    queries: [
      'barber taking break resting barbershop',
      'barber self care wellness after work',
      'barber relaxing break between clients',
    ],
    mustMatch: /barber|hair|salon/,
  },

  // Core cutting skills
  {
    key: 'barber-cutting-hair',
    queries: [
      'barber cutting hair clippers client',
      'barber fade haircut clippers barbershop',
      'barber scissors cutting hair client',
    ],
    mustMatch: /barber|hair|clipper|fade|cut/,
  },

  {
    key: 'barber-shaving',
    queries: [
      'barber straight razor shave client face',
      'barber hot towel shave barbershop',
      'barber shaving client razor lather',
    ],
    mustMatch: /barber|shav|razor|face/,
  },

  {
    key: 'barber-beard-trim',
    queries: [
      'barber trimming beard client clippers',
      'barber beard shaping design barbershop',
      'barber grooming beard mustache client',
    ],
    mustMatch: /barber|beard|hair|facial/,
  },

  {
    key: 'barber-shampoo',
    queries: [
      'barber shampooing client hair shampoo bowl',
      'barber washing hair client salon sink',
      'barber scalp massage shampoo client',
    ],
    mustMatch: /barber|hair|shampoo|scalp|wash/,
  },

  {
    key: 'barber-styling',
    queries: [
      'barber styling hair pomade product client',
      'barber finishing haircut applying product',
      'barber hair styling product application',
    ],
    mustMatch: /barber|hair|style|product|pomade/,
  },

  {
    key: 'barber-lineup',
    queries: [
      'barber lineup edge hairline trimmer',
      'barber edging hairline detailing client',
      'barber sharp lineup hairline barbershop',
    ],
    mustMatch: /barber|hair|edge|line|trim/,
  },
];

async function searchPexels(query: string, count: number, mustMatch?: RegExp): Promise<string[]> {
  const urls: string[] = [];
  for (let page = 1; page <= 5 && urls.length < count; page++) {
    let res: Response;
    try {
      res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&page=${page}`,
        { headers: PEXELS_KEY ? { Authorization: PEXELS_KEY } : {} },
      );
    } catch {
      break;
    }
    if (!res.ok) break;
    const d = (await res.json()) as any;
    for (const v of d.videos || []) {
      if (urls.length >= count) break;
      // Filter: only keep clips whose tags/url/user contain barber-related terms
      if (mustMatch) {
        const meta = [
          v.url ?? '',
          (v.tags ?? []).join(' '),
          v.user?.name ?? '',
          ...(v.video_pictures ?? []).map((p: any) => p.picture ?? ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!mustMatch.test(meta)) continue;
      }
      const files = (v.video_files || []) as any[];
      const hd =
        files.find((f: any) => f.quality === 'hd' && f.width >= 1280) ||
        files.find((f: any) => f.width >= 1280) ||
        files[0];
      if (hd?.link) urls.push(hd.link);
    }
  }
  return urls;
}

async function searchPixabay(query: string, count: number, mustMatch?: RegExp): Promise<string[]> {
  const urls: string[] = [];
  for (let page = 1; page <= 3 && urls.length < count; page++) {
    let res: Response;
    try {
      res = await fetch(
        `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&video_type=film&orientation=horizontal&per_page=15&page=${page}`,
      );
    } catch {
      break;
    }
    if (!res.ok) break;
    const d = (await res.json()) as any;
    for (const v of d.hits || []) {
      if (urls.length >= count) break;
      if (mustMatch) {
        const meta = [v.tags ?? '', v.user ?? '', v.pageURL ?? ''].join(' ').toLowerCase();
        if (!mustMatch.test(meta)) continue;
      }
      const url = v.videos?.medium?.url || v.videos?.small?.url;
      if (url) urls.push(url);
    }
  }
  return urls;
}

// Mixkit — free, no API key, barber/salon clips
const MIXKIT_BARBER_CLIPS: Record<string, string[]> = {
  'barbershop-intro': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-shop-interior-4516-large.mp4',
  ],
  'barber-cutting-hair': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-a-clients-hair-4517-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-barber-cutting-hair-4518-large.mp4',
  ],
  'apprentice-training': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-teaching-an-apprentice-4519-large.mp4',
  ],
  'client-consultation': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-talking-to-a-client-4520-large.mp4',
  ],
  'disinfecting-clippers': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-cleaning-his-tools-4521-large.mp4',
  ],
  'neck-strip-cape': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-putting-a-cape-on-a-client-4522-large.mp4',
  ],
  'barber-fade': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-doing-a-fade-haircut-4523-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-fade-haircut-4524-large.mp4',
  ],
  'barber-lineup': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-lining-up-a-haircut-4525-large.mp4',
  ],
  'straight-razor-shave': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-shaving-a-client-4526-large.mp4',
  ],
  'beard-trim': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-trimming-a-beard-4527-large.mp4',
  ],
  'professional-appearance': [
    'https://assets.mixkit.co/videos/preview/mixkit-professional-barber-at-work-4528-large.mp4',
  ],
  'client-retention': [
    'https://assets.mixkit.co/videos/preview/mixkit-happy-client-at-barbershop-4529-large.mp4',
  ],
  'barber-styling': [
    'https://assets.mixkit.co/videos/preview/mixkit-barber-applying-product-to-hair-4530-large.mp4',
  ],
};

// Coverr — free, no API key
async function searchCoverr(query: string, count: number): Promise<string[]> {
  const urls: string[] = [];
  try {
    const res = await fetch(
      `https://coverr.co/api/videos/search?query=${encodeURIComponent(query)}&page=1&per_page=10`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return urls;
    const d = (await res.json()) as any;
    for (const v of d.hits || d.videos || []) {
      if (urls.length >= count) break;
      const url = v.urls?.mp4_1080 || v.urls?.mp4_720 || v.mp4;
      if (url) urls.push(url);
    }
  } catch {}
  return urls;
}

function listLocalVideoFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === OUT_DIR || full.startsWith(path.join(OUT_DIR, path.sep))) continue;
      files.push(...listLocalVideoFiles(full));
      continue;
    }
    if (entry.isFile() && full.toLowerCase().endsWith('.mp4')) {
      const rel = full.replace(`${LOCAL_VIDEO_ROOT}${path.sep}`, '').toLowerCase();
      if (rel.startsWith('broll/') || rel.startsWith('barber-lessons/')) continue;
      files.push(full);
    }
  }
  return files;
}

const STOP_WORDS = new Set([
  'and',
  'for',
  'the',
  'with',
  'from',
  'into',
  'that',
  'this',
  'your',
  'barber',
]);

function topicTokens(topic: { key: string; queries: string[] }): string[] {
  return Array.from(
    new Set(
      [topic.key, ...topic.queries]
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((t) => t.length >= 4 && !STOP_WORDS.has(t)),
    ),
  );
}

function selectLocalFallbackFiles(
  localFiles: string[],
  topic: { key: string; queries: string[] },
  count: number,
): string[] {
  const tokens = topicTokens(topic);
  const ranked = localFiles
    .map((file) => {
      const rel = file.replace(`${LOCAL_VIDEO_ROOT}${path.sep}`, '').toLowerCase();
      const score = tokens.reduce((acc, token) => (rel.includes(token) ? acc + 1 : acc), 0);
      return { file, score, rel };
    })
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));

  const matched = ranked.filter((r) => r.score > 0).map((r) => r.file);
  if (matched.length >= count) return matched.slice(0, count);

  const strongBarber = ranked
    .filter((r) =>
      /barber|salon|cosmetolog|fade|lineup|beard|razor|clipper|scissor|shampoo/.test(r.rel),
    )
    .map((r) => r.file);

  const seen = new Set<string>();
  const output: string[] = [];
  for (const f of [...matched, ...strongBarber, ...ranked.map((r) => r.file)]) {
    if (seen.has(f)) continue;
    seen.add(f);
    output.push(f);
    if (output.length >= count) break;
  }
  return output;
}

function probeDurationSeconds(file: string): number {
  try {
    return parseFloat(
      execSync(`"${FFPROBE_BIN}" -v quiet -show_entries format=duration -of csv=p=0 "${file}"`, {
        encoding: 'utf8',
      }).trim(),
    );
  } catch {
    return 0;
  }
}

function cutLocalSegment(input: string, outPath: string, segmentIndex: number): boolean {
  const total = probeDurationSeconds(input);
  if (!Number.isFinite(total) || total <= 4) return false;
  const targetDuration = Math.max(8, Math.min(18, Math.floor(total / 3)));
  const maxStart = Math.max(0, Math.floor(total - targetDuration - 1));
  const start = maxStart > 0 ? (segmentIndex * 11) % maxStart : 0;
  try {
    execSync(
      `"${FFMPEG_BIN}" -y -ss ${start} -t ${targetDuration} -i "${input}" -an -c:v libx264 -preset veryfast -crf 23 "${outPath}"`,
      { stdio: 'pipe', maxBuffer: 100 * 1024 * 1024, timeout: 120000 },
    );
    return fs.existsSync(outPath) && fs.statSync(outPath).size > 100000;
  } catch {
    return false;
  }
}

async function downloadClip(url: string, outPath: string): Promise<boolean> {
  try {
    execSync(`curl -L -s -o "${outPath}" "${url}"`, {
      stdio: 'pipe',
      maxBuffer: 200 * 1024 * 1024,
      timeout: 60000,
    });
    return fs.statSync(outPath).size > 100000;
  } catch {
    return false;
  }
}

function normalizeAndConcat(inputs: string[], outPath: string): number {
  const normalized: string[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const norm = path.join(TMP_DIR, `norm_${i}_${path.basename(outPath)}`);
    try {
      execSync(
        `"${FFMPEG_BIN}" -y -i "${inputs[i]}" ` +
          `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" ` +
          `-c:v libx264 -preset fast -crf 22 -an "${norm}"`,
        { stdio: 'pipe', maxBuffer: 100 * 1024 * 1024 },
      );
      normalized.push(norm);
    } catch {}
  }
  if (normalized.length === 0) throw new Error('No clips normalized');

  const listFile = path.join(TMP_DIR, `list_${path.basename(outPath)}.txt`);
  fs.writeFileSync(listFile, normalized.map((f) => `file '${f}'').join('\n'));
  execSync(`"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${listFile}" -c copy "${outPath}"`, {
    stdio: 'pipe',
    maxBuffer: 300 * 1024 * 1024,
  });

  normalized.forEach((f) => {
    try {
      fs.unlinkSync(f);
    } catch {}
  });
  try {
    fs.unlinkSync(listFile);
  } catch {}

  return parseFloat(
    execSync(`"${FFPROBE_BIN}" -v quiet -show_entries format=duration -of csv=p=0 "${outPath}"`, {
      encoding: 'utf8',
    }).trim(),
  );
}

// ─── Target: 50 clips per topic = ~600-900s of non-repeating footage per key ──
const TARGET_CLIPS_PER_TOPIC = 50;
// Minimum stitched duration before we consider a topic "done"
const MIN_DURATION_SECONDS = 300; // 5 minutes per topic key

async function fetchAllUrlsForTopic(topic: {
  key: string;
  queries: string[];
  mustMatch?: RegExp;
}): Promise<string[]> {
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  };

  // Round 1 — Pexels (filtered), all queries, pages 1-10
  for (const query of topic.queries) {
    for (let page = 1; page <= 10 && urls.length < TARGET_CLIPS_PER_TOPIC * 2; page++) {
      try {
        const res = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&page=${page}`,
          { headers: PEXELS_KEY ? { Authorization: PEXELS_KEY } : {} },
        );
        if (!res.ok) break;
        const d = (await res.json()) as any;
        if (!d.videos?.length) break;
        for (const v of d.videos) {
          if (topic.mustMatch) {
            const meta = [v.url ?? '', (v.tags ?? []).join(' '), v.user?.name ?? '']
              .join(' ')
              .toLowerCase();
            if (!topic.mustMatch.test(meta)) continue;
          }
          const files = (v.video_files || []) as any[];
          const hd =
            files.find((f: any) => f.quality === 'hd' && f.width >= 1280) ||
            files.find((f: any) => f.width >= 1280) ||
            files[0];
          if (hd?.link) add(hd.link);
        }
      } catch {
        break;
      }
    }
  }

  // Round 2 — Pixabay (filtered), all queries, pages 1-5
  if (PIXABAY_KEY) {
    for (const query of topic.queries) {
      for (let page = 1; page <= 5 && urls.length < TARGET_CLIPS_PER_TOPIC * 2; page++) {
        try {
          const res = await fetch(
            `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&video_type=film&orientation=horizontal&per_page=20&page=${page}`,
          );
          if (!res.ok) break;
          const d = (await res.json()) as any;
          if (!d.hits?.length) break;
          for (const v of d.hits) {
            if (topic.mustMatch) {
              const meta = [v.tags ?? '', v.user ?? ''].join(' ').toLowerCase();
              if (!topic.mustMatch.test(meta)) continue;
            }
            const url = v.videos?.large?.url || v.videos?.medium?.url || v.videos?.small?.url;
            if (url) add(url);
          }
        } catch {
          break;
        }
      }
    }
  }

  // Round 3 — Mixkit (no key, free forever)
  const mixkitUrls = MIXKIT_BARBER_CLIPS[topic.key] ?? [];
  for (const u of mixkitUrls) add(u);

  // Round 4 — Coverr (no key)
  for (const query of topic.queries.slice(0, 2)) {
    const coverrUrls = await searchCoverr(query, 10);
    for (const u of coverrUrls) add(u);
  }

  // Round 5 — Pexels unfiltered fallback if still short
  if (urls.length < 10) {
    for (const query of topic.queries) {
      for (let page = 1; page <= 5 && urls.length < TARGET_CLIPS_PER_TOPIC; page++) {
        try {
          const res = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&page=${page}`,
            { headers: PEXELS_KEY ? { Authorization: PEXELS_KEY } : {} },
          );
          if (!res.ok) break;
          const d = (await res.json()) as any;
          for (const v of d.videos || []) {
            const files = (v.video_files || []) as any[];
            const hd = files.find((f: any) => f.width >= 1280) || files[0];
            if (hd?.link) add(hd.link);
          }
        } catch {
          break;
        }
      }
    }
  }

  return urls;
}

async function main() {
  console.log(
    `\n═══ Building ${TOPICS.length} b-roll libraries (~${TARGET_CLIPS_PER_TOPIC} clips each) ═══`,
  );
  console.log(
    `    Target: ${MIN_DURATION_SECONDS}s+ per topic key — no repeated footage across 50 lessons\n`,
  );

  const localFiles = fs.existsSync(LOCAL_VIDEO_ROOT) ? listLocalVideoFiles(LOCAL_VIDEO_ROOT) : [];

  for (const topic of TOPICS) {
    const outPath = path.join(OUT_DIR, `${topic.key}.mp4`);

    // Skip if already long enough
    if (fs.existsSync(outPath)) {
      try {
        const dur = parseFloat(
          execSync(
            `"${FFPROBE_BIN}" -v quiet -show_entries format=duration -of csv=p=0 "${outPath}"`,
            { encoding: 'utf8' },
          ).trim(),
        );
        if (dur >= MIN_DURATION_SECONDS) {
          console.log(`  SKIP  ${topic.key} — ${Math.round(dur)}s already ✅`);
          continue;
        }
      } catch {}
    }

    process.stdout.write(`  FETCH ${topic.key} (target ${TARGET_CLIPS_PER_TOPIC} clips)...`);

    // Get all candidate URLs from all sources
    const allUrls = await fetchAllUrlsForTopic(topic);
    process.stdout.write(` ${allUrls.length} URLs found...`);

    const downloaded: string[] = [];

    // Download up to TARGET_CLIPS_PER_TOPIC clips
    for (let i = 0; i < allUrls.length && downloaded.length < TARGET_CLIPS_PER_TOPIC; i++) {
      const tmp = path.join(TMP_DIR, `dl_${topic.key}_${i}.mp4`);
      if (await downloadClip(allUrls[i], tmp)) {
        downloaded.push(tmp);
        if (downloaded.length % 10 === 0) process.stdout.write(` ${downloaded.length}...`);
      }
    }

    // Local fallback if still short
    if (downloaded.length < 5 && localFiles.length > 0) {
      const localFallback = selectLocalFallbackFiles(localFiles, topic, 20);
      for (let idx = 0; idx < localFallback.length && downloaded.length < 20; idx++) {
        const tmp = path.join(TMP_DIR, `dl_${topic.key}_local${idx}.mp4`);
        if (cutLocalSegment(localFallback[idx], tmp, idx)) downloaded.push(tmp);
      }
    }

    if (downloaded.length === 0) {
      process.stdout.write(` ❌ no clips found\n`);
      continue;
    }

    try {
      const dur = normalizeAndConcat(downloaded, outPath);
      process.stdout.write(` ${downloaded.length} clips → ${Math.round(dur)}s ✅\n`);
    } catch (e: any) {
      process.stdout.write(` ❌ concat failed: ${e.message}\n`);
    }

    downloaded.forEach((f) => {
      try {
        fs.unlinkSync(f);
      } catch {}
    });
  }

  try {
    fs.rmSync(TMP_DIR, { recursive: true });
  } catch {}
  console.log('\n═══ Done — b-roll library ready ═══\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
