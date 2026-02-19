export type Competency = {
  name: string;
  rtiHours: number;
  ojtHours: number;
  assessmentType: string;
  evaluator: string;
  passCriteria: string[];
};

export type ProgramRubric = {
  program: string;
  occupation: string;
  totalCompetencies: number;
  scoringScale: string;
  competencies: Competency[];
};

export const BARBER_RUBRIC: ProgramRubric = {
  program: 'Barber Apprenticeship',
  occupation: 'Barber (330.371-010)',
  totalCompetencies: 12,
  scoringScale: 'Beginner / Competent / Mastery',
  competencies: [
    { name: 'Sanitation & Infection Control', rtiHours: 15, ojtHours: 50, assessmentType: 'Practical inspection + checklist', evaluator: 'Licensed Barber Instructor + Shop Supervisor', passCriteria: ['Tool disinfection procedures followed correctly', 'Station sanitation maintained per state board standards', 'Proper cape, razor, and clipper sanitation', 'State board hygiene compliance demonstrated'] },
    { name: 'Clipper Control & Fading Technique', rtiHours: 12, ojtHours: 120, assessmentType: 'Practical demonstration', evaluator: 'Licensed Barber Instructor', passCriteria: ['Even fade transitions (0–3 guard progression)', 'Consistent clipper-over-comb technique', 'Blending accuracy on multiple hair textures', 'Client-ready finish quality'] },
    { name: 'Shear Cutting Fundamentals', rtiHours: 10, ojtHours: 100, assessmentType: 'Practical demonstration', evaluator: 'Licensed Barber Instructor', passCriteria: ['Point cutting accuracy', 'Layering technique consistency', 'Texturizing shear usage', 'Symmetry verification'] },
    { name: 'Client Consultation & Professionalism', rtiHours: 8, ojtHours: 60, assessmentType: 'Observation + role-play', evaluator: 'Shop Supervisor + Program Holder', passCriteria: ['Professional greeting and consultation process', 'Style recommendation based on face shape and hair type', 'Clear communication of service timeline and pricing', 'Appropriate handling of client concerns'] },
    { name: 'Hair Texture & Type Handling', rtiHours: 10, ojtHours: 80, assessmentType: 'Practical demonstration', evaluator: 'Licensed Barber Instructor', passCriteria: ['Correct product selection per hair type', 'Appropriate technique adaptation (straight, wavy, curly, coily)', 'Damage prevention awareness', 'Styling finish appropriate to texture'] },
    { name: 'Straight Razor Shaving', rtiHours: 12, ojtHours: 80, assessmentType: 'Practical demonstration + safety checklist', evaluator: 'Licensed Barber Instructor', passCriteria: ['Proper razor angle and pressure', 'Pre-shave preparation (hot towel, lather)', 'Skin irritation prevention technique', 'Post-shave care and aftershave application'] },
    { name: 'Chemical Services (Color & Relaxer)', rtiHours: 10, ojtHours: 60, assessmentType: 'Practical demonstration + written exam', evaluator: 'Licensed Barber Instructor', passCriteria: ['Patch test procedure followed', 'Correct mixing ratios', 'Application timing accuracy', 'Safety protocol compliance'] },
    { name: 'Facial Hair Design & Beard Grooming', rtiHours: 8, ojtHours: 80, assessmentType: 'Practical demonstration', evaluator: 'Licensed Barber Instructor + Shop Supervisor', passCriteria: ['Symmetrical beard shaping', 'Line-up precision', 'Trimmer technique accuracy', 'Client preference incorporation'] },
    { name: 'Indiana State Board Exam Preparation', rtiHours: 15, ojtHours: 0, assessmentType: 'Written practice exam + practical mock', evaluator: 'Licensed Barber Instructor', passCriteria: ['Written exam score ≥ 75%', 'Practical exam procedures completed in sequence', 'Sanitation setup and breakdown per state board protocol', 'Time management within exam constraints'] },
    { name: 'Business Operations & Shop Management', rtiHours: 8, ojtHours: 40, assessmentType: 'Written assessment + business plan', evaluator: 'Program Holder', passCriteria: ['Basic bookkeeping understanding', 'Appointment scheduling proficiency', 'Inventory management awareness', 'Client retention strategy articulation'] },
    { name: 'Workplace Safety & OSHA Compliance', rtiHours: 6, ojtHours: 30, assessmentType: 'Written exam + workplace observation', evaluator: 'Shop Supervisor', passCriteria: ['PPE usage when required', 'Chemical storage compliance', 'Emergency procedure awareness', 'Slip/trip/fall prevention'] },
    { name: 'Professional Ethics & Indiana Barber Law', rtiHours: 8, ojtHours: 0, assessmentType: 'Written exam', evaluator: 'Licensed Barber Instructor', passCriteria: ['Indiana barber law knowledge (IC 25-7)', 'Scope of practice understanding', 'Licensing renewal requirements', 'Professional conduct standards'] },
  ],
};

