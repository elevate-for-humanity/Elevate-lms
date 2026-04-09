export const slug = 'barber-module-4-checkpoint';
export const title = 'Module 4 Checkpoint: Haircutting Techniques';
export const videoUrl = '/videos/course-barber-shampoo-narrated.mp4';

export const content = `<h2>Module 4 Checkpoint: Haircutting Techniques</h2>
<p><strong>Passing Score: 70%</strong></p>
<p>This checkpoint covers all six lessons in Module 4. You must score 70% or higher to unlock Module 5. Questions test your ability to make professional decisions under realistic conditions — not just recall definitions.</p>
<ul>
  <li>Lesson 22 — Head Shape & Sectioning</li>
  <li>Lesson 23 — The Fade: Low, Mid & High</li>
  <li>Lesson 24 — Clipper Over Comb</li>
  <li>Lesson 25 — Scissor Over Comb</li>
  <li>Lesson 26 — Lineup & Edging</li>
  <li>Lesson 27 — Flat Top & Classic Cuts</li>
</ul>`;

export const quizQuestions = [
  // Lesson 22 — Head Shape & Sectioning
  {
    id: 'mod4-cp-q1',
    question: 'Before beginning any haircut, a client with tight coily hair requests 2 inches of length on top. You plan to cut wet. What is the most critical adjustment to make?',
    options: [
      'No adjustment — 2 inches wet will produce 2 inches dry',
      'Account for shrinkage — coily hair can shrink up to 50% when dry; cut longer than the requested wet length or cut dry',
      'Use a guard instead of scissor over comb — guards are more accurate on coily hair',
      'Wet cutting is not recommended for coily hair — always cut dry',
    ],
    correctAnswer: 1,
    explanation: 'Coily hair shrinks significantly when dry — up to 50% for tight coils. Cutting to the requested wet length will produce a result far shorter than the client expected. The correct adjustment is to account for shrinkage and cut longer, or cut dry to see the true length.',
  },
  // Lesson 22 — Head Shape & Sectioning
  {
    id: 'mod4-cp-q2',
    question: 'Which reference point divides the top section from the sides and determines where the fade begins?',
    options: [
      'The occipital bone',
      'The crown',
      'The parietal ridge',
      'The temple',
    ],
    correctAnswer: 2,
    explanation: 'The parietal ridge is the widest point of the head — where the curve of the skull begins to fall away on the sides. It divides the top from the sides and is the reference point that determines where the fade begins and where top length starts.',
  },
  // Lesson 23 — The Fade
  {
    id: 'mod4-cp-q3',
    question: 'After completing a mid fade, you step back and notice the fade line is visibly higher on the left side than the right. What is the correct correction?',
    options: [
      'Raise the right side to match the left — always correct up to the higher side',
      'Lower the left side to match the right — always correct down, never up',
      'Blend both sides more aggressively to make the difference less visible',
      'Inform the client that slight asymmetry is normal due to head shape variation',
    ],
    correctAnswer: 1,
    explanation: 'When correcting an uneven fade line, always correct down — lower the higher side to match the lower one. You cannot add hair back. Raising the lower side would require removing more from the already-correct side, changing the fade type.',
  },
  // Lesson 23 — The Fade
  {
    id: 'mod4-cp-q4',
    question: 'A client has keloid scarring along the nape. How does this affect the fade execution?',
    options: [
      'Refuse the fade service entirely — keloids are a contraindication for all clipper work',
      'Plan the fade line to avoid direct clipper pressure on the keloid; work around it',
      'Use a razor instead of clippers in the keloid area — razors apply less pressure',
      'Proceed normally — keloids are not affected by clipper contact',
    ],
    correctAnswer: 1,
    explanation: 'Keloid scarring is not a reason to refuse the entire service, but direct clipper pressure on a keloid causes pain and can worsen the scar. The correct approach is to plan the fade line to avoid direct contact with the keloid and work around it.',
  },
  // Lesson 24 — Clipper Over Comb
  {
    id: 'mod4-cp-q5',
    question: 'During clipper over comb on the sides, you notice a horizontal line across the section after two passes. What is the most likely cause and correct fix?',
    options: [
      'The clipper blade is misaligned — realign before continuing',
      'The comb stopped mid-pass and the clipper cut at the pause point — complete passes in one continuous motion; blend the line with a flatter comb angle',
      'The guard is too short for this section — switch to a longer guard',
      'The hair is too coarse for clipper over comb — switch to scissor over comb',
    ],
    correctAnswer: 1,
    explanation: 'A horizontal line in a clipper over comb section is caused by the comb stopping mid-pass. The clipper cuts at the pause point, creating a hard line. The fix is to complete all passes in one continuous motion and blend the existing line with a flatter comb angle.',
  },
  // Lesson 24/25 — Blade mechanics concept (displaced from lesson quizzes)
  {
    id: 'mod4-cp-q6',
    question: 'In both clipper over comb and scissor over comb, what is the role of the comb versus the role of the cutting tool?',
    options: [
      'The cutting tool controls the length; the comb guides the direction of the pass',
      'The comb controls the length by lifting hair to a specific height; the cutting tool removes only what extends above the comb teeth',
      'The comb and cutting tool share equal responsibility — neither controls length independently',
      'The cutting tool controls the length; the comb only prevents tangling during the pass',
    ],
    correctAnswer: 1,
    explanation: 'This is the foundational mechanical principle of both techniques. The comb is the length control mechanism — it lifts hair to a specific height above the scalp determined by the comb angle. The cutting tool (clipper or scissor) removes only what extends above the comb teeth. Change the comb angle and you change the length left behind — without changing the cutting tool at all. A barber who understands this can produce any length between zero and the top of the hair, not just fixed guard increments.',
  },
  // Lesson 25 — Scissor Over Comb
  {
    id: 'mod4-cp-q7',
    question: 'After two scissor over comb passes, the ends look ragged and frayed. What is the correct action?',
    options: [
      'Add more passes — the fraying will smooth out with additional cutting',
      'Switch to a finer-tooth comb — the wide-tooth comb is causing the fraying',
      'Stop immediately — the scissors are dull and folding the hair rather than cutting it; switch tools',
      'Reduce the comb angle — the hair is being lifted too high above the comb',
    ],
    correctAnswer: 2,
    explanation: 'Ragged, frayed ends are the signature of dull scissors. Dull blades fold and push the hair rather than cutting it cleanly. The correct action is to stop immediately and switch to sharp scissors or use clipper over comb. Continuing with dull scissors worsens the result with each pass.',
  },
  // Lesson 26 — Lineup & Edging
  {
    id: 'mod4-cp-q8',
    question: 'A client with razor bumps along the front hairline requests a razor-sharp lineup. What is the correct tool selection?',
    options: [
      'Straight razor — it produces the sharpest edge and is the professional standard',
      'T-outliner or detailer trimmer only — no razor on areas with razor bumps',
      'Shavette — it is safer than a straight razor on sensitive skin',
      'Skip the lineup — no edging should be performed when razor bumps are present',
    ],
    correctAnswer: 1,
    explanation: 'Razor bumps (pseudofolliculitis) are a contraindication for razor use along the hairline. The razor worsens the ingrown hair cycle. A T-outliner can execute a clean lineup without blade-to-skin contact on inflamed follicles. Skipping the lineup entirely is not necessary — modify the tool.',
  },
  // Lesson 26 — Edging mechanics concept (displaced from lesson quiz)
  {
    id: 'mod4-cp-q9',
    question: 'What are the three mechanical variables that determine edge quality during a lineup?',
    options: [
      'Guard size, clipper speed, and pass direction',
      'Blade angle, skin tension, and outliner speed',
      'Comb angle, section size, and hair texture',
      'Blade sharpness, client position, and lighting',
    ],
    correctAnswer: 1,
    explanation: 'Edge quality is controlled by three variables: blade angle (flat against skin = crisp edge; tilted = beveled, pushed-back hairline), skin tension (non-dominant hand stretches skin taut — without it the blade skips and produces a jagged line), and outliner speed (slow and deliberate — the outliner is a precision tool, not a bulk removal tool). A barber who controls all three produces a consistent, professional edge. A barber who ignores any one of them will produce a result that looks amateur regardless of how good the haircut is.',
  },
  // Lesson 27 — Flat Top & Classic Cuts
  {
    id: 'mod4-cp-q10',
    question: 'A client requests a Caesar cut. During the assessment, you notice the hair grows upward and backward at the front. Before picking up any tool, what should you do?',
    options: [
      'Proceed — the Caesar fringe can be trained to lay forward with the right product',
      'Cut the fringe shorter — shorter hair is more likely to lay forward',
      'Inform the client that the Caesar requires hair that grows forward, and offer a compatible alternative before cutting',
      'Proceed but cut the fringe at a downward angle to encourage it to lay forward',
    ],
    correctAnswer: 2,
    explanation: 'The Caesar requires hair that grows forward naturally. Hair that grows upward or backward will not produce a fringe that lays correctly — no technique or product will fully overcome this growth pattern. The professional response is to inform the client before cutting and offer a compatible alternative.',
  },
];
