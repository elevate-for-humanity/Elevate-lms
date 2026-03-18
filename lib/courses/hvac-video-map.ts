/**
 * HVAC lesson video map.
 *
 * Maps each lesson definition ID to a video URL and interactive checkpoints.
 * Checkpoints pause the video and launch a quiz, diagram, or key-concept card.
 *
 * Video sources:
 *   - /videos/hvac-technician.mp4       — program overview (3.7 MB, real footage)
 *   - /videos/hvac-hero-final.mp4       — hero/intro clip (337 KB)
 *   - /videos/avatars/trades-guide.mp4  — Marcus avatar (1.9 MB, used for all lessons
 *                                         without dedicated footage)
 *   - /videos/welding-trades.mp4        — trades hands-on b-roll
 *   - /videos/electrician-trades.mp4    — electrical b-roll
 *
 * Checkpoint types supported by InteractiveVideoPlayer:
 *   quiz        — multiple choice, blocks progress until answered
 *   key-concept — info card, student clicks to continue
 *   hotspot     — click the correct area on a diagram
 *   scenario    — branching decision
 */

import type { Checkpoint } from '@/components/lms/InteractiveVideoPlayer';

export interface LessonVideo {
  /**
   * B-roll video URL — muted, loops silently as visual context.
   * HvacLessonVideo plays this muted while the lesson-specific Marcus
   * voiceover audio plays on top. Swap this for Synthesia/D-ID output
   * when those are generated.
   */
  videoUrl: string;
  /** Checkpoints injected at specific timestamps (seconds) — pause + quiz/concept card */
  checkpoints: Checkpoint[];
  /** Which 3D diagram to show after the video (matches MODULE_DIAGRAMS key) */
  diagramModuleId?: string;
}

// ── Shared checkpoint banks ──────────────────────────────────────────────

const REFRIGERATION_CYCLE_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 30,
    concept: 'The refrigeration cycle moves heat — it does not create cold.',
    bullets: [
      'Refrigerant absorbs heat in the evaporator (low pressure, boils)',
      'Compressor raises pressure and temperature',
      'Condenser rejects heat outside (high pressure, condenses)',
      'Metering device drops pressure — cycle repeats',
    ],
  },
  {
    type: 'quiz',
    timestamp: 90,
    question: 'What happens to refrigerant in the evaporator?',
    options: [
      'It condenses from gas to liquid',
      'It boils from liquid to gas, absorbing heat',
      'It is compressed to raise its pressure',
      'It is filtered to remove contaminants',
    ],
    answer: 1,
    explanation: 'The evaporator is where refrigerant boils (evaporates) at low pressure, absorbing heat from the indoor air. This is what makes the air feel cold.',
  },
  {
    type: 'quiz',
    timestamp: 150,
    question: 'Which component raises refrigerant pressure and temperature?',
    options: ['Condenser', 'Metering device', 'Compressor', 'Evaporator'],
    answer: 2,
    explanation: 'The compressor is the heart of the system. It compresses low-pressure vapor into high-pressure, high-temperature vapor so the condenser can reject the heat outside.',
  },
];

const EPA_CORE_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Venting refrigerant is illegal under Section 608 of the Clean Air Act.',
    bullets: [
      'Penalty: up to $44,539 per day per violation',
      'Applies to ALL refrigerants — CFCs, HCFCs, and HFCs',
      'Technicians must be certified to purchase refrigerant in containers over 2 lbs',
      'Recovery equipment must be EPA-certified',
    ],
  },
  {
    type: 'quiz',
    timestamp: 60,
    question: 'What is the maximum daily fine for knowingly venting refrigerant?',
    options: ['$1,000', '$10,000', '$44,539', '$100,000'],
    answer: 2,
    explanation: 'The Clean Air Act penalty for knowingly venting refrigerant is up to $44,539 per day per violation. This is not a small fine — it can end a career.',
  },
  {
    type: 'quiz',
    timestamp: 120,
    question: 'Which refrigerant has an Ozone Depletion Potential (ODP) of zero?',
    options: ['R-11', 'R-22', 'R-410A', 'R-123'],
    answer: 2,
    explanation: 'R-410A is an HFC with zero ODP — it does not deplete the ozone layer. However, it has a high GWP of 2,088, which is why the AIM Act is phasing it down.',
  },
];

