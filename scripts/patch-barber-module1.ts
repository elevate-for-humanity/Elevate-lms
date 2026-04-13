/**
 * Patch Module 1 lessons 1-3 to Milady-exceeding standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-module1.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const patches = [
  {
    slug: 'barber-lesson-1',
    title: 'History and Career Opportunities in Barbering',
    learning_objectives: [
      'Trace the evolution of barbering from ancient civilizations through the modern DOL apprenticeship model',
      'Identify the significance of the barber pole and its historical roots in surgical barbering',
      'Describe at least four career pathways available to a licensed barber in Indiana',
      'Explain the difference between a barber license, a cosmetology license, and a barber apprenticeship registration',
      'State the Indiana State Board of Cosmetology and Barber Licensing requirements for apprenticeship hours',
    ],
    content: `<h2>History and Career Opportunities in Barbering</h2>

<h3>The Ancient Roots of Barbering</h3>
<p>Barbering is one of the oldest professions in recorded history. Archaeological evidence from ancient Egypt shows bronze razors dating to 3500 BCE. In ancient Greece and Rome, the <em>tonsor</em> — the barber — held a respected social position, operating in public forums where men gathered not just for grooming but for news, politics, and community. The barber was simultaneously a surgeon, dentist, and social hub.</p>

<h3>The Barber-Surgeon Era</h3>
<p>During the Middle Ages, barbers performed bloodletting, tooth extractions, and minor surgeries alongside haircuts and shaves. The iconic red-and-white barber pole traces directly to this era: the red represents blood, the white represents bandages, and the pole itself was what patients gripped during bloodletting to encourage blood flow. In 1745, the British Parliament formally separated barbers from surgeons — but the pole remained.</p>

<h3>Barbering in America</h3>
<p>African American barbers played a defining role in American barbering history. In the antebellum South, free Black barbers operated some of the most prosperous businesses in their cities, serving white clientele while building community wealth. After Reconstruction, the Black barbershop became a cornerstone institution — a safe space for political organizing, mentorship, and cultural identity that persists today.</p>
<p>The first barber school in the United States opened in Chicago in 1893. State licensing boards followed in the early 1900s as the profession formalized. Today, the U.S. Department of Labor recognizes barbering as a registered apprenticeship occupation — the path you are on now.</p>

<h3>Career Pathways for Licensed Barbers</h3>
<p>A barber license opens more doors than most students realize at the start of their training:</p>
<ul>
  <li><strong>Shop employee:</strong> The most common entry point. Work in an established shop, build a clientele, and develop your technical skills under experienced mentors.</li>
  <li><strong>Shop owner/operator:</strong> Indiana allows licensed barbers to open their own shops after meeting state requirements. Business ownership is a realistic goal within 3-5 years of licensure for motivated barbers.</li>
  <li><strong>Booth rental:</strong> Rent a chair in an existing shop and operate as an independent contractor. Requires strong self-marketing and business discipline.</li>
  <li><strong>Platform artist / educator:</strong> Demonstrate techniques at trade shows, train other barbers, and represent product brands. Requires advanced technical skill and public presence.</li>
  <li><strong>Film, TV, and editorial:</strong> Barbers work on film sets, music videos, and editorial shoots. This path requires a strong portfolio and connections in the entertainment industry.</li>
  <li><strong>Military and institutional:</strong> Barbers work in military bases, correctional facilities, and healthcare institutions — stable employment with benefits.</li>
</ul>

<h3>Indiana Apprenticeship Requirements</h3>
<p>Your apprenticeship is registered with the U.S. Department of Labor and regulated by the Indiana Professional Licensing Agency. Key requirements:</p>
<ul>
  <li>Minimum 2,000 on-the-job training (OJT) hours under a licensed sponsor barber</li>
  <li>Related technical instruction (RTI) — the coursework you are completing now</li>
  <li>Passing the Indiana State Board written and practical examinations</li>
  <li>Maintaining a log of OJT hours signed by your sponsor</li>
</ul>
<p>This apprenticeship model is recognized by the DOL as equivalent to traditional barber school. Your certificate of completion carries the same legal weight as a school diploma for licensing purposes.</p>`,
    quiz_questions: [
      { id: 'l1q1', question: 'What does the red stripe on the barber pole historically represent?', options: ['Red dye used in hair coloring', 'Blood from surgical procedures', 'The color of the barber\'s uniform', 'A warning to approaching customers'], correctAnswer: 1, explanation: 'The red stripe represents blood from the bloodletting procedures barbers performed during the Middle Ages.' },
      { id: 'l1q2', question: 'In what year did the British Parliament formally separate barbers from surgeons?', options: ['1492', '1620', '1745', '1893'], correctAnswer: 2, explanation: 'The British Parliament separated the two professions in 1745, though barbers retained their iconic pole.' },
      { id: 'l1q3', question: 'What was the social role of the Black barbershop in American history?', options: ['Primarily a luxury service for wealthy clients', 'A space for political organizing, mentorship, and cultural identity', 'A training ground exclusively for cosmetologists', 'A government-regulated health facility'], correctAnswer: 1, explanation: 'The Black barbershop became a cornerstone community institution, especially after Reconstruction.' },
      { id: 'l1q4', question: 'How many OJT hours are required to complete an Indiana barber apprenticeship?', options: ['500', '1,000', '1,500', '2,000'], correctAnswer: 3, explanation: 'Indiana requires a minimum of 2,000 on-the-job training hours under a licensed sponsor barber.' },
      { id: 'l1q5', question: 'Which of the following is NOT a recognized career pathway for a licensed barber?', options: ['Booth rental operator', 'Platform artist', 'Registered nurse', 'Film and TV barber'], correctAnswer: 2, explanation: 'Registered nursing requires a separate medical degree and license — it is not a barbering career pathway.' },
      { id: 'l1q6', question: 'What does RTI stand for in the context of a DOL apprenticeship?', options: ['Registered Trade Instruction', 'Related Technical Instruction', 'Required Training Index', 'Regulated Trade Integration'], correctAnswer: 1, explanation: 'RTI stands for Related Technical Instruction — the classroom/coursework component of an apprenticeship.' },
      { id: 'l1q7', question: 'The first barber school in the United States opened in which city?', options: ['New York', 'Atlanta', 'Chicago', 'Philadelphia'], correctAnswer: 2, explanation: 'The first American barber school opened in Chicago in 1893.' },
      { id: 'l1q8', question: 'What is the primary legal difference between a barber apprenticeship certificate and a barber school diploma for Indiana licensing purposes?', options: ['The school diploma is worth more hours', 'The apprenticeship requires more written exams', 'They carry equivalent legal weight for licensing', 'The apprenticeship does not qualify for the state board exam'], correctAnswer: 2, explanation: 'A DOL-registered apprenticeship certificate carries the same legal weight as a school diploma for Indiana licensing purposes.' },
    ],
  },
  {
    slug: 'barber-lesson-2',
    title: 'Indiana State Board Rules, Ethics, and Professional Standards',
    learning_objectives: [
      'Identify the Indiana state agency that licenses and regulates barbers and barber apprentices',
      'List the grounds for license suspension or revocation under Indiana barber law',
      'Describe the ethical obligations of a barber toward clients, colleagues, and the profession',
      'Explain the difference between scope of practice for a barber vs. a cosmetologist in Indiana',
      'Apply professional standards to common workplace scenarios involving client confidentiality and conduct',
    ],
    content: `<h2>Indiana State Board Rules, Ethics, and Professional Standards</h2>

<h3>The Regulatory Framework</h3>
<p>Barbering in Indiana is regulated by the <strong>Indiana Professional Licensing Agency (IPLA)</strong> under the authority of the Indiana State Board of Cosmetology and Barber Licensing. The Board sets standards for education, examination, licensure, and professional conduct. Violating Board rules can result in fines, license suspension, or permanent revocation.</p>
<p>As an apprentice, you are operating under your sponsor's license. That means your sponsor is legally responsible for your work. Understanding the rules protects both of you.</p>

<h3>Indiana Barber Scope of Practice</h3>
<p>Indiana law defines what a licensed barber may and may not do. Barbers are authorized to perform:</p>
<ul>
  <li>Shaving, trimming, and cutting hair on the head, face, and neck</li>
  <li>Shampooing and conditioning hair</li>
  <li>Scalp treatments and massages</li>
  <li>Applying chemical services including relaxers and color (with appropriate training)</li>
  <li>Facial hair grooming including beard shaping and straight razor shaves</li>
</ul>
<p>Barbers are <strong>not</strong> authorized to perform nail services, waxing of areas beyond the face and neck, or advanced skin treatments — those fall under cosmetology or esthetics licensure.</p>

<h3>Grounds for Discipline</h3>
<p>The Indiana Board may suspend or revoke a barber license for:</p>
<ul>
  <li>Practicing without a valid license or allowing an unlicensed person to practice</li>
  <li>Fraud or misrepresentation in obtaining a license</li>
  <li>Gross negligence or incompetence that endangers client health or safety</li>
  <li>Violating sanitation and disinfection standards</li>
  <li>Conviction of a crime directly related to the practice of barbering</li>
  <li>Aiding or abetting unlicensed practice</li>
  <li>Failure to maintain required continuing education</li>
</ul>

<h3>Professional Ethics</h3>
<p>Ethics in barbering goes beyond following rules — it is about the character you bring to every client interaction. The core ethical principles are:</p>
<ul>
  <li><strong>Client confidentiality:</strong> What a client shares in the chair stays in the chair. Personal information, health conditions, and private conversations are not shared with others.</li>
  <li><strong>Honesty:</strong> Do not promise results you cannot deliver. If a client's hair is too damaged for a chemical service, say so clearly before proceeding.</li>
  <li><strong>Non-discrimination:</strong> You must serve all clients regardless of race, religion, gender, disability, or national origin. Refusing service based on protected characteristics violates both ethics and federal law.</li>
  <li><strong>Informed consent:</strong> Before any chemical service, explain the process, risks, and expected results. Get verbal confirmation that the client understands and agrees.</li>
  <li><strong>Referral:</strong> If a client presents with a condition outside your scope — a scalp infection, suspicious lesion, or medical condition — refer them to the appropriate professional. Do not attempt to treat medical conditions.</li>
</ul>

<h3>Professional Conduct Standards</h3>
<p>Your conduct in the shop reflects on your license, your sponsor, and the profession. Standards include:</p>
<ul>
  <li>Arriving on time and prepared for every shift</li>
  <li>Maintaining a clean, pressed, professional appearance</li>
  <li>Keeping your station clean and disinfected between every client</li>
  <li>Using professional language — no profanity, no gossip about other clients or colleagues</li>
  <li>Handling client complaints calmly and professionally, escalating to the shop owner when necessary</li>
</ul>`,
    quiz_questions: [
      { id: 'l2q1', question: 'Which Indiana agency has authority over barber licensing and discipline?', options: ['Indiana Department of Health', 'Indiana Professional Licensing Agency', 'Indiana Department of Labor', 'Indiana Secretary of State'], correctAnswer: 1, explanation: 'The Indiana Professional Licensing Agency (IPLA) administers the State Board of Cosmetology and Barber Licensing.' },
      { id: 'l2q2', question: 'A barber in Indiana is legally authorized to perform which of the following?', options: ['Nail extensions', 'Straight razor shaves', 'Full-body waxing', 'Medical scalp treatments'], correctAnswer: 1, explanation: 'Straight razor shaves are within the Indiana barber scope of practice. Nail and waxing services require cosmetology licensure.' },
      { id: 'l2q3', question: 'A client tells you in confidence that they are going through a divorce. The next client asks about them. What is the ethical response?', options: ['Share the information since it is not health-related', 'Decline to discuss other clients\' personal information', 'Tell the next client only general details', 'Ask the first client if it is okay to share'], correctAnswer: 1, explanation: 'Client confidentiality applies to all personal information shared in the chair, not just health information.' },
      { id: 'l2q4', question: 'Which of the following is grounds for license revocation in Indiana?', options: ['Charging higher prices than competitors', 'Allowing an unlicensed person to practice barbering', 'Refusing to perform a service you are not trained in', 'Closing the shop early on a slow day'], correctAnswer: 1, explanation: 'Allowing an unlicensed person to practice is a serious violation that can result in license revocation.' },
      { id: 'l2q5', question: 'A client presents with a suspicious scalp lesion you have not seen before. What should you do?', options: ['Apply a medicated treatment from the supply room', 'Proceed with the service and monitor it', 'Refer the client to a dermatologist or physician', 'Ask other barbers in the shop for their diagnosis'], correctAnswer: 2, explanation: 'Diagnosing or treating medical conditions is outside a barber\'s scope of practice. Refer to the appropriate medical professional.' },
      { id: 'l2q6', question: 'Before performing a chemical relaxer service, what is the barber\'s ethical obligation?', options: ['Obtain informed consent by explaining the process, risks, and expected results', 'Simply proceed if the client has had the service before', 'Check the client\'s credit before starting', 'Require a written waiver for all chemical services'], correctAnswer: 0, explanation: 'Informed consent requires explaining the process, risks, and expected results before any chemical service.' },
      { id: 'l2q7', question: 'Non-discrimination in barbering means:', options: ['Charging all clients the same price regardless of service', 'Serving all clients regardless of race, religion, gender, or disability', 'Treating all hair types with the same products', 'Applying the same technique to every client'], correctAnswer: 1, explanation: 'Barbers must serve all clients regardless of protected characteristics. Refusal based on these characteristics violates ethics and federal law.' },
      { id: 'l2q8', question: 'Your sponsor barber is legally responsible for your work as an apprentice because:', options: ['You are not yet old enough to hold a license', 'You are operating under their license during the apprenticeship', 'The DOL requires all apprentices to have a co-signer', 'Indiana law requires two licensed barbers per shop'], correctAnswer: 1, explanation: 'As an apprentice, you operate under your sponsor\'s license. The sponsor is legally responsible for your work.' },
    ],
  },
  {
    slug: 'barber-lesson-3',
    title: 'Infection Control: Principles of Prevention',
    learning_objectives: [
      'Distinguish between bacteria, viruses, fungi, and parasites as they relate to barbering',
      'Explain the chain of infection and identify where a barber can break it',
      'Differentiate between cleaning, disinfecting, and sterilizing and state when each is required',
      'Identify OSHA bloodborne pathogen standards that apply to barber shops',
      'Describe the proper procedure for handling a blood exposure incident in the shop',
    ],
    content: `<h2>Infection Control: Principles of Prevention</h2>

<h3>Why Infection Control Is Non-Negotiable</h3>
<p>A barber shop is a high-contact environment. Tools touch multiple clients. Razors break skin. Clippers contact the scalp. Without rigorous infection control, a barber shop can transmit bacterial infections, fungal conditions, and bloodborne pathogens. The Indiana State Board can close a shop and revoke licenses for sanitation violations. More importantly, a client can be seriously harmed.</p>
<p>This lesson covers the science behind infection control — not just the rules, but the <em>why</em> behind every procedure.</p>

<h3>Types of Pathogens</h3>
<p>A <strong>pathogen</strong> is any microorganism capable of causing disease. The four categories relevant to barbering are:</p>
<ul>
  <li><strong>Bacteria:</strong> Single-celled organisms that can survive on surfaces and tools. Some are harmless; others cause serious infections. <em>Staphylococcus aureus</em> (staph) is the most common bacterial concern in barber shops — it causes folliculitis, impetigo, and in severe cases, MRSA. Bacteria are killed by EPA-registered disinfectants.</li>
  <li><strong>Viruses:</strong> Smaller than bacteria and require a living host to replicate. Viruses cannot be killed — they are <em>inactivated</em>. HIV, hepatitis B, and hepatitis C are bloodborne viruses of concern in barbering. They are transmitted through blood-to-blood contact. Proper disinfection of tools that contact blood is critical.</li>
  <li><strong>Fungi:</strong> Organisms that thrive in warm, moist environments. <em>Tinea capitis</em> (ringworm of the scalp) is a fungal infection that can spread through contaminated combs, clippers, and towels. It presents as circular, scaly patches on the scalp. Do not perform services on clients with active fungal infections — refer them to a physician.</li>
  <li><strong>Parasites:</strong> Organisms that live on or in a host. <em>Pediculosis capitis</em> (head lice) is the primary parasitic concern in barbering. Lice cannot survive off a human host for more than 24-48 hours, but they can transfer on combs and towels. Do not perform services on clients with active lice — refer them for treatment first.</li>
</ul>

<h3>The Chain of Infection</h3>
<p>Infection requires six links in a chain: a pathogen, a reservoir (where it lives), a portal of exit, a mode of transmission, a portal of entry, and a susceptible host. Breaking any link stops the infection. As a barber, you break the chain primarily by:</p>
<ul>
  <li>Eliminating the reservoir — disinfecting tools and surfaces</li>
  <li>Blocking the mode of transmission — using single-use items, wearing gloves when appropriate</li>
  <li>Protecting the portal of entry — covering cuts, using neck strips to prevent skin contact</li>
</ul>

<h3>Cleaning, Disinfecting, and Sterilizing</h3>
<p>These three terms are not interchangeable. Each has a specific meaning and application:</p>
<ul>
  <li><strong>Cleaning:</strong> Physical removal of dirt, debris, and organic matter using soap and water or a cleaning agent. Cleaning must happen <em>before</em> disinfection — organic matter neutralizes disinfectants. Clean all tools before disinfecting.</li>
  <li><strong>Disinfecting:</strong> Killing or inactivating most pathogens on a surface using an EPA-registered disinfectant. This is the standard for barber tools. Barbicide is the most common disinfectant used in shops. Tools must be fully submerged for the manufacturer's required contact time (typically 10 minutes).</li>
  <li><strong>Sterilizing:</strong> Destroying all microbial life including spores. Sterilization is achieved with an autoclave (steam under pressure). Indiana does not require sterilization for most barber tools, but it is the gold standard for any tool that penetrates the skin.</li>
</ul>

<h3>OSHA Bloodborne Pathogen Standards</h3>
<p>OSHA's Bloodborne Pathogen Standard (29 CFR 1910.1030) applies to barber shops because barbers may be exposed to blood during shaving and cutting services. Key requirements:</p>
<ul>
  <li><strong>Universal precautions:</strong> Treat all blood and body fluids as potentially infectious, regardless of the client's apparent health status.</li>
  <li><strong>Personal protective equipment (PPE):</strong> Gloves must be worn when contact with blood is anticipated or when the barber has open cuts on their hands.</li>
  <li><strong>Sharps disposal:</strong> Used razor blades must be disposed of in a puncture-resistant sharps container — never in a regular trash can.</li>
  <li><strong>Exposure control plan:</strong> Shops with employees must have a written exposure control plan. As an apprentice, ask your sponsor if one exists.</li>
</ul>

<h3>Blood Exposure Incident Procedure</h3>
<p>If you nick a client and draw blood:</p>
<ol>
  <li>Stop the service immediately and apply pressure with a clean gauze or cotton pad.</li>
  <li>Put on gloves before continuing to handle the wound area.</li>
  <li>Once bleeding stops, apply a styptic pencil or powder (single-use only — never reuse on another client).</li>
  <li>Dispose of all blood-contaminated materials in a sealed bag.</li>
  <li>Disinfect all tools that contacted blood before using them on another client.</li>
  <li>Document the incident in the shop's exposure log.</li>
</ol>`,
    quiz_questions: [
      { id: 'l3q1', question: 'Which pathogen type is responsible for tinea capitis (ringworm of the scalp)?', options: ['Bacteria', 'Virus', 'Fungus', 'Parasite'], correctAnswer: 2, explanation: 'Tinea capitis is a fungal infection. It presents as circular, scaly patches and can spread through contaminated tools.' },
      { id: 'l3q2', question: 'What must happen BEFORE disinfecting a tool?', options: ['Sterilizing it in an autoclave', 'Cleaning it to remove organic matter', 'Soaking it in alcohol for 5 minutes', 'Rinsing it in hot water only'], correctAnswer: 1, explanation: 'Organic matter neutralizes disinfectants. Tools must be cleaned before disinfection is effective.' },
      { id: 'l3q3', question: 'HIV and hepatitis B are classified as:', options: ['Bacterial infections', 'Fungal infections', 'Bloodborne viruses', 'Airborne parasites'], correctAnswer: 2, explanation: 'HIV and hepatitis B are bloodborne viruses transmitted through blood-to-blood contact.' },
      { id: 'l3q4', question: 'Under OSHA\'s Universal Precautions standard, how should a barber treat all blood?', options: ['As safe unless the client discloses a condition', 'As potentially infectious regardless of the client\'s apparent health', 'As a concern only for clients over 60', 'As requiring sterilization only if visible'], correctAnswer: 1, explanation: 'Universal precautions require treating all blood and body fluids as potentially infectious.' },
      { id: 'l3q5', question: 'Where must used razor blades be disposed of?', options: ['Regular trash can', 'Recycling bin', 'Puncture-resistant sharps container', 'Barbicide solution'], correctAnswer: 2, explanation: 'OSHA requires sharps disposal in a puncture-resistant container to prevent needlestick injuries.' },
      { id: 'l3q6', question: 'What is the difference between disinfecting and sterilizing?', options: ['They are the same process with different names', 'Disinfecting kills most pathogens; sterilizing destroys all microbial life including spores', 'Sterilizing is faster than disinfecting', 'Disinfecting requires an autoclave; sterilizing uses chemical solutions'], correctAnswer: 1, explanation: 'Disinfecting kills most pathogens. Sterilizing destroys all microbial life including spores, typically using an autoclave.' },
      { id: 'l3q7', question: 'A client arrives with visible circular, scaly patches on their scalp. What should you do?', options: ['Proceed with the service using extra disinfectant', 'Apply a medicated shampoo and continue', 'Decline the service and refer the client to a physician', 'Use a fresh set of tools and proceed normally'], correctAnswer: 2, explanation: 'Active fungal infections are contagious. Do not perform services — refer the client to a physician for treatment.' },
      { id: 'l3q8', question: 'After nicking a client and drawing blood, what is the FIRST action to take?', options: ['Apply a styptic pencil immediately', 'Stop the service and apply pressure with clean gauze', 'Disinfect the tool that caused the nick', 'Ask the client if they have any bloodborne conditions'], correctAnswer: 1, explanation: 'Stop the service and apply pressure first to control bleeding. Gloves, styptic, and tool disinfection follow.' },
    ],
  },
];

async function main() {
  for (const patch of patches) {
    const { error } = await db
      .from('course_lessons')
      .update({
        title:               patch.title,
        learning_objectives: patch.learning_objectives,
        content:             patch.content,
        quiz_questions:      patch.quiz_questions,
        updated_at:          new Date().toISOString(),
      })
      .eq('course_id', COURSE_ID)
      .eq('slug', patch.slug);

    if (error) {
      console.error(`❌ ${patch.slug}:`, error.message);
    } else {
      console.log(`✅ ${patch.slug} — ${patch.learning_objectives.length} objectives, ${patch.quiz_questions.length} questions`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
