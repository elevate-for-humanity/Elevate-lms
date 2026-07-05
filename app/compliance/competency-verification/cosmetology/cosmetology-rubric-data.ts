export type RubricItem = {
  id: string;
  competency: string;
  rtiHours: number;
  ojtHours: number;
  assessmentType: string;
  evaluator: string;
  passCriteria: string[];
  failurePolicy?: string;
};

export type RubricSection = {
  section: number;
  title: string;
  description: string;
  items: RubricItem[];
};

const SECTION_1: RubricSection = {
  section: 1,
  title: 'Sanitation, Safety & State Compliance',
  description:
    'Non-negotiable competencies required by Indiana PLA and state board standards. Failure in any sanitation competency triggers automatic remediation before advancement.',
  items: [
    {
      id: 'SAN-01',
      competency: 'Tool Disinfection Procedures',
      rtiHours: 4,
      ojtHours: 15,
      assessmentType: 'Practical observation + checklist',
      evaluator: 'Licensed Cosmetology Instructor (RTI) + Salon Supervisor (OJT)',
      passCriteria: [
        'Disinfects all implements between each client using EPA-registered disinfectant',
        'Immersion time meets manufacturer and state board requirements',
        'Proper storage of disinfected tools in closed container',
        'Single-use items discarded after each client',
      ],
      failurePolicy: 'Automatic remediation required. Cannot advance to client services until re-assessed.',
    },
    {
      id: 'SAN-02',
      competency: 'Station Sanitation Setup & Breakdown',
      rtiHours: 3,
      ojtHours: 10,
      assessmentType: 'Practical observation',
      evaluator: 'Licensed Cosmetology Instructor + Salon Supervisor',
      passCriteria: [
        'Workstation cleaned and sanitized before and after each client',
        'Chair, headrest, and armrests wiped with approved disinfectant',
        'Cape laundered or disposable cape replaced per client',
        'Shampoo bowl sanitized between clients',
      ],
    },
    {
      id: 'SAN-03',
      competency: 'PPE & Personal Hygiene Standards',
      rtiHours: 2,
      ojtHours: 5,
      assessmentType: 'Observation',
      evaluator: 'Salon Supervisor',
      passCriteria: [
        'Gloves worn during chemical services',
        'Hands washed before and after each client',
        'Professional appearance maintained per salon standards',
      ],
    },
  ],
};

const SECTION_2: RubricSection = {
  section: 2,
  title: 'Hair Services — Cutting & Styling',
  description: 'Core technical competencies for hair cutting, styling, and finishing.',
  items: [
    {
      id: 'HAIR-01',
      competency: 'Consultation & Hair Analysis',
      rtiHours: 6,
      ojtHours: 20,
      assessmentType: 'Practical + client interaction observation',
      evaluator: 'Licensed Cosmetology Instructor + Salon Supervisor',
      passCriteria: [
        'Conducts thorough client consultation before each service',
        'Identifies hair type, texture, density, and condition',
        'Documents service history and client preferences',
        'Recommends appropriate services based on analysis',
      ],
    },
    {
      id: 'HAIR-02',
      competency: 'Haircut Techniques (Blunt, Layered, Graduated)',
      rtiHours: 20,
      ojtHours: 80,
      assessmentType: 'Practical observation on live clients',
      evaluator: 'Licensed Cosmetology Instructor + Salon Supervisor',
      passCriteria: [
        'Executes blunt, layered, and graduated cuts to client specification',
        'Maintains consistent sections and tension throughout cut',
        'Completes service within industry-standard time',
        'Client satisfaction confirmed at completion',
      ],
    },
    {
      id: 'HAIR-03',
      competency: 'Blow-Dry & Thermal Styling',
      rtiHours: 10,
      ojtHours: 40,
      assessmentType: 'Practical observation',
      evaluator: 'Salon Supervisor',
      passCriteria: [
        'Selects appropriate heat setting for hair type',
        'Uses round brush and flat iron techniques correctly',
        'Achieves smooth, polished finish without heat damage',
      ],
    },
  ],
};

const SECTION_3: RubricSection = {
  section: 3,
  title: 'Chemical Services',
  description: 'Color, perms, relaxers, and chemical treatments. Requires instructor sign-off before performing on clients.',
  items: [
    {
      id: 'CHEM-01',
      competency: 'Hair Color Application (Single Process)',
      rtiHours: 15,
      ojtHours: 50,
      assessmentType: 'Practical observation + formula documentation',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Performs patch test 24–48 hours before service',
        'Mixes color formula accurately per manufacturer instructions',
        'Applies color evenly from roots to ends',
        'Processes and rinses within manufacturer timing',
        'Documents formula for client record',
      ],
      failurePolicy: 'Must complete additional RTI hours before performing on clients.',
    },
    {
      id: 'CHEM-02',
      competency: 'Highlights & Balayage',
      rtiHours: 12,
      ojtHours: 40,
      assessmentType: 'Practical observation',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Sections hair correctly for foil or balayage technique',
        'Achieves consistent lightening without banding',
        'Tones result to desired level',
      ],
    },
    {
      id: 'CHEM-03',
      competency: 'Relaxer & Keratin Treatments',
      rtiHours: 8,
      ojtHours: 25,
      assessmentType: 'Practical observation + safety checklist',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Performs strand and scalp analysis before application',
        'Applies protective base to scalp',
        'Monitors processing time and performs strand test',
        'Neutralizes and conditions correctly',
      ],
      failurePolicy: 'Must complete additional RTI hours before performing on clients.',
    },
  ],
};

