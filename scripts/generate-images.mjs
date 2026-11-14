#!/usr/bin/env node
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACEHOLDER_MODE = !process.env.OPENAI_API_KEY;

let openai;
if (!PLACEHOLDER_MODE) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const promptsDir = path.join(__dirname, '..', 'content', 'image-prompts');
const coursesDir = path.join(promptsDir, 'courses');
const ecdCoursesDir = path.join(promptsDir, 'ecd-courses');
const outputDir = path.join(__dirname, '..', 'public', 'generated-images');
const coursesOutputDir = path.join(outputDir, 'courses');
const ecdCoursesOutputDir = path.join(outputDir, 'ecd-courses');

async function createPlaceholderImage(slug, width = 1024, height = 1024) {
  // Create a simple SVG placeholder
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(59,130,246);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(147,51,234);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')}
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle" dominant-baseline="middle">
    Placeholder Image
  </text>
</svg>`;

  return Buffer.from(svg);
}

async function processDirectory(dir, outputSubDir, manifest) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'));
  } catch (err) {
    return;
  }

  if (files.length === 0) {
    return;
  }

  await fs.mkdir(outputSubDir, { recursive: true });

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const fullPath = path.join(dir, file);
    const prompt = await fs.readFile(fullPath, 'utf8');

    const outPath = path.join(outputSubDir, `${slug}.png`);
    const relativePath = path.relative(path.join(__dirname, '..', 'public'), outPath);

    try {
      if (PLACEHOLDER_MODE) {
        const buffer = await createPlaceholderImage(slug);
        await fs.writeFile(outPath, buffer);
      } else {
        const result = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          size: '1024x1024',
          n: 1,
          response_format: 'b64_json',
        });

        const imageBase64 = result.data[0].b64_json;
        const buffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(outPath, buffer);
      }

      manifest[slug] = `/${relativePath.replace(/\\/g, '/')}`;
    } catch (err) {
      console.error(`❌ Failed to generate image for ${file}:`, err.message);
    }
  }
}

async function main() {
  if (PLACEHOLDER_MODE) {
  } else {
  }

  await fs.mkdir(outputDir, { recursive: true });

  const manifest = {};

  // Process root image-prompts directory
  await processDirectory(promptsDir, outputDir, manifest);

  // Process courses subdirectory
  await processDirectory(coursesDir, coursesOutputDir, manifest);

  // Process ECD courses subdirectory
  await processDirectory(ecdCoursesDir, ecdCoursesOutputDir, manifest);

  // Write manifest
  const manifestPath = path.join(outputDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  if (PLACEHOLDER_MODE) {
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