const ELECTRICAL_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 25,
    concept: "Ohm's Law: V = I × R",
    bullets: [
      'V = Voltage (volts)',
      'I = Current (amps)',
      'R = Resistance (ohms)',
      'If resistance increases and voltage stays the same, current decreases',
    ],
  },
  {
    type: 'quiz',
    timestamp: 80,
    question: 'A circuit has 240V and 12Ω resistance. What is the current?',
    options: ['2 A', '20 A', '2,880 A', '0.05 A'],
    answer: 1,
    explanation: 'I = V ÷ R = 240 ÷ 12 = 20 amps. This is a typical compressor circuit calculation.',
  },
];

const FURNACE_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Gas furnace startup sequence — order matters for safety.',
    bullets: [
      '1. Draft inducer starts — purges heat exchanger',
      '2. Pressure switch closes — proves inducer is running',
      '3. Hot surface igniter energizes — heats to 1800°F+',
      '4. Gas valve opens — burners ignite',
      '5. Flame sensor proves flame — keeps gas valve open',
      '6. Blower delay timer — then blower starts',
    ],
  },
  {
    type: 'quiz',
    timestamp: 90,
    question: 'What does the flame sensor do if it cannot detect a flame?',
    options: [
      'Keeps the gas valve open as a safety measure',
      'Shuts the gas valve within seconds',
      'Turns on the blower to cool the heat exchanger',
      'Resets the thermostat',
    ],
    answer: 1,
    explanation: 'The flame sensor passes a small current through the flame (flame rectification). No flame = no current = gas valve closes within 3-7 seconds to prevent gas buildup.',
  },
];

const RECOVERY_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 15,
    concept: 'Recovery levels depend on system size and equipment age.',
    bullets: [
      'Systems < 200 lbs, post-1993 equipment: 4 inches Hg vacuum',
      'Systems > 200 lbs, post-1993 equipment: 10 inches Hg vacuum',
      'Small appliances (Type I): 4 inches Hg vacuum (compressor operational)',
      'Never exceed 80% cylinder capacity by weight',
    ],
  },
  {
    type: 'quiz',
    timestamp: 75,
    question: 'A recovery cylinder is rated for 50 lbs. What is the maximum you can put in it?',
    options: ['50 lbs', '45 lbs', '40 lbs', '35 lbs'],
    answer: 2,
    explanation: 'Recovery cylinders must never exceed 80% of their capacity. 80% of 50 lbs = 40 lbs maximum. Overfilling risks hydrostatic rupture from liquid expansion.',
  },
];

const EVACUATION_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Proper evacuation removes moisture and verifies no leaks.',
    bullets: [
      'Remove Schrader cores to maximize flow rate',
      'Place micron gauge at the system — not at the pump',
      'Pull to 500 microns or below',
      'Decay test: close valves, wait 10 min — should hold below 1,000 microns',
      'Rising microns = leak or moisture. Do not charge.',
    ],
  },
  {
    type: 'quiz',
    timestamp: 90,
    question: 'Why is the micron gauge placed at the system rather than at the vacuum pump?',
    options: [
      'It does not matter where the gauge is placed',
      'To measure actual vacuum at the system, not at the pump',
      'The pump connection is too small for the gauge',
      'To protect the gauge from pump oil',
    ],
    answer: 1,
    explanation: 'The gauge at the pump reads the pump\'s vacuum, not the system\'s. Hose restrictions can make the pump look like it\'s pulling deep vacuum while the system is still at 5,000 microns. Always gauge at the system.',
  },
];

const TROUBLESHOOTING_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 15,
    concept: 'Systematic diagnosis: measure before you touch anything.',
    bullets: [
      'Get the complaint from the customer — when, how often, how bad',
      'Check the thermostat settings and filter first',
      'Measure supply and return air temperatures',
      'Check electrical — voltage, amps, capacitor',
      'Then check refrigerant — pressures, superheat, subcooling',
    ],
  },
  {
    type: 'quiz',
    timestamp: 70,
    question: 'A condenser fan is not spinning but the compressor is humming. First thing you check?',
    options: [
      'Refrigerant charge — add R-410A',
      'Run capacitor — most common cause of fan failure',
      'Thermostat wiring — check the Y terminal',
      'Ductwork — check for blockages',
    ],
    answer: 1,
    explanation: 'Fan not spinning + compressor running = failed run capacitor until proven otherwise. It is the single most common outdoor unit service call. Check the capacitor first.',
  },
];

