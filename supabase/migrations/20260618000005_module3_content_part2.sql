-- Module 3 content backfill — Part 2 (Lessons 18–20 + Checkpoint)
-- Haircutting Theory & Techniques
-- Apply after 20260618000004_module3_content_part1.sql

DO $$
DECLARE
  cid uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
BEGIN

  -- Lesson 18: Shear, Clipper, and Trimmer Techniques
  UPDATE public.course_lessons SET
    title       = 'Shear, Clipper, and Trimmer Techniques',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Shear, Clipper, and Trimmer Techniques</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will distinguish the purpose of each cutting tool, explain when to use shear-over-comb vs. clipper-over-comb, and identify common tool misuse errors and their consequences.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Each tool has a specific purpose — misuse creates technical problems</li>
  <li><strong>Shears</strong> — precision cutting, layering, shaping, and refinement</li>
  <li><strong>Clippers</strong> — bulk removal, tapers, fades, and short-form work</li>
  <li><strong>Trimmers</strong> — outlining, edging, detailing, and close finishing</li>
  <li>Shear-over-comb and clipper-over-comb are advanced control techniques for transitions</li>
</ul>

<h3>Explanation</h3>
<h4>Tool Comparison</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Tool</th><th>Primary Use</th><th>Strength</th><th>Limitation</th></tr></thead>
  <tbody>
    <tr><td>Shears</td><td>Precision cutting, layering, point cutting</td><td>Refinement and control</td><td>Slower for bulk removal</td></tr>
    <tr><td>Clippers</td><td>Bulk removal, fades, tapers, uniform lengths</td><td>Speed and consistency with guards</td><td>Less refinement than shears</td></tr>
    <tr><td>Trimmers</td><td>Outlines, edges, necklines, detail work</td><td>Close, precise finishing</td><td>Not for bulk removal</td></tr>
  </tbody>
</table>

<h4>Comb Techniques</h4>
<p><strong>Shear-over-comb</strong>: The comb lifts the hair away from the scalp and the shears cut across the teeth of the comb. Used for blending, removing bulk without hard lines, and refining transitions. Requires consistent comb angle and controlled hand movement.</p>
<p><strong>Clipper-over-comb</strong>: The comb lifts the hair and the clipper cuts across it. Used for the same purpose as shear-over-comb but faster and more efficient on shorter hair. The comb angle controls the amount of hair removed — a flatter comb angle removes less; a steeper angle removes more.</p>

<h4>Common Misuse Errors</h4>
<ul>
  <li>Using clippers where shears are needed → loses refinement, creates choppy texture</li>
  <li>Using shears where clippers are more efficient → loses consistency, wastes time</li>
  <li>Using trimmers for bulk removal → creates hard lines and uneven length</li>
  <li>Inconsistent comb angle during comb techniques → creates ridges and uneven blends</li>
</ul>

<h3>Real-World Application</h3>
<p>A barber tries to refine a parietal ridge transition using only a clipper guard. The result stays bulky because the guard cannot follow the curve of the head precisely. Switching to clipper-over-comb allows the barber to follow the head shape and remove the excess weight precisely without creating a hard line.</p>

