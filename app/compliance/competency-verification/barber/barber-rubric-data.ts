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

/* ── Section 1: Sanitation, Safety & State Compliance ── */
const SECTION_1: RubricSection = {
  section: 1,
  title: 'Sanitation, Safety & State Compliance',
  description: 'Non-negotiable competencies required by Indiana PLA and state board standards. Failure in any sanitation competency triggers automatic remediation before advancement.',
  items: [
    {
      id: 'SAN-01',
      competency: 'Tool Disinfection Procedures',
      rtiHours: 4,
      ojtHours: 15,
      assessmentType: 'Practical observation + checklist',
      evaluator: 'Licensed Barber Instructor (RTI) + Shop Supervisor (OJT)',
      passCriteria: [
        'Disinfects all tools between each client using EPA-registered disinfectant',
        'Immersion time meets manufacturer and state board requirements',
        'Proper storage of disinfected tools in closed container',
        'Disposable items (razor blades, neck strips) discarded after single use',
      ],
      failurePolicy: 'Automatic remediation required. Cannot advance to client services until re-assessed.',
    },
    {
      id: 'SAN-02',
      competency: 'Station Sanitation Setup & Breakdown',
      rtiHours: 3,
      ojtHours: 10,
      assessmentType: 'Practical observation',
      evaluator: 'Licensed Barber Instructor + Shop Supervisor',
      passCriteria: [
        'Workstation cleaned and sanitized before and after each client',
        'Chair, headrest, and armrests wiped with approved disinfectant',
        'Floor swept of hair clippings between services',
        'Cape laundered or disposable cape replaced per client',
      ],
    },
    {
      id: 'SAN-03',
      competency: 'PPE & Personal Hygiene Standards',
      rtiHours: 2,
      ojtHours: 5,
      assessmentType: 'Observation + written quiz',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Gloves worn during chemical services and shaving',
        'Hands washed between clients',
        'Clean professional attire maintained',
        'No open wounds on hands without proper covering',
      ],
    },
    {
      id: 'SAN-04',
      competency: 'Blood Spill & Exposure Protocol',
      rtiHours: 3,
      ojtHours: 5,
      assessmentType: 'Scenario-based practical + written exam',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Immediate service stop upon blood exposure',
        'Correct application of styptic powder or liquid',
        'Proper disposal of contaminated materials in biohazard container',
        'Incident documentation completed',
        'Knowledge of bloodborne pathogen transmission prevention',
      ],
      failurePolicy: 'Automatic remediation required. Must demonstrate correct protocol before resuming razor services.',
    },
    {
      id: 'SAN-05',
      competency: 'Chemical Safety & Storage',
      rtiHours: 3,
      ojtHours: 5,
      assessmentType: 'Written exam + practical inspection',
      evaluator: 'Licensed Barber Instructor + Shop Supervisor',
      passCriteria: [
        'SDS (Safety Data Sheets) location knowledge',
        'Proper chemical storage (ventilated, labeled, separated)',
        'Correct mixing ratios for chemical services',
        'Emergency response for chemical contact (eye wash, skin flush)',
      ],
    },
  ],
};