export const HVAC_RUBRIC: ProgramRubric = {
  program: 'HVAC Technician',
  occupation: 'HVAC Installer / Maintenance Technician',
  totalCompetencies: 10,
  scoringScale: 'Not Yet Competent / Competent / Proficient',
  competencies: [
    { name: 'HVAC Safety & Tool Handling', rtiHours: 20, ojtHours: 80, assessmentType: 'Practical demonstration + safety checklist', evaluator: 'Credential HVAC Instructor + Employer Supervisor', passCriteria: ['Proper PPE usage (100%)', 'Correct tool identification and handling', 'OSHA safety compliance demonstrated', 'Lockout/tagout procedure executed correctly'] },
    { name: 'Refrigeration Fundamentals', rtiHours: 25, ojtHours: 20, assessmentType: 'Written exam + practical lab', evaluator: 'Credential HVAC Instructor', passCriteria: ['Refrigeration cycle explanation (written)', 'Pressure-temperature relationship understanding', 'Refrigerant identification and handling', 'EPA 608 practice exam score ≥ 80%'] },
    { name: 'HVAC System Installation', rtiHours: 30, ojtHours: 40, assessmentType: 'Hands-on evaluation', evaluator: 'Credential HVAC Instructor + Employer Supervisor', passCriteria: ['Correct system component identification', 'Proper ductwork connection', 'Refrigerant line brazing technique', 'System startup procedure followed'] },
    { name: 'Electrical Fundamentals for HVAC', rtiHours: 25, ojtHours: 20, assessmentType: 'Written exam + practical lab', evaluator: 'Credential HVAC Instructor', passCriteria: ['Proper wiring basics and circuit reading', 'Multimeter usage proficiency', 'Thermostat configuration accuracy', 'Electrical safety compliance'] },
    { name: 'System Diagnostics & Troubleshooting', rtiHours: 30, ojtHours: 40, assessmentType: 'Scenario-based practical evaluation', evaluator: 'Employer Supervisor + Credential Instructor', passCriteria: ['Diagnostic troubleshooting steps followed in sequence', 'Fault identification accuracy', 'Repair recommendation appropriateness', 'Documentation of findings'] },
    { name: 'Preventive Maintenance Procedures', rtiHours: 15, ojtHours: 40, assessmentType: 'Task-based performance evaluation', evaluator: 'Employer Supervisor', passCriteria: ['Filter replacement procedure', 'Coil cleaning technique', 'Belt and bearing inspection', 'Maintenance checklist completion accuracy'] },
    { name: 'Blueprint Reading & Load Calculations', rtiHours: 20, ojtHours: 0, assessmentType: 'Written exam + drawing exercise', evaluator: 'Credential HVAC Instructor', passCriteria: ['HVAC symbol identification', 'Duct layout interpretation', 'Basic load calculation completion', 'Code reference lookup proficiency'] },
    { name: 'EPA 608 Certification Preparation', rtiHours: 15, ojtHours: 0, assessmentType: 'Practice exam + EPA 608 exam', evaluator: 'EPA-Approved Testing Organization', passCriteria: ['Core section score ≥ 70%', 'Type I, II, or III section score ≥ 70%', 'Universal certification achieved (all sections)', 'Refrigerant handling safety demonstrated'] },
    { name: 'OSHA 10-Hour Safety Certification', rtiHours: 10, ojtHours: 0, assessmentType: 'OSHA course completion + exam', evaluator: 'OSHA-Authorized Trainer', passCriteria: ['All 10 OSHA modules completed', 'Final assessment passed', 'OSHA 10-Hour card issued', 'Hazard recognition demonstrated'] },
    { name: 'Customer Service & Work Order Documentation', rtiHours: 10, ojtHours: 20, assessmentType: 'Role-play + documentation review', evaluator: 'Program Holder + Employer Supervisor', passCriteria: ['Professional client communication', 'Accurate work order completion', 'Service call documentation standards met', 'Follow-up procedure understanding'] },
  ],
};

