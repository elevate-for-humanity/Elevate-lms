/**
 * HVAC Course Module Definitions
 * Maps module numbers to metadata, content sections, and video URLs.
 */

export interface ModuleSection {
  title: string
  content: string
  inspect?: string
}

export interface InspectionStep {
  step: string
  detail: string
}

export interface ModuleDef {
  number: number
  title: string
  subtitle: string
  description: string
  videoUrl: string
  sections: ModuleSection[]
  inspectionSteps?: InspectionStep[]
}

const SUPABASE_VIDEO_BASE =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac'

export const MODULES: ModuleDef[] = [
  {
    number: 1,
    title: 'HVAC System Overview',
    subtitle: 'HVAC Fundamentals & Safety',
    description:
      'Learn the major components of a residential air conditioning condenser unit and how technicians inspect them during service calls.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module1-lesson1.mp4`,
    sections: [
      { title: 'Compressor', content: 'The compressor is the heart of the refrigeration cycle. It receives low-pressure, low-temperature refrigerant gas from the indoor evaporator coil and compresses it into high-pressure, high-temperature gas.', inspect: 'Check amperage draw against the nameplate rating. Listen for unusual noises. Measure suction and discharge pressures.' },
      { title: 'Condenser Coil', content: 'Copper tubing with aluminum fins that wraps around the condenser cabinet. Hot refrigerant flows through while outdoor air carries heat away.', inspect: 'Look for bent fins, debris buildup, and corrosion. Clean from inside out with low-pressure water.' },
      { title: 'Fan Motor', content: 'Drives the fan blade that pulls outdoor air across the condenser coil. Without airflow, the system overheats.', inspect: 'Spin blade by hand — should rotate freely. Check capacitor. Measure motor amperage.' },
      { title: 'Capacitor', content: 'Stores electrical energy to start and run motors. The single most common failure point in residential HVAC.', inspect: 'Check for bulging or leaking. Test with multimeter on microfarad setting. Replace if more than 10% below rating.' },
      { title: 'Contactor', content: 'Electromagnetic switch. 24V from thermostat energizes the coil, closing contacts to send 240V to compressor and fan.', inspect: 'Look for pitting, burn marks, or carbon buildup on contact surfaces.' },
      { title: 'Service Valves', content: 'Access ports on refrigerant lines for connecting gauge manifolds. Larger line is suction, smaller is liquid.', inspect: 'Check valve caps are in place. Inspect for oil stains around stems.' },
    ],
    inspectionSteps: [
      { step: 'Visual Inspection', detail: 'Walk around the unit. Look for debris, damage, oil stains on refrigerant lines.' },
      { step: 'Check Airflow', detail: 'With system running, feel for strong warm air at the top grille.' },
      { step: 'Inspect Capacitor', detail: 'Power off. Remove panel. Check for bulging. Test with multimeter.' },
      { step: 'Connect Gauges', detail: 'Connect manifold gauges to service valves. Compare pressures to specs.' },
    ],
  },
  {
    number: 2,
    title: 'Electrical Basics',
    subtitle: 'Voltage, Current, Resistance & Testing',
    description:
      'Understand Ohm\'s Law, read wiring diagrams, operate a multimeter, and test capacitors, contactors, and relays.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module2-lesson1.mp4`,
    sections: [
      { title: 'Voltage, Current & Resistance', content: 'Voltage (V) is electrical pressure measured in volts. Current (I) is the flow of electrons measured in amps. Resistance (R) opposes current flow and is measured in ohms. Ohm\'s Law: V = I × R.' },
      { title: 'Ohm\'s Law Applications', content: 'If a compressor runs on 240V and draws 12 amps, its resistance is 20 ohms (240 ÷ 12). Use Ohm\'s Law to diagnose electrical faults — high resistance means a bad connection or failing component.' },
      { title: 'Wiring Diagrams', content: 'Ladder diagrams show the control circuit (24V) and power circuit (240V) separately. Follow the circuit from L1 through each load to L2. Every switch, relay, and safety device is shown in sequence.' },
      { title: 'Multimeter Operation', content: 'Set the dial to the correct function: VAC for line voltage, VDC for control voltage, ohms for resistance, microfarads for capacitors, amps with a clamp accessory. Always verify the meter is working before testing.' },
      { title: 'Capacitor Testing', content: 'Discharge the capacitor first. Set multimeter to microfarads. Touch probes to terminals. Compare reading to the rated value printed on the capacitor. Replace if more than 10% low.' },
      { title: 'Contactor & Relay Testing', content: 'Check coil resistance with an ohmmeter — should read 10-100 ohms. Check contacts for continuity when energized. Measure voltage on both sides of closed contacts — should be near zero voltage drop.' },
    ],
  },
  {
    number: 3,
    title: 'Heating Systems',
    subtitle: 'Gas Furnaces, Electric Heat & Heat Pumps',
    description:
      'Learn gas furnace operation, ignition systems, electric heat, heat pump heating mode, combustion analysis, and temperature rise measurement.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module3-lesson1.mp4`,
    sections: [
      { title: 'Gas Furnace Operation', content: 'A gas furnace burns natural gas or propane to heat air. The sequence: thermostat calls for heat → inducer motor starts → pressure switch closes → ignitor heats → gas valve opens → burners light → heat exchanger warms → blower starts after a delay.' },
      { title: 'Ignition Systems', content: 'Standing pilot: continuous flame with thermocouple safety. Hot surface ignition (HSI): silicon carbide or silicon nitride element glows to ignite gas. Direct spark ignition (DSI): spark electrode lights the gas directly.' },
      { title: 'Electric Heat', content: 'Electric heat strips (sequencers) provide backup or primary heat. Each strip draws 15-20 amps. Sequencers stage the strips on one at a time to prevent voltage drop. Common in heat pump systems as emergency heat.' },
      { title: 'Heat Pump Heating Mode', content: 'A heat pump reverses the refrigeration cycle using a reversing valve. In heating mode, the outdoor coil becomes the evaporator (absorbs heat from outdoor air) and the indoor coil becomes the condenser (releases heat indoors).' },
      { title: 'Combustion Analysis', content: 'Use a combustion analyzer to measure CO, CO2, O2, and stack temperature in the flue gas. CO must be below 100 ppm air-free. High CO indicates incomplete combustion — check gas pressure, burner alignment, and heat exchanger.' },
      { title: 'Temperature Rise', content: 'Measure supply air temperature minus return air temperature. Compare to the nameplate range (typically 35-65°F). Must be within ±5°F of the nameplate range. Low rise = too much airflow. High rise = not enough airflow.' },
    ],
  },
  {
    number: 4,
    title: 'Cooling & Refrigeration',
    subtitle: 'The Refrigeration Cycle, Superheat & Subcooling',
    description:
      'Master the four stages of the refrigeration cycle, pressure-temperature relationships, superheat and subcooling measurement, and metering devices.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module4-lesson1.mp4`,
    sections: [
      { title: 'The Refrigeration Cycle', content: 'Four stages: (1) Compression — compressor raises pressure and temperature of refrigerant gas. (2) Condensation — hot gas releases heat in the condenser coil and becomes liquid. (3) Expansion — metering device drops pressure, causing a temperature drop. (4) Evaporation — cold liquid absorbs heat in the evaporator and becomes gas.' },
      { title: 'Pressure-Temperature Relationship', content: 'Every refrigerant has a known boiling point at each pressure. A PT chart lists these values. At 68 psig, R-410A boils at 40°F. At 118 psig, R-22 boils at 40°F. Technicians must look up PT values within 5 seconds.' },
      { title: 'Superheat', content: 'Superheat = actual suction line temperature minus the boiling point at suction pressure. It tells you how much the refrigerant has been heated past its boiling point. Target: manufacturer spec ±2°F. High superheat = not enough refrigerant reaching the evaporator.' },
      { title: 'Subcooling', content: 'Subcooling = condensing temperature at discharge pressure minus actual liquid line temperature. It tells you how much the liquid has been cooled below its condensing point. Target: manufacturer spec ±2°F. Low subcooling = low charge.' },
      { title: 'Compressor Types', content: 'Reciprocating: piston-driven, common in residential. Scroll: two spiral plates, quieter and more efficient. Rotary: spinning rotor, used in small systems. Variable speed (inverter): adjusts capacity to match load.' },
      { title: 'Metering Devices', content: 'Fixed orifice (piston): simple, no moving parts, sized for one condition. Thermostatic expansion valve (TXV): adjusts flow based on superheat, maintains consistent evaporator performance. Electronic expansion valve (EEV): computer-controlled, most precise.' },
    ],
  },
  {
    number: 5,
    title: 'EPA 608 Core',
    subtitle: 'Environmental Regulations & Refrigerant Safety',
    description:
      'Study the Clean Air Act Section 608, ozone depletion, refrigerant classifications, recovery/recycling/reclamation, and safety procedures.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module5-lesson1.mp4`,
    sections: [
      { title: 'Ozone Layer & Environmental Impact', content: 'The ozone layer in the stratosphere protects Earth from UV radiation. CFC and HCFC refrigerants release chlorine when they reach the stratosphere, which destroys ozone molecules. One chlorine atom can destroy 100,000 ozone molecules.' },
      { title: 'Clean Air Act Section 608', content: 'Section 608 makes it illegal to knowingly vent refrigerants. Maximum fine: $44,539 per day per violation. All technicians who maintain, service, repair, or dispose of equipment containing refrigerants must be EPA 608 certified.' },
      { title: 'Refrigerant Classifications', content: 'CFC (chlorofluorocarbon): R-11, R-12 — highest ODP, phased out. HCFC (hydrochlorofluorocarbon): R-22 — lower ODP, being phased out. HFC (hydrofluorocarbon): R-410A, R-134a — zero ODP but high GWP. HFO (hydrofluoroolefin): R-1234yf — zero ODP, very low GWP.' },
      { title: 'Recovery, Recycling & Reclamation', content: 'Recovery: removing refrigerant from a system and storing it in a container. Recycling: cleaning recovered refrigerant (oil separation, moisture removal) for reuse in the same or similar equipment. Reclamation: reprocessing to ARI 700 purity standards — can only be done by an EPA-certified reclaimer.' },
      { title: 'Refrigerant Safety', content: 'Store cylinders upright and secured. Never heat with an open flame. Never mix refrigerants. Recovery cylinders are yellow with gray tops. Disposable cylinders cannot be refilled. In confined spaces, refrigerant displaces oxygen — use a ventilator and oxygen monitor.' },
      { title: 'Cylinder Handling', content: 'DOT requires hydrostatic testing every 5 years. Never fill above 80% capacity (liquid expansion can rupture the cylinder). Transport in an upright position. Keep away from heat sources. Check for rust, dents, and damaged valves before use.' },
    ],
  },
  {
    number: 6,
    title: 'EPA 608 Type I & II',
    subtitle: 'Small Appliances & High-Pressure Systems',
    description:
      'Learn Type I small appliance requirements, Type II high-pressure system recovery, evacuation procedures, leak detection, and repair timelines.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module6-lesson1.mp4`,
    sections: [
      { title: 'Type I — Small Appliances', content: 'Covers equipment with less than 5 lbs of refrigerant: window ACs, refrigerators, freezers, PTACs, dehumidifiers. Recovery requirements: 90% for units made after 11/15/1993, 80% for older units, 0 lbs if the compressor is not operational.' },
      { title: 'Type I Recovery Equipment', content: 'Self-contained recovery devices must be EPA-certified. System-dependent recovery uses the appliance\'s own compressor to push refrigerant into a container. If the compressor does not work, use a self-contained device.' },
      { title: 'Type II — High-Pressure Systems', content: 'Covers equipment using high-pressure refrigerants like R-410A, R-22, R-134a, R-404A. Includes residential split systems, rooftop units, chillers, and commercial refrigeration.' },
      { title: 'Evacuation Requirements', content: 'After opening a system for repair, evacuate to 500 microns using a vacuum pump. Hold the vacuum for at least 10 minutes to verify no leaks. If the vacuum rises, there is a leak or moisture in the system.' },
      { title: 'Leak Detection', content: 'Three primary methods: (1) Electronic leak detector — most sensitive, detects halogen gases. (2) UV dye — inject dye, run system, scan with UV light. (3) Soap bubbles — apply solution to joints, watch for bubbles. Always verify with a second method.' },
      { title: 'Leak Repair Timelines', content: 'Comfort cooling (>50 lbs): repair if leak rate exceeds 10% per year within 30 days. Commercial refrigeration (>50 lbs): repair if leak rate exceeds 20% per year within 30 days. Industrial process: repair if exceeds 30%. Verify repair within 30 days.' },
    ],
  },
  {
    number: 7,
    title: 'EPA 608 Type III & Universal Prep',
    subtitle: 'Low-Pressure Systems & Exam Preparation',
    description:
      'Study low-pressure chillers, purge units, Type III recovery requirements, and prepare for the 100-question Universal practice exam.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module7-lesson1.mp4`,
    sections: [
      { title: 'Low-Pressure Systems', content: 'Low-pressure refrigerants (R-11, R-123) operate below atmospheric pressure on the low side. This means air leaks INTO the system rather than refrigerant leaking out. Centrifugal chillers are the most common low-pressure equipment.' },
      { title: 'Centrifugal Chillers', content: 'Large commercial systems that cool water for building HVAC. The evaporator operates in a vacuum. The condenser operates at low positive pressure. Capacity: 100 to 10,000+ tons. Common in hospitals, universities, and large office buildings.' },
      { title: 'Purge Units', content: 'Because low-pressure systems operate below atmospheric pressure, air and moisture leak in. A purge unit continuously removes non-condensables (air) from the system. High-efficiency purge units minimize refrigerant loss during purging.' },
      { title: 'Type III Recovery Requirements', content: 'Less than 200 lbs of refrigerant: recover to 0 psig. 200 lbs or more: recover to 25 mm Hg absolute. Recovery equipment must be tested and certified by an EPA-approved organization.' },
      { title: 'Universal Certification', content: 'Requires passing all four sections: Core, Type I, Type II, and Type III. Each section requires 70% to pass. The proctored exam has 100 questions total (25 per section). Study all recovery requirements, leak rates, and refrigerant classifications.' },
      { title: 'Exam Strategy', content: 'Focus on numbers: recovery percentages, vacuum levels, leak rate thresholds, fine amounts. Know the differences between CFC/HCFC/HFC/HFO. Understand which Type covers which equipment. Practice with timed exams — you need to answer confidently.' },
    ],
  },
  {
    number: 8,
    title: 'Advanced Diagnostics & Installation',
    subtitle: 'Charging, Ductwork, Sizing & Brazing',
    description:
      'Learn refrigerant charging methods, system diagnostics with manifold gauges, ductwork design, equipment sizing, and brazing techniques.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module8-lesson1.mp4`,
    sections: [
      { title: 'Charging by Subcooling', content: 'Used for systems with a TXV. Connect gauges, run system 15 minutes. Read discharge pressure, convert to condensing temperature using PT chart. Measure liquid line temperature. Subcooling = condensing temp minus liquid line temp. Add refrigerant if subcooling is low, recover if high.' },
      { title: 'Charging by Superheat', content: 'Used for systems with a fixed orifice. Read suction pressure, convert to boiling point. Measure suction line temperature. Superheat = suction line temp minus boiling point. Compare to manufacturer target chart based on indoor wet bulb and outdoor dry bulb.' },
      { title: 'Manifold Gauge Diagnostics', content: 'Four common fault patterns: (1) Low suction, low discharge = low charge. (2) High suction, low discharge = bad compressor. (3) Normal suction, high discharge = dirty condenser. (4) Low suction, normal discharge = restricted metering device.' },
      { title: 'Ductwork Design', content: 'Proper ductwork delivers the right amount of air to each room. Total external static pressure should match the equipment rating (typically 0.5 in. w.c.). Measure with a manometer at supply and return plenums. High static = undersized ducts or dirty filter.' },
      { title: 'Equipment Sizing — Manual J', content: 'Manual J calculates the heating and cooling load based on building size, insulation, windows, orientation, and climate. Oversized equipment short-cycles (poor humidity control). Undersized equipment runs constantly and cannot maintain temperature.' },
      { title: 'Brazing', content: 'Silver brazing joins copper refrigerant lines. Flow nitrogen through the lines during brazing to prevent oxidation. After brazing, pressure test with 150 psi dry nitrogen for 24 hours. Any pressure drop indicates a leak — re-braze and retest.' },
    ],
  },
  {
    number: 9,
    title: 'Systematic Troubleshooting',
    subtitle: 'Diagnostic Method & Common Failures',
    description:
      'Master the 6-step troubleshooting method, diagnose common AC and heating failures, and practice timed fault diagnosis.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module9-lesson1.mp4`,
    sections: [
      { title: 'The 6-Step Method', content: 'Step 1: Verify the customer complaint. Step 2: Gather information (age, history, symptoms). Step 3: Analyze the data (temperatures, pressures, electrical readings). Step 4: Isolate the fault to a specific component. Step 5: Repair or replace. Step 6: Verify the fix — run the system and confirm normal operation.' },
      { title: 'Common AC Failures', content: 'Bad capacitor: motor hums but won\'t start. Frozen coil: ice on suction line, low airflow or low charge. Low charge: high superheat, low subcooling, warm air from vents. Dirty condenser: high head pressure, system shuts off on high-pressure safety. Failed compressor: no pumping action, high amp draw, or open windings.' },
      { title: 'Common Heating Failures', content: 'No ignition: bad ignitor, cracked ignitor, or no gas. No flame sense: dirty flame sensor — clean with emery cloth. High limit trips: dirty filter, failed blower motor, or blocked return. Gas valve won\'t open: bad gas valve, no 24V signal, or pressure switch stuck open.' },
      { title: 'Timed Diagnosis Practice', content: 'A competent technician diagnoses common faults within 30 minutes. Practice: (1) Capacitor failure — 10 minutes. (2) Low refrigerant charge — 15 minutes. (3) Dirty condenser coil — 10 minutes. Use the 6-step method every time.' },
      { title: 'Documentation', content: 'Document every service call: customer info, symptoms, measurements taken, diagnosis, parts replaced, and verification. Good documentation protects you legally, helps future technicians, and builds customer trust.' },
      { title: 'When to Call for Help', content: 'Escalate when: you cannot isolate the fault after 30 minutes, the system has unusual piping or controls, there is a suspected refrigerant contamination, or the equipment is under manufacturer warranty.' },
    ],
  },
  {
    number: 10,
    title: 'Certification & Career Readiness',
    subtitle: 'EPA 608 Exam, Credentials & Job Placement',
    description:
      'Prepare for the proctored EPA 608 Universal exam, earn additional certifications (OSHA 10, CPR), build your resume, and prepare for job interviews.',
    videoUrl: `${SUPABASE_VIDEO_BASE}/hvac-module10-lesson1.mp4`,
    sections: [
      { title: 'EPA 608 Proctored Exam', content: 'The proctored exam is administered by ESCO or Mainstream Engineering at Elevate\'s approved testing facility. 100 questions, 25 per section (Core, Type I, II, III). 70% required on each section. Closed book. Results are immediate. Your EPA 608 card arrives by mail in 2-4 weeks.' },
      { title: 'OSHA 10 Certification', content: 'OSHA 10-Hour General Industry Safety certification through CareerSafe online. Covers hazard recognition, fall protection, electrical safety, HazCom, PPE, and fire prevention. Complete online at your own pace. Upload your CareerSafe certificate to advance.' },
      { title: 'CPR/First Aid/AED', content: 'CPR, First Aid, and AED certification through an approved provider. Required for jobsite safety. Covers adult CPR, choking response, wound care, and AED operation. Complete the course and upload your certificate to advance.' },
      { title: 'Resume & Portfolio', content: 'Build a professional resume highlighting: EPA 608 Universal certification, OSHA 10, CPR/First Aid, hands-on lab hours, and any prior experience. Include a skills section listing specific competencies: refrigerant recovery, electrical testing, combustion analysis.' },
      { title: 'Interview Preparation', content: 'Common HVAC interview questions: Describe the refrigeration cycle. How do you diagnose a system that is not cooling? What is your process for a service call? Practice answering clearly and confidently. If unsure, explain how you would find the answer.' },
      { title: 'Job Placement', content: 'Elevate connects graduates with employer partners in the Indianapolis area. Expect entry-level positions: HVAC helper, installation technician, or maintenance technician. Starting pay range: $16-22/hour. With EPA 608 and 1-2 years experience: $22-35/hour.' },
    ],
  },
]
