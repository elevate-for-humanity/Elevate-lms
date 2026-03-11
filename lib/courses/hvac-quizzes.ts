// lib/courses/hvac-quizzes.ts
// EPA 608 + module quiz questions for HVAC Technician course
// Format matches QuizSystem component: { id, question, options, correctAnswer, explanation }

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

// ── EPA 608 Core (25 questions) ─────────────────────────────────────────

export const EPA_608_CORE: QuizQuestion[] = [
  {
    id: "epa-core-01",
    question: "What is the primary purpose of the Clean Air Act Section 608?",
    options: [
      "Regulate indoor air quality in commercial buildings",
      "Minimize the release of ozone-depleting refrigerants",
      "Set energy efficiency standards for HVAC equipment",
      "Establish workplace safety requirements for HVAC technicians"
    ],
    correctAnswer: 1,
    explanation: "Section 608 of the Clean Air Act specifically addresses the release of refrigerants that deplete the stratospheric ozone layer."
  },
  {
    id: "epa-core-02",
    question: "Which refrigerant classification has the highest ozone depletion potential (ODP)?",
    options: ["HFCs", "HFOs", "CFCs", "HCFCs"],
    correctAnswer: 2,
    explanation: "CFCs (chlorofluorocarbons) like R-12 have the highest ODP because they contain chlorine atoms that are very stable and reach the stratosphere."
  },
  {
    id: "epa-core-03",
    question: "It is a violation of federal law to:",
    options: [
      "Recover refrigerant before servicing equipment",
      "Intentionally vent refrigerant to the atmosphere",
      "Use recycled refrigerant in the same system",
      "Charge a system with recovered refrigerant"
    ],
    correctAnswer: 1,
    explanation: "The Clean Air Act prohibits the knowing venting of refrigerants. Violators face fines up to $44,539 per day per violation."
  },
  {
    id: "epa-core-04",
    question: "What does the term 'recovery' mean?",
    options: [
      "Cleaning refrigerant to ARI 700 standards",
      "Removing refrigerant and storing it in an external container without testing or processing",
      "Removing contaminants from used refrigerant",
      "Returning used refrigerant to the manufacturer for reprocessing"
    ],
    correctAnswer: 1,
    explanation: "Recovery means removing refrigerant from a system and storing it in an external container. Recycling cleans it for reuse; reclamation restores it to ARI 700 purity."
  },
  {
    id: "epa-core-05",
    question: "What is the maximum fine per day for knowingly venting refrigerant?",
    options: ["$10,000", "$27,500", "$37,500", "$44,539"],
    correctAnswer: 3,
    explanation: "As of the most recent adjustment, the maximum fine is $44,539 per day per violation under the Clean Air Act."
  },
  {
    id: "epa-core-06",
    question: "R-410A is classified as which type of refrigerant?",
    options: ["CFC", "HCFC", "HFC", "HFO"],
    correctAnswer: 2,
    explanation: "R-410A is an HFC (hydrofluorocarbon). It has zero ODP but does have global warming potential."
  },
  {
    id: "epa-core-07",
    question: "Which refrigerant was commonly used in residential AC systems before the R-22 phase-out?",
    options: ["R-12", "R-134a", "R-22", "R-404A"],
    correctAnswer: 2,
    explanation: "R-22 (an HCFC) was the standard residential AC refrigerant for decades. Production was phased out January 1, 2020."
  },
  {
    id: "epa-core-08",
    question: "What is the relationship between pressure and temperature in a sealed refrigerant container?",
    options: [
      "As temperature increases, pressure decreases",
      "As temperature increases, pressure increases",
      "Pressure and temperature are not related",
      "Pressure remains constant regardless of temperature"
    ],
    correctAnswer: 1,
    explanation: "In a sealed container with liquid and vapor present, pressure and temperature have a direct relationship (pressure-temperature relationship)."
  },
  {
    id: "epa-core-09",
    question: "Refrigerant cylinders should be stored:",
    options: [
      "In direct sunlight to keep them warm",
      "In an upright position in a cool, dry area",
      "On their side to prevent valve damage",
      "Near open flames for easy access"
    ],
    correctAnswer: 1,
    explanation: "Cylinders must be stored upright in cool, dry, ventilated areas away from heat sources. Never expose to temperatures above 125 degrees F."
  },
  {
    id: "epa-core-10",
    question: "What is 'reclamation' of refrigerant?",
    options: [
      "Removing refrigerant from a system into a container",
      "Cleaning refrigerant using oil separation and single or multiple passes through filter-driers",
      "Reprocessing refrigerant to ARI 700 purity standards, equivalent to new product",
      "Returning refrigerant to the same system after minor cleaning"
    ],
    correctAnswer: 2,
    explanation: "Reclamation restores used refrigerant to ARI 700 purity standards (equivalent to virgin refrigerant). Only EPA-certified reclaimers can perform this."
  },
  {
    id: "epa-core-11",
    question: "Which substance depletes the ozone layer?",
    options: ["Carbon dioxide", "Chlorine", "Nitrogen", "Hydrogen"],
    correctAnswer: 1,
    explanation: "Chlorine atoms released from CFC and HCFC molecules catalytically destroy ozone in the stratosphere. One chlorine atom can destroy thousands of ozone molecules."
  },
  {
    id: "epa-core-12",
    question: "What is the ozone layer's primary function?",
    options: [
      "Regulate Earth's temperature",
      "Filter ultraviolet (UV) radiation from the sun",
      "Produce oxygen for breathing",
      "Prevent acid rain"
    ],
    correctAnswer: 1,
    explanation: "The stratospheric ozone layer absorbs most of the sun's harmful UV-B radiation, protecting life on Earth from skin cancer and other damage."
  },
  {
    id: "epa-core-13",
    question: "Technicians must be certified to:",
    options: [
      "Purchase any HVAC equipment",
      "Purchase and handle refrigerants",
      "Install ductwork",
      "Perform electrical work on HVAC systems"
    ],
    correctAnswer: 1,
    explanation: "EPA Section 608 certification is required to purchase refrigerants and to service or dispose of equipment containing refrigerants."
  },
  {
    id: "epa-core-14",
    question: "What does ASHRAE stand for?",
    options: [
      "American Society of Heating, Refrigeration and Air-Conditioning Engineers",
      "Association of Safety and Health Regulations for Air Equipment",
      "American Standard for Heating, Refrigerant and Air Exchange",
      "Allied Society of HVAC and Refrigeration Experts"
    ],
    correctAnswer: 0,
    explanation: "ASHRAE sets standards for refrigerant safety classifications, building ventilation, and HVAC system design."
  },
  {
    id: "epa-core-15",
    question: "Refrigerant exposure in an enclosed area can cause:",
    options: [
      "Only minor skin irritation",
      "Oxygen displacement leading to suffocation",
      "Improved air quality",
      "No health effects at normal concentrations"
    ],
    correctAnswer: 1,
    explanation: "Refrigerants are heavier than air and can displace oxygen in enclosed spaces, leading to suffocation. Always ensure adequate ventilation."
  },
  {
    id: "epa-core-16",
    question: "What is the Montreal Protocol?",
    options: [
      "A US federal law regulating HVAC installations",
      "An international treaty to phase out ozone-depleting substances",
      "An EPA regulation on refrigerant recovery",
      "A standard for HVAC equipment efficiency"
    ],
    correctAnswer: 1,
    explanation: "The Montreal Protocol (1987) is an international treaty that established the phase-out schedule for CFCs, HCFCs, and other ozone-depleting substances."
  },
  {
    id: "epa-core-17",
    question: "R-22 production in the United States was phased out as of:",
    options: ["January 1, 2010", "January 1, 2015", "January 1, 2020", "January 1, 2025"],
    correctAnswer: 2,
    explanation: "R-22 production and import was banned effective January 1, 2020. Only recycled or reclaimed R-22 can be used for servicing existing equipment."
  },
  {
    id: "epa-core-18",
    question: "What color is a recovery cylinder?",
    options: ["Green body with yellow top", "Gray body with yellow top", "Yellow body with gray top", "White body with green top"],
    correctAnswer: 2,
    explanation: "Recovery cylinders are yellow with a gray top. They are designed to hold recovered refrigerant and must meet DOT standards."
  },
  {
    id: "epa-core-19",
    question: "Gauge pressure is measured relative to:",
    options: ["Absolute zero", "Atmospheric pressure", "Vacuum", "The boiling point of water"],
    correctAnswer: 1,
    explanation: "Gauge pressure reads 0 at atmospheric pressure (14.7 psia). Absolute pressure = gauge pressure + atmospheric pressure."
  },
  {
    id: "epa-core-20",
    question: "Which of the following is NOT a sign of refrigerant exposure?",
    options: ["Dizziness", "Nausea", "Frostbite on skin contact", "Improved mental clarity"],
    correctAnswer: 3,
    explanation: "Refrigerant exposure causes dizziness, nausea, headache, and can cause frostbite on skin contact. It impairs mental function, not improves it."
  },
  {
    id: "epa-core-21",
    question: "What must a technician do before opening a system for service?",
    options: [
      "Vent the refrigerant to speed up the process",
      "Recover the refrigerant to the required level",
      "Add nitrogen to the system",
      "Disconnect the electrical supply only"
    ],
    correctAnswer: 1,
    explanation: "Technicians must recover refrigerant to the required vacuum level before opening a system. Venting is illegal."
  },
  {
    id: "epa-core-22",
    question: "Recovery equipment manufactured after November 15, 1993 must be certified by:",
    options: ["OSHA", "EPA", "An EPA-approved equipment testing organization", "The equipment manufacturer"],
    correctAnswer: 2,
    explanation: "Recovery and recycling equipment must be certified by an EPA-approved testing organization (such as UL or ARI) to meet EPA standards."
  },
  {
    id: "epa-core-23",
    question: "What is 'recycling' of refrigerant?",
    options: [
      "Removing refrigerant and storing it without processing",
      "Cleaning refrigerant by oil separation and passing through filter-driers for reuse",
      "Restoring refrigerant to ARI 700 purity standards",
      "Disposing of refrigerant at an approved facility"
    ],
    correctAnswer: 1,
    explanation: "Recycling means cleaning refrigerant using oil separation and single or multiple passes through filter-driers. It can be done on-site."
  },
  {
    id: "epa-core-24",
    question: "Refrigerant sales are restricted to:",
    options: [
      "Anyone over 18 years old",
      "Licensed contractors only",
      "EPA Section 608 certified technicians",
      "HVAC supply house members"
    ],
    correctAnswer: 2,
    explanation: "Since January 1, 2018, refrigerant sales are restricted to EPA Section 608 certified technicians. Sellers must verify certification."
  },
  {
    id: "epa-core-25",
    question: "The four types of EPA Section 608 certification are:",
    options: [
      "Residential, Commercial, Industrial, Universal",
      "Type I, Type II, Type III, Universal",
      "Basic, Intermediate, Advanced, Master",
      "Small, Medium, Large, Universal"
    ],
    correctAnswer: 1,
    explanation: "Type I (small appliances), Type II (high-pressure), Type III (low-pressure), and Universal (all three types combined)."
  },
];


