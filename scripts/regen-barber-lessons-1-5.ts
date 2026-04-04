/**
 * Regenerate barber lessons 1-5 with full-length scripts.
 * Each lesson is scoped to its own topic — no overlap.
 * Uses Canvas slide renderer + chunked TTS + FFmpeg.
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { generateTextToSpeech } from '../server/tts-service';
import { renderLessonVideo } from '../server/lesson-video-renderer';
import type { LessonSlide } from '../lib/autopilot/lesson-script-generator';

const OUTPUT_DIR       = path.join(process.cwd(), 'public/videos/barber-lessons');
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/team/instructors/instructor-barber.jpg');
const VOICE            = 'onyx';

interface Lesson {
  slug: string;
  title: string;
  module: string;
  narration: string;
  slides: LessonSlide[];
}

const LESSONS: Lesson[] = [
  {
    slug: 'barber-lesson-1',
    title: 'Welcome to the Barber Apprenticeship',
    module: 'Module 1 — Infection Control & Safety',
    narration: `Welcome to the Barber Apprenticeship program at Elevate for Humanity. I am glad you are here. This is a United States Department of Labor registered apprenticeship — one of the most respected pathways into the barbering profession. Let me walk you through exactly what this program is, what you will earn, and what is expected of you.

This apprenticeship has two components that run simultaneously. The first is related technical instruction — that is this course. You will complete eight modules covering everything from infection control and safety to state board exam preparation. The second component is on-the-job training. You will complete two thousand hours working in a licensed barbershop under the supervision of a licensed barber. Those hours are logged separately with your host shop supervisor and submitted to the Department of Labor.

Let me tell you what you will earn when you complete this program. You will be eligible to sit for the Indiana State Board barber exam — both the written and practical portions. Passing those exams earns you your Indiana barber license. That license is your credential. It is what allows you to legally practice barbering in Indiana and most other states through reciprocity agreements.

Here is how the eight modules are structured. Module one covers infection control and safety — the foundation of professional barbering. You cannot protect your clients if you do not understand how disease spreads and how to stop it. Module two covers hair science and scalp analysis. You need to understand what hair is made of, how it grows, and how to assess it before every service. Module three covers tools and equipment — clippers, shears, straight razors, and how to maintain them. Module four covers haircutting techniques — tapers, fades, and classic cuts. Module five covers shaving and beard services. Module six covers chemical services including relaxers and color. Module seven covers professional and business skills — how to build a clientele, manage your finances, and run a booth or shop. Module eight is state board exam preparation.

Each module ends with a checkpoint quiz. You must score seventy percent or higher to advance to the next module. If you do not pass on the first attempt, review the material and retake it. There is no penalty for retaking — the goal is mastery, not speed.

Your on-the-job hours are your responsibility to track and document. Keep a log. Submit your hours on time. Your apprenticeship coordinator will give you the forms. Do not fall behind on documentation — it delays your license application.

A few things about professionalism before we begin. Show up on time. Every time. Barbering is a service profession and your clients are trusting you with their appearance. Be present, be focused, and take this seriously. The barbers who build loyal clienteles are the ones who treat every client like they matter — because they do.

The barbering industry in Indiana is growing. Licensed barbers with strong technical skills and professional habits are in demand. This program gives you both. Let us get started.`,
    slides: [
      { segment: 'intro', title: 'Welcome to the Barber Apprenticeship', bullets: ['DOL Registered Apprenticeship', '2,000 OJT Hours + Technical Instruction', 'Indiana Barber License upon completion'], imagePrompt: 'professional barbershop interior clean modern' },
      { segment: 'concept', title: 'Program Structure — 8 Modules', bullets: ['Module 1: Infection Control & Safety', 'Module 2: Hair Science & Scalp Analysis', 'Module 3: Tools & Equipment', 'Module 4: Haircutting Techniques'], imagePrompt: 'barber apprentice learning from instructor barbershop' },
      { segment: 'concept', title: 'Modules 5–8', bullets: ['Module 5: Shaving & Beard Services', 'Module 6: Chemical Services', 'Module 7: Professional & Business Skills', 'Module 8: State Board Exam Prep'], imagePrompt: 'barber tools clippers shears organized station' },
      { segment: 'visual', title: 'What You Earn', bullets: ['Indiana Barber License', 'Eligible for state reciprocity', '70% required to pass each checkpoint', 'OJT hours logged with host shop supervisor'], imagePrompt: 'barber license certificate professional credential' },
      { segment: 'application', title: 'Your Responsibilities', bullets: ['Track and submit OJT hours on time', 'Score 70%+ on every checkpoint quiz', 'Show up on time — every time', 'Treat every client like they matter'], imagePrompt: 'professional barber confident at workstation' },
      { segment: 'wrapup', title: 'Ready to Begin', bullets: ['Next: Infection Control & Safety', 'Foundation of professional barbering', 'Protects you and every client'], imagePrompt: 'barbershop open sign ready for business' },
    ],
  },
  {
    slug: 'barber-lesson-2',
    title: 'Infection Control Fundamentals',
    module: 'Module 1 — Infection Control & Safety',
    narration: `Infection control is the foundation of professional barbering. Before you learn a single haircut, you need to understand how disease spreads and how to stop it. This is not optional knowledge — it is the law. The Indiana Professional Licensing Agency requires every licensed barbershop to follow specific infection control protocols. Violations result in citations, fines, and in serious cases, license suspension.

Let us start with the basics. A pathogen is any microorganism that can cause disease. In the barbershop, the pathogens you are most concerned with fall into four categories: bacteria, viruses, fungi, and parasites.

Bacteria are single-celled organisms. Some bacteria are harmless or even beneficial. Others cause infections. In the barbershop, bacterial infections most commonly occur when tools are not properly disinfected and come into contact with broken skin. Staphylococcus aureus — staph — is the most common bacterial infection in barbershops. It causes skin infections that can range from minor to serious. Proper tool disinfection prevents it.

Viruses are smaller than bacteria and cannot be killed by most disinfectants — they must be deactivated. The viruses of greatest concern in the barbershop are bloodborne pathogens: HIV, hepatitis B, and hepatitis C. These are transmitted through contact with infected blood. A nick from a razor or clipper blade is all it takes. We will cover bloodborne pathogens in detail in the next lesson.

Fungi cause conditions like ringworm — tinea capitis — which is a fungal infection of the scalp. It is highly contagious and spreads through direct contact with infected skin or contaminated tools. If you see a client with circular, scaly patches on the scalp, do not perform the service. Refer them to a physician.

Parasites in the barbershop context primarily means head lice — pediculosis capitis. Lice spread through direct contact. If you see lice or nits during a service, stop immediately, do not perform the service, and sanitize your entire station.

Now let us talk about how infection spreads. There are three routes of transmission you need to understand. Direct contact means touching an infected person or their blood or body fluids. Indirect contact means touching a contaminated surface or tool. Droplet transmission means inhaling respiratory droplets from an infected person.

In the barbershop, indirect contact is your primary concern. A clipper blade that touched a client's scalp abrasion and was not disinfected before the next client is a transmission vector. This is why disinfection between every client is non-negotiable.

There are three levels of decontamination. Sanitation reduces the number of pathogens to a safe level — washing hands with soap and water is sanitation. Disinfection destroys most pathogens on non-living surfaces — immersing tools in an EPA-registered disinfectant is disinfection. Sterilization destroys all pathogens including spores — this requires an autoclave and is used in medical settings, not typically in barbershops.

In Indiana, barbershops are required to use disinfection — not just sanitation — on all tools that contact the client. The disinfectant must be EPA-registered and used according to the manufacturer's instructions, including the required contact time. Contact time is how long the tool must remain immersed in the disinfectant to be effective. Pulling the tool out early means it is not disinfected.

Personal protective equipment is your first line of defense. Wear gloves when there is any risk of contact with blood or body fluids. Wash your hands before and after every client. If you nick a client, apply pressure with a clean cloth, use a styptic pencil or powder to stop the bleeding, and change your gloves before continuing.

Infection control is not about fear — it is about professionalism. Clients trust you with their health. Honor that trust.`,
    slides: [
      { segment: 'intro', title: 'Infection Control Fundamentals', bullets: ['Required by Indiana law', 'Protects clients and barbers', 'Foundation of professional practice'], imagePrompt: 'barber washing hands sink professional hygiene' },
      { segment: 'concept', title: 'Types of Pathogens', bullets: ['Bacteria — staph, skin infections', 'Viruses — HIV, Hepatitis B & C', 'Fungi — tinea capitis (ringworm)', 'Parasites — head lice (pediculosis)'], imagePrompt: 'microscope laboratory pathogen science' },
      { segment: 'concept', title: 'Routes of Transmission', bullets: ['Direct contact — touching infected person', 'Indirect contact — contaminated tools', 'Droplet — respiratory transmission', 'Indirect contact is #1 concern in barbershop'], imagePrompt: 'barber disinfecting tools blue solution professional' },
      { segment: 'visual', title: '3 Levels of Decontamination', bullets: ['Sanitation — reduces pathogens (handwashing)', 'Disinfection — destroys most pathogens (tools)', 'Sterilization — destroys all (autoclave, medical)', 'Barbershops require DISINFECTION level'], imagePrompt: 'barbershop disinfectant jar tools soaking clean' },
      { segment: 'application', title: 'On the Job', bullets: ['EPA-registered disinfectant required', 'Follow manufacturer contact time exactly', 'Gloves when risk of blood contact', 'Stop service if contagious condition spotted'], imagePrompt: 'barber gloves professional service client safety' },
      { segment: 'wrapup', title: 'Key Takeaways', bullets: ['Disinfect tools between every client', 'Know your pathogens and transmission routes', 'Next: Bloodborne Pathogens & OSHA Standards'], imagePrompt: 'clean organized barbershop professional station' },
    ],
  },
  {
    slug: 'barber-lesson-3',
    title: 'Bloodborne Pathogens & OSHA Standards',
    module: 'Module 1 — Infection Control & Safety',
    narration: `Bloodborne pathogens are microorganisms present in human blood that can cause serious disease. In the barbershop, you work with sharp tools every day. Nicks happen. When they do, you need to know exactly what to do — and what the law requires of you.

The three bloodborne pathogens of greatest concern are HIV, hepatitis B, and hepatitis C. HIV is the human immunodeficiency virus. It attacks the immune system and can lead to AIDS. Hepatitis B and hepatitis C are viral infections that attack the liver. Hepatitis B is significantly more infectious than HIV — it can survive on a dry surface for up to seven days. Hepatitis C is the most common bloodborne infection in the United States.

All three are transmitted the same way: contact with infected blood or certain body fluids. In the barbershop, the risk comes from a contaminated blade or clipper that contacts broken skin. This is why the phrase "if it's wet and it's not yours, don't touch it" exists in this industry.

OSHA — the Occupational Safety and Health Administration — sets the federal standards for workplace safety. The OSHA Bloodborne Pathogens Standard, 29 CFR 1910.1030, applies to any workplace where employees may be exposed to blood or other potentially infectious materials. Barbershops fall under this standard.

Here is what OSHA requires. First, an exposure control plan. Every barbershop must have a written plan that identifies who is at risk of exposure and what procedures are in place to protect them. Second, universal precautions. Treat every client's blood as if it is infected. Do not make assumptions based on how a client looks or what they tell you. Third, personal protective equipment. Gloves must be available and used when there is a risk of blood contact. Fourth, hepatitis B vaccination. Employers must offer the hepatitis B vaccine to all employees at risk of exposure at no cost to the employee. Fifth, post-exposure procedures. If you are exposed to blood — a needle stick, a cut from a contaminated blade — there is a specific protocol to follow immediately.

The post-exposure protocol is critical. If you nick yourself with a tool that has contacted a client's blood, do the following immediately. Wash the wound thoroughly with soap and water for at least fifteen seconds. Report the exposure to your supervisor. Seek medical evaluation as soon as possible — within two hours if possible. Post-exposure prophylaxis for HIV is most effective when started within seventy-two hours. Document everything.

If you nick a client, apply pressure with a clean cloth or gauze. Use a styptic pencil or powder to stop the bleeding. Change your gloves before continuing the service. Dispose of any contaminated materials in a proper waste container. Do not reuse the blade or tool that caused the nick without disinfecting it first.

Sharps disposal is another OSHA requirement. Used razor blades — also called sharps — must be disposed of in a puncture-resistant sharps container. Never recap a used blade with two hands. Never place used blades in a regular trash can where someone could reach in and get cut.

Indiana state law mirrors OSHA requirements and adds additional barbershop-specific rules. The Indiana Professional Licensing Agency conducts inspections. Inspectors look for proper disinfection procedures, proper sharps disposal, and evidence of an exposure control plan. Violations are cited and fined.

Know these standards. Follow them every day. They protect you, your clients, and your license.`,
    slides: [
      { segment: 'intro', title: 'Bloodborne Pathogens & OSHA', bullets: ['HIV, Hepatitis B, Hepatitis C', 'Transmitted through blood contact', 'OSHA 29 CFR 1910.1030 applies to barbershops'], imagePrompt: 'OSHA safety workplace professional standards' },
      { segment: 'concept', title: 'The 3 Bloodborne Pathogens', bullets: ['HIV — attacks immune system', 'Hepatitis B — survives 7 days on surfaces', 'Hepatitis C — most common bloodborne infection', 'All transmitted via blood contact'], imagePrompt: 'medical safety gloves protection bloodborne' },
      { segment: 'concept', title: 'OSHA Requirements', bullets: ['Written exposure control plan', 'Universal precautions — treat all blood as infected', 'PPE — gloves available and used', 'Hepatitis B vaccine offered at no cost'], imagePrompt: 'workplace safety compliance documentation professional' },
      { segment: 'visual', title: 'Post-Exposure Protocol', bullets: ['Wash wound with soap and water 15+ seconds', 'Report to supervisor immediately', 'Seek medical evaluation within 2 hours', 'HIV PEP most effective within 72 hours'], imagePrompt: 'first aid handwashing sink emergency protocol' },
      { segment: 'application', title: 'Sharps & Client Nicks', bullets: ['Sharps container for used razor blades', 'Never recap blade with two hands', 'Client nick: styptic, change gloves, document', 'Disinfect tool before reuse'], imagePrompt: 'sharps container disposal safety barbershop' },
      { segment: 'wrapup', title: 'Key Takeaways', bullets: ['Universal precautions — always', 'Know post-exposure protocol cold', 'Next: Tool Disinfection Procedures'], imagePrompt: 'professional barber safe clean organized station' },
    ],
  },
  {
    slug: 'barber-lesson-4',
    title: 'Tool Disinfection Procedures',
    module: 'Module 1 — Infection Control & Safety',
    narration: `Tool disinfection is one of the most important skills you will develop as a barber. It is required by Indiana law between every client. It protects your clients from infection, protects you from liability, and protects your license from citation. Let me walk you through the exact procedure.

Before we get into the steps, understand the difference between cleaning and disinfecting. Cleaning removes visible debris — hair, skin cells, product buildup. Disinfecting destroys pathogens. You must clean before you disinfect. Disinfectant cannot penetrate through hair and debris to reach the surface of the tool. If you skip cleaning, you are not actually disinfecting.

Here is the complete tool disinfection procedure. Step one: remove all hair and debris from the tool. Use a stiff brush to remove hair from clipper blades. Wipe shears with a clean cloth. Remove all visible debris before anything else. Step two: wash the tool with soap and water. This is the cleaning step. It removes oils, product residue, and any remaining debris. Rinse thoroughly. Step three: fully immerse the tool in an EPA-registered disinfectant solution. The entire tool must be submerged — not just dipped. The disinfectant must be EPA-registered, which means it has been tested and proven effective against the pathogens listed on its label. Step four: leave the tool in the disinfectant for the full contact time specified by the manufacturer. Contact time is typically ten minutes for most barbershop disinfectants, but read the label. Pulling the tool out early means it is not disinfected — period. Step five: remove the tool and allow it to air dry completely. Do not wipe it dry with a cloth — that can recontaminate it. Step six: store the disinfected tool in a clean, covered container until use.

Now let us talk about specific tools and their requirements. Clippers and trimmers require blade disinfection between every client. Remove the blade, brush out all hair, spray with a blade disinfectant spray, and allow to air dry. Some barbers also use a blade wash solution. The clipper body should be wiped down with a disinfectant wipe. Shears must be wiped clean and immersed in disinfectant solution between clients. Combs and brushes must be washed and immersed in disinfectant solution. Straight razors — if you use a straight razor — require a fresh blade for every client. Never reuse a straight razor blade. Dispose of used blades in a sharps container.

The disinfectant solution itself requires maintenance. Change the solution daily or whenever it becomes visibly contaminated — whichever comes first. A contaminated solution cannot disinfect. Keep the container covered when not in use to prevent evaporation and contamination. Label the container with the date it was mixed.

Indiana requires barbershops to maintain a disinfection log. The log documents that tools were disinfected between clients. During an inspection, the inspector will ask to see the log. If you cannot produce it, you will be cited. Keep the log at your station and fill it out after every client.

Common mistakes to avoid. Do not use the same disinfectant jar for multiple tool types without changing the solution. Do not use household cleaners — they are not EPA-registered disinfectants. Do not skip the cleaning step before disinfecting. Do not reuse a straight razor blade under any circumstances.

Disinfection is not a burden — it is a professional standard. Clients notice when a barber takes it seriously. It builds trust and it builds your reputation.`,
    slides: [
      { segment: 'intro', title: 'Tool Disinfection Procedures', bullets: ['Required between every client in Indiana', 'Cleaning first, then disinfecting', 'EPA-registered disinfectant required'], imagePrompt: 'barber tools disinfectant jar blue solution clippers' },
      { segment: 'concept', title: '6-Step Disinfection Procedure', bullets: ['1. Remove all hair and debris', '2. Wash with soap and water', '3. Fully immerse in EPA disinfectant', '4. Wait full contact time (read label)'], imagePrompt: 'barber cleaning clippers brush debris removal' },
      { segment: 'concept', title: '6-Step Procedure (continued)', bullets: ['5. Remove and air dry completely', '6. Store in clean covered container', 'Never wipe dry — recontaminates tool', 'Never pull out before contact time ends'], imagePrompt: 'barbershop tools organized clean covered storage' },
      { segment: 'visual', title: 'Tool-Specific Rules', bullets: ['Clippers — blade spray + body wipe', 'Shears — immerse in solution', 'Combs/brushes — wash then immerse', 'Straight razor — fresh blade every client'], imagePrompt: 'barber shears clippers combs professional tools laid out' },
      { segment: 'application', title: 'Disinfection Log & Solution Care', bullets: ['Log disinfection after every client', 'Change solution daily or when contaminated', 'Label container with date mixed', 'Inspector will ask for the log'], imagePrompt: 'barbershop inspection log documentation professional' },
      { segment: 'wrapup', title: 'Key Takeaways', bullets: ['Clean before you disinfect — always', 'Full contact time is non-negotiable', 'Next: Shop Sanitation & Client Safety'], imagePrompt: 'clean organized barbershop professional ready for client' },
    ],
  },
  {
    slug: 'barber-lesson-5',
    title: 'Shop Sanitation & Client Safety',
    module: 'Module 1 — Infection Control & Safety',
    narration: `Shop sanitation goes beyond your tools. Your entire workstation, the products you use, and your own personal hygiene all contribute to a safe environment for your clients. Indiana law requires specific sanitation standards for every licensed barbershop. Let me walk you through all of them.

Your workstation is your professional space. Between every client, you are required to clean and disinfect the barber chair — the seat, the back, the headrest, and the armrests. Use a disinfectant wipe or spray and allow it to dry. The headrest is particularly important because it contacts the client's neck and hair directly. Sweep or vacuum all hair from the floor around your station between clients. Hair on the floor is not just unsightly — it is a contamination risk. Keep all products capped and stored properly. An open product can become contaminated and contaminate your clients.

Draping is a sanitation requirement, not just a courtesy. Use a fresh neck strip for every client — never reuse one. The neck strip creates a barrier between the cape and the client's skin. Without it, the cape contacts the client's neck directly and can transfer pathogens from one client to the next. Place the neck strip first, then drape the cape over it. After the service, remove the cape and neck strip together and dispose of the neck strip. Shake the cape out away from your station and store it properly.

Personal hygiene is part of your professional standard. Wash your hands before and after every client — not just when you remember to, but every single time. Use soap and water and wash for at least twenty seconds. Hand sanitizer is acceptable between clients when hands are not visibly soiled, but it does not replace handwashing. Keep your nails trimmed short and clean. Long nails harbor bacteria and can scratch clients. Wear clean professional attire every day. Your appearance communicates your standards to every client who sits in your chair.

Client contraindications are conditions that prevent you from performing a service. You are not a physician and you cannot diagnose conditions, but you are required to recognize when a service is not safe to perform. Do not perform services on clients with visible scalp infections — redness, scaling, pustules, or open sores. Do not perform services on clients with head lice or nits. Do not perform services on clients with open wounds on the scalp or neck. Do not perform services on clients with contagious skin conditions. In all of these cases, politely decline the service and refer the client to a physician. Document the refusal.

Product safety is another component of shop sanitation. Read the labels on every product you use. Follow the manufacturer's instructions for application, processing time, and storage. Never mix products unless the manufacturer specifically instructs you to. Store products away from heat and direct sunlight. Dispose of expired products — do not use them on clients.

The shop itself must meet Indiana sanitation standards. Floors must be swept and mopped regularly. Sinks must be functional and stocked with soap and paper towels. Trash must be emptied regularly. The shop must be well-ventilated, especially when chemical services are being performed. Restrooms must be clean and accessible to clients.

Indiana inspectors conduct unannounced inspections. They check workstations, tools, products, and documentation. A clean, organized shop that follows all sanitation protocols will pass every time. A shop that cuts corners will eventually get cited.

Your reputation is built one client at a time. A clean shop, clean tools, and professional hygiene tell every client that you take their safety seriously. That is how you build a loyal clientele that comes back week after week.`,
    slides: [
      { segment: 'intro', title: 'Shop Sanitation & Client Safety', bullets: ['Workstation, draping, personal hygiene', 'Client contraindications', 'Indiana inspection standards'], imagePrompt: 'clean professional barbershop workstation organized' },
      { segment: 'concept', title: 'Workstation Standards', bullets: ['Disinfect chair, headrest, armrests between clients', 'Sweep hair from floor between every client', 'Keep all products capped and stored', 'Fresh neck strip for every client — no exceptions'], imagePrompt: 'barber cleaning chair disinfecting workstation professional' },
      { segment: 'concept', title: 'Personal Hygiene Standards', bullets: ['Wash hands before and after every client', 'Soap and water — 20 seconds minimum', 'Nails trimmed short and clean', 'Clean professional attire every day'], imagePrompt: 'barber handwashing sink soap professional hygiene' },
      { segment: 'visual', title: 'Client Contraindications', bullets: ['Visible scalp infections — decline service', 'Head lice or nits — decline service', 'Open wounds on scalp or neck — decline', 'Refer to physician, document refusal'], imagePrompt: 'barber professional consultation client assessment' },
      { segment: 'application', title: 'Indiana Inspection Standards', bullets: ['Unannounced inspections by IPLA', 'Floors swept, sinks stocked, trash emptied', 'Ventilation required for chemical services', 'Clean shop passes every time'], imagePrompt: 'barbershop inspection professional compliance clean' },
      { segment: 'wrapup', title: 'Key Takeaways', bullets: ['Sanitation builds client trust and loyalty', 'Contraindications protect clients and your license', 'Next: Indiana Barbering Laws & Regulations'], imagePrompt: 'professional barber confident clean organized shop' },
    ],
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\n=== Barber Lessons 1-5 Regeneration ===`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (let i = 0; i < LESSONS.length; i++) {
    const lesson = LESSONS[i];
    const outputPath = path.join(OUTPUT_DIR, `${lesson.slug}.mp4`);
    const words = lesson.narration.split(/\s+/).length;
    console.log(`[${i + 1}/5] ${lesson.title}`);
    console.log(`  Script: ${words} words (~${Math.round(words / 140)} min)`);
    console.log(`  Slides: ${lesson.slides.length}`);

    if (dryRun) { console.log('  [dry-run skipped]\n'); continue; }

    // TTS
    process.stdout.write('  → TTS audio...');
    const audioBuffer = await generateTextToSpeech(lesson.narration, VOICE, 0.92);
    const tmpAudio = path.join(OUTPUT_DIR, `${lesson.slug}.tmp.mp3`);
    await fs.writeFile(tmpAudio, audioBuffer);
    console.log(` ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    // Render
    process.stdout.write('  → Rendering video...');
    const result = await renderLessonVideo(lesson.slides, tmpAudio, outputPath, {
      width: 1280,
      height: 720,
      instructorName: 'Marcus Johnson',
      instructorTitle: 'Barber Instructor',
      instructorPhoto: INSTRUCTOR_PHOTO,
      accentColor: '#d97706',
      courseName: 'Barber Apprenticeship — Elevate for Humanity',
    });
    await fs.unlink(tmpAudio).catch(() => {});
    console.log(` ✅ ${Math.round(result.duration / 60)}min ${(result.fileSize / 1024 / 1024).toFixed(1)}MB\n`);
  }

  console.log('Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
