import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HEYGEN_KEY = process.env.HEYGEN_API_KEY;

const SCAN_DIRS = [
  'public/generated/lessons',
  'public/videos/lessons',
  'public/videos/avatars',
  'public/images/hvac-diagrams',
  'public/images/programs-hq',
  'temp/brandon',
  'temp/diagrams',
  'temp/assembled',
];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile())
    .map(e => ({ path: path.join(dir, e.name), name: e.name, size: fs.statSync(path.join(dir, e.name)).size }));
}

function guessLesson(name) {
  const m = name.match(/lesson[-_]?(\d{1,3})/i) || name.match(/hvac[-_](\d{2})[-_](\d{2})/i) || name.match(/[-_](\d{3})[-_.]/);
  if (m) return parseInt(m[1]);
  return null;
}

async function listBucket(bucket, prefix = '') {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix, limit: 500 }),
  });
  const files = await res.json();
  return Array.isArray(files) ? files.filter(f => f?.name && f?.metadata) : [];
}

async function getHeyGenVideos() {
  if (!HEYGEN_KEY) return [];
  const res = await fetch('https://api.heygen.com/v1/video.list?limit=100', {
    headers: { 'X-Api-Key': HEYGEN_KEY },
  });
  const d = await res.json();
  return d?.data?.videos || [];
}

async function main() {
  console.log('Scanning local assets...');
  const allFiles = SCAN_DIRS.flatMap(scanDir);
  const mp3s = allFiles.filter(f => f.name.endsWith('.mp3'));
  const mp4s = allFiles.filter(f => f.name.endsWith('.mp4'));
  const imgs = allFiles.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name));

  console.log('Scanning Supabase storage...');
  const [cvRoot, cvHvac, mediaHvac, lessonAudio] = await Promise.all([
    listBucket('course-videos', ''),
    listBucket('course-videos', 'hvac/'),
    listBucket('media', 'hvac/'),
    listBucket('lesson-audio', ''),
  ]);

  const storageMp4s = [...cvRoot, ...cvHvac, ...mediaHvac]
    .filter(f => f.name?.endsWith('.mp4'))
    .map(f => ({
      name: f.name,
      size: f.metadata?.size || 0,
      bucket: cvRoot.includes(f) ? 'course-videos' : cvHvac.includes(f) ? 'course-videos/hvac' : 'media/hvac',
      url: cvRoot.includes(f)
        ? `${SUPABASE_URL}/storage/v1/object/public/course-videos/${f.name}`
        : cvHvac.includes(f)
        ? `${SUPABASE_URL}/storage/v1/object/public/course-videos/hvac/${f.name}`
        : `${SUPABASE_URL}/storage/v1/object/public/media/hvac/${f.name}`,
      lessonGuess: guessLesson(f.name),
    }));

  console.log('Checking HeyGen account...');
  const heygenVideos = await getHeyGenVideos();

  // Build per-lesson status 1-95
  const lessons = {};
  for (let i = 1; i <= 95; i++) {
    lessons[i] = { lessonNumber: i, hasAudio: false, hasLocalVideo: false, hasStorageVideo: false, hasHeyGen: false, hasDiagram: false, audioPath: null, videoUrl: null, diagramPath: null };
  }

  // Map MP3s
  for (const f of mp3s) {
    const n = guessLesson(f.name);
    if (n && lessons[n]) { lessons[n].hasAudio = true; lessons[n].audioPath = f.path; }
  }

  // Map local MP4s
  for (const f of mp4s) {
    const n = guessLesson(f.name);
    if (n && lessons[n]) { lessons[n].hasLocalVideo = true; }
  }

  // Map storage MP4s (prefer large files = real HeyGen quality)
  const sorted = storageMp4s.sort((a, b) => b.size - a.size);
  for (const f of sorted) {
    const n = f.lessonGuess;
    if (n && lessons[n] && !lessons[n].hasStorageVideo) {
      lessons[n].hasStorageVideo = true;
      lessons[n].videoUrl = f.url;
      lessons[n].videoSizeMB = Math.round(f.size / 1024 / 1024);
    }
  }

  // Map diagrams
  for (const f of imgs) {
    const n = guessLesson(f.name);
    if (n && lessons[n]) { lessons[n].hasDiagram = true; lessons[n].diagramPath = f.path; }
  }

  // Summary
  const hasAudio = Object.values(lessons).filter(l => l.hasAudio).length;
  const hasVideo = Object.values(lessons).filter(l => l.hasStorageVideo || l.hasLocalVideo).length;
  const hasDiagram = Object.values(lessons).filter(l => l.hasDiagram).length;
  const complete = Object.values(lessons).filter(l => l.hasAudio && (l.hasStorageVideo || l.hasLocalVideo)).length;

  console.log('\n========== HVAC ASSET AUDIT ==========');
  console.log(`Local MP3s:      ${mp3s.length}`);
  console.log(`Local MP4s:      ${mp4s.length}`);
  console.log(`Storage MP4s:    ${storageMp4s.length} (${[...new Set(storageMp4s.map(f=>f.bucket))].join(', ')})`);
  console.log(`HeyGen videos:   ${heygenVideos.length}`);
  console.log(`Diagram images:  ${imgs.length}`);
  console.log('');
  console.log(`Lessons with audio:  ${hasAudio}/95`);
  console.log(`Lessons with video:  ${hasVideo}/95`);
  console.log(`Lessons with diagram: ${hasDiagram}/95`);
  console.log(`Lessons complete (audio+video): ${complete}/95`);
  console.log('');
  console.log('Storage videos by size (top 10):');
  sorted.slice(0, 10).forEach(f => console.log(`  ${Math.round(f.size/1024/1024)}MB  ${f.bucket}/${f.name}`));

  if (heygenVideos.length) {
    console.log('\nHeyGen account videos:');
    heygenVideos.forEach(v => console.log(`  ${v.video_id}  ${v.status}  ${v.duration}s  ${v.title || '(no title)'}`));
  }

  // Save reports
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/hvac-asset-audit.json', JSON.stringify({ lessons, storageMp4s, heygenVideos, localMp3s: mp3s, localMp4s: mp4s, diagrams: imgs }, null, 2));
  if (heygenVideos.length) fs.writeFileSync('reports/heygen-videos.json', JSON.stringify(heygenVideos, null, 2));
  console.log('\nReport saved to reports/hvac-asset-audit.json');
}

main().catch(console.error);
