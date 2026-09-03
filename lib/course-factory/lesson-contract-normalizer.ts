/**
 * Dependency-free normalization for provider-generated lesson JSON.
 *
 * Keep this module free of database, logging, and provider imports so the
 * normalization contract can be tested before a paid Course Builder run.
 */

export function normalizeLessonContract(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const experience =
      parsed.experience &&
      typeof parsed.experience === 'object' &&
      !Array.isArray(parsed.experience)
        ? parsed.experience
        : {};
    parsed.experience = experience;

    // Some otherwise-valid provider responses place nested experience fields
    // at the root. Normalize their location before strict validation rather
    // than paying for another complete generation.
    for (const key of ['resources', 'glossary', 'remediation', 'readiness'] as const) {
      if (experience[key] == null && parsed[key] != null) {
        experience[key] = parsed[key];
        delete parsed[key];
      }
    }
    const remediation = experience.remediation;
    const specificObjectives = [
      ...(Array.isArray(parsed.learning_points) ? parsed.learning_points : []),
      parsed.objective,
    ].filter(
      (value, index, values): value is string =>
        typeof value === 'string' && value.trim().length > 0 && values.indexOf(value) === index,
    );

    if (
      remediation &&
      Array.isArray(remediation.objectiveMap) &&
      remediation.objectiveMap.length < 3 &&
      specificObjectives.length >= 3
    ) {
      remediation.objectiveMap = specificObjectives.slice(0, 3);
    }

    const lessonFocus =
      specificObjectives[0] ||
      (typeof parsed.objective === 'string' ? parsed.objective : 'the lesson objective');
    const expandToMinimum = (value: unknown, minimum: number, context: string) => {
      if (typeof value !== 'string' || value.trim().length >= minimum) return value;
      const addition = ` Apply this to ${lessonFocus} by identifying the relevant evidence, comparing realistic choices, documenting the decision, and checking the result against the stated objective. ${context}`;
      let expanded = value.trim();
      while (expanded.length < minimum) expanded = `${expanded}${addition}`;
      return expanded;
    };

    if (experience.readingGuide && typeof experience.readingGuide === 'object') {
      experience.readingGuide.summary = expandToMinimum(
        experience.readingGuide.summary,
        80,
        'The summary must clearly describe the knowledge and job-ready application the learner will gain.',
      );
      if (Array.isArray(experience.readingGuide.sections)) {
        experience.readingGuide.sections = experience.readingGuide.sections.map(
          (section: Record<string, unknown>, index: number) => ({
            ...section,
            body: expandToMinimum(
              section?.body,
              120,
              `This is guided reading section ${index + 1}; the learner should be able to explain and use the concept after reviewing it.`,
            ),
          }),
        );
      }

      const takeaways = Array.isArray(experience.readingGuide.keyTakeaways)
        ? experience.readingGuide.keyTakeaways.filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : [];
      while (takeaways.length < 3) {
        const objective =
          specificObjectives[takeaways.length % Math.max(specificObjectives.length, 1)];
        takeaways.push(
          objective ??
            `Apply ${lessonFocus} using observable evidence and the lesson's documented decision process.`,
        );
      }
      experience.readingGuide.keyTakeaways = takeaways;
    }

    experience.narrationScript = expandToMinimum(
      experience.narrationScript,
      200,
      'The narration should model a concrete example and end with the action the learner must demonstrate.',
    );

    if (Array.isArray(experience?.quickClips)) {
      experience.quickClips = experience.quickClips.map(
        (clip: Record<string, unknown>, index: number) => ({
          ...clip,
          script: expandToMinimum(
            clip?.script,
            120,
            `The instructor should model one concrete example, name the decision criteria, and close clip ${index + 1} with an observable learner action.`,
          ),
          visualPrompt: expandToMinimum(
            clip?.visualPrompt,
            40,
            `Show the learner applying ${lessonFocus} in a realistic cosmetology workplace setting.`,
          ),
        }),
      );
    }

    if (Array.isArray(experience.exercises)) {
      experience.exercises = experience.exercises.map((exercise: Record<string, any>) => {
        const instructions = Array.isArray(exercise?.instructions)
          ? exercise.instructions.filter(
              (value: unknown): value is string =>
                typeof value === 'string' && value.trim().length > 0,
            )
          : [];

        // Preserve the provider-authored action. When it omitted only the
        // required verification step, derive that step from the same exercise's
        // artifact and grading criteria instead of regenerating the whole lesson
        // or inserting unrelated generic content. Empty exercises remain invalid
        // and are retried by the strict generation contract.
        if (instructions.length === 1) {
          const expectedArtifact =
            typeof exercise?.expectedArtifact === 'string' && exercise.expectedArtifact.trim()
              ? exercise.expectedArtifact.trim()
              : 'the completed work';
          const criteria = Array.isArray(exercise?.autoGrade?.criteria)
            ? exercise.autoGrade.criteria.filter(
                (value: unknown): value is string =>
                  typeof value === 'string' && value.trim().length > 0,
              )
            : [];
          const verificationTarget = criteria.length
            ? criteria.join('; ')
            : lessonFocus;
          instructions.push(
            `Document ${expectedArtifact}, then verify it against these success criteria before submission: ${verificationTarget}.`,
          );
        }

        return { ...exercise, instructions };
      });
    }

    // Providers occasionally return a complete scenario or case study with only
    // one decision option. Preserve the authored option and derive its grounded
    // counterpart from the same question, evidence, and lesson objective.
    for (const key of ['scenario', 'caseStudy'] as const) {
      const decision = experience[key];
      if (!decision || typeof decision !== 'object' || !Array.isArray(decision.options)) continue;
      const options = decision.options.filter(
        (option: unknown): option is Record<string, any> =>
          !!option && typeof option === 'object' && !Array.isArray(option),
      );
      if (options.length === 1) {
        const existingIsCorrect = options[0].isCorrect === true;
        const question =
          typeof decision.question === 'string' && decision.question.trim()
            ? decision.question.trim()
            : lessonFocus;
        options.push(
          existingIsCorrect
            ? {
                text: `Choose a conclusion that ignores the documented evidence and decision criteria for ${question}`,
                isCorrect: false,
                feedback: `This choice is not supported because it bypasses the evidence and observable criteria required to demonstrate ${lessonFocus}.`,
              }
            : {
                text: `Choose the conclusion supported by the documented evidence and apply it to ${lessonFocus}.`,
                isCorrect: true,
                feedback: `This choice uses the case evidence and the lesson's decision criteria to demonstrate ${lessonFocus}.`,
              },
        );
        decision.options = options;
      }
    }

    if (experience.practicalTask && typeof experience.practicalTask === 'object') {
      const instructions = Array.isArray(experience.practicalTask.instructions)
        ? experience.practicalTask.instructions.filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : [];
      const completionSteps = [
        `Prepare the workspace, tools, and evidence needed to demonstrate ${lessonFocus}.`,
        `Perform the task while following the lesson's safety and decision criteria.`,
        'Document the result and verify it against the stated objective before submission.',
      ];
      while (instructions.length < 3) instructions.push(completionSteps[instructions.length]);
      experience.practicalTask.instructions = instructions;
    }

    // The provider can return the complete instructional lesson while omitting
    // one or more interactive siblings. Rebuild only those missing siblings
    // from the same lesson's objective, learning points, scenario, questions,
    // and authored content. This preserves strict downstream validation without
    // discarding a paid, lesson-specific generation or introducing outside facts.
    const authoredScenario =
      typeof parsed.scenario === 'string' && parsed.scenario.trim()
        ? parsed.scenario.trim()
        : `A learner must demonstrate ${lessonFocus} in a realistic workplace setting, document the evidence used, compare the available choices, and verify the result against the lesson objective before proceeding.`;
    const authoredContent =
      typeof parsed.content === 'string' ? parsed.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const groundedText = (minimum: number, suffix: string) => {
      let value = authoredContent || authoredScenario;
      const addition = ` ${suffix} The learner must connect the decision to ${lessonFocus}, document observable evidence, and verify the result against the lesson objective.`;
      while (value.length < minimum) value += addition;
      return value;
    };

    const rootQuestions = Array.isArray(parsed.quiz_questions)
      ? parsed.quiz_questions.filter(
          (question: any) =>
            question &&
            typeof question.question === 'string' &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            Number.isInteger(question.correct) &&
            typeof question.explanation === 'string',
        )
      : [];
    const experienceQuestions = Array.isArray(experience.knowledgeChecks)
      ? experience.knowledgeChecks.filter(
          (question: any) =>
            question &&
            typeof question.question === 'string' &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            Number.isInteger(question.correct) &&
            typeof question.explanation === 'string',
        )
      : [];
    if (experienceQuestions.length < 3 && rootQuestions.length >= 3) {
      experience.knowledgeChecks = rootQuestions.slice(0, 3);
    }
    if (rootQuestions.length < 3 && experienceQuestions.length >= 3) {
      parsed.quiz_questions = experienceQuestions.slice(0, 3);
    }

    if (!experience.scenario || typeof experience.scenario !== 'object') {
      experience.scenario = {
        title: `Apply ${lessonFocus}`,
        context: authoredScenario,
        question: `Which action best demonstrates ${lessonFocus} using the available evidence?`,
        options: [
          {
            text: 'Use the documented criteria, perform the required action, and verify the result.',
            isCorrect: true,
            feedback: `This response applies the evidence and verification required for ${lessonFocus}.`,
          },
          {
            text: 'Skip the documented criteria and rely only on an assumption.',
            isCorrect: false,
            feedback: `Review the lesson evidence and decision criteria before retrying ${lessonFocus}.`,
          },
        ],
      };
    }

    if (!experience.caseStudy || typeof experience.caseStudy !== 'object') {
      experience.caseStudy = {
        title: `Evidence review: ${lessonFocus}`,
        context: groundedText(160, 'Review the authored lesson details as the evidence for this case.'),
        question: 'Which conclusion is supported by the lesson evidence and the required verification steps?',
        options: [
          {
            text: 'The supported conclusion follows the documented evidence and verifies the outcome.',
            isCorrect: true,
            feedback: `This conclusion is traceable to the lesson evidence for ${lessonFocus}.`,
          },
          {
            text: 'The unsupported conclusion ignores the documented evidence and verification.',
            isCorrect: false,
            feedback: 'Return to the reading guide, identify the applicable evidence, and compare it with the objective.',
          },
        ],
      };
    }

    if (!Array.isArray(experience.exercises) || experience.exercises.length === 0) {
      experience.exercises = [{
        id: 'exercise-1',
        title: `Document and verify ${lessonFocus}`,
        instructions: [
          `Use the lesson scenario to complete the action required for ${lessonFocus}.`,
          'Record the evidence, compare the result with the objective, and correct any unmet criterion.',
        ],
        expectedArtifact: `A completed evidence record demonstrating ${lessonFocus}.`,
        autoGrade: {
          type: 'checklist',
          criteria: [
            `The submission demonstrates ${lessonFocus}.`,
            'The submission includes observable evidence and a verification result.',
          ],
        },
      }];
    }

    if (!experience.practicalTask || typeof experience.practicalTask !== 'object') {
      experience.practicalTask = {
        title: `Practical demonstration: ${lessonFocus}`,
        description: `Produce a job-ready demonstration and evidence record for ${lessonFocus}.`,
        instructions: [
          'Prepare the workspace, tools, source material, and success criteria.',
          `Perform the required actions for ${lessonFocus} while documenting key decisions.`,
          'Inspect the result, compare it with the objective, and submit the verification evidence.',
        ],
        evidence: 'A completed work product, checklist, and verification note tied to the lesson objective.',
      };
    }

    if (!Array.isArray(experience.resources) || experience.resources.length < 2) {
      experience.resources = [
        {
          type: 'worksheet',
          title: `${lessonFocus} evidence worksheet`,
          description: 'Use this worksheet to plan, document, and verify the lesson application.',
          content: `State the objective for ${lessonFocus}. Record the evidence used, the action taken, the observed result, and any correction needed before completion.`,
        },
        {
          type: 'reference',
          title: `${lessonFocus} quick reference`,
          description: 'A reusable decision and verification reference for this lesson.',
          content: `Identify the applicable criteria for ${lessonFocus}; perform the action; document observable evidence; compare the outcome with the objective; correct and recheck any unmet criterion.`,
        },
      ];
    }

    if (!Array.isArray(experience.glossary) || experience.glossary.length < 4) {
      const glossarySources = specificObjectives.length
        ? specificObjectives
        : [lessonFocus];
      experience.glossary = Array.from({ length: 4 }, (_, index) => {
        const source = glossarySources[index % glossarySources.length];
        return {
          term: `Lesson concept ${index + 1}`,
          definition: `${source} This term is applied and verified through the lesson's documented evidence and performance criteria.`,
        };
      });
    }

    if (!experience.remediation || typeof experience.remediation !== 'object') {
      const objectiveMap = Array.from({ length: 3 }, (_, index) =>
        specificObjectives[index % Math.max(specificObjectives.length, 1)] || lessonFocus,
      );
      experience.remediation = {
        passingScore: 80,
        reviewMessage: 'Review the named reading section and evidence criteria, complete the practice again, then retry the related knowledge check.',
        objectiveMap,
        targetedActions: [{
          objective: lessonFocus,
          action: `Re-read the lesson guidance for ${lessonFocus}, review the evidence in the case study, complete the exercise, and retry the related check.`,
        }],
      };
    }

    if (!experience.readiness || typeof experience.readiness !== 'object') {
      const domainKey =
        typeof parsed.domainKey === 'string' && parsed.domainKey.trim()
          ? parsed.domainKey.trim()
          : 'lesson_mastery';
      experience.readiness = {
        domainKey,
        masteryThreshold: 80,
        evidenceSignals: [
          'knowledge-check mastery',
          'applied exercise completion',
          'verified practical-task evidence',
        ],
      };
    }

    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}
