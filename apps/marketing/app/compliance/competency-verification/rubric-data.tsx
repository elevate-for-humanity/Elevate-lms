export interface Competency {
  id: string;
  name: string;
  category: string;
  rtiHours: number;
  ojtHours: number;
  assessmentType: string;
  description: string;
  /** Derived display role used by the public audit matrix. */
  evaluator: string;
  /** Derived from the canonical competency description until a program-specific checklist is supplied. */
  passCriteria: string[];
}

export interface ProgramRubric {
  id: string;
  program: string;
  occupation: string;
  totalCompetencies: number;
  scoringScale: string;
  competencies: Competency[];
}

export interface RubricItem {
  id: string;
  name: string;
  category: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  levels: {
    proficient: string;
    developing: string;
    beginning: string;
  };
}

type BaseCompetency = Omit<Competency, 'evaluator' | 'passCriteria'>;
type BaseProgramRubric = Omit<ProgramRubric, 'competencies'> & { competencies: BaseCompetency[] };

const BASE_RUBRICS: BaseProgramRubric[] = [
  {
    id: 'barber',
    program: 'Barber Apprenticeship',
    occupation: 'Licensed Barber',
    totalCompetencies: 14,
    scoringScale: '1–5 Rubric Scale',
    competencies: [
      { id: 'B1', name: 'Sanitation & Safety Procedures', category: 'Core Skills', rtiHours: 10, ojtHours: 20, assessmentType: 'Observation', description: 'Demonstrates proper sanitation and safety protocols' },
      { id: 'B2', name: 'Basic Haircutting', category: 'Core Skills', rtiHours: 30, ojtHours: 80, assessmentType: 'Practical Test', description: 'Performs basic haircuts using scissors and clippers' },
      { id: 'B3', name: 'Clipper Techniques', category: 'Core Skills', rtiHours: 20, ojtHours: 60, assessmentType: 'Practical Test', description: 'Uses clippers with proper guard techniques' },
      { id: 'B4', name: 'Razor Cutting', category: 'Advanced Skills', rtiHours: 25, ojtHours: 50, assessmentType: 'Practical Test', description: 'Performs razor cuts and texture techniques' },
      { id: 'B5', name: 'Shaving Services', category: 'Core Skills', rtiHours: 20, ojtHours: 40, assessmentType: 'Practical Test', description: 'Provides traditional and modern shaving services' },
    ],
  },
  {
    id: 'cosmetology',
    program: 'Cosmetology Apprenticeship',
    occupation: 'Licensed Cosmetologist',
    totalCompetencies: 18,
    scoringScale: '1–5 Rubric Scale',
    competencies: [
      { id: 'C1', name: 'Hair Coloring & Lightening', category: 'Technical', rtiHours: 50, ojtHours: 120, assessmentType: 'Practical Test', description: 'Applies color, highlights, and corrective color' },
      { id: 'C2', name: 'Chemical Texturizing', category: 'Technical', rtiHours: 35, ojtHours: 80, assessmentType: 'Practical Test', description: 'Performs perms, relaxers, and keratin treatments' },
      { id: 'C3', name: 'Nail Care Services', category: 'Core Skills', rtiHours: 25, ojtHours: 50, assessmentType: 'Practical Test', description: 'Provides manicures, pedicures, and nail art' },
      { id: 'C4', name: 'Skincare & Facials', category: 'Core Skills', rtiHours: 30, ojtHours: 60, assessmentType: 'Practical Test', description: 'Performs facials, extractions, and skin treatments' },
      { id: 'C5', name: 'Hair Styling & Updos', category: 'Core Skills', rtiHours: 30, ojtHours: 70, assessmentType: 'Practical Test', description: 'Creates styles, updos, and special occasion hair' },
    ],
  },
  {
    id: 'hvac',
    program: 'HVAC Technician Program',
    occupation: 'HVAC Technician',
    totalCompetencies: 16,
    scoringScale: 'Pass/Fail + Skills Check',
    competencies: [
      { id: 'H1', name: 'Refrigeration Fundamentals', category: 'Technical', rtiHours: 40, ojtHours: 100, assessmentType: 'Written & Practical', description: 'Understands refrigeration cycle and components' },
      { id: 'H2', name: 'Electrical Systems', category: 'Technical', rtiHours: 35, ojtHours: 90, assessmentType: 'Practical Test', description: 'Diagnoses and repairs electrical issues' },
      { id: 'H3', name: 'EPA 608 Certification', category: 'Certification', rtiHours: 20, ojtHours: 30, assessmentType: 'Written Exam', description: 'Passes EPA 608 universal certification exam' },
      { id: 'H4', name: 'System Installation', category: 'Practical', rtiHours: 30, ojtHours: 80, assessmentType: 'Practical Test', description: 'Installs residential and commercial HVAC systems' },
    ],
  },
];

function evaluatorFor(competency: BaseCompetency): string {
  if (competency.category === 'Certification') return 'Credential / testing provider';
  if (competency.assessmentType.toLowerCase().includes('practical')) return 'Qualified instructor or workplace supervisor';
  return 'Qualified instructor';
}

export const ALL_RUBRICS: ProgramRubric[] = BASE_RUBRICS.map((rubric) => ({
  ...rubric,
  competencies: rubric.competencies.map((competency) => ({
    ...competency,
    evaluator: evaluatorFor(competency),
    passCriteria: [competency.description],
  })),
}));
