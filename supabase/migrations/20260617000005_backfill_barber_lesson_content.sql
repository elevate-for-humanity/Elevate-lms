-- Backfill video_url and content on barber course_lessons from blueprint
-- Generated from lib/curriculum/blueprints/barber-apprenticeship.ts
-- 50 lessons

DO $$
DECLARE
  barber_course_id uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
BEGIN

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-course-intro-with-voice.mp4',
    content = '<h2>Welcome to Your Barber Apprenticeship</h2>
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
<p>Each module ends with a checkpoint quiz. You must score 70% or higher to advance. Your on-the-job hours are logged separately with your host shop supervisor.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-1';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>OSHA in the Barbershop</h2>
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
<p>Used razor blades must be placed in a puncture-resistant sharps container — never in a regular trash can.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-2';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation.mp4',
    content = '<h2>Three Levels of Decontamination</h2>
<h3>Sanitation</h3>
<p>Sanitation reduces the number of pathogens on a surface to a safe level. Example: washing hands with soap and water, wiping down a chair with a clean cloth.</p>
<h3>Disinfection</h3>
<p>Disinfection destroys most pathogens on non-living surfaces. In Indiana, barbershops must use an EPA-registered disinfectant on all tools between clients.</p>
<ul>
<li>Immerse metal tools in disinfectant solution for the manufacturer''s recommended time</li>
<li>Combs and brushes must be fully submerged</li>
<li>Disinfectant solution must be changed daily or when visibly contaminated</li>
</ul>
<h3>Sterilization</h3>
<p>Sterilization destroys all microorganisms including spores. Autoclave sterilization is the gold standard but not required for most barbershop tools.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-3';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Disinfecting Your Tools</h2>
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
<p>The Indiana Professional Licensing Agency requires all barbershops to maintain a disinfection log. Tools found undisinfected during inspection result in immediate citation.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-4';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Keeping Your Station Clean</h2>
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
<p>Do not perform services on clients with visible scalp infections, open wounds, or contagious skin conditions. Refer them to a physician.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-5';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Indiana Barbering Laws</h2>
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
<p>Practicing without a license, failing inspections, or violating sanitation standards can result in fines, suspension, or revocation of license.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-6';

  UPDATE public.course_lessons SET
    content = '<h2>Module 1 Review — Infection Control & Safety</h2><p>Review the key concepts before taking this checkpoint: sanitation vs. disinfection vs. sterilization, OSHA bloodborne pathogen standards, tool disinfection procedures, Indiana barbering laws, and client contraindications. You must score 70% or higher to advance to Module 2.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-1-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation-narrated.mp4',
    content = '<h2>Hair and Scalp Anatomy</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-8';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation-narrated.mp4',
    content = '<h2>The Hair Growth Cycle</h2>
<p>Hair grows in a continuous cycle with three distinct phases:</p>
<h3>Anagen (Growth Phase)</h3>
<p>Active growth phase lasting 2–7 years. About 85% of scalp hairs are in anagen at any time. Hair grows approximately 1/2 inch per month.</p>
<h3>Catagen (Transition Phase)</h3>
<p>A short transitional phase lasting 2–3 weeks. The follicle shrinks and detaches from the dermal papilla.</p>
<h3>Telogen (Resting Phase)</h3>
<p>The resting phase lasting 3–4 months. The old hair is shed and a new anagen hair begins to grow. Losing 50–100 hairs per day is normal.</p>
<h3>Why This Matters for Barbers</h3>
<p>Understanding the growth cycle helps explain why haircuts grow out at different rates and why some clients experience thinning.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-9';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation-narrated.mp4',
    content = '<h2>Hair Properties</h2>
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
<p>Porosity is the hair''s ability to absorb moisture:</p>
<ul>
<li><strong>Low porosity</strong> — cuticle is tight; resists moisture and chemicals</li>
<li><strong>Normal porosity</strong> — absorbs and retains moisture well</li>
<li><strong>High porosity</strong> — damaged cuticle; absorbs quickly but loses moisture fast</li>
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-10';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-shampoo-narrated.mp4',
    content = '<h2>Common Scalp Conditions</h2>
