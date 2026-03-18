/**
 * EPA 608 Certification Exam Prep
 * Covers Core, Type I, Type II, Type III sections
 * Based on actual EPA 608 exam content areas
 */

export interface EPA608Question {
  id: string;
  section: 'core' | 'type1' | 'type2' | 'type3';
  question: string;
  options: string[];
  answer: number; // 0-based index
  explanation: string;
  examTip?: string;
}

export interface EPA608StudyTopic {
  id: string;
  section: 'core' | 'type1' | 'type2' | 'type3';
  title: string;
  content: string;
  keyFacts: string[];
  examWeight: 'high' | 'medium' | 'low';
}

// ─── STUDY TOPICS ───────────────────────────────────────

export const EPA608_STUDY_TOPICS: EPA608StudyTopic[] = [
  // ── CORE ──
  {
    id: 'core-ozone',
    section: 'core',
    title: 'Ozone Depletion',
    content: 'CFCs and HCFCs destroy stratospheric ozone. Chlorine atoms released from these refrigerants catalytically destroy ozone molecules. One chlorine atom can destroy 100,000 ozone molecules. The ozone layer blocks UV-B radiation which causes skin cancer, cataracts, and crop damage. The Montreal Protocol (1987) phased out CFC production. The Clean Air Act Section 608 regulates refrigerant handling in the US.',
    keyFacts: [
      'CFC = chlorofluorocarbon (R-12, R-11, R-502) — highest ODP, fully phased out',
      'HCFC = hydrochlorofluorocarbon (R-22) — lower ODP, phased out Jan 1 2020 for new production',
      'HFC = hydrofluorocarbon (R-410A, R-134a) — zero ODP but high GWP',
      'Ozone layer is in the stratosphere (10-30 miles up)',
      'UV-B radiation is what ozone blocks',
      'Montreal Protocol is the international treaty; Clean Air Act is US law',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-clean-air-act',
    section: 'core',
    title: 'Clean Air Act Section 608 Regulations',
    content: 'Section 608 makes it illegal to knowingly vent refrigerants. Technicians must be certified to purchase or handle refrigerants. Violations carry fines up to $44,539 per day per violation. Refrigerant must be recovered before opening a system or disposing of equipment. Sales of refrigerant in containers over 2 lbs restricted to certified technicians. Technicians must keep records of refrigerant purchases and usage.',
    keyFacts: [
      'Venting is illegal — fine up to $44,539 per day per violation',
      'De minimis releases during connection/disconnection are permitted',
      'Refrigerant sold in containers > 2 lbs requires EPA 608 certification to purchase',
      'Technicians must recover refrigerant before opening a system for service',
      'Technicians must recover refrigerant before disposing of equipment',
      'Records must be kept for refrigerant purchases',
      'Whistleblowers can receive up to $10,000 for reporting violations',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-refrigeration-cycle',
    section: 'core',
    title: 'Refrigeration Cycle & Heat Transfer',
    content: 'The vapor-compression refrigeration cycle has four stages. Compression: compressor raises pressure and temperature of refrigerant vapor. Condensation: high-pressure hot gas releases heat to outdoor air and condenses to liquid. Expansion: metering device drops pressure, creating cold low-pressure mixture. Evaporation: cold refrigerant absorbs heat from indoor air and evaporates to vapor. Heat always flows from hot to cold. Refrigerant changes state (liquid to vapor and back) to move heat. Latent heat is absorbed during evaporation and released during condensation.',
    keyFacts: [
      'Compressor: low-pressure vapor IN, high-pressure hot gas OUT',
      'Condenser: hot gas IN, warm liquid OUT (rejects heat)',
      'Metering device: warm high-pressure liquid IN, cold low-pressure mix OUT',
      'Evaporator: cold mix IN, low-pressure vapor OUT (absorbs heat)',
      'Heat flows from hot to cold — always',
      'Latent heat = heat absorbed/released during state change (no temperature change)',
      'Sensible heat = heat that changes temperature (no state change)',
      'Superheat = temp above boiling point at current pressure',
      'Subcooling = temp below condensing point at current pressure',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-refrigerant-types',
    section: 'core',
    title: 'Refrigerant Types & Properties',
    content: 'Refrigerants are classified by chemical composition. CFCs (R-12, R-11) have highest ozone depletion potential and are fully phased out. HCFCs (R-22) have lower ODP and are phased out for new production. HFCs (R-410A, R-134a) have zero ODP but high global warming potential. R-410A operates at approximately 60% higher pressure than R-22 — equipment is NOT interchangeable. Refrigerant blends are zeotropic (temperature glide during phase change) or azeotropic (behave like single substance). Never mix refrigerants.',
    keyFacts: [
      'R-12: CFC, ODP=1.0, used in old car AC and refrigerators',
      'R-22: HCFC, ODP=0.05, most common residential AC refrigerant (legacy)',
      'R-410A: HFC, ODP=0, replaced R-22 in new residential systems, higher pressure',
      'R-134a: HFC, ODP=0, automotive AC and medium-temp commercial',
      'R-404A: HFC blend, commercial refrigeration',
      'Never mix different refrigerants — creates unpredictable pressures',
      'R-410A systems require POE (polyolester) oil, not mineral oil',
      'Azeotropic blend: acts like single refrigerant (R-502)',
      'Zeotropic blend: has temperature glide (R-407C, R-410A)',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-recovery-requirements',
    section: 'core',
    title: 'Recovery Requirements',
    content: 'All refrigerant must be recovered before opening a system. Recovery means removing refrigerant and storing it in an external container. Recycling means cleaning refrigerant for reuse (oil separation, moisture removal). Reclamation means reprocessing to ARI 700 purity standard — only done at EPA-certified reclaimers. Recovery equipment must be certified by an EPA-approved testing lab. Equipment manufactured after Nov 15 1993 must meet specific vacuum levels.',
    keyFacts: [
      'Recovery = remove and store in external container',
      'Recycling = clean for reuse (oil and moisture removal)',
      'Reclamation = reprocess to ARI 700 standard (certified facility only)',
      'Recovery equipment must be tested by EPA-approved lab',
      'You must recover before opening ANY system',
      'You must recover before disposing of equipment',
      'Recovered refrigerant can be returned to the same system or same owner without reclamation',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-safety',
    section: 'core',
    title: 'Refrigerant Safety',
    content: 'Refrigerants are heavier than air and displace oxygen in enclosed spaces. Exposure to high concentrations causes oxygen deprivation, cardiac sensitization, and frostbite. Never use oxygen or compressed air to pressurize a system — explosion risk. Use dry nitrogen for pressure testing and leak detection. Refrigerant in contact with open flame produces phosgene gas (toxic). Always use proper ventilation. Self-contained breathing apparatus (SCBA) required in confined spaces with refrigerant leaks.',
    keyFacts: [
      'Refrigerants are heavier than air — accumulate at floor level',
      'Oxygen deprivation is the primary danger in enclosed spaces',
      'Cardiac sensitization: refrigerant exposure + physical exertion = heart arrhythmia',
      'NEVER pressurize with oxygen or compressed air — explosion hazard',
      'Use dry nitrogen for pressure testing',
      'Refrigerant + open flame = phosgene gas (toxic)',
      'Frostbite from liquid refrigerant contact with skin',
      'SCBA required in confined spaces, not just a respirator',
    ],
    examWeight: 'high',
  },
  {
    id: 'core-leak-detection',
    section: 'core',
    title: 'Leak Detection Methods',
    content: 'Leak detection is required when adding refrigerant. Methods: electronic leak detector (most sensitive, halide-specific), ultrasonic detector (listens for escaping gas), UV dye (add to system, use UV light to find leaks), soap bubbles (apply to joints, watch for bubbles), standing pressure test (pressurize with nitrogen, monitor gauge). Leak rate thresholds: commercial refrigeration 20% per year, comfort cooling and all other 10% per year. Systems exceeding leak rate must be repaired within 30 days.',
    keyFacts: [
      'Electronic leak detector: most sensitive method',
      'Standing pressure test with dry nitrogen: most reliable for pinpointing',
      'UV dye: good for finding slow leaks over time',
      'Soap bubbles: quick field check for specific joints',
      'Commercial refrigeration leak rate threshold: 20% annual',
      'Comfort cooling (AC) leak rate threshold: 10% annual',
      'Repair required within 30 days of discovery if over threshold',
      'Never use refrigerant as a leak test gas — illegal venting',
    ],
    examWeight: 'medium',
  },
  {
    id: 'core-three-rs',
    section: 'core',
    title: 'Recovery, Recycling, Reclamation Equipment',
    content: 'Recovery machines pull refrigerant from a system into a recovery cylinder. The machine must achieve required vacuum levels. Recovery cylinders are DOT-rated, painted gray with yellow top. Never fill a recovery cylinder above 80% capacity (liquid expansion risk). Recycling equipment removes oil and moisture from recovered refrigerant. Reclamation is done at an EPA-certified facility to ARI 700 standard. All recovery/recycling equipment must be certified by an EPA-approved testing organization.',
    keyFacts: [
      'Recovery cylinder: gray body, yellow top (DOT standard)',
      'Never fill above 80% capacity — liquid expansion can rupture cylinder',
      'Recovery machine must meet EPA-mandated vacuum levels',
      'Recycling removes oil and non-condensables',
      'Reclamation restores to ARI 700 purity (certified facility)',
      'All equipment must be EPA-approved lab certified',
      'Disposable cylinders (like new refrigerant comes in) must NEVER be refilled',
    ],
    examWeight: 'medium',
  },

  // ── TYPE I (Small Appliances) ──
  {
    id: 'type1-small-appliances',
    section: 'type1',
    title: 'Small Appliance Definitions & Recovery',
    content: 'Small appliances are factory-charged systems with 5 lbs or less of refrigerant. Examples: household refrigerators, freezers, window AC units, PTACs, dehumidifiers, water coolers, vending machines. Recovery requirement: 90% of refrigerant when recovery equipment is operating, or 80% when equipment is not operating (compressor failure). If the system has a known leak, recover whatever is possible. Use a self-contained recovery device — no need for external power to the appliance compressor.',
    keyFacts: [
      'Small appliance = factory-charged, 5 lbs or less refrigerant',
      'Examples: fridge, freezer, window AC, PTAC, dehumidifier, vending machine',
      'Recovery: 90% if compressor works, 80% if compressor does not work',
      'If system has known leak: recover as much as possible',
      'Self-contained recovery device does not need appliance compressor to run',
      'System-dependent recovery uses the appliance compressor (not for non-working units)',
      'Technicians can do their own recovery — no need to send to a facility',
    ],
    examWeight: 'high',
  },
  {
    id: 'type1-disposal',
    section: 'type1',
    title: 'Small Appliance Disposal Requirements',
    content: 'Before disposing of any appliance containing refrigerant, the refrigerant must be recovered. The final person in the disposal chain is responsible for ensuring recovery. Scrap metal recyclers, landfill operators, and appliance retailers accepting trade-ins must verify recovery. A signed statement from the person who recovered the refrigerant is required. Technicians recovering refrigerant from small appliances for disposal must be Section 608 certified.',
    keyFacts: [
      'Refrigerant MUST be recovered before disposal — no exceptions',
      'Last person in disposal chain is responsible',
      'Signed statement required documenting recovery',
      'Scrap yards must verify refrigerant was recovered',
      'Retailers accepting trade-ins must ensure recovery',
      'Venting from small appliances is still illegal',
    ],
    examWeight: 'medium',
  },

  // ── TYPE II (High-Pressure) ──
  {
    id: 'type2-high-pressure',
    section: 'type2',
    title: 'High-Pressure Systems & Recovery Levels',
    content: 'Type II covers high-pressure systems: residential AC, heat pumps, commercial AC, chillers using R-22/R-410A/R-407C. Recovery vacuum levels depend on equipment manufacture date and system charge size. Equipment made BEFORE Nov 15 1993: 0 psig for all systems. Equipment made AFTER Nov 15 1993: systems with less than 200 lbs charge recover to 0 psig; systems with 200 lbs or more recover to 10 inches Hg vacuum. These are MINIMUM requirements.',
    keyFacts: [
      'High-pressure: R-22, R-410A, R-407C, R-134a systems',
      'Pre-Nov 15 1993 equipment: recover to 0 psig regardless of charge',
      'Post-Nov 15 1993, under 200 lbs: recover to 0 psig',
      'Post-Nov 15 1993, 200 lbs or more: recover to 10 inches Hg vacuum',
      'If system has known leak and cannot hold vacuum: recover to 0 psig',
      'Residential split systems and package units are Type II',
      'R-410A operates at ~60% higher pressure than R-22',
    ],
    examWeight: 'high',
  },
  {
    id: 'type2-superheat-subcooling',
    section: 'type2',
    title: 'Superheat & Subcooling Calculations',
    content: 'Superheat measures how much vapor is heated above its boiling point. Subcooling measures how much liquid is cooled below its condensing point. To calculate superheat: read suction pressure, convert to saturation temp using PT chart, measure actual suction line temp, subtract saturation from actual. Superheat = actual suction temp minus saturation temp. To calculate subcooling: read liquid line (high side) pressure, convert to saturation temp, measure actual liquid line temp. Subcooling = saturation temp minus actual liquid line temp.',
    keyFacts: [
      'Superheat = actual suction line temp − saturation temp at suction pressure',
      'Subcooling = saturation temp at liquid line pressure − actual liquid line temp',
      'Normal superheat: 10-15°F (varies by manufacturer and conditions)',
      'Normal subcooling: 10-15°F for TXV systems',
      'High superheat = not enough refrigerant reaching evaporator (low charge, restricted metering device)',
      'Low superheat = too much liquid (overcharge, TXV stuck open) — compressor flood-back risk',
      'High subcooling = too much liquid in condenser (overcharge, restricted liquid line)',
      'Low subcooling = not enough liquid (low charge, condenser airflow problem)',
      'TXV systems: charge by subcooling target',
      'Fixed orifice systems: charge by superheat using manufacturer chart',
    ],
    examWeight: 'high',
  },
  {
    id: 'type2-charging',
    section: 'type2',
    title: 'System Charging Procedures',
    content: 'Before charging, verify proper airflow across both coils. Dirty filter or blocked condenser gives false readings. TXV systems: charge to manufacturer subcooling target (typically 10-15°F). Add refrigerant to liquid line (high side) as liquid. Fixed orifice systems: charge to manufacturer superheat target using outdoor temp and indoor wet bulb on charging chart. Add refrigerant to suction line (low side) as vapor to avoid liquid slugging the compressor. Let system run 15+ minutes before taking readings. R-410A must be charged as liquid (remove from cylinder inverted or use dip tube) because it is a zeotropic blend.',
    keyFacts: [
      'Verify airflow FIRST — dirty filter gives wrong readings',
      'TXV: charge by subcooling (typically 10-15°F target)',
      'Fixed orifice: charge by superheat using manufacturer chart',
      'Add liquid to high side, vapor to low side (running system)',
      'R-410A: always charge as liquid (zeotropic blend fractionates as vapor)',
      'Let system run 15+ minutes before final readings',
      'Weigh refrigerant in — use a scale for accuracy',
      'Never add refrigerant to a system with a known leak without repairing first',
    ],
    examWeight: 'high',
  },
  {
    id: 'type2-vacuum-dehydration',
    section: 'type2',
    title: 'Evacuation & Vacuum Procedures',
    content: 'After opening a system for repair, you must evacuate (pull a vacuum) to remove air and moisture. Moisture in a system combines with refrigerant to form acids that destroy compressor windings and bearings. Use a vacuum pump connected to both high and low side. Pull to 500 microns or below. Close valves and watch for decay — if pressure rises above 500 microns within 10 minutes, there is a leak or moisture. A micron gauge (not a compound gauge) is required for accurate vacuum measurement. Never use the system compressor to pull a vacuum.',
    keyFacts: [
      'Evacuate to 500 microns minimum (lower is better)',
      'Moisture + refrigerant = acid (destroys compressor)',
      'Connect vacuum pump to BOTH high and low side ports',
      'Use a micron gauge — compound gauges cannot read vacuum accurately',
      'Decay test: close valves, wait 10 min, should hold below 500 microns',
      'If vacuum rises: leak or residual moisture — continue pumping or find leak',
      'NEVER use system compressor as vacuum pump',
      'NEVER pressurize with refrigerant to break vacuum — use dry nitrogen first if needed',
      'Triple evacuation: pull vacuum, break with nitrogen, pull vacuum, break with nitrogen, final vacuum',
    ],
    examWeight: 'high',
  },

  // ── TYPE III (Low-Pressure) ──
  {
    id: 'type3-low-pressure',
    section: 'type3',
    title: 'Low-Pressure Systems',
    content: 'Type III covers low-pressure systems using R-11, R-123, and R-113. These are large centrifugal chillers found in commercial buildings. Low-pressure systems operate below atmospheric pressure on the low side, meaning air and moisture leak IN (not refrigerant leaking out). Purge units remove non-condensables (air) from the system. Recovery vacuum levels: pre-Nov 15 1993 equipment to 0 psig; post-Nov 15 1993 equipment with under 200 lbs to 25 inches Hg vacuum; 200 lbs or more to 25 inches Hg vacuum.',
    keyFacts: [
      'Low-pressure refrigerants: R-11, R-123, R-113',
      'Used in large centrifugal chillers (commercial/industrial)',
      'Low side operates BELOW atmospheric pressure — air leaks IN',
      'Purge unit removes air and non-condensables',
      'Post-1993, all sizes: recover to 25 inches Hg vacuum',
      'Water is used as the heat transfer medium in chiller systems',
      'Rupture disc required on recovery vessels',
      'R-123 is the HCFC replacement for R-11',
    ],
    examWeight: 'high',
  },
];

// ─── PRACTICE EXAM QUESTIONS ────────────────────────────

export const EPA608_QUESTIONS: EPA608Question[] = [
  // ── CORE (25 questions) ──
  { id: 'c01', section: 'core', question: 'What does the Montreal Protocol regulate?', options: ['Refrigerant pricing', 'Production of ozone-depleting substances', 'HVAC technician licensing', 'Energy efficiency standards'], answer: 1, explanation: 'The Montreal Protocol (1987) is an international treaty that phased out production of ozone-depleting substances including CFCs and HCFCs.' },
  { id: 'c02', section: 'core', question: 'What is the maximum fine per day per violation for knowingly venting refrigerant?', options: ['$10,000', '$27,500', '$37,500', '$44,539'], answer: 3, explanation: 'The Clean Air Act allows fines up to $44,539 per day per violation for knowingly venting refrigerants.', examTip: 'This number changes with inflation adjustments. The exam uses the current figure.' },
  { id: 'c03', section: 'core', question: 'Which refrigerant type has the highest ozone depletion potential?', options: ['HFC', 'HCFC', 'CFC', 'HFO'], answer: 2, explanation: 'CFCs (chlorofluorocarbons) like R-12 have the highest ODP because they contain the most chlorine and are very stable in the atmosphere.' },
  { id: 'c04', section: 'core', question: 'What layer of the atmosphere does the ozone layer protect?', options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'], answer: 1, explanation: 'The ozone layer is in the stratosphere (10-30 miles up) and blocks harmful UV-B radiation.' },
  { id: 'c05', section: 'core', question: 'Refrigerant in contact with an open flame produces what toxic gas?', options: ['Carbon monoxide', 'Hydrogen sulfide', 'Phosgene', 'Ammonia'], answer: 2, explanation: 'Halogenated refrigerants decompose in the presence of open flame to produce phosgene gas, which is highly toxic.' },
  { id: 'c06', section: 'core', question: 'What is the primary danger of refrigerant leaks in enclosed spaces?', options: ['Fire hazard', 'Oxygen displacement', 'Corrosion', 'Electrical shock'], answer: 1, explanation: 'Refrigerants are heavier than air and displace oxygen. In enclosed spaces this can cause suffocation.' },
  { id: 'c07', section: 'core', question: 'What should NEVER be used to pressurize a refrigeration system for leak testing?', options: ['Dry nitrogen', 'Trace gas with nitrogen', 'Oxygen or compressed air', 'Nitrogen with a trace of refrigerant'], answer: 2, explanation: 'NEVER use oxygen or compressed air — refrigerant oil + oxygen under pressure = explosion risk.' },
  { id: 'c08', section: 'core', question: 'What is the difference between recovery and recycling?', options: ['They are the same thing', 'Recovery removes refrigerant; recycling cleans it for reuse', 'Recycling removes refrigerant; recovery cleans it', 'Recovery is only for CFCs'], answer: 1, explanation: 'Recovery = removing refrigerant and storing in an external container. Recycling = cleaning recovered refrigerant (removing oil, moisture) for reuse.' },
  { id: 'c09', section: 'core', question: 'Reclamation must restore refrigerant to what standard?', options: ['EPA 608', 'ASHRAE 34', 'ARI 700', 'DOT 4BA'], answer: 2, explanation: 'Reclamation reprocesses refrigerant to ARI 700 purity standard. Only EPA-certified reclaimers can perform reclamation.' },
  { id: 'c10', section: 'core', question: 'What color is a recovery cylinder?', options: ['Blue body, white top', 'Gray body, yellow top', 'Green body, gray top', 'Yellow body, gray top'], answer: 1, explanation: 'DOT-rated recovery cylinders are gray body with yellow top. This distinguishes them from new refrigerant cylinders.' },
  { id: 'c11', section: 'core', question: 'What is the maximum fill level for a recovery cylinder?', options: ['60%', '70%', '80%', '90%'], answer: 2, explanation: '80% maximum. Liquid refrigerant expands as temperature rises — overfilling can cause hydrostatic pressure rupture.' },
  { id: 'c12', section: 'core', question: 'What type of oil does R-410A require?', options: ['Mineral oil', 'Alkylbenzene oil', 'Polyolester (POE) oil', 'Paraffin oil'], answer: 2, explanation: 'R-410A requires POE (polyolester) oil. Mineral oil is not miscible with HFC refrigerants.' },
  { id: 'c13', section: 'core', question: 'In the refrigeration cycle, where does the refrigerant absorb heat?', options: ['Compressor', 'Condenser', 'Metering device', 'Evaporator'], answer: 3, explanation: 'The evaporator is where cold refrigerant absorbs heat from indoor air, causing the refrigerant to evaporate from liquid to vapor.' },
  { id: 'c14', section: 'core', question: 'What is latent heat?', options: ['Heat that changes temperature', 'Heat absorbed or released during a state change', 'Heat measured by a thermometer', 'Heat from the compressor motor'], answer: 1, explanation: 'Latent heat is absorbed or released during a phase change (liquid to vapor or vapor to liquid) without changing temperature.' },
  { id: 'c15', section: 'core', question: 'What is superheat?', options: ['Temperature above the boiling point at current pressure', 'Temperature below the condensing point', 'The highest temperature in the system', 'Heat added by the compressor'], answer: 0, explanation: 'Superheat = actual vapor temperature minus the saturation (boiling) temperature at the measured pressure.' },
  { id: 'c16', section: 'core', question: 'R-22 is classified as what type of refrigerant?', options: ['CFC', 'HCFC', 'HFC', 'HFO'], answer: 1, explanation: 'R-22 is an HCFC (hydrochlorofluorocarbon). It has a lower ODP than CFCs but still contains chlorine.' },
  { id: 'c17', section: 'core', question: 'What is the leak rate threshold for comfort cooling (AC) systems?', options: ['5% per year', '10% per year', '20% per year', '35% per year'], answer: 1, explanation: 'Comfort cooling systems have a 10% annual leak rate threshold. If exceeded, repairs must be made within 30 days.' },
  { id: 'c18', section: 'core', question: 'What is the leak rate threshold for commercial refrigeration?', options: ['5% per year', '10% per year', '20% per year', '35% per year'], answer: 2, explanation: 'Commercial refrigeration has a 20% annual leak rate threshold. Higher than comfort cooling because these systems are larger and more complex.' },
  { id: 'c19', section: 'core', question: 'Which leak detection method is the most sensitive?', options: ['Soap bubbles', 'UV dye', 'Electronic leak detector', 'Standing pressure test'], answer: 2, explanation: 'Electronic (halide-specific) leak detectors are the most sensitive method for detecting refrigerant leaks.' },
  { id: 'c20', section: 'core', question: 'Can recovered refrigerant be returned to the same system without reclamation?', options: ['No, it must always be reclaimed', 'Yes, if returned to the same owner\'s equipment', 'Only if it is R-22', 'Only with EPA approval'], answer: 1, explanation: 'Recovered refrigerant can be returned to the same system or same owner\'s equipment without reclamation.' },
  { id: 'c21', section: 'core', question: 'What size refrigerant container requires EPA 608 certification to purchase?', options: ['Any size', 'Over 1 lb', 'Over 2 lbs', 'Over 5 lbs'], answer: 2, explanation: 'Containers holding more than 2 lbs of refrigerant require the buyer to hold EPA 608 certification.' },
  { id: 'c22', section: 'core', question: 'What does a high-pressure cutout switch do?', options: ['Turns on the condenser fan', 'Shuts off the compressor if head pressure is too high', 'Regulates refrigerant flow', 'Controls the defrost cycle'], answer: 1, explanation: 'The high-pressure cutout is a safety device that shuts off the compressor to prevent dangerously high pressures that could rupture components.' },
  { id: 'c23', section: 'core', question: 'What breathing apparatus is required in a confined space with a refrigerant leak?', options: ['Dust mask', 'Half-face respirator', 'Full-face respirator', 'Self-contained breathing apparatus (SCBA)'], answer: 3, explanation: 'SCBA is required because refrigerants displace oxygen. Respirators and masks do not provide oxygen.' },
  { id: 'c24', section: 'core', question: 'What happens when you mix different refrigerants?', options: ['Nothing — they are compatible', 'Improved efficiency', 'Unpredictable pressures and potential system damage', 'Lower operating costs'], answer: 2, explanation: 'Mixing refrigerants creates unpredictable pressures, voids equipment warranties, and makes the refrigerant unidentifiable and unrecoverable to standard.' },
  { id: 'c25', section: 'core', question: 'A whistleblower who reports a refrigerant violation can receive up to how much?', options: ['$1,000', '$5,000', '$10,000', '$25,000'], answer: 2, explanation: 'The EPA can award up to $10,000 to individuals who report violations of refrigerant regulations.' },

  // ── TYPE I (15 questions) ──
  { id: 't1-01', section: 'type1', question: 'What defines a "small appliance" under EPA 608?', options: ['Any appliance under 50 lbs', 'Factory-charged with 5 lbs or less of refrigerant', 'Any household appliance', 'Systems using R-134a only'], answer: 1, explanation: 'A small appliance is factory-charged and contains 5 lbs or less of refrigerant.' },
  { id: 't1-02', section: 'type1', question: 'What is the required recovery efficiency for a small appliance with a working compressor?', options: ['80%', '85%', '90%', '95%'], answer: 2, explanation: '90% recovery is required when the appliance compressor is operational.' },
  { id: 't1-03', section: 'type1', question: 'What is the required recovery efficiency for a small appliance with a non-working compressor?', options: ['70%', '80%', '90%', '95%'], answer: 1, explanation: '80% recovery is required when the compressor is not operational.' },
  { id: 't1-04', section: 'type1', question: 'Which of these is a small appliance?', options: ['Residential split-system AC', 'Walk-in cooler', 'Window air conditioner', 'Rooftop package unit'], answer: 2, explanation: 'Window AC units are factory-charged with 5 lbs or less. Split systems, walk-ins, and rooftop units are Type II.' },
  { id: 't1-05', section: 'type1', question: 'Who is responsible for ensuring refrigerant is recovered before an appliance is scrapped?', options: ['The original owner', 'The manufacturer', 'The last person in the disposal chain', 'The EPA'], answer: 2, explanation: 'The final person in the disposal chain (scrap yard, landfill, recycler) is responsible for verifying recovery.' },
  { id: 't1-06', section: 'type1', question: 'What documentation is required when disposing of an appliance containing refrigerant?', options: ['EPA form 7610', 'A signed statement from the person who recovered the refrigerant', 'A manufacturer recall notice', 'No documentation required'], answer: 1, explanation: 'A signed statement from the technician who recovered the refrigerant is required.' },
  { id: 't1-07', section: 'type1', question: 'What type of recovery device does NOT require the appliance compressor to operate?', options: ['System-dependent', 'Self-contained', 'Passive', 'Gravity-fed'], answer: 1, explanation: 'Self-contained recovery devices have their own compressor and do not need the appliance compressor to function.' },
  { id: 't1-08', section: 'type1', question: 'A system-dependent recovery process uses what to move refrigerant?', options: ['An external recovery machine compressor', 'The appliance\'s own compressor', 'Gravity only', 'Compressed nitrogen'], answer: 1, explanation: 'System-dependent recovery uses the appliance compressor to push refrigerant into the recovery container.' },
  { id: 't1-09', section: 'type1', question: 'Can you refill a disposable refrigerant cylinder?', options: ['Yes, up to 3 times', 'Yes, if you test it first', 'No — it is illegal and dangerous', 'Only with the same refrigerant type'], answer: 2, explanation: 'Refilling disposable cylinders is illegal under DOT regulations and dangerous — they are not designed for repeated pressurization.' },
  { id: 't1-10', section: 'type1', question: 'If a small appliance has a known leak and you cannot recover 80%, what should you do?', options: ['Vent the remainder', 'Recover as much as possible', 'Do not attempt recovery', 'Call the EPA for permission'], answer: 1, explanation: 'If a system has a known leak, recover as much refrigerant as possible. Venting is never permitted.' },
  { id: 't1-11', section: 'type1', question: 'What refrigerant is commonly found in household refrigerators manufactured before 1995?', options: ['R-410A', 'R-22', 'R-12', 'R-134a'], answer: 2, explanation: 'R-12 (CFC) was the standard refrigerant in household refrigerators until the mid-1990s when R-134a replaced it.' },
  { id: 't1-12', section: 'type1', question: 'What is the most common refrigerant in modern household refrigerators?', options: ['R-12', 'R-22', 'R-134a', 'R-410A'], answer: 2, explanation: 'R-134a (HFC) replaced R-12 in household refrigerators. Some newer units use R-600a (isobutane).' },
  { id: 't1-13', section: 'type1', question: 'A PTAC (packaged terminal air conditioner) is classified as what?', options: ['Type II high-pressure', 'Type III low-pressure', 'Type I small appliance', 'Not regulated'], answer: 2, explanation: 'PTACs are factory-charged with 5 lbs or less and are classified as small appliances (Type I).' },
  { id: 't1-14', section: 'type1', question: 'What is the primary environmental concern with R-12?', options: ['Global warming potential', 'Ozone depletion', 'Acid rain', 'Water contamination'], answer: 1, explanation: 'R-12 is a CFC with the highest ozone depletion potential (ODP = 1.0). It was the benchmark for measuring other refrigerants.' },
  { id: 't1-15', section: 'type1', question: 'When recovering from a small appliance, where should you connect?', options: ['Only the high side', 'Only the low side', 'A process tube or service valve', 'The compressor terminals'], answer: 2, explanation: 'Connect to a process tube (pinch-off or Schrader) or service valve. Small appliances typically have a process tube on the compressor.' },

  // ── TYPE II (20 questions) ──
  { id: 't2-01', section: 'type2', question: 'What is the required recovery level for a post-1993 system with less than 200 lbs of high-pressure refrigerant?', options: ['25 inches Hg vacuum', '10 inches Hg vacuum', '0 psig', '4 inches Hg vacuum'], answer: 2, explanation: 'Post-Nov 15 1993 equipment with less than 200 lbs charge: recover to 0 psig.' },
  { id: 't2-02', section: 'type2', question: 'What is the required recovery level for a post-1993 system with 200 lbs or more of high-pressure refrigerant?', options: ['0 psig', '10 inches Hg vacuum', '25 inches Hg vacuum', '500 microns'], answer: 1, explanation: 'Post-Nov 15 1993 equipment with 200 lbs or more: recover to 10 inches Hg vacuum.' },
  { id: 't2-03', section: 'type2', question: 'R-410A operates at approximately what percentage higher pressure than R-22?', options: ['20%', '40%', '60%', '80%'], answer: 2, explanation: 'R-410A operates at approximately 60% higher pressure than R-22. Equipment rated for R-22 cannot be used with R-410A.' },
  { id: 't2-04', section: 'type2', question: 'What is the target vacuum level when evacuating a system after repair?', options: ['0 psig', '10 inches Hg', '500 microns or below', '29.92 inches Hg'], answer: 2, explanation: '500 microns is the industry standard for proper evacuation. This ensures moisture and non-condensables are removed.' },
  { id: 't2-05', section: 'type2', question: 'What instrument is required to accurately measure vacuum during evacuation?', options: ['Compound gauge', 'Manometer', 'Micron gauge', 'Psychrometer'], answer: 2, explanation: 'A micron gauge (digital vacuum gauge) is required. Compound gauges cannot accurately read deep vacuum levels.' },
  { id: 't2-06', section: 'type2', question: 'Suction pressure is 118 psig on an R-410A system. Using the PT chart, the saturation temperature is 40°F. The actual suction line temperature is 52°F. What is the superheat?', options: ['8°F', '10°F', '12°F', '14°F'], answer: 2, explanation: 'Superheat = actual temp (52°F) − saturation temp (40°F) = 12°F.' },
  { id: 't2-07', section: 'type2', question: 'Liquid line pressure is 418 psig on an R-410A system. Saturation temperature is 110°F. Actual liquid line temperature is 98°F. What is the subcooling?', options: ['8°F', '10°F', '12°F', '14°F'], answer: 2, explanation: 'Subcooling = saturation temp (110°F) − actual temp (98°F) = 12°F.' },
  { id: 't2-08', section: 'type2', question: 'A TXV system should be charged by what method?', options: ['Superheat target', 'Subcooling target', 'Sight glass', 'Amp draw'], answer: 1, explanation: 'TXV systems are charged to a subcooling target (typically 10-15°F per manufacturer specs).' },
  { id: 't2-09', section: 'type2', question: 'A fixed orifice (piston) system should be charged by what method?', options: ['Subcooling target', 'Superheat target using manufacturer chart', 'Sight glass', 'Compressor amp draw'], answer: 1, explanation: 'Fixed orifice systems are charged using the manufacturer superheat charging chart based on outdoor temp and indoor wet bulb.' },
  { id: 't2-10', section: 'type2', question: 'Why must R-410A be charged as a liquid?', options: ['It is more efficient', 'It is a zeotropic blend that fractionates when charged as vapor', 'It is too cold as vapor', 'EPA regulation requires it'], answer: 1, explanation: 'R-410A is a near-azeotropic (zeotropic) blend. Charging as vapor causes fractionation — the components separate, changing the refrigerant composition.' },
  { id: 't2-11', section: 'type2', question: 'What should you verify BEFORE connecting gauges and taking readings?', options: ['Compressor amp draw', 'Proper airflow across both coils', 'Refrigerant type', 'Thermostat setpoint'], answer: 1, explanation: 'Verify airflow first. A dirty filter, blocked condenser, or failed blower gives false pressure readings that mimic charge problems.' },
  { id: 't2-12', section: 'type2', question: 'High superheat and low suction pressure typically indicate what?', options: ['Overcharge', 'Undercharge or restricted metering device', 'Dirty condenser', 'Failed compressor'], answer: 1, explanation: 'High superheat + low suction = not enough refrigerant reaching the evaporator. Could be low charge, restricted metering device, or restricted liquid line.' },
  { id: 't2-13', section: 'type2', question: 'Low superheat with normal pressures typically indicates what?', options: ['Low charge', 'Overcharge or TXV stuck open', 'Dirty evaporator', 'Bad compressor'], answer: 1, explanation: 'Low superheat means too much liquid refrigerant reaching the end of the evaporator. Risk of liquid flood-back to compressor.' },
  { id: 't2-14', section: 'type2', question: 'What does a triple evacuation involve?', options: ['Three vacuum pumps', 'Pull vacuum, break with nitrogen, repeat twice, final vacuum', 'Three pressure tests', 'Evacuating three times with refrigerant'], answer: 1, explanation: 'Triple evacuation: vacuum → break with dry nitrogen → vacuum → break with nitrogen → final deep vacuum. Nitrogen absorbs moisture and carries it out.' },
  { id: 't2-15', section: 'type2', question: 'Moisture in a refrigeration system combines with refrigerant to form what?', options: ['Ice only', 'Hydrochloric and hydrofluoric acids', 'Rust', 'Sludge only'], answer: 1, explanation: 'Moisture + refrigerant = acids that attack copper, destroy compressor motor windings, and cause system failure.' },
  { id: 't2-16', section: 'type2', question: 'What is the purpose of a filter-drier in the liquid line?', options: ['Regulate refrigerant flow', 'Remove moisture and contaminants', 'Reduce noise', 'Increase subcooling'], answer: 1, explanation: 'The filter-drier removes moisture (desiccant) and particulate contaminants from the liquid refrigerant.' },
  { id: 't2-17', section: 'type2', question: 'If a system cannot hold a vacuum due to a known leak, what recovery level is required?', options: ['25 inches Hg', '10 inches Hg', '0 psig', 'No recovery needed'], answer: 2, explanation: 'If a system has a known leak and cannot hold vacuum, recover to 0 psig regardless of charge size.' },
  { id: 't2-18', section: 'type2', question: 'What is the saturation temperature of R-410A at 118 psig?', options: ['32°F', '40°F', '45°F', '50°F'], answer: 1, explanation: 'At 118 psig, R-410A has a saturation temperature of approximately 40°F. This is a key PT chart value to memorize.' },
  { id: 't2-19', section: 'type2', question: 'When adding refrigerant to a running system through the suction (low) side, it must be added as what?', options: ['Liquid', 'Vapor', 'Either liquid or vapor', 'Subcooled liquid'], answer: 1, explanation: 'Add as vapor to the low side of a running system. Adding liquid to the low side can cause liquid slugging and destroy the compressor.' },
  { id: 't2-20', section: 'type2', question: 'What is the purpose of the accumulator on a heat pump system?', options: ['Store excess refrigerant', 'Prevent liquid from reaching the compressor', 'Increase system capacity', 'Filter contaminants'], answer: 1, explanation: 'The accumulator sits on the suction line and prevents liquid refrigerant from reaching the compressor, especially during defrost cycles.' },

  // ── TYPE III (10 questions) ──
  { id: 't3-01', section: 'type3', question: 'What type of systems does Type III certification cover?', options: ['Small appliances', 'High-pressure systems', 'Low-pressure systems', 'Motor vehicle AC'], answer: 2, explanation: 'Type III covers low-pressure systems using R-11, R-123, and R-113 — typically large centrifugal chillers.' },
  { id: 't3-02', section: 'type3', question: 'Low-pressure systems operate below atmospheric pressure on the low side. What does this mean for leaks?', options: ['Refrigerant leaks out faster', 'Air and moisture leak INTO the system', 'No leaks are possible', 'Only liquid leaks occur'], answer: 1, explanation: 'Because the low side is below atmospheric pressure, air and moisture are drawn INTO the system rather than refrigerant leaking out.' },
  { id: 't3-03', section: 'type3', question: 'What is the purpose of a purge unit on a low-pressure chiller?', options: ['Add refrigerant', 'Remove air and non-condensables', 'Control water temperature', 'Regulate compressor speed'], answer: 1, explanation: 'The purge unit removes air and non-condensable gases that leak into the low-pressure system.' },
  { id: 't3-04', section: 'type3', question: 'What is the recovery vacuum level for post-1993 low-pressure equipment?', options: ['0 psig', '10 inches Hg vacuum', '25 inches Hg vacuum', '500 microns'], answer: 2, explanation: 'Post-Nov 15 1993 low-pressure equipment: recover to 25 inches Hg vacuum regardless of charge size.' },
  { id: 't3-05', section: 'type3', question: 'R-123 is the replacement for which refrigerant?', options: ['R-22', 'R-12', 'R-11', 'R-502'], answer: 2, explanation: 'R-123 (HCFC) replaced R-11 (CFC) in centrifugal chillers. R-123 has a much lower ODP.' },
  { id: 't3-06', section: 'type3', question: 'What safety device is required on recovery vessels used with low-pressure refrigerants?', options: ['Pressure relief valve only', 'Rupture disc', 'Check valve', 'Fusible plug'], answer: 1, explanation: 'A rupture disc is required on recovery vessels for low-pressure refrigerants to prevent over-pressurization.' },
  { id: 't3-07', section: 'type3', question: 'What is the heat transfer medium in a chiller system?', options: ['Refrigerant', 'Air', 'Water', 'Glycol only'], answer: 2, explanation: 'Chillers cool water (or water/glycol mix) which is then circulated through the building for cooling.' },
  { id: 't3-08', section: 'type3', question: 'Why is a high-efficiency purge unit important on a low-pressure chiller?', options: ['It saves electricity', 'It minimizes refrigerant loss during air removal', 'It increases cooling capacity', 'It reduces noise'], answer: 1, explanation: 'High-efficiency purge units minimize refrigerant loss. Older purge units vented significant refrigerant along with the air they removed.' },
  { id: 't3-09', section: 'type3', question: 'What type of compressor is typically used in low-pressure chiller systems?', options: ['Reciprocating', 'Scroll', 'Centrifugal', 'Rotary'], answer: 2, explanation: 'Large low-pressure chillers use centrifugal compressors, which are designed for high-volume, low-pressure applications.' },
  { id: 't3-10', section: 'type3', question: 'Before opening a low-pressure system for service, what must be done?', options: ['Nothing special', 'Pressurize with nitrogen to find leaks', 'Recover refrigerant to required vacuum level', 'Drain the water side'], answer: 2, explanation: 'Recover refrigerant to the required vacuum level (25 inches Hg for post-1993 equipment) before opening any system.' },
];

// ─── HELPERS ────────────────────────────────────────────

export function getQuestionsBySection(section: EPA608Question['section']): EPA608Question[] {
  return EPA608_QUESTIONS.filter((q) => q.section === section);
}

export function getStudyTopicsBySection(section: EPA608StudyTopic['section']): EPA608StudyTopic[] {
  return EPA608_STUDY_TOPICS.filter((t) => t.section === section);
}

export const EPA608_SECTIONS = [
  { id: 'core' as const, title: 'Core', description: 'Required for all certification types. Covers ozone depletion, Clean Air Act, refrigerant safety, recovery/recycling/reclamation.', questionCount: 25, passingScore: 70 },
  { id: 'type1' as const, title: 'Type I — Small Appliances', description: 'Systems with 5 lbs or less of factory-charged refrigerant. Household refrigerators, freezers, window AC, PTACs.', questionCount: 15, passingScore: 70 },
  { id: 'type2' as const, title: 'Type II — High-Pressure', description: 'Residential and commercial AC, heat pumps, and systems using R-22, R-410A, R-407C. Most common for HVAC technicians.', questionCount: 20, passingScore: 70 },
  { id: 'type3' as const, title: 'Type III — Low-Pressure', description: 'Large centrifugal chillers using R-11, R-123. Commercial and industrial applications.', questionCount: 10, passingScore: 70 },
] as const;

/** Pass all four sections = Universal certification */
export const EPA608_UNIVERSAL_NOTE = 'Pass Core + Type I + Type II + Type III = EPA 608 Universal Certification. Universal is what employers want — it covers all equipment types.';

// ─── QUIZ MAP ADAPTER ───────────────────────────────────
// EPA608Question uses `answer`; QuizPlayer expects `correctAnswer`.
// Use this to convert before inserting into HVAC_QUIZ_MAP.
export interface QuizPlayerQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function toQuizPlayerQuestions(questions: EPA608Question[]): QuizPlayerQuestion[] {
  return questions.map(({ id, question, options, answer, explanation }) => ({
    id,
    question,
    options,
    correctAnswer: answer,
    explanation,
  }));
}

/** All prep questions converted for use in QuizPlayer / HVAC_QUIZ_MAP */
export const EPA608_PREP_CORE = toQuizPlayerQuestions(
  EPA608_QUESTIONS.filter((q) => q.section === 'core'),
);
export const EPA608_PREP_TYPE1 = toQuizPlayerQuestions(
  EPA608_QUESTIONS.filter((q) => q.section === 'type1'),
);
export const EPA608_PREP_TYPE2 = toQuizPlayerQuestions(
  EPA608_QUESTIONS.filter((q) => q.section === 'type2'),
);
export const EPA608_PREP_TYPE3 = toQuizPlayerQuestions(
  EPA608_QUESTIONS.filter((q) => q.section === 'type3'),
);
/** All 71 prep questions as a single bank for universal mock use */
export const EPA608_PREP_ALL = toQuizPlayerQuestions(EPA608_QUESTIONS);
