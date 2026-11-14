/**
 * HVAC EPA 608 Universal Certification Course
 * 
 * ESCO-LEVEL CURRICULUM
 * Match the ESCO Institute Preparatory Manual quality
 * 
 * BUY THE TEST: ESCO Institute or Mainstream Engineering
 * BUILD THE CURRICULUM: Here
 * 
 * Certification: EPA 608 Universal
 * Domains: Core + Type I + Type II + Type III
 * Exam: 100 questions (25 per section), 70% to pass each section
 */

export interface ModuleSection {
  title: string;
  content: string;
  examTip?: string;
  keyPoint?: string;
}

export interface ModuleDef {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  sections: ModuleSection[];
  epaDomain: 'core' | 'type1' | 'type2' | 'type3' | 'exam' | 'career';
  examWeight: 'critical' | 'high' | 'medium';
}

const SUPABASE_VIDEO_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-videos/hvac`;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: CORE - Environmental Regulations
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_1: ModuleDef = {
  number: 1,
  title: 'Environmental Regulations',
  subtitle: 'Clean Air Act, Ozone Depletion & Federal Law',
  description: 'Learn the federal regulations governing refrigerant handling, the Clean Air Act Section 608, and the environmental impact of refrigerants.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module1.mp4`,
  epaDomain: 'core',
  examWeight: 'high',
  sections: [
    {
      title: 'The Ozone Layer',
      content: 'The ozone layer in the stratosphere absorbs harmful UV radiation from the sun. Without it, increased UV exposure causes skin cancer, cataracts, and crop damage.',
      examTip: 'The ozone layer is in the stratosphere, not the troposphere.',
      keyPoint: 'One chlorine atom can destroy 100,000 ozone molecules.',
    },
    {
      title: 'Ozone Depletion Science',
      content: 'CFC and HCFC refrigerants contain chlorine. When these molecules reach the stratosphere, UV radiation breaks them apart, releasing chlorine atoms. Each chlorine atom destroys ozone molecules in a catalytic chain reaction.',
      examTip: 'CFCs and HCFCs cause ozone depletion. HFCs do not contain chlorine and have zero ODP.',
      keyPoint: 'CFC-11 (R-11) has ODP of 1.0 (highest). R-22 (HCFC) ODP of 0.055.',
    },
    {
      title: 'Global Warming Potential (GWP)',
      content: 'GWP measures how much heat a greenhouse gas traps in the atmosphere compared to CO2. CO2 has GWP of 1. R-410A has GWP of 2,088. R-134a has GWP of 1,430. R-123 has GWP of 77.',
      examTip: 'R-410A has high GWP but zero ODP. It replaced R-22 due to ozone safety, not global warming.',
      keyPoint: 'Lower GWP refrigerants (R-1234yf, R-32) are being adopted to reduce climate impact.',
    },
    {
      title: 'Montreal Protocol',
      content: 'Signed in 1987, the Montreal Protocol is an international treaty that phased out ozone-depleting substances. The US ratified it in 1988. It mandated CFC production cessation by 1996.',
      examTip: 'The Montreal Protocol addresses ozone depletion, not global warming directly.',
      keyPoint: 'CFC production ended January 1, 1996.',
    },
    {
      title: 'Clean Air Act Section 608',
      content: 'Section 608 prohibits venting refrigerants and requires certification for technicians who work with regulated refrigerants. It establishes recovery requirements and leak repair rules.',
      examTip: 'Section 608 applies to all refrigerants covered by the Clean Air Act, not just CFCs.',
      keyPoint: 'Maximum fine: $44,539 per day per violation.',
    },
    {
      title: 'Violations and Penalties',
      content: 'Knowingly venting refrigerants is illegal. Service technicians must be EPA 608 certified. Equipment owners must repair leaks above certain thresholds. Violations can result in criminal penalties for intentional releases.',
      examTip: '"Knowingly" matters - accidental releases during proper recovery are not violations.',
      keyPoint: 'EPA 608 certification is required to purchase refrigerants in disposable cylinders.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: CORE - Refrigerant Fundamentals
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_2: ModuleDef = {
  number: 2,
  title: 'Refrigerant Fundamentals',
  subtitle: 'Classifications, PT Charts & Properties',
  description: 'Master refrigerant classifications, pressure-temperature relationships, and how to use PT charts for diagnosis.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module2.mp4`,
  epaDomain: 'core',
  examWeight: 'critical',
  sections: [
    {
      title: 'Refrigerant Classifications',
      content: 'CFC (Chlorofluorocarbon): R-11, R-12 - highest ODP, fully phased out. HCFC (Hydrochlorofluorocarbon): R-22, R-123 - being phased out. HFC (Hydrofluorocarbon): R-410A, R-134a - zero ODP, widely used. HFO (Hydrofluoroolefin): R-1234yf - zero ODP, very low GWP, emerging.',
      examTip: 'CFCs have the highest ODP. HCFCs have lower ODP. HFCs have zero ODP.',
      keyPoint: 'R-410A is NOT a drop-in replacement for R-22. It operates at higher pressures.',
    },
    {
      title: 'Pressure-Temperature Relationship',
      content: 'At different pressures, refrigerants boil at different temperatures. A PT chart shows this relationship. At 68 psig, R-410A boils at 40°F. At 118 psig, R-22 boils at 40°F.',
      examTip: 'You MUST be able to read a PT chart quickly. The exam allows a PT chart.',
      keyPoint: 'R-410A pressure is ~50% higher than R-22 at the same temperature.',
    },
    {
      title: 'Bubble Point and Dew Point',
      content: 'The bubble point is when liquid begins to boil (liquid-saturated). The dew point is when vapor begins to condense (vapor-saturated). For pure refrigerants, bubble and dew points are the same temperature at a given pressure.',
      examTip: 'In the condenser, refrigerant changes from vapor (dew point) to liquid (bubble point).',
      keyPoint: 'Mixed refrigerants (like R-410A) have different bubble and dew points at the same pressure.',
    },
    {
      title: 'Refrigerant Oils',
      content: 'Mineral oil was used with CFCs. Polyolester (POE) oil is used with HFCs like R-410A and R-134a. POE absorbs moisture easily and must be handled carefully. PAG oil is used with some automotive AC.',
      examTip: 'POE oil is hydrophilic - it draws moisture from the air. Keep containers sealed.',
      keyPoint: 'Never mix different oils. Mineral oil and POE are not compatible.',
    },
    {
      title: 'Gauge Manifold Set Operation',
      content: 'A manifold gauge set has two gauges: high-side (red) and low-side (blue), connected to the system with hoses. The center port connects to recovery equipment or vacuum pump. Blue is suction/low-side. Red is discharge/high-side.',
      examTip: 'High-side pressure is always higher than low-side pressure in a functioning system.',
      keyPoint: 'Compound gauge reads below 0 psig for vacuum (inches of mercury).',
    },
    {
      title: 'PT Chart Reading Drill',
      content: 'Given a pressure, find the temperature. Given a temperature, find the pressure. Practice until you can do this in under 30 seconds for R-410A, R-22, R-134a, and R-404A.',
      examTip: 'The exam allows a PT chart. Learn to read it FAST - you have limited time.',
      keyPoint: 'Know: R-410A at 200 psig ≈ 72°F. R-22 at 70 psig ≈ 40°F.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: CORE - Recovery & Safety
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_3: ModuleDef = {
  number: 3,
  title: 'Recovery & Safety',
  subtitle: 'Recovery Equipment, Cylinder Handling & Procedures',
  description: 'Learn proper refrigerant recovery techniques, equipment requirements, and safety procedures for handling refrigerants.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module3.mp4`,
  epaDomain: 'core',
  examWeight: 'critical',
  sections: [
    {
      title: 'Recovery vs Recycling vs Reclamation',
      content: 'Recovery: removing refrigerant from a system and storing it in a container. Recycling: cleaning recovered refrigerant (oil separation, moisture removal) for reuse in similar equipment. Reclamation: reprocessing to ARI 700 purity standards by an EPA-certified reclaimer.',
      examTip: 'Reclamation produces the purest refrigerant. Only certified reclaimers can reclaim.',
      keyPoint: 'Recycling can be done in the field. Reclamation requires a reclaiming facility.',
    },
    {
      title: 'Recovery Equipment Requirements',
      content: 'Recovery equipment must be EPA-certified. Self-contained units can recover into their own tank. System-dependent units use the appliance compressor. Equipment must be certified annually.',
      examTip: 'Equipment made after November 15, 1993 must be EPA-certified.',
      keyPoint: 'Recovery equipment must be tested/certified every year.',
    },
    {
      title: 'Recovery Cylinders',
      content: 'Recovery cylinders are yellow with a gray collar. Maximum fill is 80% by volume (allows for liquid expansion). DOT requires hydrostatic testing every 5 years. Never fill disposable cylinders with recovered refrigerant.',
      examTip: 'Yellow = recovery cylinder. Gray collar = EPA certified.',
      keyPoint: '80% fill rule prevents cylinder rupture from liquid expansion.',
    },
    {
      title: 'Cylinder Handling Safety',
      content: 'Store cylinders upright and secured. Never heat with an open flame - use warm water, not torch. Never mix refrigerants. Check for rust, dents, and damaged valves. Transport upright in a secured position.',
      examTip: 'Never heat a refrigerant cylinder with a torch - it can explode.',
      keyPoint: 'Confined spaces: refrigerant is heavier than air and displaces oxygen. Use ventilation.',
    },
    {
      title: 'Shipping Regulations',
      content: 'Refrigerant cylinders must meet DOT requirements. Include shipping papers, proper labeling, and quantity limits. R-410A is DOT 4L (non-flammable). Some HFO refrigerants have additional requirements.',
      examTip: 'Shipping papers are required for bulk refrigerant transport.',
      keyPoint: 'Most HVAC technicians don\'t ship - know this is covered but focus on recovery.',
    },
    {
      title: 'Leak Detection Methods',
      content: 'Electronic leak detectors: most sensitive, detects halogen gases. UV dye method: inject dye, run system, scan with UV light. Soap bubble test: apply to joints, watch for bubbles. nitrogen pressure test: for evacuated systems.',
      examTip: 'Electronic detectors can\'t detect HFO-1234yf - use UV dye or ultrasonic instead.',
      keyPoint: 'Always verify a leak with a second method before repairing.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: TYPE I - Small Appliances
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_4: ModuleDef = {
  number: 4,
  title: 'Type I: Small Appliances',
  subtitle: 'Recovery Requirements for Systems Under 5 lbs',
  description: 'Master Type I recovery requirements for small appliances containing less than 5 pounds of refrigerant.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module4.mp4`,
  epaDomain: 'type1',
  examWeight: 'critical',
  sections: [
    {
      title: 'What Qualifies as a Small Appliance',
      content: 'Small appliances contain 5 pounds or less of refrigerant. Examples: window AC units, refrigerators, freezers, dehumidifiers, PTACs (through-the-wall AC), vending machines, and single-packaged products.',
      examTip: '5 pounds or less = Type I. More than 5 pounds = Type II or III.',
      keyPoint: 'Split systems are NOT small appliances even if each component is small.',
    },
    {
      title: 'Type I Recovery Requirements',
      content: 'Units manufactured AFTER November 15, 1993: Recover to 90% of original charge or 0.5 ounces (whichever is less). Units manufactured BEFORE November 15, 1993: Recover to 80% of original charge or 3 ounces (whichever is less). If compressor is non-functional: Recover to 0 psig.',
      examTip: 'NEWER units require HIGHER recovery (90%). OLDER units allow 80%.',
      keyPoint: 'If compressor won\'t run, you must use self-contained recovery to reach 0 psig.',
    },
    {
      title: 'Self-Contained vs System-Dependent',
      content: 'Self-contained recovery: equipment has its own compressor and tank. System-dependent: uses the appliance\'s own compressor to push refrigerant into a recovery cylinder. If system compressor works, can use system-dependent.',
      examTip: 'If the compressor is working, you can use system-dependent recovery.',
      keyPoint: 'If compressor is failed, you MUST use self-contained equipment.',
    },
    {
      title: 'Type I Recovery Procedure',
      content: '1. Connect recovery equipment to service ports. 2. Open valves. 3. Run recovery until system reaches required vacuum. 4. Close valves. 5. Disconnect and label cylinder with refrigerant type and "RECOVERED."',
      examTip: 'For 90% recovery: evacuate until gauges reach 0 psig (for small amounts).',
      keyPoint: 'Never recover into a non-certified container.',
    },
    {
      title: 'Disposal Requirements',
      content: 'When disposing of small appliances, recover refrigerant to the required level before disposal. Properly recycle or dispose of cylinders according to local regulations.',
      examTip: 'Disposal recovery requirements are the same as service recovery requirements.',
      keyPoint: 'Never release refrigerant from a disposal unit.',
    },
    {
      title: 'Type I Exam Drill',
      content: 'A 1995 window AC unit has 2 lbs of R-410A and a working compressor. Required recovery? Answer: 90% = 1.8 lbs, so recover until gauge reads 0 psig. A 1990 refrigerator has 0.25 lbs and dead compressor. Required? Answer: 0 psig using self-contained.',
      examTip: 'The exam will test you on percentages and dates. Practice these calculations.',
      keyPoint: 'Newer = 90%. Older = 80%. Dead compressor = 0 psig.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: TYPE II - High-Pressure Systems
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_5: ModuleDef = {
  number: 5,
  title: 'Type II: High-Pressure Systems',
  subtitle: 'Recovery, Evacuation & Leak Repair',
  description: 'Learn Type II recovery requirements for high-pressure systems including residential AC, commercial refrigeration, and rooftop units.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module5.mp4`,
  epaDomain: 'type2',
  examWeight: 'critical',
  sections: [
    {
      title: 'What Qualifies as Type II',
      content: 'Type II covers HIGH-PRESSURE refrigerants. Includes: R-410A, R-22, R-134a, R-404A, R-407C. Equipment: residential split AC, rooftop units, commercial refrigeration over 50 lbs, chillers (some), transport refrigeration.',
      examTip: 'Type II = high-pressure appliances. Type III = low-pressure appliances.',
      keyPoint: 'R-410A (417 psig max) is the most common Type II refrigerant today.',
    },
    {
      title: 'Type II Recovery Requirements',
      content: 'Recover refrigerant to 500 microns OR atmospheric pressure (0 psig), whichever is reached FIRST. This is stricter than Type I because high-pressure systems hold more refrigerant.',
      examTip: '500 microns is a deep vacuum. You must use a vacuum pump, not just recover to 0 psig.',
      keyPoint: '500 microns = 0.5 mm Hg absolute. This removes non-condensables.',
    },
    {
      title: 'System Evacuation',
      content: 'After opening a system for repair, evacuate to 500 microns. Hold the vacuum for at least 5 minutes (some say 10-15 minutes) to verify no leaks. If vacuum rises, there is moisture or a leak.',
      examTip: 'A rising vacuum indicates moisture, not necessarily a leak. Both must be addressed.',
      keyPoint: 'Deep vacuum (500 microns) removes moisture by boiling it at low temperature.',
    },
    {
      title: 'Leak Repair Requirements',
      content: 'Comfort cooling (>50 lbs): Repair if leak exceeds 30% annual loss. Commercial refrigeration (>50 lbs): Repair if leak exceeds 20% annual loss. Repair must be completed within 30 days of inspection.',
      examTip: 'Commercial refrigeration has stricter leak repair requirements than comfort cooling.',
      keyPoint: 'Calculate leak rate: (annual loss ÷ system charge) × 100 = % loss per year.',
    },
    {
      title: 'Leak Repair Timeline',
      content: 'Once a leak is identified and exceeds the threshold, you have 30 days to repair it. After repair, verify the fix with a leak check. Document the repair and verification.',
      examTip: '30-day grace period - but document when leak was found and when repaired.',
      keyPoint: 'If you can\'t repair within 30 days, you must report to EPA (large systems).',
    },
    {
      title: 'Record Keeping',
      content: 'Technicians must record: date, equipment type, refrigerant type, amount added/removed, location. Keep records for at least 3 years. Applies to commercial refrigeration (>50 lbs).',
      examTip: 'Core exam may ask: How long to keep records? Answer: 3 years.',
      keyPoint: 'Proper documentation protects you and your company legally.',
    },
    {
      title: 'Determining System Charge',
      content: 'By weighing: Use a scale to weigh refrigerant in/out. By subcooling: Measure liquid line temperature and compare to condensing temperature from PT chart. By superheat: Measure suction line temp and compare to boiling point.',
      examTip: 'Weighing is the most accurate method. Always weigh when possible.',
      keyPoint: 'Subcooling method: Subcooling = Condensing temp - Liquid line temp.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: TYPE III - Low-Pressure Systems
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_6: ModuleDef = {
  number: 6,
  title: 'Type III: Low-Pressure Systems',
  subtitle: 'Chillers, Centrifugal Compressors & Vacuum Operation',
  description: 'Learn Type III recovery requirements for low-pressure systems including centrifugal chillers and R-11/R-123 systems.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module6.mp4`,
  epaDomain: 'type3',
  examWeight: 'critical',
  sections: [
    {
      title: 'What Qualifies as Type III',
      content: 'Type III covers LOW-PRESSURE refrigerants. R-11, R-123, R-22 (when used in low-pressure applications). Equipment: centrifugal chillers, large commercial cooling towers, industrial process refrigeration.',
      examTip: 'Low-pressure systems operate BELOW atmospheric pressure on the suction side.',
      keyPoint: 'R-11 and R-123 are the primary Type III refrigerants.',
    },
    {
      title: 'Centrifugal Chillers',
      content: 'Large commercial HVAC systems that cool water for building air conditioning. Capacity: 100 to 10,000+ tons. The evaporator operates in a vacuum. Common in hospitals, universities, and large buildings.',
      examTip: 'If the chiller is running, the low-side pressure is below atmospheric (vacuum).',
      keyPoint: 'Air leaks INTO a vacuum system, not out.',
    },
    {
      title: 'The Vacuum Problem',
      content: 'Because low-pressure systems operate below atmospheric pressure, air and moisture leak INTO the system. This is the opposite of high-pressure systems. Non-condensables (air) accumulate in the condenser.',
      examTip: 'High-pressure: refrigerant leaks OUT. Low-pressure: air leaks IN.',
      keyPoint: 'Non-condensables raise head pressure and reduce efficiency.',
    },
    {
      title: 'Purge Units',
      content: 'Low-pressure systems use purge units to remove non-condensables. High-efficiency purge units minimize refrigerant loss during purging. Standard purges pull out air + some refrigerant.',
      examTip: 'Modern purge units reclaim most of the refrigerant. Old units waste more.',
      keyPoint: 'Purge units are necessary for vacuum-operated systems.',
    },
    {
      title: 'Type III Recovery Requirements',
      content: 'For systems with LESS than 200 lbs of refrigerant: Recover to 0 psig (atmospheric pressure). For systems with 200 lbs or MORE: Recover to 25 mm Hg absolute (NOT 500 microns).',
      examTip: 'Type III uses mm Hg, not microns. 25 mm Hg = 25,000 microns. This is much higher than Type II\'s 500 microns.',
      keyPoint: 'Less than 200 lbs = 0 psig. 200+ lbs = 25 mm Hg absolute.',
    },
    {
      title: 'Type III Recovery Procedure',
      content: '1. Connect recovery equipment to service valves. 2. Use self-contained recovery for large systems. 3. Monitor vacuum level - use appropriate target (0 psig or 25 mm Hg). 4. For 25 mm Hg recovery, use a vacuum pump capable of reaching that level.',
      examTip: 'The exam tests the 200 lb threshold and the 25 mm Hg target repeatedly.',
      keyPoint: 'Type III recovery targets are different from Type II. Know the difference.',
    },
    {
      title: 'Recharging Techniques',
      content: 'Recharge slowly from the liquid side when possible. For large systems, use a charging scale. Verify charge with performance readings (head/suction pressures, subcooling, superheat).',
      examTip: 'Never overcharge a low-pressure system - it can cause liquid refrigerant to enter the compressor.',
      keyPoint: 'Weigh-in charging is always preferred for accuracy.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7: EXAM PREPARATION
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_7: ModuleDef = {
  number: 7,
  title: 'Universal Exam Preparation',
  subtitle: 'Practice Tests, Drills & Exam Strategy',
  description: 'Prepare for the 100-question EPA 608 Universal exam with practice drills and test strategies.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module7.mp4`,
  epaDomain: 'exam',
  examWeight: 'critical',
  sections: [
    {
      title: 'Exam Format',
      content: '100 total questions (25 per section). Core + Type I + Type II + Type III. 70% required to pass each section (18 out of 25). Closed book. PT chart and calculator allowed. Time limit varies by testing center.',
      examTip: 'You must pass Core AND at least one Type. For Universal, pass all four.',
      keyPoint: 'If you fail one section, you only need to retake that section.',
    },
    {
      title: 'Key Numbers to Memorize',
      content: 'Core: $44,539 fine. Type I: 90%/80%/0% recovery. Type II: 500 microns evacuation. Type III: 25 mm Hg absolute. Leak rates: 30% (comfort cooling), 20% (commercial refrigeration). 30-day repair timeline. 80% cylinder fill. 3-year record retention.',
      examTip: 'Numbers are the easiest points on the exam. Know them cold.',
      keyPoint: 'Quiz yourself: 500 microns = Type II. 25 mm Hg = Type III. 90% = Type I newer.',
    },
    {
      title: 'PT Chart Practice Drill',
      content: 'Given: R-410A at 200 psig. What\'s the temperature? (Answer: ~72°F). Given: R-22 at 70 psig. What\'s the temperature? (Answer: ~40°F). Given: R-134a at 40°F. What\'s the pressure? (Answer: ~35 psig).',
      examTip: 'Practice with a PT chart until you can answer in under 30 seconds.',
      keyPoint: 'R-410A at 418 psig = 120°F (max working pressure).',
    },
    {
      title: 'Recovery Requirement Drill',
      content: 'Scenario 1: 1995 window AC, 3 lbs R-410A, working compressor. Required? 90% = 2.7 lbs. Scenario 2: 1988 refrigerator, 6 oz R-12, dead compressor. Required? 80% or 3 oz, whichever is less. Scenario 3: 2010 rooftop unit, 15 lbs R-410A. Required? 500 microns.',
      examTip: 'Always ask: What type? What date? What condition? Then apply the right rule.',
      keyPoint: 'Dead compressor = 0 psig regardless of type.',
    },
    {
      title: 'Leak Rate Calculations',
      content: 'Leak rate = (Refrigerant added over 12 months ÷ System charge) × 100. Example: 30 lbs added to 100 lb system over year = 30% leak rate. Comfort cooling threshold: 30%. Commercial refrigeration: 20%.',
      examTip: 'The exam may ask: "Does this system exceed the leak repair threshold?" Calculate and compare.',
      keyPoint: 'Track how much refrigerant you add. This determines if repair is required.',
    },
    {
      title: 'Time Management',
      content: 'Skip hard questions and come back. Don\'t second-guess yourself. Trust your first answer unless you misread the question. Budget ~1 minute per question (100 questions, 2 hours).',
      examTip: 'If you\'re unsure, eliminate obviously wrong answers and pick the best remaining.',
      keyPoint: 'The Core section is the hardest. Take extra time on it.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8: CERTIFICATION & CAREER
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_8: ModuleDef = {
  number: 8,
  title: 'Certification & Career Pathways',
  subtitle: 'Taking the Exam & Next Steps',
  description: 'Learn how to schedule your EPA 608 Universal exam and explore career opportunities in HVAC.',
  videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-epa608-module8.mp4`,
  epaDomain: 'career',
  examWeight: 'medium',
  sections: [
    {
      title: 'Scheduling Your Exam',
      content: 'EPA 608 exams are administered by ESCO Institute and Mainstream Engineering at approved testing centers. Schedule online at escogroup.org or epatest.com. Bring valid ID. Fee: approximately $100-150.',
      examTip: 'Elevate has an approved testing center. Ask your instructor about scheduling.',
      keyPoint: 'Results are immediate. Your EPA 608 card arrives by mail in 2-4 weeks.',
    },
    {
      title: 'What to Expect on Exam Day',
      content: 'Closed-book exam. PT chart and calculator provided. No phones. No outside materials. Proctor monitors the room. 100 multiple-choice questions. Computer-based testing at most centers.',
      examTip: 'Use the PT chart provided. It\'s allowed for a reason.',
      keyPoint: 'Read each question twice before answering.',
    },
    {
      title: 'After You Pass',
      content: 'Your EPA 608 Universal card will arrive by mail. This card is your federal certification to work with refrigerants. Keep it with you on job sites. Valid indefinitely unless EPA changes requirements.',
      examTip: 'Take a photo of your card as a backup. Card replacement takes time.',
      keyPoint: 'EPA 608 Universal = you can work on ALL refrigerant-containing equipment.',
    },
    {
      title: 'Next Certifications',
      content: 'NATE (North American Technician Excellence) certification. EPA 608 Universal is a prerequisite for NATE. OSHA 10-Hour Construction or General Industry. R-410A safety certification (some employers require).',
      examTip: 'NATE certification shows advanced skills and can increase your earning potential.',
      keyPoint: 'Stack certifications: EPA 608 + NATE + OSHA 10 = entry-level-ready.',
    },
    {
      title: 'Career Pathways',
      content: 'Entry level: Helper, installer helper ($16-20/hr). After 1 year: Service technician ($22-30/hr). After 3-5 years: Lead technician, installer ($30-45/hr). Specialization: Commercial refrigeration, controls, sheet metal fabrication.',
      examTip: 'EPA 608 Universal opens doors to all refrigerant work. Master it and keep learning.',
      keyPoint: 'HVAC/R technicians are in high demand. Job security is excellent.',
    },
    {
      title: 'Continuing Education',
      content: 'Refrigerant regulations change. New refrigerants are being adopted (A2L safety ratings). Stay current through manufacturer training, industry publications, and manufacturer certifications.',
      examTip: 'The EPA updates Section 608 periodically. Check epa.gov/section608 for updates.',
      keyPoint: 'Lifelong learning is part of being a professional technician.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ALL MODULES
// ─────────────────────────────────────────────────────────────────────────────
export const MODULES: ModuleDef[] = [
  MODULE_1,
  MODULE_2,
  MODULE_3,
  MODULE_4,
  MODULE_5,
  MODULE_6,
  MODULE_7,
  MODULE_8,
];

// Quick reference for exam prep
export const EXAM_REFERENCE = {
  criticalNumbers: {
    finePerDay: 44539,
    type1Newer: 0.9, // 90%
    type1Older: 0.8, // 80%
    type1DeadCompressor: 0, // 0 psig
    type2VacuumMicrons: 500,
    type3VacuumMmHg: 25,
    type3LbsThreshold: 200,
    cylinderFillMax: 0.8, // 80%
    recordRetentionYears: 3,
    leakRateComfortCooling: 0.3, // 30%
    leakRateCommercialRefrigeration: 0.2, // 20%
    repairTimelineDays: 30,
  },
  refrigerantTypes: {
    cfc: ['R-11', 'R-12'],
    hcfc: ['R-22', 'R-123'],
    hfc: ['R-410A', 'R-134a', 'R-404A', 'R-407C'],
    hfo: ['R-1234yf', 'R-32'],
  },
};
