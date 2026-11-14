export interface CosmetologyItem {
  id: string;
  competency: string;
  assessmentMethod: string;
  assessmentCriteria: string;
  rtiHours: number;
  ojtHours: number;
  /** Legacy public/scoring alias derived from assessmentMethod. */
  assessmentType: string;
}

export interface CosmetologySection {
  id: string;
  name: string;
  items: CosmetologyItem[];
  /** Legacy print/scoring label derived from array position. */
  section: number;
  /** Legacy print/scoring title; canonical value is name. */
  title: string;
  description: string;
}

type BaseCosmetologyItem = Omit<CosmetologyItem, 'assessmentType'>;
type BaseCosmetologySection = {
  id: string;
  name: string;
  items: BaseCosmetologyItem[];
};

const BASE_COSMETOLOGY_SECTIONS: BaseCosmetologySection[] = [
  {
    id: 'hair',
    name: 'Hair Care Services',
    items: [
      {
        id: 'H1',
        competency: 'Haircutting fundamentals',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Clean cuts, proper tools',
        rtiHours: 40,
        ojtHours: 100,
      },
      {
        id: 'H2',
        competency: 'Hair coloring and lightening',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Color theory, application techniques',
        rtiHours: 50,
        ojtHours: 120,
      },
      {
        id: 'H3',
        competency: 'Chemical texturizing (perms, relaxers)',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper mixing, application, timing',
        rtiHours: 35,
        ojtHours: 80,
      },
    ],
  },
  {
    id: 'skin',
    name: 'Skin Care Services',
    items: [
      {
        id: 'SK1',
        competency: 'Facial treatments',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Cleansing, exfoliation, massage',
        rtiHours: 30,
        ojtHours: 60,
      },
      {
        id: 'SK2',
        competency: 'Hair removal techniques',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Waxing, tweezing, safety',
        rtiHours: 20,
        ojtHours: 40,
      },
    ],
  },
  {
    id: 'nails',
    name: 'Nail Care Services',
    items: [
      {
        id: 'N1',
        competency: 'Manicuring and pedicuring',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Proper techniques, sanitation',
        rtiHours: 25,
        ojtHours: 50,
      },
      {
        id: 'N2',
        competency: 'Nail extensions and art',
        assessmentMethod: 'Practical Demonstration',
        assessmentCriteria: 'Application, maintenance',
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
        assessmentCriteria: 'Needs assessment, recommendations',
        rtiHours: 10,
        ojtHours: 20,
      },
      {
        id: 'B2',
        competency: 'Sanitation and safety',
        assessmentMethod: 'Written & Practical Test',
        assessmentCriteria: 'State board requirements',
        rtiHours: 15,
        ojtHours: 10,
      },
    ],
  },
];

export const COSMETOLOGY_SECTIONS: CosmetologySection[] = BASE_COSMETOLOGY_SECTIONS.map((section, index) => ({
  ...section,
  section: index + 1,
  title: section.name,
  description: `${section.name} competency verification`,
  items: section.items.map((item) => ({
    ...item,
    assessmentType: item.assessmentMethod,
  })),
}));