// ── EPA 608 Type I — Small Appliances (25 questions) ────────────────────

export const EPA_608_TYPE_I: QuizQuestion[] = [
  {
    id: "epa-t1-01",
    question: "Type I certification covers systems containing:",
    options: ["More than 50 lbs of refrigerant", "5 lbs or less of refrigerant", "Any amount of high-pressure refrigerant", "Only automotive AC systems"],
    correctAnswer: 1,
    explanation: "Type I covers small appliances — systems manufactured, charged, and hermetically sealed with 5 lbs or less of refrigerant."
  },
  {
    id: "epa-t1-02",
    question: "Which of the following is a small appliance?",
    options: ["A 5-ton rooftop unit", "A household refrigerator", "A centrifugal chiller", "A split-system heat pump"],
    correctAnswer: 1,
    explanation: "Small appliances include household refrigerators, freezers, window AC units, PTACs, dehumidifiers, vending machines, and water coolers."
  },
  {
    id: "epa-t1-03",
    question: "When recovering from a small appliance with an operating compressor, you must recover:",
    options: ["80% of the charge", "90% of the charge", "100% of the charge", "0% — recovery is not required"],
    correctAnswer: 1,
    explanation: "For small appliances with operating compressors, 90% of the refrigerant must be recovered."
  },
  {
    id: "epa-t1-04",
    question: "When recovering from a small appliance with a non-operating compressor, you must recover:",
    options: ["90% of the charge", "80% of the charge", "0 psig", "4 inches Hg vacuum"],
    correctAnswer: 1,
    explanation: "For small appliances with non-operating compressors, 80% of the refrigerant must be recovered."
  },
  {
    id: "epa-t1-05",
    question: "When is 0% recovery allowed from a small appliance?",
    options: ["When the system has a leak", "When the system has leaked to atmospheric pressure", "When the technician is in a hurry", "0% recovery is never allowed"],
    correctAnswer: 1,
    explanation: "If a small appliance has already leaked to atmospheric pressure (0 psig), no additional recovery is required."
  },
  {
    id: "epa-t1-06",
    question: "System-dependent recovery equipment relies on:",
    options: ["Its own compressor", "The appliance's compressor or system pressure", "Gravity only", "External air pressure"],
    correctAnswer: 1,
    explanation: "System-dependent equipment uses the appliance's own compressor or internal pressure to push refrigerant into the recovery vessel."
  },
  {
    id: "epa-t1-07",
    question: "Self-contained recovery equipment has:",
    options: ["No compressor", "Its own compressor to draw refrigerant out", "Only a vacuum pump", "A heating element only"],
    correctAnswer: 1,
    explanation: "Self-contained equipment has its own compressor and can recover refrigerant regardless of whether the appliance's compressor works."
  },
  {
    id: "epa-t1-08",
    question: "A PTAC unit is classified as:",
    options: ["A high-pressure system", "A low-pressure system", "A small appliance", "A commercial refrigeration system"],
    correctAnswer: 2,
    explanation: "Packaged Terminal Air Conditioners (PTACs) are small appliances containing 5 lbs or less of refrigerant."
  },
  {
    id: "epa-t1-09",
    question: "Before disposing of a small appliance, a technician must:",
    options: ["Vent the refrigerant", "Recover the refrigerant", "Only remove the compressor", "No action is required"],
    correctAnswer: 1,
    explanation: "Refrigerant must be recovered from small appliances before disposal."
  },
  {
    id: "epa-t1-10",
    question: "Small appliances are exempt from which requirement?",
    options: ["Recovery requirements", "Leak repair requirements", "Certification requirements", "Venting prohibition"],
    correctAnswer: 1,
    explanation: "Small appliances are exempt from leak repair requirements. Recovery and venting prohibition still apply."
  },
  {
    id: "epa-t1-11",
    question: "What refrigerant is typically in household refrigerators made after 1995?",
    options: ["R-12", "R-22", "R-134a", "R-410A"],
    correctAnswer: 2,
    explanation: "R-134a (an HFC) replaced R-12 (a CFC) in household refrigerators after the CFC phase-out."
  },
  {
    id: "epa-t1-12",
    question: "Recovery cylinders must not be filled beyond:",
    options: ["100% capacity", "90% capacity", "80% capacity", "70% capacity"],
    correctAnswer: 2,
    explanation: "Recovery cylinders must not be filled beyond 80% capacity to allow for thermal expansion."
  },
  {
    id: "epa-t1-13",
    question: "The access point on a sealed system is often a:",
    options: ["Schrader valve", "Process stub or tube", "King valve", "Sight glass"],
    correctAnswer: 1,
    explanation: "Small appliances often have a process stub that must be pierced or accessed with a piercing valve for recovery."
  },
  {
    id: "epa-t1-14",
    question: "R-12 is classified as a:",
    options: ["HFC", "HCFC", "CFC", "HFO"],
    correctAnswer: 2,
    explanation: "R-12 is a CFC with high ozone depletion potential. Production was phased out in 1996."
  },
  {
    id: "epa-t1-15",
    question: "A window air conditioning unit typically contains:",
    options: ["More than 10 lbs", "Between 5 and 15 lbs", "Less than 5 lbs", "No refrigerant"],
    correctAnswer: 2,
    explanation: "Window AC units are small appliances containing less than 5 lbs of refrigerant."
  },
  {
    id: "epa-t1-16",
    question: "If a small appliance compressor will not run, use:",
    options: ["System-dependent active recovery", "Self-contained recovery", "Passive recovery only", "No recovery needed"],
    correctAnswer: 1,
    explanation: "When the compressor won't run, self-contained recovery equipment must be used."
  },
  {
    id: "epa-t1-17",
    question: "Recovered refrigerant can be returned to:",
    options: ["Any system", "The same owner's equipment without recycling", "Only new systems", "Only after reclamation"],
    correctAnswer: 1,
    explanation: "Recovered refrigerant can be returned to the same owner's equipment. Changing ownership requires reclamation."
  },
  {
    id: "epa-t1-18",
    question: "Dehumidifiers are classified as:",
    options: ["High-pressure systems", "Low-pressure systems", "Small appliances", "Commercial equipment"],
    correctAnswer: 2,
    explanation: "Residential dehumidifiers contain less than 5 lbs of refrigerant and are small appliances."
  },
  {
    id: "epa-t1-19",
    question: "A vending machine with built-in refrigeration is:",
    options: ["Not regulated by EPA", "A small appliance", "A commercial system requiring Type II", "Exempt from recovery"],
    correctAnswer: 1,
    explanation: "Vending machines with built-in refrigeration are small appliances."
  },
  {
    id: "epa-t1-20",
    question: "The purpose of a filter-drier in recovery is to:",
    options: ["Increase speed", "Remove moisture and contaminants", "Measure refrigerant amount", "Prevent backflow"],
    correctAnswer: 1,
    explanation: "Filter-driers remove moisture, acid, and particulate contaminants from refrigerant."
  },
  {
    id: "epa-t1-21",
    question: "When recovering from a system with a known leak:",
    options: ["Skip recovery", "Recover as much as possible", "Only recover if more than 50% remains", "Vent the remaining charge"],
    correctAnswer: 1,
    explanation: "Even with a leak, the technician must recover as much refrigerant as possible."
  },
  {
    id: "epa-t1-22",
    question: "EPA 608 certifications:",
    options: ["Expire after 1 year", "Expire after 3 years", "Expire after 5 years", "Do not expire"],
    correctAnswer: 3,
    explanation: "EPA Section 608 certifications do not expire once earned."
  },
  {
    id: "epa-t1-23",
    question: "A piercing valve should be checked for:",
    options: ["Proper color coding", "Leaks before and after use", "Electrical continuity", "Thread compatibility only"],
    correctAnswer: 1,
    explanation: "Piercing valves must be checked for leaks. A leaking valve would release refrigerant."
  },
  {
    id: "epa-t1-24",
    question: "What should be done if a warm appliance needs recovery?",
    options: ["Begin immediately", "Allow it to cool first", "Add more refrigerant", "Vent excess pressure"],
    correctAnswer: 1,
    explanation: "Allowing the system to cool reduces internal pressure, making recovery safer and more efficient."
  },
  {
    id: "epa-t1-25",
    question: "Type I certification allows work on:",
    options: ["All HVAC systems", "Only small appliances with 5 lbs or less", "High-pressure systems", "Low-pressure chillers"],
    correctAnswer: 1,
    explanation: "Type I certification covers only small appliances with 5 lbs or less of refrigerant."
  },
];