// ── Module 9: Type I / Type II / Type III exam prep ──────────────────────

const TYPE_I_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Type I covers small appliances — 5 lbs or less of factory-charged refrigerant.',
    bullets: [
      'Household refrigerators, freezers, window AC, PTACs, vending machines',
      'Recovery required before opening the refrigerant circuit',
      'Self-contained recovery equipment allowed for Type I',
      'Technician must be certified — no exemption for small systems',
    ],
  },
  {
    type: 'quiz',
    timestamp: 80,
    question: 'Which recovery method is acceptable for a small appliance with an inoperative compressor?',
    options: [
      'System-dependent (passive) recovery only',
      'Self-contained recovery equipment',
      'Venting is allowed for systems under 5 lbs',
      'No recovery is required for small appliances',
    ],
    answer: 1,
    explanation: 'When the system compressor is inoperative, self-contained recovery equipment must be used. System-dependent recovery requires a working compressor.',
  },
];

const TYPE_II_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 25,
    concept: 'Superheat and subcooling tell you the refrigerant charge state.',
    bullets: [
      'Superheat = suction line temp − saturation temp at suction pressure',
      'Target superheat: 10–15°F at the evaporator (system-specific)',
      'Subcooling = saturation temp at discharge pressure − liquid line temp',
      'Target subcooling: 10–15°F (system-specific)',
      'High superheat = undercharged or restricted metering device',
      'Low superheat = overcharged or metering device stuck open',
    ],
  },
  {
    type: 'quiz',
    timestamp: 100,
    question: 'Suction pressure reads 68 psi on an R-410A system. Suction line temperature is 55°F. What is the superheat?',
    options: ['5°F', '10°F', '15°F', '20°F'],
    answer: 2,
    explanation: 'R-410A at 68 psi saturates at 40°F. Suction line is 55°F. Superheat = 55 − 40 = 15°F. This is within the normal range.',
  },
];

const TYPE_III_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Low-pressure systems operate below atmospheric pressure — air ingestion is the main hazard.',
    bullets: [
      'R-11 and R-123 are common Type III refrigerants',
      'System operates in vacuum — any leak pulls air and moisture IN',
      'Purge units remove non-condensables (air) that accumulate',
      'High-efficiency purge units minimize refrigerant loss during purging',
      'Leak test with nitrogen — never pressurize with refrigerant',
    ],
  },
  {
    type: 'quiz',
    timestamp: 85,
    question: 'Why do low-pressure chiller systems use purge units?',
    options: [
      'To add refrigerant automatically when charge is low',
      'To remove non-condensable gases (air) that leak into the system',
      'To filter moisture from the refrigerant',
      'To boost system pressure during startup',
    ],
    answer: 1,
    explanation: 'Low-pressure systems run below atmospheric pressure, so air leaks IN rather than refrigerant leaking out. Purge units remove this air (non-condensables) which would otherwise raise head pressure and reduce efficiency.',
  },
];

// ── Module 10: Final exam prep ────────────────────────────────────────────

const EXAM_PREP_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 15,
    concept: 'EPA 608 Universal exam format — know this before you sit down.',
    bullets: [
      '100 questions total: 25 Core + 25 Type I + 25 Type II + 25 Type III',
      'Must pass each section independently at 70%',
      'Failing one section = retake only that section',
      'Certification never expires once earned',
      'Proctored by ESCO Institute, Mainstream Engineering, or HVAC Excellence',
    ],
  },
  {
    type: 'quiz',
    timestamp: 75,
    question: 'You pass Core, Type I, and Type II but fail Type III. What happens?',
    options: [
      'You must retake the entire 100-question exam',
      'You receive Type I and Type II certification only — retake Type III separately',
      'You fail the entire exam and must start over',
      'You receive Universal certification with a conditional note',
    ],
    answer: 1,
    explanation: 'Each section is scored independently. Passing Core + Type I + Type II earns those certifications. You only retake the failed section (Type III) to complete Universal.',
  },
];

// ── Module 11: Refrigeration diagnostics ─────────────────────────────────

