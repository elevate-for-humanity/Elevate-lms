-- Module 1 full content backfill
-- Generated from lib/curriculum/blueprints/barber-apprenticeship.ts
-- Writes content, video_url, quiz_questions, passing_score, title, objective
-- to course_lessons rows for the barber course.

DO $$
DECLARE
  cid uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
BEGIN

  UPDATE public.course_lessons SET
    title = 'Introduction to Barbering',
    video_url = '/videos/barber-course-intro-with-voice.mp4',
    content = '<h2>Introduction to Barbering</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will understand the history of barbering, the scope of practice in Indiana, and what it means to operate as a licensed professional.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Barbering is one of the oldest licensed trades in the United States</li>
  <li>Indiana requires a state license to practice — no exceptions</li>
  <li>This apprenticeship is registered with the U.S. Department of Labor (DOL)</li>
  <li>You will complete 2,000 hours of on-the-job training alongside this coursework</li>
  <li>Each module ends with a checkpoint — 70% or higher required to advance</li>
</ul>

<h3>Explanation</h3>
<p>The barber pole — red, white, and blue — dates to the Middle Ages when barbers performed surgery and bloodletting alongside haircuts. Today, barbering is a regulated profession governed by state licensing boards. In Indiana, the Professional Licensing Agency (IPLA) oversees all barber licenses under Indiana Code Title 25, Article 8.</p>
<p>As a DOL-registered apprentice, you are held to a higher standard than a standard cosmetology student. Your training is documented, your hours are verified, and your competencies are tracked. Employers and state inspectors can request your records at any time.</p>

<h3>Real-World Application</h3>
<p>On your first day at the shop, a walk-in client asks if you can cut their hair. You are an apprentice — not yet licensed. The correct response: introduce yourself as an apprentice, explain that you work under a licensed barber''s supervision, and get your supervising barber before proceeding. Practicing without supervision as an unlicensed apprentice violates Indiana law.</p>

<h3>Summary</h3>
<ul>
  <li>Barbering requires a state license in Indiana</li>
  <li>This program is DOL-registered — your hours and competencies are tracked</li>
  <li>Apprentices must work under licensed supervision at all times</li>
  <li>70% checkpoint score required to advance each module</li>