// ── EPA 608 Type II — High-Pressure Systems (25 questions) ──────────────

export const EPA_608_TYPE_II: QuizQuestion[] = [
  {
    id: "epa-t2-01",
    question: "Type II certification covers:",
    options: ["Small appliances", "High-pressure systems", "Low-pressure systems", "Motor vehicle AC"],
    correctAnswer: 1,
    explanation: "Type II covers high-pressure equipment such as residential AC, commercial refrigeration, and heat pumps using R-22, R-410A, R-134a, etc."
  },
  {
    id: "epa-t2-02",
    question: "For high-pressure systems containing less than 200 lbs of refrigerant, the required recovery level is:",
    options: ["0 psig", "4 inches Hg vacuum", "10 inches Hg vacuum", "15 inches Hg vacuum"],
    correctAnswer: 0,
    explanation: "Systems with less than 200 lbs must be recovered to 0 psig (atmospheric pressure)."
  },
  {
    id: "epa-t2-03",
    question: "For high-pressure systems containing 200 lbs or more, the required recovery level is:",
    options: ["0 psig", "4 inches Hg vacuum", "10 inches Hg vacuum", "15 inches Hg vacuum"],
    correctAnswer: 2,
    explanation: "Systems with 200 lbs or more must be recovered to 10 inches Hg vacuum."
  },
  {
    id: "epa-t2-04",
    question: "The most accurate instrument for measuring deep vacuum is a:",
    options: ["Compound gauge", "Micron gauge (electronic vacuum gauge)", "Manometer", "Bourdon tube gauge"],
    correctAnswer: 1,
    explanation: "A micron gauge (electronic vacuum gauge) measures vacuum in microns and is the most accurate for deep vacuum measurement."
  },
  {
    id: "epa-t2-05",
    question: "A standing pressure test is used to:",
    options: ["Measure superheat", "Check for leaks in a pressurized system", "Determine subcooling", "Measure airflow"],
    correctAnswer: 1,
    explanation: "A standing pressure test pressurizes the system with dry nitrogen and monitors for pressure drop, indicating a leak."
  },
  {
    id: "epa-t2-06",
    question: "The leak rate that triggers mandatory repair for comfort cooling equipment is:",
    options: ["5% per year", "10% per year", "20% per year", "35% per year"],
    correctAnswer: 1,
    explanation: "Comfort cooling systems (residential/commercial AC) must be repaired if the annual leak rate exceeds 10%."
  },
  {
    id: "epa-t2-07",
    question: "The leak rate that triggers mandatory repair for commercial refrigeration is:",
    options: ["5% per year", "10% per year", "20% per year", "35% per year"],
    correctAnswer: 2,
    explanation: "Commercial refrigeration and industrial process refrigeration must be repaired if the annual leak rate exceeds 20%."
  },
  {
    id: "epa-t2-08",
    question: "After a major repair, a system should be leak-tested with:",
    options: ["Refrigerant", "Dry nitrogen", "Compressed air", "Oxygen"],
    correctAnswer: 1,
    explanation: "Dry nitrogen is used for pressure testing. Never use oxygen or compressed air (moisture and contaminants)."
  },
  {
    id: "epa-t2-09",
    question: "Triple evacuation involves:",
    options: [
      "Three recovery attempts",
      "Pulling vacuum, breaking with nitrogen, repeating three times",
      "Using three vacuum pumps simultaneously",
      "Evacuating three separate circuits"
    ],
    correctAnswer: 1,
    explanation: "Triple evacuation: pull vacuum, break with dry nitrogen, pull vacuum, break with nitrogen, pull final vacuum. Removes moisture effectively."
  },
  {
    id: "epa-t2-10",
    question: "The purpose of evacuation is to:",
    options: ["Remove refrigerant", "Remove air and moisture from the system", "Test for leaks", "Charge the system"],
    correctAnswer: 1,
    explanation: "Evacuation removes air (non-condensables) and moisture from the system before charging with refrigerant."
  },
  {
    id: "epa-t2-11",
    question: "A system should be evacuated to at least:",
    options: ["1000 microns", "500 microns", "250 microns", "It depends on the manufacturer"],
    correctAnswer: 1,
    explanation: "Most manufacturers require evacuation to 500 microns or below. Some require 250 microns."
  },
  {
    id: "epa-t2-12",
    question: "Non-condensable gases in a system cause:",
    options: ["Lower head pressure", "Higher head pressure", "Lower suction pressure", "No effect"],
    correctAnswer: 1,
    explanation: "Non-condensables (air) raise head pressure because they cannot condense and take up space in the condenser."
  },
  {
    id: "epa-t2-13",
    question: "An electronic leak detector should be checked for sensitivity using:",
    options: ["Soap bubbles", "A reference leak (calibrated leak)", "Nitrogen", "UV dye"],
    correctAnswer: 1,
    explanation: "Electronic leak detectors should be calibrated using a reference leak to verify they can detect the minimum leak rate."
  },
  {
    id: "epa-t2-14",
    question: "R-410A operates at approximately what pressure compared to R-22?",
    options: ["Same pressure", "50% higher pressure", "60% higher pressure", "Lower pressure"],
    correctAnswer: 2,
    explanation: "R-410A operates at approximately 60% higher pressure than R-22, requiring different gauges and equipment rated for higher pressures."
  },
  {
    id: "epa-t2-15",
    question: "Superheat is the temperature of refrigerant vapor above its:",
    options: ["Condensing temperature", "Saturation (boiling) temperature", "Ambient temperature", "Subcooling temperature"],
    correctAnswer: 1,
    explanation: "Superheat = actual suction line temperature minus the saturation temperature at suction pressure."
  },
  {
    id: "epa-t2-16",
    question: "Subcooling is the temperature of liquid refrigerant below its:",
    options: ["Evaporating temperature", "Saturation (condensing) temperature", "Ambient temperature", "Superheat temperature"],
    correctAnswer: 1,
    explanation: "Subcooling = saturation temperature at discharge pressure minus the actual liquid line temperature."
  },
  {
    id: "epa-t2-17",
    question: "What causes frost on a suction line?",
    options: ["Overcharge", "Undercharge or restricted airflow", "High ambient temperature", "Dirty condenser"],
    correctAnswer: 1,
    explanation: "Frost on the suction line indicates low superheat, often caused by undercharge, restricted airflow, or a stuck-open TXV."
  },
  {
    id: "epa-t2-18",
    question: "Before using recovery equipment on a different refrigerant, you should:",
    options: [
      "Just connect and start",
      "Change the oil and clean or replace filter-driers to prevent cross-contamination",
      "Only change the hoses",
      "No action needed if using the same equipment"
    ],
    correctAnswer: 1,
    explanation: "Cross-contamination of refrigerants makes them unusable. Equipment must be cleaned between different refrigerant types."
  },
  {
    id: "epa-t2-19",
    question: "A TXV (thermostatic expansion valve) controls:",
    options: ["Compressor speed", "Refrigerant flow into the evaporator", "Condenser fan speed", "System pressure"],
    correctAnswer: 1,
    explanation: "The TXV meters refrigerant flow into the evaporator based on superheat, maintaining optimal evaporator performance."
  },
  {
    id: "epa-t2-20",
    question: "What is the purpose of a sight glass in a refrigeration system?",
    options: [
      "Measure temperature",
      "Indicate liquid refrigerant condition and moisture content",
      "Control refrigerant flow",
      "Filter contaminants"
    ],
    correctAnswer: 1,
    explanation: "A sight glass shows whether liquid refrigerant is present (bubbles indicate low charge) and may have a moisture indicator."
  },
  {
    id: "epa-t2-21",
    question: "When charging R-410A, it must be charged as a:",
    options: ["Vapor only", "Liquid only", "Either vapor or liquid", "Gas at high pressure"],
    correctAnswer: 1,
    explanation: "R-410A is a near-azeotropic blend and must be charged as a liquid to maintain proper composition."
  },
  {
    id: "epa-t2-22",
    question: "Moisture in a refrigeration system can cause:",
    options: ["Higher efficiency", "Acid formation and copper plating", "Lower head pressure", "Faster cooling"],
    correctAnswer: 1,
    explanation: "Moisture reacts with refrigerant and oil to form acids, which cause copper plating, sludge, and compressor failure."
  },
  {
    id: "epa-t2-23",
    question: "The king valve is located on the:",
    options: ["Suction line", "Liquid line at the receiver outlet", "Compressor discharge", "Evaporator inlet"],
    correctAnswer: 1,
    explanation: "The king valve is at the liquid receiver outlet. Closing it allows pump-down of the low side for service."
  },
  {
    id: "epa-t2-24",
    question: "What does a high head pressure and high suction pressure indicate?",
    options: ["Undercharge", "Overcharge or non-condensables", "Restriction in the liquid line", "Low airflow over evaporator"],
    correctAnswer: 1,
    explanation: "Both pressures being high typically indicates overcharge, non-condensable gases, or a dirty/blocked condenser."
  },
  {
    id: "epa-t2-25",
    question: "Leak repair must be completed within how many days for comfort cooling systems?",
    options: ["15 days", "30 days", "45 days", "120 days"],
    correctAnswer: 1,
    explanation: "Comfort cooling systems must have leaks repaired within 30 days of discovery. Extensions may be available with a retrofit/retirement plan."
  },
];