const SECTION_4: RubricSection = {
  section: 4,
  title: 'Skin Care & Facial Services',
  description: 'Basic facial and skin care services within cosmetology scope of practice.',
  items: [
    {
      id: 'SKIN-01',
      competency: 'Basic Facial & Skin Analysis',
      rtiHours: 8,
      ojtHours: 20,
      assessmentType: 'Practical observation',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Identifies skin type (oily, dry, combination, sensitive)',
        'Performs cleanse, exfoliate, mask, and moisturize sequence',
        'Selects appropriate products for skin type',
        'Maintains sanitation throughout service',
      ],
    },
    {
      id: 'SKIN-02',
      competency: 'Eyebrow Shaping & Waxing',
      rtiHours: 4,
      ojtHours: 15,
      assessmentType: 'Practical observation',
      evaluator: 'Salon Supervisor',
      passCriteria: [
        'Tests wax temperature before application',
        'Applies and removes wax in direction of hair growth',
        'Achieves symmetrical brow shape',
        'Applies post-wax soothing product',
      ],
    },
  ],
};

const SECTION_5: RubricSection = {
  section: 5,
  title: 'Nail Services',
  description: 'Basic manicure and pedicure services within cosmetology scope of practice.',
  items: [
    {
      id: 'NAIL-01',
      competency: 'Manicure & Pedicure',
      rtiHours: 6,
      ojtHours: 20,
      assessmentType: 'Practical observation',
      evaluator: 'Licensed Cosmetology Instructor + Salon Supervisor',
      passCriteria: [
        'Sanitizes implements and foot basin between clients',
        'Performs nail shaping, cuticle care, and polish application',
        'Achieves smooth, even polish with no flooding of cuticle',
        'Completes service within industry-standard time',
      ],
    },
  ],
};

const SECTION_6: RubricSection = {
  section: 6,
  title: 'Client Relations & Salon Business',
  description: 'Professional skills required for salon employment and client retention.',
  items: [
    {
      id: 'BIZ-01',
      competency: 'Client Communication & Retention',
      rtiHours: 6,
      ojtHours: 20,
      assessmentType: 'Observation + supervisor evaluation',
      evaluator: 'Salon Supervisor',
      passCriteria: [
        'Greets and checks in clients professionally',
        'Communicates service details and pricing clearly',
        'Handles client concerns without escalation',
        'Recommends retail products appropriately',
        'Books follow-up appointments at checkout',
      ],
    },
    {
      id: 'BIZ-02',
      competency: 'Salon Operations & Scheduling',
      rtiHours: 4,
      ojtHours: 15,
      assessmentType: 'Observation',
      evaluator: 'Salon Supervisor',
      passCriteria: [
        'Uses salon booking software to manage appointments',
        'Processes payments accurately',
        'Maintains inventory awareness and reports low stock',
        'Opens and closes station per salon protocol',
      ],
    },
  ],
};

const SECTION_7: RubricSection = {
  section: 7,
  title: 'State Board Exam Readiness',
  description: 'Final competency verification confirming readiness for Indiana State Board examination.',
  items: [
    {
      id: 'BOARD-01',
      competency: 'Written Exam Preparation',
      rtiHours: 10,
      ojtHours: 0,
      assessmentType: 'Practice exam (80% pass threshold)',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Scores 80% or higher on three consecutive practice exams',
        'Demonstrates knowledge of Indiana cosmetology law and rules',
        'Completes all required RTI hours (500 minimum)',
      ],
    },
    {
      id: 'BOARD-02',
      competency: 'Practical Exam Preparation',
      rtiHours: 15,
      ojtHours: 0,
      assessmentType: 'Mock practical exam',
      evaluator: 'Licensed Cosmetology Instructor',
      passCriteria: [
        'Completes mock practical within state board time limits',
        'Demonstrates all required services to passing standard',
        'Completes all required OJT hours (1,500 minimum)',
      ],
    },
  ],
};

export const COSMETOLOGY_SECTIONS: RubricSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
  SECTION_5,
  SECTION_6,
  SECTION_7,
];
