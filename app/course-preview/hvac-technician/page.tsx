export const dynamic = 'force-dynamic';
/**
 * Server component — loads all HVAC static data from JSON files
 * and passes to the client component. Keeps static data arrays
 * out of the webpack module graph entirely.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import HVACClassroomPreview from './CoursePreviewClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


function loadJson(filename: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'public/data', filename), 'utf8'));
}

export default function HVACCoursePreviewPage() {
  const quizBanks = loadJson('hvac-quiz-banks.json');
  const visualLibraryData = loadJson('hvac-visual-library.json');
  const equipmentModels = loadJson('hvac-equipment-models.json');
  const serviceScenarios = loadJson('hvac-service-scenarios.json');
  const condenserScenarios = loadJson('condenser-scenarios.json');
  const courseDefinitions = loadJson('course-definitions.json');
  const epa608Data = loadJson('hvac-epa608-prep.json');

  const course = courseDefinitions.find((c: any) => c.slug === 'hvac-technician');

  return (
    <HVACClassroomPreview
      course={course}
      quizBanks={quizBanks}
      visualLibrary={visualLibraryData.HVAC_VISUAL_LIBRARY ?? []}
      equipmentModels={equipmentModels}
      serviceScenarios={serviceScenarios}
      condenserScenarios={condenserScenarios}
      epa608Questions={epa608Data.EPA608_QUESTIONS ?? []}
      epa608Sections={epa608Data.EPA608_SECTIONS ?? []}
    />
  );
}
