'use client';

import UniversalPracticeExam from '@/components/lms/UniversalPracticeExam';
import ElevatePracticeCenter, { type ElevatePracticeSection } from '@/components/lms/practice/ElevatePracticeCenter';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';

const SECTIONS: ElevatePracticeSection[] = [
  {
    key: 'core',
    label: 'Core',
    focus: 'Regulations, safety, refrigerants, recovery, and environmental responsibility',
    questions: (HVAC_QUIZ_BANKS['hvac-06'] ?? []).slice(0, 25),
    passingScore: 70,
  },
  {
    key: 'type-i',
    label: 'Type I',
    focus: 'Small appliances containing five pounds of refrigerant or less',
    questions: (HVAC_QUIZ_BANKS['hvac-07'] ?? []).slice(0, 25),
    passingScore: 70,
  },
  {
    key: 'type-ii',
    label: 'Type II',
    focus: 'High- and very-high-pressure appliances',
    questions: (HVAC_QUIZ_BANKS['hvac-08'] ?? []).slice(0, 25),
    passingScore: 70,
  },
  {
    key: 'type-iii',
    label: 'Type III',
    focus: 'Low-pressure appliances and chillers',
    questions: (HVAC_QUIZ_BANKS['hvac-09'] ?? []).slice(0, 25),
    passingScore: 70,
  },
];

export default function EPA608PracticeCenter({ courseId }: { courseId: string }) {
  return (
    <ElevatePracticeCenter
      courseId={courseId}
      title="Elevate EPA Section 608 Practice Center"
      description="Original Elevate preparation questions aligned to the public EPA Section 608 knowledge domains. These study tools are independently authored and are not official EPA, ESCO, or certification-exam questions."
      sections={SECTIONS}
      universal={{
        label: 'Universal Practice Simulation',
        description: 'Core plus Types I, II, and III. Readiness requires at least 70% in every section.',
        render: () => <UniversalPracticeExam />,
      }}
    />
  );
}
