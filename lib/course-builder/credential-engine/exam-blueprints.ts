/**
 * Exam Blueprints
 * 
 * Detailed exam specifications for each credential.
 * These connect to actual content and generate aligned curriculum.
 */

import { getCredential, type CredentialBlueprint } from './credential-registry';

export interface BlueprintTopic {
  id: string;
  section: string;
  title: string;
  content: string;
  keyFacts: string[];
  examWeight: 'critical' | 'high' | 'medium';
  questionTypes: ('factual' | 'scenario' | 'calculation')[];
}

export interface ExamBlueprint {
  credential: CredentialBlueprint;
  topics: BlueprintTopic[];
  criticalNumbers: Record<string, string>;
  vocabulary: string[];
  practiceAreas: string[];
  labRequirements?: string[];
}

/**
 * EPA 608 Blueprint - Full ESCO-aligned content
 */
export const EPA608_BLUEPRINT: ExamBlueprint = {
  credential: {
    id: 'epa-608-universal',
    slug: 'epa-608-universal',
    name: 'EPA 608 Universal',
    provider: 'ESCO Institute',
    category: 'hvac',
    description: 'EPA Section 608 Technician Certification',
    examSections: [
      { name: 'Core', questions: 25, passingScore: 70, topics: [] },
      { name: 'Type I', questions: 25, passingScore: 70, topics: [] },
      { name: 'Type II', questions: 25, passingScore: 70, topics: [] },
      { name: 'Type III', questions: 25, passingScore: 70, topics: [] },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, closed book, PT chart allowed',
    retakePolicy: 'Retake failed sections immediately',
    referenceDocuments: ['hvac-epa608-prep.json'],
    sosCodes: ['49-9021.00'],
  },
  
  topics: [
    // CORE
    {
      id: 'core-ozone',
      section: 'Core',
      title: 'Ozone Depletion',
      content: 'CFCs and HCFCs destroy stratospheric ozone. Chlorine atoms released from these refrigerants catalytically destroy ozone molecules. One chlorine atom can destroy 100,000 ozone molecules.',
      keyFacts: [
        'CFC = chlorofluorocarbon (R-12, R-11) — highest ODP, phased out',
        'HCFC = hydrochlorofluorocarbon (R-22) — lower ODP, phased out Jan 2020',
        'HFC = hydrofluorocarbon (R-410A, R-134a) — zero ODP',
        'Ozone layer is in the stratosphere',
      ],
      examWeight: 'critical',
      questionTypes: ['factual'],
    },
    {
      id: 'core-gwp',
      section: 'Core',
      title: 'Global Warming Potential',
      content: 'GWP measures heat trapping compared to CO2. R-410A has GWP of 2,088. Lower GWP refrigerants (R-1234yf) are being adopted.',
      keyFacts: [
        'CO2 GWP = 1',
        'R-410A GWP = 2,088',
        'R-134a GWP = 1,430',
        'R-1234yf GWP = 1 (lowest)',
      ],
      examWeight: 'high',
      questionTypes: ['factual'],
    },
    {
      id: 'core-clean-air-act',
      section: 'Core',
      title: 'Clean Air Act Section 608',
      content: 'Section 608 prohibits venting refrigerants and requires EPA 608 certification. Maximum fine: $44,539 per day per violation.',
      keyFacts: [
        'Venting is illegal',
        'Fine: $44,539/day/violation',
        'Must be certified to purchase refrigerant > 2 lbs',
        'Must recover before opening system',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'scenario'],
    },
    {
      id: 'core-refrigerant-types',
      section: 'Core',
      title: 'Refrigerant Classifications',
      content: 'CFCs (R-11, R-12) phased out. HCFCs (R-22) being phased out. HFCs (R-410A, R-134a) widely used. HFOs (R-1234yf) emerging.',
      keyFacts: [
        'CFC: highest ODP, fully phased out',
        'HCFC: lower ODP, Jan 2020 production ended',
        'HFC: zero ODP, high GWP',
        'HFO: zero ODP, very low GWP',
        'R-410A operates at ~60% higher pressure than R-22',
      ],
      examWeight: 'critical',
      questionTypes: ['factual'],
    },
    {
      id: 'core-pressure-temperature',
      section: 'Core',
      title: 'Pressure-Temperature Relationship',
      content: 'Every refrigerant has known boiling point at each pressure. PT charts show this relationship. Must read PT chart quickly on exam.',
      keyFacts: [
        'R-410A at 200 psig ≈ 72°F',
        'R-22 at 70 psig ≈ 40°F',
        'R-134a at 35 psig ≈ 40°F',
        'PT chart is allowed on exam',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'calculation'],
    },
    {
      id: 'core-recovery',
      section: 'Core',
      title: 'Recovery Requirements',
      content: 'Recovery removes refrigerant to container. Recycling cleans for reuse. Reclamation reprocesses to ARI 700 standard (certified facility only).',
      keyFacts: [
        'Recovery = remove and store',
        'Recycling = clean for reuse (field)',
        'Reclamation = ARI 700 standard (facility)',
        'Equipment must be EPA-certified',
      ],
      examWeight: 'critical',
      questionTypes: ['factual'],
    },
    {
      id: 'core-safety',
      section: 'Core',
      title: 'Refrigerant Safety',
      content: 'Refrigerants are heavier than air, displace oxygen. Never use oxygen to pressurize. Use dry nitrogen for pressure testing.',
      keyFacts: [
        'Refrigerants heavier than air',
        'Never pressurize with oxygen',
        'Use dry nitrogen for testing',
        'Refrigerant + flame = phosgene (toxic)',
        'Frostbite risk from liquid contact',
      ],
      examWeight: 'high',
      questionTypes: ['factual', 'scenario'],
    },
    {
      id: 'core-cylinders',
      section: 'Core',
      title: 'Cylinder Handling',
      content: 'Recovery cylinders are yellow with gray collar. Fill max 80% by volume. Hydrostatic test every 5 years.',
      keyFacts: [
        'Yellow = recovery cylinder',
        'Gray collar = EPA certified',
        '80% fill maximum',
        'Test every 5 years',
        'Never heat with torch',
      ],
      examWeight: 'high',
      questionTypes: ['factual'],
    },
    
    // TYPE I
    {
      id: 'type1-small-appliance',
      section: 'Type I',
      title: 'Small Appliance Definition',
      content: 'Small appliances contain ≤5 lbs of refrigerant. Examples: window AC, refrigerator, freezer, dehumidifier, PTAC.',
      keyFacts: [
        '≤5 lbs = Type I',
        'Examples: window AC, refrigerator, freezer',
        'Split systems are NOT small appliances',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'scenario'],
    },
    {
      id: 'type1-recovery-req',
      section: 'Type I',
      title: 'Recovery Requirements',
      content: 'Units made AFTER 11/15/1993: 90% recovery. Units made BEFORE: 80% recovery. Dead compressor: 0 psig.',
      keyFacts: [
        'Newer than 11/15/1993: 90%',
        'Older: 80%',
        'Dead compressor: 0 psig',
        'Self-contained or system-dependent',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'calculation'],
    },
    
    // TYPE II
    {
      id: 'type2-system-class',
      section: 'Type II',
      title: 'High-Pressure Systems',
      content: 'Type II covers high-pressure refrigerants: R-410A, R-22, R-134a, R-404A. Includes residential AC, rooftop units, commercial refrigeration.',
      keyFacts: [
        'R-410A, R-22, R-134a, R-404A = Type II',
        'Residential split systems',
        'Rooftop units',
        'Commercial refrigeration >5 lbs',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'scenario'],
    },
    {
      id: 'type2-vacuum-req',
      section: 'Type II',
      title: 'Evacuation Requirements',
      content: 'Type II recovery: evacuate to 500 microns. This removes non-condensables and moisture.',
      keyFacts: [
        '500 microns = Type II target',
        'Hold vacuum 5+ minutes',
        'Rising vacuum = moisture OR leak',
        'Deep vacuum removes moisture',
      ],
      examWeight: 'critical',
      questionTypes: ['factual'],
    },
    {
      id: 'type2-leak-repair',
      section: 'Type II',
      title: 'Leak Repair Requirements',
      content: 'Comfort cooling (>50 lbs): repair if >30%/year. Commercial refrigeration (>50 lbs): repair if >20%/year. 30-day timeline.',
      keyFacts: [
        'Comfort cooling: 30% leak rate threshold',
        'Commercial refrigeration: 20% leak rate',
        '30-day repair timeline',
        'Verify repair within 30 days',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'calculation', 'scenario'],
    },
    {
      id: 'type2-record-keeping',
      section: 'Type II',
      title: 'Record Keeping',
      content: 'Keep service records for 3 years. Include: date, equipment, refrigerant type, amounts, location.',
      keyFacts: [
        'Record retention: 3 years',
        'Date of service',
        'Equipment type',
        'Refrigerant added/removed',
      ],
      examWeight: 'medium',
      questionTypes: ['factual'],
    },
    
    // TYPE III
    {
      id: 'type3-system-class',
      section: 'Type III',
      title: 'Low-Pressure Systems',
      content: 'Type III covers low-pressure refrigerants: R-11, R-123. Equipment: centrifugal chillers, large commercial systems.',
      keyFacts: [
        'R-11, R-123 = Type III',
        'Centrifugal chillers',
        'Operates below atmospheric pressure',
        'Air leaks IN (opposite of high-pressure)',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'scenario'],
    },
    {
      id: 'type3-vacuum-req',
      section: 'Type III',
      title: 'Recovery Requirements',
      content: '<200 lbs: recover to 0 psig. 200+ lbs: recover to 25 mm Hg absolute. Different from Type II!',
      keyFacts: [
        '<200 lbs: 0 psig',
        '200+ lbs: 25 mm Hg absolute',
        'NOT 500 microns (Type II)',
        '25 mm Hg = 25,000 microns',
      ],
      examWeight: 'critical',
      questionTypes: ['factual', 'calculation'],
    },
    {
      id: 'type3-purge',
      section: 'Type III',
      title: 'Purge Units',
      content: 'Low-pressure systems use purge units to remove non-condensables. Modern units minimize refrigerant loss.',
      keyFacts: [
        'Removes non-condensables (air)',
        'Modern = efficient (reclaims refrigerant)',
        'Old = wastes refrigerant',
      ],
      examWeight: 'medium',
      questionTypes: ['factual'],
    },
  ],
  
  criticalNumbers: {
    finePerDay: '$44,539',
    type1Newer: '90%',
    type1Older: '80%',
    type1DeadComp: '0 psig',
    type2VacuumMicrons: '500',
    type3VacuumMmHg: '25',
    type3LbsThreshold: '200',
    cylinderFillMax: '80%',
    recordRetentionYears: '3',
    leakRateComfort: '30%',
    leakRateCommercial: '20%',
    repairTimelineDays: '30',
  },
  
  vocabulary: [
    'ODP (Ozone Depletion Potential)',
    'GWP (Global Warming Potential)',
    'CFC (Chlorofluorocarbon)',
    'HCFC (Hydrochlorofluorocarbon)',
    'HFC (Hydrofluorocarbon)',
    'HFO (Hydrofluoroolefin)',
    'PT Chart (Pressure-Temperature)',
    'Recovery',
    'Recycling',
    'Reclamation',
    'Superheat',
    'Subcooling',
    'Non-condensables',
    'Bubble point',
    'Dew point',
  ],
  
  practiceAreas: [
    'PT chart reading drills',
    'Recovery percentage calculations',
    'Vacuum level identification',
    'Leak rate calculations',
    'Cylinder identification',
    'Equipment classification (Type I/II/III)',
  ],
  
  labRequirements: [
    'Recovery equipment operation',
    'Manifold gauge reading',
    'PT chart practice',
    'Leak detection methods',
    'Evacuation procedure',
  ],
};

/**
 * Get blueprint for credential
 */
export function getBlueprint(credentialSlug: string): ExamBlueprint | undefined {
  switch (credentialSlug) {
    case 'epa-608-universal':
      return EPA608_BLUEPRINT;
    // Add more blueprints here
    default:
      return undefined;
  }
}

/**
 * Get topics by section
 */
export function getTopicsBySection(blueprint: ExamBlueprint, section: string): BlueprintTopic[] {
  return blueprint.topics.filter(t => t.section === section);
}

/**
 * Get critical topics (examWeight = critical)
 */
export function getCriticalTopics(blueprint: ExamBlueprint): BlueprintTopic[] {
  return blueprint.topics.filter(t => t.examWeight === 'critical');
}

/**
 * Generate topic summary for prompt
 */
export function topicToPrompt(blueprint: ExamBlueprint): string {
  let prompt = '';
  
  for (const section of blueprint.credential.examSections) {
    const sectionTopics = getTopicsBySection(blueprint, section.name);
    prompt += `\n## ${section.name} (${section.questions} questions)\n`;
    
    for (const topic of sectionTopics) {
      prompt += `\n### ${topic.title}\n`;
      prompt += `${topic.content}\n`;
      prompt += `Key facts: ${topic.keyFacts.join('; ')}\n`;
      prompt += `Priority: ${topic.examWeight}\n`;
    }
  }
  
  return prompt;
}