</ul>',
    quiz_questions = '[{"id": "mod1-l1-q1", "question": "A walk-in client asks you to cut their hair. You are a registered apprentice but not yet licensed. What is the correct action?", "options": ["Perform the cut \u2014 apprentices are allowed to work independently", "Decline and explain you are not licensed, then get your supervising barber", "Only do a dry cut since that does not require a license", "Ask the client to sign a waiver first"], "correctAnswer": 1, "explanation": "Apprentices must work under licensed supervision. Performing services independently violates Indiana law."}, {"id": "mod1-l1-q2", "question": "Which agency registers DOL apprenticeship programs in the United States?", "options": ["Indiana Professional Licensing Agency", "U.S. Department of Labor", "Occupational Safety and Health Administration", "National Barber Association"], "correctAnswer": 1, "explanation": "DOL-registered apprenticeships are overseen by the U.S. Department of Labor."}, {"id": "mod1-l1-q3", "question": "What is the minimum checkpoint score required to advance to the next module in this program?", "options": ["60%", "65%", "70%", "80%"], "correctAnswer": 2, "explanation": "A 70% score is required on all module checkpoints to advance."}, {"id": "mod1-l1-q4", "question": "Indiana barbering is governed by which law?", "options": ["Indiana Code Title 25, Article 8", "Indiana Code Title 16, Article 4", "OSHA Standard 1910.1030", "Federal Trade Commission Act"], "correctAnswer": 0, "explanation": "Indiana Code Title 25, Article 8 governs the practice of barbering in Indiana."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-1';

  UPDATE public.course_lessons SET
    title = 'Professional Conduct & Ethics',
    video_url = '/videos/barber-client-experience.mp4',
    content = '<h2>Professional Conduct & Ethics</h2>

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
</ul>',
    quiz_questions = '[{"id": "mod1-l2-q1", "question": "A client asks you to perform a chemical relaxer service. You have not been trained on relaxers yet. What is the ethical response?", "options": ["Attempt it \u2014 you can figure it out", "Watch a video first, then proceed", "Decline and refer the client to a qualified barber", "Do a patch test and proceed if there is no reaction"], "correctAnswer": 2, "explanation": "Performing services outside your training risks client harm and violates your scope of practice."}, {"id": "mod1-l2-q2", "question": "A client shares personal information while in your chair. Another client later asks about that person. You should:", "options": ["Share only general information", "Say nothing \u2014 client conversations are confidential", "Tell them to ask the person directly", "Share if the information is not sensitive"], "correctAnswer": 1, "explanation": "Client confidentiality is an ethical obligation. All personal information shared in the chair stays private."}, {"id": "mod1-l2-q3", "question": "Which of the following is an example of professional conduct?", "options": ["Arriving 10 minutes late but finishing the cut quickly", "Wearing clean attire, greeting clients by name, and being on time", "Checking your phone between cuts", "Discussing other clients with the current client"], "correctAnswer": 1, "explanation": "Professional conduct includes appearance, punctuality, and respectful client interaction."}, {"id": "mod1-l2-q4", "question": "Under Indiana law, you must provide services to clients regardless of:", "options": ["Their ability to tip", "Their hair type", "Race, religion, gender, disability, or national origin", "Whether they have an appointment"], "correctAnswer": 2, "explanation": "Indiana law prohibits discrimination in licensed service businesses."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-2';

  UPDATE public.course_lessons SET
    title = 'Tools & Equipment',
    video_url = '/videos/course-barber-clipper-techniques.mp4',
    content = '<h2>Tools & Equipment</h2>

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
</ul>',
    quiz_questions = '[{"id": "mod1-l3-q1", "question": "Your clippers are pulling hair instead of cutting cleanly. What is the most likely cause?", "options": ["The guard is the wrong size", "The blades need oiling or cleaning", "The client\\", ",\n                "], "correctAnswer": 1, "explanation": "Pulling is almost always a maintenance issue \u2014 dirty or dry blades. Oil and clean before assuming equipment failure."}, {"id": "mod1-l3-q2", "question": "When using shears, which finger should be the only one that moves?", "options": ["Index finger", "Ring finger", "Thumb", "Pinky"], "correctAnswer": 2, "explanation": "Only the thumb moves when cutting with shears. The bottom blade stays stationary."}, {"id": "mod1-l3-q3", "question": "What is the correct blade angle when using a straight razor on a client?", "options": ["10 degrees", "20 degrees", "30 degrees", "45 degrees"], "correctAnswer": 2, "explanation": "A 30-degree angle provides the correct balance between closeness and safety."}, {"id": "mod1-l3-q4", "question": "Which tool is used for detail work, lineups, and edges?", "options": ["Clipper", "Trimmer (edger)", "Wide-tooth comb", "Boar bristle brush"], "correctAnswer": 1, "explanation": "Trimmers (edgers) are smaller and more precise than clippers \u2014 designed for detail work."}, {"id": "mod1-l3-q5", "question": "A client sits down and you notice their collar is exposed. Before starting, you should:", "options": ["Begin cutting \u2014 the collar will be fine", "Apply a neck strip and cape to protect the client", "Ask the client to tuck in their collar", "Use a towel instead of a cape"], "correctAnswer": 1, "explanation": "A fresh neck strip and clean cape are required for every client to prevent hair contact with skin and protect clothing."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-3';

  UPDATE public.course_lessons SET
    title = 'Sanitation & Infection Control',
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Sanitation & Infection Control</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to distinguish between sanitation, disinfection, and sterilization, perform the correct tool disinfection procedure, and identify OSHA bloodborne pathogen requirements for barbershops.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Sanitation</strong> — reduces pathogens to a safe level (handwashing, wiping surfaces)</li>
  <li><strong>Disinfection</strong> — destroys most pathogens on non-living surfaces; required for all tools between clients in Indiana</li>
  <li><strong>Sterilization</strong> — destroys all microorganisms including spores; required for invasive instruments only</li>
  <li><strong>Bloodborne pathogens</strong> — treat all blood and bodily fluids as potentially infectious (Universal Precautions)</li>
  <li><strong>Sharps disposal</strong> — used razor blades go in a puncture-resistant sharps container only</li>
</ul>

