/**
 * Generate avatar-style lesson videos for barber theory lessons.
 *
 * Uses: OpenAI TTS (onyx voice) + Canvas slide renderer + FFmpeg compositor.
 * Output: public/videos/barber-lessons/barber-lesson-N.mp4
 * Then updates video_url on course_lessons in DB.
 *
 * Usage:
 *   pnpm tsx scripts/generate-barber-videos.ts
 *   pnpm tsx scripts/generate-barber-videos.ts --dry-run
 *   pnpm tsx scripts/generate-barber-videos.ts --only barber-lesson-1,barber-lesson-4
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { generateLessonScript } from '../lib/autopilot/lesson-script-generator';
import { generateTextToSpeech } from '../server/tts-service';
import { renderLessonVideo } from '../server/lesson-video-renderer';

const COURSE_ID        = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/team/instructors/instructor-barber.jpg');
const OUTPUT_DIR       = path.join(process.cwd(), 'public/videos/barber-lessons');
const VOICE            = 'onyx'; // deep professional male voice
const DRY_RUN          = process.argv.includes('--dry-run');
const ONLY_ARG         = process.argv.find(a => a.startsWith('--only=') || a.startsWith('--only '));
const ONLY_SLUGS       = ONLY_ARG ? ONLY_ARG.replace('--only=','').replace('--only ','').split(',') : null;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Theory lessons that need videos (no demo video assigned)
const LESSONS: { slug: string; title: string; script: string }[] = [
  {
    slug: 'barber-lesson-1',
    title: 'Welcome to the Barber Apprenticeship',
    script: `Welcome to the Barber Apprenticeship program at Elevate for Humanity. This is a U.S. Department of Labor registered apprenticeship. You will complete 2,000 hours of on-the-job training alongside this related technical instruction. The program covers eight modules: infection control and safety, hair science and scalp analysis, tools and equipment, haircutting techniques, shaving and beard services, chemical services, professional and business skills, and state board exam preparation. Each module ends with a checkpoint quiz. You must score 70 percent or higher to advance. Your on-the-job hours are logged separately with your host shop supervisor. Let's get started.`,
  },
  {
    slug: 'barber-lesson-4',
    title: 'Tool Disinfection Procedures',
    script: `Tool disinfection is required between every client in Indiana. Here is the correct procedure. First, remove all hair and debris from your tools using a brush. Second, wash the tools with soap and water. Third, fully immerse the tools in an EPA-registered disinfectant solution for the manufacturer's recommended contact time. Fourth, remove the tools and allow them to air dry completely. Fifth, store them in a clean, covered container. Never use the same tool on a second client without completing this process. The Indiana Professional Licensing Agency requires all barbershops to maintain a disinfection log. Tools found undisinfected during an inspection result in an immediate citation.`,
  },
  {
    slug: 'barber-lesson-5',
    title: 'Shop Sanitation & Client Safety',
    script: `Keeping your station clean protects your clients and your license. Between every client, clean and disinfect the chair, headrest, and armrests. Use a fresh neck strip and clean cape for every client. Sweep hair from the floor between clients. Keep all products capped and stored properly. For personal hygiene, wash your hands before and after every service, keep your nails trimmed and clean, and wear clean professional attire. Regarding client contraindications — do not perform services on clients with visible scalp infections, open wounds, or contagious skin conditions. Refer them to a physician. Your responsibility is to protect both your client and yourself.`,
  },
  {
    slug: 'barber-lesson-6',
    title: 'Indiana Barbering Laws & Regulations',
    script: `Indiana Code Title 25, Article 8 governs the practice of barbering in Indiana. To obtain your barber license through the apprenticeship path, you must complete 2,000 hours of on-the-job training and pass both the written and practical state board exams. Your license must be renewed every two years and displayed at your workstation at all times. Indiana barbers are licensed to perform haircutting, shaving, beard trimming, scalp treatments, and limited chemical services on the head and neck. Violations including practicing without a license, failing inspections, or violating sanitation standards can result in fines, suspension, or revocation of your license. Know the law — it protects you and your clients.`,
  },
  {
    slug: 'barber-lesson-9',
    title: 'Hair Growth Cycle',
    script: `Hair grows in a continuous cycle with three distinct phases. The anagen phase is the active growth phase. It lasts 2 to 7 years, and about 85 percent of your scalp hairs are in anagen at any given time. Hair grows approximately half an inch per month during this phase. The catagen phase is a short transitional phase lasting 2 to 3 weeks. The follicle shrinks and detaches from the dermal papilla. The telogen phase is the resting phase, lasting 3 to 4 months. The old hair is shed and a new anagen hair begins to grow. Losing 50 to 100 hairs per day is completely normal. Understanding the growth cycle helps you explain to clients why haircuts grow out at different rates and why some clients experience thinning.`,
  },
  {
    slug: 'barber-lesson-10',
    title: 'Hair Texture, Density & Porosity',
    script: `Hair has three key properties you must assess before every service. Texture refers to the diameter of the individual hair strand. Fine hair has a small diameter and can be limp. Medium hair is the most common and holds styles well. Coarse hair has a large diameter, is strong, and may resist chemical services. Density is the number of hairs per square inch of scalp — low, medium, or high. This affects how you section and cut. Porosity is the hair's ability to absorb moisture. Low porosity hair has a tight cuticle that resists moisture and chemicals. Normal porosity absorbs and retains moisture well. High porosity hair has a damaged cuticle that absorbs quickly but loses moisture fast. Always assess all three properties during your client consultation.`,
  },
  {
    slug: 'barber-lesson-11',
    title: 'Scalp Conditions & Disorders',
    script: `You will encounter various scalp conditions in the barbershop. Dandruff, or pityriasis, is excessive shedding of dead scalp cells. It can be treated with medicated shampoos and is not contagious. Seborrheic dermatitis causes red, flaky, greasy patches and is more severe than dandruff. Refer persistent cases to a dermatologist. Tinea capitis is a fungal infection of the scalp. It is highly contagious. Do not perform any services — refer the client to a physician immediately. Alopecia is hair loss caused by genetics, stress, hormones, or autoimmune conditions. Androgenetic alopecia, or male pattern baldness, is the most common type. Psoriasis causes thick silvery scales and is not contagious. Services can be performed if the skin is not broken. When in doubt, refer to a physician.`,
  },
  {
    slug: 'barber-lesson-18',
    title: 'Clipper Maintenance & Blade Care',
    script: `Daily clipper maintenance keeps your tools performing at their best and extends their life. After every client, brush all hair from the blades. Apply 2 to 3 drops of clipper oil to the blade while it is running, then wipe off the excess with a clean cloth. Spray the blades with disinfectant between clients. For blade alignment, the top blade should sit slightly behind the bottom blade — never extend past it. If your clippers are pulling or cutting unevenly, the blades need alignment. Have blades professionally sharpened or replaced every 3 to 6 months depending on use. Never submerge clippers in liquid. Keep the vents clear of hair buildup and store in a dry location. Well-maintained tools produce better results and last years longer.`,
  },
  {
    slug: 'barber-lesson-19',
    title: 'Ergonomics & Body Mechanics',
    script: `Barbering is physically demanding. Poor posture and repetitive motion cause chronic injuries that end careers. Protect yourself from day one. For posture, stand with feet shoulder-width apart and keep your back straight — do not hunch over the client. Adjust the chair height so you work at elbow level. Shift your weight between feet and never lock your knees. For wrist and hand health, keep your wrists in a neutral position when cutting. Do not grip tools too tightly. Stretch your hands and wrists between clients. Carpal tunnel syndrome is extremely common in barbers — if you feel tingling or numbness in your hands, address it immediately. Take a 5-minute break every 2 hours. Sit down, stretch, and rest your hands. Your body is your most important tool.`,
  },
  {
    slug: 'barber-lesson-20',
    title: 'Draping & Client Preparation',
    script: `Proper draping protects your client's clothing and presents a professional image. For a haircut service, place a clean neck strip around the client's neck first. Then drape the cutting cape over the client and secure it — snug but not tight. Tuck the neck strip over the cape collar to prevent hair from falling inside the collar. For a shave service, recline the chair to a comfortable shaving position. Place a clean towel across the client's chest and tuck a neck strip or towel around the collar. Always use a fresh neck strip for every client — never reuse one. Proper draping is one of the first things state board examiners check during the practical exam.`,
  },
  {
    slug: 'barber-lesson-22',
    title: 'Head Shape & Sectioning',
    script: `Understanding head sections is the foundation of every haircut. The top section runs from the crown to the front hairline. The sides run from the temples to behind the ears. The back runs from the occipital bone to the nape. The nape is the hairline at the back of the neck. Key reference points include the occipital bone — the bony protrusion at the back of the skull, which is your key reference for fade lines. The parietal ridge is the widest part of the head and determines where the fade transitions. The temporal recession is the natural recession at the temples. Consistent sectioning ensures even weight distribution and a balanced haircut. Always establish your guide line before cutting.`,
  },
  {
    slug: 'barber-lesson-27',
    title: 'Flat Top & Classic Cuts',
    script: `Two classic cuts every barber must master are the flat top and the classic taper. The flat top requires a perfectly level surface on top of the head — it is one of the most technically demanding cuts in barbering. Establish the height on top with a pick and clipper. Use a level comb or flat top comb to guide the cut. Work from front to back maintaining a flat plane, then fade or taper the sides. The classic taper is the foundation of barbering. Hair gradually decreases in length from top to nape. Start with the longest guard on top, work down with progressively shorter guards, blend each transition smoothly, and finish with a clean lineup. Master these two cuts and you have the foundation for every style that follows.`,
  },
  {
    slug: 'barber-lesson-29',
    title: 'Shave Preparation & Hot Towel Service',
    script: `Proper shave preparation is what separates a professional shave from a painful one. It softens the beard, opens the pores, and reduces razor drag — preventing irritation and ingrown hairs. Here is the procedure. Soak a clean towel in hot water. Test the temperature on your wrist first — never on the client's face. Wring out the excess water and apply the towel to the face for 2 to 3 minutes. Remove the towel and apply pre-shave oil to lubricate and protect the skin. Then apply shaving cream and work it into a lather. The lather creates a protective cushion between the razor and the skin. Never skip preparation — it is the difference between a comfortable shave and a client who never comes back.`,
  },
  {
    slug: 'barber-lesson-32',
    title: 'Post-Shave Care & Skin Treatment',
    script: `Post-shave care closes the pores, soothes the skin, and finishes the service professionally. Apply a cold towel after shaving and leave it on for 1 to 2 minutes. This closes the pores and reduces redness. For minor nicks, apply an alum block directly to the nick and hold for 10 to 15 seconds. Never use a tissue — it leaves fibers in the wound. Apply witch hazel to tone and soothe the skin. Finish with an aftershave balm to moisturize and calm any irritation. For clients with curly hair who are prone to razor bumps — a condition called pseudofolliculitis barbae — recommend shaving with the grain only using a single-blade razor. A thorough post-shave routine is what makes clients rebook.`,
  },
  {
    slug: 'barber-lesson-35',
    title: 'Hair Color Theory',
    script: `Hair color theory is essential knowledge for any barber performing color services. Hair color is measured on a level scale from 1, which is black, to 10, which is the lightest blonde. The color wheel uses three primary colors: red, yellow, and blue. Complementary colors — those opposite each other on the wheel — cancel each other out. This is how you neutralize unwanted tones. For example, blue cancels orange, purple cancels yellow. There are four types of hair color. Temporary color coats the cuticle and washes out in 1 to 2 shampoos. Semi-permanent has no developer and lasts 4 to 6 weeks. Demi-permanent uses low-volume developer and lasts 6 to 8 weeks. Permanent color opens the cuticle with developer and creates a lasting change.`,
  },
  {
    slug: 'barber-lesson-36',
    title: 'Chemical Safety & Patch Testing',
    script: `Chemical safety protects both you and your client. A patch test must be performed 24 to 48 hours before any chemical service. Apply a small amount of product behind the ear or inside the elbow. If redness, swelling, or itching occurs — do not proceed with the service. Always wear nitrile gloves when working with chemicals. Wear a protective apron and eye protection when mixing. Ensure adequate ventilation in the workspace. Do not perform chemical services on clients with scalp abrasions, recent chemical services, known allergies to ingredients, or compromised scalp health. Document all chemical services in your client record. If a reaction occurs during a service, rinse immediately with cool water and refer the client to a physician.`,
  },
  {
    slug: 'barber-lesson-37',
    title: 'Relaxers & Texturizers',
    script: `Relaxers permanently alter the hair's structure by breaking the disulfide bonds in the cortex that give hair its curl pattern. The hair is then restructured in a straighter form. There are two main types. Lye relaxers use sodium hydroxide. They process faster and are stronger. No-lye relaxers use guanidine. They are gentler and cause less scalp irritation. Texturizers use the same chemistry as relaxers but with a shorter processing time — they loosen the curl without fully straightening. Application rules: never apply to a scratched or irritated scalp. Base the scalp with petroleum jelly before application to protect from chemical burns. Process only to the manufacturer's recommended time. Neutralize thoroughly — this stops the chemical process and restores the hair's pH.`,
  },
  {
    slug: 'barber-lesson-38',
    title: 'Scalp Treatments',
    script: `Scalp treatments address specific conditions and improve scalp health. Select the right treatment for the condition. Moisturizing treatments help dry, flaky scalps. Clarifying treatments remove product buildup. Anti-dandruff treatments contain zinc pyrithione or selenium sulfide. Stimulating treatments increase circulation using menthol or peppermint. The application procedure is the same for all treatments. First, shampoo the hair. Then apply the treatment directly to the scalp in sections. Massage it in with your fingertips — never your nails. Process according to the manufacturer's instructions. Rinse thoroughly — no residue. Scalp treatments are an excellent add-on service that increases your ticket average and improves client retention.`,
  },
  {
    slug: 'barber-lesson-41',
    title: 'Booth Rental vs. Commission vs. Ownership',
    script: `Understanding barbershop business models helps you plan your career. On commission, you work for the shop owner and receive 40 to 60 percent of your service revenue. The shop provides clients, supplies, and equipment. This is the best model for new barbers building their skills and clientele. With booth rental, you pay the shop owner a weekly or monthly fee to use a chair. You keep 100 percent of your service revenue. You are self-employed and responsible for your own taxes, supplies, and clients. Shop ownership gives you maximum income potential but maximum responsibility. You need a business license, shop license, and significant startup capital. Most barbers start on commission, move to booth rental as they build clientele, and consider ownership after 5 or more years of experience.`,
  },
  {
    slug: 'barber-lesson-42',
    title: 'Pricing, Tipping & Financial Basics',
    script: `Managing your finances well is what separates a successful barber from one who struggles. When setting your prices, research local market rates and factor in your experience level. Price for the service, not the time. Raise your prices as your clientele grows — never undervalue your work. The standard tip for barbering is 15 to 20 percent. Make it easy for clients to tip by using a payment system that prompts for tips. As a self-employed barber, track all income — both cash and card. Set aside 25 to 30 percent for taxes. Keep receipts for all business expenses including supplies, tools, and continuing education. Pay quarterly estimated taxes to avoid penalties at year end. Financial discipline early in your career builds long-term wealth.`,
  },
  {
    slug: 'barber-lesson-43',
    title: 'Professionalism & Ethics',
    script: `Professionalism and ethics are the foundation of a lasting career in barbering. Never speak negatively about other barbers or shops — the industry is small and your reputation travels fast. Respect client confidentiality — what happens in the chair stays in the chair. Do not perform services outside your scope of practice. Be honest about what you can and cannot achieve with a client's hair. If a client is unhappy due to your error, offer to fix it at no charge. If a client is abusive or disrespectful, you have the right to refuse service. Indiana requires continuing education for license renewal — stay current with industry trends and techniques. Your professionalism is what builds trust, and trust is what builds a full book of clients.`,
  },
  {
    slug: 'barber-lesson-46',
    title: 'Indiana State Board Exam Overview',
    script: `The Indiana state board exam has two components. The written exam consists of 100 multiple choice questions. You need a 75 percent passing score. The exam covers five topic areas: infection control and sanitation at 25 percent, hair science and scalp analysis at 20 percent, haircutting and styling at 25 percent, chemical services at 15 percent, and Indiana laws and regulations at 15 percent. The practical exam is performed on a mannequin or live model and graded by state board examiners. You will be evaluated on your haircut with fade, shave service, sanitation procedures, and client draping and preparation. Both components must be passed to receive your Indiana barber license. Preparation is everything — use the next three lessons to review all key facts.`,
  },
  {
    slug: 'barber-lesson-47',
    title: 'Written Exam Review — Sanitation & Science',
    script: `Let's review the key facts for the sanitation and science sections of the written exam. For sanitation: disinfection is required between every client — not sterilization. You must use EPA-registered disinfectants. Sharps go in puncture-resistant containers. Disinfectant solution must be changed daily or when visibly contaminated. Tinea capitis means no service — refer to a physician immediately. For hair science: the cortex contains melanin. Anagen is the active growth phase lasting 2 to 7 years. Normal hair loss is 50 to 100 hairs per day. High porosity hair has a damaged cuticle that cannot retain moisture. Patch tests must be performed 24 to 48 hours before any chemical service. Review these facts until they are automatic — they make up 45 percent of your written exam.`,
  },
  {
    slug: 'barber-lesson-48',
    title: 'Written Exam Review — Techniques & Laws',
    script: `Now let's review the key facts for haircutting techniques and Indiana laws. For techniques: the parietal ridge is the widest part of the head and the reference point for high fades. The occipital bone is at the back of the skull and the reference for low and mid fades. Hold the straight razor at 30 degrees. Set the neckline two finger-widths above the Adam's apple. The first shave pass always goes with the grain. Thinning shears remove bulk without changing length. For Indiana laws: the apprenticeship path requires 2,000 on-the-job training hours. The written exam passing score is 75 percent. Licenses must be renewed every 2 years. Your license must be displayed at your workstation. These facts make up 40 percent of your written exam. Know them cold.`,
  },
  {
    slug: 'barber-lesson-49',
    title: 'Practical Exam Preparation',
    script: `The practical exam tests your ability to perform barbering services correctly under observation. Here is what examiners look for. Proper draping and client preparation. Sanitation procedures performed correctly before and after the service. A clean, even fade with smooth transitions and no lines. A sharp lineup at the hairline, temples, and nape. Proper razor technique with correct angle and grain direction. Professional demeanor throughout the entire service. Practice this checklist until it is automatic. Drape the client with neck strip and cape. Disinfect all tools before beginning. Establish the fade line and work upward. Blend all transitions — no lines. Execute a clean lineup. Perform the shave with correct angle and grain direction. Apply post-shave care. Clean and disinfect your station after the service. Practice this sequence every day until your exam.`,
  },
];

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const onlySlugs = onlyIdx !== -1 ? args[onlyIdx + 1]?.split(',') : null;

  const toProcess = onlySlugs
    ? LESSONS.filter(l => onlySlugs.includes(l.slug))
    : LESSONS;

  console.log(`\nGenerating ${toProcess.length} barber lesson videos`);
  console.log(`Output: ${OUTPUT_DIR}`);
  if (DRY_RUN) console.log('DRY RUN — no files will be written\n');

  const results: { slug: string; path: string }[] = [];

  for (const lesson of toProcess) {
    const outPath = path.join(OUTPUT_DIR, `${lesson.slug}.mp4`);

    if (existsSync(outPath)) {
      console.log(`⏭  ${lesson.slug} — already exists, skipping`);
      results.push({ slug: lesson.slug, path: outPath });
      continue;
    }

    console.log(`\n▶  ${lesson.slug}: ${lesson.title}`);

    if (DRY_RUN) {
      console.log(`   Would generate: ${outPath}`);
      continue;
    }

    try {
      // 1. Generate TTS audio
      const audioPath = path.join(OUTPUT_DIR, `${lesson.slug}.mp3`);
      const audioBuffer = await generateTextToSpeech(lesson.script, VOICE, 1.0);
      await fs.writeFile(audioPath, audioBuffer);

      // 2. Build slide script from lesson content
      const lessonNum = parseInt(lesson.slug.replace('barber-lesson-', '')) || 1;
      const slideScript = await generateLessonScript({
        title: lesson.title,
        lessonNumber: lessonNum,
        moduleName: 'Barber Apprenticeship',
        moduleNumber: Math.ceil(lessonNum / 8),
        description: lesson.script.slice(0, 200),
        content: `<p>${lesson.script}</p>`,
        topics: [],
        contentType: 'lesson',
        courseName: 'Indiana Barber Apprenticeship',
      });

      // 3. Render video
      await renderLessonVideo(
        slideScript.slides,
        audioPath,
        outPath,
        {
          instructorImagePath: INSTRUCTOR_PHOTO,
          instructorName: 'Marcus Johnson',
          instructorTitle: 'Master Barber Instructor',
          courseName: 'Indiana Barber Apprenticeship',
          moduleNumber: Math.ceil(lessonNum / 8),
          moduleName: 'Barber Apprenticeship',
          lessonNumber: lessonNum,
        }
      );

      // 4. Clean up audio
      await fs.unlink(audioPath).catch(() => {});

      console.log(`   ✅ ${outPath}`);
      results.push({ slug: lesson.slug, path: outPath });

    } catch (err: any) {
      console.error(`   ❌ ${lesson.slug} failed: ${err.message}`);
    }
  }

  if (DRY_RUN || results.length === 0) return;

  // Update DB
  console.log(`\nUpdating DB video_url for ${results.length} lessons...`);
  for (const { slug } of results) {
    const videoUrl = `/videos/barber-lessons/${slug}.mp4`;
    const { error } = await db
      .from('course_lessons')
      .update({ video_url: videoUrl })
      .eq('slug', slug)
      .eq('course_id', COURSE_ID);
    if (error) {
      console.error(`  ❌ DB update failed for ${slug}:`, error.message);
    } else {
      console.log(`  ✅ ${slug} → ${videoUrl}`);
    }
  }

  console.log('\nDone.');
}

main().catch(console.error);
