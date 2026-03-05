// lib/courses/definitions.ts

export type CredentialingPartner =
  | "Choice Medical Institute"
  | "Milady"
  | "Certiport / IT"
  | "CDL Partner"
  | "HVAC / Trades Partner"
  | "Elevate For Humanity (Workforce)";

export interface CourseLesson {
  id: string;
  title: string;
  type: "video" | "reading" | "quiz" | "assignment" | "lab";
  durationMinutes?: number;
  description?: string;
  /** Which objective IDs this lesson assesses (for quiz/lab/assignment types) */
  assessesObjectives?: string[];
  /** Minimum passing score for quiz/assignment types (0-100) */
  passThreshold?: number;
  contentUrl?: string;
}

export interface CompetencyObjective {
  id: string;
  /** Measurable statement using action verbs (Calculate, Perform, Demonstrate, Diagnose) */
  statement: string;
  /** Tolerance or standard where applicable (e.g., "±2°F", "500 microns", "85%") */
  standard?: string;
  /** Which credential this maps to */
  credentialAlignment?: "EPA 608 Core" | "EPA 608 Type I" | "EPA 608 Type II" | "EPA 608 Type III" | "OSHA 10" | "CPR/AED" | "Residential HVAC";
}

export interface WeekAssignment {
  week: number;
  /** What the student can do by end of this week */
  weeklyCompetencyStatement: string;
}

export interface CredentialPathway {
  level: string;
  title: string;
  requirements: string[];
  typicalTimeline: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  /** Legacy string objectives (kept for backward compatibility) */
  objectives?: string[];
  /** Structured competency objectives with standards and credential alignment */
  competencyObjectives?: CompetencyObjective[];
  milestone?: string;
  /** Which week(s) this module falls in */
  weekAssignment?: WeekAssignment;
}

export interface CourseDefinition {
  slug: string;
  title: string;
  subtitle: string;
  category:
    | "Healthcare"
    | "Skilled Trades"
    | "Transportation"
    | "Facilities"
    | "Workforce Readiness"
    | "Technology"
    | "Business";
  partner: CredentialingPartner;
  estimatedDurationWeeks: number;
  modality: "In-Person" | "Hybrid" | "Online";
  workforceTags: string[];
  secondChanceFriendly: boolean;
  outcomes: string[];
  /** Program-level outcomes — non-negotiable graduate competencies */
  programOutcomes?: string[];
  /** Credential pathway from entry to mastery */
  credentialPathway?: CredentialPathway[];
  modules: CourseModule[];
}

