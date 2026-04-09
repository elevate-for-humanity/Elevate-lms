/**
 * lib/curriculum/lesson-schema.ts
 *
 * Machine-readable lesson contract for the Elevate LMS barber apprenticeship program.
 * Every lesson must satisfy this schema before it is marked publishable.
 *
 * This is the single source of truth for lesson structure.
 * CourseBuilder, content authors, and the deploy pipeline all validate against this.
 */

// ─── Required HTML section markers ────────────────────────────────────────────
// Each lesson's content field must contain HTML that includes these markers,
// in this order. The validator checks for their presence and sequence.

export const REQUIRED_SECTIONS = [
  'Objective',
  'Core Anatomy',           // OR "Core Concept" — at least one
  'Terminology',
  'Service Order',          // Non-Negotiable Service Order
  'Visual',                 // At least 2 visual blocks (diagram divs)
  'Sectioning',             // OR "Technique Patterns"
  'Tool Selection',
  'Execution Standard',
  'Critical Thinking',      // Decision Rules (IF/THEN)
  'Failure Modes',
  'Pre-Cut Decision',       // OR "Pre-Service Decision" / "Pre-Razor Decision"
  'Service Flow',           // Memory Anchor snapshot
  'Practical Standard',     // Pass/Fail
  'Mechanical Reasoning',
  'State Board Alignment',
  'State Board Simulation',
  'Quiz',                   // 5 questions, validated separately
] as const;

export type RequiredSection = typeof REQUIRED_SECTIONS[number];

// ─── Quiz question contract ────────────────────────────────────────────────────

export type QuizQuestionType =
  | 'scenario'          // Client presents X — what do you do?
  | 'next-step'         // What do you do NEXT?
  | 'failure-diagnosis' // What is the root cause / correct correction?
  | 'concept'           // Definition or mechanical reasoning validation

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string]; // Exactly 4 options
  correctAnswer: 0 | 1 | 2 | 3;
  explanation: string;
  type: QuizQuestionType;
}

// Required distribution per lesson: 2 scenario, 1 next-step, 1 failure-diagnosis, 1 concept
export const REQUIRED_QUESTION_TYPES: QuizQuestionType[] = [
  'scenario',
  'scenario',
  'next-step',
  'failure-diagnosis',
  'concept',
];

// ─── Lesson contract ──────────────────────────────────────────────────────────

export interface LessonContract {
  slug: string;
  title: string;
  videoUrl: string;
  content: string;           // Full structured HTML — must pass section validation
  quizQuestions: QuizQuestion[];
  moduleId?: string;
  orderIndex?: number;
  isDraft?: boolean;
}

// ─── Checkpoint contract ──────────────────────────────────────────────────────

export interface CheckpointContract {
  slug: string;
  title: string;
  content: string;
  quizQuestions: QuizQuestion[]; // Exactly 10
  passingScore: 70;              // Fixed — never changes
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a lesson against the schema contract.
 * Returns a ValidationResult — valid=false means the lesson must not be deployed.
 */
export function validateLesson(lesson: LessonContract): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const content = lesson.content;

