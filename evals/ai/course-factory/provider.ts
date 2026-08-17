import {
  generateAssessment,
  generateBlueprintFromAI,
  generateLessonContent,
} from '../../../lib/course-factory/content-generator';

type CourseFactoryEvalRequest =
  | {
      operation: 'lesson';
      input: {
        lessonTitle: string;
        lessonSlug: string;
        moduleTitle: string;
        courseTitle: string;
        state?: string;
        standardsBlock?: string;
      };
    }
  | {
      operation: 'assessment';
      input: {
        lessonSlug: string;
        lessonTitle: string;
        moduleTitle: string;
        courseTitle: string;
        questionCount?: number;
      };
    }
  | {
      operation: 'blueprint';
      input: {
        title: string;
        topic: string;
        audience: string;
        state?: string;
        credential?: string;
        moduleCount?: number;
        lessonsPerModule?: number;
      };
    };

function parseRequest(prompt: string): CourseFactoryEvalRequest {
  const parsed = JSON.parse(prompt) as Partial<CourseFactoryEvalRequest>;
  if (!parsed || typeof parsed !== 'object' || !('operation' in parsed) || !('input' in parsed)) {
    throw new Error('Course Factory eval request must contain operation and input');
  }
  if (!['lesson', 'assessment', 'blueprint'].includes(String(parsed.operation))) {
    throw new Error(`Unsupported Course Factory eval operation: ${String(parsed.operation)}`);
  }
  return parsed as CourseFactoryEvalRequest;
}

export default class CourseFactoryAIProvider {
  id() {
    return 'elevate-course-factory-production-runtime';
  }

  async callApi(prompt: string) {
    try {
      const request = parseRequest(prompt);
      let result: unknown;

      switch (request.operation) {
        case 'lesson':
          result = await generateLessonContent({
            lesson: {
              title: request.input.lessonTitle,
              slug: request.input.lessonSlug,
              order: 1,
            },
            moduleTitle: request.input.moduleTitle,
            courseTitle: request.input.courseTitle,
            state: request.input.state,
            standardsBlock: request.input.standardsBlock,
          });
          break;
        case 'assessment':
          result = await generateAssessment(request.input);
          break;
        case 'blueprint':
          result = await generateBlueprintFromAI(request.input);
          break;
      }

      return {
        output: JSON.stringify(result),
        metadata: {
          boundary: 'lib/course-factory/content-generator',
          operation: request.operation,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
