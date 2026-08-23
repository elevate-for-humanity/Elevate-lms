import type { BlueprintLessonRef, BlueprintModule } from '@/lib/curriculum/blueprints/types';

function clean(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function sentence(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

export function buildDeterministicLessonBaseline(input: {
  courseTitle: string;
  module: BlueprintModule;
  lesson: BlueprintLessonRef;
}) {
  const { courseTitle, module, lesson } = input;
  const domainKey = clean(lesson.domainKey || module.domainKey, module.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  const objective = clean(
    lesson.objective,
    `Apply the core concepts of ${lesson.title} in a realistic ${courseTitle} workplace or business situation`,
  );
  const objectives = (lesson.learningObjectives ?? []).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  while (objectives.length < 3) {
    const additions = [
      `Explain the purpose and key concepts of ${lesson.title}.`,
      `Apply ${lesson.title} concepts to a realistic decision in ${module.title}.`,
      `Evaluate evidence and select an appropriate next action related to ${lesson.title}.`,
    ];
    objectives.push(additions[objectives.length]);
  }

  const learningPoints = [
    sentence(`Start by connecting ${lesson.title} to the broader responsibilities covered in ${module.title}`),
    sentence(`Use a repeatable process: identify the goal, gather relevant information, compare options, act, and document the result`),
    sentence(`Good decisions in ${lesson.title} should be supported by evidence, clear communication, and a review of risk before action`),
    sentence(`When conditions change, revisit the assumptions behind the decision and update the plan rather than relying on an outdated answer`),
  ];

  const scenario = `You are responsible for a task involving ${lesson.title} within the ${module.title} portion of ${courseTitle}. A customer, coworker, supervisor, or business stakeholder needs a clear decision. Before acting, you identify the desired outcome, gather the information that affects the decision, separate verified facts from assumptions, compare reasonable options, and document the reason for the selected action. After the action is taken, you review the result and determine whether follow-up is required. This scenario is intentionally general so the learner practices a reusable decision process without relying on invented regulations, vendor rules, wages, or unsupported claims.`;

  const html = `
<h2>${lesson.title}</h2>
<p>${objective}. This lesson provides a deterministic baseline that remains usable even when external AI services are unavailable. It focuses on transferable workplace and business reasoning tied directly to the registered course blueprint.</p>
<h3>Why this matters</h3>
<p>${lesson.title} belongs to ${module.title}, a required part of ${courseTitle}. Learners should understand not only terminology but also how to recognize a relevant situation, gather evidence, choose an action, communicate clearly, and review the outcome. A reliable process reduces guessing and helps create consistent, explainable decisions.</p>
<h3>Core process</h3>
<p>Begin by defining the goal. State what must be accomplished, who is affected, and what evidence would show success. Next, gather relevant information from the approved course materials, workplace records, instructions, policies, or supervisor guidance available to you. Separate facts from assumptions. Then compare the available options, including likely benefits, risks, dependencies, and follow-up needs. Select the option that best supports the stated goal and the evidence you have. Finally, document the decision and review the result.</p>
<h3>Applied example</h3>
<p>Suppose you are asked to make a decision involving ${lesson.title}. Instead of choosing the first familiar answer, write down the objective, list the known facts, identify information that is still missing, and compare at least two possible actions. Ask which action best matches the course objective and which action can be explained using evidence. If the available evidence is incomplete, pause and obtain the missing information rather than inventing an answer.</p>
<h3>Quality check</h3>
<p>Before considering the task complete, verify four things. First, the selected action should address the actual problem rather than a symptom. Second, the reasoning should be understandable to another person. Third, any required documentation or evidence should be captured. Fourth, the result should be reviewed so a mistake or changed condition can be corrected. These checks turn a one-time answer into a repeatable professional practice.</p>
<h3>Practice method</h3>
<p>Use the following method whenever you encounter a new situation connected to ${lesson.title}: define the goal; gather facts; identify constraints; compare options; choose and explain an action; document evidence; review the result; and complete any needed follow-up. Repeat the method with different examples until you can perform it without prompting. If you cannot explain why an option is better supported than the alternatives, return to the lesson objective and review the evidence again.</p>
<h3>Recap</h3>
<p>The main lesson is that ${lesson.title} should be approached deliberately. Strong performance combines knowledge, evidence, communication, action, and review. Use the course blueprint, instructor guidance, approved references, and observable results to support decisions. Do not substitute unsupported claims for evidence. When a gap is identified, complete targeted remediation and retry the objective-aligned practice.</p>`;

  const narrationScript = `In this lesson on ${lesson.title}, focus on a repeatable professional process rather than memorizing isolated facts. Start by defining the goal, gather relevant evidence, separate verified information from assumptions, compare reasonable options, select the action best supported by the course objective, document what you did, and review the result. If you find a gap, return to the related section and practice the decision again. This approach helps you apply ${lesson.title} consistently within ${module.title} and across realistic workplace or business situations.`;

  const quiz = [
    {
      id: `${lesson.slug}-baseline-q1`,
      question: `What is the best first step when applying ${lesson.title} to a new situation?`,
      options: ['Define the goal and gather relevant facts', 'Choose the fastest answer without evidence', 'Skip documentation', 'Assume the situation matches a previous one'],
      correctAnswer: 0,
      explanation: 'Defining the goal and gathering facts creates an evidence-based starting point before options are compared.',
    },
    {
      id: `${lesson.slug}-baseline-q2`,
      question: `Which action best demonstrates professional reasoning in ${lesson.title}?`,
      options: ['Compare options against evidence and explain the choice', 'Rely on an unsupported assumption', 'Ignore changed conditions', 'Avoid reviewing the result'],
      correctAnswer: 0,
      explanation: 'Professional reasoning compares alternatives against evidence and makes the decision explainable.',
    },
    {
      id: `${lesson.slug}-baseline-q3`,
      question: 'What should happen after an action is completed?',
      options: ['Review the result and complete needed follow-up', 'Delete the evidence', 'Assume success without checking', 'Restart the entire course'],
      correctAnswer: 0,
      explanation: 'Review and follow-up confirm whether the intended outcome was achieved and whether correction is needed.',
    },
  ];

  const experience = {
    readingGuide: {
      title: `${lesson.title} reading guide`,
      summary: `Use this guide to understand, apply, and review the core decision process for ${lesson.title} within ${module.title}.`,
      sections: [
        { heading: 'Understand', body: `Connect ${lesson.title} to the objectives and responsibilities of ${module.title}. Identify the goal, relevant evidence, and the people affected by the decision.` },
        { heading: 'Apply', body: `Use a structured sequence: define the goal, gather facts, identify constraints, compare options, choose an evidence-supported action, and document the result.` },
        { heading: 'Review', body: `Check the outcome against the original goal, identify any remaining gap, and use targeted remediation or follow-up when the evidence shows additional work is needed.` },
      ],
      keyTakeaways: learningPoints.slice(0, 3),
    },
    narrationScript,
    visualPrompt: `Bright professional training scene showing an adult learner applying ${lesson.title} within ${module.title}, reviewing evidence, making a decision, documenting the action, and checking the outcome.`,
    flashcards: [
      { id: 'term-1', front: 'Goal', back: 'The result the learner or worker is trying to achieve.', tags: [domainKey] },
      { id: 'term-2', front: 'Evidence', back: 'Verified information used to support a decision.', tags: [domainKey] },
      { id: 'term-3', front: 'Constraint', back: 'A condition that limits or shapes the available options.', tags: [domainKey] },
      { id: 'term-4', front: 'Option', back: 'A reasonable action that can be compared against alternatives.', tags: [domainKey] },
      { id: 'term-5', front: 'Documentation', back: 'A record of the decision, action, or supporting evidence.', tags: [domainKey] },
      { id: 'term-6', front: 'Follow-up', back: 'A later action used to confirm, correct, or complete the result.', tags: [domainKey] },
    ],
    quickClips: [
      { id: 'clip-1', title: `${lesson.title}: core process`, objective: objectives[0], durationSeconds: 180, script: narrationScript, visualPrompt: `Instructor demonstrates the evidence-based process for ${lesson.title}.` },
      { id: 'clip-2', title: `${lesson.title}: applied decision`, objective: objectives[1], durationSeconds: 180, script: `${narrationScript} Now apply the process to a realistic example and explain why the selected option is stronger than the alternatives.`, visualPrompt: `Learner applies ${lesson.title} to a realistic decision and reviews the result.` },
    ],
    knowledgeChecks: quiz.map((q) => ({ question: q.question, options: q.options, correct: q.correctAnswer, explanation: q.explanation })),
    scenario: {
      title: `${lesson.title} decision`,
      context: scenario,
      question: 'Which approach is best supported?',
      options: [
        { text: 'Define the goal, gather evidence, compare options, act, document, and review.', isCorrect: true, feedback: 'This uses the complete evidence-based process.' },
        { text: 'Act on the first assumption and skip review.', isCorrect: false, feedback: 'This removes the evidence and review steps needed for a reliable decision.' },
      ],
    },
    caseStudy: {
      title: `${lesson.title} evidence review`,
      context: `A learner has two possible actions related to ${lesson.title}. One is familiar but unsupported; the other is supported by the course objective and current evidence.`,
      question: 'Which conclusion is best supported?',
      options: [
        { text: 'Choose the option supported by the objective and current evidence.', isCorrect: true, feedback: 'Evidence should drive the decision.' },
        { text: 'Choose the familiar option even when evidence conflicts.', isCorrect: false, feedback: 'Familiarity is not a substitute for current evidence.' },
      ],
    },
    exercises: [{ id: 'exercise-1', title: `Apply ${lesson.title}`, instructions: ['Define a realistic goal related to the lesson.', 'List relevant facts and constraints.', 'Compare at least two actions and explain the stronger option.', 'State how you would document and review the result.'], expectedArtifact: `A written evidence-based decision for ${lesson.title}.`, autoGrade: { type: 'checklist', criteria: ['Goal defined', 'Evidence identified', 'Options compared', 'Follow-up stated'] } }],
    practicalTask: { title: `${lesson.title} practice task`, description: `Demonstrate the lesson decision process using an instructor-approved or simulated workplace/business situation.`, instructions: ['Define the goal.', 'Gather evidence.', 'Compare options.', 'Select and explain an action.', 'Document and review the outcome.'], evidence: `Completed ${lesson.title} decision worksheet or equivalent observable artifact.` },
    resources: [
      { type: 'worksheet', title: `${lesson.title} decision worksheet`, description: 'Use this worksheet to organize the goal, evidence, options, action, and follow-up.', content: 'Goal: ___\nVerified facts: ___\nConstraints: ___\nOptions considered: ___\nSelected action and reason: ___\nEvidence to retain: ___\nFollow-up: ___' },
      { type: 'reference', title: `${lesson.title} quick reference`, description: 'A reusable sequence for evidence-based decisions.', content: 'Define goal → gather facts → identify constraints → compare options → choose and explain → document → review → follow up.' },
    ],
    glossary: [
      { term: 'Goal', definition: 'The intended result of an action or decision.' },
      { term: 'Evidence', definition: 'Verified information supporting a conclusion or action.' },
      { term: 'Constraint', definition: 'A condition that limits or shapes available options.' },
      { term: 'Follow-up', definition: 'A later action used to verify or complete the result.' },
    ],
    remediation: { passingScore: 80, reviewMessage: `Return to the named ${lesson.title} section, review the flashcards and worked process, complete the exercise, then retry the related check.`, objectiveMap: objectives, targetedActions: [{ objective: objectives[0], action: `Re-read the core-process section for ${lesson.title}, review the six flashcards, complete the decision worksheet, then retry the objective-aligned knowledge check.` }] },
    readiness: { domainKey, masteryThreshold: 80, evidenceSignals: ['knowledge-check mastery', 'completed decision exercise', 'practical evidence review'] },
  };

  return {
    objective,
    learningObjectives: objectives.slice(0, 3),
    content: { html, learning_points: learningPoints, scenario, experience },
    experience,
    quizQuestions: quiz,
    script: narrationScript,
    bulletPoints: learningPoints,
  };
}
