-- Module 2 content backfill
-- Writes content, video_url, quiz_questions, passing_score to course_lessons
-- for the barber course Module 2 (Hair Science & Scalp Analysis).
-- Apply after 20260618000002_module1_release.sql

DO $$
DECLARE
  cid uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
BEGIN

  -- Lesson 8: Structure of the Hair and Scalp
  UPDATE public.course_lessons SET
    title       = 'Structure of the Hair and Scalp',
    video_url   = '/videos/course-barber-consultation-narrated.mp4',
    content     = '<h2>Structure of the Hair and Scalp</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will identify every layer of the hair shaft, understand the anatomy of the hair follicle, and describe the three layers of the scalp.</p>

<h3>Key Concepts</h3>
<ul>
  <li>The hair shaft has three layers: cuticle, cortex, medulla</li>
  <li>The follicle anchors the hair and houses the dermal papilla</li>
  <li>The scalp has three functional layers: epidermis, dermis, subcutaneous</li>
  <li>Sebaceous glands produce sebum — the scalp''s natural oil</li>
  <li>Arrector pili muscles cause goosebumps and affect hair texture appearance</li>
</ul>

<h3>Explanation</h3>
<p>Every hair on the human body grows from a follicle embedded in the scalp. Understanding the structure tells you why hair behaves the way it does — and why certain services work or fail.</p>

<h4>The Hair Shaft</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Layer</th><th>Location</th><th>Function</th></tr></thead>
  <tbody>
    <tr><td>Cuticle</td><td>Outermost</td><td>Overlapping scales that protect the inner layers; determines shine and smoothness</td></tr>
    <tr><td>Cortex</td><td>Middle</td><td>Contains melanin (color) and fibrous proteins; determines strength, elasticity, and curl pattern</td></tr>
    <tr><td>Medulla</td><td>Innermost core</td><td>Soft cells; not always present — absent in fine hair</td></tr>
  </tbody>
</table>

<h4>The Hair Follicle</h4>
<p>The follicle is the tube-shaped pocket in the dermis from which hair grows. At its base is the <strong>dermal papilla</strong> — a cluster of cells that receives blood supply and nutrients. The papilla controls hair growth. Damage to the papilla can cause permanent hair loss.</p>
<p>The <strong>sebaceous gland</strong> attaches to the follicle and secretes sebum, which lubricates the hair shaft and scalp. Overproduction causes oily scalp; underproduction causes dryness.</p>

<h4>Scalp Layers</h4>
<ul>
  <li><strong>Epidermis</strong> — the outer skin layer you can see and touch</li>
  <li><strong>Dermis</strong> — contains follicles, sebaceous glands, sweat glands, and blood vessels</li>
  <li><strong>Subcutaneous layer</strong> — fat and connective tissue that cushions and insulates</li>
</ul>

<h3>Real-World Application</h3>
<p>A client complains their hair feels rough and dull after a recent chemical service. You know the cuticle is the outermost protective layer — when it is raised or damaged by harsh chemicals, the hair loses shine and feels coarse. You recommend a protein treatment to temporarily smooth the cuticle and advise them to use a sulfate-free shampoo going forward.</p>