const REFRIGERATION_DIAG_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Pressure-temperature relationship is your diagnostic foundation.',
    bullets: [
      'Every refrigerant has a fixed pressure at each saturation temperature',
      'Use a PT chart or manifold gauge with built-in PT scale',
      'High suction pressure = overcharged, restricted condenser, or bad TXV',
      'Low suction pressure = undercharged, restricted filter-drier, or low load',
      'High discharge pressure = dirty condenser, overcharged, or non-condensables',
    ],
  },
  {
    type: 'quiz',
    timestamp: 90,
    question: 'An R-410A system shows high suction AND high discharge pressure. Most likely cause?',
    options: [
      'Undercharged system',
      'Dirty evaporator coil',
      'Overcharged system or dirty condenser coil',
      'Failed run capacitor',
    ],
    answer: 2,
    explanation: 'Both pressures high = too much refrigerant in the system (overcharge) or the condenser cannot reject heat (dirty coil, failed fan). Low suction + high discharge points to a different problem.',
  },
];

// ── Module 12: Installation ───────────────────────────────────────────────

const INSTALLATION_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Line set installation — get this wrong and the system fails from day one.',
    bullets: [
      'Suction line: large, insulated — must be insulated to prevent condensation and heat gain',
      'Liquid line: small, uninsulated — carries high-pressure liquid',
      'Maximum line set length varies by manufacturer — check specs',
      'Vertical risers need oil traps every 20 ft to return oil to compressor',
      'Flare connections: 45° flare, correct torque, no cross-threading',
    ],
  },
  {
    type: 'quiz',
    timestamp: 85,
    question: 'Why must the suction line be insulated on a split system installation?',
    options: [
      'To prevent the line from freezing in cold weather',
      'To prevent heat gain and condensation that reduce system efficiency',
      'Insulation is optional — it only affects aesthetics',
      'To protect the copper from UV damage',
    ],
    answer: 1,
    explanation: 'The suction line carries cold, low-pressure vapor. Without insulation, it absorbs heat from the surrounding air (reducing efficiency) and sweats condensation that can cause water damage.',
  },
];

// ── Module 13: Troubleshooting (additional bank for non-checkpoint lessons) ─

const TROUBLESHOOTING_ADV_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'Five most common service calls — know these cold.',
    bullets: [
      '1. No cooling: check power, thermostat, filter, capacitor, refrigerant',
      '2. Not cooling enough: dirty filter/coil, low charge, oversized unit',
      '3. Unit runs constantly: undersized, dirty coil, low charge, duct leaks',
      '4. Ice on coil: low airflow (dirty filter) or low refrigerant charge',
      '5. Water leak: clogged condensate drain — most common summer call',
    ],
  },
  {
    type: 'quiz',
    timestamp: 80,
    question: 'Ice is forming on the evaporator coil. What are the two most likely causes?',
    options: [
      'Overcharge and high ambient temperature',
      'Low airflow (dirty filter/coil) or low refrigerant charge',
      'Oversized unit and high humidity',
      'Failed compressor and dirty condenser',
    ],
    answer: 1,
    explanation: 'Ice on the evaporator means the coil is getting too cold. Either not enough warm air is moving across it (low airflow) or the refrigerant pressure is too low (undercharge). Check the filter first — it is free.',
  },
];

// ── Module 14: OSHA 30 ────────────────────────────────────────────────────

const OSHA_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 20,
    concept: 'OSHA 10 vs OSHA 30 — know the difference for job applications.',
    bullets: [
      'OSHA 10: 10-hour course, entry-level awareness, DOL wallet card',
      'OSHA 30: 30-hour course, supervisory level, more detailed coverage',
      'Both issued by U.S. Department of Labor — no expiration',
      'Many HVAC employers require OSHA 10 minimum before day one',
      'OSHA 30 adds $1–3/hr to starting wage at many companies',
    ],
  },
  {
    type: 'quiz',
    timestamp: 75,
    question: 'Under OSHA lockout/tagout (LOTO), who is authorized to remove a lockout device?',
    options: [
      'Any qualified electrician on the job site',
      'The supervisor if the technician is unavailable',
      'Only the employee who installed the lock',
      'Any employee with an OSHA 10 card',
    ],
    answer: 2,
    explanation: 'OSHA LOTO requires that only the employee who placed the lock can remove it. This prevents another worker from re-energizing equipment while the original technician is still in the danger zone.',
  },
];

