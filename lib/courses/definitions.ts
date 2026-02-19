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
  // URL you will fill later with InVideo, Milady, etc.
  contentUrl?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
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
  workforceTags: string[]; // e.g. ["WIOA", "Re-Entry", "Apprenticeship"]
  secondChanceFriendly: boolean;
  outcomes: string[];
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
      "Complete HVAC training: heating, cooling, refrigeration, EPA 608 Universal certification, OSHA 30, and residential HVAC certifications.",
    category: "Skilled Trades",
    partner: "HVAC / Trades Partner",
    estimatedDurationWeeks: 20,
    modality: "Hybrid",
    workforceTags: ["WIOA", "Workforce Ready Grant", "Next Level Jobs", "OJT Eligible"],
    secondChanceFriendly: true,
    outcomes: [
      "Pass EPA Section 608 Universal Certification exam",
      "Earn Residential HVAC Certification 1",
      "Earn Residential HVAC Certification 2 — Refrigeration Diagnostics",
      "Complete OSHA 30 Construction Safety",
      "Earn CPR certification",
      "Earn Rise Up — Retail Industry Fundamentals certificate",
      "Perform HVAC installation, maintenance, and troubleshooting",
      "Qualify for entry-level HVAC technician positions",
    ],
    modules: [
      {
        id: "hvac-01",
        title: "Program Orientation & Workforce Readiness",
        description: "Program overview, expectations, funding orientation, and career pathways in HVAC.",
        lessons: [
          { id: "hvac-01-01", title: "Welcome to HVAC Technician Training", type: "video", durationMinutes: 20, description: "Program structure, schedule, credentials earned, and career outlook" },
          { id: "hvac-01-02", title: "WIOA Funding, Attendance & Support Services", type: "reading", description: "Understanding workforce funding, attendance requirements, and available support" },
          { id: "hvac-01-03", title: "HVAC Career Pathways", type: "video", durationMinutes: 15, description: "Residential, commercial, industrial HVAC — career progression from apprentice to master" },
          { id: "hvac-01-04", title: "Orientation Quiz", type: "quiz", durationMinutes: 10, description: "Confirm understanding of program requirements and expectations" },
        ],
      },
      {
        id: "hvac-02",
        title: "HVAC Fundamentals & Safety",
        description: "Core principles of heating, ventilation, and air conditioning. Tool identification and safety protocols.",
        lessons: [
          { id: "hvac-02-01", title: "How HVAC Systems Work", type: "video", durationMinutes: 40, description: "Heating cycle, cooling cycle, ventilation, and air distribution basics" },
          { id: "hvac-02-02", title: "HVAC Tools & Equipment", type: "video", durationMinutes: 30, description: "Gauges, manifolds, vacuum pumps, recovery machines, hand tools, and meters" },
          { id: "hvac-02-03", title: "PPE & Shop Safety", type: "reading", description: "Personal protective equipment, electrical safety, refrigerant safety, and lockout/tagout" },
          { id: "hvac-02-04", title: "System Components Identification", type: "lab", durationMinutes: 60, description: "Identify compressor, condenser, evaporator, metering device, and airflow components" },
          { id: "hvac-02-05", title: "HVAC Fundamentals Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of HVAC principles, components, and safety" },
        ],
      },
      {
        id: "hvac-03",
        title: "Electrical Basics for HVAC",
        description: "Electrical theory, wiring, schematics, and meter usage for HVAC systems.",
        lessons: [
          { id: "hvac-03-01", title: "Voltage, Current, Resistance & Ohm's Law", type: "video", durationMinutes: 45, description: "Fundamental electrical concepts every HVAC tech must know" },
          { id: "hvac-03-02", title: "Reading Wiring Diagrams & Schematics", type: "video", durationMinutes: 35, description: "Ladder diagrams, pictorial diagrams, and schematic symbols" },
          { id: "hvac-03-03", title: "Multimeter & Amp Clamp Lab", type: "lab", durationMinutes: 90, description: "Hands-on practice measuring voltage, amperage, resistance, and capacitance" },
          { id: "hvac-03-04", title: "Capacitors, Contactors & Relays", type: "video", durationMinutes: 30, description: "How electrical components control HVAC system operation" },
          { id: "hvac-03-05", title: "Electrical Basics Quiz", type: "quiz", durationMinutes: 15, description: "Assessment of electrical fundamentals for HVAC" },
        ],
      },
      {
        id: "hvac-04",
        title: "Heating Systems",
        description: "Gas furnaces, electric heat, heat pumps, and combustion analysis.",
        lessons: [
          { id: "hvac-04-01", title: "Gas Furnace Operation", type: "video", durationMinutes: 45, description: "Gas valve, ignition systems, heat exchangers, blower operation, and safety controls" },
          { id: "hvac-04-02", title: "Electric Heat & Heat Strips", type: "video", durationMinutes: 25, description: "Sequencers, heating elements, and electric furnace operation" },
          { id: "hvac-04-03", title: "Heat Pump Heating Mode", type: "video", durationMinutes: 35, description: "Reversing valve, defrost cycle, auxiliary heat, and balance point" },
          { id: "hvac-04-04", title: "Combustion Analysis", type: "lab", durationMinutes: 60, description: "CO testing, draft measurement, gas pressure checks, and temperature rise" },
          { id: "hvac-04-05", title: "Furnace Inspection Lab", type: "lab", durationMinutes: 90, description: "Complete furnace inspection, tune-up, and safety check procedure" },
          { id: "hvac-04-06", title: "Heating Systems Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of heating system operation and maintenance" },
        ],
      },
      {
        id: "hvac-05",
        title: "Cooling Systems & Refrigeration Cycle",
        description: "Air conditioning fundamentals, the refrigeration cycle, and system components.",
        lessons: [
          { id: "hvac-05-01", title: "The Refrigeration Cycle", type: "video", durationMinutes: 45, description: "Compression, condensation, expansion, evaporation — the four stages explained" },
          { id: "hvac-05-02", title: "Pressure-Temperature Relationship", type: "video", durationMinutes: 30, description: "PT charts, saturation, superheat, and subcooling — the foundation of HVAC diagnostics" },
          { id: "hvac-05-03", title: "Compressor Types & Operation", type: "video", durationMinutes: 25, description: "Reciprocating, scroll, and rotary compressors" },
          { id: "hvac-05-04", title: "Metering Devices", type: "video", durationMinutes: 25, description: "TXV, fixed orifice, capillary tube — how each controls refrigerant flow" },
          { id: "hvac-05-05", title: "Superheat & Subcooling Lab", type: "lab", durationMinutes: 90, description: "Measure and calculate superheat and subcooling on a live system" },
          { id: "hvac-05-06", title: "Cooling Systems Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of refrigeration cycle and AC system operation" },
        ],
      },
      {
        id: "hvac-06",
        title: "EPA 608 — Core Section",
        description: "Ozone depletion, Clean Air Act, refrigerant safety, and recovery requirements. Required for all EPA 608 certification types.",
        lessons: [
          { id: "hvac-06-01", title: "Ozone Layer & Environmental Impact", type: "video", durationMinutes: 30, description: "How CFCs and HCFCs deplete the ozone layer, Montreal Protocol, and phase-out schedules" },
          { id: "hvac-06-02", title: "Clean Air Act — Section 608", type: "reading", description: "Federal regulations on refrigerant handling, venting prohibition, and penalties" },
          { id: "hvac-06-03", title: "Refrigerant Safety", type: "video", durationMinutes: 25, description: "Toxicity, flammability, oxygen displacement, frostbite, and cylinder safety" },
          { id: "hvac-06-04", title: "Refrigerant Types & Classifications", type: "reading", description: "CFC, HCFC, HFC, HFO refrigerants — R-22, R-410A, R-134a, R-404A, and their properties" },
          { id: "hvac-06-05", title: "Pressure-Temperature Fundamentals", type: "video", durationMinutes: 20, description: "Saturation temperature, gauge vs absolute pressure, and PT chart usage" },
          { id: "hvac-06-06", title: "Recovery, Recycling & Reclamation", type: "video", durationMinutes: 30, description: "Definitions, equipment requirements, and when each is required by law" },
          { id: "hvac-06-07", title: "Refrigerant Sales Restrictions", type: "reading", description: "Who can purchase refrigerant, record-keeping requirements, and certification verification" },
          { id: "hvac-06-08", title: "EPA 608 Core Practice Exam", type: "quiz", durationMinutes: 30, description: "25-question practice test matching EPA 608 Core exam format and difficulty" },
        ],
      },
      {
        id: "hvac-07",
        title: "EPA 608 — Type I (Small Appliances)",
        description: "Recovery requirements for systems with less than 5 lbs of refrigerant. Window units, PTACs, refrigerators, freezers.",
        lessons: [
          { id: "hvac-07-01", title: "Small Appliance Systems", type: "video", durationMinutes: 25, description: "Window AC, PTAC, household refrigerators, vending machines, and water coolers" },
          { id: "hvac-07-02", title: "Type I Recovery Requirements", type: "video", durationMinutes: 20, description: "90% recovery for systems with operating charge, 80% for non-operating, and when 0% applies" },
          { id: "hvac-07-03", title: "Self-Contained Recovery Equipment", type: "reading", description: "System-dependent vs self-contained recovery, equipment certification, and procedures" },
          { id: "hvac-07-04", title: "Leak Repair Exemptions", type: "reading", description: "Small appliance leak repair requirements and disposal procedures" },
          { id: "hvac-07-05", title: "EPA 608 Type I Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type I exam format" },
        ],
      },
      {
        id: "hvac-08",
        title: "EPA 608 — Type II (High-Pressure Systems)",
        description: "Recovery and service for high-pressure AC and refrigeration systems. R-22, R-410A, R-134a systems.",
        lessons: [
          { id: "hvac-08-01", title: "High-Pressure System Overview", type: "video", durationMinutes: 30, description: "Residential AC, commercial refrigeration, heat pumps, and automotive AC systems" },
          { id: "hvac-08-02", title: "Type II Recovery Requirements", type: "video", durationMinutes: 25, description: "Required recovery levels: 0 psig for systems <200 lbs, 10 inches Hg vacuum for >200 lbs" },
          { id: "hvac-08-03", title: "Leak Detection Methods", type: "video", durationMinutes: 20, description: "Electronic leak detectors, UV dye, soap bubbles, standing pressure test, and nitrogen" },
          { id: "hvac-08-04", title: "Evacuation Procedures", type: "video", durationMinutes: 25, description: "Vacuum pump operation, micron gauge, triple evacuation, and dehydration" },
          { id: "hvac-08-05", title: "Leak Repair Requirements", type: "reading", description: "Comfort cooling 10% leak rate trigger, commercial 20%, mandatory repair timelines" },
          { id: "hvac-08-06", title: "Recovery Equipment Lab", type: "lab", durationMinutes: 90, description: "Hands-on refrigerant recovery from a high-pressure system using certified equipment" },
          { id: "hvac-08-07", title: "EPA 608 Type II Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type II exam format" },
        ],
      },
      {
        id: "hvac-09",
        title: "EPA 608 — Type III (Low-Pressure Systems)",
        description: "Chillers and low-pressure refrigeration systems. R-11, R-123, and centrifugal systems.",
        lessons: [
          { id: "hvac-09-01", title: "Low-Pressure System Overview", type: "video", durationMinutes: 25, description: "Centrifugal chillers, R-11, R-123 systems, and how they differ from high-pressure" },
          { id: "hvac-09-02", title: "Type III Recovery Requirements", type: "video", durationMinutes: 20, description: "Required recovery levels: 0 psig for systems <200 lbs, 0 psig for >200 lbs" },
          { id: "hvac-09-03", title: "Purge Units & Air Removal", type: "video", durationMinutes: 20, description: "Why low-pressure systems operate in vacuum, purge unit function, and leak prevention" },
          { id: "hvac-09-04", title: "Water in Low-Pressure Systems", type: "reading", description: "Freeze-up risks, hydrolysis, acid formation, and dehydration procedures" },
          { id: "hvac-09-05", title: "Rupture Disc & Pressure Relief", type: "reading", description: "Safety devices on low-pressure systems and when they activate" },
          { id: "hvac-09-06", title: "EPA 608 Type III Practice Exam", type: "quiz", durationMinutes: 25, description: "25-question practice test matching EPA 608 Type III exam format" },
        ],
      },
      {
        id: "hvac-10",
        title: "EPA 608 Universal — Final Exam Prep",
        description: "Comprehensive review and timed practice exams covering all four EPA 608 sections.",
        lessons: [
          { id: "hvac-10-01", title: "Core Section Review", type: "video", durationMinutes: 20, description: "Quick review of key Core concepts, common exam traps, and memory aids" },
          { id: "hvac-10-02", title: "Type I, II, III Comparison Chart", type: "reading", description: "Side-by-side comparison of recovery requirements, leak rates, and equipment rules" },
          { id: "hvac-10-03", title: "Full-Length Practice Exam — Core", type: "quiz", durationMinutes: 30, description: "Timed 25-question Core practice exam under test conditions" },
          { id: "hvac-10-04", title: "Full-Length Practice Exam — Type I", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type I practice exam under test conditions" },
          { id: "hvac-10-05", title: "Full-Length Practice Exam — Type II", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type II practice exam under test conditions" },
          { id: "hvac-10-06", title: "Full-Length Practice Exam — Type III", type: "quiz", durationMinutes: 25, description: "Timed 25-question Type III practice exam under test conditions" },
          { id: "hvac-10-07", title: "EPA 608 Universal Full Practice Exam", type: "quiz", durationMinutes: 60, description: "Complete 100-question timed practice exam — all 4 sections combined. Pass = 70% per section." },
        ],
      },
      {
        id: "hvac-11",
        title: "Refrigerant Handling & Diagnostics",
        description: "Hands-on refrigerant recovery, charging, leak detection, and system diagnostics. Prepares for Residential HVAC Certification 2.",
        lessons: [
          { id: "hvac-11-01", title: "Refrigerant Charging Methods", type: "video", durationMinutes: 35, description: "Subcooling method, superheat method, weigh-in method, and manufacturer specifications" },
          { id: "hvac-11-02", title: "System Diagnostics with Gauges", type: "video", durationMinutes: 40, description: "Reading manifold gauges, identifying overcharge, undercharge, restrictions, and non-condensables" },
          { id: "hvac-11-03", title: "Leak Detection Lab", type: "lab", durationMinutes: 60, description: "Practice electronic leak detection, nitrogen pressure test, and standing vacuum test" },
          { id: "hvac-11-04", title: "Recovery & Evacuation Lab", type: "lab", durationMinutes: 90, description: "Recover refrigerant, pull vacuum to 500 microns, and charge system to spec" },
          { id: "hvac-11-05", title: "Refrigeration Diagnostics Quiz", type: "quiz", durationMinutes: 20, description: "Diagnose system problems from gauge readings and symptoms" },
        ],
      },
      {
        id: "hvac-12",
        title: "Installation Techniques",
        description: "Ductwork, equipment sizing, brazing, and system startup. Prepares for Residential HVAC Certification 1.",
        lessons: [
          { id: "hvac-12-01", title: "Ductwork Design & Installation", type: "video", durationMinutes: 35, description: "Supply, return, duct sizing, static pressure, and airflow measurement" },
          { id: "hvac-12-02", title: "Equipment Sizing — Manual J Basics", type: "video", durationMinutes: 30, description: "Heat load calculation concepts, equipment selection, and matching indoor/outdoor units" },
          { id: "hvac-12-03", title: "Brazing & Soldering", type: "lab", durationMinutes: 90, description: "Hands-on brazing copper tubing with nitrogen purge, soldering techniques" },
          { id: "hvac-12-04", title: "Line Set Installation", type: "lab", durationMinutes: 60, description: "Measure, cut, flare, and connect refrigerant line sets" },
          { id: "hvac-12-05", title: "System Startup Procedures", type: "video", durationMinutes: 25, description: "Pre-startup checklist, initial charge, airflow verification, and performance test" },
          { id: "hvac-12-06", title: "Installation Quiz", type: "quiz", durationMinutes: 15, description: "Test knowledge of installation procedures and best practices" },
        ],
      },
      {
        id: "hvac-13",
        title: "Troubleshooting & Service Calls",
        description: "Systematic troubleshooting, common failures, and customer service skills.",
        lessons: [
          { id: "hvac-13-01", title: "Systematic Troubleshooting Method", type: "video", durationMinutes: 30, description: "Step-by-step approach: verify complaint, gather data, isolate, test, repair, verify" },
          { id: "hvac-13-02", title: "Common AC Failures", type: "video", durationMinutes: 35, description: "Bad capacitor, failed compressor, frozen coil, dirty condenser, low charge, restriction" },
          { id: "hvac-13-03", title: "Common Heating Failures", type: "video", durationMinutes: 30, description: "Ignition failure, cracked heat exchanger, bad gas valve, thermostat issues, blower problems" },
          { id: "hvac-13-04", title: "Troubleshooting Scenarios Lab", type: "lab", durationMinutes: 120, description: "Diagnose and repair multiple system faults on training equipment" },
          { id: "hvac-13-05", title: "Customer Communication", type: "video", durationMinutes: 15, description: "Explaining repairs to homeowners, providing estimates, and professional conduct" },
          { id: "hvac-13-06", title: "Troubleshooting Quiz", type: "quiz", durationMinutes: 20, description: "Diagnose system problems from described symptoms and readings" },
        ],
      },
      {
        id: "hvac-14",
        title: "OSHA 30 — Construction Safety",
        description: "30-hour OSHA construction safety course. Covers fall protection, electrical safety, PPE, and hazard communication.",
        lessons: [
          { id: "hvac-14-01", title: "OSHA 30 Overview & Worker Rights", type: "video", durationMinutes: 30, description: "OSHA standards, worker rights, employer responsibilities, and how to file a complaint" },
          { id: "hvac-14-02", title: "Fall Protection", type: "video", durationMinutes: 45, description: "Ladder safety, scaffolding, guardrails, personal fall arrest systems" },
          { id: "hvac-14-03", title: "Electrical Safety", type: "video", durationMinutes: 30, description: "Lockout/tagout, arc flash, ground fault protection, and safe work practices" },
          { id: "hvac-14-04", title: "Hazard Communication (HazCom)", type: "reading", description: "GHS labels, Safety Data Sheets, chemical hazards, and right-to-know" },
          { id: "hvac-14-05", title: "PPE Selection & Use", type: "video", durationMinutes: 20, description: "Hard hats, safety glasses, gloves, respirators, and hearing protection" },
          { id: "hvac-14-06", title: "Confined Spaces & Excavations", type: "video", durationMinutes: 25, description: "Permit-required confined spaces, atmospheric testing, and trench safety" },
          { id: "hvac-14-07", title: "Fire Prevention & Welding Safety", type: "reading", description: "Hot work permits, fire extinguisher types, and brazing safety for HVAC" },
          { id: "hvac-14-08", title: "OSHA 30 Final Exam", type: "quiz", durationMinutes: 45, description: "Comprehensive OSHA 30 assessment — must pass to earn OSHA 30 card" },
        ],
      },
      {
        id: "hvac-15",
        title: "CPR & Rise Up Certifications",
        description: "CPR/AED/First Aid certification and NRF Rise Up Retail Industry Fundamentals.",
        lessons: [
          { id: "hvac-15-01", title: "CPR & AED — Adult", type: "video", durationMinutes: 30, description: "Chest compressions, rescue breathing, AED operation for adults" },
          { id: "hvac-15-02", title: "First Aid Basics", type: "video", durationMinutes: 25, description: "Bleeding control, shock, burns, heat/cold emergencies, and when to call 911" },
          { id: "hvac-15-03", title: "CPR Skills Assessment", type: "lab", durationMinutes: 45, description: "Hands-on CPR and AED practice on manikins — must demonstrate competency" },
          { id: "hvac-15-04", title: "Rise Up — Customer Service & Sales", type: "reading", description: "NRF Retail Industry Fundamentals: customer service, selling, and workplace skills" },
          { id: "hvac-15-05", title: "Rise Up Assessment", type: "quiz", durationMinutes: 30, description: "NRF Rise Up certification exam" },
        ],
      },
      {
        id: "hvac-16",
        title: "Career Prep & Job Placement",
        description: "Resume building, interview skills, employer connections, and transition to OJT internship.",
        lessons: [
          { id: "hvac-16-01", title: "HVAC Resume Workshop", type: "assignment", description: "Build a trade-specific resume highlighting certifications, skills, and training hours" },
          { id: "hvac-16-02", title: "Interview Skills for Trades", type: "video", durationMinutes: 20, description: "Common HVAC interview questions, how to discuss certifications, and salary negotiation" },
          { id: "hvac-16-03", title: "Employer Partner Introductions", type: "reading", description: "Overview of employer partners, OJT internship expectations, and placement process" },
          { id: "hvac-16-04", title: "OJT Internship Orientation", type: "video", durationMinutes: 15, description: "What to expect during your employer internship, hour logging, and supervisor expectations" },
          { id: "hvac-16-05", title: "Program Completion Checklist", type: "assignment", description: "Verify all certifications earned, hours logged, and placement readiness" },
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
