/**
 * HVAC Diagnostic Exercises
 * Gauge reading scenarios, PT chart drills, charging exercises
 * Each exercise gives real numbers and asks the student to diagnose
 */

export interface GaugeReadingExercise {
  id: string;
  title: string;
  refrigerant: 'R-410A' | 'R-22' | 'R-134a';
  systemType: string;
  outdoorTemp: number;
  indoorTemp: number;
  suctionPressure: number;
  dischargePressure: number;
  suctionLineTemp: number;
  liquidLineTemp: number;
  suctionSatTemp: number;
  liquidSatTemp: number;
  superheat: number;
  subcooling: number;
  diagnosis: string;
  explanation: string;
  correctAction: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PTChartDrill {
  id: string;
  refrigerant: 'R-410A' | 'R-22' | 'R-134a';
  givenPressure: number;
  correctSatTemp: number;
  unit: 'psig';
}

export interface ChargingScenario {
  id: string;
  title: string;
  systemType: string;
  refrigerant: 'R-410A' | 'R-22';
  meteringDevice: 'TXV' | 'piston';
  nameplateCharge: string;
  outdoorTemp: number;
  indoorWetBulb: number;
  currentReadings: {
    suctionPressure: number;
    dischargePressure: number;
    suctionLineTemp: number;
    liquidLineTemp: number;
    superheat: number;
    subcooling: number;
  };
  targetReadings: {
    superheat?: number;
    subcooling?: number;
  };
  diagnosis: string;
  correctAction: string;
  amountToAdd: string;
  steps: string[];
}

// ─── PT CHART REFERENCE VALUES ──────────────────────────

export const PT_CHART: Record<string, { pressure: number; satTemp: number }[]> = {
  'R-410A': [
    { pressure: 45, satTemp: 5 },
    { pressure: 58, satTemp: 15 },
    { pressure: 72, satTemp: 25 },
    { pressure: 83, satTemp: 32 },
    { pressure: 101, satTemp: 38 },
    { pressure: 118, satTemp: 40 },
    { pressure: 130, satTemp: 45 },
    { pressure: 145, satTemp: 50 },
    { pressure: 160, satTemp: 55 },
    { pressure: 175, satTemp: 60 },
    { pressure: 210, satTemp: 70 },
    { pressure: 247, satTemp: 80 },
    { pressure: 290, satTemp: 90 },
    { pressure: 335, satTemp: 100 },
    { pressure: 383, satTemp: 110 },
    { pressure: 418, satTemp: 115 },
    { pressure: 435, satTemp: 120 },
    { pressure: 490, satTemp: 130 },
  ],
  'R-22': [
    { pressure: 10, satTemp: -10 },
    { pressure: 20, satTemp: 5 },
    { pressure: 28, satTemp: 15 },
    { pressure: 37, satTemp: 25 },
    { pressure: 43, satTemp: 30 },
    { pressure: 57, satTemp: 40 },
    { pressure: 69, satTemp: 48 },
    { pressure: 84, satTemp: 55 },
    { pressure: 102, satTemp: 63 },
    { pressure: 121, satTemp: 70 },
    { pressure: 158, satTemp: 80 },
    { pressure: 196, satTemp: 90 },
    { pressure: 226, satTemp: 95 },
    { pressure: 260, satTemp: 100 },
    { pressure: 296, satTemp: 105 },
    { pressure: 335, satTemp: 110 },
    { pressure: 381, satTemp: 115 },
  ],
};

// ─── PT CHART DRILLS ────────────────────────────────────

export const PT_CHART_DRILLS: PTChartDrill[] = [
  { id: 'pt-01', refrigerant: 'R-410A', givenPressure: 118, correctSatTemp: 40 },
  { id: 'pt-02', refrigerant: 'R-410A', givenPressure: 418, correctSatTemp: 115 },
  { id: 'pt-03', refrigerant: 'R-410A', givenPressure: 145, correctSatTemp: 50 },
  { id: 'pt-04', refrigerant: 'R-410A', givenPressure: 335, correctSatTemp: 100 },
  { id: 'pt-05', refrigerant: 'R-410A', givenPressure: 210, correctSatTemp: 70 },
  { id: 'pt-06', refrigerant: 'R-22', givenPressure: 69, correctSatTemp: 48 },
  { id: 'pt-07', refrigerant: 'R-22', givenPressure: 226, correctSatTemp: 95 },
  { id: 'pt-08', refrigerant: 'R-22', givenPressure: 57, correctSatTemp: 40 },
  { id: 'pt-09', refrigerant: 'R-22', givenPressure: 121, correctSatTemp: 70 },
  { id: 'pt-10', refrigerant: 'R-22', givenPressure: 260, correctSatTemp: 100 },
  { id: 'pt-11', refrigerant: 'R-410A', givenPressure: 72,  correctSatTemp: 25  },
  { id: 'pt-12', refrigerant: 'R-410A', givenPressure: 247, correctSatTemp: 80  },
  { id: 'pt-13', refrigerant: 'R-22',   givenPressure: 37,  correctSatTemp: 25  },
  { id: 'pt-14', refrigerant: 'R-22',   givenPressure: 158, correctSatTemp: 80  },
  { id: 'pt-15', refrigerant: 'R-410A', givenPressure: 490, correctSatTemp: 130 },
  // R-454B (Opteon XL41) — A2L replacement for R-410A, required on 2025+ equipment
  { id: 'pt-16', refrigerant: 'R-454B', givenPressure: 101, correctSatTemp: 40  },
  { id: 'pt-17', refrigerant: 'R-454B', givenPressure: 180, correctSatTemp: 70  },
  { id: 'pt-18', refrigerant: 'R-454B', givenPressure: 291, correctSatTemp: 100 },
  { id: 'pt-19', refrigerant: 'R-454B', givenPressure: 62,  correctSatTemp: 25  },
  { id: 'pt-20', refrigerant: 'R-454B', givenPressure: 425, correctSatTemp: 130 },
  // R-32 — used in mini-splits worldwide, A2L, GWP 675
  { id: 'pt-21', refrigerant: 'R-32',   givenPressure: 124, correctSatTemp: 40  },
  { id: 'pt-22', refrigerant: 'R-32',   givenPressure: 220, correctSatTemp: 70  },
  { id: 'pt-23', refrigerant: 'R-32',   givenPressure: 354, correctSatTemp: 100 },
  { id: 'pt-24', refrigerant: 'R-32',   givenPressure: 76,  correctSatTemp: 25  },
  { id: 'pt-25', refrigerant: 'R-32',   givenPressure: 515, correctSatTemp: 130 },
];

// ─── GAUGE READING EXERCISES ────────────────────────────

export const GAUGE_READING_EXERCISES: GaugeReadingExercise[] = [
  {
    id: 'gr-01',
    title: 'Normal Operating System',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 95,
    indoorTemp: 75,
    suctionPressure: 118,
    dischargePressure: 418,
    suctionLineTemp: 52,
    liquidLineTemp: 103,
    suctionSatTemp: 40,
    liquidSatTemp: 115,
    superheat: 12,
    subcooling: 12,
    diagnosis: 'System is operating normally.',
    explanation: 'Superheat of 12°F and subcooling of 12°F are within normal range for a TXV system on a 95°F day. Suction pressure of 118 psig gives a 40°F evaporator — correct for cooling. Discharge pressure of 418 psig gives 115°F condensing — normal for 95°F outdoor temp (condensing temp runs 15-25°F above outdoor).',
    correctAction: 'No action needed. Document readings on service report. This is what a healthy system looks like.',
    difficulty: 'beginner',
  },
  {
    id: 'gr-02',
    title: 'Low Charge — Undercharged System',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 95,
    indoorTemp: 78,
    suctionPressure: 95,
    dischargePressure: 340,
    suctionLineTemp: 62,
    liquidLineTemp: 100,
    suctionSatTemp: 35,
    liquidSatTemp: 100,
    superheat: 27,
    subcooling: 0,
    diagnosis: 'System is undercharged. Low refrigerant.',
    explanation: 'High superheat (27°F) means not enough liquid refrigerant is reaching the evaporator — it is all boiling off too early. Low subcooling (0°F) means there is not enough liquid stacking up in the condenser. Both pressures are low. This is a textbook low-charge pattern. Find and fix the leak before adding refrigerant.',
    correctAction: 'Leak test the system. Find and repair the leak. Recover remaining charge. Evacuate. Weigh in the correct charge per nameplate.',
    difficulty: 'beginner',
  },
  {
    id: 'gr-03',
    title: 'Overcharged System',
    refrigerant: 'R-410A',
    systemType: '2.5-ton split system with TXV',
    outdoorTemp: 90,
    indoorTemp: 75,
    suctionPressure: 140,
    dischargePressure: 480,
    suctionLineTemp: 48,
    liquidLineTemp: 95,
    suctionSatTemp: 47,
    liquidSatTemp: 128,
    superheat: 1,
    subcooling: 33,
    diagnosis: 'System is overcharged.',
    explanation: 'Very low superheat (1°F) means liquid refrigerant is reaching the compressor — flood-back risk. Very high subcooling (33°F) means too much liquid is stacking in the condenser. Both pressures are elevated. The compressor is working harder than necessary and could be damaged by liquid slugging.',
    correctAction: 'Recover excess refrigerant into a recovery cylinder. Remove charge in small increments, let system stabilize 15 minutes between adjustments. Target 10-15°F subcooling.',
    difficulty: 'intermediate',
  },
  {
    id: 'gr-04',
    title: 'Dirty Condenser Coil',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 95,
    indoorTemp: 75,
    suctionPressure: 130,
    dischargePressure: 510,
    suctionLineTemp: 55,
    liquidLineTemp: 110,
    suctionSatTemp: 45,
    liquidSatTemp: 135,
    superheat: 10,
    subcooling: 25,
    diagnosis: 'Condenser coil is dirty or condenser fan is not running.',
    explanation: 'Discharge pressure is very high (510 psig = 135°F condensing). On a 95°F day, condensing temp should be 110-120°F, not 135°F. The condenser cannot reject heat. Suction pressure is slightly elevated because the TXV is compensating. High subcooling because liquid is backing up in the condenser. The charge is correct — the problem is airflow.',
    correctAction: 'Check condenser fan motor — is it running? If yes, clean the condenser coil with coil cleaner and a garden hose. Rinse from inside out. Recheck readings after cleaning.',
    difficulty: 'intermediate',
  },
  {
    id: 'gr-05',
    title: 'Dirty Evaporator / Low Airflow',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 90,
    indoorTemp: 76,
    suctionPressure: 100,
    dischargePressure: 370,
    suctionLineTemp: 42,
    liquidLineTemp: 98,
    suctionSatTemp: 36,
    liquidSatTemp: 108,
    superheat: 6,
    subcooling: 10,
    diagnosis: 'Low airflow across evaporator — dirty filter, dirty evaporator coil, or blower problem.',
    explanation: 'Low suction pressure (100 psig = 36°F evaporator) with low superheat (6°F) means the evaporator is too cold because not enough warm air is passing over it. The coil could freeze if this continues. Check the filter first — a clogged filter is the most common cause. Then check the evaporator coil and blower motor.',
    correctAction: 'Check and replace the air filter. Inspect the evaporator coil for dirt buildup. Verify blower motor is running at correct speed. Check for closed or blocked supply registers.',
    difficulty: 'intermediate',
  },
  {
    id: 'gr-06',
    title: 'Restricted Metering Device (TXV)',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 95,
    indoorTemp: 78,
    suctionPressure: 80,
    dischargePressure: 400,
    suctionLineTemp: 55,
    liquidLineTemp: 85,
    suctionSatTemp: 28,
    liquidSatTemp: 112,
    superheat: 27,
    subcooling: 27,
    diagnosis: 'Restricted metering device (TXV stuck partially closed or restricted).',
    explanation: 'Very low suction pressure with high superheat means not enough refrigerant is getting through the metering device. But subcooling is also high — liquid is backing up before the restriction. This pattern (low suction + high superheat + high subcooling) is the signature of a restriction. It mimics low charge, but the high subcooling tells you the charge is there — it just cannot get through.',
    correctAction: 'Check the TXV sensing bulb — is it properly mounted and insulated on the suction line? Check the TXV screen for debris. If the TXV is stuck, replace it. Check the liquid line filter-drier for restriction (feel for temperature drop across it).',
    difficulty: 'advanced',
  },
  {
    id: 'gr-07',
    title: 'Bad Compressor — Weak Valves',
    refrigerant: 'R-410A',
    systemType: '3-ton split system with TXV',
    outdoorTemp: 95,
    indoorTemp: 80,
    suctionPressure: 150,
    dischargePressure: 300,
    suctionLineTemp: 70,
    liquidLineTemp: 95,
    suctionSatTemp: 52,
    liquidSatTemp: 92,
    superheat: 18,
    subcooling: -3,
    diagnosis: 'Compressor with weak or leaking valves (internal bypass).',
    explanation: 'Suction pressure is too high and discharge pressure is too low — the compressor is not creating enough pressure differential. High-pressure gas is leaking back through worn valves to the low side. The compressor is running but not pumping effectively. Amp draw will be lower than normal. The system cannot cool.',
    correctAction: 'Verify by checking compressor amp draw (will be low). Perform a compressor pump-down test: close the liquid line valve, run the compressor, suction should pull into a vacuum. If it cannot pull below 10 psig, the compressor has internal bypass. Replace the compressor.',
    difficulty: 'advanced',
  },
  {
    id: 'gr-08',
    title: 'Non-Condensables (Air) in System',
    refrigerant: 'R-410A',
    systemType: '2-ton split system with piston',
    outdoorTemp: 85,
    indoorTemp: 75,
    suctionPressure: 125,
    dischargePressure: 460,
    suctionLineTemp: 60,
    liquidLineTemp: 108,
    suctionSatTemp: 43,
    liquidSatTemp: 125,
    superheat: 17,
    subcooling: 17,
    diagnosis: 'Non-condensable gases (air) in the system from improper evacuation.',
    explanation: 'Discharge pressure is abnormally high for an 85°F day (condensing at 125°F when it should be 100-110°F). Suction is slightly elevated too. Air in the system takes up space in the condenser, raising head pressure. The system was likely opened for repair and not properly evacuated. Subcooling appears normal but the pressures are wrong for the conditions.',
    correctAction: 'Recover all refrigerant. Pull a proper vacuum to 500 microns with a decay test. Recharge with fresh refrigerant by weight per nameplate.',
    difficulty: 'advanced',
  },
];

// ─── CHARGING SCENARIOS ─────────────────────────────────

export const CHARGING_SCENARIOS: ChargingScenario[] = [
  {
    id: 'cs-01',
    title: 'TXV System — Charge by Subcooling',
    systemType: '3-ton R-410A split system',
    refrigerant: 'R-410A',
    meteringDevice: 'TXV',
    nameplateCharge: '7 lbs 8 oz (add 0.6 oz per foot of line set over 15 feet)',
    outdoorTemp: 95,
    indoorWetBulb: 63,
    currentReadings: {
      suctionPressure: 105,
      dischargePressure: 360,
      suctionLineTemp: 58,
      liquidLineTemp: 102,
      superheat: 20,
      subcooling: 4,
    },
    targetReadings: { subcooling: 12 },
    diagnosis: 'System is undercharged. Subcooling is 4°F — target is 10-15°F for TXV.',
    correctAction: 'Add R-410A as liquid to the high side (or vapor to the low side of a running system). Add in small increments.',
    amountToAdd: 'Approximately 8-12 oz. Add slowly, wait 15 minutes between additions.',
    steps: [
      'Verify airflow: check filter, blower speed, and supply/return temps',
      'Connect manifold gauges and let system run 15 minutes',
      'Record current readings: suction 105 psig, discharge 360 psig',
      'Calculate current subcooling: sat temp at 360 psig ≈ 106°F, liquid line 102°F → subcooling = 4°F',
      'Target subcooling for this TXV system: 10-15°F (use 12°F)',
      'Connect refrigerant cylinder to center hose, place on scale, tare',
      'Add R-410A as liquid (invert cylinder or use dip tube) to the high side with system OFF, or as vapor to low side with system running',
      'Add 4 oz, wait 15 minutes, recheck subcooling',
      'Repeat until subcooling reaches 10-15°F',
      'Final check: superheat should be 8-15°F, subcooling 10-15°F',
      'Record final readings and amount added on service report',
    ],
  },
  {
    id: 'cs-02',
    title: 'Piston System — Charge by Superheat',
    systemType: '2.5-ton R-410A package unit',
    refrigerant: 'R-410A',
    meteringDevice: 'piston',
    nameplateCharge: '5 lbs 12 oz',
    outdoorTemp: 85,
    indoorWetBulb: 62,
    currentReadings: {
      suctionPressure: 100,
      dischargePressure: 350,
      suctionLineTemp: 65,
      liquidLineTemp: 100,
      superheat: 29,
      subcooling: 5,
    },
    targetReadings: { superheat: 14 },
    diagnosis: 'System is undercharged. Superheat is 29°F — target per charging chart at 85°F outdoor / 62°F wet bulb is approximately 14°F.',
    correctAction: 'Add R-410A to bring superheat down to target. For piston systems, use the manufacturer superheat charging chart.',
    amountToAdd: 'Approximately 10-16 oz. Add slowly.',
    steps: [
      'Verify airflow: check filter, blower, and duct static pressure',
      'Look up target superheat on manufacturer charging chart: outdoor temp 85°F, indoor wet bulb 62°F → target ~14°F',
      'Current superheat: suction sat temp at 100 psig ≈ 36°F, suction line 65°F → 29°F superheat',
      'Need to reduce superheat from 29°F to 14°F by adding refrigerant',
      'Connect R-410A cylinder to center hose, place on scale',
      'Add as vapor to the suction (low) side with system running',
      'Add 4 oz at a time, wait 15 minutes between additions',
      'Recheck superheat after each addition',
      'Stop when superheat reaches the chart target (14°F ± 2°F)',
      'IMPORTANT: Do NOT use subcooling to charge a piston system',
      'Record final readings and total amount added',
    ],
  },
  {
    id: 'cs-03',
    title: 'New Installation — Charge by Weight',
    systemType: '4-ton R-410A split system, 30-foot line set',
    refrigerant: 'R-410A',
    meteringDevice: 'TXV',
    nameplateCharge: '9 lbs 4 oz (factory charge for 15 ft line set) + 0.6 oz per additional foot',
    outdoorTemp: 90,
    indoorWetBulb: 63,
    currentReadings: {
      suctionPressure: 0,
      dischargePressure: 0,
      suctionLineTemp: 0,
      liquidLineTemp: 0,
      superheat: 0,
      subcooling: 0,
    },
    targetReadings: { subcooling: 12 },
    diagnosis: 'New installation. System has factory charge for 15-foot line set. Actual line set is 30 feet — need to add refrigerant for the extra 15 feet.',
    correctAction: 'Calculate additional charge needed: 15 extra feet × 0.6 oz/ft = 9 oz additional. Total charge = factory charge + 9 oz.',
    amountToAdd: '9 oz additional (0.6 oz × 15 extra feet)',
    steps: [
      'Verify line set length: 30 feet total, factory charge covers 15 feet',
      'Calculate additional charge: (30 - 15) × 0.6 oz/ft = 9 oz',
      'After brazing and pressure testing with nitrogen, evacuate to 500 microns',
      'Perform decay test — hold below 500 microns for 10 minutes',
      'Open liquid line valve first to let factory charge flow into the system',
      'Then open suction line valve',
      'Connect R-410A cylinder to center hose, place on scale, tare',
      'Add 9 oz of R-410A as liquid',
      'Start the system and let it run 15+ minutes',
      'Verify subcooling is 10-15°F and superheat is 8-15°F',
      'Fine-tune if needed — add or remove small amounts',
      'Record all readings and total charge on installation paperwork',
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────

export function getExercisesByDifficulty(d: GaugeReadingExercise['difficulty']): GaugeReadingExercise[] {
  return GAUGE_READING_EXERCISES.filter((e) => e.difficulty === d);
}
