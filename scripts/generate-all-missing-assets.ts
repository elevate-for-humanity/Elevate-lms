/**
 * Generate All Missing Assets
 * - Missing hero images with DALL-E 3
 * - AI Avatar demo videos with HeyGen
 */

import * as fs from 'fs';
import * as path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY required');
  process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), 'public');

// Missing images to generate
const MISSING_IMAGES = [
  {
    path: '/images/cdl-hero.webp',
    prompt:
      'Professional photo of a commercial truck driver in front of a large semi-truck, wearing safety vest, confident pose, sunny day at trucking facility, high quality corporate photography',
  },
  {
    path: '/images/getting-started-hero.webp',
    prompt:
      'Diverse group of adult students at orientation, receiving welcome packets, modern training facility lobby, excited expressions, professional corporate photography, bright lighting',
  },
  {
    path: '/images/programs/cna-hero.webp',
    prompt:
      'Healthcare student studying medical textbook with anatomical diagrams, modern classroom setting, focused learning, medical terminology charts on wall, professional educational photography',
  },
  {
    path: '/images/programs/cna-hero.webp',
    prompt:
      'Professional phlebotomist drawing blood from patient arm, clinical setting, proper technique demonstration, healthcare training environment, clean medical photography',
  },
  {
    path: '/images/hvac-hero.webp',
    prompt:
      'HVAC technician working on air conditioning unit on rooftop, wearing safety gear and tool belt, professional trade worker, sunny day, corporate industrial photography',
  },
  {
    path: '/images/programs/cna-hero.webp',
    prompt:
      'Cybersecurity professional at computer workstation with multiple monitors showing security dashboards, modern tech office, focused concentration, blue lighting accents, corporate tech photography',
  },
  {
    path: '/images/programs/cna-hero.webp',
    prompt:
      'Electrician working on electrical panel, wearing safety glasses and gloves, professional trade worker, industrial setting, proper safety equipment, corporate photography',
  },
  {
    path: '/images/programs/cna-hero.webp',
    prompt:
      'Welder in full protective gear with welding mask, sparks flying from welding torch, industrial workshop setting, dramatic lighting, professional trade photography',
  },
  {
    path: '/images/training-providers-hero.webp',
    prompt:
      'Professional instructors and trainers in modern classroom, diverse group of educators, training facility with equipment visible, collaborative atmosphere, corporate educational photography',
  },
];

async function generateImage(item: (typeof MISSING_IMAGES)[0]): Promise<boolean> {
  console.log(`🖼️  Generating: ${item.path}`);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: item.prompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Image API error');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Ensure directory exists
    const outputPath = path.join(OUTPUT_DIR, item.path);
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, Buffer.from(imageBuffer));
    console.log(
      `   ✅ Saved: ${outputPath} (${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`,
    );

    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    return false;
  }
}

async function generateAllImages() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       GENERATING MISSING HERO IMAGES (DALL-E 3 HD)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let success = 0;
  let failed = 0;

  for (const item of MISSING_IMAGES) {
    const result = await generateImage(item);
    if (result) success++;
    else failed++;

    // Delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('');
  console.log(`✅ Generated: ${success}/${MISSING_IMAGES.length} images`);
  if (failed > 0) console.log(`❌ Failed: ${failed} images`);

  return { success, failed };
}

// Run
generateAllImages().catch(console.error);