// ✅ MASTER LIST OF COURSES
export const COURSE_DEFINITIONS: CourseDefinition[] = [
  {
    slug: "medical-assistant",
    title: "Medical Assistant",
    subtitle:
      "Hands-on clinical training that prepares you for entry-level MA roles in clinics, hospitals, and specialty practices.",
    category: "Healthcare",
    partner: "Choice Medical Institute",
    estimatedDurationWeeks: 24,
    modality: "In-Person",
    workforceTags: ["WIOA", "Workforce Ready Grant", "OJT Eligible"],
    secondChanceFriendly: true,
    outcomes: [
      "Prepare for entry-level Medical Assistant roles",
      "Demonstrate vital signs, injections, and basic clinical procedures",
      "Understand front office, scheduling, and patient communication",
    ],
    modules: [
      {
        id: "ma-01",
        title: "Program Orientation & Workforce Readiness",
        description:
          "Welcome to the MA program, expectations, professionalism, and workforce funding orientation.",
        lessons: [
          {
            id: "ma-01-01",
            title: "Welcome & What to Expect",
            type: "video",
            durationMinutes: 15,
            description: "Introduction to the Medical Assistant program, schedule, and expectations",
          },
          {
            id: "ma-01-02",
            title: "Attendance, Funding, and Case Management",
            type: "reading",
            description: "Understanding WIOA funding, attendance requirements, and support services",
          },
          {
            id: "ma-01-03",
            title: "Professionalism & Soft Skills in Healthcare",
            type: "quiz",
            durationMinutes: 10,
            description: "Assessment of workplace professionalism and communication skills",
          },
        ],
      },
      {
        id: "ma-02",
        title: "Medical Terminology & Anatomy Basics",
        description: "Core terminology, body systems, and common conditions.",
        lessons: [
          {
            id: "ma-02-01",
            title: "Intro to Medical Terminology",
            type: "video",
            durationMinutes: 30,
            description: "Common medical prefixes, suffixes, and root words",
          },
          {
            id: "ma-02-02",
            title: "Body Systems Overview",
            type: "reading",
            description: "Introduction to major body systems and their functions",
          },
          {
            id: "ma-02-03",
            title: "Terminology Practice Quiz",
            type: "quiz",
            durationMinutes: 15,
            description: "Test your knowledge of medical terminology",
          },
        ],
      },
      {
        id: "ma-03",
        title: "Clinical Skills I",
        description:
          "Vital signs, infection control, and working with patients in a clinical setting.",
        lessons: [
          {
            id: "ma-03-01",
            title: "Vital Signs: Theory",
            type: "video",
            durationMinutes: 45,
            description: "How to measure blood pressure, pulse, temperature, and respiration",
          },
          {
            id: "ma-03-02",
            title: "Vital Signs: Lab Practice",
            type: "lab",
            durationMinutes: 120,
            description: "Hands-on practice measuring vital signs on classmates",
          },
          {
            id: "ma-03-03",
            title: "Infection Control & PPE",
            type: "reading",
            description: "Proper use of personal protective equipment and infection control protocols",
          },
        ],
      },
      {
        id: "ma-04",
        title: "Front Office & Electronic Health Records",
        description:
          "Scheduling, patient intake, basic billing and working with EHR systems.",
        lessons: [
          {
            id: "ma-04-01",
            title: "Front Desk Workflow",
            type: "video",
            durationMinutes: 30,
            description: "Patient check-in, scheduling, and front office procedures",
          },
          {
            id: "ma-04-02",
            title: "Patient Intake Forms Practice",
            type: "assignment",
            description: "Complete sample patient intake forms and insurance verification",
          },
          {
            id: "ma-04-03",
            title: "EHR Basics Quiz",
            type: "quiz",
            durationMinutes: 15,
            description: "Test your knowledge of electronic health record systems",
          },
        ],
      },
    ],
  },
  {
    slug: "barber-apprenticeship",
    title: "Barber Apprenticeship",
    subtitle:
      "State-approved apprenticeship where you train in a real barbershop while earning hours toward licensure.",
    category: "Skilled Trades",
    partner: "Milady",
    estimatedDurationWeeks: 52,
    modality: "In-Person",
    workforceTags: ["Apprenticeship", "WIOA", "Re-Entry Friendly"],
    secondChanceFriendly: true,
    outcomes: [
      "Complete required apprenticeship hours toward barber license",
      "Perform core barber services safely and professionally",
      "Understand shop etiquette, sanitation, and client care",
    ],
    modules: [
      {
        id: "ba-01",
        title: "Orientation & Apprenticeship Basics",
        description:
          "Program overview, state requirements, and what to expect day to day in the shop.",
        lessons: [
          {
            id: "ba-01-01",
            title: "Welcome to Your Apprenticeship",
            type: "video",
            durationMinutes: 20,
            description: "Introduction to the barber apprenticeship program and state requirements",
          },
          {
            id: "ba-01-02",
            title: "Apprenticeship Agreement & Hours Tracking",
            type: "reading",
            description: "Understanding your apprenticeship agreement and how to log hours",
          },
          {
            id: "ba-01-03",
            title: "Professional Expectations Quiz",
            type: "quiz",
            durationMinutes: 10,
            description: "Assessment of professional standards and shop etiquette",
          },
        ],
      },
      {
        id: "ba-02",
        title: "Sanitation & Safety",
        description:
          "Sanitation, disinfection, and safety requirements per state and Milady standards.",
        lessons: [
          {
            id: "ba-02-01",
            title: "Sanitation Standards",
            type: "video",
            durationMinutes: 30,
            description: "State board sanitation requirements and best practices",
          },
          {
            id: "ba-02-02",
            title: "Disinfection Procedures",
            type: "lab",
            durationMinutes: 60,
            description: "Hands-on practice with proper tool disinfection and sterilization",
          },
          {
            id: "ba-02-03",
            title: "Sanitation Quiz",
            type: "quiz",
            durationMinutes: 15,
            description: "Test your knowledge of sanitation and safety protocols",
          },
        ],
      },
      {
        id: "ba-03",
        title: "Cutting & Fades I",
        description: "Foundations of cutting, blending, and clipper control.",
        lessons: [
          {
            id: "ba-03-01",
            title: "Tools & Sectioning",
            type: "video",
            durationMinutes: 25,
            description: "Introduction to clippers, shears, and proper sectioning techniques",
          },
          {
            id: "ba-03-02",
            title: "Basic Cut Demo",
            type: "video",
            durationMinutes: 40,
            description: "Step-by-step demonstration of a basic men's haircut",
          },
          {
            id: "ba-03-03",
            title: "Practice Log Assignment",
            type: "assignment",
            description: "Document your practice cuts with photos and mentor feedback",
          },
        ],
      },
    ],
  },
  {
    slug: "hvac-technician",
    title: "HVAC Technician",
    subtitle:
      "12-week workforce pathway: EPA 608 Universal, OSHA 10, residential HVAC certification, and employer placement.",
    category: "Skilled Trades",
    partner: "HVAC / Trades Partner",
    estimatedDurationWeeks: 12,
    modality: "Hybrid",
    workforceTags: ["WIOA", "Workforce Ready Grant", "Next Level Jobs", "OJT Eligible", "ETPL Listed"],
    secondChanceFriendly: true,
    programOutcomes: [
      "Safely service and recover refrigerants in compliance with U.S. EPA Section 608 regulations",
      "Diagnose and repair residential HVAC systems using electrical schematics and manufacturer documentation",
      "Measure and calculate superheat, subcooling, static pressure, and airflow to manufacturer specifications",
      "Install and commission entry-level residential split systems under supervision",
      "Demonstrate OSHA-compliant jobsite conduct and safety practices",
    ],
    credentialPathway: [
      { level: "1", title: "HVAC Apprentice", requirements: ["EPA 608 Universal", "OSHA 10", "CPR/AED", "480+ training hours"], typicalTimeline: "12 weeks (this program)" },
      { level: "2", title: "HVAC Journeyman", requirements: ["2,000+ OJT hours", "State journeyman exam", "Employer sponsorship"], typicalTimeline: "1–2 years post-program" },
      { level: "3", title: "HVAC Master Technician", requirements: ["4,000+ OJT hours", "NATE certification", "Advanced diagnostics"], typicalTimeline: "3–5 years" },
      { level: "4", title: "HVAC Contractor", requirements: ["Master license", "Business license", "Insurance/bonding"], typicalTimeline: "5+ years" },
    ],
    outcomes: [
      "Pass EPA Section 608 Universal Certification exam",
      "Earn Residential HVAC Certification 1",
      "Earn Residential HVAC Certification 2 — Refrigeration Diagnostics",
      "Complete OSHA 10-Hour Construction Safety through CareerSafe",
      "Earn CPR/AED certification through CareerSafe",
      "Qualify for entry-level HVAC technician positions with employer partners",
    ],
    modules: [
      {
        id: "hvac-01",
        title: "Program Orientation & Workforce Readiness",
        description: "Program overview, expectations, funding orientation, and career pathways in HVAC.",
        weekAssignment: { week: 1, weeklyCompetencyStatement: "Identify program credentials, explain the refrigeration cycle at a conceptual level, and demonstrate basic tool identification" },
        objectives: [
          "Identify the three credentials earned in this program (EPA 608, OSHA 10, CPR)",
          "Describe WIOA funding requirements including attendance and documentation",
          "Outline career progression from apprentice to journeyman to master HVAC technician",
          "Demonstrate understanding of program expectations and support services",
        ],
        competencyObjectives: [
          { id: "hvac-01-co1", statement: "Identify the three credentials earned in this program and their industry value", credentialAlignment: "Residential HVAC" },
          { id: "hvac-01-co2", statement: "Explain WIOA funding requirements including attendance minimums and documentation deadlines" },
          { id: "hvac-01-co3", statement: "Map the four-level career pathway: apprentice → journeyman → master → contractor" },
          { id: "hvac-01-co4", statement: "Identify 10 common HVAC hand tools and their purpose by name", standard: "10/10 correct on tool identification practical" },
        ],
        lessons: [
          { id: "hvac-01-01", title: "Welcome to HVAC Technician Training", type: "video", durationMinutes: 20, description: "Program structure, schedule, credentials earned, and career outlook" },
          { id: "hvac-01-02", title: "WIOA Funding, Attendance & Support Services", type: "reading", description: "Understanding workforce funding, attendance requirements, and available support" },
          { id: "hvac-01-03", title: "HVAC Career Pathways", type: "video", durationMinutes: 15, description: "Residential, commercial, industrial HVAC — career progression from apprentice to master" },
          { id: "hvac-01-04", title: "Orientation Quiz", type: "quiz", durationMinutes: 10, description: "Confirm understanding of program requirements and expectations", passThreshold: 80, assessesObjectives: ["hvac-01-co1", "hvac-01-co2", "hvac-01-co3"] },
        ],
      },
      {
        id: "hvac-02",
        title: "HVAC Fundamentals & Safety",
        description: "Core principles of heating, ventilation, and air conditioning. Tool identification and safety protocols.",
        weekAssignment: { week: 2, weeklyCompetencyStatement: "Apply lockout/tagout procedure, identify electrical hazard classes, demonstrate PPE selection, and identify all five major system components on a live unit" },
        objectives: [
          "Explain the heating cycle, cooling cycle, and ventilation principles",
          "Identify and demonstrate proper use of HVAC tools: gauges, manifolds, vacuum pumps, and meters",
          "Apply PPE requirements and lockout/tagout procedures for HVAC work",
          "Identify the five major system components on a live unit",
        ],
        competencyObjectives: [
          { id: "hvac-02-co1", statement: "Diagram the heating cycle and cooling cycle showing direction of heat transfer" },
          { id: "hvac-02-co2", statement: "Demonstrate proper connection of gauge manifold to a system with correct hose routing", standard: "Zero cross-contamination, correct high/low side identification" },
          { id: "hvac-02-co3", statement: "Execute lockout/tagout procedure on a live disconnect per OSHA 1910.147", credentialAlignment: "OSHA 10" },
          { id: "hvac-02-co4", statement: "Identify compressor, condenser, evaporator, metering device, and air handler on a live split system", standard: "5/5 correct within 2 minutes" },
        ],
        lessons: [
          { id: "hvac-02-01", title: "How HVAC Systems Work", type: "video", durationMinutes: 40, description: "Heating cycle, cooling cycle, ventilation, and air distribution basics" },
          { id: "hvac-02-02", title: "HVAC Tools & Equipment", type: "video", durationMinutes: 30, description: "Gauges, manifolds, vacuum pumps, recovery machines, hand tools, and meters" },
          { id: "hvac-02-03", title: "PPE & Shop Safety", type: "reading", description: "Personal protective equipment, electrical safety, refrigerant safety, and lockout/tagout" },
          { id: "hvac-02-04", title: "System Components Identification", type: "lab", durationMinutes: 60, description: "Identify compressor, condenser, evaporator, metering device, and airflow components", assessesObjectives: ["hvac-02-co4"] },
          { id: "hvac-02-05", title: "HVAC Fundamentals Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of HVAC principles, components, and safety", passThreshold: 80, assessesObjectives: ["hvac-02-co1", "hvac-02-co2", "hvac-02-co3"] },
        ],
      },
      {
        id: "hvac-03",
        title: "Electrical Basics for HVAC",
        description: "Electrical theory, wiring, schematics, and meter usage for HVAC systems.",
        weekAssignment: { week: 3, weeklyCompetencyStatement: "Apply Ohm's Law to solve circuit problems, read ladder diagrams, and measure voltage/amperage/resistance within ±5% accuracy using a multimeter" },
        objectives: [
          "Apply Ohm's Law to calculate voltage, current, and resistance in HVAC circuits",
          "Read and interpret ladder diagrams and wiring schematics",
          "Measure voltage, amperage, resistance, and capacitance using a multimeter",
          "Explain the function of capacitors, contactors, and relays in HVAC systems",
        ],
        competencyObjectives: [
          { id: "hvac-03-co1", statement: "Calculate voltage, current, and resistance using Ohm's Law for series and parallel circuits", standard: "4/5 correct on calculation worksheet" },
          { id: "hvac-03-co2", statement: "Trace current flow through a ladder diagram and identify the energized component for a given switch state" },
          { id: "hvac-03-co3", statement: "Measure AC voltage, DC voltage, amperage, resistance, and capacitance on a live HVAC system", standard: "Readings within ±5% of instructor reference values" },
          { id: "hvac-03-co4", statement: "Test a run capacitor and start capacitor using a multimeter and determine pass/fail", standard: "Correct diagnosis on 3/3 test capacitors" },
        ],
        milestone: "Electrical Foundations Complete",
        lessons: [
          { id: "hvac-03-01", title: "Voltage, Current, Resistance & Ohm's Law", type: "video", durationMinutes: 45, description: "Fundamental electrical concepts every HVAC tech must know" },
          { id: "hvac-03-02", title: "Reading Wiring Diagrams & Schematics", type: "video", durationMinutes: 35, description: "Ladder diagrams, pictorial diagrams, and schematic symbols" },
          { id: "hvac-03-03", title: "Multimeter & Amp Clamp Lab", type: "lab", durationMinutes: 90, description: "Hands-on practice measuring voltage, amperage, resistance, and capacitance", assessesObjectives: ["hvac-03-co3", "hvac-03-co4"] },
          { id: "hvac-03-04", title: "Capacitors, Contactors & Relays", type: "video", durationMinutes: 30, description: "How electrical components control HVAC system operation" },
          { id: "hvac-03-05", title: "Electrical Basics Quiz", type: "quiz", durationMinutes: 15, description: "Assessment of electrical fundamentals for HVAC", passThreshold: 80, assessesObjectives: ["hvac-03-co1", "hvac-03-co2"] },
        ],
      },
      {
        id: "hvac-04",
        title: "Heating Systems",
        description: "Gas furnaces, electric heat, heat pumps, and combustion analysis.",
        weekAssignment: { week: 4, weeklyCompetencyStatement: "Perform combustion analysis with CO readings below 100 ppm, verify temperature rise within manufacturer range, and complete a full furnace safety inspection" },
        objectives: [
          "Describe gas furnace operation including ignition systems and safety controls",
          "Compare electric heat, heat strips, and heat pump heating modes",
          "Perform combustion analysis: CO testing, draft measurement, and gas pressure checks",
          "Complete a full furnace inspection, tune-up, and safety check",
        ],
        competencyObjectives: [
          { id: "hvac-04-co1", statement: "Identify ignition type (standing pilot, HSI, DSI) and verify proper flame characteristics on a live furnace" },
          { id: "hvac-04-co2", statement: "Measure and verify temperature rise falls within manufacturer-specified range", standard: "Within ±5°F of nameplate range" },
          { id: "hvac-04-co3", statement: "Perform combustion analysis: measure CO in flue gas and verify below safe threshold", standard: "CO reading below 100 ppm in undiluted flue gas" },
          { id: "hvac-04-co4", statement: "Complete a 15-point furnace safety inspection checklist with zero missed items", standard: "15/15 checklist items documented" },
        ],
        lessons: [
          { id: "hvac-04-01", title: "Gas Furnace Operation", type: "video", durationMinutes: 45, description: "Gas valve, ignition systems, heat exchangers, blower operation, and safety controls" },
          { id: "hvac-04-02", title: "Electric Heat & Heat Strips", type: "video", durationMinutes: 25, description: "Sequencers, heating elements, and electric furnace operation" },
          { id: "hvac-04-03", title: "Heat Pump Heating Mode", type: "video", durationMinutes: 35, description: "Reversing valve, defrost cycle, auxiliary heat, and balance point" },
          { id: "hvac-04-04", title: "Combustion Analysis", type: "lab", durationMinutes: 60, description: "CO testing, draft measurement, gas pressure checks, and temperature rise", assessesObjectives: ["hvac-04-co2", "hvac-04-co3"] },
          { id: "hvac-04-05", title: "Furnace Inspection Lab", type: "lab", durationMinutes: 90, description: "Complete furnace inspection, tune-up, and safety check procedure", assessesObjectives: ["hvac-04-co1", "hvac-04-co4"] },
          { id: "hvac-04-06", title: "Heating Systems Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of heating system operation and maintenance", passThreshold: 80, assessesObjectives: ["hvac-04-co1", "hvac-04-co2"] },
        ],
      },
      {
        id: "hvac-05",
        title: "Cooling Systems & Refrigeration Cycle",
        description: "Air conditioning fundamentals, the refrigeration cycle, and system components.",
        weekAssignment: { week: 5, weeklyCompetencyStatement: "Diagram a vapor-compression system, calculate superheat within ±2°F and subcooling within ±2°F from live gauge readings, and identify pressure/temperature relationships using a PT chart" },
        objectives: [
          "Diagram the four stages of the refrigeration cycle",
          "Calculate superheat and subcooling from pressure-temperature readings",
          "Identify compressor types and explain their operating principles",
          "Explain how TXV, fixed orifice, and capillary tube metering devices control refrigerant flow",
        ],
        competencyObjectives: [
          { id: "hvac-05-co1", statement: "Diagram a complete vapor-compression refrigeration cycle labeling all four stages, state changes, and pressure zones" },
          { id: "hvac-05-co2", statement: "Calculate superheat from suction pressure and suction line temperature on a live system", standard: "Within ±2°F of instructor reference value", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-05-co3", statement: "Calculate subcooling from liquid line pressure and liquid line temperature on a live system", standard: "Within ±2°F of instructor reference value", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-05-co4", statement: "Look up saturation temperature for R-410A and R-22 at given pressures using a PT chart", standard: "Correct value within 5 seconds, 5/5 lookups" },
        ],
        milestone: "Refrigeration Fundamentals Complete",
        lessons: [
          { id: "hvac-05-01", title: "The Refrigeration Cycle", type: "video", durationMinutes: 45, description: "Compression, condensation, expansion, evaporation — the four stages explained" },
          { id: "hvac-05-02", title: "Pressure-Temperature Relationship", type: "video", durationMinutes: 30, description: "PT charts, saturation, superheat, and subcooling — the foundation of HVAC diagnostics" },
          { id: "hvac-05-03", title: "Compressor Types & Operation", type: "video", durationMinutes: 25, description: "Reciprocating, scroll, and rotary compressors" },
          { id: "hvac-05-04", title: "Metering Devices", type: "video", durationMinutes: 25, description: "TXV, fixed orifice, capillary tube — how each controls refrigerant flow" },
          { id: "hvac-05-05", title: "Superheat & Subcooling Lab", type: "lab", durationMinutes: 90, description: "Measure and calculate superheat and subcooling on a live system using gauge manifold and thermometer", assessesObjectives: ["hvac-05-co2", "hvac-05-co3", "hvac-05-co4"] },
          { id: "hvac-05-06", title: "Cooling Systems Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of refrigeration cycle and AC system operation", passThreshold: 85, assessesObjectives: ["hvac-05-co1", "hvac-05-co4"] },
        ],
      },
      {
        id: "hvac-06",
        title: "EPA 608 — Core Section",
        description: "Ozone depletion, Clean Air Act, refrigerant safety, and recovery requirements. Required for all EPA 608 certification types.",
        weekAssignment: { week: 6, weeklyCompetencyStatement: "State recovery requirements, classify refrigerants by type, and score 85% or higher on EPA 608 Core practice exam" },
        objectives: [
          "Explain ozone depletion and the Montreal Protocol phase-out schedule",
          "Identify Clean Air Act Section 608 requirements and penalties for violations",
          "Classify refrigerants by type (CFC, HCFC, HFC, HFO) and their properties",
          "Describe recovery, recycling, and reclamation requirements under federal law",
        ],
        competencyObjectives: [
          { id: "hvac-06-co1", statement: "Classify 10 common refrigerants by type (CFC, HCFC, HFC, HFO) and state their ODP status", standard: "10/10 correct", credentialAlignment: "EPA 608 Core" },
          { id: "hvac-06-co2", statement: "State the maximum fine for knowingly venting refrigerant under the Clean Air Act", credentialAlignment: "EPA 608 Core" },
          { id: "hvac-06-co3", statement: "Distinguish between recovery, recycling, and reclamation and state when each is required", credentialAlignment: "EPA 608 Core" },
          { id: "hvac-06-co4", statement: "Score 85% or higher on a timed 25-question EPA 608 Core practice exam", standard: "85% minimum (21/25)", credentialAlignment: "EPA 608 Core" },
        ],
        lessons: [
          { id: "hvac-06-01", title: "Ozone Layer & Environmental Impact", type: "video", durationMinutes: 30, description: "How CFCs and HCFCs deplete the ozone layer, Montreal Protocol, and phase-out schedules" },
          { id: "hvac-06-02", title: "Clean Air Act — Section 608", type: "reading", description: "Federal regulations on refrigerant handling, venting prohibition, and penalties" },
          { id: "hvac-06-03", title: "Refrigerant Safety", type: "video", durationMinutes: 25, description: "Toxicity, flammability, oxygen displacement, frostbite, and cylinder safety" },
          { id: "hvac-06-04", title: "Refrigerant Types & Classifications", type: "reading", description: "CFC, HCFC, HFC, HFO refrigerants — R-22, R-410A, R-134a, R-404A, and their properties" },
          { id: "hvac-06-05", title: "Pressure-Temperature Fundamentals", type: "video", durationMinutes: 20, description: "Saturation temperature, gauge vs absolute pressure, and PT chart usage" },
          { id: "hvac-06-06", title: "Recovery, Recycling & Reclamation", type: "video", durationMinutes: 30, description: "Definitions, equipment requirements, and when each is required by law" },
          { id: "hvac-06-07", title: "Refrigerant Sales Restrictions", type: "reading", description: "Who can purchase refrigerant, record-keeping requirements, and certification verification" },
          { id: "hvac-06-08", title: "EPA 608 Core Practice Exam", type: "quiz", durationMinutes: 30, description: "25-question practice test matching EPA 608 Core exam format and difficulty", passThreshold: 85, assessesObjectives: ["hvac-06-co1", "hvac-06-co2", "hvac-06-co3", "hvac-06-co4"] },
        ],
      },
      {
        id: "hvac-07",
        title: "EPA 608 — Type I (Small Appliances)",
        description: "Recovery requirements for systems with less than 5 lbs of refrigerant. Window units, PTACs, refrigerators, freezers.",
        weekAssignment: { week: 7, weeklyCompetencyStatement: "Perform recovery simulation on a small appliance, state required recovery levels (90%/80%), and pass Type I mock exam at 85%" },
        objectives: [
          "Identify small appliance systems covered under Type I certification",
          "State required recovery levels: 90% operating, 80% non-operating",
          "Distinguish system-dependent vs self-contained recovery equipment",
          "Apply leak repair exemptions for small appliances",
        ],
        competencyObjectives: [
          { id: "hvac-07-co1", statement: "State required recovery levels for small appliances: 90% operating, 80% non-operating, and conditions for 0%", credentialAlignment: "EPA 608 Type I" },
          { id: "hvac-07-co2", statement: "Demonstrate proper recovery procedure on a small appliance trainer using self-contained equipment", credentialAlignment: "EPA 608 Type I" },
          { id: "hvac-07-co3", statement: "Score 85% or higher on Type I mock exam", standard: "85% minimum (21/25)", credentialAlignment: "EPA 608 Type I" },
        ],
        lessons: [
          { id: "hvac-07-01", title: "Small Appliance Systems", type: "video", durationMinutes: 25, description: "Window AC, PTAC, household refrigerators, vending machines, and water coolers" },
          { id: "hvac-07-02", title: "Type I Recovery Requirements", type: "video", durationMinutes: 20, description: "90% recovery for systems with operating charge, 80% for non-operating, and when 0% applies" },
          { id: "hvac-07-03", title: "Self-Contained Recovery Equipment", type: "reading", description: "System-dependent vs self-contained recovery, equipment certification, and procedures" },
          { id: "hvac-07-04", title: "Leak Repair Exemptions", type: "reading", description: "Small appliance leak repair requirements and disposal procedures" },
          { id: "hvac-07-05", title: "EPA 608 Type I Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type I exam format", passThreshold: 85, assessesObjectives: ["hvac-07-co1", "hvac-07-co3"] },
        ],
      },
      {
        id: "hvac-08",
        title: "EPA 608 — Type II (High-Pressure Systems)",
        description: "Recovery and service for high-pressure AC and refrigeration systems. R-22, R-410A, R-134a systems.",
        weekAssignment: { week: 7, weeklyCompetencyStatement: "Perform charging procedures, calculate superheat within ±2°F, calculate subcooling within ±2°F, and pass Type II mock exam at 85%" },
        objectives: [
          "State required recovery levels for high-pressure systems by charge size",
          "Perform leak detection using electronic, UV dye, and standing pressure methods",
          "Execute proper evacuation using vacuum pump and micron gauge",
          "Apply mandatory leak repair timelines for comfort cooling and commercial systems",
        ],
        competencyObjectives: [
          { id: "hvac-08-co1", statement: "State required recovery levels for high-pressure systems: 0 psig (<200 lbs) and 10 in. Hg vacuum (>200 lbs)", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-08-co2", statement: "Evacuate a system to 500 microns using a vacuum pump and verify hold with micron gauge", standard: "System holds below 500 microns for 10 minutes", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-08-co3", statement: "Perform electronic leak detection on a charged system and locate a planted leak", standard: "Leak found within 5 minutes", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-08-co4", statement: "Score 85% or higher on Type II mock exam", standard: "85% minimum (21/25)", credentialAlignment: "EPA 608 Type II" },
        ],
        milestone: "EPA 608 Type II Ready",
        lessons: [
          { id: "hvac-08-01", title: "High-Pressure System Overview", type: "video", durationMinutes: 30, description: "Residential AC, commercial refrigeration, heat pumps, and automotive AC systems" },
          { id: "hvac-08-02", title: "Type II Recovery Requirements", type: "video", durationMinutes: 25, description: "Required recovery levels: 0 psig for systems <200 lbs, 10 inches Hg vacuum for >200 lbs" },
          { id: "hvac-08-03", title: "Leak Detection Methods", type: "video", durationMinutes: 20, description: "Electronic leak detectors, UV dye, soap bubbles, standing pressure test, and nitrogen" },
          { id: "hvac-08-04", title: "Evacuation Procedures", type: "video", durationMinutes: 25, description: "Vacuum pump operation, micron gauge, triple evacuation, and dehydration" },
          { id: "hvac-08-05", title: "Leak Repair Requirements", type: "reading", description: "Comfort cooling 10% leak rate trigger, commercial 20%, mandatory repair timelines" },
          { id: "hvac-08-06", title: "Recovery Equipment Lab", type: "lab", durationMinutes: 90, description: "Hands-on refrigerant recovery from a high-pressure system using certified equipment", assessesObjectives: ["hvac-08-co2", "hvac-08-co3"] },
          { id: "hvac-08-07", title: "EPA 608 Type II Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type II exam format", passThreshold: 85, assessesObjectives: ["hvac-08-co1", "hvac-08-co4"] },
        ],
      },
      {
        id: "hvac-09",
        title: "EPA 608 — Type III (Low-Pressure Systems)",
        description: "Chillers and low-pressure refrigeration systems. R-11, R-123, and centrifugal systems.",
        weekAssignment: { week: 8, weeklyCompetencyStatement: "Describe low-pressure recovery safety, state leak detection requirements for chillers, and pass Type III mock exam at 85%" },
        objectives: [
          "Describe centrifugal chiller operation and low-pressure refrigerant properties",
          "State Type III recovery requirements for systems above and below 200 lbs",
          "Explain purge unit function and why low-pressure systems operate in vacuum",
          "Identify freeze-up risks and dehydration procedures for low-pressure systems",
        ],
        competencyObjectives: [
          { id: "hvac-09-co1", statement: "State Type III recovery requirements: 0 psig for <200 lbs, 25 mm Hg absolute for >=200 lbs", credentialAlignment: "EPA 608 Type III" },
          { id: "hvac-09-co2", statement: "Explain why low-pressure systems operate below atmospheric pressure and the role of the purge unit", credentialAlignment: "EPA 608 Type III" },
          { id: "hvac-09-co3", statement: "Score 85% or higher on Type III mock exam", standard: "85% minimum (21/25)", credentialAlignment: "EPA 608 Type III" },
        ],
        lessons: [
          { id: "hvac-09-01", title: "Low-Pressure System Overview", type: "video", durationMinutes: 25, description: "Centrifugal chillers, R-11, R-123 systems, and how they differ from high-pressure" },
          { id: "hvac-09-02", title: "Type III Recovery Requirements", type: "video", durationMinutes: 20, description: "Required recovery levels: 0 psig for systems <200 lbs, 25 mm Hg absolute for systems >=200 lbs" },
          { id: "hvac-09-03", title: "Purge Units & Air Removal", type: "video", durationMinutes: 20, description: "Why low-pressure systems operate in vacuum, purge unit function, and leak prevention" },
          { id: "hvac-09-04", title: "Water in Low-Pressure Systems", type: "reading", description: "Freeze-up risks, hydrolysis, acid formation, and dehydration procedures" },
          { id: "hvac-09-05", title: "Rupture Disc & Pressure Relief", type: "reading", description: "Safety devices on low-pressure systems and when they activate" },
          { id: "hvac-09-06", title: "EPA 608 Type III Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type III exam format", passThreshold: 85, assessesObjectives: ["hvac-09-co1", "hvac-09-co2", "hvac-09-co3"] },
        ],
      },
      {
        id: "hvac-10",
        title: "EPA 608 Universal — Final Exam Prep",
        description: "Comprehensive review and timed practice exams covering all four EPA 608 sections.",
        weekAssignment: { week: 8, weeklyCompetencyStatement: "Score 70% or higher on each of the four EPA 608 sections in a timed 100-question Universal practice exam" },
        objectives: [
          "Score 70% or higher on each of the four EPA 608 section practice exams",
          "Complete a full 100-question Universal practice exam under timed conditions",
          "Identify and correct weak areas using section comparison charts",
          "Demonstrate readiness for proctored EPA 608 Universal certification exam",
        ],
        competencyObjectives: [
          { id: "hvac-10-co1", statement: "Score 70% or higher on Core section under timed conditions", standard: "70% minimum (18/25)", credentialAlignment: "EPA 608 Core" },
          { id: "hvac-10-co2", statement: "Score 70% or higher on Type I section under timed conditions", standard: "70% minimum (18/25)", credentialAlignment: "EPA 608 Type I" },
          { id: "hvac-10-co3", statement: "Score 70% or higher on Type II section under timed conditions", standard: "70% minimum (18/25)", credentialAlignment: "EPA 608 Type II" },
          { id: "hvac-10-co4", statement: "Score 70% or higher on Type III section under timed conditions", standard: "70% minimum (18/25)", credentialAlignment: "EPA 608 Type III" },
        ],
        milestone: "EPA 608 Universal Certification Eligible",
        lessons: [
          { id: "hvac-10-01", title: "Core Section Review", type: "video", durationMinutes: 20, description: "Quick review of key Core concepts, common exam traps, and memory aids" },
          { id: "hvac-10-02", title: "Type I, II, III Comparison Chart", type: "reading", description: "Side-by-side comparison of recovery requirements, leak rates, and equipment rules" },
          { id: "hvac-10-03", title: "Full-Length Practice Exam — Core", type: "quiz", durationMinutes: 30, description: "Timed 25-question Core practice exam under test conditions", passThreshold: 70, assessesObjectives: ["hvac-10-co1"] },
          { id: "hvac-10-04", title: "Full-Length Practice Exam — Type I", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type I practice exam under test conditions", passThreshold: 70, assessesObjectives: ["hvac-10-co2"] },
          { id: "hvac-10-05", title: "Full-Length Practice Exam — Type II", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type II practice exam under test conditions", passThreshold: 70, assessesObjectives: ["hvac-10-co3"] },
          { id: "hvac-10-06", title: "Full-Length Practice Exam — Type III", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type III practice exam under test conditions", passThreshold: 70, assessesObjectives: ["hvac-10-co4"] },
          { id: "hvac-10-07", title: "EPA 608 Universal Full Practice Exam", type: "quiz", durationMinutes: 60, description: "Complete 100-question timed practice exam — all 4 sections combined. Pass = 70% per section.", passThreshold: 70, assessesObjectives: ["hvac-10-co1", "hvac-10-co2", "hvac-10-co3", "hvac-10-co4"] },
        ],
      },
      {
        id: "hvac-11",
        title: "Refrigerant Handling & Diagnostics",
        description: "Hands-on refrigerant recovery, charging, leak detection, and system diagnostics.",
        weekAssignment: { week: 9, weeklyCompetencyStatement: "Charge a system to manufacturer spec using subcooling method within ±2°F, diagnose overcharge/undercharge from gauge readings, and evacuate to 500 microns" },
        objectives: [
          "Charge a system using subcooling, superheat, and weigh-in methods",
          "Diagnose overcharge, undercharge, restrictions, and non-condensables from gauge readings",
          "Perform electronic leak detection and nitrogen pressure testing",
          "Execute full recovery, evacuation to 500 microns, and system recharge",
        ],
        competencyObjectives: [
          { id: "hvac-11-co1", statement: "Charge a residential split system to manufacturer specification using the subcooling method", standard: "Subcooling within ±2°F of target", credentialAlignment: "Residential HVAC" },
          { id: "hvac-11-co2", statement: "Diagnose overcharge, undercharge, liquid-line restriction, and non-condensables from manifold gauge readings", standard: "Correct diagnosis on 4/4 fault scenarios" },
          { id: "hvac-11-co3", statement: "Evacuate a system to 500 microns and verify hold for 10 minutes without rise above 1000 microns", standard: "500 microns, 10-minute hold", credentialAlignment: "Residential HVAC" },
          { id: "hvac-11-co4", statement: "Locate a planted refrigerant leak using an electronic leak detector within 5 minutes", standard: "Leak found within 5 minutes" },
        ],
        lessons: [
          { id: "hvac-11-01", title: "Refrigerant Charging Methods", type: "video", durationMinutes: 35, description: "Subcooling method, superheat method, weigh-in method, and manufacturer specifications" },
          { id: "hvac-11-02", title: "System Diagnostics with Gauges", type: "video", durationMinutes: 40, description: "Reading manifold gauges, identifying overcharge, undercharge, restrictions, and non-condensables" },
          { id: "hvac-11-03", title: "Leak Detection Lab", type: "lab", durationMinutes: 60, description: "Practice electronic leak detection, nitrogen pressure test, and standing vacuum test", assessesObjectives: ["hvac-11-co4"] },
          { id: "hvac-11-04", title: "Recovery & Evacuation Lab", type: "lab", durationMinutes: 90, description: "Recover refrigerant, pull vacuum to 500 microns, and charge system to spec", assessesObjectives: ["hvac-11-co1", "hvac-11-co3"] },
          { id: "hvac-11-05", title: "Refrigeration Diagnostics Quiz", type: "quiz", durationMinutes: 20, description: "Diagnose system problems from gauge readings and symptoms", passThreshold: 80, assessesObjectives: ["hvac-11-co2"] },
        ],
      },
      {
        id: "hvac-12",
        title: "Airflow, Duct Systems & Installation",
        description: "Static pressure measurement, duct sizing, brazing, and system commissioning.",
        weekAssignment: { week: 10, weeklyCompetencyStatement: "Measure static pressure within ±0.02 in. w.c., identify airflow restrictions, vacuum a system to 500 microns, verify refrigerant charge, and complete a startup checklist" },
        objectives: [
          "Measure static pressure and identify airflow restrictions",
          "Apply Manual J concepts for equipment sizing and selection",
          "Braze copper tubing with nitrogen purge and perform flare connections",
          "Execute a complete system startup: charge verification, airflow, and performance test",
        ],
        competencyObjectives: [
          { id: "hvac-12-co1", statement: "Measure total external static pressure on a residential system and compare to equipment rating", standard: "Reading within ±0.02 in. w.c. of instructor reference" },
          { id: "hvac-12-co2", statement: "Braze a copper-to-copper joint with nitrogen purge that passes a 150 psi nitrogen pressure test", standard: "Zero leaks at 150 psi for 15 minutes" },
          { id: "hvac-12-co3", statement: "Complete a 20-point system commissioning checklist including charge verification, airflow, and temperature split", standard: "20/20 items documented, temperature split within manufacturer range" },
          { id: "hvac-12-co4", statement: "Vacuum a system to 500 microns and verify charge using subcooling method", standard: "500 microns hold, subcooling within ±2°F", credentialAlignment: "Residential HVAC" },
        ],
        milestone: "Residential HVAC Certification Ready",
        lessons: [
          { id: "hvac-12-01", title: "Ductwork Design & Static Pressure", type: "video", durationMinutes: 35, description: "Supply, return, duct sizing, static pressure measurement, and airflow restrictions" },
          { id: "hvac-12-02", title: "Equipment Sizing — Manual J Basics", type: "video", durationMinutes: 30, description: "Heat load calculation concepts, equipment selection, and matching indoor/outdoor units" },
          { id: "hvac-12-03", title: "Brazing & Soldering Lab", type: "lab", durationMinutes: 90, description: "Hands-on brazing copper tubing with nitrogen purge, pressure testing joints", assessesObjectives: ["hvac-12-co2"] },
          { id: "hvac-12-04", title: "Line Set Installation", type: "lab", durationMinutes: 60, description: "Measure, cut, flare, and connect refrigerant line sets" },
          { id: "hvac-12-05", title: "System Commissioning Lab", type: "lab", durationMinutes: 90, description: "Complete startup: vacuum, charge, airflow verification, temperature split, and commissioning checklist", assessesObjectives: ["hvac-12-co1", "hvac-12-co3", "hvac-12-co4"] },
          { id: "hvac-12-06", title: "Installation Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of installation procedures and best practices", passThreshold: 80, assessesObjectives: ["hvac-12-co1"] },
        ],
      },
      {
        id: "hvac-13",
        title: "Troubleshooting & Service Calls",
        description: "Systematic troubleshooting, common failures, and customer communication.",
        weekAssignment: { week: 11, weeklyCompetencyStatement: "Apply the 6-step troubleshooting method to diagnose and repair 3 planted faults on training equipment within 30 minutes each, and communicate findings professionally" },
        objectives: [
          "Apply the 6-step systematic troubleshooting method to HVAC service calls",
          "Diagnose common AC failures: bad capacitor, frozen coil, low charge, restriction",
          "Diagnose common heating failures: ignition failure, cracked heat exchanger, gas valve issues",
          "Communicate repair findings and estimates to customers professionally",
        ],
        competencyObjectives: [
          { id: "hvac-13-co1", statement: "Diagnose a planted fault on a cooling system using the 6-step method and correct it", standard: "Correct diagnosis and repair within 30 minutes", credentialAlignment: "Residential HVAC" },
          { id: "hvac-13-co2", statement: "Diagnose a planted fault on a heating system using the 6-step method and correct it", standard: "Correct diagnosis and repair within 30 minutes", credentialAlignment: "Residential HVAC" },
          { id: "hvac-13-co3", statement: "Present repair findings and cost estimate to a simulated customer using professional language", standard: "Instructor evaluation: clear, accurate, professional" },
        ],
        lessons: [
          { id: "hvac-13-01", title: "Systematic Troubleshooting Method", type: "video", durationMinutes: 30, description: "Step-by-step approach: verify complaint, gather data, isolate, test, repair, verify" },
          { id: "hvac-13-02", title: "Common AC Failures", type: "video", durationMinutes: 35, description: "Bad capacitor, failed compressor, frozen coil, dirty condenser, low charge, restriction" },
          { id: "hvac-13-03", title: "Common Heating Failures", type: "video", durationMinutes: 30, description: "Ignition failure, cracked heat exchanger, bad gas valve, thermostat issues, blower problems" },
          { id: "hvac-13-04", title: "Troubleshooting Scenarios Lab", type: "lab", durationMinutes: 120, description: "Diagnose and repair multiple system faults on training equipment", assessesObjectives: ["hvac-13-co1", "hvac-13-co2"] },
          { id: "hvac-13-05", title: "Customer Communication Simulation", type: "lab", durationMinutes: 30, description: "Role-play service call: explain findings, present estimate, handle objections", assessesObjectives: ["hvac-13-co3"] },
          { id: "hvac-13-06", title: "Troubleshooting Quiz", type: "quiz", durationMinutes: 20, description: "Diagnose system problems from described symptoms and readings", passThreshold: 80, assessesObjectives: ["hvac-13-co1", "hvac-13-co2"] },
        ],
      },
      {
        id: "hvac-14",
        title: "OSHA 10 — Construction Safety (CareerSafe)",
        description: "30-hour OSHA construction safety course. Fall protection, electrical safety, PPE, and hazard communication.",
        weekAssignment: { week: 11, weeklyCompetencyStatement: "Pass OSHA 10 final exam and demonstrate lockout/tagout, fall protection selection, and GHS label reading" },
        objectives: [
          "Identify OSHA worker rights and employer responsibilities",
          "Apply fall protection standards for ladders, scaffolding, and elevated work",
          "Implement lockout/tagout and electrical safety procedures",
          "Read GHS labels and Safety Data Sheets for hazard communication compliance",
        ],
        competencyObjectives: [
          { id: "hvac-14-co1", statement: "Execute a lockout/tagout procedure on a simulated HVAC disconnect following OSHA 1910.147", credentialAlignment: "OSHA 10" },
          { id: "hvac-14-co2", statement: "Select correct fall protection equipment for three given work scenarios", standard: "3/3 correct selections", credentialAlignment: "OSHA 10" },
          { id: "hvac-14-co3", statement: "Read a GHS label and Safety Data Sheet and identify hazard class, PPE required, and first aid measures", credentialAlignment: "OSHA 10" },
          { id: "hvac-14-co4", statement: "Pass OSHA 10 final exam", standard: "70% minimum to earn OSHA 10-Hour card (issued by CareerSafe/DOL)", credentialAlignment: "OSHA 10" },
        ],
        milestone: "OSHA 10-Hour Construction Safety Card (CareerSafe)",
        lessons: [
          { id: "hvac-14-01", title: "OSHA 10 Overview & Worker Rights (CareerSafe)", type: "video", durationMinutes: 30, description: "OSHA standards, worker rights, employer responsibilities — delivered through CareerSafe online platform" },
          { id: "hvac-14-02", title: "Fall Protection", type: "video", durationMinutes: 45, description: "Ladder safety, scaffolding, guardrails, personal fall arrest systems" },
          { id: "hvac-14-03", title: "Electrical Safety", type: "video", durationMinutes: 30, description: "Lockout/tagout, arc flash, ground fault protection, and safe work practices" },
          { id: "hvac-14-04", title: "Hazard Communication (HazCom)", type: "reading", description: "GHS labels, Safety Data Sheets, chemical hazards, and right-to-know" },
          { id: "hvac-14-05", title: "PPE Selection & Use", type: "video", durationMinutes: 20, description: "Hard hats, safety glasses, gloves, respirators, and hearing protection" },
          { id: "hvac-14-06", title: "Confined Spaces & Excavations", type: "video", durationMinutes: 25, description: "Permit-required confined spaces, atmospheric testing, and trench safety" },
          { id: "hvac-14-07", title: "Fire Prevention & Welding Safety", type: "reading", description: "Hot work permits, fire extinguisher types, and brazing safety for HVAC" },
          { id: "hvac-14-08", title: "OSHA 10 Final Exam (CareerSafe)", type: "quiz", durationMinutes: 45, description: "CareerSafe proctored OSHA 10 assessment — DOL card issued upon passing", passThreshold: 70, assessesObjectives: ["hvac-14-co1", "hvac-14-co2", "hvac-14-co3", "hvac-14-co4"] },
        ],
      },
      {
        id: "hvac-15",
        title: "CPR/AED & Workforce Certifications (CareerSafe)",
        description: "CPR/AED/First Aid certification through CareerSafe and NRF Rise Up Retail Industry Fundamentals.",
        weekAssignment: { week: 12, weeklyCompetencyStatement: "Perform adult CPR at correct depth and rate on a manikin, operate an AED, pass the proctored EPA 608 Universal exam, and complete employer mock interview" },
        objectives: [
          "Perform adult CPR with proper compression depth, rate, and rescue breathing",
          "Operate an AED and demonstrate competency on training manikins",
          "Apply first aid for bleeding, shock, burns, and heat/cold emergencies",
          "Pass NRF Rise Up Retail Industry Fundamentals assessment",
        ],
        competencyObjectives: [
          { id: "hvac-15-co1", statement: "Perform 2 minutes of adult CPR on a manikin with correct compression depth (2–2.4 inches) and rate (100–120/min)", standard: "Manikin feedback confirms adequate depth and rate", credentialAlignment: "CPR/AED" },
          { id: "hvac-15-co2", statement: "Operate an AED on a training manikin: power on, attach pads, deliver shock when prompted", credentialAlignment: "CPR/AED" },
          { id: "hvac-15-co3", statement: "Pass NRF Rise Up Retail Industry Fundamentals assessment", standard: "70% minimum" },
        ],
        milestone: "CPR/AED Certification (CareerSafe)",
        lessons: [
          { id: "hvac-15-01", title: "CPR & AED — Adult", type: "video", durationMinutes: 30, description: "Chest compressions, rescue breathing, AED operation for adults" },
          { id: "hvac-15-02", title: "First Aid Basics", type: "video", durationMinutes: 25, description: "Bleeding control, shock, burns, heat/cold emergencies, and when to call 911" },
          { id: "hvac-15-03", title: "CPR Skills Assessment", type: "lab", durationMinutes: 45, description: "Hands-on CPR and AED practice on manikins — must demonstrate competency", assessesObjectives: ["hvac-15-co1", "hvac-15-co2"] },
          { id: "hvac-15-04", title: "Rise Up — Customer Service & Sales", type: "reading", description: "NRF Retail Industry Fundamentals: customer service, selling, and workplace skills" },
          { id: "hvac-15-05", title: "Rise Up Assessment", type: "quiz", durationMinutes: 30, description: "NRF Rise Up certification exam", passThreshold: 70, assessesObjectives: ["hvac-15-co3"] },
        ],
      },
      {
        id: "hvac-16",
        title: "EPA 608 Exam + Career Placement",
        description: "Proctored EPA 608 Universal exam, resume, mock interview, and employer placement.",
        weekAssignment: { week: 12, weeklyCompetencyStatement: "Pass the proctored EPA 608 Universal exam (70% per section), complete a trade-specific resume, and demonstrate interview readiness in a mock employer interview" },
        objectives: [
          "Pass the proctored EPA 608 Universal certification exam",
          "Build a trade-specific resume highlighting EPA 608, OSHA 10, and training hours",
          "Demonstrate interview readiness for entry-level HVAC technician positions",
          "Complete employer partner orientation and OJT internship preparation",
        ],
        competencyObjectives: [
          { id: "hvac-16-co1", statement: "Pass the proctored EPA 608 Universal certification exam", standard: "70% minimum on each of 4 sections (Core, Type I, Type II, Type III)", credentialAlignment: "EPA 608 Core" },
          { id: "hvac-16-co2", statement: "Produce a trade-specific resume listing all earned credentials, training hours, and lab competencies", standard: "Resume reviewed and approved by career services" },
          { id: "hvac-16-co3", statement: "Complete a 15-minute mock interview with an employer partner or career coach", standard: "Satisfactory rating on professionalism, technical knowledge, and communication" },
          { id: "hvac-16-co4", statement: "Verify all program credentials earned: EPA 608 Universal, OSHA 10, CPR/AED, Rise Up", standard: "All 4 credentials documented in student file" },
        ],
        milestone: "Program Complete — Workforce Ready",
        lessons: [
          { id: "hvac-16-01", title: "Proctored EPA 608 Universal Exam", type: "quiz", durationMinutes: 120, description: "Official EPA 608 Universal certification exam — 100 questions, 4 sections, proctored", passThreshold: 70, assessesObjectives: ["hvac-16-co1"] },
          { id: "hvac-16-02", title: "HVAC Resume Workshop", type: "assignment", description: "Build a trade-specific resume highlighting certifications, skills, and training hours", assessesObjectives: ["hvac-16-co2"] },
          { id: "hvac-16-03", title: "Interview Skills for Trades", type: "video", durationMinutes: 20, description: "Common HVAC interview questions, how to discuss certifications, and salary negotiation" },
          { id: "hvac-16-04", title: "Mock Interview with Employer Partner", type: "lab", durationMinutes: 30, description: "15-minute mock interview evaluated on professionalism, technical knowledge, and communication", assessesObjectives: ["hvac-16-co3"] },
          { id: "hvac-16-05", title: "Program Completion Checklist", type: "assignment", description: "Verify all certifications earned, hours logged, and placement readiness", assessesObjectives: ["hvac-16-co4"] },
        ],
      },
    ],
  },
  {
    slug: "cdl-truck-driving",
    title: "CDL / Truck Driving",
    subtitle:
      "Commercial Driver's License training with a focus on safety, regulations, and real-world driving.",
    category: "Transportation",
    partner: "CDL Partner",
    estimatedDurationWeeks: 6,
    modality: "In-Person",
    workforceTags: ["WIOA", "Workforce Ready Grant", "OJT Eligible"],
    secondChanceFriendly: true,
    outcomes: [
      "Prepare to pass the CDL knowledge and skills exams",
      "Demonstrate safe vehicle operation",
      "Understand DOT regulations and log requirements",
    ],
    modules: [
      {
        id: "cdl-01",
        title: "CDL Foundations",
        description:
          "Intro to CDL classes, career options, and exam overview.",
        lessons: [
          {
            id: "cdl-01-01",
            title: "Intro to the CDL World",
            type: "video",
            durationMinutes: 25,
            description: "Overview of CDL classes, career paths, and industry opportunities",
          },
          {
            id: "cdl-01-02",
            title: "CDL Requirements & Pathways",
            type: "reading",
            description: "Understanding CDL requirements, endorsements, and career progression",
          },
        ],
      },
      {
        id: "cdl-02",
        title: "Safety & Regulations",
        description:
          "Road safety, hours-of-service, and compliance basics.",
        lessons: [
          {
            id: "cdl-02-01",
            title: "Hours of Service",
            type: "video",
            durationMinutes: 30,
            description: "Understanding DOT hours-of-service regulations and logbook requirements",
          },
          {
            id: "cdl-02-02",
            title: "Safety Scenarios Quiz",
            type: "quiz",
            durationMinutes: 20,
            description: "Test your knowledge of CDL safety regulations",
          },
        ],
      },
    ],
  },
  {
    slug: "workforce-readiness-reentry",
    title: "Workforce Readiness & Re-Entry",
    subtitle:
      "Coaching, skills training, and real employment connections for justice-impacted and underemployed learners.",
    category: "Workforce Readiness",
    partner: "Elevate For Humanity (Workforce)",
    estimatedDurationWeeks: 8,
    modality: "Hybrid",
    workforceTags: ["Re-Entry", "WIOA"],
    secondChanceFriendly: true,
    outcomes: [
      "Build a job-ready resume and practice interviewing",
      "Understand workplace expectations and communication",
      "Connect to training and job opportunities",
    ],
    modules: [
      {
        id: "wr-01",
        title: "Reset & Rebuild",
        description:
          "Orientation focused on mindset, goals, and support systems.",
        lessons: [
          {
            id: "wr-01-01",
            title: "Your Why & Your Goals",
            type: "assignment",
            description: "Reflect on your goals and create a personal action plan",
          },
          {
            id: "wr-01-02",
            title: "Program Overview",
            type: "video",
            durationMinutes: 20,
            description: "Introduction to the workforce readiness program and available resources",
          },
        ],
      },
      {
        id: "wr-02",
        title: "Workplace Skills",
        description: "Soft skills, conflict resolution, and communication.",
        lessons: [
          {
            id: "wr-02-01",
            title: "Workplace Communication Basics",
            type: "video",
            durationMinutes: 30,
            description: "Effective communication strategies for the workplace",
          },
          {
            id: "wr-02-02",
            title: "Roleplay Assignment",
            type: "assignment",
            description: "Practice workplace scenarios through roleplay exercises",
          },
        ],
      },
    ],
  },
];

// Helper function to get course by slug
export function getCourseBySlug(slug: string): CourseDefinition | undefined {
  return COURSE_DEFINITIONS.find((course) => course.slug === slug);
}

// Helper function to get courses by category
export function getCoursesByCategory(category: CourseDefinition["category"]): CourseDefinition[] {
  return COURSE_DEFINITIONS.filter((course) => course.category === category);
}

// Helper function to get courses by partner
export function getCoursesByPartner(partner: CredentialingPartner): CourseDefinition[] {
  return COURSE_DEFINITIONS.filter((course) => course.partner === partner);
}

// Helper function to get second-chance friendly courses
export function getSecondChanceCourses(): CourseDefinition[] {
  return COURSE_DEFINITIONS.filter((course) => course.secondChanceFriendly);
}