<h3>Summary</h3>
<ul>
  <li>Shears = precision and refinement; clippers = bulk and speed; trimmers = detail and outline</li>
  <li>Comb techniques (shear-over-comb, clipper-over-comb) remove weight without hard lines</li>
  <li>Tool misuse creates technical problems that technique alone cannot fix</li>
  <li>Consistent comb angle is the key variable in both comb techniques</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Tools and Equipment</p>',
    quiz_questions = '[
      {"id":"m3-l18-q1","question":"Which tool is most appropriate for outlining and edging the neckline?","options":["Shears","Clippers with a guard","Trimmers","Razor"],"correctAnswer":2,"explanation":"Trimmers are designed for close, precise detail work including outlines, edges, and neckline finishing."},
      {"id":"m3-l18-q2","question":"A barber needs to refine a parietal ridge transition without creating a hard line. Which technique is most appropriate?","options":["Clipper with a guard","Clipper-over-comb","Trimmer outlining","Razor cutting"],"correctAnswer":1,"explanation":"Clipper-over-comb allows the barber to follow the head shape and remove weight precisely without the hard line that a guard creates."},
      {"id":"m3-l18-q3","question":"During clipper-over-comb, what variable most directly controls how much hair is removed?","options":["Clipper speed","Comb angle","Guard size","Blade tension"],"correctAnswer":1,"explanation":"The comb angle determines how much hair is lifted above the scalp before the clipper cuts. A steeper angle removes more; a flatter angle removes less."},
      {"id":"m3-l18-q4","question":"A barber uses trimmers to remove bulk from the sides. What is the most likely result?","options":["A smooth, even blend","Hard lines and uneven length","Uniform layering","A soft graduation"],"correctAnswer":1,"explanation":"Trimmers are designed for detail and outline work, not bulk removal. Using them for bulk creates hard lines and inconsistent length."},
      {"id":"m3-l18-q5","question":"Which statement best describes when shears should be chosen over clippers?","options":["When speed is the priority","When bulk removal is needed","When precision, refinement, or layering is required","When outlining the neckline"],"correctAnswer":2,"explanation":"Shears provide the control needed for precision cutting, layering, and refinement. Clippers are faster for bulk removal but offer less refinement."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-18';

  -- Lesson 19: Fading, Tapering, and Blending
  UPDATE public.course_lessons SET
    title       = 'Fading, Tapering, and Blending',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Fading, Tapering, and Blending</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will distinguish between a fade and a taper, explain the mechanics of guard progression, identify the causes of hard lines, and describe the correct approach to removing them.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Fade</strong> — a gradual transition from very short (or skin) to longer hair over a defined area</li>
  <li><strong>Taper</strong> — a softer, lower-profile reduction of length, typically at the neckline and around the ears</li>
  <li><strong>Blend</strong> — the removal of visible lines between lengths</li>
  <li><strong>Guard progression</strong> — the systematic use of increasing guard sizes to create smooth transitions</li>
  <li>Hard lines are caused by poor guard progression, inconsistent wrist motion, or trying to remove too much at once</li>
</ul>

<h3>Explanation</h3>
<h4>Fade vs. Taper</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th></th><th>Fade</th><th>Taper</th></tr></thead>
  <tbody>
    <tr><td>Starting length</td><td>Skin or very close (0–0.5 guard)</td><td>Short but not skin (1–2 guard)</td></tr>
    <tr><td>Transition area</td><td>Wider, more dramatic</td><td>Narrower, more subtle</td></tr>
    <tr><td>Finish</td><td>High contrast or mid-fade depending on placement</td><td>Natural, conservative finish</td></tr>
    <tr><td>Common use</td><td>Modern barbershop styles</td><td>Professional and conservative styles</td></tr>
  </tbody>
</table>

<h4>Guard Progression Mechanics</h4>
<p>A fade is not random guard switching. It is controlled length progression across a defined transition area. The barber must know three things before starting: where the shortest area begins, where the weight line sits, and how each guard size relates to the next.</p>
<p>Standard progression example (low fade): skin → 0.5 → 1 → 1.5 → 2 → blend into top length. Each guard removes a defined amount of length. Skipping guards creates visible lines. Overlapping guards in the wrong direction creates ridges.</p>

<h4>Removing Hard Lines</h4>
<p>Hard lines appear when there is an abrupt length change between two guard sizes. The fix is not to re-cut with the same guard — it is to use the intermediate guard in the transition zone with a flicking wrist motion to feather the line out. Patience and system, not speed, produce clean fades.</p>

<h3>Real-World Application</h3>
<p>A student creates a harsh line between a 1 and a 2 guard. Instead of jumping to random guards, the correct approach is to identify the exact location of the line, use a 1.5 guard (or open the 1 guard lever slightly) in that zone with a controlled flicking motion, and work the transition until the line disappears. Rushing this step is the most common fade mistake.</p>

<h3>Summary</h3>
<ul>
  <li>Fade = dramatic transition from skin or very short; taper = subtle, conservative reduction</li>
  <li>Guard progression must be systematic — skipping guards creates hard lines</li>
  <li>Hard lines are fixed with intermediate guards and controlled flicking motion</li>
  <li>Fading requires system and patience — speed is the enemy of a clean blend</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Fading and Tapering</p>',
    quiz_questions = '[
      {"id":"m3-l19-q1","question":"What is the primary difference between a fade and a taper?","options":["A fade uses shears; a taper uses clippers","A fade starts at skin or very close; a taper is a softer, more conservative reduction","A taper is always longer than a fade","A fade is only done on the neckline"],"correctAnswer":1,"explanation":"A fade starts at skin or very close (0–0.5 guard) and creates a dramatic transition. A taper is a softer, lower-profile reduction typically at the neckline and ears."},
      {"id":"m3-l19-q2","question":"A student creates a hard line between a 1 and 2 guard. What is the correct fix?","options":["Re-cut the entire side with the 1 guard","Use an intermediate guard (1.5 or open lever) with a flicking motion in the transition zone","Switch to shears for the entire blend","Use the trimmer to remove the line"],"correctAnswer":1,"explanation":"Hard lines between guard sizes are fixed by using an intermediate length in the transition zone with a controlled flicking motion to feather the line out."},
      {"id":"m3-l19-q3","question":"In a standard low fade, which guard sequence represents correct progression?","options":["2 → 1 → 0.5 → skin (working down)","Skin → 0.5 → 1 → 1.5 → 2 (working up)","Random guard selection based on feel","Start with the largest guard and work down"],"correctAnswer":1,"explanation":"Correct fade progression works from shortest to longest (skin → 0.5 → 1 → 1.5 → 2), building the transition systematically upward."},
      {"id":"m3-l19-q4","question":"What is the most common cause of hard lines in a fade?","options":["Using the wrong shampoo","Skipping guard sizes in the progression","Incorrect water temperature","Using shears instead of clippers"],"correctAnswer":1,"explanation":"Skipping guard sizes creates abrupt length changes with no transition zone, producing visible hard lines."},
      {"id":"m3-l19-q5","question":"Which statement best describes professional fading technique?","options":["Speed is the most important factor","Fading requires system and patience — rushing creates hard lines","The largest guard should always be used first","Trimmers should be used for the entire fade"],"correctAnswer":1,"explanation":"Professional fading is systematic and patient. Rushing the guard progression or the blending step is the most common cause of poor fade results."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-19';

  -- Lesson 20: Head Shape, Face Shape, and Cut Selection
  UPDATE public.course_lessons SET
    title       = 'Head Shape, Face Shape, and Cut Selection',
    video_url   = '/videos/barber-course-intro-with-voice.mp4',
    content     = '<h2>Head Shape, Face Shape, and Cut Selection</h2>

<h3>Objective</h3>
<p>By the end of this lesson you will identify the key anatomical landmarks of the head, describe how face shape influences cut selection, and explain how growth patterns affect the finished result.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Parietal ridge</strong> — the widest part of the head; where the side meets the top</li>
  <li><strong>Occipital bone</strong> — the bone at the back of the skull; affects neckline shape</li>
  <li><strong>Crown</strong> — the top-back area of the head; often has strong growth patterns</li>
  <li>Face shape guides cut selection — the goal is to create visual balance</li>
  <li>Growth patterns (cowlicks, strong crowns) must be respected, not fought</li>
</ul>

<h3>Explanation</h3>
<h4>Head Anatomy Landmarks</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Landmark</th><th>Location</th><th>Relevance to Cutting</th></tr></thead>
  <tbody>
    <tr><td>Parietal ridge</td><td>Widest point of the head, side-to-top junction</td><td>Key reference for fade height and weight line placement</td></tr>
    <tr><td>Occipital bone</td><td>Prominent bone at the back of the skull</td><td>Determines neckline shape and taper placement</td></tr>
    <tr><td>Crown</td><td>Top-back of the head</td><td>Strong growth patterns here affect finish and control</td></tr>
    <tr><td>Temporal area</td><td>Side of the head above the ear</td><td>Common location for fade transitions</td></tr>
  </tbody>
</table>

<h4>Face Shape and Cut Selection</h4>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <thead><tr><th>Face Shape</th><th>Characteristics</th><th>Cut Strategy</th></tr></thead>
  <tbody>
    <tr><td>Oval</td><td>Balanced proportions</td><td>Most styles work — maintain natural balance</td></tr>
    <tr><td>Round</td><td>Equal width and length</td><td>Add height on top; keep sides close to elongate</td></tr>
    <tr><td>Square</td><td>Strong jawline, equal width</td><td>Soften corners; avoid very square perimeters</td></tr>
    <tr><td>Oblong / Long</td><td>Longer than wide</td><td>Add width at sides; avoid excessive height on top</td></tr>
    <tr><td>Diamond</td><td>Narrow forehead and chin, wide cheekbones</td><td>Add width at forehead and chin; reduce width at cheekbones</td></tr>
  </tbody>
</table>

<h4>Growth Patterns</h4>
<p>Cowlicks, strong crowns, and irregular necklines are growth patterns — the direction hair naturally grows from the follicle. These cannot be permanently changed by cutting. A barber who fights a growth pattern will produce a cut that looks good in the chair and wrong by the next morning. The correct approach is to design the cut to work with the pattern, not against it.</p>

<h3>Real-World Application</h3>
<p>A client with a strong crown requests an ultra-smooth finish in that area. You know the crown growth pattern will push the hair back and expose inconsistency within 24 hours. You explain this to the client, design the cut to follow the crown''s natural direction, and set the expectation that the crown will always have some movement. The client leaves satisfied because they were informed, not surprised.</p>

<h3>Summary</h3>
<ul>
  <li>Parietal ridge, occipital bone, and crown are the three key anatomical landmarks</li>
  <li>Face shape guides cut selection — the goal is visual balance, not a formula</li>
  <li>Growth patterns cannot be cut away — design with them, not against them</li>
  <li>Technical skill must be paired with visual judgment to produce great results</li>
</ul>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Haircutting — Head and Face Shape Analysis</p>',
    quiz_questions = '[
      {"id":"m3-l20-q1","question":"Which anatomical landmark is the widest point of the head and a key reference for fade height?","options":["Occipital bone","Crown","Parietal ridge","Temporal area"],"correctAnswer":2,"explanation":"The parietal ridge is the widest point of the head where the side meets the top. It is the primary reference point for fade height and weight line placement."},
      {"id":"m3-l20-q2","question":"A client has a round face shape. Which cut strategy best creates visual balance?","options":["Add width at the sides","Add height on top and keep sides close","Add width at the forehead only","Use a very square perimeter"],"correctAnswer":1,"explanation":"For a round face, adding height on top and keeping the sides close creates the illusion of length, visually balancing the equal width and height of the face."},
      {"id":"m3-l20-q3","question":"A client with a strong crown requests an ultra-smooth finish in that area. What is the correct professional response?","options":["Cut against the growth pattern to force it flat","Design the cut to work with the crown pattern and set accurate expectations","Apply product to hold it flat permanently","Refuse the service"],"correctAnswer":1,"explanation":"Growth patterns cannot be permanently changed by cutting. Designing with the pattern and setting accurate expectations produces a result that holds and satisfies the client."},
      {"id":"m3-l20-q4","question":"Which bone at the back of the skull affects neckline shape and taper placement?","options":["Parietal ridge","Temporal bone","Occipital bone","Frontal bone"],"correctAnswer":2,"explanation":"The occipital bone is the prominent bone at the back of the skull. Its shape and prominence directly affect how the neckline sits and where the taper should be placed."},
      {"id":"m3-l20-q5","question":"A barber executes a technically clean haircut but it looks wrong on the client. The most likely cause is:","options":["Wrong shampoo used","Incorrect water temperature","Cut selection did not account for head shape, face shape, or growth patterns","Incorrect guard size"],"correctAnswer":2,"explanation":"Technical execution without visual judgment produces cuts that are technically correct but aesthetically wrong. Cut selection must account for anatomy and growth patterns."}
    ]'::jsonb,
    is_published = true,
    updated_at  = now()
  WHERE course_id = cid AND slug = 'barber-lesson-20';

  -- Module 3 Checkpoint
  UPDATE public.course_lessons SET
    title         = 'Module 3 Checkpoint — Haircutting Theory & Techniques',
    video_url     = NULL,
    content       = '<h2>Module 3 Checkpoint</h2>
<p>This checkpoint covers all six lessons in Module 3: Foundations of Haircutting, Sectioning/Parting/Control, Elevation/Angles/Weight Distribution, Shear/Clipper/Trimmer Techniques, Fading/Tapering/Blending, and Head Shape/Face Shape/Cut Selection.</p>
<p>You must score <strong>70% or higher</strong> to unlock Module 4. Review your lesson notes before beginning.</p>',
    quiz_questions = '[
      {"id":"m3-cp-q1","question":"What is the purpose of a guideline in haircutting?","options":["To determine shampoo selection","To control the length of all subsequent sections","To set water temperature","To select the correct clipper guard"],"correctAnswer":1,"explanation":"A guideline is the reference section that controls how long every subsequent section is cut — the foundation of consistency."},
      {"id":"m3-cp-q2","question":"A barber holds hair at 90 degrees elevation and cuts. What is the primary result?","options":["A strong weight line at the perimeter","Uniform layering throughout","Maximum weight retention","Skin-level fade"],"correctAnswer":1,"explanation":"At 90° elevation, hair is held perpendicular to the head, creating uniform layering because each section is cut at the same distance from the scalp."},
      {"id":"m3-cp-q3","question":"Which tool is most appropriate for outlining and edging the neckline?","options":["Shears","Clippers with a guard","Trimmers","Razor"],"correctAnswer":2,"explanation":"Trimmers are designed for close, precise detail work including outlines, edges, and neckline finishing."},
      {"id":"m3-cp-q4","question":"A student creates a hard line between a 1 and 2 guard. What is the correct fix?","options":["Re-cut the entire side with the 1 guard","Use an intermediate guard with a flicking motion in the transition zone","Switch to shears for the entire blend","Use the trimmer to remove the line"],"correctAnswer":1,"explanation":"Hard lines are fixed by using an intermediate length in the transition zone with a controlled flicking motion to feather the line out."},
      {"id":"m3-cp-q5","question":"Hair combed at 90 degrees to the parting line before cutting creates which effect?","options":["Natural weight preservation","Uniform layering","Directional asymmetry","A strong weight line"],"correctAnswer":1,"explanation":"Perpendicular distribution creates uniform layering because each section is held at the same angle relative to the head."},
      {"id":"m3-cp-q6","question":"Which anatomical landmark is the key reference point for fade height placement?","options":["Occipital bone","Crown","Parietal ridge","Temporal area"],"correctAnswer":2,"explanation":"The parietal ridge is the widest point of the head and the primary reference for fade height and weight line placement."},
      {"id":"m3-cp-q7","question":"A client has a round face shape. Which cut strategy best creates visual balance?","options":["Add width at the sides","Add height on top and keep sides close","Add width at the forehead only","Use a very square perimeter"],"correctAnswer":1,"explanation":"Adding height on top and keeping sides close creates the illusion of length, visually balancing a round face."},
      {"id":"m3-cp-q8","question":"What is the most common cause of hard lines in a fade?","options":["Using the wrong shampoo","Skipping guard sizes in the progression","Incorrect water temperature","Using shears instead of clippers"],"correctAnswer":1,"explanation":"Skipping guard sizes creates abrupt length changes with no transition zone, producing visible hard lines."},
      {"id":"m3-cp-q9","question":"A barber uses a traveling guideline. What result does this create?","options":["Increasing length as sections move away from the guide","Uniform layering throughout the cut","A strong weight line at the perimeter","Maximum weight retention"],"correctAnswer":1,"explanation":"A traveling guideline moves with each new section, incorporating a piece of the previously cut hair to create uniform layering throughout."},
      {"id":"m3-cp-q10","question":"A client with a strong crown requests an ultra-smooth finish. What is the correct approach?","options":["Cut against the growth pattern to force it flat","Design the cut to work with the crown pattern and set accurate expectations","Apply product to hold it flat permanently","Refuse the service"],"correctAnswer":1,"explanation":"Growth patterns cannot be permanently changed by cutting. Designing with the pattern and setting accurate expectations produces a result that holds."}
    ]'::jsonb,
    passing_score = 70,
    is_published = true,
    updated_at    = now()
  WHERE course_id = cid AND slug = 'barber-module-3-checkpoint';

END $$;