/* ── Section 2: Clipper & Cutting Technique ── */
const SECTION_2: RubricSection = {
  section: 2,
  title: 'Clipper & Cutting Technique',
  description: 'Primary trade skills assessed through live haircut demonstrations on models/clients. Evaluated by credential partner instructor and employer barber.',
  items: [
    {
      id: 'CUT-01',
      competency: 'Clipper Handling & Control',
      rtiHours: 8,
      ojtHours: 40,
      assessmentType: 'Live haircut demonstration',
      evaluator: 'Licensed Barber Instructor + Employer Barber',
      passCriteria: [
        'Proper grip and wrist positioning',
        'Consistent pressure application',
        'Smooth clipper movement without snagging',
        'Correct clipper-over-comb technique execution',
      ],
    },
    {
      id: 'CUT-02',
      competency: 'Guard Usage & Accuracy',
      rtiHours: 4,
      ojtHours: 30,
      assessmentType: 'Live haircut demonstration',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Correct guard selection for desired length',
        'Even guard progression (0–3+ guard transitions)',
        'No visible guard lines or uneven patches',
        'Guard attachment verified before each use',
      ],
    },
    {
      id: 'CUT-03',
      competency: 'Fading Techniques (Low, Mid, High)',
      rtiHours: 10,
      ojtHours: 60,
      assessmentType: 'Live haircut demonstration (3 fade types)',
      evaluator: 'Licensed Barber Instructor + Employer Barber',
      passCriteria: [
        'Smooth transition between guard lengths',
        'Consistent blend line placement for each fade type',
        'Symmetrical fade on both sides',
        'Blending accuracy on multiple hair textures',
        'Client-ready finish quality',
      ],
    },
    {
      id: 'CUT-04',
      competency: 'Tapering & Blending',
      rtiHours: 6,
      ojtHours: 40,
      assessmentType: 'Live haircut demonstration',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Natural taper at neckline and sideburns',
        'Seamless blend between clipper and shear work',
        'Appropriate technique for hair density and texture',
        'Clean outline without harsh lines',
      ],
    },
    {
      id: 'CUT-05',
      competency: 'Shear Cutting Fundamentals',
      rtiHours: 8,
      ojtHours: 50,
      assessmentType: 'Live haircut demonstration',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Point cutting accuracy and consistency',
        'Layering technique with proper elevation',
        'Texturizing shear usage for weight removal',
        'Symmetry verification (cross-check technique)',
        'Sectioning precision throughout service',
      ],
    },
  ],
};

/* ── Section 3: Shaving & Razor Techniques ── */
const SECTION_3: RubricSection = {
  section: 3,
  title: 'Shaving & Razor Techniques',
  description: 'High-liability skill area. Assessed through hands-on practical exam with strict safety requirements. Especially important for Indiana state board alignment.',
  items: [
    {
      id: 'RAZ-01',
      competency: 'Straight Razor Handling & Safety',
      rtiHours: 6,
      ojtHours: 30,
      assessmentType: 'Hands-on practical exam + safety checklist',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Proper blade sanitation before and after use',
        'Correct razor angle (15–30 degrees to skin)',
        'Safe skin stretching technique demonstrated',
        'No unsafe cuts or improper handling during assessment',
        'Blade disposal in sharps container when applicable',
      ],
      failurePolicy: 'Any unsafe handling results in immediate assessment stop. Must complete remediation before re-assessment.',
    },
    {
      id: 'RAZ-02',
      competency: 'Hot Towel Shaving Procedure',
      rtiHours: 4,
      ojtHours: 20,
      assessmentType: 'Hands-on practical demonstration',
      evaluator: 'Licensed Barber Instructor + Shop Supervisor',
      passCriteria: [
        'Towel temperature tested before application',
        'Proper pre-shave preparation (hot towel, lather application)',
        'Correct shaving direction (with grain, across grain, against grain sequence)',
        'Post-shave care (cold towel, aftershave, moisturizer)',
        'Client comfort maintained throughout service',
      ],
    },
    {
      id: 'RAZ-03',
      competency: 'Beard Shaping & Line-Up',
      rtiHours: 6,
      ojtHours: 40,
      assessmentType: 'Hands-on practical demonstration',
      evaluator: 'Licensed Barber Instructor + Employer Barber',
      passCriteria: [
        'Symmetrical beard shaping on both sides',
        'Line-up precision at cheek line, jawline, and neckline',
        'Trimmer technique accuracy for detail work',
        'Client preference incorporated into design',
        'Clean, defined edges without skin irritation',
      ],
    },
    {
      id: 'RAZ-04',
      competency: 'Skin Safety & Irritation Prevention',
      rtiHours: 3,
      ojtHours: 10,
      assessmentType: 'Written exam + practical observation',
      evaluator: 'Licensed Barber Instructor',
      passCriteria: [
        'Identification of skin conditions contraindicating shaving',
        'Proper pre-shave skin assessment',
        'Ingrown hair prevention technique knowledge',
        'Appropriate product selection for sensitive skin',
        'Client allergy inquiry before product application',
      ],
    },
  ],
};

