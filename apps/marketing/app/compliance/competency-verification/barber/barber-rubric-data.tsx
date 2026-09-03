export interface RubricItem {
  id: string;
  competency: string;
  assessmentMethod: string;
  assessmentCriteria: string;
  rtiHours: number;
  ojtHours: number;
  notes?: string;
}

export interface RubricSection {
  id: string;
  name: string;
  items: RubricItem[];
  /** Legacy print/scoring label derived from array position. */
  section: number;
  /** Legacy print/scoring title; canonical value is name. */
  title: string;
}

export interface BarberStats {
  totalCompetencies: number;
  sections: number;
  totalRTIHours: number;
  totalOJTHours: number;
}

type BaseRubricSection = Omit<RubricSection, 'section' | 'title'>;

const BASE_BARBER_SECTIONS: BaseRubricSection[] = [
  {
    id: 'sanitation',
    name: 'Sanitation & Safety',
    items: [
      {
        id: 'S1',
        competency: 'Demonstrate proper sanitation and sterilization procedures',
        assessmentMethod: 'Observation & Practical Test',
        assessmentCriteria: 'Follows OSHA guidelines, maintains clean station',
        rtiHours: 10,
        ojtHours: 20,
      },
      {
        id: 'S2',
        competency: 'Safety protocols and emergency procedures',
        assessmentMethod: 'Written Test & Observation',
        assessmentCriteria: 'Knows emergency exits, first aid location',
        rtiHours: 5,
        ojtHours: 5,
      },
    ],
  },
  {
    id: 'cutting',
    name: 'Haircutting Techniques',
    items: [
      {
        id: 'C1',
        competency: 'Basic haircuts (scissors, clippers)',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Clean lines, even length, client satisfaction',
        rtiHours: 30,
        ojtHours: 80,
      },
      {
        id: 'C2',
        competency: 'Clipper cutting techniques',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper guard usage, fade techniques',
        rtiHours: 20,
        ojtHours: 60,
      },
      {
        id: 'C3',
        competency: 'Razor cutting',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper razor angle, texture techniques',
        rtiHours: 15,
        ojtHours: 40,
      },
    ],
  },
  {
    id: 'shaving',
    name: 'Shaving & Facial Services',
    items: [
      {
        id: 'SH1',
        competency: 'Traditional straight razor shave',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper prep, shave, and aftercare',
        rtiHours: 25,
        ojtHours: 60,
      },
      {
        id: 'SH2',
        competency: 'Facial massage and treatments',
        assessmentMethod: 'Observation',
        assessmentCriteria: 'Proper technique, client comfort',
        rtiHours: 10,
        ojtHours: 20,
      },
    ],
  },
  {
    id: 'services',
    name: 'Chemical Services',
    items: [
      {
        id: 'CS1',
        competency: 'Hair coloring basics',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Color mixing, application, timing',
        rtiHours: 20,
        ojtHours: 40,
      },
      {
        id: 'CS2',
        competency: 'Relaxers and texturizers',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper application, timing, safety',
        rtiHours: 15,
        ojtHours: 30,
      },
    ],
  },
  {
    id: 'business',
    name: 'Business & Professionalism',
    items: [
      {
        id: 'B1',
        competency: 'Client consultation',
        assessmentMethod: 'Observation',
        assessmentCriteria: 'Professional communication, needs assessment',
        rtiHours: 10,
        ojtHours: 30,
      },
      {
        id: 'B2',
        competency: 'Inventory and retail',
        assessmentMethod: 'Task Completion',
        assessmentCriteria: 'Product knowledge, sales techniques',
        rtiHours: 10,
        ojtHours: 20,
      },
    ],
  },
];

export const BARBER_SECTIONS: RubricSection[] = BASE_BARBER_SECTIONS.map((section, index) => ({
  ...section,
  section: index + 1,
  title: section.name,
}));

export const BARBER_STATS: BarberStats = {
  totalCompetencies: 14,
  sections: 5,
  totalRTIHours: 260,
  totalOJTHours: 1500,
};
