/**
 * Barber Apprenticeship Blueprint
 *
 * Slug numbering convention (intentional — do not "fix"):
 *   Each module contains 6 lessons + 1 checkpoint.
 *   Lessons are numbered sequentially across modules (1–6, 8–13, 15–20, …).
 *   The 7th slot of each module (7, 14, 21, 28, …) is reserved for the checkpoint,
 *   which uses a named slug (barber-module-N-checkpoint) instead of barber-lesson-N.
 *   These gaps are load-bearing — progress tracking and unlock logic depend on them.
 *   Never renumber existing slugs. Add new lessons at the next available number.
 *
 * Module → lesson slug map:
 *   Module 1 (Foundations & Safety):          lessons 1–6,  checkpoint slot 7
 *   Module 2 (Hair Science & Scalp Analysis):  lessons 8–13, checkpoint slot 14
 *   Module 3 (Haircutting Theory):             lessons 15–20, checkpoint slot 21
 *   Module 4 (Shaving & Facial Hair):          lessons 22–27, checkpoint slot 28
 *   Module 5 (Chemical Services):              lessons 29–33, checkpoint slot 34
 *   Module 6 (Business & Client Relations):    lessons 35–38, checkpoint slot 39
 *   Module 7 (State Board Prep):               lessons 40–44, checkpoint slot 45
 *   Module 8 (Capstone):                       lessons 46–49, final exam
 */
import type { CredentialBlueprint, BlueprintVideoConfig } from './types';

const BARBER_VIDEO_CONFIG: BlueprintVideoConfig = {
  videoGenerator:      'runway',
  template:            'elevate-slide',
  instructorName:      'Brandon Williams',
  instructorTitle:     'Master Barber · 12 yrs',
  instructorImagePath: '/images/team/instructors/instructor-barber.jpg',
  topBarColor:         '#ea580c',
  accentColor:         '#0f172a',
  backgroundColor:     '#ffffff',
  ttsVoice:            'onyx',
  ttsSpeed:            0.88,
  slideCount:          5,
  segments:            ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage:  true,
  dalleImageStyle:     'natural',
};