// ── Module 15: Career readiness ───────────────────────────────────────────

const CAREER_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 15,
    concept: 'What employers actually look for in a first-year HVAC apprentice.',
    bullets: [
      'EPA 608 Universal — non-negotiable for any refrigerant work',
      'OSHA 10 — required on most commercial job sites',
      'Reliability: show up on time, every day, in uniform',
      'Safety mindset: ask before touching anything you are unsure about',
      'Willingness to learn: no employer expects you to know everything yet',
    ],
  },
  {
    type: 'quiz',
    timestamp: 70,
    question: 'An employer offers $16/hr with a structured apprenticeship vs $19/hr with no advancement plan. Which is typically the better choice for a new technician?',
    options: [
      'Always take the higher hourly rate',
      'The structured apprenticeship — OJT hours build toward licensure and higher long-term earnings',
      'Neither — wait for a union position',
      'It depends entirely on the commute distance',
    ],
    answer: 1,
    explanation: 'Journeyman HVAC technicians earn $25–40/hr. Getting there requires documented OJT hours. A structured apprenticeship builds those hours systematically. The $3/hr difference disappears quickly once you advance.',
  },
];

// ── Module 16: Certification prep ────────────────────────────────────────

const CERT_PREP_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'key-concept',
    timestamp: 15,
    concept: 'After you pass EPA 608 — what comes next.',
    bullets: [
      'Keep your EPA 608 Universal card with you at all times on the job',
      'Card is required to purchase refrigerant in containers over 2 lbs',
      'Next certifications to pursue: NATE, manufacturer-specific (Carrier, Trane)',
      'OJT hours: document every hour — you need 2,000+ for journeyman license',
      'Indiana journeyman exam: contact Indiana Professional Licensing Agency',
    ],
  },
  {
    type: 'quiz',
    timestamp: 70,
    question: 'You just passed EPA 608 Universal. What document do you need to purchase refrigerant?',
    options: [
      'Your OSHA 10 card',
      'Your EPA 608 Universal certification card',
      'A purchase order from your employer',
      'A state contractor license',
    ],
    answer: 1,
    explanation: 'Section 608 of the Clean Air Act requires technicians to present their EPA 608 certification card to purchase refrigerant in containers larger than 2 lbs. Keep it with you on every job.',
  },
];

// ── Video map ────────────────────────────────────────────────────────────

