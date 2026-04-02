/**
 * Generates TTS audio for the program holder orientation video.
 * Uses OpenAI TTS (alloy voice) — same pipeline as HVAC lesson audio.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... pnpm tsx scripts/generate-program-holder-audio.ts
 *
 * Output: public/videos/program-holder-scenes/scene-01.mp3 through scene-09.mp3
 * Skips scenes that already have audio.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY not set — skipping audio generation.');
  process.exit(0);
}

const OUT_DIR = path.join(process.cwd(), 'public/videos/program-holder-scenes');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SCENES: { id: string; text: string }[] = [
  {
    id: 'scene-01',
    text: `Welcome to Elevate for Humanity's Program Holder Orientation.

If you're watching this, you've been approved as a Program Holder in our Training Network — and we're glad to have you.

This video covers everything you need to know before you begin: how the platform works, what the handbook requires, how students are managed, how you get paid, and what your rights are.

Watch it fully. The handbook acknowledgement at the end is legally binding.`,
  },
  {
    id: 'scene-02',
    text: `Elevate for Humanity is a workforce development organization based in Indianapolis, Indiana.

We provide career training, credentialing, and job placement support to job seekers, returning citizens, veterans, and underserved communities.

We operate as an Eligible Training Provider under Indiana's INTraining system — administered by the Indiana Department of Workforce Development.

This means our programs qualify for WIOA funding and the Workforce Ready Grant. Most students pay zero out of pocket.

When you deliver training under the Elevate name, you are an authorized delivery site within our Training Network. Elevate owns the programs, the curriculum, the credentials, and the brand. You provide the space, the students, or the coordination — depending on your tier.`,
  },
  {
    id: 'scene-03',
    text: `All training is delivered through the Elevate LMS — our online learning management system.

Students access their coursework, complete quizzes, track attendance, and earn credentials entirely through the platform.

As a Program Holder, you have your own dashboard at elevateforhumanity.org — under Program Holder.

From your dashboard you can view enrolled students, track their progress, submit attendance records, upload required documents, view your payment status, and access the handbook and compliance materials.

You do not manage student accounts directly. All enrollment, credentialing, and record-keeping is handled by Elevate. Your job is to support students at your site and keep your records current.

If you ever have trouble accessing the platform, contact your assigned Elevate coordinator immediately.`,
  },
  {
    id: 'scene-04',
    text: `The Program Holder Handbook is required reading. It is not optional, and it is not a formality.

The handbook covers six things you must understand before you begin.

First: your role. What you are responsible for — student recruitment, WorkOne registration, attendance tracking, facility readiness, and communication.

Second: required documents. You cannot enroll students or receive payments until all required documents are submitted and approved. This includes your business license, training provider license, facility inspection certificate, instructor credentials, liability insurance, workers compensation insurance, background checks, your federal EIN, a W-9, and approved curriculum confirmation.

Third: student management. All students are Elevate students. Student records are protected under FERPA. You may not share student information with any third party without written authorization.

Fourth: compliance. These are federal WIOA requirements and Indiana state law. They are not negotiable.

Fifth: confidentiality and non-compete. What you learn about our curriculum, pricing, and operations is confidential. You may not replicate the program model.

Sixth: your right to exit. You can leave at any time with 30 days written notice. No reason required.

Read every section before you acknowledge.`,
  },
  {
    id: 'scene-05',
    text: `This is one of the most important compliance requirements — and one of the most commonly missed.

Every student seeking WIOA funding must be registered through WorkOne before enrollment begins. This is a federal requirement. It is not optional.

WorkOne is Indiana's workforce development system. Students register at IndianaCareerConnect.com, schedule an appointment with their local WorkOne office, and receive a training voucher before their tuition can be funded.

If a student begins training before completing WorkOne registration, their funding may be denied — and you may be responsible for the gap.

Do not enroll WIOA-funded students without confirmed WorkOne registration. If you are unsure, contact your Elevate coordinator before proceeding.`,
  },
  {
    id: 'scene-06',
    text: `Your compensation depends on which participation tier you signed under.

Tier One is the Facility Host tier. You provide a dedicated physical training space and on-site operational support. You receive one-third of net program revenue per cohort. Payments are split: fifty percent at the midpoint of the program, and fifty percent when the student earns their credential. For a ten-student barber cohort, that's approximately eighteen thousand dollars. For fifty students, approximately ninety thousand.

Tier Two is the Coordination Partner tier. You provide student coordination and supervision support — no facility required. You receive fifteen percent of net program revenue.

Tier Three is the Referral Partner tier. You refer eligible individuals to Elevate programs. You receive a flat fee of two hundred fifty to five hundred dollars per enrolled student. No operational responsibility.

Net revenue is gross tuition minus direct program costs — credential exam fees, LMS, curriculum, marketing, compliance, administration, and student services.

Payments are processed within thirty days of invoice approval. Invoices must include supporting documentation.`,
  },
  {
    id: 'scene-07',
    text: `Here are the programs currently available through the Elevate Training Network — all listed on Indiana's Eligible Training Provider List.

Barber Apprenticeship — fifteen months — four thousand eight hundred ninety dollars.

Beauty and Career Educator Training — eighty-four days — four thousand seven hundred thirty dollars.

Bookkeeping and Accounting Clerk — eight weeks — four thousand nine hundred twenty-five dollars.

Business Management — five weeks — four thousand nine hundred dollars.

Emergency Health and Safety Technician — four weeks — four thousand nine hundred fifty dollars.

Home Health Aide — four weeks — four thousand seven hundred dollars.

HVAC Technician — twenty weeks — five thousand dollars.

Medical Assistant — twenty-one days — four thousand three hundred twenty-five dollars.

Professional Esthetician and Client Services — five weeks — four thousand five hundred seventy-five dollars.

Public Safety Reentry Specialist — forty-five days — four thousand seven hundred fifty dollars.

CPR, AED, and First Aid — one day — five hundred seventy-five dollars.

Most students pay zero through WIOA or the Workforce Ready Grant.`,
  },
  {
    id: 'scene-08',
    text: `You have rights as a Program Holder — and they are guaranteed.

You have the right to transparent payment calculations. You can request a full breakdown of any payment at any time.

You have the right to exit. Either party can terminate this agreement with thirty days written notice. No reason required. Send written notice to your Elevate coordinator and copy elevate4humanityedu@gmail.com.

You have the right to a fair process. If Elevate believes you have violated the agreement, you will receive written notice and an opportunity to respond before any action is taken.

Your rights and your responsibilities carry equal weight. Neither is optional.`,
  },
  {
    id: 'scene-09',
    text: `Here is what happens next.

First: read the full Program Holder Handbook at your dashboard under Handbook. Then acknowledge it.

Second: read the Rights and Responsibilities document and acknowledge it.

Third: upload all required documents through your dashboard under Documents.

Fourth: complete your facility or coordination setup with your assigned Elevate coordinator.

You cannot enroll students until all documents are submitted and approved.

If you have questions at any point, contact your coordinator or email elevate4humanityedu@gmail.com.

Welcome to the Elevate Training Network. Let's get to work.`,
  },
];

async function generateAudio(text: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let err = '';
          res.on('data', (d) => (err += d));
          res.on('end', () => reject(new Error(`OpenAI TTS ${res.statusCode}: ${err}`)));
          return;
        }
        const out = fs.createWriteStream(outPath);
        res.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Generating ${SCENES.length} audio scenes → ${OUT_DIR}`);
  for (const scene of SCENES) {
    const outPath = path.join(OUT_DIR, `${scene.id}.mp3`);
    if (fs.existsSync(outPath)) {
      console.log(`  skip ${scene.id}.mp3 (exists)`);
      continue;
    }
    process.stdout.write(`  generating ${scene.id}.mp3 ... `);
    await generateAudio(scene.text, outPath);
    console.log('done');
  }
  console.log('All scenes generated.');
}

main().catch((e) => { console.error(e); process.exit(1); });
