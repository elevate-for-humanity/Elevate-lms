import {
  contractHash,
  stepInputHash,
  ULTIMATE_LESSON_CONTRACT_VERSION,
} from '../../lib/ultimate-course-builder/core/lesson-contract';
import {
  ULTIMATE_BUILD_STEPS,
  type UltimateBuildStep,
} from '../../lib/ultimate-course-builder/core/types';
/** Synthetic port outputs for orchestration tests; never production acceptance evidence. */
export const fixtureArtifact = (step: UltimateBuildStep): Record<string, any> =>
  ({
    standards_lock: { requirements: { version: 'test', competencies: [{ id: 'c' }] } },
    learning_objectives: {
      objectives: [{ id: 'o', text: 'Explain a supported concept', sourceRequirementIds: ['r'] }],
    },
    prerequisites: {
      prerequisites: { reviewRequired: false, checks: [], noneReason: 'Introductory lesson' },
    },
    teaching_sequence: {
      sequence: {
        stages: Array.from({ length: 13 }, () => ({
          instruction: 'Supported instruction',
          objectiveIds: ['o'],
        })),
      },
    },
    instructor_script: {
      script: {
        segments: [
          {
            id: 's',
            text: 'Supported instruction',
            objectiveIds: ['o'],
            sourceRequirementIds: ['r'],
          },
        ],
      },
    },
    storyboard: {
      storyboard: {
        scenes: Array.from({ length: 13 }, (_, i) => ({
          id: `s${i}`,
          scriptSegmentId: 's',
          dialogue: 'Supported instruction',
          visualRequirement: 'Actual example',
          objectiveIds: ['o'],
        })),
      },
    },
    visual_assignment: {
      media: {
        assignments: Array.from({length:13},(_,i)=>({
          sceneId:`s${i}`,assetId:`a${i}`,licenseEvidenceUrl:'https://example.org/license',relevanceReason:'An actual example',
        })),
      },
    },
    scene_construction: { scenes: { shots: [{ sceneId: 's', assetId: 'a', loop: false }] } },
    natural_narration: {
      narration: {
        segments: [
          {
            segmentId: 's',
            audioUrl: 'https://example.org/audio',
            durationSeconds: 5,
            text: 'Supported instruction',
          },
        ],
      },
    },
    synchronization: {
      timeline: {
        segments: [
          { startSeconds: 3, endSeconds: 8, captions: [{ text: 'Supported instruction' }] },
        ],
      },
    },
    active_teaching: {
      activities: [
        {
          id: 'a',
          prompt: 'Apply the concept',
          feedback: 'Explain the correction',
          objectiveIds: ['o'],
        },
      ],
    },
    mistakes_and_corrections: {
      mistakes: [
        {
          mistake: 'A specific error',
          correction: 'A specific correction',
          reason: 'A specific reason',
        },
      ],
    },
    assessment_alignment: {
      assessment: {
        questions: [
          {
            objectiveIds: ['o'],
            choices: ['Yes', 'No'],
            answerIndex: 0,
            explanation: 'Reason',
            remediation: 'Review',
          },
        ],
        reassessment: [{}],
      },
    },
    lesson_film_render: {
      render: {
        videoUrl: 'https://example.org/video',
        duration: 10,
        visualAssetCount: 13,
        distinctShots: 13,
        captionsUrl: 'https://example.org/captions',
        transcriptUrl: 'https://example.org/transcript',
      },
    },
    finished_media_qa: {
      mediaQA: {
        pass: true,
        inspection: {
          mediaSha256: 'test',
          actualTranscript: 'Supported instruction',
          readability: [{ wordCoverage: 1 }],
        },
      },
    },
    instructional_qa: {
      instructionalQA: {
        pass: true,
        objectiveEvidence: [{ objectiveId: 'o', deliveredExcerpt: 'Supported instruction' }],
      },
    },
    narration_qa: { narrationQA: { pass: true, source: 'delivered-mp4', mediaSha256: 'test' } },
    learner_runthrough: {
      learnerQA: { pass: true },
      learnerRuntimeEvidence: { evidence: { testRunId: 'test', observations: [{}] } },
    },
    selective_repair: { repair: { unresolved: 0, attempts: [] } },
    credential_release: {
      release: {
        blocked: false,
        traceability: { pass: true },
        rows: [{}],
        accessibility: { pass: true },
      },
    },
  })[step];
export function fixtureCheckpoint(profile: unknown, count: number) {
  const artifacts: any = {};
  for (const step of ULTIMATE_BUILD_STEPS.slice(0, count)) {
    const payload = fixtureArtifact(step);
    artifacts[step] = {
      ...payload,
      contractEvidence: {
        version: ULTIMATE_LESSON_CONTRACT_VERSION,
        inputHash: stepInputHash(step, profile, artifacts),
        outputHash: contractHash(payload),
        passed: true,
      },
    };
  }
  return artifacts;
}
