-- Module 3 content backfill — Part 1 (Lessons 15–17)
-- Haircutting Theory & Techniques
-- Apply after 20260618000003_module2_content.sql

DO $$
DECLARE
  cid uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
BEGIN

  -- Lesson 15: Foundations of Haircutting
  UPDATE public.course_lessons SET
    title       = 'Foundations of Haircutting',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Foundations of Haircutting</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will define the five foundational principles of haircutting, explain how each affects the finished result, and apply them to describe why a haircut succeeds or fails technically.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Form</strong> — the overall three-dimensional shape of the haircut</li>
  <li><strong>Line</strong> — the visual edge or outline that defines the silhouette</li>
  <li><strong>Balance</strong> — the symmetrical or intentionally asymmetrical relationship between sides</li>
  <li><strong>Guideline</strong> — the section of hair that determines how long the next section is cut</li>
  <li><strong>Tension</strong> — the amount of pull applied to the hair during cutting; affects length accuracy</li>
</ul>

<h3>Explanation</h3>
<h4>Why Principles Matter</h4>
<p>Haircutting is not the random removal of length. It is the controlled removal of length to create a specific shape, balance, and movement. Every decision — where to cut, how much to remove, which angle to hold — is a design decision. A barber who works from principles can reproduce results consistently. A barber who works from habit cannot.</p>

<h4>The Five Principles</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Principle</th><th>Definition</th><th>Effect on the Cut</th></tr></thead>
  <tbody>
    <tr><td>Form</td><td>The 3D shape of the finished haircut</td><td>Determines whether the cut looks round, square, layered, or graduated</td></tr>
    <tr><td>Line</td><td>The visual edge — straight, curved, diagonal, or horizontal</td><td>Creates the silhouette and perimeter shape</td></tr>
    <tr><td>Balance</td><td>Equal or intentionally unequal weight on both sides</td><td>Symmetrical cuts require matched sides; asymmetrical cuts require deliberate imbalance</td></tr>
    <tr><td>Guideline</td><td>The reference section that controls all subsequent sections</td><td>Determines consistency — a bad guideline produces a bad cut regardless of technique</td></tr>
    <tr><td>Tension</td><td>The pull applied to hair before cutting</td><td>Inconsistent tension produces uneven lengths even when the angle is correct</td></tr>
  </tbody>
</table>

<h4>Guideline Types</h4>
<p>A <strong>stationary guideline</strong> stays in one place. All subsequent sections are brought to it. This creates increasing length as you move away from the guide — used in one-length and graduated cuts.</p>
<p>A <strong>traveling guideline</strong> moves with each new section. A small amount of the previously cut section is included in the next section as the new guide. This creates uniform layering throughout the cut.</p>

<h3>Real-World Application</h3>
<p>A client returns and says their last cut looked different every time. The barber had no system — no consistent guideline, no controlled tension. You establish a stationary guideline at the perimeter, maintain even tension on every section, and the result is reproducible. The client notices the difference immediately.</p>