export const BUILDING_TECH_RUBRIC: ProgramRubric = {
  program: 'Building Technician',
  occupation: 'Building Maintenance Technician / Facilities Technician',
  totalCompetencies: 10,
  scoringScale: 'Not Yet Competent / Competent / Proficient',
  competencies: [
    { name: 'Facilities Safety & OSHA Compliance', rtiHours: 15, ojtHours: 40, assessmentType: 'Written exam + safety walkthrough', evaluator: 'Credential Partner Instructor + Employer Supervisor', passCriteria: ['PPE selection and usage (100%)', 'Hazard identification on walkthrough', 'OSHA safety signage knowledge', 'Emergency procedure execution'] },
    { name: 'Preventive Maintenance & Inspection', rtiHours: 20, ojtHours: 80, assessmentType: 'Task-based performance evaluation', evaluator: 'Employer Maintenance Supervisor', passCriteria: ['Preventive inspection checklist completion', 'Equipment condition assessment accuracy', 'Maintenance scheduling understanding', 'Work order documentation accuracy'] },
    { name: 'Basic Plumbing Repairs', rtiHours: 20, ojtHours: 60, assessmentType: 'Practical demonstration', evaluator: 'Credential Partner Instructor + Employer Supervisor', passCriteria: ['Faucet and valve repair/replacement', 'Drain clearing technique', 'Toilet mechanism repair', 'Leak identification and temporary repair'] },
    { name: 'Basic Electrical Troubleshooting', rtiHours: 20, ojtHours: 60, assessmentType: 'Practical demonstration + safety checklist', evaluator: 'Credential Partner Instructor', passCriteria: ['Circuit breaker identification and reset', 'Outlet and switch replacement', 'Light fixture replacement', 'Voltage tester usage proficiency'] },
    { name: 'Environmental Cleaning & Disinfection', rtiHours: 16, ojtHours: 60, assessmentType: 'Practical demonstration + checklist', evaluator: 'Credential Partner Instructor + Employer Supervisor', passCriteria: ['Correct PPE usage (100%)', 'Proper chemical dilution and labeling', 'Surface disinfection protocol in correct sequence', 'OSHA-aligned safety compliance'] },
    { name: 'HVAC Basic Maintenance', rtiHours: 15, ojtHours: 40, assessmentType: 'Practical demonstration', evaluator: 'Credential Partner Instructor', passCriteria: ['Filter replacement procedure', 'Thermostat basic troubleshooting', 'Air flow assessment', 'When to escalate to HVAC specialist'] },
    { name: 'Painting & Drywall Repair', rtiHours: 12, ojtHours: 40, assessmentType: 'Practical demonstration', evaluator: 'Employer Supervisor', passCriteria: ['Surface preparation technique', 'Drywall patch application and sanding', 'Paint application (brush, roller, spray)', 'Clean finish quality'] },
    { name: 'Grounds & Exterior Maintenance', rtiHours: 10, ojtHours: 40, assessmentType: 'Task-based evaluation', evaluator: 'Employer Supervisor', passCriteria: ['Snow/ice removal procedures', 'Landscaping basic maintenance', 'Parking lot and walkway inspection', 'Exterior lighting maintenance'] },
    { name: 'Work Order Systems & Documentation', rtiHours: 10, ojtHours: 30, assessmentType: 'System proficiency test + documentation review', evaluator: 'Program Holder + Employer Supervisor', passCriteria: ['Work order creation and completion', 'Priority classification accuracy', 'Time tracking documentation', 'Tenant/occupant communication standards'] },
    { name: 'Building Systems Overview & Code Awareness', rtiHours: 15, ojtHours: 0, assessmentType: 'Written exam', evaluator: 'Credential Partner Instructor', passCriteria: ['Fire safety system identification', 'ADA compliance awareness', 'Building code basic knowledge', 'Energy efficiency fundamentals'] },
  ],
};

export const ALL_RUBRICS = [BARBER_RUBRIC, HVAC_RUBRIC, BUILDING_TECH_RUBRIC];