export const HVAC_VIDEO_MAP: Record<string, LessonVideo> = {
  // Module 1 — Orientation
  'hvac-01-01': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-01-02': { videoUrl: '/videos/hvac-hero-final.mp4',      checkpoints: CAREER_CHECKPOINTS,              diagramModuleId: undefined },
  'hvac-01-03': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: CAREER_CHECKPOINTS,              diagramModuleId: undefined },
  'hvac-01-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS,            diagramModuleId: undefined },

  // Module 2 — HVAC Fundamentals
  'hvac-02-01': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-02' },
  'hvac-02-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-02' },
  'hvac-02-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-02-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-02-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },

  // Module 3 — Electrical
  'hvac-03-01': { videoUrl: '/videos/electrician-trades.mp4',   checkpoints: ELECTRICAL_CHECKPOINTS, diagramModuleId: 'hvac-03' },
  'hvac-03-02': { videoUrl: '/videos/electrician-trades.mp4',   checkpoints: ELECTRICAL_CHECKPOINTS, diagramModuleId: 'hvac-03' },
  'hvac-03-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: ELECTRICAL_CHECKPOINTS, diagramModuleId: 'hvac-03' },
  'hvac-03-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: ELECTRICAL_CHECKPOINTS, diagramModuleId: 'hvac-03' },
  'hvac-03-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: ELECTRICAL_CHECKPOINTS, diagramModuleId: undefined },

  // Module 4 — Heating Systems
  'hvac-04-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: 'hvac-04' },
  'hvac-04-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: 'hvac-04' },
  'hvac-04-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-04-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-04-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-04-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: FURNACE_CHECKPOINTS, diagramModuleId: undefined },

  // Module 5 — Refrigeration Systems
  'hvac-05-01': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-05' },
  'hvac-05-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-05' },
  'hvac-05-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-05' },
  'hvac-05-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-05-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-05-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: undefined },

  // Module 6 — EPA 608 Core
  'hvac-06-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-07': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-08': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-09': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-10': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-11': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-06-12': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS, diagramModuleId: undefined },

  // Module 7 — EPA 608 Type I
  'hvac-07-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: RECOVERY_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-07-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: RECOVERY_CHECKPOINTS,   diagramModuleId: undefined },
  'hvac-07-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: RECOVERY_CHECKPOINTS,   diagramModuleId: undefined },
  'hvac-07-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_I_CHECKPOINTS,     diagramModuleId: undefined },
  'hvac-07-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_I_CHECKPOINTS,     diagramModuleId: undefined },

  // Module 8 — EPA 608 Type II
  'hvac-08-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: RECOVERY_CHECKPOINTS, diagramModuleId: 'hvac-08' },
  'hvac-08-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EVACUATION_CHECKPOINTS, diagramModuleId: 'hvac-08' },
  'hvac-08-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EVACUATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-08-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EVACUATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-08-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_II_CHECKPOINTS,    diagramModuleId: undefined },
  'hvac-08-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_II_CHECKPOINTS,    diagramModuleId: undefined },
  'hvac-08-07': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_II_CHECKPOINTS,    diagramModuleId: undefined },

  // Module 9 — EPA 608 Type III
  'hvac-09-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_I_CHECKPOINTS,  diagramModuleId: undefined },
  'hvac-09-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_II_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-09-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_III_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-09-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_I_CHECKPOINTS,  diagramModuleId: undefined },
  'hvac-09-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_II_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-09-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TYPE_III_CHECKPOINTS, diagramModuleId: undefined },

  // Module 10 — Duct Systems
  'hvac-10-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: 'hvac-10' },
  'hvac-10-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: 'hvac-10' },
  'hvac-10-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: 'hvac-10' },
  'hvac-10-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-10-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-10-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-10-07': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EXAM_PREP_CHECKPOINTS, diagramModuleId: undefined },

  // Module 11 — Controls & Thermostats
  'hvac-11-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_DIAG_CHECKPOINTS, diagramModuleId: 'hvac-11' },
  'hvac-11-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_DIAG_CHECKPOINTS, diagramModuleId: 'hvac-11' },
  'hvac-11-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_DIAG_CHECKPOINTS, diagramModuleId: 'hvac-11' },
  'hvac-11-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_DIAG_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-11-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: REFRIGERATION_DIAG_CHECKPOINTS, diagramModuleId: undefined },

  // Module 12 — Heat Pumps
  'hvac-12-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-12-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-12-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-12-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-12-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-12-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: INSTALLATION_CHECKPOINTS, diagramModuleId: undefined },

  // Module 13 — Troubleshooting
  'hvac-13-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_CHECKPOINTS, diagramModuleId: 'hvac-13' },
  'hvac-13-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_CHECKPOINTS, diagramModuleId: 'hvac-13' },
  'hvac-13-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_ADV_CHECKPOINTS, diagramModuleId: 'hvac-13' },
  'hvac-13-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_ADV_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-13-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_ADV_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-13-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_ADV_CHECKPOINTS, diagramModuleId: undefined },

  // Module 14 — Commercial HVAC
  'hvac-14-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-06': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-07': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-14-08': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: OSHA_CHECKPOINTS, diagramModuleId: undefined },

  // Module 15 — Business & Career
  'hvac-15-01': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CAREER_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-15-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CAREER_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-15-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CAREER_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-15-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CAREER_CHECKPOINTS, diagramModuleId: undefined },
  'hvac-15-05': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CAREER_CHECKPOINTS, diagramModuleId: undefined },

  // Module 16 — Capstone
  'hvac-16-01': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: REFRIGERATION_CYCLE_CHECKPOINTS, diagramModuleId: 'hvac-16' },
  'hvac-16-02': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: TROUBLESHOOTING_CHECKPOINTS,     diagramModuleId: 'hvac-13' },
  'hvac-16-03': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: EPA_CORE_CHECKPOINTS,            diagramModuleId: undefined },
  'hvac-16-04': { videoUrl: '/videos/avatars/trades-guide.mp4', checkpoints: CERT_PREP_CHECKPOINTS,           diagramModuleId: undefined },
  'hvac-16-05': { videoUrl: '/videos/hvac-technician.mp4',      checkpoints: CERT_PREP_CHECKPOINTS,           diagramModuleId: undefined },
};
