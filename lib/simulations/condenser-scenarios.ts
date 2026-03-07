export interface GaugeReading {
  label: string;
  value: string;
  unit: string;
  normal: string;
  icon?: 'pressure' | 'temp' | 'voltage' | 'airflow' | 'amperage';
}

export interface FaultScenario {
  id: string;
  title: string;
  complaint: string;
  symptoms: string[];
  readings: GaugeReading[];
  correctFault: string;
  explanation: string;
  distractors: string[];
  difficulty: 'guided' | 'practice' | 'challenge';
}

export const CONDENSER_SCENARIOS: FaultScenario[] = [
  {
    id: 'cond-001',
    title: 'Condenser Fan Motor Failure',
    complaint: 'The AC runs but doesn\'t cool. The outdoor unit sounds different than usual.',
    symptoms: [
      'Outdoor unit is running — compressor is humming',
      'Condenser fan is NOT spinning',
      'Condenser coil is extremely hot to the touch',
      'High-pressure safety switch has not tripped yet',
    ],
    readings: [
      { label: 'Suction Pressure', value: '85', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '475', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Condenser Fan Voltage', value: '242', unit: 'VAC', normal: '220-250 VAC', icon: 'voltage' },
      { label: 'Condenser Fan Amps', value: '0.0', unit: 'A', normal: '1.2-1.8 A', icon: 'amperage' },
      { label: 'Outdoor Ambient', value: '92', unit: '°F', normal: '85-95 °F', icon: 'temp' },
    ],
    correctFault: 'Failed condenser fan motor — voltage present but zero amperage draw',
    explanation: 'The motor has voltage supplied (242 VAC) but draws zero amps, indicating an open winding. The compressor is running (suction at 85 psig) but discharge pressure is extremely high (475 psig) because there is no airflow across the condenser coil to reject heat.',
    distractors: [
      'Low refrigerant charge causing poor cooling',
      'Dirty condenser coil restricting airflow',
      'Failed compressor — not pumping refrigerant',
      'Bad contactor not sending power to outdoor unit',
    ],
    difficulty: 'guided',
  },
  {
    id: 'cond-002',
    title: 'Restricted Liquid Line',
    complaint: 'AC is blowing air but it\'s barely cool. Electric bill has been high.',
    symptoms: [
      'Outdoor unit running normally — fan and compressor both operating',
      'Supply air temperature is 68°F (should be 55-60°F)',
      'Liquid line is cold/frosted near the metering device',
      'Suction line has light frost near the evaporator',
    ],
    readings: [
      { label: 'Suction Pressure', value: '48', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '190', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '28', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '3', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Liquid Line Temp', value: '52', unit: '°F', normal: '90-110 °F', icon: 'temp' },
    ],
    correctFault: 'Liquid line restriction — pressure drop causing flash gas before the metering device',
    explanation: 'Both pressures are low. Superheat is high (28°F vs 8-14°F normal) because insufficient liquid refrigerant reaches the evaporator. Subcooling is very low (3°F) and the liquid line is abnormally cold/frosted, indicating a restriction.',
    distractors: [
      'Low refrigerant charge — system needs more R-410A',
      'Failed compressor valve — not building pressure',
      'Dirty evaporator coil reducing heat absorption',
      'Oversized system short-cycling',
    ],
    difficulty: 'practice',
  },
  {
    id: 'cond-003',
    title: 'Overcharged System',
    complaint: 'AC cools okay but the compressor keeps shutting off on the high-pressure switch.',
    symptoms: [
      'Compressor cycles on, runs 5-8 minutes, then shuts off',
      'Condenser fan runs continuously',
      'Liquid line feels very warm',
      'System restarts after a few minutes, then trips again',
    ],
    readings: [
      { label: 'Suction Pressure', value: '88', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '425', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '4', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '22', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Compressor Amps', value: '18.5', unit: 'A', normal: '12-15 A', icon: 'amperage' },
    ],
    correctFault: 'System overcharged with refrigerant — excess charge causing high head pressure',
    explanation: 'Both pressures are elevated. Subcooling is very high (22°F vs 8-14°F normal), meaning excess liquid refrigerant is stacking up in the condenser. Superheat is low (4°F), indicating liquid flooding back toward the compressor.',
    distractors: [
      'Condenser fan motor running too slowly',
      'Non-condensables (air) in the system',
      'Failed high-pressure switch — needs replacement',
      'Dirty condenser coil blocking airflow',
    ],
    difficulty: 'challenge',
  },
  {
    id: 'cond-004',
    title: 'Low Refrigerant Charge',
    complaint: 'House won\'t cool below 78°F even though the AC runs all day.',
    symptoms: [
      'System runs continuously — never satisfies the thermostat',
      'Suction line is sweating heavily near the air handler',
      'Supply air is 62°F (should be 55-58°F)',
      'No visible ice on the evaporator coil',
    ],
    readings: [
      { label: 'Suction Pressure', value: '55', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '195', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '22', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '4', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Compressor Amps', value: '10.2', unit: 'A', normal: '12-15 A', icon: 'amperage' },
    ],
    correctFault: 'Low refrigerant charge — system is undercharged, likely a slow leak',
    explanation: 'Both suction and discharge pressures are below normal. High superheat (22°F) means the evaporator is starved of refrigerant. Low subcooling (4°F) confirms insufficient charge. Compressor amps are low because it is not working hard enough. Find and fix the leak before adding refrigerant.',
    distractors: [
      'Dirty air filter restricting airflow across evaporator',
      'Oversized system short-cycling and not dehumidifying',
      'Failed TXV stuck partially closed',
      'Condenser coil dirty — not rejecting heat properly',
    ],
    difficulty: 'guided',
  },
  {
    id: 'cond-005',
    title: 'Dirty Condenser Coil',
    complaint: 'AC worked fine last summer. This year it trips the breaker on hot days.',
    symptoms: [
      'System runs fine in the morning, trips breaker in afternoon heat',
      'Condenser coil is visibly clogged with cottonwood and debris',
      'Condenser fan is spinning at normal speed',
      'Compressor is very hot to the touch',
    ],
    readings: [
      { label: 'Suction Pressure', value: '78', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '395', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '12', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '18', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Compressor Amps', value: '17.8', unit: 'A', normal: '12-15 A', icon: 'amperage' },
    ],
    correctFault: 'Dirty condenser coil — restricted airflow causing high head pressure and compressor overload',
    explanation: 'Discharge pressure is very high (395 psig) because the clogged coil cannot reject heat. Subcooling is elevated (18°F) — liquid is backing up in the condenser. Compressor amps are high (17.8 A) because it is working against excessive head pressure. Clean the coil with coil cleaner and a garden hose.',
    distractors: [
      'Overcharged system — recover some refrigerant',
      'Non-condensables in the system from improper charging',
      'Failed condenser fan capacitor causing slow fan speed',
      'Refrigerant migration during off cycle',
    ],
    difficulty: 'guided',
  },
  {
    id: 'cond-006',
    title: 'Failed Run Capacitor',
    complaint: 'Outdoor unit is humming loudly but not starting. Sometimes it starts if I give it a spin.',
    symptoms: [
      'Compressor hums but does not start — draws locked rotor amps',
      'Condenser fan does not spin on its own but spins freely by hand',
      'System trips the breaker after 30-60 seconds',
      'Capacitor is bulged on top',
    ],
    readings: [
      { label: 'Capacitor Measured', value: '3.2', unit: 'µF', normal: '45 µF ±6%', icon: 'voltage' },
      { label: 'Compressor Amps', value: '28.5', unit: 'A', normal: '12-15 A', icon: 'amperage' },
      { label: 'Fan Motor Amps', value: '0.0', unit: 'A', normal: '1.2-1.8 A', icon: 'amperage' },
      { label: 'Supply Voltage', value: '243', unit: 'VAC', normal: '220-250 VAC', icon: 'voltage' },
      { label: 'Suction Pressure', value: '—', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
    ],
    correctFault: 'Failed dual run capacitor — both compressor and fan motor affected',
    explanation: 'The capacitor reads 3.2 µF against a 45 µF rating — an 93% drop, well outside the ±6% tolerance. A failed capacitor cannot provide the phase-shifted current needed to start and run the motor. The compressor draws locked rotor amps (28.5 A) trying to start, which trips the breaker. Replace the dual run capacitor.',
    distractors: [
      'Failed contactor — not sending power to the unit',
      'Compressor winding failure — needs replacement',
      'Low voltage from the utility — call the power company',
      'Refrigerant migration locking the compressor',
    ],
    difficulty: 'guided',
  },
  {
    id: 'cond-007',
    title: 'Non-Condensables in System',
    complaint: 'System was just recharged by another tech. Now it trips the high-pressure switch.',
    symptoms: [
      'System was recently serviced and refrigerant was added',
      'High-pressure switch trips within 10 minutes of startup',
      'Condenser fan and coil are clean — no airflow restriction',
      'Discharge pressure is high even at mild outdoor temperatures',
    ],
    readings: [
      { label: 'Suction Pressure', value: '72', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '440', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '10', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '14', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Outdoor Ambient', value: '78', unit: '°F', normal: '—', icon: 'temp' },
    ],
    correctFault: 'Non-condensables (air/nitrogen) in the system — introduced during improper service',
    explanation: 'Suction pressure and superheat are normal, but discharge pressure is extremely high (440 psig) at only 78°F outdoor temp. At 78°F, R-410A should condense around 250-280 psig. The excess pressure is from non-condensable gas (air or nitrogen) that does not condense. The system must be recovered, the non-condensables purged, and the system properly evacuated and recharged.',
    distractors: [
      'Overcharged system — recover some refrigerant',
      'Dirty condenser coil blocking airflow',
      'Failed high-pressure switch — replace it',
      'Compressor valve failure causing high discharge',
    ],
    difficulty: 'practice',
  },
  {
    id: 'cond-008',
    title: 'Compressor Valve Failure',
    complaint: 'AC runs all day but barely cools. Compressor is very hot.',
    symptoms: [
      'System runs continuously — never satisfies',
      'Suction line is warm, not cold',
      'Compressor body is extremely hot',
      'Both pressures are equalizing quickly when system shuts off',
    ],
    readings: [
      { label: 'Suction Pressure', value: '115', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '165', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '38', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Subcooling', value: '2', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Compressor Amps', value: '8.1', unit: 'A', normal: '12-15 A', icon: 'amperage' },
    ],
    correctFault: 'Failed compressor discharge valve — refrigerant bypassing back to suction side',
    explanation: 'Suction pressure is very high (115 psig) and discharge pressure is very low (165 psig) — the pressures are nearly equalized while running. This means the compressor is not pumping effectively. Extremely high superheat (38°F) and low subcooling (2°F) confirm the evaporator is starved. Low compressor amps (8.1 A) because it is not doing work. The compressor needs replacement.',
    distractors: [
      'Low refrigerant charge — add more R-410A',
      'Liquid line restriction causing flash gas',
      'Failed TXV stuck open — flooding the compressor',
      'Dirty evaporator coil reducing heat absorption',
    ],
    difficulty: 'challenge',
  },
  {
    id: 'cond-009',
    title: 'Frozen Evaporator Coil',
    complaint: 'AC was working, then stopped blowing cold air. Now there\'s water dripping from the air handler.',
    symptoms: [
      'Evaporator coil is completely frozen — solid block of ice',
      'Little to no airflow from supply vents',
      'System has been running for hours with no cooling',
      'Air filter is extremely dirty and clogged',
    ],
    readings: [
      { label: 'Suction Pressure', value: '28', unit: 'psig', normal: '58-80 psig', icon: 'pressure' },
      { label: 'Discharge Pressure', value: '155', unit: 'psig', normal: '200-350 psig', icon: 'pressure' },
      { label: 'Superheat', value: '2', unit: '°F', normal: '8-14 °F', icon: 'temp' },
      { label: 'Return Air Temp', value: '58', unit: '°F', normal: '70-80 °F', icon: 'temp' },
      { label: 'Supply Air Temp', value: '55', unit: '°F', normal: '55-60 °F', icon: 'temp' },
    ],
    correctFault: 'Frozen evaporator coil caused by severely restricted airflow (dirty filter)',
    explanation: 'The clogged filter starved the evaporator of warm return air. Without enough heat load, the refrigerant boils at a very low temperature, freezing the coil. Suction pressure dropped to 28 psig (below freezing point for R-410A). Superheat is near zero — liquid refrigerant is not fully evaporating. Shut the system off, let it thaw completely (2-4 hours), replace the filter, then restart.',
    distractors: [
      'Low refrigerant charge causing the coil to freeze',
      'Failed blower motor — no airflow',
      'TXV stuck open — flooding the evaporator',
      'Refrigerant overcharge causing liquid floodback',
    ],
    difficulty: 'practice',
  },
  {
    id: 'cond-010',
    title: 'Contactor Failure — Pitted Contacts',
    complaint: 'Thermostat calls for cooling but the outdoor unit never comes on.',
    symptoms: [
      'Indoor air handler blower runs normally',
      'Thermostat is calling — Y terminal has 24V',
      'Outdoor unit is completely silent — no compressor, no fan',
      'Contactor coil is energized (humming) but contacts are not closing',
    ],
    readings: [
      { label: 'Thermostat Y Signal', value: '24', unit: 'VAC', normal: '24-28 VAC', icon: 'voltage' },
      { label: 'Contactor Coil Voltage', value: '24', unit: 'VAC', normal: '24-28 VAC', icon: 'voltage' },
      { label: 'Line Side Voltage', value: '243', unit: 'VAC', normal: '220-250 VAC', icon: 'voltage' },
      { label: 'Load Side Voltage', value: '0', unit: 'VAC', normal: '220-250 VAC', icon: 'voltage' },
      { label: 'Contactor Coil Amps', value: '0.4', unit: 'A', normal: '0.3-0.5 A', icon: 'amperage' },
    ],
    correctFault: 'Failed contactor — pitted contacts not closing despite coil being energized',
    explanation: 'The contactor coil is energized (24 VAC present, coil drawing 0.4 A) but the load side reads 0 VAC — the contacts are not passing power to the compressor and fan. Pitted or welded contacts are the most common contactor failure. Replace the contactor. This is one of the most common service calls in the field.',
    distractors: [
      'Failed thermostat — not sending the Y signal',
      'Tripped breaker — no power to the outdoor unit',
      'Failed compressor — contactor is fine',
      'Low voltage from the transformer — replace the transformer',
    ],
    difficulty: 'guided',
  },
];
