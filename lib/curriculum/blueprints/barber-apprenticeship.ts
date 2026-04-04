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
          title: 'Welcome to the Barber Apprenticeship',
          order: 1,
          domainKey: 'infection_control',
          objective: 'Understand the structure of the DOL-registered barber apprenticeship program.',
          durationMinutes: 15,
          content: `<h2>Welcome to Your Barber Apprenticeship</h2>
<p>This program is a U.S. Department of Labor registered apprenticeship. You will complete 2,000 hours of on-the-job training alongside this related technical instruction.</p>
<h3>What You Will Learn</h3>
<ul>
<li>Indiana state barbering laws and regulations</li>
<li>Infection control and sanitation</li>
<li>Hair science and scalp analysis</li>
<li>Haircutting, fading, and clipper techniques</li>
<li>Shaving and razor work</li>
<li>Chemical services</li>
<li>Professional and business skills</li>
</ul>
<h3>How This Works</h3>
<p>Each module ends with a checkpoint quiz. You must score 70% or higher to advance. Your on-the-job hours are logged separately with your host shop supervisor.</p>`,
        },
        {
          slug: 'barber-lesson-2',
          title: 'OSHA Standards & Bloodborne Pathogens',
          order: 2,
          domainKey: 'infection_control',
          objective: 'Identify OSHA requirements and bloodborne pathogen risks in a barbershop.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>OSHA in the Barbershop</h2>
<p>OSHA (Occupational Safety and Health Administration) sets the standards that protect you and your clients from workplace hazards.</p>
<h3>Bloodborne Pathogens</h3>
<p>Bloodborne pathogens are microorganisms in human blood that can cause disease. In barbering, the primary risks are:</p>
<ul>
<li>Cuts from razors or clippers</li>
<li>Contact with open wounds or sores</li>
<li>Improper disposal of sharps</li>
</ul>
<h3>Universal Precautions</h3>
<p>Treat all blood and bodily fluids as potentially infectious. Always wear gloves when there is risk of contact with blood.</p>
<h3>Sharps Disposal</h3>
<p>Used razor blades must be placed in a puncture-resistant sharps container — never in a regular trash can.</p>`,
        },
        {
          slug: 'barber-lesson-3',
          title: 'Sanitation vs. Disinfection vs. Sterilization',
          order: 3,
          domainKey: 'infection_control',
          objective: 'Distinguish between sanitation, disinfection, and sterilization and apply each correctly.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation.mp4',
          content: `<h2>Three Levels of Decontamination</h2>
<h3>Sanitation</h3>
<p>Sanitation reduces the number of pathogens on a surface to a safe level. Example: washing hands with soap and water, wiping down a chair with a clean cloth.</p>
<h3>Disinfection</h3>
<p>Disinfection destroys most pathogens on non-living surfaces. In Indiana, barbershops must use an EPA-registered disinfectant on all tools between clients.</p>
<ul>
<li>Immerse metal tools in disinfectant solution for the manufacturer's recommended time</li>
<li>Combs and brushes must be fully submerged</li>
<li>Disinfectant solution must be changed daily or when visibly contaminated</li>
</ul>
<h3>Sterilization</h3>
<p>Sterilization destroys all microorganisms including spores. Autoclave sterilization is the gold standard but not required for most barbershop tools.</p>`,
        },
        {
          slug: 'barber-lesson-4',
          title: 'Tool Disinfection Procedures',
          order: 4,
          domainKey: 'infection_control',
          objective: 'Perform correct pre-service and post-service tool disinfection.',
          durationMinutes: 20,
          content: `<h2>Disinfecting Your Tools</h2>
<h3>Pre-Service</h3>
<ol>
<li>Remove all hair and debris from tools</li>
<li>Wash tools with soap and water</li>
<li>Fully immerse in EPA-registered disinfectant</li>
<li>Remove after required contact time and allow to air dry</li>
<li>Store in a clean, covered container</li>
</ol>
<h3>Post-Service</h3>
<p>Repeat the same process after every client. Never use the same tool on a second client without disinfecting first.</p>
<h3>Indiana State Board Requirements</h3>
<p>The Indiana Professional Licensing Agency requires all barbershops to maintain a disinfection log. Tools found undisinfected during inspection result in immediate citation.</p>`,
        },
        {
          slug: 'barber-lesson-5',
          title: 'Shop Sanitation & Client Safety',
          order: 5,
          domainKey: 'infection_control',
          objective: 'Maintain a sanitary workstation and protect client health.',
          durationMinutes: 15,
          content: `<h2>Keeping Your Station Clean</h2>
<h3>Workstation Standards</h3>
<ul>
<li>Clean and disinfect chair, headrest, and armrests between every client</li>
<li>Use a fresh neck strip and clean cape for every client</li>
<li>Sweep hair from floor between clients</li>
<li>Keep all products capped and stored properly</li>
</ul>
<h3>Personal Hygiene</h3>
<ul>
<li>Wash hands before and after every service</li>
<li>Keep nails trimmed and clean</li>
<li>Wear clean professional attire</li>
</ul>
<h3>Client Contraindications</h3>
<p>Do not perform services on clients with visible scalp infections, open wounds, or contagious skin conditions. Refer them to a physician.</p>`,
        },
        {
          slug: 'barber-lesson-6',
          title: 'Indiana Barbering Laws & Regulations',
          order: 6,
          domainKey: 'infection_control',
          objective: 'Identify key Indiana state barbering laws that govern practice.',
          durationMinutes: 20,
          content: `<h2>Indiana Barbering Laws</h2>
<p>Indiana Code Title 25, Article 8 governs the practice of barbering in Indiana.</p>
<h3>License Requirements</h3>
<ul>
<li>Must complete 1,500 hours of training (apprenticeship path: 2,000 OJT hours)</li>
<li>Must pass the Indiana State Board written and practical exams</li>
<li>License must be renewed every two years</li>
<li>License must be displayed at the workstation</li>
</ul>
<h3>Scope of Practice</h3>
<p>Indiana barbers are licensed to perform: haircutting, shaving, beard trimming, scalp treatments, and limited chemical services on the head and neck.</p>
<h3>Violations</h3>
<p>Practicing without a license, failing inspections, or violating sanitation standards can result in fines, suspension, or revocation of license.</p>`,
        },
        {
          slug: 'barber-module-1-checkpoint',
          title: 'Infection Control Checkpoint',
          order: 7,
          domainKey: 'infection_control',
          objective: 'Demonstrate mastery of infection control and Indiana barbering law.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 1 Review — Infection Control & Safety</h2><p>Review the key concepts before taking this checkpoint: sanitation vs. disinfection vs. sterilization, OSHA bloodborne pathogen standards, tool disinfection procedures, Indiana barbering laws, and client contraindications. You must score 70% or higher to advance to Module 2.</p>`,
          quizQuestions: [
            {
              id: 'ic-q1',
              question: 'What level of decontamination is required for barbering tools between clients in Indiana?',
              options: ['Sanitation', 'Disinfection', 'Sterilization', 'Rinsing with water'],
              correctAnswer: 1,
              explanation: 'Indiana requires EPA-registered disinfection of all tools between clients.',
            },
            {
              id: 'ic-q2',
              question: 'Where must used razor blades be disposed of?',
              options: ['Regular trash can', 'Sink drain', 'Puncture-resistant sharps container', 'Paper bag'],
              correctAnswer: 2,
              explanation: 'Sharps must go in a puncture-resistant container to prevent injury and contamination.',
            },
            {
              id: 'ic-q3',
              question: 'What does OSHA stand for?',
              options: [
                'Occupational Safety and Health Administration',
                'Office of Sanitation and Hygiene Authority',
                'Organized Standards for Health Agencies',
                'Occupational Standards for Hazard Avoidance',
              ],
              correctAnswer: 0,
              explanation: 'OSHA sets workplace safety standards including those for barbershops.',
            },
            {
              id: 'ic-q4',
              question: 'A client arrives with a visible scalp infection. What should you do?',
              options: [
                'Proceed with the service using gloves',
                'Disinfect tools extra thoroughly and proceed',
                'Decline the service and refer to a physician',
                'Only perform a dry haircut',
              ],
              correctAnswer: 2,
              explanation: 'Performing services on infected skin risks spreading infection to other clients.',
            },
            {
              id: 'ic-q5',
              question: 'How often must disinfectant solution be changed?',
              options: ['Once a week', 'Once a month', 'Daily or when visibly contaminated', 'Only when it smells bad'],
              correctAnswer: 2,
              explanation: 'Disinfectant loses effectiveness when contaminated and must be changed daily.',
            },
            {
              id: 'ic-q6',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
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
<p>Consistent sectioning ensures even weight distribution and a balanced haircut. Always establish your guide line before cutting.</p>`,
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
</ol>`,
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
</ul>`,
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
<p>Slide cutting thins and tapers hair by sliding the open shears down the hair shaft. Used for blending and removing bulk.</p>`,
        },
        {
          slug: 'barber-lesson-26',
          title: 'Lineup & Edging',
          order: 5,
          domainKey: 'haircutting',
          objective: 'Create clean, sharp lines at the hairline, temples, and nape.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-lineup-narrated.mp4',
          content: `<h2>Lineup and Edging</h2>
<p>The lineup defines the haircut. A sharp, clean edge is the mark of a skilled barber.</p>
<h3>Tools</h3>
<ul>
<li>T-liner or detailer trimmer</li>
<li>Straight razor or shavette for razor-sharp lines</li>
</ul>
<h3>Hairline Lineup</h3>
<ol>
<li>Establish the front hairline — follow the natural hairline or create a defined shape</li>
<li>Use the trimmer to cut a clean edge</li>
<li>Use a razor to sharpen and define</li>
</ol>
<h3>Temple Lineup</h3>
<p>Temples should be squared off or tapered depending on the style. Never cut above the natural temple hairline.</p>
<h3>Nape Lineup</h3>
<p>The nape can be squared, rounded, or tapered. Ask the client their preference. A squared nape looks sharp but grows out faster.</p>`,
        },
        {
          slug: 'barber-lesson-27',
          title: 'Flat Top & Classic Cuts',
          order: 6,
          domainKey: 'haircutting',
          objective: 'Execute a flat top and classic taper haircut.',
          durationMinutes: 20,
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
</ul>`,
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
