/**
 * Rebuild barber lessons 1-5.
 * - Full 4-5 min scripts, each scoped to its own topic
 * - Different b-roll clip per lesson
 * - TTS onyx voice, chunked (no 4096 cap)
 * - ffmpeg loops b-roll to narration length
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { generateTextToSpeech } from '../server/tts-service';

const OUT  = path.join(process.cwd(), 'public/videos/barber-lessons');
const BROLL = path.join(process.cwd(), 'public/videos');

const LESSONS = [
  {
    slug: 'barber-lesson-1',
    broll: 'barber-training.mp4',
    title: 'Welcome to the Barber Apprenticeship',
    script: `Welcome to the Barber Apprenticeship program at Elevate for Humanity. I am glad you are here. This is a United States Department of Labor registered apprenticeship — one of the most respected pathways into the barbering profession.

This apprenticeship has two components that run at the same time. The first is related technical instruction — that is this course. You will complete eight modules covering everything from infection control and safety to state board exam preparation. The second component is on-the-job training. You will complete two thousand hours working in a licensed barbershop under the supervision of a licensed barber. Those hours are logged separately with your host shop supervisor and submitted to the Department of Labor.

Here is what you will earn when you complete this program. You will be eligible to sit for the Indiana State Board barber exam — both the written and practical portions. Passing those exams earns you your Indiana barber license. That license is your credential. It is what allows you to legally practice barbering in Indiana and most other states through reciprocity agreements.

Here is how the eight modules are structured. Module one covers infection control and safety — the foundation of professional barbering. You cannot protect your clients if you do not understand how disease spreads and how to stop it. Module two covers hair science and scalp analysis. You need to understand what hair is made of, how it grows, and how to assess it before every service. Module three covers tools and equipment — clippers, shears, straight razors, and how to maintain them. Module four covers haircutting techniques — tapers, fades, and classic cuts. Module five covers shaving and beard services. Module six covers chemical services including relaxers and color. Module seven covers professional and business skills — how to build a clientele, manage your finances, and run a booth or shop. Module eight is state board exam preparation.

Each module ends with a checkpoint quiz. You must score seventy percent or higher to advance to the next module. If you do not pass on the first attempt, review the material and retake it. There is no penalty for retaking — the goal is mastery, not speed.

Your on-the-job hours are your responsibility to track and document. Keep a log. Submit your hours on time. Your apprenticeship coordinator will give you the forms. Do not fall behind on documentation — it delays your license application.

A few things about professionalism before we begin. Show up on time. Every time. Barbering is a service profession and your clients are trusting you with their appearance. Be present, be focused, and take this seriously. The barbers who build loyal clienteles are the ones who treat every client like they matter — because they do.

The barbering industry in Indiana is growing. Licensed barbers with strong technical skills and professional habits are in demand. This program gives you both. Let us get started.`,
  },
  {
    slug: 'barber-lesson-2',
    broll: 'course-barber-sanitation.mp4',
    title: 'Infection Control Fundamentals',
    script: `Infection control is the foundation of professional barbering. Before you learn a single haircut, you need to understand how disease spreads and how to stop it. This is not optional knowledge — it is the law. The Indiana Professional Licensing Agency requires every licensed barbershop to follow specific infection control protocols. Violations result in citations, fines, and in serious cases, license suspension.

Let us start with the basics. A pathogen is any microorganism that can cause disease. In the barbershop, the pathogens you are most concerned with fall into four categories: bacteria, viruses, fungi, and parasites.

Bacteria are single-celled organisms. Some bacteria are harmless or even beneficial. Others cause infections. In the barbershop, bacterial infections most commonly occur when tools are not properly disinfected and come into contact with broken skin. Staphylococcus aureus — staph — is the most common bacterial infection in barbershops. It causes skin infections that can range from minor to serious. Proper tool disinfection prevents it.

Viruses are smaller than bacteria and cannot be killed by most disinfectants — they must be deactivated. The viruses of greatest concern in the barbershop are bloodborne pathogens: HIV, hepatitis B, and hepatitis C. These are transmitted through contact with infected blood. A nick from a razor or clipper blade is all it takes. We will cover bloodborne pathogens in detail in the next lesson.

Fungi cause conditions like ringworm — tinea capitis — which is a fungal infection of the scalp. It is highly contagious and spreads through direct contact with infected skin or contaminated tools. If you see a client with circular, scaly patches on the scalp, do not perform the service. Refer them to a physician.

Parasites in the barbershop context primarily means head lice — pediculosis capitis. Lice spread through direct contact. If you see lice or nits during a service, stop immediately, do not perform the service, and sanitize your entire station.

Now let us talk about how infection spreads. There are three routes of transmission you need to understand. Direct contact means touching an infected person or their blood or body fluids. Indirect contact means touching a contaminated surface or tool. Droplet transmission means inhaling respiratory droplets from an infected person. In the barbershop, indirect contact is your primary concern. A clipper blade that touched a client's scalp abrasion and was not disinfected before the next client is a transmission vector. This is why disinfection between every client is non-negotiable.

There are three levels of decontamination. Sanitation reduces the number of pathogens to a safe level — washing hands with soap and water is sanitation. Disinfection destroys most pathogens on non-living surfaces — immersing tools in an EPA-registered disinfectant is disinfection. Sterilization destroys all pathogens including spores — this requires an autoclave and is used in medical settings, not typically in barbershops. In Indiana, barbershops are required to use disinfection — not just sanitation — on all tools that contact the client.

Personal protective equipment is your first line of defense. Wear gloves when there is any risk of contact with blood or body fluids. Wash your hands before and after every client. If you nick a client, apply pressure with a clean cloth, use a styptic pencil or powder to stop the bleeding, and change your gloves before continuing.

Infection control is not about fear — it is about professionalism. Clients trust you with their health. Honor that trust.`,
  },
  {
    slug: 'barber-lesson-3',
    broll: 'course-barber-consultation.mp4',
    title: 'Bloodborne Pathogens & OSHA Standards',
    script: `Bloodborne pathogens are microorganisms present in human blood that can cause serious disease. In the barbershop, you work with sharp tools every day. Nicks happen. When they do, you need to know exactly what to do — and what the law requires of you.

The three bloodborne pathogens of greatest concern are HIV, hepatitis B, and hepatitis C. HIV is the human immunodeficiency virus. It attacks the immune system and can lead to AIDS. Hepatitis B and hepatitis C are viral infections that attack the liver. Hepatitis B is significantly more infectious than HIV — it can survive on a dry surface for up to seven days. Hepatitis C is the most common bloodborne infection in the United States. All three are transmitted the same way: contact with infected blood or certain body fluids. In the barbershop, the risk comes from a contaminated blade or clipper that contacts broken skin.

OSHA — the Occupational Safety and Health Administration — sets the federal standards for workplace safety. The OSHA Bloodborne Pathogens Standard applies to any workplace where employees may be exposed to blood or other potentially infectious materials. Barbershops fall under this standard.

Here is what OSHA requires. First, an exposure control plan. Every barbershop must have a written plan that identifies who is at risk of exposure and what procedures are in place to protect them. Second, universal precautions. Treat every client's blood as if it is infected. Do not make assumptions based on how a client looks or what they tell you. Third, personal protective equipment. Gloves must be available and used when there is a risk of blood contact. Fourth, hepatitis B vaccination. Employers must offer the hepatitis B vaccine to all employees at risk of exposure at no cost to the employee. Fifth, post-exposure procedures. If you are exposed to blood, there is a specific protocol to follow immediately.

The post-exposure protocol is critical. If you nick yourself with a tool that has contacted a client's blood, do the following immediately. Wash the wound thoroughly with soap and water for at least fifteen seconds. Report the exposure to your supervisor. Seek medical evaluation as soon as possible — within two hours if possible. Post-exposure prophylaxis for HIV is most effective when started within seventy-two hours. Document everything.

If you nick a client, apply pressure with a clean cloth or gauze. Use a styptic pencil or powder to stop the bleeding. Change your gloves before continuing the service. Dispose of any contaminated materials in a proper waste container. Do not reuse the blade or tool that caused the nick without disinfecting it first.

Sharps disposal is another OSHA requirement. Used razor blades must be disposed of in a puncture-resistant sharps container. Never recap a used blade with two hands. Never place used blades in a regular trash can where someone could reach in and get cut.

Know these standards. Follow them every day. They protect you, your clients, and your license.`,
  },
  {
    slug: 'barber-lesson-4',
    broll: 'course-barber-clipper-techniques.mp4',
    title: 'Tool Disinfection Procedures',
    script: `Tool disinfection is one of the most important skills you will develop as a barber. It is required by Indiana law between every client. It protects your clients from infection, protects you from liability, and protects your license from citation.

Before we get into the steps, understand the difference between cleaning and disinfecting. Cleaning removes visible debris — hair, skin cells, product buildup. Disinfecting destroys pathogens. You must clean before you disinfect. Disinfectant cannot penetrate through hair and debris to reach the surface of the tool. If you skip cleaning, you are not actually disinfecting.

Here is the complete tool disinfection procedure. Step one: remove all hair and debris from the tool. Use a stiff brush to remove hair from clipper blades. Wipe shears with a clean cloth. Remove all visible debris before anything else. Step two: wash the tool with soap and water. This is the cleaning step. It removes oils, product residue, and any remaining debris. Rinse thoroughly. Step three: fully immerse the tool in an EPA-registered disinfectant solution. The entire tool must be submerged — not just dipped. Step four: leave the tool in the disinfectant for the full contact time specified by the manufacturer. Contact time is typically ten minutes for most barbershop disinfectants, but read the label. Pulling the tool out early means it is not disinfected — period. Step five: remove the tool and allow it to air dry completely. Do not wipe it dry with a cloth — that can recontaminate it. Step six: store the disinfected tool in a clean, covered container until use.

Now let us talk about specific tools and their requirements. Clippers and trimmers require blade disinfection between every client. Remove the blade, brush out all hair, spray with a blade disinfectant spray, and allow to air dry. The clipper body should be wiped down with a disinfectant wipe. Shears must be wiped clean and immersed in disinfectant solution between clients. Combs and brushes must be washed and immersed in disinfectant solution. Straight razors require a fresh blade for every client. Never reuse a straight razor blade. Dispose of used blades in a sharps container.

The disinfectant solution itself requires maintenance. Change the solution daily or whenever it becomes visibly contaminated — whichever comes first. A contaminated solution cannot disinfect. Keep the container covered when not in use. Label the container with the date it was mixed.

Indiana requires barbershops to maintain a disinfection log. The log documents that tools were disinfected between clients. During an inspection, the inspector will ask to see the log. If you cannot produce it, you will be cited. Keep the log at your station and fill it out after every client.

Disinfection is not a burden — it is a professional standard. Clients notice when a barber takes it seriously. It builds trust and it builds your reputation.`,
  },
  {
    slug: 'barber-lesson-5',
    broll: 'course-barber-shampoo.mp4',
    title: 'Shop Sanitation & Client Safety',
    script: `Shop sanitation goes beyond your tools. Your entire workstation, the products you use, and your own personal hygiene all contribute to a safe environment for your clients. Indiana law requires specific sanitation standards for every licensed barbershop.

Your workstation is your professional space. Between every client, you are required to clean and disinfect the barber chair — the seat, the back, the headrest, and the armrests. Use a disinfectant wipe or spray and allow it to dry. The headrest is particularly important because it contacts the client's neck and hair directly. Sweep or vacuum all hair from the floor around your station between clients. Keep all products capped and stored properly. An open product can become contaminated and contaminate your clients.

Draping is a sanitation requirement, not just a courtesy. Use a fresh neck strip for every client — never reuse one. The neck strip creates a barrier between the cape and the client's skin. Without it, the cape contacts the client's neck directly and can transfer pathogens from one client to the next. Place the neck strip first, then drape the cape over it. After the service, remove the cape and neck strip together and dispose of the neck strip. Shake the cape out away from your station and store it properly.

Personal hygiene is part of your professional standard. Wash your hands before and after every client — not just when you remember to, but every single time. Use soap and water and wash for at least twenty seconds. Hand sanitizer is acceptable between clients when hands are not visibly soiled, but it does not replace handwashing. Keep your nails trimmed short and clean. Long nails harbor bacteria and can scratch clients. Wear clean professional attire every day. Your appearance communicates your standards to every client who sits in your chair.

Client contraindications are conditions that prevent you from performing a service. You are not a physician and you cannot diagnose conditions, but you are required to recognize when a service is not safe to perform. Do not perform services on clients with visible scalp infections — redness, scaling, pustules, or open sores. Do not perform services on clients with head lice or nits. Do not perform services on clients with open wounds on the scalp or neck. Do not perform services on clients with contagious skin conditions. In all of these cases, politely decline the service and refer the client to a physician. Document the refusal.

Indiana inspectors conduct unannounced inspections. They check workstations, tools, products, and documentation. A clean, organized shop that follows all sanitation protocols will pass every time. A shop that cuts corners will eventually get cited.

Your reputation is built one client at a time. A clean shop, clean tools, and professional hygiene tell every client that you take their safety seriously. That is how you build a loyal clientele that comes back week after week.`,
  },
];

function getAudioDuration(p: string): number {
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`, { encoding: 'utf8' });
    return parseFloat(out.trim()) || 60;
  } catch { return 60; }
}

async function buildLesson(lesson: typeof LESSONS[0]) {
  const outputPath = path.join(OUT, `${lesson.slug}.mp4`);
  const brollPath  = path.join(BROLL, lesson.broll);
  const tmp        = fs.mkdtempSync(path.join(os.tmpdir(), 'barber-'));

  try {
    // 1. TTS
    process.stdout.write(`  → TTS...`);
    const audioBuffer = await generateTextToSpeech(lesson.script, 'onyx', 0.92);
    const audioPath = path.join(tmp, 'narration.mp3');
    fs.writeFileSync(audioPath, audioBuffer);
    const audioDur = getAudioDuration(audioPath);
    console.log(` ${Math.round(audioDur)}s (${(audioBuffer.length/1024/1024).toFixed(1)}MB)`);

    // 2. Loop b-roll to narration length
    process.stdout.write(`  → Looping ${lesson.broll}...`);
    const loopedPath = path.join(tmp, 'looped.mp4');
    execSync(
      `ffmpeg -y -stream_loop -1 -i "${brollPath}" -t ${audioDur.toFixed(2)} -c:v libx264 -preset fast -crf 20 -an "${loopedPath}"`,
      { stdio: 'pipe' }
    );
    console.log(` done`);

    // 3. Mux video + audio
    process.stdout.write(`  → Muxing...`);
    execSync(
      `ffmpeg -y -i "${loopedPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`,
      { stdio: 'pipe' }
    );
    const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
    console.log(` ✅ ${size}MB → ${outputPath}`);

  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\n=== Barber Lessons 1-5 Final Rebuild ===\n`);
  fs.mkdirSync(OUT, { recursive: true });

  for (let i = 0; i < LESSONS.length; i++) {
    const l = LESSONS[i];
    const words = l.script.split(/\s+/).length;
    console.log(`[${i+1}/5] ${l.title}`);
    console.log(`  B-roll: ${l.broll} | Script: ${words} words (~${Math.round(words/140)} min)`);
    if (dryRun) { console.log('  [dry-run]\n'); continue; }
    await buildLesson(l);
    console.log();
  }
  console.log('Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