<h3>Explanation</h3>
<p><strong>The three levels:</strong> Sanitation is the lowest level — it reduces but does not eliminate pathogens. Disinfection is the standard required in Indiana barbershops. Sterilization is the highest level and is not required for standard barbering tools.</p>
<p><strong>Tool disinfection procedure (Indiana standard):</strong></p>
<ol>
  <li>Remove all hair and debris from the tool</li>
  <li>Wash with soap and water</li>
  <li>Fully immerse in an EPA-registered disinfectant solution</li>
  <li>Leave for the manufacturer''s required contact time</li>
  <li>Remove, rinse if required, and air dry</li>
  <li>Store in a clean, covered container</li>
</ol>
<p>Change disinfectant solution daily or whenever it becomes visibly contaminated. Indiana inspectors check disinfectant logs — maintain one at your station.</p>
<p><strong>OSHA Bloodborne Pathogens Standard (29 CFR 1910.1030):</strong> Treat all blood as infectious. Wear gloves when there is any risk of blood contact. Never recap used razor blades by hand. Dispose of all sharps in a puncture-resistant container.</p>

<h3>Real-World Application</h3>
<p>Mid-haircut, your clipper blade nicks a client''s scalp and draws a small amount of blood. Stop the service. Put on gloves before touching the area. Apply pressure with a clean cloth. Once bleeding stops, clean the area with an antiseptic. Document the incident. Disinfect all tools before continuing or starting a new client. This is not optional — it is the law.</p>

<h3>Summary</h3>
<ul>
  <li>Disinfection (not just sanitation) is required for all tools between clients in Indiana</li>
  <li>Follow the 6-step disinfection procedure every time</li>
  <li>Universal Precautions: treat all blood as infectious</li>
  <li>Sharps go in a puncture-resistant container — never regular trash</li>
  <li>Maintain a disinfection log at your station</li>
</ul>',
    quiz_questions = '[{"id": "mod1-l4-q1", "question": "Mid-haircut, your blade nicks a client and draws blood. What is your FIRST action?", "options": ["Finish the cut quickly, then clean up", "Apply a styptic pencil immediately without gloves", "Stop the service and put on gloves before touching the area", "Ask the client if they want you to continue"], "correctAnswer": 2, "explanation": "Universal Precautions require gloves before any contact with blood. Stop the service first."}, {"id": "mod1-l4-q2", "question": "What level of decontamination is required for barbering tools between clients in Indiana?", "options": ["Sanitation", "Disinfection", "Sterilization", "Rinsing with hot water"], "correctAnswer": 1, "explanation": "Indiana requires EPA-registered disinfection of all tools between every client."}, {"id": "mod1-l4-q3", "question": "How often must disinfectant solution be changed?", "options": ["Once a week", "Once a month", "Daily or when visibly contaminated", "Only when it changes color"], "correctAnswer": 2, "explanation": "Disinfectant loses effectiveness when contaminated. Indiana requires daily changes at minimum."}, {"id": "mod1-l4-q4", "question": "Where must used razor blades be disposed of?", "options": ["Wrapped in paper and placed in regular trash", "Rinsed and placed in a drawer", "In a puncture-resistant sharps container", "In a sealed plastic bag"], "correctAnswer": 2, "explanation": "OSHA requires sharps disposal in a puncture-resistant container to prevent injury and contamination."}, {"id": "mod1-l4-q5", "question": "What is the correct order for the Indiana tool disinfection procedure?", "options": ["Immerse in disinfectant \u2192 remove hair \u2192 wash with soap \u2192 air dry", "Remove hair \u2192 wash with soap \u2192 immerse in disinfectant \u2192 air dry \u2192 store", "Wash with soap \u2192 air dry \u2192 immerse in disinfectant \u2192 store", "Remove hair \u2192 immerse in disinfectant \u2192 wash with soap \u2192 store"], "correctAnswer": 1, "explanation": "Remove debris first, then wash, then disinfect, then dry and store. Skipping steps reduces effectiveness."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-4';

  UPDATE public.course_lessons SET
    title = 'Workplace Safety',
    video_url = '/videos/course-barber-sanitation.mp4',
    content = '<h2>Workplace Safety</h2>

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
</ul>',
    quiz_questions = '[{"id": "mod1-l5-q1", "question": "You notice your clipper cord has a crack in the insulation. You have a client waiting. What do you do?", "options": ["Use it carefully \u2014 the crack is small", "Wrap the crack with tape and proceed", "Do not use it \u2014 report it and use a backup clipper", "Finish the current client, then report it"], "correctAnswer": 2, "explanation": "Damaged electrical equipment is an electrocution risk. Never use it regardless of client wait time."}, {"id": "mod1-l5-q2", "question": "What document is required on file for every chemical product used in a barbershop?", "options": ["Product receipt", "Safety Data Sheet (SDS)", "Manufacturer warranty", "OSHA inspection report"], "correctAnswer": 1, "explanation": "OSHA requires a Safety Data Sheet (SDS) for every chemical product, accessible to all employees."}, {"id": "mod1-l5-q3", "question": "Hair clippings on the floor are primarily a hazard because they:", "options": ["Clog drains", "Create a slip and fall risk", "Attract insects", "Contaminate disinfectant solutions"], "correctAnswer": 1, "explanation": "Hair on the floor is a slip hazard. Sweep between every client."}, {"id": "mod1-l5-q4", "question": "Which of the following best describes correct ergonomic posture for a barber?", "options": ["Lean over the client to get closer to the work", "Stand with feet together and bend at the waist", "Stand with feet shoulder-width apart, back straight, chair at correct height", "Sit on a stool whenever possible"], "correctAnswer": 2, "explanation": "Correct posture prevents long-term back, neck, and shoulder injuries that can end a barbering career."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-5';

  UPDATE public.course_lessons SET
    title = 'Client Consultation',
    video_url = '/videos/course-barber-consultation-narrated.mp4',
    content = '<h2>Client Consultation</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to conduct a structured client consultation, identify contraindications that prevent service, and document client preferences for future visits.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Consultation happens before every service — not just the first visit</li>
  <li>Contraindications — conditions that prevent you from performing a service safely</li>
  <li>Client history — medications, allergies, and scalp conditions affect service outcomes</li>
  <li>Managing expectations — be honest about what is achievable with the client''s hair type</li>
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
<p>A new client sits down and asks for a skin fade. During your scalp assessment, you notice a circular, scaly patch near the crown — a classic sign of ringworm (tinea capitis). You must decline the service, explain that you noticed a scalp condition that requires a doctor''s evaluation, and refer them out. Do not name the condition as a diagnosis — you are not a physician. Simply say you cannot safely perform the service and recommend they see a doctor before their next visit.</p>