// ── EPA 608 Type III — Low-Pressure Systems (25 questions) ──────────────

export const EPA_608_TYPE_III: QuizQuestion[] = [
  {
    id: "epa-t3-01",
    question: "Type III certification covers:",
    options: ["Small appliances", "High-pressure systems", "Low-pressure systems (chillers)", "Motor vehicle AC"],
    correctAnswer: 2,
    explanation: "Type III covers low-pressure equipment such as centrifugal chillers using R-11, R-123, and similar low-pressure refrigerants."
  },
  {
    id: "epa-t3-02",
    question: "Low-pressure refrigerants operate at pressures:",
    options: ["Above atmospheric at all times", "Below atmospheric pressure during normal operation", "The same as high-pressure systems", "Only above 100 psig"],
    correctAnswer: 1,
    explanation: "Low-pressure systems operate below atmospheric pressure (in vacuum) during normal operation, which means air leaks IN rather than refrigerant leaking out."
  },
  {
    id: "epa-t3-03",
    question: "R-11 boils at approximately what temperature at atmospheric pressure?",
    options: ["−40°F", "−21°F", "32°F", "74.5°F"],
    correctAnswer: 3,
    explanation: "R-11 boils at approximately 74.5°F at atmospheric pressure, which is why these systems operate in vacuum at normal room temperatures."
  },
  {
    id: "epa-t3-04",
    question: "The primary concern with low-pressure systems is:",
    options: ["High-pressure explosions", "Air and moisture leaking INTO the system", "Refrigerant leaking out rapidly", "Electrical hazards"],
    correctAnswer: 1,
    explanation: "Since low-pressure systems operate in vacuum, the main concern is air and moisture leaking into the system rather than refrigerant leaking out."
  },
  {
    id: "epa-t3-05",
    question: "A purge unit on a low-pressure chiller is used to:",
    options: ["Add refrigerant", "Remove non-condensable gases (air) from the system", "Control water temperature", "Regulate compressor speed"],
    correctAnswer: 1,
    explanation: "Purge units automatically remove air and non-condensables that leak into the low-pressure system."
  },
  {
    id: "epa-t3-06",
    question: "For low-pressure systems under 200 lbs, the required recovery level is:",
    options: ["0 psig", "25 inches Hg vacuum", "25 mm Hg absolute", "10 inches Hg vacuum"],
    correctAnswer: 0,
    explanation: "Low-pressure systems under 200 lbs must be recovered to 0 psig."
  },
  {
    id: "epa-t3-07",
    question: "For low-pressure systems 200 lbs or more, the required recovery level is:",
    options: ["0 psig", "25 inches Hg vacuum", "25 mm Hg absolute", "10 inches Hg vacuum"],
    correctAnswer: 2,
    explanation: "Low-pressure systems with 200 lbs or more must be recovered to 25 mm Hg absolute."
  },
  {
    id: "epa-t3-08",
    question: "Water freezing in a low-pressure chiller can cause:",
    options: ["Improved efficiency", "Tube rupture in the evaporator", "Higher refrigerant charge", "Better heat transfer"],
    correctAnswer: 1,
    explanation: "If water freezes in the evaporator tubes, the expanding ice can rupture the tubes, causing a catastrophic refrigerant release."
  },
  {
    id: "epa-t3-09",
    question: "A rupture disc on a low-pressure chiller is designed to:",
    options: ["Regulate pressure", "Release pressure if it exceeds safe limits", "Prevent air from entering", "Control refrigerant flow"],
    correctAnswer: 1,
    explanation: "Rupture discs are safety devices that burst at a predetermined pressure to prevent vessel failure."
  },
  {
    id: "epa-t3-10",
    question: "Hydrolysis in a low-pressure system refers to:",
    options: ["Water reacting with refrigerant to form acids", "Hydrogen gas formation", "Water evaporation", "Oil breakdown from heat"],
    correctAnswer: 0,
    explanation: "Hydrolysis is the chemical reaction between water and refrigerant that produces hydrochloric and hydrofluoric acids, damaging system components."
  },
  {
    id: "epa-t3-11",
    question: "R-123 is the replacement for:",
    options: ["R-22", "R-11", "R-12", "R-502"],
    correctAnswer: 1,
    explanation: "R-123 (an HCFC) replaced R-11 (a CFC) in centrifugal chillers. R-123 has a much lower ODP."
  },
  {
    id: "epa-t3-12",
    question: "A high-efficiency purge unit should have a loss rate of less than:",
    options: ["0.5 lbs per year", "0.1 lbs of refrigerant per pound of air purged", "5% of total charge", "1 lb per day"],
    correctAnswer: 1,
    explanation: "High-efficiency purge units lose less than 0.1 lbs of refrigerant per pound of air removed."
  },
  {
    id: "epa-t3-13",
    question: "Before opening a low-pressure system for service, the technician must:",
    options: ["Pressurize with nitrogen to 10 psig", "Recover refrigerant to required levels", "Drain the water side", "Add oil"],
    correctAnswer: 1,
    explanation: "Refrigerant must be recovered to the required level before opening any system for service."
  },
  {
    id: "epa-t3-14",
    question: "Low-pressure systems should NEVER be pressurized above:",
    options: ["5 psig", "10 psig", "The manufacturer's specified test pressure", "50 psig"],
    correctAnswer: 2,
    explanation: "Never exceed the manufacturer's specified test pressure. Low-pressure vessels are not designed for high pressures."
  },
  {
    id: "epa-t3-15",
    question: "What happens if a low-pressure system is exposed to atmospheric pressure?",
    options: ["Nothing significant", "Air and moisture enter the system", "Refrigerant pressure increases", "The compressor speeds up"],
    correctAnswer: 1,
    explanation: "Since low-pressure systems operate in vacuum, any opening allows air and moisture to enter."
  },
  {
    id: "epa-t3-16",
    question: "Centrifugal compressors in chillers use what type of compression?",
    options: ["Reciprocating pistons", "Rotating scrolls", "Centrifugal force (impeller)", "Screw rotors"],
    correctAnswer: 2,
    explanation: "Centrifugal compressors use a high-speed impeller to accelerate refrigerant vapor, converting velocity to pressure."
  },
  {
    id: "epa-t3-17",
    question: "The leak rate trigger for industrial process refrigeration is:",
    options: ["10%", "20%", "30%", "35%"],
    correctAnswer: 2,
    explanation: "Industrial process refrigeration systems must be repaired if the annual leak rate exceeds 30%."
  },
  {
    id: "epa-t3-18",
    question: "When using nitrogen to pressurize a low-pressure system for leak testing:",
    options: ["Use as much pressure as needed", "Never exceed 10 psig unless manufacturer allows more", "Always use 150 psig", "Nitrogen is not used on low-pressure systems"],
    correctAnswer: 1,
    explanation: "Low-pressure systems should not be pressurized above 10 psig with nitrogen unless the manufacturer specifies a higher test pressure."
  },
  {
    id: "epa-t3-19",
    question: "R-123 has what ASHRAE safety classification?",
    options: ["A1 (low toxicity, no flame)", "B1 (higher toxicity, no flame)", "A2 (low toxicity, low flammability)", "B2 (higher toxicity, low flammability)"],
    correctAnswer: 1,
    explanation: "R-123 is classified B1 — higher toxicity but non-flammable. Machinery rooms with R-123 require refrigerant monitors."
  },
  {
    id: "epa-t3-20",
    question: "A chiller's evaporator operates at what pressure relative to atmosphere?",
    options: ["Above atmospheric", "Below atmospheric (vacuum)", "Exactly atmospheric", "It varies with load"],
    correctAnswer: 1,
    explanation: "Low-pressure chiller evaporators operate below atmospheric pressure (in vacuum) during normal operation."
  },
  {
    id: "epa-t3-21",
    question: "What is the function of the economizer on a centrifugal chiller?",
    options: ["Reduce energy costs", "Flash cool liquid refrigerant to improve efficiency", "Control water flow", "Monitor refrigerant level"],
    correctAnswer: 1,
    explanation: "The economizer flash-cools liquid refrigerant between the condenser and evaporator, improving system efficiency."
  },
  {
    id: "epa-t3-22",
    question: "Excessive purging from a chiller indicates:",
    options: ["Normal operation", "A leak allowing air into the system", "Overcharge of refrigerant", "Low water temperature"],
    correctAnswer: 1,
    explanation: "Frequent purging means air is continuously entering the system through a leak that needs to be found and repaired."
  },
  {
    id: "epa-t3-23",
    question: "The condenser in a low-pressure chiller typically operates:",
    options: ["In deep vacuum", "At or slightly above atmospheric pressure", "At very high pressure", "Below 0 psig always"],
    correctAnswer: 1,
    explanation: "The condenser in a low-pressure system operates at or slightly above atmospheric pressure, unlike the evaporator which is in vacuum."
  },
  {
    id: "epa-t3-24",
    question: "Before recovering refrigerant from a low-pressure system, the technician should:",
    options: ["Heat the refrigerant to increase pressure", "Cool the system to reduce pressure", "Add nitrogen", "Drain the oil first"],
    correctAnswer: 0,
    explanation: "Heating the refrigerant (e.g., raising chilled water temperature) increases pressure above 0 psig, making recovery possible without a vacuum."
  },
  {
    id: "epa-t3-25",
    question: "A machinery room containing R-123 must have:",
    options: ["No special requirements", "A refrigerant monitor/detector and alarm", "Only a fire extinguisher", "Windows for ventilation only"],
    correctAnswer: 1,
    explanation: "Due to R-123's B1 toxicity classification, machinery rooms must have refrigerant monitors, alarms, and mechanical ventilation."
  },
];

