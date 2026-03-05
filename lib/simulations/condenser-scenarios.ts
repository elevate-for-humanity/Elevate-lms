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
];