<h3>Dandruff (Pityriasis)</h3>
<p>Excessive shedding of dead scalp cells. Can be treated with medicated shampoos. Not contagious.</p>
<h3>Seborrheic Dermatitis</h3>
<p>Inflammatory condition causing red, flaky, greasy patches. More severe than dandruff. Refer to a dermatologist for persistent cases.</p>
<h3>Tinea Capitis (Ringworm)</h3>
<p>A fungal infection of the scalp. Highly contagious. Do NOT perform services — refer to a physician immediately.</p>
<h3>Alopecia</h3>
<p>Hair loss that can be caused by genetics, stress, hormones, or autoimmune conditions. Androgenetic alopecia (male pattern baldness) is the most common type.</p>
<h3>Psoriasis</h3>
<p>Autoimmune condition causing thick, silvery scales. Not contagious. Services can be performed if skin is not broken.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-11';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation-narrated.mp4',
    content = '<h2>The Client Consultation</h2>
<p>Every service begins with a consultation. This protects you legally and ensures client satisfaction.</p>
<h3>What to Assess</h3>
<ul>
<li>Hair type, texture, density, and porosity</li>
<li>Scalp condition — any contraindications?</li>
<li>Client''s desired style and lifestyle</li>
<li>Previous chemical services</li>
<li>Allergies or sensitivities</li>
</ul>
<h3>Communication Skills</h3>
<p>Use open-ended questions: "What are you looking for today?" and "How do you style your hair at home?" Listen more than you talk.</p>
<h3>Managing Expectations</h3>
<p>If a client''s desired style is not achievable with their hair type, explain why and offer realistic alternatives. Never promise results you cannot deliver.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-12';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-shampoo-narrated.mp4',
    content = '<h2>Shampoo Service</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-13';

  UPDATE public.course_lessons SET
    content = '<h2>Module 2 Review — Hair Science & Scalp Analysis</h2><p>Review before taking this checkpoint: hair shaft layers (cuticle, cortex, medulla), the three growth phases (anagen, catagen, telogen), hair texture/density/porosity, common scalp conditions and contraindications, client consultation, and shampoo procedure. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-2-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-clipper-techniques.mp4',
    content = '<h2>Clippers and Trimmers</h2>
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
<p>Trimmers (T-liners) are used for edging, lining, and detail work. They have a narrower blade than clippers.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-15';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-scissors-narrated.mp4',
    content = '<h2>Scissors and Shears</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-16';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-razor-narrated.mp4',
    content = '<h2>Razors in Barbering</h2>
<h3>Straight Razor (Cut-Throat Razor)</h3>
<p>The traditional barber''s razor. Requires skill and practice. Used for shaving, edging, and razor cutting techniques.</p>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-17';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-clipper-techniques.mp4',
    content = '<h2>Clipper Maintenance</h2>
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
<p>Never submerge clippers in liquid. Keep vents clear of hair buildup. Store in a dry location.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-18';

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-client-experience.mp4',
    content = '<h2>Ergonomics for Barbers</h2>
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
<p>Take a 5-minute break every 2 hours. Sit down, stretch, and rest your hands.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-19';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation.mp4',
    content = '<h2>Draping the Client</h2>
