#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesPath = path.join(__dirname, '..', 'content', 'courses', 'ecd-courses.json');
const imgDir = path.join(__dirname, '..', 'content', 'image-prompts', 'ecd-courses');
const videoDir = path.join(__dirname, '..', 'content', 'video-scripts', 'ecd-courses');

const baseFundingLine =
  'Thanks to our partnerships with federal and state workforce programs like WIOA, Workforce Ready Grants, and Job Ready Indy, eligible learners may qualify for reduced or no-cost tuition, plus case management and job placement support.';

async function ensureDirs() {
  await fs.mkdir(imgDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });
}

// ---------- IMAGE PROMPTS ----------

function imagePromptFor(course) {
  const { title, category } = course;

  if (category.includes('Healthcare')) {
    return `# ${title} – Course Cover (1:1)

Create a square (1:1) course cover image for "${title}" at Elevate Connects Directory.
Scene: trainees in scrubs practicing skills in a bright clinical training lab with an instructor demonstrating patient care.
Background: clean medical environment with subtle equipment, slightly blurred.
Color palette: soft teal, white, light gray, warm skin tones.
Style: realistic, welcoming, professional, no logos or text.
Mood: compassionate care, entry into healthcare careers.`;
  }

  if (category.includes('Beauty')) {
    return `# ${title} – Course Cover (1:1)

Create a square (1:1) course cover image for "${title}" as part of a workforce beauty education platform.
Scene: instructor guiding a small group of beauty students around a salon chair or demo station.
Background: bright salon or classroom with mirrors and neatly organized tools.
Color palette: warm neutrals, soft pink or mauve accents, clean whites.
Style: photo-realistic, aspirational, no text or branding.
Mood: professional creativity, mentorship, and confidence.`;
  }

  if (category.includes('Technology')) {
    return `# ${title} – Course Cover (1:1)

Create a square (1:1) course cover image for "${title}" in an IT training environment.
Scene: learner at a computer with dual monitors, instructor or teammate pointing at the screen.
Background: modern training lab with abstract code or network diagrams slightly out of focus.
Color palette: deep blue, teal, dark gray, subtle neon accent.
Style: realistic with a tech feel, no logos or text.
Mood: problem-solving, support, breaking into tech.`;
  }

  if (category.includes('Transportation')) {
    return `# ${title} – Course Cover (1:1)

Create a square (1:1) course cover image for "${title}" in a CDL training yard.
Scene: student driver standing by a semi-truck while instructor points to the truck with a clipboard or tablet.
Background: open yard, safety cones, blue daytime sky.
Color palette: strong blue, metallic gray, road black.
Style: photo-realistic, crisp, no company logos on the truck.
Mood: high-earning path, opportunity, logistics.`;
  }

  // Skilled trades default (HVAC, Building Tech, etc.)
  return `# ${title} – Course Cover (1:1)

Create a square (1:1) course cover image for "${title}" in a skilled trades training environment.
Scene: learner in work clothes using tools on real equipment (appropriate to the trade) with a mentor supervising.
Background: workshop, mechanical room, or job site with equipment and safety gear visible, slightly blurred.
Color palette: steel gray, navy blue, safety orange accent.
Style: modern photo-realistic, no logos or text.
Mood: hands-on learning, stable skilled career.`;
}

// ---------- VIDEO SCRIPTS ----------

function videoScriptFor(course) {
  const { title, slug, shortDescription, category } = course;

  let introLine = `Welcome to the ${title} program, listed in the Elevate Connects Directory.`;
  if (slug.includes('barber')) {
    introLine = `Do you see yourself behind the chair as a professional barber? The ${title} program in the Elevate Connects Directory helps you get there.`;
  } else if (slug.includes('cna') || category.includes('Healthcare')) {
    introLine = `If you're ready to care for others and start a healthcare career, the ${title} pathway in the Elevate Connects Directory is designed for you.`;
  } else if (slug.includes('hvac')) {
    introLine = `If you like solving problems with your hands and tools, the ${title} pathway in the Elevate Connects Directory is a strong entry into HVAC careers.`;
  } else if (slug.includes('cdl') || category.includes('Transportation')) {
    introLine = `Looking for a career with movement, income, and demand? The ${title} program in the Elevate Connects Directory might be your next step.`;
  } else if (slug.includes('it-support') || category.includes('Technology')) {
    introLine = `If you enjoy helping people solve tech problems, the ${title} program in the Elevate Connects Directory can open the door to IT careers.`;
  }

  const outcomesLine =
    category.includes('Skilled Trades') || slug.includes('apprenticeship')
      ? "You'll learn through a mix of classroom instruction, hands-on labs, and on-the-job apprenticeship hours so you graduate with both knowledge and real experience."
      : "You'll learn through a mix of instructor-led sessions, hands-on practice, and real-world scenarios so you graduate with both knowledge and confidence.";

  return `# ${title} – AI Video Script (~45–60 seconds)

${introLine}

${shortDescription}

${outcomesLine}

${baseFundingLine}

If you're ready to take the next step, visit this program inside ElevateConnectsDirectory.org, review the eligibility details, and complete your application or referral. Our team and partners will follow up to help you with funding and enrollment so you can start moving toward your new career.`;
}

async function main() {
  await ensureDirs();

  const raw = await fs.readFile(coursesPath, 'utf8');
  const courses = JSON.parse(raw);

  for (const course of courses) {
    const imgPrompt = imagePromptFor(course);
    const videoScript = videoScriptFor(course);

    const imgFile = path.join(imgDir, `${course.slug}-cover.md`);
    const vidFile = path.join(videoDir, `${course.slug}-video.md`);

    await fs.writeFile(imgFile, imgPrompt, 'utf8');
    await fs.writeFile(vidFile, videoScript, 'utf8');
  }
}

main().catch((err) => {
  console.error('Error building ECD course assets:', err);
  process.exit(1);
});