<h3>Summary</h3>
<ul>
  <li>Consult before every service — conditions change between visits</li>
  <li>Assess the scalp visually before touching</li>
  <li>Contraindications require referral, not service</li>
  <li>Confirm the service plan before starting — eliminate surprises</li>
  <li>Document every service on a client record card</li>
</ul>',
    quiz_questions = '[{"id": "mod1-l6-q1", "question": "During a scalp assessment, you notice a circular, scaly patch on a new client\\", "options": ["Proceed \u2014 it is probably just dry skin", "Apply a medicated shampoo and continue", "Decline the service and refer the client to a physician", "Disinfect the area and proceed with gloves"], "correctAnswer": 2, "explanation": "Circular, scaly patches may indicate ringworm \u2014 a contraindication. Decline and refer. Do not diagnose."}, {"id": "mod1-l6-q2", "question": "A client shows you a photo of a style. You know it will not work with their hair type. You should:", "options": ["Attempt it anyway \u2014 the client knows what they want", "Be honest, explain what is achievable, and offer an alternative", "Do the style and let the client decide if they like it", "Refuse the service"], "correctAnswer": 1, "explanation": "Managing expectations honestly builds trust and loyalty. Surprises \u2014 even well-intentioned ones \u2014 damage the relationship."}, {"id": "mod1-l6-q3", "question": "Which question is better for a client consultation?", "options": ["Same as last time?", ",\n                ", "Short or long?", ",\n                ", "What are we doing today?", ",\n                ", "Do you want a fade?"], "correctAnswer": 2, "explanation": "Open-ended questions give the client space to describe what they want rather than confirming assumptions."}, {"id": "mod1-l6-q4", "question": "Why should you document each client service on a record card?", "options": ["It is required by Indiana law for all services", "To track products used, preferences, and any reactions for future visits", "To calculate the client\\", ",\n                "], "correctAnswer": 1, "explanation": "Client records allow you to replicate successful services and avoid repeating mistakes."}, {"id": "mod1-l6-q5", "question": "At what point in the service should you confirm the service plan with the client?", "options": ["After the first cut", "At the end of the service", "Before starting \u2014 after the consultation", "Only if the client asks"], "correctAnswer": 2, "explanation": "Confirming before you start eliminates misunderstandings and protects both you and the client."}]'::jsonb,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-lesson-6';

  UPDATE public.course_lessons SET
    title = 'Module 1 Checkpoint — Foundations & Safety',
    content = '<h2>Module 1 Checkpoint — Foundations & Safety</h2>