export const barberApprenticeshipBlueprint: CredentialBlueprint = {
  id: 'barber-apprenticeship-v1',
  version: '1.0.0',
  credentialSlug: 'indiana-barber-license',
  credentialTitle: 'Indiana Registered Barber License',
  state: 'IN',
  programSlug: 'barber-apprenticeship',
  credentialCode: 'IN-BARBER',
  trackVariants: ['apprenticeship'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 72,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 64,

  modules: [
    // ── Module 1 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-1',
      title: 'Module 1: Infection Control & Safety',
      orderIndex: 1,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'infection_control',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'sanitation_standards',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'disinfection_protocols', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'osha_compliance',        isCritical: true,  minimumTouchpoints: 1 },
        { competencyKey: 'bloodborne_pathogens',   isCritical: true,  minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-1',
          title: 'Introduction to Barbering',
          order: 1,
          domainKey: 'infection_control',
          objective: 'Describe the history and legal framework of barbering in Indiana, explain the DOL apprenticeship structure, and identify the scope of practice for licensed barbers.',
          durationMinutes: 25,
          videoFile: '/videos/barber-course-intro-with-voice.mp4',
          content: `<h2>Introduction to Barbering</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to: (1) describe the history of barbering and the origin of the barber pole; (2) explain Indiana's licensing requirements and scope of practice; (3) describe the DOL apprenticeship structure and your obligations as a registered apprentice; (4) identify the consequences of practicing without a license.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Scope of practice</strong> — the specific services a licensed barber is legally permitted to perform in Indiana</li>
  <li><strong>Indiana Code Title 25, Article 8</strong> — the state law governing barbering licensure and practice</li>
  <li><strong>Indiana Professional Licensing Agency (IPLA)</strong> — the state body that issues and regulates barber licenses</li>
  <li><strong>DOL-registered apprenticeship</strong> — a federally recognized training program combining on-the-job hours with related technical instruction</li>
  <li><strong>Related Technical Instruction (RTI)</strong> — the coursework you are completing now; required alongside your 2,000 OJT hours</li>
  <li><strong>Supervision requirement</strong> — apprentices must work under a licensed barber at all times; independent practice is illegal</li>
</ul>

<h3>Explanation</h3>

<h4>History of Barbering</h4>
<p>The barber pole — red, white, and blue — is one of the oldest professional symbols in the world. In medieval Europe, barbers performed surgery, tooth extractions, and bloodletting alongside haircuts. The red stripe represents blood, the white represents bandages, and the blue (added in the United States) represents veins. The rotating pole mimics the bandages wrung out after bloodletting.</p>
<p>By the 19th century, medicine and barbering separated into distinct professions. Today, barbering is a regulated trade in all 50 states. The first barber licensing law in the United States was passed in Minnesota in 1897.</p>

<h4>Indiana Licensing Requirements</h4>
<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Requirement</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Standard Path</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Apprenticeship Path</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;">Training hours</td>
      <td style="padding:8px; border:1px solid #d1d5db;">1,500 school hours</td>
      <td style="padding:8px; border:1px solid #d1d5db;">2,000 OJT hours + RTI</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;">Written exam</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Required</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Required</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;">Practical exam</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Required</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Required</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;">License renewal</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Every 2 years</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Every 2 years</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;">License display</td>
      <td style="padding:8px; border:1px solid #d1d5db;">At workstation</td>
      <td style="padding:8px; border:1px solid #d1d5db;">At workstation</td>
    </tr>
  </tbody>
</table>

<h4>Indiana Scope of Practice</h4>
<p>Indiana-licensed barbers are authorized to perform the following services on the head, face, and neck:</p>
<ul>
  <li>Haircutting and styling</li>
  <li>Shaving and beard trimming</li>
  <li>Scalp treatments and massages</li>
  <li>Limited chemical services (color, relaxers) — within training</li>
  <li>Eyebrow arching (with blade or thread)</li>
</ul>
<p>Barbers are <strong>not</strong> authorized to perform nail services, full-body waxing, or medical procedures. Performing services outside your scope of practice is a licensing violation.</p>

<h4>Your DOL Apprenticeship Obligations</h4>
<p>As a registered apprentice, you have three obligations: (1) complete your 2,000 OJT hours under a licensed supervising barber; (2) complete all RTI coursework (this program); (3) maintain your apprenticeship registration with the DOL. Your supervising barber is legally responsible for your work. If you perform a service without supervision and something goes wrong, both you and your supervisor face liability.</p>

<h3>Real-World Application</h3>
<p>On your first day, a walk-in client asks if you can cut their hair. Your supervisor is in the back. You are a registered apprentice — not yet licensed. The correct response: "I'm an apprentice — let me get my supervising barber." Do not start the service. Do not ask the client to wait while you "just do a quick trim." There is no such thing as a quick trim that is legally protected for an unsupervised apprentice. Get your supervisor first, every time.</p>

<h3>Summary</h3>
<ul>
  <li>The barber pole's red/white/blue stripes trace to medieval surgical practice</li>
  <li>Indiana requires 2,000 OJT hours + RTI + written and practical exams for the apprenticeship path</li>
  <li>Scope of practice: head, face, and neck services only — no nail or medical services</li>
  <li>Apprentices must work under licensed supervision at all times — no exceptions</li>
  <li>License must be displayed at your workstation and renewed every 2 years</li>
</ul>

<h4>State Board Alignment</h4>
<ul>
  <li>Indiana Code Title 25, Article 8 — Barbering Licensure</li>
  <li>Indiana Professional Licensing Agency — License Requirements</li>
  <li>U.S. Department of Labor — Registered Apprenticeship Standards</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l1-q1',
              question: 'What does the red stripe on the barber pole historically represent?',
              options: ['Red hair dye used in ancient Rome', 'Blood from surgical and bloodletting services', 'The red uniform of medieval barbers', 'A warning sign for dangerous tools'],
              correctAnswer: 1,
              explanation: 'The red stripe represents blood from the surgical and bloodletting services barbers performed in medieval Europe.',
            },
            {
              id: 'mod1-l1-q2',
              question: 'Under the Indiana apprenticeship path, how many on-the-job training hours are required before licensure?',
              options: ['1,000', '1,500', '2,000', '2,500'],
              correctAnswer: 2,
              explanation: 'The Indiana apprenticeship path requires 2,000 OJT hours plus completion of Related Technical Instruction (RTI).',
            },
            {
              id: 'mod1-l1-q3',
              question: 'A walk-in client asks you to cut their hair. Your supervisor is in the back. You are a registered apprentice. What do you do?',
              options: [
                'Start the cut — it is just a trim',
                'Ask the client to sign a waiver, then proceed',
                'Tell the client you are an apprentice and get your supervising barber first',
                'Do a dry cut only since that does not require supervision',
              ],
              correctAnswer: 2,
              explanation: 'Apprentices must work under licensed supervision at all times. There is no unsupervised service that is legally protected.',
            },
            {
              id: 'mod1-l1-q4',
              question: 'Which of the following is OUTSIDE the scope of practice for an Indiana-licensed barber?',
              options: ['Scalp treatments', 'Beard trimming', 'Full-body waxing', 'Eyebrow arching with a blade'],
              correctAnswer: 2,
              explanation: 'Full-body waxing is outside the barber scope of practice in Indiana. Barbers are licensed for head, face, and neck services only.',
            },
            {
              id: 'mod1-l1-q5',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
            },
            {
              id: 'mod1-l1-q6',
              question: 'A barber performs a chemical relaxer service on a client without having received training in relaxers. This is:',
              options: [
                'Acceptable if the client consents',
                'A violation of scope of practice',
                'Allowed if the barber has 5+ years of experience',
                'Only a problem if the client is harmed',
              ],
              correctAnswer: 1,
              explanation: 'Performing services outside your training is a scope of practice violation regardless of client consent or experience level.',
            },
            {
              id: 'mod1-l1-q7',
              question: 'The first barber licensing law in the United States was passed in which state?',
              options: ['New York', 'Indiana', 'Minnesota', 'California'],
              correctAnswer: 2,
              explanation: 'Minnesota passed the first barber licensing law in the United States in 1897.',
            },
            {
              id: 'mod1-l1-q8',
              question: 'Which body issues and regulates barber licenses in Indiana?',
              options: [
                'U.S. Department of Labor',
                'Indiana Professional Licensing Agency (IPLA)',
                'Indiana Department of Health',
                'National Barber Association',
              ],
              correctAnswer: 1,
              explanation: 'The Indiana Professional Licensing Agency (IPLA) issues and regulates barber licenses under Indiana Code Title 25, Article 8.',
            },
          ],
        },
        {
          slug: 'barber-lesson-2',
          title: 'Professional Conduct & Ethics',
          order: 2,
          domainKey: 'infection_control',
          objective: 'Apply professional standards of conduct, ethics, and client communication in a barbershop setting.',
          durationMinutes: 20,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Professional Conduct & Ethics</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to define professional conduct in a barbershop, handle difficult client situations ethically, and understand the consequences of unprofessional behavior.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Professionalism is how clients judge your competence before you touch their hair</li>
  <li>Ethical conduct means doing the right thing even when no one is watching</li>
  <li>Client confidentiality — what happens in the chair stays in the chair</li>
  <li>Scope of practice — never perform services you are not trained or licensed to do</li>
  <li>Discrimination is illegal — you must serve all clients equally</li>
</ul>

<h3>Explanation</h3>
<p>Professional conduct covers everything from how you greet a client to how you handle a complaint. It includes your appearance, your language, your punctuality, and your attitude. Clients form an impression of your skill level based on your professionalism before the first cut.</p>
<p>Ethics in barbering means respecting client privacy, being honest about what a service will cost and what results are realistic, and never performing a service outside your training. If a client asks for a chemical service you have not been trained on, the ethical answer is to refer them to someone qualified — not to attempt it and risk harm.</p>
<p>Indiana law prohibits discrimination in licensed service businesses. You must provide services to all clients regardless of race, religion, gender, disability, or national origin.</p>

<h3>Real-World Application</h3>
<p>A regular client tells you personal information about a family problem while in your chair. Later, another client asks about that person. The correct response: say nothing. Client conversations are confidential. Sharing personal information — even casually — is an ethical violation that destroys trust and can cost you your clientele.</p>

<h3>Summary</h3>
<ul>
  <li>Professionalism shapes client perception before the service begins</li>
  <li>Ethics means honesty, confidentiality, and staying within your scope of practice</li>
  <li>Discrimination in service is illegal in Indiana</li>
  <li>Refer clients to qualified professionals when a service is outside your training</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l2-q1',
              question: 'A client asks you to perform a chemical relaxer service. You have not been trained on relaxers yet. What is the ethical response?',
              options: [
                'Attempt it — you can figure it out',
                'Watch a video first, then proceed',
                'Decline and refer the client to a qualified barber',
                'Do a patch test and proceed if there is no reaction',
              ],
              correctAnswer: 2,
              explanation: 'Performing services outside your training risks client harm and violates your scope of practice.',
            },
            {
              id: 'mod1-l2-q2',
              question: 'A client shares personal information while in your chair. Another client later asks about that person. You should:',
              options: [
                'Share only general information',
                'Say nothing — client conversations are confidential',
                'Tell them to ask the person directly',
                'Share if the information is not sensitive',
              ],
              correctAnswer: 1,
              explanation: 'Client confidentiality is an ethical obligation. All personal information shared in the chair stays private.',
            },
            {
              id: 'mod1-l2-q3',
              question: 'Which of the following is an example of professional conduct?',
              options: [
                'Arriving 10 minutes late but finishing the cut quickly',
                'Wearing clean attire, greeting clients by name, and being on time',
                'Checking your phone between cuts',
                'Discussing other clients with the current client',
              ],
              correctAnswer: 1,
              explanation: 'Professional conduct includes appearance, punctuality, and respectful client interaction.',
            },
            {
              id: 'mod1-l2-q4',
              question: 'Under Indiana law, you must provide services to clients regardless of:',
              options: [
                'Their ability to tip',
                'Their hair type',
                'Race, religion, gender, disability, or national origin',
                'Whether they have an appointment',
              ],
              correctAnswer: 2,
              explanation: 'Indiana law prohibits discrimination in licensed service businesses.',
            },
          ],
        },
        {
          slug: 'barber-lesson-3',
          title: 'Tools & Equipment',
          order: 3,
          domainKey: 'infection_control',
          objective: 'Identify, name, and describe the correct use of essential barbering tools and equipment.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Tools & Equipment</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to identify every essential barbering tool, explain its purpose, and describe the correct technique for holding and using each one safely.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Clippers — electric tools used for bulk cutting and fading; guards control length</li>
  <li>Trimmers (edgers) — smaller electric tools for detail work, lineups, and edges</li>
  <li>Shears (scissors) — used for scissor-over-comb, texturizing, and finishing</li>
  <li>Straight razor — used for shaving, lineups, and neck cleanup; requires a license</li>
  <li>Combs — wide-tooth for detangling, fine-tooth for cutting guides</li>
  <li>Brushes — neck brush for removing clippings; boar bristle for styling</li>
  <li>Cape and neck strip — protect client clothing and prevent hair contact with skin</li>
</ul>

<h3>Explanation</h3>
<p><strong>Clippers:</strong> Hold the clipper with your dominant hand, thumb on top for control. Move against the grain for shorter cuts, with the grain for blending. Guards range from 0 (skin) to 8 (1 inch). Always oil clipper blades before and after use.</p>
<p><strong>Shears:</strong> Insert your thumb and ring finger into the rings. Only the thumb moves — the bottom blade stays still. Keep your pinky off the finger rest unless stabilizing. Dull shears push hair instead of cutting it — keep them sharp.</p>
<p><strong>Straight razor:</strong> Hold with four fingers on the shank and thumb underneath. The blade angle should be 30 degrees to the skin. Never use a straight razor on broken skin or active acne.</p>
<p><strong>Combs:</strong> Use the wide-tooth end to detangle before cutting. Use the fine-tooth end as a cutting guide for scissor-over-comb and clipper-over-comb techniques.</p>

<h3>Real-World Application</h3>
<p>You are setting up your station before your first client. Your clippers are not cutting cleanly — they are pulling hair instead of cutting. Before reaching for a new blade, check: Are the blades oiled? Is the taper lever in the correct position? Is there hair buildup between the blades? Most clipper problems are maintenance problems, not equipment failures.</p>

<h3>Summary</h3>
<ul>
  <li>Know every tool by name and purpose before using it on a client</li>
  <li>Clippers use guards to control length; oil blades before and after every use</li>
  <li>Only the thumb moves when using shears</li>
  <li>Straight razor angle: 30 degrees; never use on broken skin</li>
  <li>Most tool problems are maintenance problems</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l3-q1',
              question: 'Your clippers are pulling hair instead of cutting cleanly. What is the most likely cause?',
              options: [
                'The guard is the wrong size',
                'The blades need oiling or cleaning',
                'The client\'s hair is too thick',
                'The clipper motor is failing',
              ],
              correctAnswer: 1,
              explanation: 'Pulling is almost always a maintenance issue — dirty or dry blades. Oil and clean before assuming equipment failure.',
            },
            {
              id: 'mod1-l3-q2',
              question: 'When using shears, which finger should be the only one that moves?',
              options: ['Index finger', 'Ring finger', 'Thumb', 'Pinky'],
              correctAnswer: 2,
              explanation: 'Only the thumb moves when cutting with shears. The bottom blade stays stationary.',
            },
            {
              id: 'mod1-l3-q3',
              question: 'What is the correct blade angle when using a straight razor on a client?',
              options: ['10 degrees', '20 degrees', '30 degrees', '45 degrees'],
              correctAnswer: 2,
              explanation: 'A 30-degree angle provides the correct balance between closeness and safety.',
            },
            {
              id: 'mod1-l3-q4',
              question: 'Which tool is used for detail work, lineups, and edges?',
              options: ['Clipper', 'Trimmer (edger)', 'Wide-tooth comb', 'Boar bristle brush'],
              correctAnswer: 1,
              explanation: 'Trimmers (edgers) are smaller and more precise than clippers — designed for detail work.',
            },
            {
              id: 'mod1-l3-q5',
              question: 'A client sits down and you notice their collar is exposed. Before starting, you should:',
              options: [
                'Begin cutting — the collar will be fine',
                'Apply a neck strip and cape to protect the client',
                'Ask the client to tuck in their collar',
                'Use a towel instead of a cape',
              ],
              correctAnswer: 1,
              explanation: 'A fresh neck strip and clean cape are required for every client to prevent hair contact with skin and protect clothing.',
            },
          ],
        },
        {
          slug: 'barber-lesson-4',
          title: 'Sanitation & Infection Control',
          order: 4,
          domainKey: 'infection_control',
          objective: 'Differentiate between cleaning, disinfecting, and sterilization; identify types of microorganisms and how they spread; apply OSHA infection control standards; execute blood exposure protocol; maintain a state board-compliant workstation.',
          durationMinutes: 35,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Sanitation & Infection Control</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to: differentiate between cleaning, disinfecting, and sterilization; identify types of microorganisms and how they spread in a barbering environment; apply proper infection control procedures in compliance with OSHA standards; execute blood exposure protocol correctly; maintain a sanitary workstation that meets state board requirements.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Pathogens</strong> — bacteria, viruses, fungi, parasites</li>
  <li><strong>Modes of transmission</strong> — direct contact, indirect contact (contaminated tools), airborne/droplet</li>
  <li><strong>Levels of decontamination</strong> — cleaning, disinfecting, sterilization</li>
  <li><strong>EPA-registered disinfectants</strong> — required by Indiana state board for all tools</li>
  <li><strong>Contact time</strong> — disinfectant must remain wet for the full manufacturer-specified duration</li>
  <li><strong>Bloodborne pathogens</strong> — hepatitis B, hepatitis C, HIV</li>
  <li><strong>Cross-contamination</strong> — transferring pathogens from one surface or person to another via tools, hands, or linens</li>
  <li><strong>Universal Precautions</strong> — treat every client as potentially infectious, every service</li>
</ul>

<h3>Explanation</h3>

<h4>1. Types of Microorganisms — What You Are Actually Fighting</h4>
<p>You are not "cleaning tools." You are interrupting biological transmission chains. Understanding what you are fighting determines how you fight it.</p>
<ul>
  <li><strong>Bacteria</strong> — single-celled organisms. Some are harmless; some are pathogenic. <em>Staphylococcus aureus</em> causes skin infections and folliculitis — spread by contaminated clippers and combs. Bacteria are destroyed by EPA-registered disinfectants.</li>
  <li><strong>Viruses</strong> — require a living host to survive and reproduce. Examples: hepatitis B (survives on dry surfaces up to 7 days), hepatitis C, HIV. HIV is fragile outside the body; hepatitis B is not. Both are inactivated by proper disinfection.</li>
  <li><strong>Fungi</strong> — cause conditions like ringworm (tinea capitis). Ringworm is not a worm — it is a fungal infection presenting as a circular, scaly patch on the scalp. Highly contagious through contaminated clippers, combs, and hats. A client with active ringworm is a contraindication — do not perform services.</li>
  <li><strong>Parasites</strong> — live on or in a host. Head lice (pediculosis capitis) are the most common barbershop parasite. Spread by direct contact and shared tools. A client with visible lice is a contraindication — refer out immediately.</li>
</ul>

<h4>2. How Infection Spreads in a Barbershop</h4>
<p>Your tools are the primary infection vehicle — not the client's hands or breath.</p>
<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Route</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">How It Happens</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Barbershop Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Direct contact</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Skin-to-skin or blood-to-skin</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Barber touches client's open wound without gloves</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Indirect contact</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Contaminated object touches skin</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Undisinfected clipper used on next client — most common route</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Droplet/Airborne</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Respiratory droplets</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Client coughs or sneezes during service</td>
    </tr>
  </tbody>
</table>

<h4>3. Levels of Decontamination — Heavily Tested on State Board</h4>
<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Level</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">What It Does</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Required For</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">State Board Rule</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Cleaning</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Removes visible debris with soap/detergent. Does NOT kill pathogens.</td>
      <td style="padding:8px; border:1px solid #d1d5db;">First step before disinfection</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Never sufficient alone for tools</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Disinfecting</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Kills most microorganisms using EPA-approved chemical agents</td>
      <td style="padding:8px; border:1px solid #d1d5db;">All tools between every client</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Minimum required standard in Indiana</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Sterilization</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Destroys ALL microorganisms including spores. Typically via autoclave.</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Invasive instruments with blood exposure risk</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Not required for standard barbering tools</td>
    </tr>
  </tbody>
</table>
<p><strong>State board trap:</strong> If a tool has blood exposure risk, cleaning alone is never enough. The answer is always disinfection at minimum.</p>

<h4>4. Bloodborne Pathogens & OSHA Compliance</h4>
<p>OSHA Standard 29 CFR 1910.1030 requires all barbershops to have a written Exposure Control Plan. High-risk scenarios in barbering:</p>
<ul>
  <li>Nicks from straight razors or clippers</li>
  <li>Cuts from scissors</li>
  <li>Skin abrasions from aggressive technique</li>
</ul>
<p>Universal Precautions means you treat every client as potentially infectious — every service, every time. You do not ask. You do not assume. You protect.</p>

<h4>5. Blood Exposure Protocol — Memorize This</h4>
<p>This is tested on the Indiana state board written exam. Missing any step is a fail risk.</p>
<ol>
  <li><strong>Stop the service immediately</strong></li>
  <li><strong>Put on gloves</strong> before touching the wound or any blood</li>
  <li><strong>Clean the wound</strong> with soap and water</li>
  <li><strong>Apply antiseptic</strong> to the wound</li>
  <li><strong>Cover with a sterile bandage</strong></li>
  <li><strong>Dispose of contaminated materials</strong> — double-bag in biohazard bags</li>
  <li><strong>Disinfect all tools and surfaces</strong> that contacted blood</li>
  <li><strong>Wash hands thoroughly</strong> with soap and water</li>
</ol>
<p>Document the incident: date, time, what happened, actions taken. If your skin was exposed to the client's blood, report to your supervisor and seek medical evaluation immediately.</p>

<h4>6. Tool & Workstation Sanitation Standards</h4>
<p><strong>The most common mistake barbers make:</strong> spraying disinfectant and wiping immediately. That is not disinfection. That is cleaning. Disinfection requires full contact time — the surface must remain wet for the manufacturer's specified duration (typically 10 minutes for most barbershop disinfectants).</p>
<p><strong>Minimum standards:</strong></p>
<ul>
  <li>Disinfect all tools after every client — no exceptions</li>
  <li>Use a fresh towel and neck strip for every client</li>
  <li>Clean and disinfect the workstation between every client</li>
  <li>Store disinfected tools in a clean, closed container — not back in the disinfectant jar</li>
  <li>Change disinfectant solution daily or when visibly contaminated</li>
  <li>Maintain a disinfection log — Indiana inspectors will ask for it</li>
</ul>

<h3>Real-World Application</h3>
<p>A barber finishes a fade, brushes hair off the clippers, sprays them with disinfectant, and immediately picks them up to use on the next client. The spray contact time is 10 minutes.</p>
<p><strong>What went wrong:</strong> No cleaning step (hair debris still on blades). No contact time (wiped immediately). High risk of cross-contamination — any pathogen from the previous client is still on those blades.</p>
<p><strong>Correct procedure:</strong> Remove all debris. Clean with soap and water. Apply EPA-registered disinfectant. Wait the full contact time. Store in a clean container. Only then use on the next client. On a busy Saturday, this means having multiple sets of blades rotating through the disinfection process — not rushing one set.</p>

<h3>Summary</h3>
<ul>
  <li>Infection control is about breaking transmission chains — not just "cleaning"</li>
  <li>Your tools are the highest-risk infection vector in barbering — not the client's hands</li>
  <li>Disinfection is the minimum professional standard; cleaning alone is never enough for tools</li>
  <li>Contact time is non-negotiable — spraying and wiping immediately is not disinfection</li>
  <li>Blood exposure requires an 8-step protocol — memorize it for state board</li>
  <li>Universal Precautions: treat every client as potentially infectious, every time</li>
</ul>

<h4>State Board Alignment</h4>
<ul>
  <li>Indiana State Board — Infection Control & Safety Standards</li>
  <li>OSHA Standard 29 CFR 1910.1030 — Bloodborne Pathogens</li>
  <li>EPA Disinfectant Registration Requirements</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l4-q1',
              question: 'What type of microorganism requires a living host to survive and reproduce?',
              options: ['Bacteria', 'Virus', 'Fungus', 'Parasite'],
              correctAnswer: 1,
              explanation: 'Viruses cannot reproduce without a host cell. Examples relevant to barbering: hepatitis B, hepatitis C, HIV.',
            },
            {
              id: 'mod1-l4-q2',
              question: 'What is the minimum required level of decontamination for barber tools between clients in Indiana?',
              options: ['Cleaning', 'Disinfecting', 'Sterilization', 'Sanitizing with alcohol wipes'],
              correctAnswer: 1,
              explanation: 'Disinfection with an EPA-registered product is the minimum standard required by Indiana state board for all tools between clients.',
            },
            {
              id: 'mod1-l4-q3',
              question: 'A barber reuses a towel on a second client after shaking the hair out. What risk is present?',
              options: [
                'No risk — the hair was removed',
                'Cross-contamination — pathogens from the first client remain on the towel',
                'Only a risk if the first client had visible skin conditions',
                'Risk only if the towel is wet',
              ],
              correctAnswer: 1,
              explanation: 'Shaking hair out does not remove pathogens. Reusing towels transfers microorganisms from one client to another — cross-contamination.',
            },
            {
              id: 'mod1-l4-q4',
              question: 'A clipper is sprayed with disinfectant and immediately picked up for the next client. What step was skipped?',
              options: [
                'Removing the blade guard',
                'Oiling the blades',
                'Allowing the full contact time for the disinfectant to work',
                'Rinsing with water first',
              ],
              correctAnswer: 2,
              explanation: 'Spraying and wiping immediately is cleaning, not disinfection. The disinfectant must remain wet for the full manufacturer-specified contact time.',
            },
            {
              id: 'mod1-l4-q5',
              question: 'Which method destroys ALL microorganisms, including bacterial spores?',
              options: ['Disinfection with EPA-registered solution', 'Sanitizing with 70% isopropyl alcohol', 'Sterilization via autoclave', 'Cleaning with soap and water'],
              correctAnswer: 2,
              explanation: 'Sterilization (typically via autoclave) is the only method that destroys all microorganisms including spores. Disinfection does not destroy spores.',
            },
            {
              id: 'mod1-l4-q6',
              question: 'What is the FIRST step after a client begins bleeding during a service?',
              options: [
                'Apply antiseptic to the wound',
                'Stop the service immediately',
                'Put on gloves',
                'Ask the client if they want to continue',
              ],
              correctAnswer: 1,
              explanation: 'Step 1 of the blood exposure protocol is to stop the service immediately. Gloves come second — before touching the wound.',
            },
            {
              id: 'mod1-l4-q7',
              question: 'Why is contact time critical in disinfection?',
              options: [
                'Longer contact time makes tools smell cleaner',
                'The disinfectant must remain wet on the surface long enough to chemically destroy pathogens',
                'Contact time only matters for sterilization, not disinfection',
                'It prevents the disinfectant from damaging metal tools',
              ],
              correctAnswer: 1,
              explanation: 'Disinfectants work through a chemical reaction that requires time. Removing tools before the contact time is complete means the process failed — pathogens may still be present.',
            },
          ],
        },

        {
          slug: 'barber-lesson-5',
          title: 'Workplace Safety',
          order: 5,
          domainKey: 'infection_control',
          objective: 'Apply OSHA workplace safety standards and identify hazards specific to barbershop environments.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation.mp4',
          content: `<h2>Workplace Safety</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to identify common barbershop safety hazards, apply OSHA standards to your daily workflow, and respond correctly to workplace injuries and emergencies.</p>

<h3>Key Concepts</h3>
<ul>
  <li>OSHA (Occupational Safety and Health Administration) sets federal workplace safety standards</li>
  <li>Ergonomics — proper posture and body mechanics prevent long-term injury</li>
  <li>Chemical hazards — SDS (Safety Data Sheets) required for all chemical products</li>
  <li>Electrical safety — inspect cords and equipment before every use</li>
  <li>Slip and fall prevention — sweep hair immediately; keep floors dry</li>
  <li>Emergency procedures — know the location of first aid kit, fire extinguisher, and emergency exits</li>
</ul>

<h3>Explanation</h3>
<p><strong>Ergonomics:</strong> Barbers stand for 6–10 hours a day. Poor posture leads to back, neck, and shoulder injuries that end careers. Stand with feet shoulder-width apart, keep your back straight, and position the chair at the correct height so you are not hunching. Anti-fatigue mats reduce strain on your feet and lower back.</p>
<p><strong>Chemical safety:</strong> Every chemical product in your shop — relaxers, color, disinfectants — must have a Safety Data Sheet (SDS) on file. The SDS tells you what the chemical contains, how to handle it safely, and what to do in case of exposure. Indiana OSHA requires SDS access for all employees.</p>
<p><strong>Electrical safety:</strong> Never use equipment with frayed cords. Do not use clippers or trimmers near water. Unplug equipment before cleaning. Report damaged equipment to your supervisor immediately — do not use it.</p>
<p><strong>Slip and fall:</strong> Hair on the floor is a slip hazard. Sweep between every client. Spilled product must be cleaned up immediately. Wet floors require a warning sign.</p>

<h3>Real-World Application</h3>
<p>You notice your clipper cord has a small crack in the insulation near the plug. You are about to start a client. The correct action: do not use the clipper. Tell your supervisor. Use a backup clipper. A cracked cord is an electrocution risk — no client service is worth that risk. Document the equipment issue so it gets repaired or replaced.</p>

<h3>Summary</h3>
<ul>
  <li>OSHA standards apply to every barbershop — know them</li>
  <li>Ergonomics: stand correctly, use anti-fatigue mats, adjust chair height</li>
  <li>SDS sheets required for all chemical products — know where they are</li>
  <li>Never use damaged electrical equipment</li>
  <li>Sweep hair between every client — it is a slip hazard</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l5-q1',
              question: 'You notice your clipper cord has a crack in the insulation. You have a client waiting. What do you do?',
              options: [
                'Use it carefully — the crack is small',
                'Wrap the crack with tape and proceed',
                'Do not use it — report it and use a backup clipper',
                'Finish the current client, then report it',
              ],
              correctAnswer: 2,
              explanation: 'Damaged electrical equipment is an electrocution risk. Never use it regardless of client wait time.',
            },
            {
              id: 'mod1-l5-q2',
              question: 'What document is required on file for every chemical product used in a barbershop?',
              options: [
                'Product receipt',
                'Safety Data Sheet (SDS)',
                'Manufacturer warranty',
                'OSHA inspection report',
              ],
              correctAnswer: 1,
              explanation: 'OSHA requires a Safety Data Sheet (SDS) for every chemical product, accessible to all employees.',
            },
            {
              id: 'mod1-l5-q3',
              question: 'Hair clippings on the floor are primarily a hazard because they:',
              options: [
                'Clog drains',
                'Create a slip and fall risk',
                'Attract insects',
                'Contaminate disinfectant solutions',
              ],
              correctAnswer: 1,
              explanation: 'Hair on the floor is a slip hazard. Sweep between every client.',
            },
            {
              id: 'mod1-l5-q4',
              question: 'Which of the following best describes correct ergonomic posture for a barber?',
              options: [
                'Lean over the client to get closer to the work',
                'Stand with feet together and bend at the waist',
                'Stand with feet shoulder-width apart, back straight, chair at correct height',
                'Sit on a stool whenever possible',
              ],
              correctAnswer: 2,
              explanation: 'Correct posture prevents long-term back, neck, and shoulder injuries that can end a barbering career.',
            },
          ],
        },
        {
          slug: 'barber-lesson-6',
          title: 'Client Consultation',
          order: 6,
          domainKey: 'infection_control',
          objective: 'Conduct a complete client consultation that identifies needs, contraindications, and service goals before beginning any service.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Client Consultation</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to conduct a structured client consultation, identify contraindications that prevent service, and document client preferences for future visits.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Consultation happens before every service — not just the first visit</li>
  <li>Contraindications — conditions that prevent you from performing a service safely</li>
  <li>Client history — medications, allergies, and scalp conditions affect service outcomes</li>
  <li>Managing expectations — be honest about what is achievable with the client's hair type</li>
  <li>Client record cards — document preferences, products used, and any reactions</li>
</ul>

<h3>Explanation</h3>
<p><strong>The consultation process:</strong></p>
<ol>
  <li><strong>Greet and seat</strong> — welcome the client, apply neck strip and cape</li>
  <li><strong>Ask open-ended questions</strong> — "What are we doing today?" not "Same as last time?"</li>
  <li><strong>Assess the hair and scalp</strong> — look for conditions before touching</li>
  <li><strong>Identify contraindications</strong> — scalp infections, open wounds, contagious conditions</li>
  <li><strong>Confirm the service</strong> — repeat back what you will do before starting</li>
  <li><strong>Document</strong> — record the service, products used, and any client notes</li>
</ol>
<p><strong>Contraindications that require referral:</strong> Active scalp infections (ringworm, impetigo), open wounds or sores, contagious skin conditions, severe scalp inflammation. Do not perform services on these clients — refer them to a physician.</p>
<p><strong>Managing expectations:</strong> If a client shows you a photo of a style that will not work with their hair type, be honest. Explain what is achievable and offer an alternative. A client who gets a realistic result they were prepared for is more loyal than one who got a surprise.</p>

<h3>Real-World Application</h3>
<p>A new client sits down and asks for a skin fade. During your scalp assessment, you notice a circular, scaly patch near the crown — a classic sign of ringworm (tinea capitis). You must decline the service, explain that you noticed a scalp condition that requires a doctor's evaluation, and refer them out. Do not name the condition as a diagnosis — you are not a physician. Simply say you cannot safely perform the service and recommend they see a doctor before their next visit.</p>

<h3>Summary</h3>
<ul>
  <li>Consult before every service — conditions change between visits</li>
  <li>Assess the scalp visually before touching</li>
  <li>Contraindications require referral, not service</li>
  <li>Confirm the service plan before starting — eliminate surprises</li>
  <li>Document every service on a client record card</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l6-q1',
              question: 'During a scalp assessment, you notice a circular, scaly patch on a new client\'s scalp. What should you do?',
              options: [
                'Proceed — it is probably just dry skin',
                'Apply a medicated shampoo and continue',
                'Decline the service and refer the client to a physician',
                'Disinfect the area and proceed with gloves',
              ],
              correctAnswer: 2,
              explanation: 'Circular, scaly patches may indicate ringworm — a contraindication. Decline and refer. Do not diagnose.',
            },
            {
              id: 'mod1-l6-q2',
              question: 'A client shows you a photo of a style. You know it will not work with their hair type. You should:',
              options: [
                'Attempt it anyway — the client knows what they want',
                'Be honest, explain what is achievable, and offer an alternative',
                'Do the style and let the client decide if they like it',
                'Refuse the service',
              ],
              correctAnswer: 1,
              explanation: 'Managing expectations honestly builds trust and loyalty. Surprises — even well-intentioned ones — damage the relationship.',
            },
            {
              id: 'mod1-l6-q3',
              question: 'Which question is better for a client consultation?',
              options: [
                '"Same as last time?"',
                '"Short or long?"',
                '"What are we doing today?"',
                '"Do you want a fade?"',
              ],
              correctAnswer: 2,
              explanation: 'Open-ended questions give the client space to describe what they want rather than confirming assumptions.',
            },
            {
              id: 'mod1-l6-q4',
              question: 'Why should you document each client service on a record card?',
              options: [
                'It is required by Indiana law for all services',
                'To track products used, preferences, and any reactions for future visits',
                'To calculate the client\'s total spend',
                'To share with other barbers in the shop',
              ],
              correctAnswer: 1,
              explanation: 'Client records allow you to replicate successful services and avoid repeating mistakes.',
            },
            {
              id: 'mod1-l6-q5',
              question: 'At what point in the service should you confirm the service plan with the client?',
              options: [
                'After the first cut',
                'At the end of the service',
                'Before starting — after the consultation',
                'Only if the client asks',
              ],
              correctAnswer: 2,
              explanation: 'Confirming before you start eliminates misunderstandings and protects both you and the client.',
            },
          ],
        },
        {
          slug: 'barber-module-1-checkpoint',
          title: 'Module 1 Checkpoint — Foundations & Safety',
          order: 7,
          domainKey: 'infection_control',
          objective: 'Demonstrate mastery of professional conduct, tools, sanitation, workplace safety, and client consultation.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 1 Checkpoint — Foundations & Safety</h2>
<p>This checkpoint covers all six lessons in Module 1: Introduction to Barbering, Professional Conduct & Ethics, Tools & Equipment, Sanitation & Infection Control, Workplace Safety, and Client Consultation.</p>
<p>You must score <strong>70% or higher</strong> to unlock Module 2. Review your lesson notes before starting.</p>`,
          quizQuestions: [
            {
              id: 'cp1-q1',
              question: 'A walk-in asks you to cut their hair. You are a registered apprentice, not yet licensed. What is the correct action?',
              options: [
                'Perform the cut — apprentices can work independently',
                'Decline and get your supervising licensed barber',
                'Do a dry cut only since that does not require a license',
                'Ask the client to sign a waiver',
              ],
              correctAnswer: 1,
              explanation: 'Apprentices must work under licensed supervision at all times. Independent practice violates Indiana law.',
            },
            {
              id: 'cp1-q2',
              question: 'Your clipper cord has a crack in the insulation. A client is waiting. You should:',
              options: [
                'Use it carefully for this one client',
                'Wrap the crack with electrical tape and proceed',
                'Not use it — report it and use a backup',
                'Finish the client, then report it',
              ],
              correctAnswer: 2,
              explanation: 'Damaged electrical equipment is an electrocution risk. Never use it regardless of client wait time.',
            },
            {
              id: 'cp1-q3',
              question: 'What level of decontamination is required for barbering tools between clients in Indiana?',
              options: ['Sanitation', 'Disinfection', 'Sterilization', 'Hot water rinse'],
              correctAnswer: 1,
              explanation: 'Indiana requires EPA-registered disinfection of all tools between every client.',
            },
            {
              id: 'cp1-q4',
              question: 'During a scalp assessment, you notice a circular scaly patch on a new client. You should:',
              options: [
                'Proceed — it is probably dandruff',
                'Apply medicated shampoo and continue',
                'Decline the service and refer the client to a physician',
                'Disinfect the area and proceed with gloves',
              ],
              correctAnswer: 2,
              explanation: 'Circular scaly patches may indicate ringworm — a contraindication. Decline and refer without diagnosing.',
            },
            {
              id: 'cp1-q5',
              question: 'Mid-haircut, your blade nicks a client and draws blood. Your FIRST action is:',
              options: [
                'Apply a styptic pencil immediately',
                'Stop the service and put on gloves before touching the area',
                'Finish the cut quickly, then address the nick',
                'Ask the client if they want you to continue',
              ],
              correctAnswer: 1,
              explanation: 'Universal Precautions: gloves before any blood contact. Stop the service first.',
            },
            {
              id: 'cp1-q6',
              question: 'When using shears, which finger should be the only one that moves?',
              options: ['Index finger', 'Ring finger', 'Thumb', 'Pinky'],
              correctAnswer: 2,
              explanation: 'Only the thumb moves when cutting with shears. The bottom blade stays stationary.',
            },
            {
              id: 'cp1-q7',
              question: 'A client shares personal information in the chair. Another client later asks about them. You should:',
              options: [
                'Share only general information',
                'Say nothing — client conversations are confidential',
                'Tell them to ask the person directly',
                'Share if the information is not sensitive',
              ],
              correctAnswer: 1,
              explanation: 'Client confidentiality is an ethical obligation. All personal information stays private.',
            },
            {
              id: 'cp1-q8',
              question: 'What document is required on file for every chemical product in a barbershop?',
              options: ['Product receipt', 'Safety Data Sheet (SDS)', 'Manufacturer warranty', 'OSHA inspection report'],
              correctAnswer: 1,
              explanation: 'OSHA requires a Safety Data Sheet (SDS) for every chemical product, accessible to all employees.',
            },
            {
              id: 'cp1-q9',
              question: 'Which consultation question is most effective for understanding what a client wants?',
              options: ['"Same as last time?"', '"Short or long?"', '"What are we doing today?"', '"Do you want a fade?"'],
              correctAnswer: 2,
              explanation: 'Open-ended questions give clients space to describe their needs rather than confirming assumptions.',
            },
            {
              id: 'cp1-q10',
              question: 'How often must disinfectant solution be changed?',
              options: ['Once a week', 'Once a month', 'Daily or when visibly contaminated', 'Only when it changes color'],
              correctAnswer: 2,
              explanation: 'Disinfectant loses effectiveness when contaminated. Indiana requires daily changes at minimum.',
            },
          ],
        },
      ],
    },

    // ── Module 2 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-2',
      title: 'Module 2: Hair Science & Scalp Analysis',
      orderIndex: 2,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'hair_science',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_structure',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hair_growth_cycle', isCritical: true,  minimumTouchpoints: 1 },
        { competencyKey: 'scalp_conditions',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hair_texture',      isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-8',
          title: 'Structure of the Hair and Scalp',
          order: 1,
          domainKey: 'hair_science',
          objective: 'Identify the layers of the hair shaft and scalp anatomy.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Hair and Scalp Anatomy</h2>
<h3>The Hair Shaft</h3>
<p>Each hair strand has three layers:</p>
<ul>
<li><strong>Cuticle</strong> — the outermost layer; overlapping scales that protect the hair</li>
<li><strong>Cortex</strong> — the middle layer; contains melanin (color) and determines strength and elasticity</li>
<li><strong>Medulla</strong> — the innermost core; not always present in fine hair</li>
</ul>
<h3>The Hair Follicle</h3>
<p>The follicle is the pocket in the scalp from which hair grows. It contains the dermal papilla, which supplies blood and nutrients to the hair root.</p>
<h3>Scalp Layers</h3>
<ul>
<li>Epidermis — outer skin layer</li>
<li>Dermis — contains follicles, sebaceous glands, and blood vessels</li>
<li>Subcutaneous layer — fat and connective tissue</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-9',
          title: 'Hair Growth Cycle',
          order: 2,
          domainKey: 'hair_science',
          objective: 'Explain the three phases of the hair growth cycle.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>The Hair Growth Cycle</h2>
<p>Hair grows in a continuous cycle with three distinct phases:</p>
<h3>Anagen (Growth Phase)</h3>
<p>Active growth phase lasting 2–7 years. About 85% of scalp hairs are in anagen at any time. Hair grows approximately 1/2 inch per month.</p>
<h3>Catagen (Transition Phase)</h3>
<p>A short transitional phase lasting 2–3 weeks. The follicle shrinks and detaches from the dermal papilla.</p>
<h3>Telogen (Resting Phase)</h3>
<p>The resting phase lasting 3–4 months. The old hair is shed and a new anagen hair begins to grow. Losing 50–100 hairs per day is normal.</p>
<h3>Why This Matters for Barbers</h3>
<p>Understanding the growth cycle helps explain why haircuts grow out at different rates and why some clients experience thinning.</p>`,
        },
        {
          slug: 'barber-lesson-10',
          title: 'Hair Texture, Density & Porosity',
          order: 3,
          domainKey: 'hair_science',
          objective: 'Assess hair texture, density, and porosity to select appropriate techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Hair Properties</h2>
<h3>Texture</h3>
<p>Hair texture refers to the diameter of the individual hair strand:</p>
<ul>
<li><strong>Fine</strong> — small diameter, fragile, can be limp</li>
<li><strong>Medium</strong> — most common, holds styles well</li>
<li><strong>Coarse</strong> — large diameter, strong, may resist chemical services</li>
</ul>
<h3>Density</h3>
<p>Density is the number of hairs per square inch of scalp. Low, medium, or high density affects how you section and cut hair.</p>
<h3>Porosity</h3>
<p>Porosity is the hair's ability to absorb moisture:</p>
<ul>
<li><strong>Low porosity</strong> — cuticle is tight; resists moisture and chemicals</li>
<li><strong>Normal porosity</strong> — absorbs and retains moisture well</li>
<li><strong>High porosity</strong> — damaged cuticle; absorbs quickly but loses moisture fast</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-11',
          title: 'Scalp Conditions & Disorders',
          order: 4,
          domainKey: 'hair_science',
          objective: 'Identify common scalp conditions and determine when to refer clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Common Scalp Conditions</h2>
<h3>Dandruff (Pityriasis)</h3>
<p>Excessive shedding of dead scalp cells. Can be treated with medicated shampoos. Not contagious.</p>
<h3>Seborrheic Dermatitis</h3>
<p>Inflammatory condition causing red, flaky, greasy patches. More severe than dandruff. Refer to a dermatologist for persistent cases.</p>
<h3>Tinea Capitis (Ringworm)</h3>
<p>A fungal infection of the scalp. Highly contagious. Do NOT perform services — refer to a physician immediately.</p>
<h3>Alopecia</h3>
<p>Hair loss that can be caused by genetics, stress, hormones, or autoimmune conditions. Androgenetic alopecia (male pattern baldness) is the most common type.</p>
<h3>Psoriasis</h3>
<p>Autoimmune condition causing thick, silvery scales. Not contagious. Services can be performed if skin is not broken.</p>`,
        },
        {
          slug: 'barber-lesson-12',
          title: 'Client Consultation',
          order: 5,
          domainKey: 'hair_science',
          objective: 'Conduct a professional client consultation to assess needs and set expectations.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>The Client Consultation</h2>
<p>Every service begins with a consultation. This protects you legally and ensures client satisfaction.</p>
<h3>What to Assess</h3>
<ul>
<li>Hair type, texture, density, and porosity</li>
<li>Scalp condition — any contraindications?</li>
<li>Client's desired style and lifestyle</li>
<li>Previous chemical services</li>
<li>Allergies or sensitivities</li>
</ul>
<h3>Communication Skills</h3>
<p>Use open-ended questions: "What are you looking for today?" and "How do you style your hair at home?" Listen more than you talk.</p>
<h3>Managing Expectations</h3>
<p>If a client's desired style is not achievable with their hair type, explain why and offer realistic alternatives. Never promise results you cannot deliver.</p>`,
        },
        {
          slug: 'barber-lesson-13',
          title: 'Shampoo & Scalp Massage',
          order: 6,
          domainKey: 'hair_science',
          objective: 'Perform a professional shampoo service and scalp massage.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Shampoo Service</h2>
<h3>Selecting the Right Shampoo</h3>
<ul>
<li>Normal hair — balanced pH shampoo</li>
<li>Oily scalp — clarifying shampoo</li>
<li>Dry or damaged hair — moisturizing shampoo</li>
<li>Color-treated hair — sulfate-free shampoo</li>
</ul>
<h3>Shampoo Procedure</h3>
<ol>
<li>Drape client with towel and cape</li>
<li>Adjust water temperature — test on your wrist first</li>
<li>Wet hair thoroughly</li>
<li>Apply shampoo and work into a lather</li>
<li>Massage scalp using rotary movements with fingertips (not nails)</li>
<li>Rinse thoroughly — no residue</li>
<li>Apply conditioner if needed, rinse</li>
<li>Towel dry gently</li>
</ol>`,
        },
        {
          slug: 'barber-module-2-checkpoint',
          title: 'Hair Science Checkpoint',
          order: 7,
          domainKey: 'hair_science',
          objective: 'Demonstrate mastery of hair science and scalp analysis.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 2 Review — Hair Science & Scalp Analysis</h2><p>Review before taking this checkpoint: hair shaft layers (cuticle, cortex, medulla), the three growth phases (anagen, catagen, telogen), hair texture/density/porosity, common scalp conditions and contraindications, client consultation, and shampoo procedure. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'hs-q1',
              question: 'Which layer of the hair shaft contains melanin and determines hair color?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
              correctAnswer: 1,
              explanation: 'The cortex contains melanin granules that give hair its color.',
            },
            {
              id: 'hs-q2',
              question: 'During which phase of the hair growth cycle is hair actively growing?',
              options: ['Telogen', 'Catagen', 'Anagen', 'Exogen'],
              correctAnswer: 2,
              explanation: 'Anagen is the active growth phase, lasting 2-7 years.',
            },
            {
              id: 'hs-q3',
              question: 'A client has tinea capitis. What should you do?',
              options: [
                'Proceed with extra sanitation precautions',
                'Perform a dry cut only',
                'Decline service and refer to a physician',
                'Use medicated shampoo and proceed',
              ],
              correctAnswer: 2,
              explanation: 'Tinea capitis is a contagious fungal infection — no services should be performed.',
            },
            {
              id: 'hs-q4',
              question: 'Hair that absorbs moisture quickly but loses it fast has:',
              options: ['Low porosity', 'Normal porosity', 'High porosity', 'No porosity'],
              correctAnswer: 2,
              explanation: 'High porosity hair has a damaged cuticle that cannot retain moisture.',
            },
            {
              id: 'hs-q5',
              question: 'What is the correct water temperature check before shampooing a client?',
              options: ['Test on the back of your hand', 'Test on your wrist', 'Ask the client to test it', 'Use cold water always'],
              correctAnswer: 1,
              explanation: 'Testing on your wrist gives a more accurate temperature reading than the hand.',
            },
            {
              id: 'hs-q6',
              question: 'Approximately how much hair does a person normally shed per day?',
              options: ['5-10 hairs', '50-100 hairs', '200-300 hairs', '500+ hairs'],
              correctAnswer: 1,
              explanation: 'Losing 50-100 hairs per day is normal as part of the telogen phase.',
            },
          ],
        },
      ],
    },

    // ── Module 3 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-3',
      title: 'Module 3: Tools, Equipment & Ergonomics',
      orderIndex: 3,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'tools_equipment',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'clipper_operation',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'scissor_technique',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'razor_safety',        isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'tool_maintenance',    isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-15',
          title: 'Clippers & Trimmers — Types and Guards',
          order: 1,
          domainKey: 'tools_equipment',
          objective: 'Identify clipper types, guard sizes, and their uses.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Clippers and Trimmers</h2>
<h3>Types of Clippers</h3>
<ul>
<li><strong>Corded clippers</strong> — consistent power, best for heavy-duty cutting</li>
<li><strong>Cordless clippers</strong> — freedom of movement, requires charging</li>
<li><strong>Detachable blade clippers</strong> — blades swap out for different lengths</li>
</ul>
<h3>Guard Sizes</h3>
<p>Guards (also called attachments) control cutting length:</p>
<ul>
<li>#0 (no guard) — closest cut, skin fade</li>
<li>#1 — 1/8 inch</li>
<li>#2 — 1/4 inch</li>
<li>#3 — 3/8 inch</li>
<li>#4 — 1/2 inch</li>
<li>#7 and #8 — longer lengths for bulk removal</li>
</ul>
<h3>Trimmers</h3>
<p>Trimmers (T-liners) are used for edging, lining, and detail work. They have a narrower blade than clippers.</p>`,
        },
        {
          slug: 'barber-lesson-16',
          title: 'Scissors & Shears',
          order: 2,
          domainKey: 'tools_equipment',
          objective: 'Select and use the correct scissors for different cutting techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Scissors and Shears</h2>
<h3>Types of Shears</h3>
<ul>
<li><strong>Straight shears</strong> — standard cutting, 5.5–7 inches, most common</li>
<li><strong>Thinning shears</strong> — one serrated blade; removes bulk without changing length</li>
<li><strong>Texturizing shears</strong> — both blades serrated; adds texture and movement</li>
<li><strong>Curved shears</strong> — for curved cuts and blending</li>
</ul>
<h3>Proper Grip</h3>
<p>Thumb in the thumb ring, ring finger in the finger ring. Keep the pinky on the finger rest. Move only the thumb — the bottom blade stays still.</p>
<h3>Shear Maintenance</h3>
<ul>
<li>Oil the pivot screw daily</li>
<li>Have shears professionally sharpened every 3–6 months</li>
<li>Never drop shears — misaligns the blades</li>
<li>Store in a protective case</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-17',
          title: 'Straight Razor & Safety Razor',
          order: 3,
          domainKey: 'tools_equipment',
          objective: 'Safely handle, use, and maintain straight and safety razors.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Razors in Barbering</h2>
<h3>Straight Razor (Cut-Throat Razor)</h3>
<p>The traditional barber's razor. Requires skill and practice. Used for shaving, edging, and razor cutting techniques.</p>
<ul>
<li>Must be stropped before each use to align the blade edge</li>
<li>Honed periodically to restore sharpness</li>
<li>Never used on a client with skin infections or open wounds</li>
</ul>
<h3>Shavette (Disposable Blade Straight Razor)</h3>
<p>Uses replaceable blades — the professional standard for sanitation. Each blade is used once and disposed of in a sharps container.</p>
<h3>Safety Razor</h3>
<p>Double-edge safety razor with a guard bar. Less aggressive than a straight razor. Good for beginners learning shaving technique.</p>
<h3>Razor Safety Rules</h3>
<ul>
<li>Always cut with the grain on the first pass</li>
<li>Keep the skin taut with your free hand</li>
<li>Never leave a razor open and unattended</li>
<li>Dispose of blades immediately after use</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-18',
          title: 'Clipper Maintenance & Blade Care',
          order: 4,
          domainKey: 'tools_equipment',
          objective: 'Perform routine clipper maintenance to extend tool life and ensure performance.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Clipper Maintenance</h2>
<h3>Daily Maintenance</h3>
<ol>
<li>Brush hair from blades after every client</li>
<li>Apply 2–3 drops of clipper oil to the blade while running</li>
<li>Wipe excess oil with a clean cloth</li>
<li>Spray blades with disinfectant spray between clients</li>
</ol>
<h3>Blade Alignment</h3>
<p>If clippers are pulling or cutting unevenly, the blades may need alignment. The top blade should sit slightly behind the bottom blade — never extend past it.</p>
<h3>Blade Sharpening</h3>
<p>Dull blades pull hair instead of cutting cleanly. Have blades professionally sharpened or replaced every 3–6 months depending on use.</p>
<h3>Motor Care</h3>
<p>Never submerge clippers in liquid. Keep vents clear of hair buildup. Store in a dry location.</p>`,
        },
        {
          slug: 'barber-lesson-19',
          title: 'Ergonomics & Body Mechanics',
          order: 5,
          domainKey: 'tools_equipment',
          objective: 'Apply ergonomic principles to prevent injury during barbering services.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Ergonomics for Barbers</h2>
<p>Barbering is physically demanding. Poor posture and repetitive motion cause chronic injuries that end careers.</p>
<h3>Posture</h3>
<ul>
<li>Stand with feet shoulder-width apart</li>
<li>Keep your back straight — do not hunch over the client</li>
<li>Adjust the chair height so you work at elbow level</li>
<li>Shift weight between feet — do not lock your knees</li>
</ul>
<h3>Wrist and Hand Health</h3>
<ul>
<li>Keep wrists in a neutral position when cutting</li>
<li>Do not grip tools too tightly</li>
<li>Stretch hands and wrists between clients</li>
<li>Carpal tunnel syndrome is common in barbers — address early symptoms immediately</li>
</ul>
<h3>Breaks</h3>
<p>Take a 5-minute break every 2 hours. Sit down, stretch, and rest your hands.</p>`,
        },
        {
          slug: 'barber-lesson-20',
          title: 'Draping & Client Preparation',
          order: 6,
          domainKey: 'tools_equipment',
          objective: 'Properly drape a client for haircut and shaving services.',
          durationMinutes: 10,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Draping the Client</h2>
<h3>Haircut Draping</h3>
<ol>
<li>Place a clean neck strip around the client's neck</li>
<li>Drape the cutting cape over the client</li>
<li>Secure the cape — snug but not tight</li>
<li>Tuck the neck strip over the cape collar to prevent hair from falling inside</li>
</ol>
<h3>Shave Draping</h3>
<ol>
<li>Recline the chair to a comfortable shaving position</li>
<li>Place a clean towel across the client's chest</li>
<li>Tuck a neck strip or towel around the collar</li>
</ol>
<h3>Why Draping Matters</h3>
<p>Proper draping protects the client's clothing, prevents hair from irritating the skin, and presents a professional image.</p>`,
        },
        {
          slug: 'barber-module-3-checkpoint',
          title: 'Tools & Equipment Checkpoint',
          order: 7,
          domainKey: 'tools_equipment',
          objective: 'Demonstrate mastery of barbering tools and equipment.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 3 Review — Tools, Equipment & Ergonomics</h2><p>Review before taking this checkpoint: clipper types and guard sizes, shear types and proper grip, straight razor vs. shavette safety, clipper maintenance, ergonomic posture, and proper client draping. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'te-q1',
              question: 'Which guard size produces the closest cut without going bare skin?',
              options: ['#4', '#2', '#1', '#0'],
              correctAnswer: 2,
              explanation: '#1 is 1/8 inch — the shortest guard. #0 removes the guard entirely for a skin fade.',
            },
            {
              id: 'te-q2',
              question: 'What type of shears removes bulk without changing the overall length?',
              options: ['Straight shears', 'Thinning shears', 'Curved shears', 'Razor shears'],
              correctAnswer: 1,
              explanation: 'Thinning shears have one serrated blade that removes bulk while leaving length.',
            },
            {
              id: 'te-q3',
              question: 'After using a shavette blade on a client, you should:',
              options: [
                'Rinse and reuse on the next client',
                'Soak in disinfectant and reuse',
                'Dispose in a sharps container immediately',
                'Store for later use',
              ],
              correctAnswer: 2,
              explanation: 'Shavette blades are single-use and must be disposed of in a sharps container.',
            },
            {
              id: 'te-q4',
              question: 'How many drops of oil should you apply to clipper blades during maintenance?',
              options: ['10-15 drops', '5-8 drops', '2-3 drops', 'Soak the blades'],
              correctAnswer: 2,
              explanation: '2-3 drops while the clipper is running is sufficient — excess oil attracts debris.',
            },
            {
              id: 'te-q5',
              question: 'What is the correct chair height for ergonomic barbering?',
              options: [
                'As low as possible',
                'So you work at elbow level',
                'So the client is at eye level',
                'As high as possible',
              ],
              correctAnswer: 1,
              explanation: 'Working at elbow level keeps your back straight and prevents hunching.',
            },
            {
              id: 'te-q6',
              question: 'What is placed around the client\'s neck before the cutting cape?',
              options: ['A towel', 'A neck strip', 'A paper collar', 'Nothing'],
              correctAnswer: 1,
              explanation: 'A neck strip prevents the cape from directly touching the client\'s skin.',
            },
          ],
        },
      ],
    },

    // ── Module 4 ─────────────────────────────────────────────────────────────

    {
      slug: 'barber-module-4',
      title: 'Module 4: Haircutting Techniques',
      orderIndex: 4,
      minLessons: 8,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'haircutting',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'fade_technique',      isCritical: true,  minimumTouchpoints: 3 },
        { competencyKey: 'clipper_over_comb',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'scissor_over_comb',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'lineup_edging',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'head_shape_analysis', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-22',
          title: 'Head Shape & Sectioning',
          order: 1,
          domainKey: 'haircutting',
          objective: 'Identify the sections of the head and use them to guide haircut structure.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Head Shape and Sectioning</h2>
<h3>Sections of the Head</h3>
<ul>
<li><strong>Top</strong> — crown to front hairline</li>
<li><strong>Sides</strong> — temples to behind the ears</li>
<li><strong>Back</strong> — occipital bone to nape</li>
<li><strong>Nape</strong> — hairline at the back of the neck</li>
</ul>
<h3>Reference Points</h3>
<ul>
<li><strong>Occipital bone</strong> — the bony protrusion at the back of the skull; key reference for fade lines</li>
<li><strong>Parietal ridge</strong> — widest part of the head; determines where the fade transitions</li>
<li><strong>Temporal recession</strong> — natural recession at the temples</li>
</ul>
<h3>Why Sectioning Matters</h3>
<p>Consistent sectioning ensures even weight distribution and a balanced haircut. Always establish your guide line before cutting.</p>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service. These are non-negotiable under NIC and state board standards.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant. This lesson uses combs and sectioning clips; apply EPA-registered disinfectant and maintain full contact time per label.</li>
<li>Apply EPA-registered disinfectant and maintain full contact time per label (typically 10 minutes). Do not wipe off early.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts, abrasions, or broken skin on the scalp</li>
<li>Signs of scalp infection, rash, or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Tool malfunction</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect any blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Identifies all head sections and reference points correctly',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-23',
          title: 'The Fade — Low, Mid & High',
          order: 2,
          domainKey: 'haircutting',
          objective: 'Execute low, mid, and high fade techniques with smooth transitions.',
          durationMinutes: 30,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>The Fade</h2>
<p>The fade is the signature technique of modern barbering — a seamless gradient from short to shorter, ending at the skin or near-skin.</p>
<h3>Types of Fades</h3>
<ul>
<li><strong>Low fade</strong> — starts just above the ear and nape; conservative, professional</li>
<li><strong>Mid fade</strong> — starts at the temple; versatile, most requested</li>
<li><strong>High fade</strong> — starts at the parietal ridge; bold, dramatic</li>
<li><strong>Skin fade (bald fade)</strong> — goes to bare skin; requires a #0 or foil shaver</li>
</ul>
<h3>Fade Technique</h3>
<ol>
<li>Establish the fade line with a #1 or #2</li>
<li>Work upward with progressively larger guards</li>
<li>Use the open/close lever to blend between guard sizes</li>
<li>Blend with a #1.5 or by flicking the clipper out at the transition</li>
<li>Check for lines and blend until smooth</li>
</ol>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant. For clipper blades, use clipper disinfectant spray and keep blades visibly wet for full contact time per label.</li>
<li>Discard all single-use items after use. Do not reuse porous items.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Clipper malfunction or overheating</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes low, mid, and high fade with smooth transitions',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-24',
          title: 'Clipper Over Comb',
          order: 3,
          domainKey: 'haircutting',
          objective: 'Use the clipper-over-comb technique to cut and blend hair.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Clipper Over Comb</h2>
<p>Clipper over comb is used to cut hair that is too long for guards but needs clipper precision. It is essential for blending and tapering.</p>
<h3>Technique</h3>
<ol>
<li>Hold the comb flat against the head at the desired angle</li>
<li>Lift the comb slightly to expose the hair to be cut</li>
<li>Run the clipper along the top of the comb in a smooth, continuous motion</li>
<li>Work in sections, overlapping each pass slightly</li>
</ol>
<h3>Common Mistakes</h3>
<ul>
<li>Holding the comb too far from the head — creates uneven results</li>
<li>Moving too slowly — causes clipper lines</li>
<li>Not following the head's curve — creates flat spots</li>
</ul>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant. Use clipper disinfectant spray on blades and maintain full contact time per label.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Clipper overheating or malfunction</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes clipper-over-comb with consistent angle and smooth motion',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-25',
          title: 'Scissor Over Comb',
          order: 4,
          domainKey: 'haircutting',
          objective: 'Use scissor-over-comb to cut and blend the top and sides.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors.mp4',
          content: `<h2>Scissor Over Comb</h2>
<p>Scissor over comb produces a softer result than clipper over comb. It is used for the top, blending, and on clients who prefer a scissor finish.</p>
<h3>Technique</h3>
<ol>
<li>Comb hair upward or outward from the head</li>
<li>Position the comb at the desired length</li>
<li>Cut along the top of the comb with the shears</li>
<li>Work in consistent sections</li>
</ol>
<h3>Point Cutting</h3>
<p>Point cutting (cutting into the ends at an angle) removes weight and adds texture. Hold shears vertically and make small snips into the hair ends.</p>
<h3>Slide Cutting</h3>
<p>Slide cutting thins and tapers hair by sliding the open shears down the hair shaft. Used for blending and removing bulk.</p>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service. This lesson uses shears and combs — no clipper blades.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris from shears and combs before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant and maintain full contact time per label. Do not wipe off early.</li>
<li>Discard all single-use items after use. Do not reuse porous items.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort from shear contact</li>
<li>Shear malfunction or blade damage</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes scissor-over-comb with consistent angle and soft finish',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
            'Disinfects shears and combs with EPA-registered disinfectant before service',
          ],
        },
        {
          slug: 'barber-lesson-26',
          title: 'Lineup & Edging',
          order: 5,
          domainKey: 'haircutting',
          objective: 'Create clean, sharp lines at the hairline, temples, around the ears, sideburns, and nape while preserving the natural hairline, protecting the skin, maintaining sanitation, and choosing shapes that suit the client and grow out cleanly.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-lineup-narrated.mp4',
          content: `<h2>Lesson 26: Lineup &amp; Edging</h2>

<h3>Why this skill matters</h3>
<p>A lineup is a <strong>finishing service</strong>, not a haircut correction tool. Its job is to make the haircut look clean and intentional by sharpening the <strong>front hairline, temples, sideburn edges, around the ears, and nape</strong>. Good edging makes the haircut look polished. Bad edging removes too much hair, creates uneven corners, irritates skin, and can permanently push the hairline back over time.</p>
<p>The barber's rule is simple: <strong>define what is already there; do not invent a new hairline unless the service plan clearly calls for it and the client understands the maintenance.</strong></p>

<h3>Tools and setup</h3>
<p>Use only clean, disinfected tools and a stable setup.</p>
<h4>Required tools</h4>
<ul>
<li>T-liner, outliner, or detailer trimmer</li>
<li>Straight razor or shavette, if appropriate</li>
<li>Barber comb</li>
<li>Hand mirror</li>
<li>Neck strip and cape</li>
<li>Towels or disposable wipes</li>
<li>Shaving gel or lather</li>
<li>Antiseptic or astringent as allowed by shop policy</li>
<li>EPA-registered disinfectant</li>
<li>Gloves if required by service condition or shop policy</li>
</ul>
<h4>Pre-service preparation</h4>
<ol>
<li>Wash or sanitize hands before service.</li>
<li>Clean and disinfect all tools with an EPA-registered disinfectant.</li>
<li>Prepare a clean workstation to avoid cross-contamination.</li>
<li>Drape the client with a neck strip and cape so the cape does not touch bare skin.</li>
<li>Seat the client upright with the head in a natural position so the line is not created on a tilted angle.</li>
<li>Inspect lighting and mirror position before beginning.</li>
</ol>

<h3>Client consultation</h3>
<ul>
<li>Ask whether the client wants a natural lineup or a sharper, more defined finish.</li>
<li>Confirm temple shape, sideburn shape, and nape preference: tapered, rounded, or square.</li>
<li>Ask about recent irritation, razor sensitivity, acne breakout, ingrown hairs, or cuts.</li>
<li>Explain that razor detailing will not be performed on broken or irritated skin.</li>
<li>Confirm that the goal is a clean edge without pushing the hairline back.</li>
</ul>

<h3>Contraindications and razor safety</h3>
<p>Do <strong>not</strong> use a razor over:</p>
<ul>
<li>Cuts, abrasions, or open skin</li>
<li>Active acne</li>
<li>Inflamed bumps</li>
<li>Rash or infection</li>
<li>Skin that is already irritated</li>
<li>Areas prone to keloid scarring if razor use may trigger trauma</li>
</ul>
<p>Use extra caution or modify the service on clients with razor bumps, ingrown hairs, or highly irritated skin.</p>
<p>If the skin condition makes edging unsafe, stop and refer to the instructor or follow shop procedure.</p>
<p><strong>Non-negotiable rule:</strong> trimmer defines first, razor refines second. Never use the razor to guess the shape.</p>

<h3>Service order</h3>
<p>Front hairline → temples → around ears → sideburns → nape → symmetry check → razor detailing if appropriate</p>

<h3>Procedure</h3>
<ol>
<li><strong>Establish the front hairline</strong>
<ul>
<li>Stand directly in front of the client.</li>
<li>Identify the natural front hairline before cutting.</li>
<li>Start at the center and work outward to keep both sides balanced.</li>
<li>Use the trimmer with light pressure and short, controlled motions.</li>
<li>Remove only the overgrowth outside the line. Do not push the line back.</li>
</ul>
</li>
<li><strong>Refine the front edge</strong>
<ul>
<li>Use small anchor strokes instead of one long pass.</li>
<li>Keep the blade steady and let the corners of the trimmer help create detail.</li>
<li>Check the line from the front and slightly above eye level to catch uneven corners.</li>
</ul>
</li>
<li><strong>Shape the temples</strong>
<ul>
<li>Decide whether the temple should be squared or softly tapered based on the haircut, growth pattern, and client preference.</li>
<li>Follow the natural temple area instead of cutting above it.</li>
<li>Match both sides by checking height, width, and angle before deepening the line.</li>
</ul>
</li>
<li><strong>Outline around the ears</strong>
<ul>
<li>Fold the ear gently only as needed for visibility and safety.</li>
<li>Use the trimmer in short controlled movements around the ear curve.</li>
<li>Keep the outline clean without cutting into the skin.</li>
</ul>
</li>
<li><strong>Balance the sideburns</strong>
<ul>
<li>Comb the sideburn area down.</li>
<li>Check both sideburns from the front, not only from the side.</li>
<li>Match length, width, and bottom line before finalizing.</li>
</ul>
</li>
<li><strong>Create the nape outline</strong>
<ul>
<li>Ask whether the client wants a tapered, rounded, or square nape.</li>
<li>Use the trimmer to outline the chosen shape.</li>
<li>Keep the nape centered and symmetrical with the spine and head position.</li>
</ul>
</li>
<li><strong>Check symmetry before detailing</strong>
<ul>
<li>Step back and inspect the entire outline.</li>
<li>Use the mirror to compare both sides.</li>
<li>Correct only the area that is uneven. Do not keep cutting both sides higher trying to chase perfection.</li>
</ul>
</li>
<li><strong>Razor detailing if the skin is healthy</strong>
<ul>
<li>Apply lather or shaving gel if used in your service procedure.</li>
<li>Stretch the skin firmly before using the razor.</li>
<li>Hold the razor at a low angle with light pressure.</li>
<li>Use short, controlled strokes to sharpen the edge.</li>
<li>Wipe the blade safely as required by shop procedure.</li>
<li>Do not go over broken, raised, or irritated skin.</li>
</ul>
</li>
</ol>

<h3>Safety &amp; Infection Control</h3>
<p>Follow this sequence in order. NIC practical exams test sequence, not just knowledge.</p>
<h4>Before service</h4>
<ol>
<li>Wash or sanitize hands before touching tools or the client.</li>
<li><strong>Pre-clean all tools</strong> — remove all hair and debris before applying disinfectant. Debris blocks disinfectant effectiveness and makes the step invalid.</li>
<li>Apply EPA-registered disinfectant and allow full contact time per the product label — typically 10 minutes for full disinfection. Do not wipe off early.</li>
<li>For clipper and trimmer blades: use a clipper disinfectant spray and keep blades visibly wet for the full required contact time.</li>
</ol>
<h4>During service</h4>
<ul>
<li>Use only clean implements on the client.</li>
<li>Avoid cross-contamination by keeping soiled items separate from disinfected tools.</li>
<li>Do not perform razor work on irritated or broken skin.</li>
<li>Maintain proper draping and client protection throughout the service.</li>
<li><strong>Single-use items</strong> (razor blades, neck strips, disposable wipes) must be discarded immediately after use. Do not reuse.</li>
<li><strong>Porous items</strong> (wooden sticks, foam, emery boards) cannot be disinfected — treat as single-use and discard.</li>
</ul>
<h4>After service</h4>
<ol>
<li>Pre-clean tools again — remove debris.</li>
<li>Apply disinfectant and allow full contact time before storing.</li>
<li>Disinfect workstation surfaces and chair between every client.</li>
<li>Dispose of all single-use materials properly.</li>
<li>Replace disinfectant solution if it is visibly cloudy or dirty. Change at minimum every 24 hours.</li>
</ol>

<h3>Correct vs. Incorrect Lineup Logic</h3>
<h4>Correct</h4>
<ul>
<li>Follows the natural hairline</li>
<li>Looks even from the front</li>
<li>Matches the haircut design</li>
<li>Keeps temple height appropriate</li>
<li>Preserves density at weak corners</li>
<li>Sharpens without irritating the skin</li>
</ul>
<h4>Incorrect</h4>
<ul>
<li>Pushed back to make it look "extra clean"</li>
<li>One temple cut higher than the other</li>
<li>Jagged line from long uncontrolled strokes</li>
<li>Sideburns different in length or width</li>
<li>Nape off-center</li>
<li>Razor used over broken or inflamed skin</li>
</ul>

<h3>Hair type and growth-pattern decision rules</h3>
<h4>IF the client has coarse or curly hair</h4>
<p>Use a lighter touch and take less hair per pass. Follow the natural edge more closely. Avoid over-defining the front line. Expect the line to appear strong with less cutting. <em>Why: coarse or curly hair creates visual density fast. Too much pressure or carving makes the line look harsh and unnatural.</em></p>
<h4>IF the client has fine or straight hair</h4>
<p>Use extra caution because mistakes show immediately. Keep corners soft unless the haircut design clearly supports a harder edge. Do not widen the line trying to make it look darker. <em>Why: fine hair gives less visual forgiveness. Once pushed back, the edge can look thin and weak.</em></p>
<h4>IF the client has a receding hairline</h4>
<p>Do not force a low straight line across recessed corners. Clean the natural outline and preserve what exists. Explain that a conservative line will look better and grow out cleaner.</p>
<h4>IF the hairline is naturally uneven</h4>
<p>Improve the appearance without overcutting both sides. Remove obvious strays first. Decide what difference is natural and acceptable before cutting. Symmetry means <strong>balanced appearance</strong>, not always identical biology.</p>
<h4>IF there are cowlicks at the temple or nape</h4>
<p>Follow the growth pattern. Use smaller strokes. Avoid making the area shorter just to overpower the growth.</p>
<h4>IF the skin is sensitive</h4>
<p>Limit razor passes. Use gentle tension and clean strokes. Stop if redness or irritation develops.</p>

<h3>Razor refinement</h3>
<p>Only refine after the trimmer shape is correct.</p>
<ol>
<li>Apply appropriate prep according to shop protocol.</li>
<li>Stretch the skin firmly.</li>
<li>Use short, controlled razor strokes.</li>
<li>Shave only the hair outside the established trimmer line.</li>
<li>Wipe and inspect the skin often.</li>
<li>Stop immediately if irritation appears.</li>
</ol>
<p>The razor is a refinement tool, not the primary design tool.</p>

<h3>Common Failure Modes and Corrections</h3>
<h4>Crooked front line</h4>
<p><strong>Cause:</strong> started from one side instead of establishing the center.<br/><strong>Correction:</strong> recheck the center point, compare both corners, and make only minimal balancing adjustments.</p>
<h4>Temple cut too high</h4>
<p><strong>Cause:</strong> chasing sharpness instead of respecting the natural temple.<br/><strong>Correction:</strong> stop raising the opposite side; preserve what remains and let the area grow back rather than compounding the error.</p>
<h4>Jagged edge</h4>
<p><strong>Cause:</strong> heavy pressure or fast dragging motion.<br/><strong>Correction:</strong> use shorter anchor strokes with lighter pressure.</p>
<h4>Uneven sideburns</h4>
<p><strong>Cause:</strong> checked from side view only.<br/><strong>Correction:</strong> face the client head-on and compare both bottom lines visually.</p>
<h4>Razor irritation or razor burn</h4>
<p><strong>Cause:</strong> too many passes, poor skin tension, or working over compromised skin.<br/><strong>Correction:</strong> reduce passes, improve tension, and skip razor work where the skin is unsafe.</p>

<h3>Sanitation and compliance</h3>
<ul>
<li>Clean and disinfect tools before service</li>
<li>Remove cut hair from tools as needed during service</li>
<li>Avoid cross-contaminating zones if skin becomes irritated</li>
<li>Replace blades according to shop and safety protocol</li>
<li>Dispose of single-use razor blades correctly</li>
<li>Maintain clean draping and workstation control</li>
</ul>
<p>For state board readiness: proper draping, clean and disinfected implements, safe handling of sharp tools, protection of the client's skin, sanitary disposal of waste.</p>

<h3>Quick service checklist</h3>
<ul>
<li>Front line is balanced</li>
<li>Temple points are intentional</li>
<li>Around-ear edge is clean</li>
<li>Sideburns match from the front</li>
<li>Nape matches requested shape</li>
<li>No zone has been pushed back unnecessarily</li>
<li>Skin is clean and not overworked</li>
<li>Client has seen the result in the mirror</li>
</ul>

<h3>Summary</h3>
<p>Lineup and edging require restraint, not aggression. Use the trimmer to establish shape, skin tension to protect precision, and the razor only when appropriate. Preserve the natural hairline whenever possible, adapt to hair type and growth pattern, and check symmetry from the client's front view before calling the service complete.</p>

<h3>Result</h3>
<ul>
<li>Hairline is clean, even, and appropriate for the client.</li>
<li>Temples, sideburns, and nape are balanced and symmetrical.</li>
<li>The finish is sharp without obvious pushback of the natural line.</li>
<li>The skin remains free from cuts, razor burn, and unnecessary irritation.</li>
</ul>

<h3>Advanced barber insight</h3>
<p>A lineup should look intentional on day one and still grow out cleanly. A sharp line is not automatically a good line. The best lineup respects the client's natural growth pattern, face shape, density, and weak points in the hairline.</p>

<h3>Technique notes</h3>
<ul>
<li>Anchor strokes create better control than a single sweeping pass.</li>
<li>Skin tension is mandatory for razor detailing and helpful for cleaner trimmer work in loose skin areas.</li>
<li>The corners of the trimmer are for detail; the full blade is for longer straight segments.</li>
<li>Always judge the line with the client's head in a natural upright position.</li>
</ul>

<h3>Post-service procedure</h3>
<ol>
<li>Remove loose hair from the neck, face, and cape.</li>
<li>Apply soothing product if appropriate and allowed by service protocol.</li>
<li>Dispose of single-use items properly.</li>
<li>Clean and disinfect tools and workstation.</li>
<li>Reset the station for the next client.</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l26-q1',
              question: 'A client has slight recession in both front corners and asks for a perfectly straight, boxed hairline. What is the best professional response?',
              options: [
                'Cut a straight line higher to create a stronger look',
                'Follow the natural hairline and create the sharpest realistic shape without pushing the corners back',
                'Ignore the recession and cut both corners square at any cost',
                'Refuse to line the front hairline at all',
              ],
              correctAnswer: 1,
              explanation: 'A professional lineup improves neatness without creating an artificial line that removes too much natural hair or grows out poorly.',
            },
            {
              id: 'l26-q2',
              question: 'What is the safest reason to stretch the skin before razor detailing?',
              options: [
                'It makes the haircut take less time',
                'It helps the razor glide on a flatter surface and reduces the risk of cuts',
                'It removes more hair with each pass',
                'It darkens the lineup visually',
              ],
              correctAnswer: 1,
              explanation: 'Skin tension creates a flatter working surface so the razor moves more safely and precisely.',
            },
            {
              id: 'l26-q3',
              question: 'While detailing the temples, you notice one temple naturally sits slightly higher. What should you do?',
              options: [
                'Cut the lower temple higher to force both sides to match exactly',
                'Ignore both temples and focus only on the nape',
                'Respect the natural pattern and improve visual balance without unnecessarily raising either side',
                'Round both temples to hide the difference',
              ],
              correctAnswer: 2,
              explanation: 'The goal is visual balance, not destruction of the natural hairline. Chasing exact sameness often makes the result worse.',
            },
            {
              id: 'l26-q4',
              question: 'A student creates a jagged front line with the trimmer. What is the most likely cause?',
              options: [
                'Using short controlled anchor strokes',
                'Holding the head upright',
                'Using heavy pressure or dragging the trimmer in one uncontrolled pass',
                'Checking the line in the mirror',
              ],
              correctAnswer: 2,
              explanation: 'Jagged edges usually come from poor control, excessive pressure, or trying to create the line in one long pass.',
            },
            {
              id: 'l26-q5',
              question: 'After finishing the lineup, what should happen before the client leaves?',
              options: [
                'Only brush the client off and move to the next service',
                'Remove loose hair, apply product if appropriate, then clean and disinfect tools and workstation',
                'Leave used tools aside until the end of the day',
                'Have the client inspect the cut while the station remains soiled',
              ],
              correctAnswer: 1,
              explanation: 'State board standards require proper client cleanup plus cleaning and disinfection of tools and the workstation after service.',
            },
          ],
          instructorNotes: [
            'Demonstrate front-view checking, not mirror-only side checking.',
            'Emphasize that razor use is optional and contraindication-dependent.',
            'Correct students who try to create a new hairline instead of cleaning the existing one.',
            'Require named skin tension and short anchor strokes during practical evaluation.',
          ],
          competencyChecks: [
            'Demonstrates proper hand sanitation, draping, and workstation preparation',
            'Identifies contraindications before service',
            'Maintains skin tension during edging',
            'Preserves natural hairline unless redesign is intentionally planned',
            'Uses short controlled strokes instead of one long sweep',
            'Checks symmetry from the front view',
            'Selects correct nape shape based on client preference',
            'Avoids razor use on contraindicated skin',
            'Completes post-service cleanup and disinfection properly',
          ],
        },
        {
          slug: 'barber-lesson-27',
          title: 'Flat Top & Classic Cuts',
          order: 6,
          domainKey: 'haircutting',
          objective: 'Execute a flat top and classic taper haircut.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Classic Barbering Cuts</h2>
<h3>The Flat Top</h3>
<p>The flat top requires a perfectly level surface on top of the head. It is one of the most technically demanding cuts in barbering.</p>
<ol>
<li>Establish the height on top with a pick and clipper</li>
<li>Use a level comb or flat top comb to guide the cut</li>
<li>Work from front to back, maintaining a flat plane</li>
<li>Fade or taper the sides</li>
</ol>
<h3>The Classic Taper</h3>
<p>The taper is the foundation of barbering. Hair gradually decreases in length from top to nape.</p>
<ul>
<li>Start with the longest guard on top</li>
<li>Work down with progressively shorter guards</li>
<li>Blend each transition smoothly</li>
<li>Finish with a clean lineup</li>
</ul>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant. Use clipper disinfectant spray on blades and maintain full contact time per label.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Tool malfunction or overheating</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes flat top with level, even surface across the top',
            'Executes classic taper with smooth transitions from top to nape',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-module-4-checkpoint',
          title: 'Haircutting Checkpoint',
          order: 7,
          domainKey: 'haircutting',
          objective: 'Demonstrate mastery of haircutting techniques.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 4 Review — Haircutting Techniques</h2><p>Review before taking this checkpoint: head sections and reference points, low/mid/high fade technique, clipper over comb, scissor over comb, lineup and edging, and classic cuts. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'hc-q1',
              question: 'A mid fade starts at which reference point?',
              options: ['The nape', 'The occipital bone', 'The temple', 'The parietal ridge'],
              correctAnswer: 2,
              explanation: 'A mid fade starts at the temple area, between the low and high fade.',
            },
            {
              id: 'hc-q2',
              question: 'Which technique produces a softer result than clipper over comb?',
              options: ['Skin fade', 'Scissor over comb', 'Razor cutting', 'Clipper flicking'],
              correctAnswer: 1,
              explanation: 'Scissor over comb produces a softer, more natural finish than clipper over comb.',
            },
            {
              id: 'hc-q3',
              question: 'What is the parietal ridge?',
              options: [
                'The hairline at the nape',
                'The bony protrusion at the back of the skull',
                'The widest part of the head',
                'The front hairline',
              ],
              correctAnswer: 2,
              explanation: 'The parietal ridge is the widest part of the head and a key reference for high fades.',
            },
            {
              id: 'hc-q4',
              question: 'Point cutting is used to:',
              options: [
                'Create a blunt, heavy line',
                'Remove weight and add texture',
                'Create a skin fade',
                'Establish the guide line',
              ],
              correctAnswer: 1,
              explanation: 'Point cutting removes weight from the ends and adds texture and movement.',
            },
            {
              id: 'hc-q5',
              question: 'When performing a lineup, you should never:',
              options: [
                'Use a razor',
                'Cut above the natural temple hairline',
                'Square the nape',
                'Use a trimmer',
              ],
              correctAnswer: 1,
              explanation: 'Cutting above the natural temple hairline creates an unnatural appearance.',
            },
            {
              id: 'hc-q6',
              question: 'The flat top is considered technically demanding because it requires:',
              options: [
                'The most guards',
                'A perfectly level surface on top',
                'The longest cutting time',
                'Special clippers',
              ],
              correctAnswer: 1,
              explanation: 'Maintaining a perfectly flat, level plane on top of the head requires precision and skill.',
            },
          ],
        },
      ],
    },

    // ── Module 5 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-5',
      title: 'Module 5: Shaving & Beard Services',
      orderIndex: 5,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'shaving',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'shave_preparation',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'razor_technique',    isCritical: true,  minimumTouchpoints: 3 },
        { competencyKey: 'beard_design',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'skin_care',          isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-29',
          title: 'Shave Preparation & Hot Towel Service',
          order: 1,
          domainKey: 'shaving',
          objective: 'Prepare the skin for a professional shave using hot towel and pre-shave products.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Shave Preparation</h2>
<h3>Why Preparation Matters</h3>
<p>Proper preparation softens the beard, opens the pores, and reduces razor drag — preventing irritation and ingrown hairs.</p>
<h3>Hot Towel Application</h3>
<ol>
<li>Soak a clean towel in hot water (test temperature on your wrist)</li>
<li>Wring out excess water</li>
<li>Apply to the face for 2–3 minutes</li>
<li>Remove and apply pre-shave oil or cream</li>
</ol>
<h3>Pre-Shave Products</h3>
<ul>
<li><strong>Pre-shave oil</strong> — lubricates and protects the skin</li>
<li><strong>Shaving cream</strong> — creates a protective lather</li>
<li><strong>Shaving soap</strong> — traditional, requires a brush to lather</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-30',
          title: 'Straight Razor Shaving Technique',
          order: 2,
          domainKey: 'shaving',
          objective: 'Execute a professional straight razor shave with correct angle and stroke.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Straight Razor Shaving</h2>
<h3>Razor Angle</h3>
<p>Hold the razor at a 30-degree angle to the skin. Too steep causes cuts; too flat causes drag.</p>
<h3>The Three-Pass Shave</h3>
<ol>
<li><strong>First pass — with the grain (WTG)</strong>: Follow the direction of hair growth. Removes most of the beard.</li>
<li><strong>Second pass — across the grain (XTG)</strong>: Cut perpendicular to growth. Closer result.</li>
<li><strong>Third pass — against the grain (ATG)</strong>: Closest shave. Only for clients with no sensitivity.</li>
</ol>
<h3>Skin Stretching</h3>
<p>Use your free hand to keep the skin taut at all times. Loose skin causes nicks and uneven shaving.</p>
<h3>Stroke Technique</h3>
<p>Use short, controlled strokes. Rinse the blade after every 2–3 strokes. Never drag the razor.</p>`,
        },
        {
          slug: 'barber-lesson-31',
          title: 'Beard Design & Shaping',
          order: 3,
          domainKey: 'shaving',
          objective: 'Design and shape a beard to complement the client\'s face shape.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Beard Design</h2>
<h3>Face Shapes</h3>
<ul>
<li><strong>Oval</strong> — most beard styles work; maintain natural proportions</li>
<li><strong>Round</strong> — add length on the chin; keep sides tight</li>
<li><strong>Square</strong> — round the corners; fuller on the chin</li>
<li><strong>Oblong</strong> — keep sides full; minimize chin length</li>
</ul>
<h3>Beard Lines</h3>
<ul>
<li><strong>Cheek line</strong> — natural or defined; never too low</li>
<li><strong>Neckline</strong> — two finger-widths above the Adam's apple; the most common mistake is setting it too high</li>
<li><strong>Mustache line</strong> — follow the natural lip line</li>
</ul>
<h3>Trimming Technique</h3>
<ol>
<li>Comb beard downward to its natural fall</li>
<li>Trim to desired length with guards</li>
<li>Define lines with trimmer and razor</li>
<li>Apply beard oil to finish</li>
</ol>`,
        },
        {
          slug: 'barber-lesson-32',
          title: 'Post-Shave Care & Skin Treatment',
          order: 4,
          domainKey: 'shaving',
          objective: 'Apply correct post-shave products and handle common skin reactions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Post-Shave Care</h2>
<h3>Cold Towel</h3>
<p>Apply a cold towel after shaving to close the pores and soothe the skin. Leave on for 1–2 minutes.</p>
<h3>Post-Shave Products</h3>
<ul>
<li><strong>Alum block</strong> — stops minor bleeding from nicks; antiseptic</li>
<li><strong>Witch hazel</strong> — tones and soothes the skin</li>
<li><strong>Aftershave balm</strong> — moisturizes and calms irritation</li>
<li><strong>Aftershave splash</strong> — antiseptic; can sting on sensitive skin</li>
</ul>
<h3>Handling Nicks</h3>
<p>Apply an alum block or styptic pencil directly to the nick. Hold for 10–15 seconds. Never use a tissue — it leaves fibers in the wound.</p>
<h3>Razor Bumps (Pseudofolliculitis Barbae)</h3>
<p>Common in clients with curly hair. Caused by ingrown hairs. Recommend shaving with the grain only and using a single-blade razor.</p>`,
        },
        {
          slug: 'barber-lesson-33',
          title: 'Mustache Trimming & Styling',
          order: 5,
          domainKey: 'shaving',
          objective: 'Trim and style a mustache to complement the client\'s features.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard.mp4',
          content: `<h2>Mustache Services</h2>
<h3>Mustache Styles</h3>
<ul>
<li><strong>Natural</strong> — trimmed to follow the lip line</li>
<li><strong>Chevron</strong> — full, thick, trimmed straight across</li>
<li><strong>Handlebar</strong> — long ends styled upward with wax</li>
<li><strong>Pencil</strong> — thin line above the lip</li>
</ul>
<h3>Trimming Procedure</h3>
<ol>
<li>Comb mustache downward</li>
<li>Trim bulk with scissors or guards</li>
<li>Define the lip line with a trimmer</li>
<li>Clean up the philtrum (area between nose and lip)</li>
<li>Apply mustache wax if styling</li>
</ol>`,
        },
        {
          slug: 'barber-module-5-checkpoint',
          title: 'Shaving & Beard Checkpoint',
          order: 6,
          domainKey: 'shaving',
          objective: 'Demonstrate mastery of shaving and beard services.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 5 Review — Shaving & Beard Services</h2><p>Review before taking this checkpoint: hot towel preparation, straight razor angle and three-pass technique, beard design by face shape, neckline placement, post-shave care, and razor bump prevention. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'sh-q1',
              question: 'What angle should the straight razor be held at during shaving?',
              options: ['15 degrees', '30 degrees', '45 degrees', '60 degrees'],
              correctAnswer: 1,
              explanation: 'A 30-degree angle provides the optimal balance between closeness and safety.',
            },
            {
              id: 'sh-q2',
              question: 'Where should the neckline be set when shaping a beard?',
              options: [
                'At the jawline',
                'At the Adam\'s apple',
                'Two finger-widths above the Adam\'s apple',
                'At the chin',
              ],
              correctAnswer: 2,
              explanation: 'Two finger-widths above the Adam\'s apple is the standard neckline position.',
            },
            {
              id: 'sh-q3',
              question: 'What is the first pass in a three-pass shave?',
              options: ['Against the grain', 'Across the grain', 'With the grain', 'In circular motions'],
              correctAnswer: 2,
              explanation: 'The first pass always goes with the grain to remove bulk safely.',
            },
            {
              id: 'sh-q4',
              question: 'Which product stops minor bleeding from razor nicks?',
              options: ['Aftershave balm', 'Witch hazel', 'Alum block', 'Pre-shave oil'],
              correctAnswer: 2,
              explanation: 'An alum block is an antiseptic that constricts blood vessels to stop minor bleeding.',
            },
            {
              id: 'sh-q5',
              question: 'Razor bumps are most common in clients with:',
              options: ['Straight hair', 'Fine hair', 'Curly hair', 'Thick hair'],
              correctAnswer: 2,
              explanation: 'Curly hair is more likely to curl back into the skin, causing ingrown hairs and razor bumps.',
            },
            {
              id: 'sh-q6',
              question: 'How long should a hot towel be applied before shaving?',
              options: ['30 seconds', '2-3 minutes', '10 minutes', '15 minutes'],
              correctAnswer: 1,
              explanation: '2-3 minutes is sufficient to soften the beard and open the pores.',
            },
          ],
        },
      ],
    },

    // ── Module 6 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-6',
      title: 'Module 6: Chemical Services',
      orderIndex: 6,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'chemical_services',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_color_theory',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'relaxer_services',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'chemical_safety',    isCritical: true,  minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-35',
          title: 'Hair Color Theory',
          order: 1,
          domainKey: 'chemical_services',
          objective: 'Explain the color wheel and how it applies to hair color services.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Hair Color Theory</h2>
<h3>The Color Wheel</h3>
<p>Primary colors: red, yellow, blue. Secondary colors are made by mixing two primaries. Complementary colors cancel each other out — used to neutralize unwanted tones.</p>
<h3>Hair Color Levels</h3>
<p>Hair color is measured on a scale of 1 (black) to 10 (lightest blonde). Lifting hair requires removing existing pigment with developer.</p>
<h3>Types of Hair Color</h3>
<ul>
<li><strong>Temporary</strong> — coats the cuticle; washes out in 1-2 shampoos</li>
<li><strong>Semi-permanent</strong> — no developer; lasts 4-6 weeks</li>
<li><strong>Demi-permanent</strong> — low-volume developer; lasts 6-8 weeks</li>
<li><strong>Permanent</strong> — opens cuticle with developer; permanent change</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-36',
          title: 'Chemical Safety & Patch Testing',
          order: 2,
          domainKey: 'chemical_services',
          objective: 'Perform a patch test and identify chemical service contraindications.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Chemical Safety</h2>
<h3>Patch Test</h3>
<p>A patch test must be performed 24-48 hours before any chemical service. Apply a small amount of product behind the ear or inside the elbow. If redness, swelling, or itching occurs — do not proceed.</p>
<h3>PPE for Chemical Services</h3>
<ul>
<li>Nitrile gloves — always</li>
<li>Protective apron</li>
<li>Eye protection when mixing</li>
<li>Ensure adequate ventilation</li>
</ul>
<h3>Contraindications</h3>
<p>Do not perform chemical services on clients with: scalp abrasions, recent chemical services, known allergies to ingredients, or compromised scalp health.</p>`,
        },
        {
          slug: 'barber-lesson-37',
          title: 'Relaxers & Texturizers',
          order: 3,
          domainKey: 'chemical_services',
          objective: 'Understand relaxer chemistry and application safety.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Relaxers and Texturizers</h2>
<h3>How Relaxers Work</h3>
<p>Relaxers break the disulfide bonds in the cortex that give hair its curl pattern. The hair is then restructured in a straighter form.</p>
<h3>Types</h3>
<ul>
<li><strong>Lye relaxers (sodium hydroxide)</strong> — faster processing, stronger</li>
<li><strong>No-lye relaxers (guanidine)</strong> — gentler, less scalp irritation</li>
<li><strong>Texturizers</strong> — same chemistry, shorter processing time; loosens curl without fully straightening</li>
</ul>
<h3>Application Rules</h3>
<ul>
<li>Never apply to a scratched or irritated scalp</li>
<li>Base the scalp with petroleum jelly before application</li>
<li>Process only to the manufacturer's recommended time</li>
<li>Neutralize thoroughly — stops the chemical process</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-38',
          title: 'Scalp Treatments',
          order: 4,
          domainKey: 'chemical_services',
          objective: 'Select and apply appropriate scalp treatments for common conditions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Scalp Treatments</h2>
<h3>Types of Treatments</h3>
<ul>
<li><strong>Moisturizing treatment</strong> — for dry, flaky scalp</li>
<li><strong>Clarifying treatment</strong> — removes product buildup</li>
<li><strong>Anti-dandruff treatment</strong> — contains zinc pyrithione or selenium sulfide</li>
<li><strong>Stimulating treatment</strong> — increases circulation; contains menthol or peppermint</li>
</ul>
<h3>Application</h3>
<ol>
<li>Shampoo hair first</li>
<li>Apply treatment directly to scalp in sections</li>
<li>Massage in with fingertips</li>
<li>Process per manufacturer instructions</li>
<li>Rinse thoroughly</li>
</ol>`,
        },
        {
          slug: 'barber-module-6-checkpoint',
          title: 'Chemical Services Checkpoint',
          order: 5,
          domainKey: 'chemical_services',
          objective: 'Demonstrate mastery of chemical service knowledge.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 6 Review — Chemical Services</h2><p>Review before taking this checkpoint: color wheel and hair color levels, types of hair color, patch testing, chemical safety PPE, relaxer chemistry and application rules, and scalp treatments. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'cs-q1',
              question: 'How long before a chemical service should a patch test be performed?',
              options: ['1 hour', '6 hours', '24-48 hours', '1 week'],
              correctAnswer: 2,
              explanation: 'A patch test needs 24-48 hours to reveal any allergic reaction.',
            },
            {
              id: 'cs-q2',
              question: 'Which type of hair color requires a developer to open the cuticle?',
              options: ['Temporary', 'Semi-permanent', 'Permanent', 'Rinse'],
              correctAnswer: 2,
              explanation: 'Permanent color uses developer (hydrogen peroxide) to open the cuticle and deposit color.',
            },
            {
              id: 'cs-q3',
              question: 'What stops the chemical process during a relaxer service?',
              options: ['Shampoo', 'Conditioner', 'Neutralizer', 'Water rinse'],
              correctAnswer: 2,
              explanation: 'The neutralizer restores the hair\'s pH and stops the relaxer from processing.',
            },
            {
              id: 'cs-q4',
              question: 'Hair color level 1 represents:',
              options: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'],
              correctAnswer: 3,
              explanation: 'Level 1 is the darkest — black. Level 10 is the lightest blonde.',
            },
            {
              id: 'cs-q5',
              question: 'Before applying a relaxer, the scalp should be:',
              options: [
                'Scratched to open pores',
                'Wet with water',
                'Based with petroleum jelly',
                'Treated with alcohol',
              ],
              correctAnswer: 2,
              explanation: 'Petroleum jelly protects the scalp from chemical burns during relaxer application.',
            },
          ],
        },
      ],
    },

    // ── Module 7 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-7',
      title: 'Module 7: Professional & Business Skills',
      orderIndex: 7,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'professional_skills',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'client_retention',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'shop_management',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'professional_image', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-40',
          title: 'Building Your Clientele',
          order: 1,
          domainKey: 'professional_skills',
          objective: 'Apply strategies to attract and retain clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Building Your Clientele</h2>
<h3>First Impressions</h3>
<p>Clients decide within the first 30 seconds whether they will return. Be on time, be clean, be professional.</p>
<h3>Retention Strategies</h3>
<ul>
<li>Remember client names and preferences</li>
<li>Keep a client card with notes on their style, products used, and last visit</li>
<li>Follow up after new clients — a simple text goes a long way</li>
<li>Recommend rebooking before they leave the chair</li>
</ul>
<h3>Social Media</h3>
<p>Post your work consistently. Before-and-after photos with client permission are the most effective content. Use local hashtags and tag your shop location.</p>`,
        },
        {
          slug: 'barber-lesson-41',
          title: 'Booth Rental vs. Commission vs. Ownership',
          order: 2,
          domainKey: 'professional_skills',
          objective: 'Compare barbershop business models and their financial implications.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Barbershop Business Models</h2>
<h3>Commission</h3>
<p>You work for the shop owner and receive a percentage of your service revenue (typically 40-60%). The shop provides clients, supplies, and equipment. Good for new barbers building skills.</p>
<h3>Booth Rental</h3>
<p>You pay the shop owner a weekly or monthly fee to use a chair. You keep 100% of your service revenue. You are self-employed — responsible for your own taxes, supplies, and clients.</p>
<h3>Shop Ownership</h3>
<p>You own the business. Maximum income potential but maximum responsibility. Requires business license, shop license, and significant startup capital.</p>
<h3>Which is Right for You?</h3>
<p>Most barbers start on commission, move to booth rental as they build clientele, and consider ownership after 5+ years of experience.</p>`,
        },
        {
          slug: 'barber-lesson-42',
          title: 'Pricing, Tipping & Financial Basics',
          order: 3,
          domainKey: 'professional_skills',
          objective: 'Set competitive prices and manage basic barbershop finances.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Pricing and Finances</h2>
<h3>Setting Your Prices</h3>
<ul>
<li>Research local market rates</li>
<li>Factor in your experience level</li>
<li>Price for the service, not the time</li>
<li>Raise prices as your clientele grows — do not undervalue your work</li>
</ul>
<h3>Tipping</h3>
<p>The standard tip for barbering is 15-20%. Never expect a tip but always appreciate one. Make it easy — have a tip jar or use a payment system that prompts for tips.</p>
<h3>Taxes as a Self-Employed Barber</h3>
<ul>
<li>Track all income — cash and card</li>
<li>Set aside 25-30% for taxes</li>
<li>Keep receipts for all business expenses (supplies, tools, education)</li>
<li>Pay quarterly estimated taxes to avoid penalties</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-43',
          title: 'Professionalism & Ethics',
          order: 4,
          domainKey: 'professional_skills',
          objective: 'Apply professional and ethical standards in the barbershop.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Professionalism and Ethics</h2>
<h3>The Barber's Code</h3>
<ul>
<li>Never speak negatively about other barbers or shops</li>
<li>Respect client confidentiality — what happens in the chair stays in the chair</li>
<li>Do not perform services outside your scope of practice</li>
<li>Be honest about what you can and cannot achieve</li>
</ul>
<h3>Handling Difficult Clients</h3>
<p>Stay calm. Listen. Offer to fix the issue at no charge if it is your error. If a client is abusive, you have the right to refuse service.</p>
<h3>Continuing Education</h3>
<p>The barbering industry evolves constantly. Attend trade shows, watch tutorials, and practice new techniques. Indiana requires continuing education for license renewal.</p>`,
        },
        {
          slug: 'barber-lesson-44',
          title: 'Styling Products & Finishing',
          order: 5,
          domainKey: 'professional_skills',
          objective: 'Select and apply appropriate styling products for different hair types.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Styling Products</h2>
<h3>Product Types</h3>
<ul>
<li><strong>Pomade</strong> — medium to high hold, medium to high shine; classic barbershop finish</li>
<li><strong>Clay</strong> — medium to high hold, matte finish; modern styles</li>
<li><strong>Cream</strong> — light hold, natural finish; good for textured hair</li>
<li><strong>Gel</strong> — strong hold, high shine; waves and slick styles</li>
<li><strong>Wax</strong> — flexible hold; mustaches and detailed styling</li>
</ul>
<h3>Application</h3>
<ol>
<li>Start with a small amount — you can always add more</li>
<li>Warm product between palms</li>
<li>Work through hair evenly</li>
<li>Style with comb or fingers</li>
</ol>`,
        },
        {
          slug: 'barber-module-7-checkpoint',
          title: 'Professional Skills Checkpoint',
          order: 6,
          domainKey: 'professional_skills',
          objective: 'Demonstrate mastery of professional and business skills.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 7 Review — Professional & Business Skills</h2><p>Review before taking this checkpoint: client retention strategies, booth rental vs. commission vs. ownership, pricing and taxes, professional ethics, and styling products. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'ps-q1',
              question: 'In a booth rental arrangement, who keeps 100% of service revenue?',
              options: ['The shop owner', 'The barber', 'They split it 50/50', 'The landlord'],
              correctAnswer: 1,
              explanation: 'Booth renters are self-employed and keep all service revenue after paying their booth fee.',
            },
            {
              id: 'ps-q2',
              question: 'What percentage of income should a self-employed barber set aside for taxes?',
              options: ['5-10%', '10-15%', '25-30%', '50%'],
              correctAnswer: 2,
              explanation: 'Self-employed individuals pay both income tax and self-employment tax, totaling 25-30%.',
            },
            {
              id: 'ps-q3',
              question: 'Which styling product provides high hold with a matte finish?',
              options: ['Pomade', 'Gel', 'Clay', 'Cream'],
              correctAnswer: 2,
              explanation: 'Clay provides medium to high hold with a matte finish, popular for modern styles.',
            },
            {
              id: 'ps-q4',
              question: 'The standard tip for barbering services is:',
              options: ['5-10%', '15-20%', '25-30%', 'Tips are not expected'],
              correctAnswer: 1,
              explanation: '15-20% is the standard tip for personal service professionals including barbers.',
            },
            {
              id: 'ps-q5',
              question: 'What is the most effective social media content for barbers?',
              options: [
                'Motivational quotes',
                'Before-and-after photos of client work',
                'Product advertisements',
                'Shop interior photos',
              ],
              correctAnswer: 1,
              explanation: 'Before-and-after photos showcase your skill directly and attract new clients.',
            },
          ],
        },
      ],
    },

    // ── Module 8 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-8',
      title: 'Module 8: State Board Exam Preparation',
      orderIndex: 8,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'exam_prep',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'written_exam_prep',    isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'practical_exam_prep',  isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-46',
          title: 'Indiana State Board Exam Overview',
          order: 1,
          domainKey: 'exam_prep',
          objective: 'Understand the format and requirements of the Indiana barber state board exam.',
          durationMinutes: 20,
          videoFile: '/videos/barber-course-intro-with-voice.mp4',
          content: `<h2>Indiana State Board Exam</h2>
<h3>Exam Components</h3>
<ul>
<li><strong>Written exam</strong> — 100 multiple choice questions; 75% passing score required</li>
<li><strong>Practical exam</strong> — performed on a mannequin or live model; graded by state board examiners</li>
</ul>
<h3>Written Exam Topics</h3>
<ul>
<li>Infection control and sanitation (25%)</li>
<li>Hair science and scalp analysis (20%)</li>
<li>Haircutting and styling (25%)</li>
<li>Chemical services (15%)</li>
<li>Indiana laws and regulations (15%)</li>
</ul>
<h3>Practical Exam Skills</h3>
<ul>
<li>Haircut with fade</li>
<li>Shave service</li>
<li>Sanitation procedures</li>
<li>Client draping and preparation</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-47',
          title: 'Written Exam Review — Sanitation & Science',
          order: 2,
          domainKey: 'exam_prep',
          objective: 'Review key concepts in sanitation and hair science for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Written Exam Review: Sanitation & Science</h2>
<h3>Key Sanitation Facts</h3>
<ul>
<li>Disinfection is required between every client — not sterilization</li>
<li>EPA-registered disinfectants must be used</li>
<li>Sharps go in puncture-resistant containers</li>
<li>Disinfectant solution changed daily or when contaminated</li>
<li>Tinea capitis = no service, refer to physician</li>
</ul>
<h3>Key Hair Science Facts</h3>
<ul>
<li>Cortex contains melanin</li>
<li>Anagen = growth phase (2-7 years)</li>
<li>Normal hair loss = 50-100 hairs/day</li>
<li>High porosity = damaged cuticle</li>
<li>Patch test = 24-48 hours before chemical services</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-48',
          title: 'Written Exam Review — Techniques & Laws',
          order: 3,
          domainKey: 'exam_prep',
          objective: 'Review haircutting techniques and Indiana laws for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Written Exam Review: Techniques & Laws</h2>
<h3>Key Technique Facts</h3>
<ul>
<li>Parietal ridge = widest part of head = high fade reference</li>
<li>Occipital bone = back of skull = low/mid fade reference</li>
<li>Razor angle = 30 degrees</li>
<li>Neckline = 2 finger-widths above Adam's apple</li>
<li>First shave pass = with the grain</li>
<li>Thinning shears = remove bulk, not length</li>
</ul>
<h3>Key Indiana Law Facts</h3>
<ul>
<li>Apprenticeship path = 2,000 OJT hours</li>
<li>School path = 1,500 hours</li>
<li>Written exam passing score = 75%</li>
<li>License renewal = every 2 years</li>
<li>License must be displayed at workstation</li>
<li>Governed by Indiana Code Title 25, Article 8</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-49',
          title: 'Practical Exam Preparation',
          order: 4,
          domainKey: 'exam_prep',
          objective: 'Prepare for the practical exam with a structured practice checklist.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Practical Exam Preparation</h2>
<h3>What Examiners Look For</h3>
<ul>
<li>Proper draping and client preparation</li>
<li>Sanitation procedures performed correctly</li>
<li>Clean, even fade with smooth transitions</li>
<li>Sharp lineup</li>
<li>Proper razor technique and safety</li>
<li>Professional demeanor throughout</li>
</ul>
<h3>Practice Checklist</h3>
<ol>
<li>Drape client correctly with neck strip and cape</li>
<li>Disinfect all tools before beginning</li>
<li>Establish fade line and work upward</li>
<li>Blend all transitions — no lines</li>
<li>Execute clean lineup at hairline, temples, and nape</li>
<li>Perform shave with correct angle and grain direction</li>
<li>Apply post-shave care</li>
<li>Clean and disinfect station after service</li>
</ol>`,
        },
        {
          slug: 'barber-indiana-state-board-exam',
          title: 'Program Final Exam',
          order: 5,
          domainKey: 'exam_prep',
          objective: 'Demonstrate comprehensive mastery of the barber apprenticeship curriculum.',
          durationMinutes: 30,
          passingScore: 70,
          content: `<h2>Program Final Exam</h2><p>This exam covers all eight modules of the Barber Apprenticeship program. Topics include infection control, hair science, tools and equipment, haircutting techniques, shaving and beard services, chemical services, professional skills, and Indiana state board exam preparation. You must score 70% or higher to complete the program.</p>`,
          quizQuestions: [
            {
              id: 'ep-q1',
              question: 'What is the passing score for the Indiana barber written exam?',
              options: ['60%', '70%', '75%', '80%'],
              correctAnswer: 2,
              explanation: 'Indiana requires a 75% passing score on the written state board exam.',
            },
            {
              id: 'ep-q2',
              question: 'How many OJT hours are required for the apprenticeship path in Indiana?',
              options: ['1,000', '1,500', '2,000', '2,500'],
              correctAnswer: 2,
              explanation: 'The DOL-registered apprenticeship path requires 2,000 on-the-job training hours.',
            },
            {
              id: 'ep-q3',
              question: 'Which layer of the hair contains melanin?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
              correctAnswer: 1,
              explanation: 'The cortex contains melanin granules that determine hair color.',
            },
            {
              id: 'ep-q4',
              question: 'What is required between every client in Indiana?',
              options: ['Sterilization', 'Sanitation', 'Disinfection', 'Rinsing'],
              correctAnswer: 2,
              explanation: 'EPA-registered disinfection of all tools is required between every client.',
            },
            {
              id: 'ep-q5',
              question: 'The neckline should be set:',
              options: [
                'At the jawline',
                'At the Adam\'s apple',
                'Two finger-widths above the Adam\'s apple',
                'At the occipital bone',
              ],
              correctAnswer: 2,
              explanation: 'Two finger-widths above the Adam\'s apple is the standard neckline position.',
            },
            {
              id: 'ep-q6',
              question: 'A client has tinea capitis. You should:',
              options: [
                'Proceed with gloves',
                'Perform a dry cut only',
                'Decline service and refer to a physician',
                'Use medicated shampoo first',
              ],
              correctAnswer: 2,
              explanation: 'Tinea capitis is contagious — no services should be performed.',
            },
            {
              id: 'ep-q7',
              question: 'The first pass in a straight razor shave goes:',
              options: ['Against the grain', 'Across the grain', 'With the grain', 'In circles'],
              correctAnswer: 2,
              explanation: 'Always start with the grain to safely remove bulk before closer passes.',
            },
            {
              id: 'ep-q8',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
            },
          ],
        },
      ],
    },
  ],

  videoConfig: BARBER_VIDEO_CONFIG,

  assessmentRules: [
    {
      assessmentType:   'module',
      scope:            'all',
      minQuestions:     5,
      maxQuestions:     10,
      passingThreshold: 0.70,
    },
    {
      assessmentType:   'final',
      scope:            'all',
      minQuestions:     25,
      maxQuestions:     50,
      passingThreshold: 0.70,
    },
  ],
};
