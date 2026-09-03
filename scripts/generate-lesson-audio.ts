/**
 * Generate Lesson-Specific Audio Files
 *
 * Creates professional voiceover audio for each LMS lesson
 * Run with: OPENAI_API_KEY=xxx npx tsx scripts/generate-lesson-audio.ts
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LessonAudio {
  filename: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  script: string;
}

const LESSON_AUDIO: LessonAudio[] = [
  // CNA Course Lessons
  {
    filename: 'cna-welcome.mp4',
    voice: 'nova',
    script: `Welcome to your CNA career pathway.

This program prepares you for a rewarding career in healthcare as a Certified Nursing Assistant.

Over the coming weeks, you'll learn essential patient care skills, medical terminology, and professional practices that employers value.

Our curriculum aligns with state certification requirements, and we partner directly with healthcare facilities ready to hire graduates.

Let's begin your journey into healthcare.`,
  },
  {
    filename: 'cna-day-in-life.mp4',
    voice: 'nova',
    script: `A day in the life of a CNA.

As a Certified Nursing Assistant, you'll be the heart of patient care. Your day might include helping patients with daily activities, taking vital signs, and communicating with the nursing team.

You'll work in hospitals, nursing homes, assisted living facilities, or home health settings.

The work is meaningful. You'll make a real difference in people's lives every single day.

This lesson shows you what to expect and how to prepare for success.`,
  },
  {
    filename: 'cna-professionalism.mp4',
    voice: 'shimmer',
    script: `Professionalism in healthcare.

In healthcare, how you present yourself matters. Patients and families trust you with their care.

This lesson covers professional appearance, punctuality, confidentiality, and workplace ethics.

You'll learn HIPAA basics, proper documentation, and how to handle difficult situations with grace.

These skills set you apart and open doors to advancement.`,
  },
  {
    filename: 'cna-communication.mp4',
    voice: 'shimmer',
    script: `Communication with residents, families, and healthcare teams.

Clear communication saves lives and builds trust.

You'll learn how to report patient conditions accurately, communicate with empathy, and work effectively with nurses and doctors.

We'll cover active listening, cultural sensitivity, and documentation best practices.

Strong communication skills are what employers look for most.`,
  },

  // Barber Course Lessons
  {
    filename: 'barber-shop-culture.mp4',
    voice: 'onyx',
    script: `Welcome to the barbershop.

The barbershop is more than a place to cut hair. It's a community institution.

In this lesson, you'll learn the culture, traditions, and professional standards that define great barbershops.

From client relationships to shop etiquette, understanding this culture is essential to your success.

Let's explore what makes a barbershop special.`,
  },
  {
    filename: 'barber-client-experience.mp4',
    voice: 'onyx',
    script: `Creating the client experience.

A great haircut is just the beginning. The best barbers create an experience clients remember.

You'll learn consultation techniques, how to understand what clients really want, and how to exceed expectations.

We'll cover booking, greeting, service delivery, and follow-up.

Master this, and you'll build a loyal clientele.`,
  },
  {
    filename: 'barber-hours-logging.mp4',
    voice: 'echo',
    script: `Tracking your apprenticeship hours.

Your apprenticeship requires documented hours to earn your license.

This lesson explains how to log hours correctly, what counts toward your requirements, and how to stay on track.

We'll show you the tracking system and answer common questions.

Accurate records protect your progress and ensure timely licensure.`,
  },
  {
    filename: 'barber-elevate-partnership.mp4',
    voice: 'echo',
    script: `Your partnership with Elevate.

As an Elevate apprentice, you have support throughout your journey.

This lesson covers the resources available to you: mentorship, career services, and job placement assistance.

We'll explain how to get help when you need it and how to make the most of this opportunity.

You're not doing this alone. We're here to help you succeed.`,
  },

  // Tax/VITA Course Lessons
  {
    filename: 'tax-vita-overview.mp4',
    voice: 'alloy',
    script: `Welcome to Tax Preparation and VITA.

This program prepares you for a career in tax preparation, starting with IRS VITA certification.

VITA, the Volunteer Income Tax Assistance program, provides free tax help to people who need it.

You'll learn tax law fundamentals, software skills, and client service practices.

This certification opens doors to seasonal and year-round tax positions.`,
  },
  {
    filename: 'tax-career-paths.mp4',
    voice: 'alloy',
    script: `Career paths in tax preparation.

Tax preparation offers multiple career directions.

You can work seasonally for extra income, build a year-round practice, or use tax skills as a foundation for accounting and finance careers.

This lesson explores your options and helps you plan your path.

The skills you learn here are valuable and in demand.`,
  },
  {
    filename: 'tax-confidentiality.mp4',
    voice: 'fable',
    script: `Confidentiality and ethics in tax preparation.

Tax preparers handle sensitive financial information. Confidentiality is not optional.

This lesson covers IRS requirements, ethical obligations, and best practices for protecting client data.

You'll learn what you can and cannot share, how to handle requests for information, and how to maintain trust.

Your reputation depends on your integrity.`,
  },
  {
    filename: 'tax-customer-service.mp4',
    voice: 'fable',
    script: `Customer service excellence.

Great tax preparers combine technical skill with excellent service.

You'll learn how to explain complex tax concepts in simple terms, manage client expectations, and handle difficult situations.

We'll cover communication techniques that build confidence and loyalty.

Service excellence is what brings clients back year after year.`,
  },
];

async function generateAudio(lesson: LessonAudio): Promise<void> {
  console.log(`\nGenerating: ${lesson.filename}`);

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: lesson.voice,
      input: lesson.script,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    // Save as .mp3 first, then we'll note that videos need the audio
    const mp3Filename = lesson.filename.replace('.mp4', '.mp3');
    const outputPath = path.join(process.cwd(), 'public', 'videos', mp3Filename);

    await fs.writeFile(outputPath, buffer);

    const stats = await fs.stat(outputPath);
    console.log(`✅ Created: ${mp3Filename} (${Math.round(stats.size / 1024)}KB)`);
  } catch (error) {
    console.error(`❌ Failed: ${lesson.filename}`, error);
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('GENERATING LESSON-SPECIFIC AUDIO');
  console.log('='.repeat(60));

  const outputDir = path.join(process.cwd(), 'public', 'videos');
  await fs.mkdir(outputDir, { recursive: true });

  let successCount = 0;

  for (const lesson of LESSON_AUDIO) {
    try {
      await generateAudio(lesson);
      successCount++;
      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Failed to generate ${lesson.filename}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`COMPLETE: ${successCount}/${LESSON_AUDIO.length} audio files generated`);
  console.log('='.repeat(60));
  console.log('\nNote: Audio files created as .mp3');
  console.log('For full video, combine with visuals using video editing software.');
}

main().catch(console.error);