<h3>Summary</h3>
<ul>
  <li>Cuticle = protection and shine; cortex = color and strength; medulla = core (may be absent)</li>
  <li>The dermal papilla feeds the follicle — damage here is permanent</li>
  <li>Sebaceous glands control scalp oil balance</li>
  <li>Scalp layers: epidermis (surface) → dermis (follicles) → subcutaneous (fat)</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Sciences — Hair Structure and Growth</p>',
    quiz_questions = '[
      {"id":"m2-l8-q1","question":"Which layer of the hair shaft contains melanin and determines hair color and strength?","options":["Cuticle","Cortex","Medulla","Dermal papilla"],"correctAnswer":1,"explanation":"The cortex contains melanin granules and fibrous proteins that give hair its color, strength, and elasticity."},
      {"id":"m2-l8-q2","question":"A client''s hair looks dull and feels rough after a chemical service. Which layer was most likely damaged?","options":["Medulla","Dermal papilla","Cuticle","Subcutaneous layer"],"correctAnswer":2,"explanation":"The cuticle is the outermost protective layer. When raised or damaged, hair loses shine and feels rough."},
      {"id":"m2-l8-q3","question":"What structure at the base of the follicle supplies blood and nutrients to the hair root?","options":["Sebaceous gland","Arrector pili","Dermal papilla","Cortex"],"correctAnswer":2,"explanation":"The dermal papilla is the cluster of cells at the follicle base that receives blood supply. Damage here causes permanent hair loss."},
      {"id":"m2-l8-q4","question":"Which scalp layer contains the hair follicles, sebaceous glands, and blood vessels?","options":["Epidermis","Dermis","Subcutaneous layer","Cuticle"],"correctAnswer":1,"explanation":"The dermis is the middle layer of the scalp and contains all the active structures: follicles, glands, and vessels."},
      {"id":"m2-l8-q5","question":"Fine hair often lacks which layer of the hair shaft?","options":["Cuticle","Cortex","Medulla","Sebaceous gland"],"correctAnswer":2,"explanation":"The medulla is the innermost core and is frequently absent in fine hair without affecting function significantly."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-8';

  -- Lesson 9: Hair Growth Cycle
  UPDATE public.course_lessons SET
    title       = 'The Hair Growth Cycle',
    video_url   = '/videos/course-barber-consultation-narrated.mp4',
    content     = '<h2>The Hair Growth Cycle</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will name and describe all three phases of the hair growth cycle, explain normal daily shedding, and connect cycle knowledge to client consultations.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Hair grows in a continuous three-phase cycle: anagen, catagen, telogen</li>
  <li>Anagen is the active growth phase — 85–90% of scalp hairs are here at any time</li>
  <li>Losing 50–100 hairs per day is normal</li>
  <li>Growth rate averages ½ inch per month</li>
  <li>Stress, illness, and nutrition can disrupt the cycle</li>
</ul>

<h3>Explanation</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Phase</th><th>Duration</th><th>What Happens</th><th>% of Hairs</th></tr></thead>
  <tbody>
    <tr><td><strong>Anagen</strong> (Growth)</td><td>2–7 years</td><td>Active cell division at the papilla; hair grows ~½ inch/month</td><td>85–90%</td></tr>
    <tr><td><strong>Catagen</strong> (Transition)</td><td>2–3 weeks</td><td>Growth stops; follicle shrinks; hair detaches from papilla</td><td>1–2%</td></tr>
    <tr><td><strong>Telogen</strong> (Resting)</td><td>3–4 months</td><td>Old hair rests; new anagen hair begins pushing it out</td><td>10–15%</td></tr>
  </tbody>
</table>

<h4>Why Cycles Vary</h4>
<p>The length of the anagen phase determines maximum hair length. A person with a 7-year anagen phase can grow hair much longer than someone with a 2-year phase. This is genetic. Scalp hair has the longest anagen phase of any body hair — which is why head hair grows so much longer than eyebrows.</p>

<h4>Disruptions to the Cycle</h4>
<p>Telogen effluvium is a condition where a large number of hairs shift into telogen simultaneously, causing noticeable shedding 2–3 months after a triggering event (illness, surgery, extreme stress, crash dieting). It is usually temporary.</p>

<h3>Real-World Application</h3>
<p>A client comes in alarmed — they are losing "handfuls" of hair in the shower. They had COVID-19 three months ago. You recognize this as likely telogen effluvium triggered by illness. You reassure them it is temporary, recommend a gentle scalp massage to stimulate circulation, and advise them to see a dermatologist if shedding continues beyond six months.</p>

<h3>Summary</h3>
<ul>
  <li>Anagen = growth (2–7 years, 85–90% of hairs)</li>
  <li>Catagen = transition (2–3 weeks, follicle shrinks)</li>
  <li>Telogen = rest (3–4 months, old hair sheds)</li>
  <li>50–100 hairs/day shed is normal</li>
  <li>Telogen effluvium = mass shift to telogen after stress or illness — usually temporary</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Sciences — Hair Growth and Loss</p>',
    quiz_questions = '[
      {"id":"m2-l9-q1","question":"During which phase of the hair growth cycle is hair actively growing?","options":["Telogen","Catagen","Anagen","Exogen"],"correctAnswer":2,"explanation":"Anagen is the active growth phase. About 85-90% of scalp hairs are in anagen at any given time."},
      {"id":"m2-l9-q2","question":"A client lost significant hair 3 months after a serious illness. What condition does this most likely describe?","options":["Androgenetic alopecia","Tinea capitis","Telogen effluvium","Catagen arrest"],"correctAnswer":2,"explanation":"Telogen effluvium is a mass shift of hairs into the resting phase triggered by illness, stress, or surgery, causing noticeable shedding 2-3 months later."},
      {"id":"m2-l9-q3","question":"How much hair does the average person shed per day under normal conditions?","options":["5-10 hairs","50-100 hairs","200-300 hairs","500+ hairs"],"correctAnswer":1,"explanation":"Losing 50-100 hairs per day is normal as part of the telogen phase cycle."},
      {"id":"m2-l9-q4","question":"What determines the maximum length a person''s hair can grow?","options":["Telogen phase duration","Catagen phase duration","Anagen phase duration","Sebum production"],"correctAnswer":2,"explanation":"The length of the anagen phase determines maximum hair length. Longer anagen = longer potential hair growth."},
      {"id":"m2-l9-q5","question":"During catagen, what happens to the follicle?","options":["It produces more melanin","It shrinks and detaches from the dermal papilla","It enters rapid cell division","It produces sebum at a higher rate"],"correctAnswer":1,"explanation":"During catagen the follicle shrinks and the hair detaches from the dermal papilla, ending active growth."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-9';


  -- Lesson 10: Hair Texture, Density & Porosity
  UPDATE public.course_lessons SET
    title       = 'Hair Texture, Density, and Porosity',
    video_url   = '/videos/course-barber-consultation-narrated.mp4',
    content     = '<h2>Hair Texture, Density, and Porosity</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will distinguish between hair texture, density, and porosity, explain how each affects service selection, and apply this knowledge during client consultations.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Texture = diameter of a single hair strand (fine, medium, coarse)</li>
  <li>Density = number of hairs per square inch of scalp (low, medium, high)</li>
  <li>Porosity = hair''s ability to absorb and retain moisture</li>
  <li>These three properties are independent — a client can have fine hair with high density</li>
  <li>Misreading these properties leads to wrong product and technique choices</li>
</ul>

<h3>Explanation</h3>
<h4>Texture</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Type</th><th>Characteristics</th><th>Service Considerations</th></tr></thead>
  <tbody>
    <tr><td>Fine</td><td>Small diameter, fragile, can appear limp</td><td>Avoid heavy products; over-processing risk is high</td></tr>
    <tr><td>Medium</td><td>Most common; holds styles well</td><td>Standard techniques apply</td></tr>
    <tr><td>Coarse</td><td>Large diameter, strong, may resist chemicals</td><td>May need longer processing time; handles tension well</td></tr>
  </tbody>
</table>

<h4>Density</h4>
<p>Density affects how you section and cut. High-density hair requires more thorough sectioning to prevent bulk buildup. Low-density hair may need techniques that add visual fullness rather than remove weight.</p>

<h4>Porosity</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Type</th><th>Cuticle State</th><th>Behavior</th><th>Service Impact</th></tr></thead>
  <tbody>
    <tr><td>Low</td><td>Tight, compact</td><td>Resists moisture and chemicals</td><td>Longer processing; heat may help open cuticle</td></tr>
    <tr><td>Normal</td><td>Slightly raised</td><td>Absorbs and retains moisture well</td><td>Standard processing times</td></tr>
    <tr><td>High</td><td>Raised or damaged</td><td>Absorbs quickly, loses moisture fast</td><td>Shorter processing; protein treatments recommended</td></tr>
  </tbody>
</table>

<h3>Real-World Application</h3>
<p>A client with coarse, low-porosity hair wants a relaxer. You know low porosity resists chemical penetration. Applying the relaxer at standard timing will likely under-process. You extend processing time slightly and monitor closely — rather than assuming the standard formula will work.</p>

<h3>Summary</h3>
<ul>
  <li>Texture = strand diameter; affects fragility and product weight</li>
  <li>Density = hairs per square inch; affects sectioning and bulk management</li>
  <li>Porosity = cuticle openness; affects chemical processing and moisture retention</li>
  <li>Always assess all three before recommending a service</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Sciences — Hair Properties and Analysis</p>',
    quiz_questions = '[
      {"id":"m2-l10-q1","question":"A client has hair that absorbs chemicals quickly but the results fade fast. This describes which porosity type?","options":["Low porosity","Normal porosity","High porosity","Zero porosity"],"correctAnswer":2,"explanation":"High porosity hair has a raised or damaged cuticle that absorbs quickly but cannot retain moisture or chemicals effectively."},
      {"id":"m2-l10-q2","question":"Which hair property refers to the number of hairs per square inch of scalp?","options":["Texture","Porosity","Density","Elasticity"],"correctAnswer":2,"explanation":"Density is the count of individual hairs per square inch. It affects sectioning strategy and how bulk is managed."},
      {"id":"m2-l10-q3","question":"A client with coarse, low-porosity hair is receiving a chemical service. What adjustment is most appropriate?","options":["Shorten processing time","Use a lighter formula","Extend processing time and monitor closely","Apply heat to speed processing and reduce time"],"correctAnswer":2,"explanation":"Low porosity hair resists chemical penetration. Extending processing time (with monitoring) allows the chemical to work effectively."},
      {"id":"m2-l10-q4","question":"Fine hair is most at risk for which service problem?","options":["Under-processing","Over-processing","Excessive density","Low porosity"],"correctAnswer":1,"explanation":"Fine hair has a small diameter and is fragile. It is more susceptible to over-processing and damage from chemicals or heat."},
      {"id":"m2-l10-q5","question":"A client has thick, abundant hair that builds up weight easily. Which property best describes this?","options":["High texture","High density","High porosity","High elasticity"],"correctAnswer":1,"explanation":"High density means more hairs per square inch, which creates bulk and requires thorough sectioning to manage weight distribution."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-10';

  -- Lesson 11: Scalp Conditions & Disorders
  UPDATE public.course_lessons SET
    title       = 'Scalp Conditions and Disorders',
    video_url   = '/videos/course-barber-shampoo-narrated.mp4',
    content     = '<h2>Scalp Conditions and Disorders</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will identify the most common scalp conditions encountered in a barbershop, distinguish between contagious and non-contagious conditions, and apply the correct professional response to each.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Some scalp conditions are contagious — services must be refused</li>
  <li>Some conditions are non-contagious — services can proceed with care</li>
  <li>Barbers are not physicians — when in doubt, refer</li>
  <li>Performing services on contraindicated conditions exposes the client and barber to harm and liability</li>
  <li>Documentation protects you legally</li>
</ul>

<h3>Explanation</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Condition</th><th>Cause</th><th>Contagious?</th><th>Barber Action</th></tr></thead>
  <tbody>
    <tr><td>Dandruff (Pityriasis capitis)</td><td>Excess dead cell shedding; may involve yeast</td><td>No</td><td>Service allowed; recommend medicated shampoo</td></tr>
    <tr><td>Seborrheic Dermatitis</td><td>Inflammatory; oily, flaky patches</td><td>No</td><td>Service allowed; refer for persistent cases</td></tr>
    <tr><td>Tinea Capitis (Ringworm)</td><td>Fungal infection</td><td>Yes</td><td>Refuse service; refer to physician immediately</td></tr>
    <tr><td>Pediculosis Capitis (Head Lice)</td><td>Parasitic infestation</td><td>Yes</td><td>Refuse service; sanitize all tools; refer</td></tr>
    <tr><td>Psoriasis</td><td>Autoimmune; thick silvery scales</td><td>No</td><td>Service allowed if skin is not broken or bleeding</td></tr>
    <tr><td>Alopecia Areata</td><td>Autoimmune; patchy hair loss</td><td>No</td><td>Service allowed; refer to dermatologist</td></tr>
    <tr><td>Folliculitis</td><td>Bacterial infection of follicles</td><td>Potentially</td><td>Avoid affected area; refer if widespread</td></tr>
  </tbody>
</table>

<h4>The Referral Rule</h4>
<p>If you see open sores, active infection, unusual lesions, or anything you cannot identify — do not perform the service. Document what you observed and refer the client to a physician. This is not optional. It is a professional and legal obligation.</p>

<h3>Real-World Application</h3>
<p>A client sits in your chair and you notice circular patches of hair loss with broken-off hairs and slight scaling. This presentation matches tinea capitis. You politely decline the service, explain that you noticed a scalp condition that requires a physician''s evaluation, and do not touch the affected area. You sanitize your tools and workstation before the next client.</p>

<h3>Summary</h3>
<ul>
  <li>Tinea capitis and head lice = always refuse service</li>
  <li>Dandruff, seborrheic dermatitis, psoriasis = service allowed with care</li>
  <li>When in doubt, refer — never guess on a client''s scalp health</li>
  <li>Sanitize tools after any suspected contagious contact</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Sciences — Diseases and Disorders of the Scalp</p>',
    quiz_questions = '[
      {"id":"m2-l11-q1","question":"A client presents with circular patches of hair loss, broken-off hairs, and slight scaling. What is the correct action?","options":["Proceed with extra sanitation precautions","Perform a dry cut only","Refuse service and refer to a physician","Apply medicated shampoo and proceed"],"correctAnswer":2,"explanation":"This presentation matches tinea capitis, a contagious fungal infection. No services should be performed — refer to a physician immediately."},
      {"id":"m2-l11-q2","question":"Which of the following scalp conditions is NOT contagious?","options":["Tinea capitis","Pediculosis capitis","Psoriasis","Folliculitis"],"correctAnswer":2,"explanation":"Psoriasis is an autoimmune condition, not an infection. It is not contagious. Services can be performed if the skin is not broken."},
      {"id":"m2-l11-q3","question":"After discovering a client has head lice, what is the barber''s first obligation?","options":["Complete the service using gloves","Refuse service and sanitize all tools","Apply a medicated rinse and proceed","Document and continue"],"correctAnswer":1,"explanation":"Head lice (pediculosis capitis) is contagious. Refuse service immediately and thoroughly sanitize all tools and surfaces before the next client."},
      {"id":"m2-l11-q4","question":"A client has seborrheic dermatitis with no open sores. What is the appropriate response?","options":["Refuse service and refer","Service is allowed; recommend medicated shampoo","Apply a chemical service to reduce flaking","Perform a dry cut only"],"correctAnswer":1,"explanation":"Seborrheic dermatitis is non-contagious. Services are allowed. Recommending a medicated shampoo is appropriate professional guidance."},
      {"id":"m2-l11-q5","question":"Which principle governs when a barber must refer a client to a physician?","options":["Only when the client requests it","Whenever a condition is unidentified, contagious, or involves open sores","Only for fungal conditions","Only when the client has insurance"],"correctAnswer":1,"explanation":"The referral rule: if you cannot identify a condition, if it is contagious, or if there are open sores — refuse service and refer. This is a professional and legal obligation."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-11';

  -- Lesson 12: Client Consultation
  UPDATE public.course_lessons SET
    title       = 'Client Consultation',
    video_url   = '/videos/course-barber-consultation-narrated.mp4',
    content     = '<h2>Client Consultation</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will conduct a structured client consultation, identify contraindications before beginning a service, and communicate professionally to set accurate expectations.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Every service begins with a consultation — no exceptions</li>
  <li>The consultation protects the client and the barber legally</li>
  <li>Open-ended questions reveal more than yes/no questions</li>
  <li>Visual and tactile assessment must accompany verbal intake</li>
  <li>Managing expectations prevents dissatisfaction and disputes</li>
</ul>

<h3>Explanation</h3>
<h4>What to Assess</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Assessment Area</th><th>What to Look For</th><th>Why It Matters</th></tr></thead>
  <tbody>
    <tr><td>Hair texture and density</td><td>Fine/medium/coarse; sparse or thick</td><td>Determines technique and product selection</td></tr>
    <tr><td>Scalp condition</td><td>Dryness, flaking, lesions, redness</td><td>Identifies contraindications before service begins</td></tr>
    <tr><td>Growth patterns</td><td>Cowlicks, strong crown, neckline irregularities</td><td>Affects cut design and finish expectations</td></tr>
    <tr><td>Previous services</td><td>Chemical history, recent cuts</td><td>Prevents over-processing; informs technique</td></tr>
    <tr><td>Lifestyle and maintenance</td><td>How client styles at home, time available</td><td>Ensures the cut is realistic for the client''s routine</td></tr>
  </tbody>
</table>

<h4>Communication Technique</h4>
<p>Use open-ended questions: <em>"What are you looking for today?"</em> and <em>"How do you style your hair at home?"</em> These reveal more than <em>"Do you want a fade?"</em></p>
<p>Listen more than you talk. Repeat back what you heard: <em>"So you want to keep length on top but clean up the sides and neckline — is that right?"</em> This confirms understanding before scissors touch hair.</p>

<h4>Managing Expectations</h4>
<p>If a client''s desired result is not achievable with their current hair — due to texture, damage, or growth pattern — explain why clearly and offer realistic alternatives. Never promise results you cannot deliver. A disappointed client who was warned is far less damaging than a disappointed client who was not.</p>

<h3>Real-World Application</h3>
<p>A client shows you a photo of a tight, defined curl pattern they want to achieve. Their hair is straight and fine. Instead of attempting the impossible, you explain that the style in the photo requires a different hair type, show them what is achievable with their hair, and offer a style that complements their natural texture. The client leaves satisfied because expectations were set correctly.</p>

<h3>Summary</h3>
<ul>
  <li>Consultation is mandatory — it protects both parties</li>
  <li>Assess texture, density, scalp, growth patterns, and history before touching hair</li>
  <li>Open-ended questions and active listening prevent miscommunication</li>
  <li>Set realistic expectations — never overpromise</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Client Services — Consultation and Communication</p>',
    quiz_questions = '[
      {"id":"m2-l12-q1","question":"Which type of question is most effective during a client consultation?","options":["Yes/no questions","Closed questions","Open-ended questions","Leading questions"],"correctAnswer":2,"explanation":"Open-ended questions like ''What are you looking for today?'' reveal more information than yes/no questions and help the barber understand the client''s actual needs."},
      {"id":"m2-l12-q2","question":"A client wants a style that is not achievable with their hair type. What is the correct professional response?","options":["Attempt the style anyway","Explain why it is not achievable and offer realistic alternatives","Decline the service without explanation","Refer the client to another barber"],"correctAnswer":1,"explanation":"Managing expectations is a professional obligation. Explain the limitation clearly and offer what is realistically achievable with the client''s hair."},
      {"id":"m2-l12-q3","question":"During consultation you notice redness and scaling on the client''s scalp. What should you do before proceeding?","options":["Begin the service and monitor","Identify whether the condition is a contraindication before touching the scalp","Apply a medicated shampoo first","Ask the client if it bothers them"],"correctAnswer":1,"explanation":"Scalp assessment is part of the consultation. Identifying contraindications before service begins protects the client and the barber."},
      {"id":"m2-l12-q4","question":"Why is it important to ask about a client''s previous chemical services?","options":["To upsell additional treatments","To prevent over-processing and select appropriate techniques","To determine pricing","To assess their loyalty as a client"],"correctAnswer":1,"explanation":"Chemical history affects how the hair will respond to new services. Over-processing risk increases without this information."},
      {"id":"m2-l12-q5","question":"After explaining a service plan, the barber says: ''So you want to keep length on top but clean up the sides and neckline — is that right?'' This technique is called:","options":["Upselling","Reflective listening / confirmation","Informed consent","Intake documentation"],"correctAnswer":1,"explanation":"Repeating back what you heard confirms mutual understanding before the service begins, preventing miscommunication and disputes."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-12';

  -- Lesson 13: Shampoo & Scalp Massage
  UPDATE public.course_lessons SET
    title       = 'Shampoo Service and Scalp Massage',
    video_url   = '/videos/course-barber-shampoo-narrated.mp4',
    content     = '<h2>Shampoo Service and Scalp Massage</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will select the appropriate shampoo for a client''s hair type, perform the shampoo procedure in correct sequence, and execute a professional scalp massage using proper technique.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Shampoo selection is based on hair type and scalp condition — not preference alone</li>
  <li>Water temperature must be tested before application</li>
  <li>Scalp massage uses fingertips, not fingernails</li>
  <li>Rotary, effleurage, and petrissage are the three massage movements used in barbering</li>
  <li>Thorough rinsing is non-negotiable — residue causes buildup and scalp irritation</li>
</ul>

<h3>Explanation</h3>
<h4>Shampoo Selection</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Hair/Scalp Type</th><th>Shampoo Type</th><th>Reason</th></tr></thead>
  <tbody>
    <tr><td>Normal</td><td>Balanced pH (4.5–5.5)</td><td>Maintains natural moisture balance</td></tr>
    <tr><td>Oily scalp</td><td>Clarifying</td><td>Removes excess sebum and buildup</td></tr>
    <tr><td>Dry or damaged</td><td>Moisturizing</td><td>Adds hydration without stripping</td></tr>
    <tr><td>Color-treated</td><td>Sulfate-free</td><td>Preserves color and reduces fade</td></tr>
    <tr><td>Dandruff</td><td>Medicated (zinc pyrithione or selenium sulfide)</td><td>Targets yeast and excess cell turnover</td></tr>
  </tbody>
</table>

<h4>Shampoo Procedure (8 Steps)</h4>
<ol>
  <li>Drape client with towel and cape</li>
  <li>Position client at shampoo bowl</li>
  <li>Test water temperature on your wrist before applying to client</li>
  <li>Wet hair thoroughly from roots to ends</li>
  <li>Apply shampoo — amount based on hair density</li>
  <li>Work into lather using rotary massage movements with fingertip pads (never nails)</li>
  <li>Rinse thoroughly until water runs clear</li>
  <li>Apply conditioner if indicated; rinse; towel dry gently</li>
</ol>

<h4>Scalp Massage Movements</h4>
<ul>
  <li><strong>Effleurage</strong> — light, gliding strokes; used to begin and end the massage</li>
  <li><strong>Petrissage</strong> — kneading movements; stimulates circulation and relaxes muscle tension</li>
  <li><strong>Rotary</strong> — circular movements with fingertip pads; primary movement during shampooing</li>
</ul>

<h3>Real-World Application</h3>
<p>A client with an oily scalp and color-treated hair presents a conflict: clarifying shampoo would address the oil but strip the color. You select a gentle sulfate-free shampoo with a clarifying rinse on the scalp only, protecting the color-treated lengths while addressing the oiliness at the root.</p>

<h3>Summary</h3>
<ul>
  <li>Match shampoo to hair type and scalp condition — not habit</li>
  <li>Always test water temperature on your wrist first</li>
  <li>Use fingertip pads, not nails, during scalp massage</li>
  <li>Rinse until water runs clear — no residue</li>
  <li>Effleurage, petrissage, and rotary are the three massage movements</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Client Services — Shampoo and Scalp Treatments</p>',
    quiz_questions = '[
      {"id":"m2-l13-q1","question":"Which shampoo type is most appropriate for color-treated hair?","options":["Clarifying","Medicated","Sulfate-free","Balancing"],"correctAnswer":2,"explanation":"Sulfate-free shampoo preserves color by avoiding harsh detergents that strip the hair shaft and accelerate color fade."},
      {"id":"m2-l13-q2","question":"Where should you test water temperature before applying it to a client''s scalp?","options":["Back of your hand","Your wrist","The client''s hand","The shampoo bowl edge"],"correctAnswer":1,"explanation":"Testing on your wrist gives a more accurate sensitivity reading than the back of the hand, helping prevent scalp burns."},
      {"id":"m2-l13-q3","question":"During shampooing, which part of the hand should contact the scalp?","options":["Fingernails","Knuckles","Fingertip pads","Palm only"],"correctAnswer":2,"explanation":"Fingertip pads provide effective massage without scratching or irritating the scalp. Fingernails can cause abrasions and introduce infection risk."},
      {"id":"m2-l13-q4","question":"A client has an oily scalp and color-treated hair. Which approach best addresses both concerns?","options":["Use clarifying shampoo throughout","Use sulfate-free shampoo throughout","Use clarifying shampoo on scalp only, protect color-treated lengths","Use medicated shampoo and skip conditioner"],"correctAnswer":2,"explanation":"Targeting the clarifying action to the scalp only addresses oiliness while protecting the color-treated lengths from stripping."},
      {"id":"m2-l13-q5","question":"Which massage movement consists of light, gliding strokes used to begin and end a scalp massage?","options":["Petrissage","Rotary","Effleurage","Tapotement"],"correctAnswer":2,"explanation":"Effleurage is the light gliding stroke used to open and close a massage sequence. It relaxes the client and transitions between movements."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-13';

  -- Module 2 Checkpoint
  UPDATE public.course_lessons SET
    title         = 'Module 2 Checkpoint — Hair Science & Scalp Analysis',
    video_url     = NULL,
    content       = '<h2>Module 2 Checkpoint</h2>
<p>This checkpoint covers all six lessons in Module 2: Structure of the Hair and Scalp, The Hair Growth Cycle, Hair Texture/Density/Porosity, Scalp Conditions and Disorders, Client Consultation, and Shampoo Service and Scalp Massage.</p>
<p>You must score <strong>70% or higher</strong> to unlock Module 3. Review your lesson notes before beginning.</p>',
    quiz_questions = '[
      {"id":"m2-cp-q1","question":"Which layer of the hair shaft contains melanin and determines hair color?","options":["Cuticle","Cortex","Medulla","Dermal papilla"],"correctAnswer":1,"explanation":"The cortex contains melanin granules that give hair its color and fibrous proteins that determine strength."},
      {"id":"m2-cp-q2","question":"During which phase of the hair growth cycle is hair actively growing?","options":["Telogen","Catagen","Anagen","Exogen"],"correctAnswer":2,"explanation":"Anagen is the active growth phase, lasting 2-7 years. About 85-90% of scalp hairs are in anagen at any time."},
      {"id":"m2-cp-q3","question":"A client presents with tinea capitis. What is the correct action?","options":["Proceed with extra sanitation","Perform a dry cut only","Refuse service and refer to a physician","Use medicated shampoo and proceed"],"correctAnswer":2,"explanation":"Tinea capitis is a contagious fungal infection. No services should be performed — refer to a physician immediately."},
      {"id":"m2-cp-q4","question":"Hair that absorbs moisture quickly but loses it fast has which porosity type?","options":["Low porosity","Normal porosity","High porosity","No porosity"],"correctAnswer":2,"explanation":"High porosity hair has a damaged cuticle that cannot retain moisture or chemicals effectively."},
      {"id":"m2-cp-q5","question":"Where should you test water temperature before shampooing a client?","options":["Back of your hand","Your wrist","Ask the client to test it","Use cold water always"],"correctAnswer":1,"explanation":"Testing on your wrist gives a more accurate temperature reading and helps prevent scalp burns."},
      {"id":"m2-cp-q6","question":"Approximately how many hairs does a person normally shed per day?","options":["5-10","50-100","200-300","500+"],"correctAnswer":1,"explanation":"Losing 50-100 hairs per day is normal as part of the telogen phase cycle."},
      {"id":"m2-cp-q7","question":"A client with coarse, low-porosity hair is receiving a chemical service. What adjustment is most appropriate?","options":["Shorten processing time","Use a lighter formula","Extend processing time and monitor closely","Apply heat to reduce time"],"correctAnswer":2,"explanation":"Low porosity hair resists chemical penetration. Extending processing time allows the chemical to work effectively."},
      {"id":"m2-cp-q8","question":"Which massage movement consists of kneading motions that stimulate circulation?","options":["Effleurage","Rotary","Petrissage","Tapotement"],"correctAnswer":2,"explanation":"Petrissage is the kneading movement that stimulates blood circulation and relaxes muscle tension in the scalp."},
      {"id":"m2-cp-q9","question":"During a consultation, a client wants a style that is not achievable with their hair type. What is the correct response?","options":["Attempt the style anyway","Explain the limitation and offer realistic alternatives","Decline without explanation","Refer to another barber"],"correctAnswer":1,"explanation":"Managing expectations is a professional obligation. Explain clearly and offer what is realistically achievable."},
      {"id":"m2-cp-q10","question":"Which structure at the base of the follicle, if permanently damaged, causes irreversible hair loss?","options":["Sebaceous gland","Arrector pili","Dermal papilla","Cuticle"],"correctAnswer":2,"explanation":"The dermal papilla supplies blood and nutrients to the hair root. Permanent damage to it stops hair growth in that follicle."}
    ]'::jsonb,
    passing_score = 70,
    is_published = true,
    updated_at    = now()
  WHERE course_id = cid AND slug = 'barber-module-2-checkpoint';

END $$;
