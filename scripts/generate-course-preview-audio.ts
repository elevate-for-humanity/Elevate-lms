/**
 * Generate 30-second intro MP3s for each catalog course preview video.
 * Uses OpenAI TTS (tts-1-hd, alloy voice).
 * Output: public/generated/previews/audio-{id}.mp3
 *
 * Run: npx tsx scripts/generate-course-preview-audio.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(process.cwd(), 'public', 'generated', 'previews');

// Each script is ~30 seconds of natural speech at a calm pace
const COURSE_SCRIPTS: Record<string, string> = {
  'hvac-technician': `
    Hey! Welcome to HVAC Technician training at Elevate for Humanity.
    Here's the deal — every single building in America needs heating and cooling. Every home. Every school. Every hospital.
    That means HVAC technicians are ALWAYS in demand. Rain or shine. Good economy or bad.
    In just 12 weeks, you'll earn the EPA 608 Universal certification — that's the license you need by law to work with refrigerants.
    You'll also earn OSHA 10 and ACT WorkKeys. Three credentials. Twelve weeks. Zero college degree required.
    Starting pay? Forty-five to seventy-five thousand dollars a year. And it only goes up from there.
    The best part? Most of our students pay nothing. Workforce grants cover the whole thing.
    This is your moment. Let's build your future together!
  `,
  'cna': `
    Hey, welcome! If you've ever wanted to work in healthcare and actually make a difference in people's lives every single day — this is your path.
    Certified Nursing Assistants are the heart of every hospital and nursing home. You're the one patients see most. You matter.
    You'll help with daily care, take vital signs, and work right alongside nurses and doctors.
    No college degree needed. Just six weeks of training and you'll have your Indiana CNA certification in hand.
    Healthcare is the most stable industry in the country. Jobs are everywhere — and they're not going anywhere.
    Funding through WIOA may cover your entire program. That means you could start a healthcare career for free.
    You've got this. Let's get started!
  `,
  'cdl': `
    Ready to hit the open road and get paid really well to do it? Let's talk CDL-A.
    Truck drivers are the backbone of the American economy. And right now? Companies are DESPERATE to hire them.
    A CDL-A license opens the door to driving 18-wheelers — and earning fifty-five thousand dollars or more your first year.
    Experienced drivers? They're pulling in eighty, ninety, even a hundred thousand dollars a year.
    Many companies will pay for your training AND give you a signing bonus just to show up.
    Our program is eight weeks. You'll get real behind-the-wheel time and walk out with your commercial driver's license.
    Funding may be available. Apply today — your road to a great career starts right here!
  `,
  'tax-preparation': `
    What if you could earn thousands of dollars in just four months — and do it from home?
    That's exactly what tax preparers do. Every single person and business in America has to file taxes. Every year. Without fail.
    In this ten-week program, you'll learn to prepare federal and state returns, understand tax law, and use professional software.
    Our graduates earn three to eight thousand dollars in a single tax season — working part time.
    Want to work for a firm? You can. Want to run your own business from your kitchen table? You can do that too.
    This is one of the most flexible, profitable skills you can learn.
    Funding may be available. Let's get you started on your tax career today!
  `,
  'medical-assistant': `
    Welcome to Medical Assistant training! This is one of the most in-demand healthcare jobs in the country — and for good reason.
    Medical assistants do it all. Taking patient histories. Drawing blood. Giving injections. Handling scheduling. Supporting doctors.
    You are the person that keeps a clinic running smoothly every single day.
    The CCMA certification from the National Healthcareer Association is recognized at hospitals and clinics everywhere.
    No prior experience needed. Just the drive to help people and the commitment to learn.
    Starting pay is thirty-six to forty-eight thousand dollars a year — with room to grow.
    The program is about one hundred twenty hours. Funding may be available.
    Your healthcare career starts right now. Let's go!
  `,
  'phlebotomy': `
    Hey! Welcome to Phlebotomy Technician training.
    Here's something most people don't realize — phlebotomists are needed everywhere. Hospitals. Clinics. Blood banks. Labs. Doctor's offices.
    Your job? Draw blood samples that help doctors save lives. It's precise work. Important work. And it pays well.
    The CPT certification proves your skills to every employer in the country.
    Training takes about eighty hours. Starting pay is around thirty-three thousand dollars a year — and you can stack this with other healthcare certifications to earn even more.
    If you want a fast, affordable path into healthcare, phlebotomy is one of the smartest moves you can make.
    Funding may be available. Let's get you certified!
  `,
  'cybersecurity': `
    Welcome to Cybersecurity training — one of the hottest careers in tech right now.
    Here's the reality: hackers attack businesses, hospitals, and government agencies every single day.
    Companies are desperate for people who know how to stop them. And they pay really, really well.
    In this course, you'll learn how networks work, how attackers think, and how to defend against them.
    The IT Specialist Cybersecurity certification from Certiport is recognized by employers worldwide.
    Starting salaries? Fifty-five thousand dollars or more. Experienced professionals earn six figures.
    And here's the best part — you do NOT need a tech background to start.
    This is your entry point into a career that will never run out of demand.
    Let's build your future in tech!
  `,
  'excel': `
    Hey! Quick question — do you know Microsoft Excel?
    Because here's the truth: Excel is used in EVERY industry. Healthcare. Finance. Logistics. Retail. Education. You name it.
    Employers test for it. They pay more for it. And most people don't know it as well as they think they do.
    This course teaches you the real stuff — formulas, pivot tables, data analysis, and the skills that actually show up in job interviews.
    The Microsoft Office Specialist certification puts proof on your resume that you know what you're doing.
    Jobs that require Excel pay thirty-eight to fifty-five thousand dollars a year to start.
    The course is forty hours. You can go at your own pace.
    Add this to your resume and watch the interview requests come in. Let's do this!
  `,
  'osha-10': `
    Hey, welcome! If you want to work in construction, manufacturing, or any trade — you need to hear this.
    Most job sites will not let you through the gate without an OSHA 10 card. It's that simple.
    This ten-hour course covers everything — fall protection, electrical safety, hazard recognition — the rules that keep workers alive and employed.
    The OSHA 10 card is one of the most recognized safety credentials in the entire country.
    It takes ten hours. It costs thirty-eight dollars. And it can be the difference between getting hired and getting turned away.
    Don't show up to a job site without it.
    Get your OSHA card today. Let's get you working!
  `,
};

async function generateAudio(id: string, script: string): Promise<void> {
  const outPath = path.join(OUT_DIR, `audio-${id}.mp3`);
  if (fs.existsSync(outPath)) {
    console.log(`  skip ${id} (already exists)`);
    return;
  }

  process.stdout.write(`  ${id}...`);
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',   // nova = warm, upbeat, energetic female — not robotic
    input: script.trim().replace(/\s+/g, ' '),
    speed: 1.05,     // slightly faster = more energy, less drag
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(` done (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  console.log(`Generating ${Object.keys(COURSE_SCRIPTS).length} course intro audio files...\n`);

  for (const [id, script] of Object.entries(COURSE_SCRIPTS)) {
    await generateAudio(id, script);
  }

  console.log('\nAll done. Now run: npx tsx scripts/generate-course-preview-videos.ts');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
