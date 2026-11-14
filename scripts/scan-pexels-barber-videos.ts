#!/usr/bin/env node

import { config } from 'dotenv';
import {
  getAllBlueprints,
  getBlueprintById,
  getBlueprintByProgramSlug,
} from '../lib/curriculum/blueprints';
import fs from 'fs';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const PEXELS_API_KEY = process.env.PEXELS_API_KEY?.trim();
const PEXELS_API_URL = 'https://api.pexels.com/videos/search';

interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  image: string;
  video_files: {
    id: number;
    quality: string;
    type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

interface LessonVideoMatch {
  slug: string;
  title: string;
  moduleTitle: string;
  blueprintId: string;
  programSlug: string;
  searchTerm: string;
  videoUrl: string | null;
  videoId: number | null;
  duration: number | null;
  quality: string | null;
  matchScore: number;
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// Extract all lessons from blueprint
function extractAllLessons(blueprint: any): Array<{
  slug: string;
  title: string;
  moduleTitle: string;
}> {
  const lessons: Array<{ slug: string; title: string; moduleTitle: string }> = [];

  for (const module of blueprint.modules) {
    for (const lesson of module.lessons) {
      lessons.push({
        slug: lesson.slug,
        title: lesson.title,
        moduleTitle: module.title,
      });
    }
  }

  return lessons;
}

// Search Pexels for a lesson
async function searchPexelsForLesson(
  lessonTitle: string,
): Promise<PexelsVideo | null> {
  // Extract key terms from lesson title
  // E.g., "Fade Techniques" → search "fade barber"
  // E.g., "Sanitation Protocols" → search "sanitation"

  const searchTerm = lessonTitle.toLowerCase().split('&')[0].trim(); // Take first part before &

  try {
    const params = new URLSearchParams({
      query: `${searchTerm} barber haircut`,
      per_page: '1',
      orientation: 'landscape',
    });

    const response = await fetch(`${PEXELS_API_URL}?${params}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(
        `  ✗ Pexels API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as { videos?: PexelsVideo[] };

    if (data.videos && data.videos.length > 0) {
      return data.videos[0];
    }

    return null;
  } catch (error) {
    console.error(`  ✗ Error searching Pexels:`, error);
    return null;
  }
}

// Get the best video file URL (HD if available, otherwise highest quality)
function getBestVideoUrl(video: PexelsVideo): { url: string; quality: string } {
  const filesByQuality = video.video_files.sort((a, b) => {
    const qualityOrder: Record<string, number> = {
      hd: 3,
      sd: 2,
      mobile: 1,
    };
    return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
  });

  if (filesByQuality.length > 0) {
    return {
      url: filesByQuality[0].link,
      quality: filesByQuality[0].quality,
    };
  }

  return { url: '', quality: 'unknown' };
}

async function main() {
  const blueprintArg = getArg('--blueprint');
  const outputPrefix = getArg('--out') ?? 'blueprint';
  const listMode = process.argv.includes('--list');

  if (listMode) {
    const all = await getAllBlueprints();
    console.log('Available blueprints:');
    for (const bp of all) {
      console.log(`- ${bp.id} (${bp.programSlug})`);
    }
    process.exit(0);
  }

  if (!PEXELS_API_KEY) {
    console.error('PEXELS_API_KEY is missing. Set it in .env.local and re-run.');
    process.exit(1);
  }

  if (!blueprintArg) {
    console.error(
      'Usage: pnpm tsx scripts/scan-pexels-barber-videos.ts --blueprint <blueprintId|programSlug> [--out prefix]'
    );
    console.error('Example: pnpm tsx scripts/scan-pexels-barber-videos.ts --blueprint barber-apprenticeship-v1 --out barber');
    console.error('\nRun with --list to see all blueprints.');
    process.exit(1);
  }

  console.log('Scanning Pexels for blueprint lesson videos...\n');

  const blueprint =
    (await getBlueprintById(blueprintArg)) ??
    (await getBlueprintByProgramSlug(blueprintArg));

  if (!blueprint) {
    console.error(`No blueprint found for "${blueprintArg}"`);
    process.exit(1);
  }

  const lessons = extractAllLessons(blueprint);
  console.log(`Blueprint: ${blueprint.id} (${blueprint.programSlug})`);
  console.log(`Found ${lessons.length} lessons\n`);

  const matches: LessonVideoMatch[] = [];
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    console.log(
      `[${i + 1}/${lessons.length}] Searching for: "${lesson.title}"`,
    );

    // Add delay to avoid rate limiting
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const video = await searchPexelsForLesson(lesson.title);

    if (video) {
      const { url, quality } = getBestVideoUrl(video);
      matches.push({
        slug: lesson.slug,
        title: lesson.title,
        moduleTitle: lesson.moduleTitle,
        blueprintId: blueprint.id,
        programSlug: blueprint.programSlug,
        searchTerm: lesson.title.toLowerCase(),
        videoUrl: url,
        videoId: video.id,
        duration: video.duration,
        quality,
        matchScore: 1, // Would be higher with semantic matching
      });
      console.log(
        `  ✓ Found: ${video.duration}s (${quality}) - ${url.substring(0, 60)}...`,
      );
      found++;
    } else {
      matches.push({
        slug: lesson.slug,
        title: lesson.title,
        moduleTitle: lesson.moduleTitle,
        blueprintId: blueprint.id,
        programSlug: blueprint.programSlug,
        searchTerm: lesson.title.toLowerCase(),
        videoUrl: null,
        videoId: null,
        duration: null,
        quality: null,
        matchScore: 0,
      });
      console.log(`  ✗ No match found`);
      notFound++;
    }
  }

  console.log(`\n📊 Results:
   Found: ${found}
   Not found: ${notFound}
   Success rate: ${Math.round((found / lessons.length) * 100)}%\n`);

  // Write CSV
  const csvPath = path.join(
    process.cwd(),
    `reports/${outputPrefix}-${blueprint.programSlug}-pexels-video-mapping.csv`,
  );
  const csvContent = [
    'Blueprint ID,Program Slug,Lesson Slug,Lesson Title,Module,Video URL,Duration (sec),Quality,Match Score',
    ...matches.map(
      (m) =>
        `"${m.blueprintId}","${m.programSlug}","${m.slug}","${m.title}","${m.moduleTitle}","${m.videoUrl || 'NOT FOUND'}",${m.duration || ''},${m.quality || ''},${m.matchScore}`,
    ),
  ].join('\n');

  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, csvContent);
  console.log(`✓ CSV saved to: ${csvPath}`);

  // Write JSON
  const jsonPath = path.join(
    process.cwd(),
    `reports/${outputPrefix}-${blueprint.programSlug}-pexels-video-mapping.json`,
  );
  fs.writeFileSync(jsonPath, JSON.stringify(matches, null, 2));
  console.log(`✓ JSON saved to: ${jsonPath}`);

  // Summary
  console.log(`\n📋 Summary:
   Total lessons: ${lessons.length}
   Videos found: ${found}
   Videos not found: ${notFound}
   
   Next steps:
   1. Review the CSV/JSON for accuracy
  2. Manually match remaining ${notFound} lessons from Pexels
  3. Update lesson video_url rows from approved mapping
   4. Build audio narration for each video
  5. Test lesson player with merged Pexels videos`);
}

main().catch(console.error);
