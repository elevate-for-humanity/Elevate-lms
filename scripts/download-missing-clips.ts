/**
 * Downloads specific missing clips from Pexels for the infection control video.
 * Targets: Barbicide soak, neck strip, razor blade change.
 */

import fs from 'fs';
import path from 'path';

const PEXELS_KEY = process.env.PEXELS_API_KEY!;
const OUT_DIR = path.join(process.cwd(), 'public/videos/barber-infection-clips');

interface PexelsVideo {
  id: number;
  duration: number;
  video_files: { quality: string; width: number; height: number; link: string }[];
}

async function searchPexels(query: string, perPage = 15): Promise<PexelsVideo[]> {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { videos: PexelsVideo[] };
  return data.videos || [];
}

function getBestFile(video: PexelsVideo): { link: string; width: number; height: number } | null {
  // Prefer 1920x1080, fall back to largest available
  const sorted = video.video_files
    .filter(f => f.link && f.width >= 1280)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return sorted[0] || null;
}

async function downloadClip(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  if (!PEXELS_KEY) { console.error('PEXELS_API_KEY not set'); process.exit(1); }

  const searches = [
    { query: 'barber tools submerged disinfectant jar barbicide',  label: 'barbicide-soak',  count: 3 },
    { query: 'barber neck strip client draping',                   label: 'neck-strip',       count: 2 },
    { query: 'barber razor blade change insert',                   label: 'razor-blade',      count: 2 },
    { query: 'straight razor blade replacement barber',            label: 'razor-blade',      count: 2 },
    { query: 'comb submerged blue disinfectant solution',          label: 'barbicide-soak',   count: 2 },
  ];

  const downloaded: Record<string, string[]> = {};

  for (const s of searches) {
    console.log(`\nSearching: "${s.query}"...`);
    try {
      const videos = await searchPexels(s.query, 15);
      console.log(`  Found ${videos.length} results`);

      let got = 0;
      for (const v of videos) {
        if (got >= s.count) break;
        const file = getBestFile(v);
        if (!file) continue;

        const outPath = path.join(OUT_DIR, `clip-${v.id}.mp4`);
        if (fs.existsSync(outPath)) {
          console.log(`  ⏭  clip-${v.id} already exists`);
          if (!downloaded[s.label]) downloaded[s.label] = [];
          downloaded[s.label].push(`clip-${v.id}.mp4`);
          got++;
          continue;
        }

        process.stdout.write(`  Downloading clip-${v.id} (${file.width}x${file.height}, ${v.duration}s)...`);
        try {
          await downloadClip(file.link, outPath);
          console.log(' ✓');
          if (!downloaded[s.label]) downloaded[s.label] = [];
          downloaded[s.label].push(`clip-${v.id}.mp4`);
          got++;
        } catch (e: any) {
          console.error(` ❌ ${e.message}`);
        }
      }
    } catch (e: any) {
      console.error(`  ❌ Search failed: ${e.message}`);
    }
  }

  console.log('\n=== Downloaded ===');
  for (const [label, files] of Object.entries(downloaded)) {
    console.log(`${label}: ${files.join(', ')}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