<h3>Summary</h3>
<ul>
  <li>Form, line, balance, guideline, and tension are the five foundational principles</li>
  <li>A guideline controls consistency — stationary creates graduation, traveling creates uniform layers</li>
  <li>Inconsistent tension produces uneven lengths even with correct angles</li>
  <li>Technical principles make results reproducible, not accidental</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Principles and Theory</p>',
    quiz_questions = '[
      {"id":"m3-l15-q1","question":"What is the purpose of a guideline in haircutting?","options":["To determine the shampoo used","To control the length of all subsequent sections","To set the water temperature","To select the correct clipper guard"],"correctAnswer":1,"explanation":"A guideline is the reference section that controls how long every subsequent section is cut. It is the foundation of consistency."},
      {"id":"m3-l15-q2","question":"A barber uses a small amount of the previously cut section as the guide for the next section. This is a:","options":["Stationary guideline","Traveling guideline","Perimeter guideline","Elevation guideline"],"correctAnswer":1,"explanation":"A traveling guideline moves with each new section, incorporating a piece of the previously cut hair. This creates uniform layering throughout the cut."},
      {"id":"m3-l15-q3","question":"A client''s haircut looks uneven even though the barber used the correct cutting angle. What is the most likely cause?","options":["Wrong shampoo used","Inconsistent tension applied to sections","Wrong clipper guard","Incorrect shampoo bowl position"],"correctAnswer":1,"explanation":"Inconsistent tension changes the effective length of hair before the cut is made. Even with correct angles, uneven tension produces uneven results."},
      {"id":"m3-l15-q4","question":"Which principle refers to the three-dimensional shape of the finished haircut?","options":["Line","Balance","Form","Tension"],"correctAnswer":2,"explanation":"Form is the overall 3D shape of the haircut — whether it appears round, square, graduated, or layered when viewed from all angles."},
      {"id":"m3-l15-q5","question":"A stationary guideline is used to create which type of result?","options":["Uniform layers throughout","Increasing length as sections move away from the guide","Decreasing length toward the neckline","Equal length on all sections"],"correctAnswer":1,"explanation":"A stationary guideline stays in place while subsequent sections are brought to it, creating increasing length as you move away — used in one-length and graduated cuts."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-15';

  -- Lesson 16: Sectioning, Parting, and Control
  UPDATE public.course_lessons SET
    title       = 'Sectioning, Parting, and Control',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Sectioning, Parting, and Control</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will explain the difference between sectioning and parting, identify stationary and traveling guidelines in context, and describe how distribution affects weight and shape.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Sectioning</strong> — dividing the entire head into workable areas before cutting begins</li>
  <li><strong>Parting</strong> — the individual lines that separate sections within those areas</li>
  <li><strong>Distribution</strong> — the direction hair is combed before cutting; affects weight placement</li>
  <li><strong>Subsection</strong> — a smaller division within a section, used for precision work</li>
  <li>Clean partings prevent overcutting and keep the cut organized</li>
</ul>

<h3>Explanation</h3>
<h4>Sectioning vs. Parting</h4>
<p>Sectioning is the macro-level organization of the head. Before any cutting begins, the barber divides the head into zones — typically top, sides, and back — using clips or pins. This prevents hair from falling into areas already cut and keeps the work organized.</p>
<p>Parting is the micro-level line within a section. Each parting creates the subsection that will be held and cut. The cleanliness of the parting directly affects the accuracy of the cut. A sloppy parting introduces stray hairs from adjacent sections, creating inconsistency.</p>

<h4>Distribution</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Distribution Type</th><th>Direction</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>Natural</td><td>Hair falls in its natural direction</td><td>Preserves natural weight and movement</td></tr>
    <tr><td>Perpendicular</td><td>Hair combed at 90° to the parting</td><td>Creates uniform layering</td></tr>
    <tr><td>Shifted</td><td>Hair combed away from natural fall</td><td>Creates directional weight or asymmetry</td></tr>
  </tbody>
</table>

<h4>Why Setup Determines Outcome</h4>
<p>Poor sectioning creates poor results even when hand skills are strong. If sections are uneven, the guideline is compromised before the first cut. If partings are sloppy, stray hairs from adjacent sections get cut at the wrong length. The setup is not preparation — it is part of the cut.</p>

<h3>Real-World Application</h3>
<p>A student attempts a fade and layered top without establishing clean sections first. Weight builds unevenly on one side and the blend collapses at the parietal ridge. The problem is not technique — the setup was wrong from the start. Re-sectioning cleanly and re-establishing the guideline corrects the issue.</p>

<h3>Summary</h3>
<ul>
  <li>Sectioning = macro organization of the head; parting = micro lines within sections</li>
  <li>Clean partings prevent stray hairs and maintain guideline integrity</li>
  <li>Distribution direction determines where weight sits in the finished cut</li>
  <li>Setup is not separate from the cut — it is the foundation of the cut</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Sectioning and Control</p>',
    quiz_questions = '[
      {"id":"m3-l16-q1","question":"What is the primary purpose of sectioning the head before cutting?","options":["To select the correct shampoo","To organize the head into workable areas and prevent overcutting","To determine the client''s face shape","To identify scalp conditions"],"correctAnswer":1,"explanation":"Sectioning divides the head into organized zones before cutting begins, preventing hair from falling into already-cut areas and keeping the work controlled."},
      {"id":"m3-l16-q2","question":"A barber notices one side of a haircut is heavier than the other after cutting. The most likely cause is:","options":["Wrong clipper guard used","Inconsistent distribution direction between sides","Too much shampoo applied","Incorrect water temperature"],"correctAnswer":1,"explanation":"Distribution — the direction hair is combed before cutting — directly affects where weight sits. Inconsistent distribution between sides creates asymmetrical weight."},
      {"id":"m3-l16-q3","question":"Hair combed at 90 degrees to the parting line before cutting creates which effect?","options":["Natural weight preservation","Uniform layering","Directional asymmetry","A strong weight line"],"correctAnswer":1,"explanation":"Perpendicular distribution (90° to the parting) creates uniform layering because each section is held at the same angle relative to the head."},
      {"id":"m3-l16-q4","question":"Sloppy partings during a haircut most directly cause:","options":["Incorrect shampoo selection","Stray hairs from adjacent sections being cut at the wrong length","Scalp irritation","Incorrect water temperature"],"correctAnswer":1,"explanation":"Sloppy partings allow hairs from neighboring sections to enter the subsection being cut, compromising the guideline and creating inconsistency."},
      {"id":"m3-l16-q5","question":"Which distribution type combs hair away from its natural fall to create directional weight?","options":["Natural distribution","Perpendicular distribution","Shifted distribution","Stationary distribution"],"correctAnswer":2,"explanation":"Shifted distribution moves hair away from its natural fall direction, creating intentional directional weight or asymmetry in the finished cut."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-16';

  -- Lesson 17: Elevation, Angles, and Weight Distribution
  UPDATE public.course_lessons SET
    title       = 'Elevation, Angles, and Weight Distribution',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Elevation, Angles, and Weight Distribution</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will define elevation, identify the four standard elevation angles, predict the weight outcome of each, and explain why angle selection is the most consequential technical decision in haircutting.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Elevation</strong> — the angle at which hair is held from the head before cutting</li>
  <li>Lower elevation = more weight retained; higher elevation = more weight removed</li>
  <li>0° creates a strong weight line; 90° creates uniform layering; 180° creates maximum layering</li>
  <li><strong>Weight line</strong> — the area of maximum weight in a haircut; where hair falls heaviest</li>
  <li>Elevation is independent of guideline — both must be controlled simultaneously</li>
</ul>

<h3>Explanation</h3>
<h4>The Four Standard Elevations</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Elevation</th><th>Hair Position</th><th>Weight Result</th><th>Common Use</th></tr></thead>
  <tbody>
    <tr><td>0° (no elevation)</td><td>Hair falls at natural position</td><td>Maximum weight; strong weight line</td><td>One-length cuts, blunt perimeter</td></tr>
    <tr><td>45°</td><td>Hair held halfway between natural fall and perpendicular</td><td>Moderate weight; soft graduation</td><td>Graduated bob, soft layers</td></tr>
    <tr><td>90°</td><td>Hair held perpendicular to the head</td><td>Uniform layering; weight removed evenly</td><td>Uniform layer cuts, round layers</td></tr>
    <tr><td>180°</td><td>Hair held above the head</td><td>Maximum layering; shortest interior, longest perimeter</td><td>Long layers, high-elevation cuts</td></tr>
  </tbody>
</table>

<h4>Why This Is the Most Important Variable</h4>
<p>Many weak programs teach styles without teaching the mechanical reason the style works. Elevation is that reason. The same guideline, the same parting, the same tension — but a different elevation — produces a completely different haircut. A barber who does not understand elevation is guessing at the outcome of every cut.</p>

<h4>Weight Line Placement</h4>
<p>The weight line is where the hair falls heaviest. At 0° elevation, the weight line sits at the perimeter. As elevation increases, the weight line moves up the head. Understanding where the weight line will land before cutting is what separates technical barbers from stylists who cut by feel.</p>

<h3>Real-World Application</h3>
<p>A client wants softness and movement but the barber cuts everything at 0° elevation. The result is heavy and boxy — the weight line sits at the perimeter and the interior has no movement. Switching to 45° on the sides and 90° on the top removes the excess weight and creates the movement the client wanted. The fix was not a different style — it was a different elevation.</p>

<h3>Summary</h3>
<ul>
  <li>Elevation controls weight — lower angle keeps weight, higher angle removes it</li>
  <li>0° = weight line at perimeter; 90° = uniform layers; 180° = maximum layering</li>
  <li>Elevation is the most consequential technical variable in haircutting</li>
  <li>Weight line placement must be planned before cutting begins</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Elevation and Weight Control</p>',
    quiz_questions = '[
      {"id":"m3-l17-q1","question":"A barber holds hair at 0 degrees elevation and cuts. What is the primary result?","options":["Maximum layering throughout","Uniform layers","A strong weight line at the perimeter","Soft graduation"],"correctAnswer":2,"explanation":"At 0° elevation, hair is cut at its natural fall position. This creates maximum weight and a strong weight line at the perimeter — used in one-length cuts."},
      {"id":"m3-l17-q2","question":"A client wants softness and movement but the barber cuts everything at low elevation. What is the most likely outcome?","options":["Soft, flowing layers","A heavy, boxy result with no movement","Uniform layering throughout","Maximum length removal"],"correctAnswer":1,"explanation":"Low elevation preserves weight at the perimeter. Without elevation to remove interior weight, the result is heavy and boxy with no movement."},
      {"id":"m3-l17-q3","question":"Which elevation angle creates uniform layering throughout the haircut?","options":["0 degrees","45 degrees","90 degrees","180 degrees"],"correctAnswer":2,"explanation":"At 90° elevation, hair is held perpendicular to the head. This creates uniform layering because each section is cut at the same distance from the scalp."},
      {"id":"m3-l17-q4","question":"As elevation increases from 0° to 180°, what happens to the weight in the haircut?","options":["Weight increases","Weight stays the same","Weight is progressively removed","Weight moves to the crown only"],"correctAnswer":2,"explanation":"Higher elevation removes more weight. At 180°, the maximum amount of interior length is removed relative to the guide, creating the most layering."},
      {"id":"m3-l17-q5","question":"Two barbers use the same guideline and parting but different elevations. Their results will be:","options":["Identical","Different only in color","Completely different in weight and shape","Different only at the neckline"],"correctAnswer":2,"explanation":"Elevation is the primary variable controlling weight distribution. The same guideline at different elevations produces entirely different weight outcomes and silhouettes."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-17';

END $$;
