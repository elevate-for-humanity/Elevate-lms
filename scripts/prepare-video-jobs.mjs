#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsDir = path.join(__dirname, '..', 'content', 'video-scripts');
const coursesDir = path.join(scriptsDir, 'courses');
const ecdCoursesDir = path.join(scriptsDir, 'ecd-courses');
const jobsOutPath = path.join(__dirname, '..', 'content', 'video-jobs.json');

// Enhanced mapping for course videos and other content
const defaultDurations = [
  // Homepage and general
  { key: 'homepage-hero', seconds: 40 },
  { key: 'about-elevate', seconds: 90 },
  { key: 'how-it-works', seconds: 55 },
  { key: 'employers', seconds: 45 },
  { key: 'program-holder', seconds: 40 },
  { key: 'delegate', seconds: 40 },

  // Course-specific videos
  { key: 'hvac-program', seconds: 45 },
  { key: 'barber-program', seconds: 45 },
  { key: 'healthcare-cna-program', seconds: 45 },
  { key: 'cdl-program', seconds: 45 },
  { key: 'building-tech-program', seconds: 45 },

  // Other
  { key: 'apply-now', seconds: 30 },
  { key: 'contact-support', seconds: 25 },
];

function guessDuration(slug) {
  const match = defaultDurations.find((d) => slug.includes(d.key));
  return match ? match.seconds : 40;
}

function determineCategory(slug, subdirectory) {
  if (subdirectory === 'courses') return 'course';
  if (slug.includes('program')) return 'program';
  if (slug.includes('homepage') || slug.includes('about')) return 'homepage';
  if (slug.includes('apply')) return 'application';
  if (slug.includes('contact')) return 'support';
  return 'general';
}

function determineProvider(category) {
  // Recommend providers based on content type
  switch (category) {
    case 'course':
    case 'homepage':
      return 'heygen'; // Best for professional instructor videos
    case 'program':
      return 'synthesia'; // Good for educational content
    default:
      return 'd-id'; // Budget-friendly for shorter content
  }
}

async function processDirectory(dir, subdirectory = null) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'));
  } catch (err) {
    return [];
  }

  const jobs = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const scriptPath = path.join(dir, file);
    const text = await fs.readFile(scriptPath, 'utf8');

    const firstLine = text.split('\n')[0]?.replace(/^#\s*/, '') ?? slug;
    const durationSeconds = guessDuration(slug);
    const category = determineCategory(slug, subdirectory);
    const provider = determineProvider(category);

    const relativePath = subdirectory
      ? `content/video-scripts/${subdirectory}/${file}`
      : `content/video-scripts/${file}`;

    jobs.push({
      id: subdirectory ? `${subdirectory}-${slug}` : slug,
      title: firstLine,
      category,
      sourceFile: relativePath,
      script: text,

      // Video generation settings
      targetProvider: provider,
      targetModel:
        provider === 'heygen'
          ? 'heygen-v2'
          : provider === 'synthesia'
            ? 'synthesia-standard'
            : 'd-id-basic',
      durationSeconds,
      aspectRatio: '16:9',

      // Voice and avatar settings
      voice: 'professional-neutral',
      avatar: category === 'course' ? 'instructor-diverse' : 'default',

      // Output settings
      outputPath: subdirectory
        ? `public/videos/${subdirectory}/${slug}.mp4`
        : `public/videos/${slug}.mp4`,
      captionsPath: subdirectory
        ? `public/videos/${subdirectory}/${slug}.vtt`
        : `public/videos/${slug}.vtt`,

      // Status tracking
      status: 'pending',
      priority: category === 'homepage' ? 'high' : category === 'course' ? 'medium' : 'low',

      // Metadata
      createdAt: new Date().toISOString(),
      estimatedCost: provider === 'heygen' ? 1.5 : provider === 'synthesia' ? 1.2 : 0.5,
    });
  }

  return jobs;
}

async function main() {
  const allJobs = [];

  // Process root video-scripts directory
  const rootJobs = await processDirectory(scriptsDir);
  allJobs.push(...rootJobs);

  // Process courses subdirectory
  const courseJobs = await processDirectory(coursesDir, 'courses');
  allJobs.push(...courseJobs);

  // Process ECD courses subdirectory
  const ecdCourseJobs = await processDirectory(ecdCoursesDir, 'ecd-courses');
  allJobs.push(...ecdCourseJobs);

  // Sort by priority
  allJobs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Write jobs file
  await fs.writeFile(jobsOutPath, JSON.stringify(allJobs, null, 2));

  // Summary by category
  const byCategory = allJobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([cat, count]) => {});

  // Summary by provider
  const byProvider = allJobs.reduce((acc, job) => {
    acc[job.targetProvider] = (acc[job.targetProvider] || 0) + 1;
    return acc;
  }, {});

  Object.entries(byProvider).forEach(([provider, count]) => {});

  // Estimated costs
  const totalCost = allJobs.reduce((sum, job) => sum + job.estimatedCost, 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