// ── Module Quizzes (non-EPA) ────────────────────────────────────────────

export const ORIENTATION_QUIZ: QuizQuestion[] = [
  { id: "q-01-01", question: "How many credentials does the HVAC program include?", options: ["3", "4", "6", "8"], correctAnswer: 2, explanation: "EPA 608, Residential HVAC Cert 1, Residential HVAC Cert 2, OSHA 30, CPR, and Rise Up = 6 credentials." },
  { id: "q-01-02", question: "What is the program delivery model?", options: ["Fully online", "Fully in-person", "Hybrid (online RTI + employer OJT)", "Self-paced only"], correctAnswer: 2, explanation: "The program uses a hybrid model: Related Technical Instruction online via LMS, On-the-Job Training at employer sites." },
  { id: "q-01-03", question: "What funding source covers tuition for eligible students?", options: ["Student loans", "WIOA / Next Level Jobs", "Private scholarships only", "Employer reimbursement only"], correctAnswer: 1, explanation: "WIOA and Next Level Jobs funding covers tuition for eligible participants." },
  { id: "q-01-04", question: "What is the minimum attendance requirement?", options: ["50%", "70%", "80%", "100%"], correctAnswer: 2, explanation: "Students must maintain at least 80% attendance to remain in good standing." },
  { id: "q-01-05", question: "How long is the HVAC program?", options: ["8 weeks", "12 weeks", "16 weeks", "20 weeks"], correctAnswer: 1, explanation: "The HVAC Technician program is 12 weeks of Related Technical Instruction." },
];

