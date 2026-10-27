import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { barberApprenticeshipBlueprint } from '@/lib/curriculum/blueprints/barber';

const BARBER_SOURCE_LESSONS: Record<string, string[]> = {
  'barber-a': [
    'barber-lesson-15',
    'barber-lesson-16',
    'barber-lesson-22',
    'barber-lesson-23',
    'barber-lesson-24',
    'barber-lesson-25',
    'barber-lesson-26',
    'barber-lesson-27',
  ],
  'barber-b': ['barber-lesson-31', 'barber-lesson-33'],
  'barber-c': ['barber-lesson-17', 'barber-lesson-29', 'barber-lesson-30', 'barber-lesson-32'],
  'barber-d': ['barber-lesson-3', 'barber-lesson-4', 'barber-lesson-18'],
  'barber-e': ['barber-lesson-6', 'barber-lesson-12'],
  'barber-f': ['barber-lesson-4', 'barber-lesson-5'],
  'barber-g': ['barber-lesson-42'],
  'barber-h': ['barber-lesson-40', 'barber-lesson-41', 'barber-lesson-42', 'barber-lesson-43'],
  'barber-i': ['barber-lesson-41', 'barber-lesson-43'],
  'barber-j': [
    'barber-lesson-43',
    'barber-lesson-46',
    'barber-lesson-47',
    'barber-lesson-48',
    'barber-lesson-49',
  ],
  'barber-k': ['barber-lesson-41', 'barber-lesson-42'],
  'barber-l': ['barber-lesson-40', 'barber-lesson-44'],
  'barber-m': ['barber-lesson-6', 'barber-lesson-12', 'barber-lesson-40', 'barber-lesson-42'],
  'barber-protective-coverings': ['barber-lesson-4', 'barber-lesson-20'],
};

function stripMarkup(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function registeredInstructionalSources(programSlug: string) {
  if (programSlug !== 'barber-apprenticeship') return [];
  const lessons = new Map(
    barberApprenticeshipBlueprint.modules.flatMap((module) =>
      module.lessons.map((lesson) => [lesson.slug, { module: module.title, lesson }] as const),
    ),
  );
  const order = getRegisteredProgramStandard(programSlug)!.standard.competencies.map(c => c.id);
  return Object.entries(BARBER_SOURCE_LESSONS).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)).map(([competencyId, lessonSlugs]) => {
    const text = lessonSlugs
      .map((slug) => {
        const entry = lessons.get(slug);
        if (!entry?.lesson.content) {
          throw new Error(`ULTIMATE_REGISTERED_SOURCE_MISSING:${competencyId}:${slug}`);
        }
        return [
          `Module: ${entry.module}`,
          `Lesson: ${entry.lesson.title}`,
          `Objective: ${entry.lesson.objective}`,
          `Authorized content: ${stripMarkup(entry.lesson.content)}`,
        ].join('\n');
      })
      .join('\n\n');
    return { id: competencyId, text };
  });
}
