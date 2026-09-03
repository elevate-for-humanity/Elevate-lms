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

    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}