export const HVAC_FUNDAMENTALS_QUIZ: QuizQuestion[] = [
  { id: "q-02-01", question: "What are the four main components of a basic refrigeration cycle?", options: ["Compressor, condenser, expansion device, evaporator", "Compressor, filter, blower, thermostat", "Furnace, AC, ductwork, thermostat", "Pump, boiler, radiator, valve"], correctAnswer: 0, explanation: "The refrigeration cycle has four main components: compressor, condenser, expansion (metering) device, and evaporator." },
  { id: "q-02-02", question: "What does HVAC stand for?", options: ["High Voltage Alternating Current", "Heating, Ventilation, and Air Conditioning", "Hydraulic Valve and Compressor", "Heat Vent Air Cooler"], correctAnswer: 1 },
  { id: "q-02-03", question: "A manifold gauge set typically has how many gauges?", options: ["1", "2", "3", "4"], correctAnswer: 1, explanation: "A standard manifold gauge set has a low-side (compound) gauge and a high-side gauge." },
  { id: "q-02-04", question: "What PPE is required when handling refrigerants?", options: ["Hard hat only", "Safety glasses and gloves", "Steel-toed boots only", "No PPE needed"], correctAnswer: 1, explanation: "Safety glasses and gloves are minimum PPE. Refrigerant contact causes frostbite and eye damage." },
  { id: "q-02-05", question: "The evaporator absorbs heat from:", options: ["The outdoor air", "The indoor air (conditioned space)", "The refrigerant", "The compressor"], correctAnswer: 1, explanation: "The evaporator absorbs heat from the indoor air, cooling the conditioned space." },
];

export const ELECTRICAL_BASICS_QUIZ: QuizQuestion[] = [
  { id: "q-03-01", question: "Ohm's Law states that:", options: ["V = I × R", "V = I / R", "V = I + R", "V = R / I"], correctAnswer: 0, explanation: "Voltage (V) = Current (I) × Resistance (R)." },
  { id: "q-03-02", question: "A capacitor in an HVAC system is used to:", options: ["Store refrigerant", "Start or run a motor", "Measure temperature", "Filter air"], correctAnswer: 1, explanation: "Capacitors provide the extra torque needed to start motors (start capacitor) or improve running efficiency (run capacitor)." },
  { id: "q-03-03", question: "What instrument measures electrical resistance?", options: ["Ammeter", "Voltmeter", "Ohmmeter", "Manometer"], correctAnswer: 2, explanation: "An ohmmeter measures resistance in ohms. Most multimeters include this function." },
  { id: "q-03-04", question: "A contactor is an electrically controlled:", options: ["Fuse", "Switch", "Capacitor", "Transformer"], correctAnswer: 1, explanation: "A contactor is a heavy-duty relay (switch) that controls power to the compressor and condenser fan." },
  { id: "q-03-05", question: "Before working on electrical components, you must:", options: ["Wear rubber gloves only", "Disconnect power and verify with a meter (lockout/tagout)", "Just be careful", "Work with one hand only"], correctAnswer: 1, explanation: "Always disconnect power and verify it is off with a meter. Follow lockout/tagout procedures." },
];

export const HEATING_SYSTEMS_QUIZ: QuizQuestion[] = [
  { id: "q-04-01", question: "A gas furnace ignition system that uses a hot surface igniter is called:", options: ["Standing pilot", "Hot surface ignition (HSI)", "Spark ignition", "Electronic ignition"], correctAnswer: 1, explanation: "HSI uses a silicon carbide or silicon nitride element that glows red-hot to ignite the gas." },
  { id: "q-04-02", question: "The heat exchanger in a furnace:", options: ["Mixes combustion gases with supply air", "Separates combustion gases from supply air while transferring heat", "Stores heat for later use", "Controls gas flow"], correctAnswer: 1, explanation: "The heat exchanger transfers heat from combustion gases to the supply air without mixing them. A cracked heat exchanger is dangerous." },
  { id: "q-04-03", question: "A reversing valve in a heat pump:", options: ["Controls refrigerant charge", "Switches the system between heating and cooling modes", "Regulates gas pressure", "Controls blower speed"], correctAnswer: 1, explanation: "The reversing valve changes the direction of refrigerant flow, switching between heating and cooling." },
  { id: "q-04-04", question: "Temperature rise across a furnace should be:", options: ["As high as possible", "Within the manufacturer's specified range", "Exactly 70°F", "Below 20°F"], correctAnswer: 1, explanation: "Temperature rise must fall within the range on the furnace nameplate (typically 35-65°F depending on model)." },
  { id: "q-04-05", question: "CO (carbon monoxide) in flue gases above what level is dangerous?", options: ["0 ppm", "9 ppm", "100 ppm", "400 ppm or above is immediately dangerous"], correctAnswer: 3, explanation: "CO above 400 ppm is immediately dangerous to life and health (IDLH). Any CO above 9 ppm in ambient air requires investigation." },
];

export const COOLING_SYSTEMS_QUIZ: QuizQuestion[] = [
  { id: "q-05-01", question: "Superheat is measured at the:", options: ["Condenser outlet", "Evaporator outlet (suction line)", "Compressor discharge", "Liquid line"], correctAnswer: 1, explanation: "Superheat is measured at the evaporator outlet (suction line) — it's the temperature above saturation at suction pressure." },
  { id: "q-05-02", question: "Subcooling is measured at the:", options: ["Evaporator inlet", "Condenser outlet (liquid line)", "Compressor suction", "Metering device"], correctAnswer: 1, explanation: "Subcooling is measured at the condenser outlet (liquid line) — it's the temperature below saturation at discharge pressure." },
  { id: "q-05-03", question: "High superheat typically indicates:", options: ["Overcharge", "Undercharge or low airflow over evaporator", "Dirty condenser", "Overfeeding TXV"], correctAnswer: 1, explanation: "High superheat means the refrigerant is fully evaporating too early — usually from undercharge or insufficient heat load." },
  { id: "q-05-04", question: "Low superheat typically indicates:", options: ["Undercharge", "Overcharge or restricted airflow", "Normal operation", "Compressor failure"], correctAnswer: 1, explanation: "Low superheat means liquid refrigerant may reach the compressor (flood-back), risking compressor damage." },
  { id: "q-05-05", question: "A TXV controls refrigerant flow based on:", options: ["Discharge pressure", "Suction line superheat", "Ambient temperature", "Compressor amperage"], correctAnswer: 1, explanation: "The TXV sensing bulb monitors suction line temperature and adjusts flow to maintain target superheat." },
];

export const REFRIGERATION_DIAGNOSTICS_QUIZ: QuizQuestion[] = [
  { id: "q-11-01", question: "High head pressure and low suction pressure typically indicate:", options: ["Overcharge", "Undercharge", "Restriction in the liquid line or dirty condenser", "Normal operation"], correctAnswer: 2, explanation: "A restriction traps refrigerant on the high side (high head) and starves the low side (low suction). A dirty condenser also raises head pressure." },
  { id: "q-11-02", question: "The subcooling method of charging is used on systems with:", options: ["Fixed orifice metering", "TXV metering devices", "Capillary tubes", "No metering device"], correctAnswer: 1, explanation: "Systems with TXVs are charged by subcooling. Fixed orifice systems are charged by superheat." },
  { id: "q-11-03", question: "Bubbles in the sight glass indicate:", options: ["Normal operation", "Low refrigerant charge", "Overcharge", "Air in the system"], correctAnswer: 1, explanation: "Bubbles in the liquid line sight glass typically indicate insufficient liquid refrigerant (low charge)." },
  { id: "q-11-04", question: "A vacuum of 500 microns indicates:", options: ["A major leak", "The system is properly dehydrated", "Too much moisture remains", "The vacuum pump is broken"], correctAnswer: 1, explanation: "500 microns is the standard target for evacuation, indicating adequate moisture removal." },
  { id: "q-11-05", question: "Non-condensable gases in a system cause:", options: ["Lower head pressure", "Higher head pressure than normal", "Lower suction pressure", "No measurable effect"], correctAnswer: 1, explanation: "Non-condensables (air, nitrogen) raise head pressure because they cannot condense and occupy space in the condenser." },
];

