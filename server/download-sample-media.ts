/**
 * Download Sample Media
 * Downloads free stock images and videos to local storage for offline use
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
const stockImages: any[] = [];
const stockVideos: any[] = [];

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');
const IMAGES_DIR = path.join(MEDIA_DIR, 'images');
const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');

async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));

    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    return true;
  } catch (error) {
    console.error(
      `  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function downloadImages() {

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < stockImages.length; i++) {
    const image = stockImages[i];

    const filename = `${image.id}.jpg`;
    const outputPath = path.join(IMAGES_DIR, filename);

    // Check if already exists
    try {
      await fs.access(outputPath);
      downloaded++;
      continue;
    } catch (error) {
      // File doesn't exist, download it
    }

    const success = await downloadFile(image.url, outputPath);
    if (success) {
      downloaded++;
    } else {
      failed++;
    }

    // Rate limiting - wait 1 second between downloads
    if (i < stockImages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { downloaded, failed };
}

async function downloadVideos() {

  await fs.mkdir(VIDEOS_DIR, { recursive: true });

  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < stockVideos.length; i++) {
    const video = stockVideos[i];

    const filename = `${video.id}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, filename);

    // Check if already exists
    try {
      await fs.access(outputPath);
      downloaded++;
      continue;
    } catch (error) {
      // File doesn't exist, download it
    }

    const success = await downloadFile(video.url, outputPath);
    if (success) {
      downloaded++;
    } else {
      failed++;
    }

    // Rate limiting - wait 2 seconds between video downloads
    if (i < stockVideos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { downloaded, failed };
}

async function updateMediaPaths() {

  // Create updated stock media file with local paths
  const updatedStockMediaPath = path.join(
    process.cwd(),
    'src',
    'data',
    'stock-media-local.ts'
  );

  const content = `/**
 * Stock Media Library - Local Paths
 * Auto-generated file with local media paths
 * Generated: ${new Date().toISOString()}
 */

import { StockImage, StockVideo, BackgroundMusic } from './stock-media';

// Stock images with local paths
export const localStockImages: StockImage[] = [
${stockImages
  .map(
    (img) => `  {
    id: '${img.id}',
    url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    thumbnail: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    category: '${img.category}',
    tags: ${JSON.stringify(img.tags)},
    source: '${img.source}',
    photographer: '${img.photographer}',
    description: '${img.description}'
  }`
  )
  .join(',\n')}
];

// Stock videos with local paths
export const localStockVideos: StockVideo[] = [
${stockVideos
  .map(
    (vid) => `  {
    id: '${vid.id}',
    url: '/media/videos/${vid.id}.mp4',
    thumbnail: '/media/videos/${vid.id}.mp4',
    category: '${vid.category}',
    tags: ${JSON.stringify(vid.tags)},
    source: '${vid.source}',
    creator: '${vid.creator}',
    description: '${vid.description}',
    duration: ${vid.duration}
  }`
  )
  .join(',\n')}
];

// Use local media by default, fallback to remote
export const useLocalMedia = true;
`;

  await fs.writeFile(updatedStockMediaPath, content);

  // Create README
  const readmePath = path.join(MEDIA_DIR, 'README.md');
  const readmeContent = `# Downloaded Stock Media

Downloaded: ${new Date().toISOString()}

## Images (${stockImages.length})

${stockImages
  .map(
    (img) => `- **${img.id}** - ${img.description}
  - Category: ${img.category}
  - Photographer: ${img.photographer} (${img.source})
  - Path: \`/media/images/${img.id}.jpg\`
`
  )
  .join('\n')}

## Videos (${stockVideos.length})

${stockVideos
  .map(
    (vid) => `- **${vid.id}** - ${vid.description}
  - Category: ${vid.category}
  - Creator: ${vid.creator} (${vid.source})
  - Duration: ${vid.duration}s
  - Path: \`/media/videos/${vid.id}.mp4\`
`
  )
  .join('\n')}

## Usage

These files are downloaded from free stock media sources:
- **Images**: Unsplash (Free for commercial use)
- **Videos**: Pexels (Free for commercial use)

All content is properly licensed and can be used in generated videos.

## Attribution

While not required, it's good practice to credit:
- Unsplash: "Photo by [Photographer] on Unsplash"
- Pexels: "Video by [Creator] from Pexels"

## Updating

To re-download or update media:
\`\`\`bash
pnpm video:download-media
\`\`\`

This will:
1. Download missing files
2. Skip existing files
3. Update local paths
4. Create this README
`;

  await fs.writeFile(readmePath, readmeContent);
}

async function downloadSampleMedia() {

  try {
    // Create directories
    await fs.mkdir(MEDIA_DIR, { recursive: true });

    // Download images
    const imageResults = await downloadImages();

    // Download videos
    const videoResults = await downloadVideos();

    // Update paths
    await updateMediaPaths();

    // Summary
    console.log(
      `📸 Images: ${imageResults.downloaded}/${stockImages.length} downloaded`
    );
    console.log(
      `🎥 Videos: ${videoResults.downloaded}/${stockVideos.length} downloaded`
    );

    if (imageResults.failed > 0 || videoResults.failed > 0) {
      console.warn(
        '⚠️  Some downloads failed. You can re-run this script to retry.'
      );
    }

    console.log(
      '  import { localStockImages, localStockVideos } from "./stock-media-local"'
    );
  } catch (error) {
    throw error;
  }
}

// Run download
downloadSampleMedia()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