<h3>Haircut Draping</h3>
<ol>
<li>Place a clean neck strip around the client''s neck</li>
<li>Drape the cutting cape over the client</li>
<li>Secure the cape — snug but not tight</li>
<li>Tuck the neck strip over the cape collar to prevent hair from falling inside</li>
</ol>
<h3>Shave Draping</h3>
<ol>
<li>Recline the chair to a comfortable shaving position</li>
<li>Place a clean towel across the client''s chest</li>
<li>Tuck a neck strip or towel around the collar</li>
</ol>
<h3>Why Draping Matters</h3>
<p>Proper draping protects the client''s clothing, prevents hair from irritating the skin, and presents a professional image.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-20';

  UPDATE public.course_lessons SET
    content = '<h2>Module 3 Review — Tools, Equipment & Ergonomics</h2><p>Review before taking this checkpoint: clipper types and guard sizes, shear types and proper grip, straight razor vs. shavette safety, clipper maintenance, ergonomic posture, and proper client draping. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-3-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-fade-narrated.mp4',
    content = '<h2>Head Shape and Sectioning</h2>
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
<p>Consistent sectioning ensures even weight distribution and a balanced haircut. Always establish your guide line before cutting.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-22';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-fade-narrated.mp4',
    content = '<h2>The Fade</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-23';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-clipper-techniques.mp4',
    content = '<h2>Clipper Over Comb</h2>
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
<li>Not following the head''s curve — creates flat spots</li>
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-24';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-scissors.mp4',
    content = '<h2>Scissor Over Comb</h2>
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
<p>Slide cutting thins and tapers hair by sliding the open shears down the hair shaft. Used for blending and removing bulk.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-25';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-lineup-narrated.mp4',
    content = '<h2>Lineup and Edging</h2>
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
<p>The nape can be squared, rounded, or tapered. Ask the client their preference. A squared nape looks sharp but grows out faster.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-26';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-scissors-narrated.mp4',
    content = '<h2>Classic Barbering Cuts</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-27';

  UPDATE public.course_lessons SET
    content = '<h2>Module 4 Review — Haircutting Techniques</h2><p>Review before taking this checkpoint: head sections and reference points, low/mid/high fade technique, clipper over comb, scissor over comb, lineup and edging, and classic cuts. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-4-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-razor-narrated.mp4',
    content = '<h2>Shave Preparation</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-29';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-razor-narrated.mp4',
    content = '<h2>Straight Razor Shaving</h2>
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
<p>Use short, controlled strokes. Rinse the blade after every 2–3 strokes. Never drag the razor.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-30';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-beard-narrated.mp4',
    content = '<h2>Beard Design</h2>
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
<li><strong>Neckline</strong> — two finger-widths above the Adam''s apple; the most common mistake is setting it too high</li>
<li><strong>Mustache line</strong> — follow the natural lip line</li>
</ul>
<h3>Trimming Technique</h3>
<ol>
<li>Comb beard downward to its natural fall</li>
<li>Trim to desired length with guards</li>
<li>Define lines with trimmer and razor</li>
<li>Apply beard oil to finish</li>
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-31';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-beard-narrated.mp4',
    content = '<h2>Post-Shave Care</h2>
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
<p>Common in clients with curly hair. Caused by ingrown hairs. Recommend shaving with the grain only and using a single-blade razor.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-32';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-beard.mp4',
    content = '<h2>Mustache Services</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-33';

  UPDATE public.course_lessons SET
    content = '<h2>Module 5 Review — Shaving & Beard Services</h2><p>Review before taking this checkpoint: hot towel preparation, straight razor angle and three-pass technique, beard design by face shape, neckline placement, post-shave care, and razor bump prevention. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-5-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-styling-narrated.mp4',
    content = '<h2>Hair Color Theory</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-35';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Chemical Safety</h2>
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
<p>Do not perform chemical services on clients with: scalp abrasions, recent chemical services, known allergies to ingredients, or compromised scalp health.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-36';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-styling-narrated.mp4',
    content = '<h2>Relaxers and Texturizers</h2>
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
<li>Process only to the manufacturer''s recommended time</li>
<li>Neutralize thoroughly — stops the chemical process</li>
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-37';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-shampoo-narrated.mp4',
    content = '<h2>Scalp Treatments</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-38';

  UPDATE public.course_lessons SET
    content = '<h2>Module 6 Review — Chemical Services</h2><p>Review before taking this checkpoint: color wheel and hair color levels, types of hair color, patch testing, chemical safety PPE, relaxer chemistry and application rules, and scalp treatments. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-6-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-consultation.mp4',
    content = '<h2>Building Your Clientele</h2>
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
<p>Post your work consistently. Before-and-after photos with client permission are the most effective content. Use local hashtags and tag your shop location.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-40';

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-shop-culture.mp4',
    content = '<h2>Barbershop Business Models</h2>