export const INSTALLATION_QUIZ: QuizQuestion[] = [
  { id: "q-12-01", question: "Manual J is used to calculate:", options: ["Duct sizing", "Heat load (equipment sizing)", "Refrigerant charge", "Electrical load"], correctAnswer: 1, explanation: "Manual J calculates the heating and cooling load of a building to determine proper equipment size." },
  { id: "q-12-02", question: "When brazing copper tubing, nitrogen should flow through the tubing to:", options: ["Cool the joint", "Prevent oxidation inside the tubing", "Test for leaks", "Increase pressure"], correctAnswer: 1, explanation: "Flowing dry nitrogen prevents copper oxide scale from forming inside the tubing during brazing." },
  { id: "q-12-03", question: "A flare fitting requires:", options: ["Brazing", "A properly flared tube end", "Soldering", "Press-fit connection"], correctAnswer: 1, explanation: "Flare fittings use a flared tube end compressed against a fitting with a flare nut. No heat required." },
  { id: "q-12-04", question: "Static pressure in ductwork is measured in:", options: ["PSI", "Inches of water column (in. w.c.)", "Microns", "CFM"], correctAnswer: 1, explanation: "Duct static pressure is measured in inches of water column using a manometer." },
  { id: "q-12-05", question: "Before starting a newly installed system, the technician should:", options: ["Immediately turn it on", "Verify charge, check electrical connections, verify airflow, and leak test", "Only check the thermostat", "Run it for 5 minutes and walk away"], correctAnswer: 1, explanation: "A complete pre-startup checklist includes verifying charge, electrical, airflow, leak testing, and performance verification." },
];

export const TROUBLESHOOTING_QUIZ: QuizQuestion[] = [
  { id: "q-13-01", question: "The first step in systematic troubleshooting is:", options: ["Replace the most common failed part", "Verify the customer complaint", "Check refrigerant charge", "Call for help"], correctAnswer: 1, explanation: "Always verify the complaint first. Then gather data, isolate the problem, test, repair, and verify the fix." },
  { id: "q-13-02", question: "A bad run capacitor on a compressor will cause:", options: ["No effect", "Higher amperage draw and possible overheating", "Lower refrigerant pressure", "Louder operation only"], correctAnswer: 1, explanation: "A weak or failed run capacitor causes the compressor to draw excessive amps, overheat, and potentially trip on overload." },
  { id: "q-13-03", question: "A frozen evaporator coil is most commonly caused by:", options: ["Overcharge", "Low airflow or low refrigerant charge", "High ambient temperature", "Dirty condenser"], correctAnswer: 1, explanation: "Low airflow (dirty filter, closed registers) or low charge causes the coil temperature to drop below freezing." },
  { id: "q-13-04", question: "If a furnace igniter glows but gas does not ignite:", options: ["Replace the igniter", "Check the gas valve and gas supply", "Replace the thermostat", "Clean the filter"], correctAnswer: 1, explanation: "If the igniter works but gas doesn't flow, check the gas valve, gas pressure, and gas supply." },
  { id: "q-13-05", question: "When explaining a repair to a homeowner, you should:", options: ["Use as much technical jargon as possible", "Explain the problem and solution in simple terms", "Just hand them the invoice", "Tell them to Google it"], correctAnswer: 1, explanation: "Professional communication means explaining problems and solutions clearly without unnecessary jargon." },
];

export const OSHA_30_QUIZ: QuizQuestion[] = [
  { id: "q-14-01", question: "OSHA stands for:", options: ["Occupational Safety and Health Administration", "Office of Safety and Hazard Assessment", "Organization for Safe HVAC Applications", "Operational Standards for Heating and Air"], correctAnswer: 0 },
  { id: "q-14-02", question: "Fall protection is required at heights of:", options: ["4 feet (general industry) or 6 feet (construction)", "10 feet", "15 feet", "20 feet"], correctAnswer: 0, explanation: "General industry: 4 feet. Construction: 6 feet. Always use fall protection at or above these heights." },
  { id: "q-14-03", question: "Lockout/tagout (LOTO) is used to:", options: ["Lock doors", "Ensure equipment is de-energized before service", "Tag inventory", "Lock refrigerant cylinders"], correctAnswer: 1, explanation: "LOTO ensures hazardous energy sources are isolated and locked out before maintenance or service work." },
  { id: "q-14-04", question: "A Safety Data Sheet (SDS) provides information about:", options: ["Equipment warranties", "Chemical hazards, handling, and emergency procedures", "Building codes", "Insurance requirements"], correctAnswer: 1, explanation: "SDS (formerly MSDS) contains hazard information, safe handling procedures, first aid, and emergency response for chemicals." },
  { id: "q-14-05", question: "Workers have the right to:", options: ["Refuse all work", "A safe workplace and to report hazards without retaliation", "Set their own safety rules", "Ignore OSHA standards"], correctAnswer: 1, explanation: "OSHA guarantees workers the right to a safe workplace and protection from retaliation for reporting hazards." },
  { id: "q-14-06", question: "A confined space requires:", options: ["No special precautions", "Atmospheric testing, a permit, and a standby person", "Only a flashlight", "Just verbal warning"], correctAnswer: 1, explanation: "Permit-required confined spaces need atmospheric testing, entry permits, attendants, and rescue plans." },
  { id: "q-14-07", question: "The correct fire extinguisher for an electrical fire is:", options: ["Type A (water)", "Type B (flammable liquids)", "Type C (electrical) or ABC", "Type D (metals)"], correctAnswer: 2, explanation: "Class C extinguishers are rated for electrical fires. ABC extinguishers cover all common fire types." },
  { id: "q-14-08", question: "GHS labels on chemical containers must include:", options: ["Only the product name", "Hazard pictograms, signal word, hazard statements, and precautionary statements", "Just a skull and crossbones", "The manufacturer's phone number only"], correctAnswer: 1, explanation: "GHS labels require pictograms, signal words (Danger/Warning), hazard statements, precautionary statements, and supplier info." },
];

// ── Master Quiz Map ─────────────────────────────────────────────────────
// Maps lesson IDs from definitions.ts to their quiz question arrays

import {
  QUIZ_01_01, QUIZ_01_02, QUIZ_01_03,
  QUIZ_02_01, QUIZ_02_02, QUIZ_02_03, QUIZ_02_04,
  QUIZ_03_01, QUIZ_03_02, QUIZ_03_03, QUIZ_03_04,
  QUIZ_04_01, QUIZ_04_02, QUIZ_04_03, QUIZ_04_04, QUIZ_04_05,
  QUIZ_05_01, QUIZ_05_02, QUIZ_05_03, QUIZ_05_04, QUIZ_05_05, QUIZ_05_06,
  QUIZ_06_01, QUIZ_06_02, QUIZ_06_03, QUIZ_06_04, QUIZ_06_05,
  QUIZ_06_06, QUIZ_06_07, QUIZ_06_09, QUIZ_06_10, QUIZ_06_11, QUIZ_06_12,
  QUIZ_07_01, QUIZ_07_02, QUIZ_07_03, QUIZ_07_04,
  QUIZ_08_01, QUIZ_08_02, QUIZ_08_03, QUIZ_08_04, QUIZ_08_05, QUIZ_08_06,
  QUIZ_09_01, QUIZ_09_02, QUIZ_09_03, QUIZ_09_04, QUIZ_09_05,
  QUIZ_10_01, QUIZ_10_02, QUIZ_10_03, QUIZ_10_04, QUIZ_10_05, QUIZ_10_06,
  QUIZ_11_01, QUIZ_11_02, QUIZ_11_03, QUIZ_11_04,
  QUIZ_12_01, QUIZ_12_02, QUIZ_12_03, QUIZ_12_04, QUIZ_12_05,
  QUIZ_13_01, QUIZ_13_02, QUIZ_13_03, QUIZ_13_04, QUIZ_13_05,
  QUIZ_14_01, QUIZ_14_02, QUIZ_14_03, QUIZ_14_04, QUIZ_14_05, QUIZ_14_06, QUIZ_14_07,
  QUIZ_15_01, QUIZ_15_02, QUIZ_15_03, QUIZ_15_04, QUIZ_15_05,
  QUIZ_16_03, QUIZ_16_04, QUIZ_16_05,
} from './hvac-lesson-quizzes';