<p>This checkpoint covers all six lessons in Module 1: Introduction to Barbering, Professional Conduct & Ethics, Tools & Equipment, Sanitation & Infection Control, Workplace Safety, and Client Consultation.</p>
<p>You must score <strong>70% or higher</strong> to unlock Module 2. Review your lesson notes before starting.</p>',
    quiz_questions = '[{"id": "cp1-q1", "question": "A walk-in asks you to cut their hair. You are a registered apprentice, not yet licensed. What is the correct action?", "options": ["Perform the cut \u2014 apprentices can work independently", "Decline and get your supervising licensed barber", "Do a dry cut only since that does not require a license", "Ask the client to sign a waiver"], "correctAnswer": 1, "explanation": "Apprentices must work under licensed supervision at all times. Independent practice violates Indiana law."}, {"id": "cp1-q2", "question": "Your clipper cord has a crack in the insulation. A client is waiting. You should:", "options": ["Use it carefully for this one client", "Wrap the crack with electrical tape and proceed", "Not use it \u2014 report it and use a backup", "Finish the client, then report it"], "correctAnswer": 2, "explanation": "Damaged electrical equipment is an electrocution risk. Never use it regardless of client wait time."}, {"id": "cp1-q3", "question": "What level of decontamination is required for barbering tools between clients in Indiana?", "options": ["Sanitation", "Disinfection", "Sterilization", "Hot water rinse"], "correctAnswer": 1, "explanation": "Indiana requires EPA-registered disinfection of all tools between every client."}, {"id": "cp1-q4", "question": "During a scalp assessment, you notice a circular scaly patch on a new client. You should:", "options": ["Proceed \u2014 it is probably dandruff", "Apply medicated shampoo and continue", "Decline the service and refer the client to a physician", "Disinfect the area and proceed with gloves"], "correctAnswer": 2, "explanation": "Circular scaly patches may indicate ringworm \u2014 a contraindication. Decline and refer without diagnosing."}, {"id": "cp1-q5", "question": "Mid-haircut, your blade nicks a client and draws blood. Your FIRST action is:", "options": ["Apply a styptic pencil immediately", "Stop the service and put on gloves before touching the area", "Finish the cut quickly, then address the nick", "Ask the client if they want you to continue"], "correctAnswer": 1, "explanation": "Universal Precautions: gloves before any blood contact. Stop the service first."}, {"id": "cp1-q6", "question": "When using shears, which finger should be the only one that moves?", "options": ["Index finger", "Ring finger", "Thumb", "Pinky"], "correctAnswer": 2, "explanation": "Only the thumb moves when cutting with shears. The bottom blade stays stationary."}, {"id": "cp1-q7", "question": "A client shares personal information in the chair. Another client later asks about them. You should:", "options": ["Share only general information", "Say nothing \u2014 client conversations are confidential", "Tell them to ask the person directly", "Share if the information is not sensitive"], "correctAnswer": 1, "explanation": "Client confidentiality is an ethical obligation. All personal information stays private."}, {"id": "cp1-q8", "question": "What document is required on file for every chemical product in a barbershop?", "options": ["Product receipt", "Safety Data Sheet (SDS)", "Manufacturer warranty", "OSHA inspection report"], "correctAnswer": 1, "explanation": "OSHA requires a Safety Data Sheet (SDS) for every chemical product, accessible to all employees."}, {"id": "cp1-q9", "question": "Which consultation question is most effective for understanding what a client wants?", "options": ["Same as last time?", ", ", "Short or long?", ", ", "What are we doing today?", ", ", "Do you want a fade?"], "correctAnswer": 2, "explanation": "Open-ended questions give clients space to describe their needs rather than confirming assumptions."}, {"id": "cp1-q10", "question": "How often must disinfectant solution be changed?", "options": ["Once a week", "Once a month", "Daily or when visibly contaminated", "Only when it changes color"], "correctAnswer": 2, "explanation": "Disinfectant loses effectiveness when contaminated. Indiana requires daily changes at minimum."}]'::jsonb,
    passing_score = 70,
    updated_at = now()
  WHERE course_id = cid AND slug = 'barber-module-1-checkpoint';

END $$;