<h3>Commission</h3>
<p>You work for the shop owner and receive a percentage of your service revenue (typically 40-60%). The shop provides clients, supplies, and equipment. Good for new barbers building skills.</p>
<h3>Booth Rental</h3>
<p>You pay the shop owner a weekly or monthly fee to use a chair. You keep 100% of your service revenue. You are self-employed — responsible for your own taxes, supplies, and clients.</p>
<h3>Shop Ownership</h3>
<p>You own the business. Maximum income potential but maximum responsibility. Requires business license, shop license, and significant startup capital.</p>
<h3>Which is Right for You?</h3>
<p>Most barbers start on commission, move to booth rental as they build clientele, and consider ownership after 5+ years of experience.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-41';

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-shop-culture.mp4',
    content = '<h2>Pricing and Finances</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-42';

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-client-experience.mp4',
    content = '<h2>Professionalism and Ethics</h2>
<h3>The Barber''s Code</h3>
<ul>
<li>Never speak negatively about other barbers or shops</li>
<li>Respect client confidentiality — what happens in the chair stays in the chair</li>
<li>Do not perform services outside your scope of practice</li>
<li>Be honest about what you can and cannot achieve</li>
</ul>
<h3>Handling Difficult Clients</h3>
<p>Stay calm. Listen. Offer to fix the issue at no charge if it is your error. If a client is abusive, you have the right to refuse service.</p>
<h3>Continuing Education</h3>
<p>The barbering industry evolves constantly. Attend trade shows, watch tutorials, and practice new techniques. Indiana requires continuing education for license renewal.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-43';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-styling-narrated.mp4',
    content = '<h2>Styling Products</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-44';

  UPDATE public.course_lessons SET
    content = '<h2>Module 7 Review — Professional & Business Skills</h2><p>Review before taking this checkpoint: client retention strategies, booth rental vs. commission vs. ownership, pricing and taxes, professional ethics, and styling products. Score 70% or higher to advance.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-module-7-checkpoint';

  UPDATE public.course_lessons SET
    video_url = '/videos/barber-course-intro-with-voice.mp4',
    content = '<h2>Indiana State Board Exam</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-46';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-sanitation-narrated.mp4',
    content = '<h2>Written Exam Review: Sanitation & Science</h2>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-47';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-fade-narrated.mp4',
    content = '<h2>Written Exam Review: Techniques & Laws</h2>
<h3>Key Technique Facts</h3>
<ul>
<li>Parietal ridge = widest part of head = high fade reference</li>
<li>Occipital bone = back of skull = low/mid fade reference</li>
<li>Razor angle = 30 degrees</li>
<li>Neckline = 2 finger-widths above Adam''s apple</li>
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
</ul>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-48';

  UPDATE public.course_lessons SET
    video_url = '/videos/course-barber-scissors-narrated.mp4',
    content = '<h2>Practical Exam Preparation</h2>
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
</ol>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-lesson-49';

  UPDATE public.course_lessons SET
    content = '<h2>Program Final Exam</h2><p>This exam covers all eight modules of the Barber Apprenticeship program. Topics include infection control, hair science, tools and equipment, haircutting techniques, shaving and beard services, chemical services, professional skills, and Indiana state board exam preparation. You must score 70% or higher to complete the program.</p>',
    updated_at = now()
  WHERE course_id = barber_course_id AND slug = 'barber-indiana-state-board-exam';

END $$;