export const HVAC_QUIZ_MAP: Record<string, QuizQuestion[]> = {
  // ── Module 1: Program Orientation ──
  "hvac-01-01": QUIZ_01_01,
  "hvac-01-02": QUIZ_01_02,
  "hvac-01-03": QUIZ_01_03,
  "hvac-01-04": ORIENTATION_QUIZ,        // module exam

  // ── Module 2: HVAC Fundamentals ──
  "hvac-02-01": QUIZ_02_01,
  "hvac-02-02": QUIZ_02_02,
  "hvac-02-03": QUIZ_02_03,
  "hvac-02-04": QUIZ_02_04,
  "hvac-02-05": HVAC_FUNDAMENTALS_QUIZ,  // module exam

  // ── Module 3: Electrical Basics ──
  "hvac-03-01": QUIZ_03_01,
  "hvac-03-02": QUIZ_03_02,
  "hvac-03-03": QUIZ_03_03,
  "hvac-03-04": QUIZ_03_04,
  "hvac-03-05": ELECTRICAL_BASICS_QUIZ,  // module exam

  // ── Module 4: Heating Systems ──
  "hvac-04-01": QUIZ_04_01,
  "hvac-04-02": QUIZ_04_02,
  "hvac-04-03": QUIZ_04_03,
  "hvac-04-04": QUIZ_04_04,
  "hvac-04-05": QUIZ_04_05,
  "hvac-04-06": HEATING_SYSTEMS_QUIZ,    // module exam

  // ── Module 5: Refrigeration Cycle ──
  "hvac-05-01": QUIZ_05_01,
  "hvac-05-02": QUIZ_05_02,
  "hvac-05-03": QUIZ_05_03,
  "hvac-05-04": QUIZ_05_04,
  "hvac-05-05": QUIZ_05_05,
  "hvac-05-06": QUIZ_05_06,

  // ── Module 6: EPA 608 Core ──
  "hvac-06-01": QUIZ_06_01,
  "hvac-06-02": QUIZ_06_02,
  "hvac-06-03": QUIZ_06_03,
  "hvac-06-04": QUIZ_06_04,
  "hvac-06-05": QUIZ_06_05,
  "hvac-06-06": QUIZ_06_06,
  "hvac-06-07": QUIZ_06_07,
  "hvac-06-08": EPA_608_CORE,            // practice exam
  "hvac-06-09": QUIZ_06_09,
  "hvac-06-10": QUIZ_06_10,
  "hvac-06-11": QUIZ_06_11,
  "hvac-06-12": QUIZ_06_12,

  // ── Module 7: EPA 608 Type I ──
  "hvac-07-01": QUIZ_07_01,
  "hvac-07-02": QUIZ_07_02,
  "hvac-07-03": QUIZ_07_03,
  "hvac-07-04": QUIZ_07_04,
  "hvac-07-05": EPA_608_TYPE_I,          // practice exam

  // ── Module 8: EPA 608 Type II ──
  "hvac-08-01": QUIZ_08_01,
  "hvac-08-02": QUIZ_08_02,
  "hvac-08-03": QUIZ_08_03,
  "hvac-08-04": QUIZ_08_04,
  "hvac-08-05": QUIZ_08_05,
  "hvac-08-06": QUIZ_08_06,
  "hvac-08-07": EPA_608_TYPE_II,         // practice exam

  // ── Module 9: EPA 608 Type III ──
  "hvac-09-01": QUIZ_09_01,
  "hvac-09-02": QUIZ_09_02,
  "hvac-09-03": QUIZ_09_03,
  "hvac-09-04": QUIZ_09_04,
  "hvac-09-05": QUIZ_09_05,
  "hvac-09-06": EPA_608_TYPE_III,        // practice exam

  // ── Module 10: Airflow and Duct Systems ──
  "hvac-10-01": QUIZ_10_01,
  "hvac-10-02": QUIZ_10_02,
  "hvac-10-03": QUIZ_10_03,
  "hvac-10-04": QUIZ_10_04,
  "hvac-10-05": QUIZ_10_05,
  "hvac-10-06": QUIZ_10_06,
  "hvac-10-07": COOLING_SYSTEMS_QUIZ,    // module exam

  // ── Module 11: Controls and Thermostats ──
  "hvac-11-01": QUIZ_11_01,
  "hvac-11-02": QUIZ_11_02,
  "hvac-11-03": QUIZ_11_03,
  "hvac-11-04": QUIZ_11_04,
  "hvac-11-05": REFRIGERATION_DIAGNOSTICS_QUIZ, // module exam

  // ── Module 12: Heat Pumps ──
  "hvac-12-01": QUIZ_12_01,
  "hvac-12-02": QUIZ_12_02,
  "hvac-12-03": QUIZ_12_03,
  "hvac-12-04": QUIZ_12_04,
  "hvac-12-05": QUIZ_12_05,
  "hvac-12-06": INSTALLATION_QUIZ,       // module exam

  // ── Module 13: Troubleshooting ──
  "hvac-13-01": QUIZ_13_01,
  "hvac-13-02": QUIZ_13_02,
  "hvac-13-03": QUIZ_13_03,
  "hvac-13-04": QUIZ_13_04,
  "hvac-13-05": QUIZ_13_05,
  "hvac-13-06": TROUBLESHOOTING_QUIZ,    // module exam

  // ── Module 14: OSHA 10-Hour Safety ──
  "hvac-14-01": QUIZ_14_01,
  "hvac-14-02": QUIZ_14_02,
  "hvac-14-03": QUIZ_14_03,
  "hvac-14-04": QUIZ_14_04,
  "hvac-14-05": QUIZ_14_05,
  "hvac-14-06": QUIZ_14_06,
  "hvac-14-07": QUIZ_14_07,
  "hvac-14-08": OSHA_30_QUIZ,            // module exam

  // ── Module 15: Career Readiness ──
  "hvac-15-01": QUIZ_15_01,
  "hvac-15-02": QUIZ_15_02,
  "hvac-15-03": QUIZ_15_03,
  "hvac-15-04": QUIZ_15_04,
  "hvac-15-05": QUIZ_15_05,

  // ── Module 16: Capstone ──
  "hvac-16-03": QUIZ_16_03,
  "hvac-16-04": QUIZ_16_04,
  "hvac-16-05": QUIZ_16_05,
};

// Helper: get combined Universal exam (all 100 questions)
export function getUniversalExam(): QuizQuestion[] {
  return [
    ...EPA_608_CORE,
    ...EPA_608_TYPE_I,
    ...EPA_608_TYPE_II,
    ...EPA_608_TYPE_III,
  ];
}

// Total question count for verification
export const TOTAL_QUIZ_QUESTIONS =
  EPA_608_CORE.length +
  EPA_608_TYPE_I.length +
  EPA_608_TYPE_II.length +
  EPA_608_TYPE_III.length +
  ORIENTATION_QUIZ.length +
  HVAC_FUNDAMENTALS_QUIZ.length +
  ELECTRICAL_BASICS_QUIZ.length +
  HEATING_SYSTEMS_QUIZ.length +
  COOLING_SYSTEMS_QUIZ.length +
  REFRIGERATION_DIAGNOSTICS_QUIZ.length +
  INSTALLATION_QUIZ.length +
  TROUBLESHOOTING_QUIZ.length +
  OSHA_30_QUIZ.length;
// Expected: 25+25+25+25 + 5+5+5+5+5+5+5+5+8 = 153 questions