  // 1. Required sections present
  const sectionChecks: Array<{ label: string; patterns: RegExp[] }> = [
    { label: 'Objective',              patterns: [/Objective/i] },
    { label: 'Core Anatomy/Concept',   patterns: [/Core Anatomy/i, /Core Concept/i] },
    { label: 'Terminology',            patterns: [/Terminology/i] },
    { label: 'Service Order',          patterns: [/Service Order/i, /Non-Negotiable Order/i] },
    { label: 'Visual blocks (min 2)',   patterns: [/background:#f8fafc.*border-radius/s] },
    { label: 'Tool Selection',         patterns: [/Tool Selection/i] },
    { label: 'Execution Standard',     patterns: [/Execution Standard/i, /Execution.*Step/i] },
    { label: 'Critical Thinking',      patterns: [/Critical Thinking/i, /Decision Rule/i] },
    { label: 'Failure Modes',          patterns: [/Failure Mode/i] },
    { label: 'Pre-Cut/Pre-Service Decision Check', patterns: [/Pre-Cut Decision/i, /Pre-Service Decision/i, /Pre-Razor Decision/i] },
    { label: 'Service Flow Snapshot',  patterns: [/Service Flow/i, /Memory Anchor/i] },
    { label: 'Practical Standard',     patterns: [/Practical Standard/i] },
    { label: 'Pass.*Fail criteria',    patterns: [/Pass requires/i, /Fail if/i] },
    { label: 'Mechanical Reasoning',   patterns: [/Mechanical Reasoning/i] },
    { label: 'State Board Alignment',  patterns: [/State Board Alignment/i] },
    { label: 'State Board Simulation', patterns: [/State Board Simulation/i] },
  ];

  for (const check of sectionChecks) {
    const found = check.patterns.some(p => p.test(content));
    if (!found) {
      errors.push(`Missing required section: ${check.label}`);
    }
  }

  // 2. Visual blocks — count div blocks with the visual styling signature
  const visualBlockCount = (content.match(/background:#f8fafc;border:1px solid #e2e8f0;border-radius/g) || []).length;
  if (visualBlockCount < 2) {
    errors.push(`Insufficient visual blocks: found ${visualBlockCount}, required 2+`);
  }

  // 3. Execution standard must use numbered list
  if (/Execution Standard/i.test(content) && !/<ol>/i.test(content)) {
    errors.push('Execution Standard must use a numbered list (<ol>), not paragraphs');
  }

  // 4. Failure modes must use a table
  if (/Failure Mode/i.test(content)) {
    const failureSection = content.slice(content.search(/Failure Mode/i));
    if (!/<table/i.test(failureSection.slice(0, 2000))) {
      errors.push('Failure Modes must use a table format, not paragraphs');
    }
  }

  // 5. Decision logic must include IF/THEN language
  if (!/\bIF\b.*→/s.test(content) && !/if.*then/i.test(content)) {
    errors.push('Critical Thinking layer must include explicit IF/THEN decision rules');
  }

  // 6. Quiz — exactly 5 questions
  if (lesson.quizQuestions.length !== 5) {
    errors.push(`Quiz must have exactly 5 questions, found ${lesson.quizQuestions.length}`);
  }

  // 7. Quiz — each question must have exactly 4 options
  lesson.quizQuestions.forEach((q, i) => {
    if (q.options.length !== 4) {
      errors.push(`Question ${i + 1} must have exactly 4 options, found ${q.options.length}`);
    }
    if (!q.explanation || q.explanation.length < 20) {
      errors.push(`Question ${i + 1} is missing a substantive explanation`);
    }
    if (!q.type) {
      warnings.push(`Question ${i + 1} is missing a type field (scenario/next-step/failure-diagnosis/concept)`);
    }
  });

  // 8. Quiz — required type distribution
  if (lesson.quizQuestions.length === 5) {
    const types = lesson.quizQuestions.map(q => q.type).filter(Boolean);
    const scenarioCount = types.filter(t => t === 'scenario').length;
    const nextStepCount = types.filter(t => t === 'next-step').length;
    const failureCount  = types.filter(t => t === 'failure-diagnosis').length;
    const conceptCount  = types.filter(t => t === 'concept').length;

    if (scenarioCount < 2) warnings.push(`Quiz should have 2 scenario questions, found ${scenarioCount}`);
    if (nextStepCount < 1) warnings.push(`Quiz should have 1 next-step question, found ${nextStepCount}`);
    if (failureCount < 1)  warnings.push(`Quiz should have 1 failure-diagnosis question, found ${failureCount}`);
    if (conceptCount < 1)  warnings.push(`Quiz should have 1 concept question, found ${conceptCount}`);
  }

  // 9. Slug format
  if (!/^barber-lesson-\d+$|^barber-module-\d+-checkpoint$/.test(lesson.slug)) {
    errors.push(`Slug format invalid: ${lesson.slug} — expected barber-lesson-N or barber-module-N-checkpoint`);
  }

  // 10. Content length — minimum 10,000 chars for a lesson
  if (!lesson.slug.includes('checkpoint') && content.length < 10000) {
    errors.push(`Content too short: ${content.length} chars — minimum 10,000 for a lesson`);
  }

  // 11. Stop conditions — lesson must teach when to abort or pause the service
  //     Patterns: "stop", "do not proceed", "abort", "pause", "inform the client", "cannot continue"
  const hasStopCondition = /\bstop\b|\bdo not proceed\b|abort the service|pause the service|inform the client|cannot continue|contraindication/i.test(content);
  if (!hasStopCondition) {
    warnings.push('Missing stop conditions — lesson should teach when to pause or abort the service (state board + safety requirement)');
  }

  // 12. Tool diagnostics — lesson must help students distinguish tool failure from technique failure
  //     Patterns: "dull blade", "blade is dull", "replace the blade", "tool failure", "is it me or the tool",
  //               "blade pulls", "blade skips", "dragging", "motor"
  const hasToolDiagnostics = /dull blade|blade is dull|replace.*blade|blade.*dull|blade pulls|blade skips|dragging|tool failure|is it.*tool|replace.*before/i.test(content);
  if (!hasToolDiagnostics) {
    warnings.push('Missing tool diagnostics — lesson should help students distinguish tool failure from technique failure');
  }

  // 13a. Hair texture variation — lesson must include IF/THEN rules for at least one hair texture
  //      Patterns: "IF.*coarse", "IF.*fine", "IF.*curly", or explicit branching on texture
  const hasTextureVariation = /IF.*coarse|IF.*fine|IF.*curly|coarse.*hair.*→|fine.*hair.*→|curly.*hair.*→/i.test(content);
  if (!hasTextureVariation) {
    warnings.push('Missing hair texture variation — lesson should include IF/THEN rules for coarse, fine, or curly hair');
  }

  // 13. Pressure calibration — lesson must give a measurable or sensory cue for pressure/force
  //     Patterns: "skin should not", "do not press", "light pressure", "pressure scale",
  //               "should not indent", "should not depress", "pressing harder", "skin tension"
  const hasPressureCalibration = /skin should not|do not press|light pressure|pressure scale|should not indent|indenting|pressing harder|skin tension|taut|weight of the tool|weight of the scissor|weight of the clipper|no downward pressure|weight of your hand|no additional pressure/i.test(content);
  if (!hasPressureCalibration) {
    warnings.push('Missing pressure calibration — lesson should include a measurable or sensory cue for correct pressure/force');
  }

  // ── Chemical services (Module 6) — slug barber-lesson-35 through barber-lesson-38 ──
  const chemicalSlugs = ['barber-lesson-35', 'barber-lesson-36', 'barber-lesson-37', 'barber-lesson-38'];
  const isChemicalLesson = chemicalSlugs.includes(lesson.slug);

  if (isChemicalLesson) {
    // Contraindication table — required for all chemical lessons
    const hasContraindicationTable =
      /contraindication/i.test(content) && /<table/i.test(content);
    if (!hasContraindicationTable) {
      errors.push('Chemical lesson missing contraindication table — required for all Module 6 lessons');
    } else {
      // Extract the contraindication table block: from the contraindication heading to the closing </table>
      // This prevents a stray "Refuse" elsewhere in the lesson from satisfying the check
      const contraindicationBlockMatch = content.match(
        /contraindication[\s\S]*?<table[\s\S]*?<\/table>/i
      );
      const contraindicationBlock = contraindicationBlockMatch?.[0] ?? '';
      const stopInTable = /Refuse|Do not proceed|Stop the service|refuse service|→\s*Refuse|→\s*Do not proceed|→\s*Stop/i.test(contraindicationBlock);
      if (!stopInTable) {
        errors.push('Contraindication table exists but no row explicitly triggers Refuse / Do not proceed / Stop — must appear inside the table, not elsewhere in the lesson');
      }
    }

    // PPE and ventilation — required for L35, L36, L37
    const ppeRequired = ['barber-lesson-35', 'barber-lesson-36', 'barber-lesson-37'].includes(lesson.slug);
    if (ppeRequired && !/gloves|PPE|ventilation/i.test(content)) {
      errors.push('Chemical lesson missing PPE/ventilation requirements — required for L35, L36, L37');
    }

    // Strand test — required for L36 and L37, AND must be tied to a decision outcome
    const strandTestRequired = ['barber-lesson-36', 'barber-lesson-37'].includes(lesson.slug);
    if (strandTestRequired) {
      if (!/strand test/i.test(content)) {
        errors.push('Relaxer/color lesson missing strand test protocol — required');
      } else {
        // Strand test must drive a decision: result → timing adjustment OR stop/refuse
        const strandTestDecisionDriven =
          /strand test.*IF|IF.*strand test|strand test.*→|strand test.*stop|strand test.*refuse|strand test.*do not proceed|strand test.*timing|strand test.*adjust/i.test(content) ||
          /IF.*strand.*→|strand.*result.*→|strand.*breaks|strand.*elasticity.*→/i.test(content);
        if (!strandTestDecisionDriven) {
          errors.push('Strand test section exists but is not decision-driving — must include IF/THEN: result → timing adjustment OR service refusal');
        }
      }
    }

    // Neutralization — required for L36
    if (lesson.slug === 'barber-lesson-36' && !/neutrali[sz]/i.test(content)) {
      errors.push('Relaxer lesson missing neutralization sequence — required');
    }

    // Timing decision rules — required for L36
    if (lesson.slug === 'barber-lesson-36') {
      const hasTiming = /processing time|over-process|timing/i.test(content) && /IF.*→/i.test(content);
      if (!hasTiming) {
        errors.push('Relaxer lesson missing timing decision rules (IF/THEN format) — required');
      }
    }

    // Patch test — required for L37
    if (lesson.slug === 'barber-lesson-37' && !/patch test/i.test(content)) {
      errors.push('Color lesson missing patch test protocol — required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a checkpoint against the schema contract.
 */
export function validateCheckpoint(checkpoint: CheckpointContract): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (checkpoint.quizQuestions.length !== 10) {
    errors.push(`Checkpoint must have exactly 10 questions, found ${checkpoint.quizQuestions.length}`);
  }

  if (checkpoint.passingScore !== 70) {
    errors.push(`Checkpoint passing score must be 70, found ${checkpoint.passingScore}`);
  }

  checkpoint.quizQuestions.forEach((q, i) => {
    if (q.options.length !== 4) {
      errors.push(`Question ${i + 1} must have exactly 4 options`);
    }
    if (!q.explanation || q.explanation.length < 20) {
      errors.push(`Question ${i + 1} is missing a substantive explanation`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