/* ── Section 4: Client Services & Professionalism ── */
const SECTION_4: RubricSection = {
  section: 4,
  title: 'Client Services & Professionalism',
  description: 'Workforce-aligned competencies for job placement, employer satisfaction, and apprenticeship completion validation. Assessed through employer OJT evaluation and instructor review.',
  items: [
    {
      id: 'CLI-01',
      competency: 'Client Consultation Process',
      rtiHours: 4,
      ojtHours: 30,
      assessmentType: 'Observation + role-play',
      evaluator: 'Licensed Barber Instructor + Shop Supervisor',
      passCriteria: [
        'Professional greeting and introduction',
        'Style recommendation based on face shape and hair type',
        'Clear communication of service timeline and pricing',
        'Use of visual references when appropriate',
        'Confirmation of client expectations before starting',
      ],
    },
    {
      id: 'CLI-02',
      competency: 'Communication & Interpersonal Skills',
      rtiHours: 3,
      ojtHours: 20,
      assessmentType: 'Employer OJT evaluation + instructor observation',
      evaluator: 'Shop Supervisor + Program Holder',
      passCriteria: [
        'Appropriate conversation during service',
        'Active listening demonstrated',
        'Professional handling of client complaints or concerns',
        'Respectful interaction with all clients regardless of background',
      ],
    },
    {
      id: 'CLI-03',
      competency: 'Appointment & Time Management',
      rtiHours: 2,
      ojtHours: 20,
      assessmentType: 'Employer OJT evaluation',
      evaluator: 'Shop Supervisor',
      passCriteria: [
        'Punctual arrival for scheduled appointments',
        'Service completed within expected timeframe',
        'Efficient transition between clients',
        'Scheduling system proficiency (if applicable)',
      ],
    },
    {
      id: 'CLI-04',
      competency: 'Professional Conduct & Workplace Etiquette',
      rtiHours: 2,
      ojtHours: 15,
      assessmentType: 'Employer OJT evaluation',
      evaluator: 'Shop Supervisor + Program Holder',
      passCriteria: [
        'Professional appearance and dress code compliance',
        'Respectful interaction with coworkers',
        'Appropriate phone/device usage during work hours',
        'Positive attitude and willingness to learn',
        'Adherence to shop policies and procedures',
      ],
    },
  ],
};

/* ── Section 5: Shop Operations & Business Readiness ── */
const SECTION_5: RubricSection = {
  section: 5,
  title: 'Shop Operations & Business Readiness',
  description: 'Competencies for shop management, business operations, and entrepreneurship readiness. Evaluated primarily by employer supervisor and program holder.',
  items: [
    {
      id: 'BIZ-01',
      competency: 'Shop Sanitation Maintenance',
      rtiHours: 2,
      ojtHours: 20,
      assessmentType: 'Practical inspection',
      evaluator: 'Shop Supervisor',
      passCriteria: [
        'Daily opening and closing sanitation procedures followed',
        'Restroom cleanliness maintained',
        'Common area tidiness (waiting area, product displays)',
        'Waste disposal completed per schedule',
      ],
    },
    {
      id: 'BIZ-02',
      competency: 'Equipment Setup, Maintenance & Breakdown',
      rtiHours: 3,
      ojtHours: 15,
      assessmentType: 'Practical demonstration',
      evaluator: 'Shop Supervisor + Licensed Barber Instructor',
      passCriteria: [
        'Clipper blade oiling and maintenance',
        'Shear sharpness assessment and care',
        'Equipment troubleshooting (clipper, trimmer)',
        'Proper end-of-day equipment storage',
      ],
    },
    {
      id: 'BIZ-03',
      competency: 'Retail Product Knowledge',
      rtiHours: 3,
      ojtHours: 15,
      assessmentType: 'Written quiz + role-play',
      evaluator: 'Licensed Barber Instructor + Shop Supervisor',
      passCriteria: [
        'Product type identification (pomade, wax, gel, oil)',
        'Appropriate product recommendation per hair type',
        'Basic ingredient awareness (hold level, shine, texture)',
        'Professional product presentation to clients',
      ],
    },
    {
      id: 'BIZ-04',
      competency: 'Time Management Per Service',
      rtiHours: 2,
      ojtHours: 20,
      assessmentType: 'Timed service observation',
      evaluator: 'Shop Supervisor',
      passCriteria: [
        'Standard haircut completed within 30–45 minutes',
        'Fade/detail cut completed within 45–60 minutes',
        'Shave service completed within 20–30 minutes',
        'Quality maintained at efficient pace',
      ],
    },
    {
      id: 'BIZ-05',
      competency: 'Basic Business & Bookkeeping',
      rtiHours: 6,
      ojtHours: 10,
      assessmentType: 'Written assessment + business plan outline',
      evaluator: 'Program Holder',
      passCriteria: [
        'Basic income and expense tracking understanding',
        'Booth rental vs. commission model knowledge',
        'Client retention strategy articulation',
        'Indiana business license requirements awareness',
        'Tax obligation basics for self-employed barbers',
      ],
    },
    {
      id: 'BIZ-06',
      competency: 'Shop Safety & OSHA Compliance',
      rtiHours: 3,
      ojtHours: 10,
      assessmentType: 'Written exam + workplace observation',
      evaluator: 'Shop Supervisor + Licensed Barber Instructor',
      passCriteria: [
        'Fire exit and extinguisher location knowledge',
        'Electrical safety awareness (cord management, outlet usage)',
        'Slip/trip/fall prevention in wet areas',
        'First aid kit location and basic contents knowledge',
      ],
    },
  ],
};

/* ── Section 6: OJT Performance Rubric ── */
const SECTION_6: RubricSection = {
  section: 6,
  title: 'OJT Performance Evaluation',
  description: 'Separate checklist used by barbershop employer partners for structured OJT evaluation. Assessed at 30-day, midpoint, and final review checkpoints.',
  items: [
    {
      id: 'OJT-01',
      competency: 'Service Quality & Consistency',
      rtiHours: 0,
      ojtHours: 100,
      assessmentType: 'Client service observation (minimum 10 services)',
      evaluator: 'Employer Barbershop Supervisor',
      passCriteria: [
        'Consistent quality across different haircut styles',
        'Appropriate technique selection for client hair type',
        'Clean, professional finish on every service',
        'Client satisfaction (no rework required)',
      ],
    },
    {
      id: 'OJT-02',
      competency: 'Speed & Efficiency',
      rtiHours: 0,
      ojtHours: 50,
      assessmentType: 'Timed service tracking over 30-day period',
      evaluator: 'Employer Barbershop Supervisor',
      passCriteria: [
        'Progressive improvement in service time',
        'Quality maintained as speed increases',
        'Efficient tool transitions during service',
        'Minimal downtime between clients',
      ],
    },
    {
      id: 'OJT-03',
      competency: 'Customer Satisfaction & Retention',
      rtiHours: 0,
      ojtHours: 50,
      assessmentType: 'Client feedback tracking + supervisor observation',
      evaluator: 'Employer Barbershop Supervisor',
      passCriteria: [
        'Positive client feedback on services',
        'Repeat client bookings observed',
        'Professional handling of dissatisfied clients',
        'Tip consistency as indicator of service quality',
      ],
    },
    {
      id: 'OJT-04',
      competency: 'Attendance & Reliability',
      rtiHours: 0,
      ojtHours: 0,
      assessmentType: 'Attendance record review',
      evaluator: 'Employer Barbershop Supervisor + Program Holder',
      passCriteria: [
        'On-time arrival for all scheduled shifts',
        'Advance notice for any absences',
        'Consistent weekly hour commitment met',
        'No unexcused absences during evaluation period',
      ],
    },
    {
      id: 'OJT-05',
      competency: 'Professional Growth & Initiative',
      rtiHours: 0,
      ojtHours: 30,
      assessmentType: 'Supervisor narrative evaluation',
      evaluator: 'Employer Barbershop Supervisor',
      passCriteria: [
        'Seeks feedback and applies corrections',
        'Practices techniques during downtime',
        'Shows interest in learning new styles and methods',
        'Takes initiative in shop maintenance tasks',
        'Demonstrates progression from previous evaluation',
      ],
    },
  ],
};

export const BARBER_SECTIONS: RubricSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
  SECTION_5,
  SECTION_6,
];

// Summary stats
export const BARBER_STATS = {
  totalCompetencies: BARBER_SECTIONS.reduce((sum, s) => sum + s.items.length, 0),
  totalRTIHours: BARBER_SECTIONS.reduce((sum, s) => sum + s.items.reduce((h, i) => h + i.rtiHours, 0), 0),
  totalOJTHours: BARBER_SECTIONS.reduce((sum, s) => sum + s.items.reduce((h, i) => h + i.ojtHours, 0), 0),
  sections: BARBER_SECTIONS.length,
  scoringScale: '1 = Not Competent | 2 = Developing | 3 = Competent (Industry Ready) | 4 = Advanced | 5 = Mastery',
  passingStandard: 'Minimum score of 3 (Competent) in all core competencies',
};
