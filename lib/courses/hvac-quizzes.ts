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

// ── Extended module exam questions (brings each exam to 20 questions) ─────────
// Appended here and merged into arrays below via spread in HVAC_QUIZ_MAP.

export const ORIENTATION_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m01-06', question: 'What is the primary federal law governing workforce training funding?', options: ['SNAP Act', 'WIOA (Workforce Innovation and Opportunity Act)', 'FAFSA', 'Title IV HEA'], correctAnswer: 1, explanation: 'WIOA funds workforce training for adults, dislocated workers, and youth through local workforce development boards.' },
  { id: 'q-m01-07', question: 'ETPL stands for:', options: ['Eligible Training Provider List', 'Employment Trade Placement License', 'Entry-level Trade Prep License', 'Elevate Training Program Listing'], correctAnswer: 0, explanation: 'ETPL is the Eligible Training Provider List — programs on this list can receive WIOA funding for enrolled students.' },
  { id: 'q-m01-08', question: 'Which credential is required by federal law to purchase refrigerants?', options: ['OSHA 10', 'NATE Core', 'EPA 608', 'CPR/AED'], correctAnswer: 2, explanation: 'EPA Section 608 certification is federally required to purchase refrigerants in containers larger than 2 lbs.' },
  { id: 'q-m01-09', question: 'The BLS projects HVAC job growth through 2031 at:', options: ['2%', '7%', '13%', '25%'], correctAnswer: 2, explanation: '13% growth — well above the national average — driven by a severe technician shortage and aging infrastructure.' },
  { id: 'q-m01-10', question: 'Entry-level HVAC apprentice wages typically range from:', options: ['$8–12/hr', '$16–22/hr', '$30–40/hr', '$50+/hr'], correctAnswer: 1, explanation: 'Certified apprentice technicians typically start at $16–22/hr. Experienced techs earn $25–40/hr.' },
  { id: 'q-m01-11', question: 'JRI funding in Indiana is administered by:', options: ['IRS', 'Indiana DWD', 'FEMA', 'HUD'], correctAnswer: 1, explanation: 'The Justice Reinvestment Initiative is an Indiana Department of Workforce Development program for justice-involved individuals.' },
  { id: 'q-m01-12', question: 'A Journeyman HVAC license typically requires:', options: ['This program only', '3–5 years field experience plus licensing exams', '10+ years', 'No additional requirements after EPA 608'], correctAnswer: 1, explanation: 'Journeyman status requires documented field experience (typically 3–5 years) plus state licensing exams beyond this program.' },
  { id: 'q-m01-13', question: 'NATE certification demonstrates:', options: ['Basic safety knowledge only', 'Verified technical knowledge across HVAC specialties — the industry\'s premier credential', 'EPA compliance only', 'Electrical licensing'], correctAnswer: 1, explanation: 'NATE (North American Technician Excellence) is the industry\'s most respected credential, requiring rigorous knowledge verification.' },
  { id: 'q-m01-14', question: 'The program combines classroom instruction with:', options: ['Online-only coursework', 'Hands-on lab time', 'Apprenticeship only', 'Self-study only'], correctAnswer: 1, explanation: 'The program structure combines classroom instruction with hands-on lab time to prepare graduates for immediate employment.' },
  { id: 'q-m01-15', question: 'Which of the following is earned upon program completion?', options: ['Journeyman license', 'Master HVAC license', 'EPA 608 Universal, OSHA 10, and CPR/AED', 'NATE certification'], correctAnswer: 2, explanation: 'Program completers earn EPA 608 Universal, OSHA 10, and CPR/AED — the three credentials required for entry-level employment.' },
  { id: 'q-m01-16', question: 'A government-issued photo ID is required at enrollment to:', options: ['Pay tuition', 'Verify identity for funding eligibility and enrollment records', 'Take the EPA exam', 'Purchase tools'], correctAnswer: 1, explanation: 'Government-issued ID verifies identity for WIOA and other funding program eligibility requirements.' },
  { id: 'q-m01-17', question: 'The intake process at Elevate identifies:', options: ['Only funding eligibility', 'Eligibility, barriers to completion, and available support services', 'Technical aptitude only', 'Employment history only'], correctAnswer: 1, explanation: 'Intake is holistic — it identifies funding eligibility, potential barriers (transportation, childcare), and connects students to support.' },
  { id: 'q-m01-18', question: 'Registered Apprenticeship programs offer:', options: ['Unpaid training only', 'Paid OJT with wage increases tied to skill milestones', 'Classroom only', 'No credential at completion'], correctAnswer: 1, explanation: 'DOL Registered Apprenticeships combine paid on-the-job training with related technical instruction, ending with a journeyman credential.' },
  { id: 'q-m01-19', question: 'The HVAC technician shortage is projected to continue because:', options: ['The industry is declining', 'Aging infrastructure, retiring technicians, and growing demand for energy-efficient systems', 'Too many new technicians are entering the field', 'Automation is replacing technicians'], correctAnswer: 1, explanation: 'Aging HVAC infrastructure, retiring baby-boomer technicians, and growing demand for efficient systems all drive the shortage.' },
  { id: 'q-m01-20', question: 'Elevate for Humanity\'s mission focuses on:', options: ['Training as many people as possible', 'Economic mobility for underserved communities through workforce development', 'Competing with community colleges', 'Placing graduates in any available job'], correctAnswer: 1, explanation: 'Elevate\'s mission is economic mobility — connecting underserved individuals to living-wage careers through quality training and employer partnerships.' },
];

export const HVAC_FUNDAMENTALS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m02-06', question: 'Heat always flows from:', options: ['Cold to hot', 'Hot to cold', 'High pressure to low pressure', 'Wet to dry'], correctAnswer: 1, explanation: 'Second Law of Thermodynamics: heat always flows from warmer to cooler objects.' },
  { id: 'q-m02-07', question: 'Latent heat is heat that:', options: ['Raises temperature', 'Causes phase change without temperature change', 'Is measured by thermometer', 'Only occurs in gases'], correctAnswer: 1, explanation: 'Latent heat drives phase changes (liquid↔vapor) — the basis of refrigeration — without changing temperature.' },
  { id: 'q-m02-08', question: 'The four components of the refrigeration cycle in order are:', options: ['Compressor→Evaporator→Condenser→Metering', 'Evaporator→Compressor→Condenser→Metering', 'Condenser→Compressor→Evaporator→Metering', 'Metering→Evaporator→Compressor→Condenser'], correctAnswer: 1, explanation: 'Evaporator (absorb heat) → Compressor (raise pressure) → Condenser (reject heat) → Metering device (drop pressure).' },
  { id: 'q-m02-09', question: 'A split system has components located:', options: ['All inside', 'All outside', 'Both inside and outside', 'In the attic only'], correctAnswer: 2, explanation: 'Split systems have an indoor unit (air handler/evaporator) and outdoor unit (condenser/compressor) connected by refrigerant lines.' },
  { id: 'q-m02-10', question: 'Refrigerant cylinders must be stored:', options: ['Horizontally', 'Upright and secured', 'In direct sunlight', 'Near heat sources'], correctAnswer: 1, explanation: 'Cylinders must be stored upright and secured to prevent tipping, which can cause liquid refrigerant to enter the valve.' },
  { id: 'q-m02-11', question: 'Nitrogen is used during brazing to:', options: ['Increase pressure', 'Prevent copper oxide scale inside tubing', 'Cool the joint', 'Replace refrigerant temporarily'], correctAnswer: 1, explanation: 'Flowing dry nitrogen prevents oxidation scale that would contaminate the refrigerant system.' },
  { id: 'q-m02-12', question: 'The compressor raises refrigerant:', options: ['Temperature only', 'Pressure and temperature', 'Volume only', 'Flow rate only'], correctAnswer: 1, explanation: 'The compressor raises both pressure and temperature of the refrigerant vapor, enabling heat rejection at the condenser.' },
  { id: 'q-m02-13', question: 'The metering device drops refrigerant pressure, causing:', options: ['Temperature to rise', 'Temperature to drop — flash cooling', 'No temperature change', 'Pressure to rise'], correctAnswer: 1, explanation: 'Pressure drop causes temperature drop (flash cooling), making the evaporator cold enough to absorb heat from indoor air.' },
  { id: 'q-m02-14', question: 'Convection transfers heat through:', options: ['Direct contact', 'Electromagnetic waves', 'Movement of fluid or gas', 'Phase change only'], correctAnswer: 2, explanation: 'Convection moves heat by circulating a fluid or gas — warm air rising and cool air sinking is convection.' },
  { id: 'q-m02-15', question: 'Before working on any electrical component, you must:', options: ['Turn off the thermostat only', 'De-energize and lock out / tag out the equipment', 'Wear rubber boots only', 'Call the utility company'], correctAnswer: 1, explanation: 'Lockout/Tagout (LOTO) ensures equipment cannot be energized while you are working on it.' },
  { id: 'q-m02-16', question: 'A packaged unit contains:', options: ['Only the compressor', 'All HVAC components in one outdoor cabinet', 'Only the air handler', 'The thermostat and controls only'], correctAnswer: 1, explanation: 'A packaged unit houses compressor, condenser, evaporator, and air handler in one outdoor cabinet.' },
  { id: 'q-m02-17', question: 'The condenser rejects heat to:', options: ['Indoor air', 'Outdoor air (or water in water-cooled systems)', 'Refrigerant only', 'Ground'], correctAnswer: 1, explanation: 'Air-cooled condensers reject heat to outdoor air. Water-cooled condensers use water as the heat sink.' },
  { id: 'q-m02-18', question: 'Sensible heat causes:', options: ['Phase change', 'A measurable temperature change', 'No temperature change', 'Only occurs in liquids'], correctAnswer: 1, explanation: 'Sensible heat causes a measurable temperature change — you can sense it with a thermometer.' },
  { id: 'q-m02-19', question: 'If you smell strong refrigerant in an enclosed space, you should:', options: ['Continue working', 'Evacuate immediately and ventilate', 'Light a match to check for leaks', 'Ignore it'], correctAnswer: 1, explanation: 'Refrigerant displaces oxygen. Evacuate, ventilate, and identify the leak source before re-entering.' },
  { id: 'q-m02-20', question: 'The suction line carries refrigerant from the evaporator to the:', options: ['Condenser', 'Metering device', 'Compressor', 'Filter drier'], correctAnswer: 2, explanation: 'The suction line carries low-pressure vapor from the evaporator outlet to the compressor inlet.' },
];

export const ELECTRICAL_BASICS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m03-06', question: 'Ohm\'s Law: current equals:', options: ['Voltage × Resistance', 'Voltage ÷ Resistance', 'Resistance ÷ Voltage', 'Voltage + Resistance'], correctAnswer: 1, explanation: 'I = V ÷ R. A 240V circuit with 24Ω resistance draws 10A.' },
  { id: 'q-m03-07', question: 'In a parallel circuit, voltage across each branch is:', options: ['Different for each branch', 'Equal to source voltage', 'Zero', 'Divided equally'], correctAnswer: 1, explanation: 'All parallel branches share the same voltage. Current divides based on each branch\'s resistance.' },
  { id: 'q-m03-08', question: 'A normally open (NO) relay contact:', options: ['Is closed when de-energized', 'Is open when de-energized, closes when energized', 'Never changes state', 'Is always grounded'], correctAnswer: 1, explanation: 'NO contacts are open at rest and close when the relay coil is energized.' },
  { id: 'q-m03-09', question: 'The "Y" thermostat terminal controls:', options: ['Heat', 'Fan only', 'Cooling (compressor contactor)', 'Emergency heat'], correctAnswer: 2, explanation: 'Y energizes the cooling circuit — signals the outdoor unit contactor to start the compressor and condenser fan.' },
  { id: 'q-m03-10', question: 'A GFCI outlet protects against:', options: ['Overloads', 'Short circuits', 'Ground faults that can cause electrocution', 'Voltage surges'], correctAnswer: 2, explanation: 'GFCI detects small current imbalances indicating a ground fault and trips in milliseconds.' },
  { id: 'q-m03-11', question: 'Most residential HVAC equipment operates on:', options: ['12V DC', '120V AC single-phase', '208/230V AC single-phase', '480V AC three-phase'], correctAnswer: 2, explanation: 'Most residential HVAC equipment (condensers, air handlers) operates on 208/230V single-phase AC.' },
  { id: 'q-m03-12', question: 'A short circuit occurs when:', options: ['Resistance is too high', 'Current finds an unintended low-resistance path', 'Voltage drops to zero', 'The circuit is properly grounded'], correctAnswer: 1, explanation: 'A short circuit creates an unintended low-resistance path, causing excessive current that trips breakers or blows fuses.' },
  { id: 'q-m03-13', question: 'The "C" thermostat terminal is:', options: ['Cooling', 'Common — 24V return path', 'Compressor', 'Capacitor'], correctAnswer: 1, explanation: 'C is the Common wire — the 24V return path that completes the control circuit. Required for smart thermostats.' },
  { id: 'q-m03-14', question: 'Electrical power is measured in:', options: ['Volts', 'Amperes', 'Ohms', 'Watts'], correctAnswer: 3, explanation: 'Power (P) = V × I, measured in watts. A 230V circuit drawing 10A consumes 2,300 watts.' },
  { id: 'q-m03-15', question: 'Before using a multimeter on a live circuit, verify:', options: ['Set it to DC voltage', 'The meter is rated for the voltage present', 'Remove the batteries', 'Set to highest range only'], correctAnswer: 1, explanation: 'Always verify the meter\'s CAT rating exceeds the voltage being measured. An under-rated meter can cause arc flash.' },
  { id: 'q-m03-16', question: 'A ladder diagram shows:', options: ['Physical component locations', 'Electrical control logic rung by rung', 'Refrigerant flow path', 'Duct layout'], correctAnswer: 1, explanation: 'Ladder diagrams show control logic — each rung is a circuit path from L1 to L2, making troubleshooting systematic.' },
  { id: 'q-m03-17', question: 'Arc flash PPE is required when:', options: ['Reading a thermostat', 'Working on de-energized equipment', 'Working on or near energized equipment above 50V', 'Changing a capacitor after LOTO'], correctAnswer: 2, explanation: 'Arc flash PPE (face shield, arc-rated clothing) is required when working on or near energized equipment.' },
  { id: 'q-m03-18', question: 'Each worker performing LOTO must:', options: ['Share one lock with the crew', 'Apply their own personal lock', 'Only sign the tag', 'Rely on the supervisor\'s lock'], correctAnswer: 1, explanation: 'Each worker applies their own lock. No one can remove another person\'s lock — this ensures no one can energize equipment while anyone is working.' },
  { id: 'q-m03-19', question: 'Dashed lines on an HVAC wiring diagram typically represent:', options: ['High-voltage wires', 'Low-voltage control wiring or factory wiring', 'Ground wires', 'Broken wires'], correctAnswer: 1, explanation: 'Dashed lines indicate low-voltage control wiring (24V thermostat circuits) or factory-installed wiring.' },
  { id: 'q-m03-20', question: 'A 240V circuit with a 20Ω load draws:', options: ['4,800A', '220A', '12A', '260A'], correctAnswer: 2, explanation: 'I = V ÷ R = 240 ÷ 20 = 12A.' },
];

export const HEATING_SYSTEMS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m04-06', question: 'A cracked heat exchanger is dangerous because:', options: ['It reduces efficiency slightly', 'CO can enter the airstream', 'It causes short cycling', 'It increases gas pressure'], correctAnswer: 1, explanation: 'A cracked heat exchanger allows carbon monoxide — odorless and deadly — to mix with conditioned air.' },
  { id: 'q-m04-07', question: 'The inducer motor draws combustion gases:', options: ['Into the heat exchanger', 'Through the heat exchanger and out the flue', 'Into the living space', 'Into the filter'], correctAnswer: 1, explanation: 'The draft inducer pulls combustion gases through the heat exchanger and exhausts them safely out the flue.' },
  { id: 'q-m04-08', question: 'A heat pump heats by:', options: ['Burning fuel', 'Moving heat from outdoor air into the building', 'Electric resistance only', 'Generating heat from friction'], correctAnswer: 1, explanation: 'A heat pump extracts heat from outdoor air (even cold air contains heat) and moves it indoors — no combustion.' },
  { id: 'q-m04-09', question: 'Electric resistance heat efficiency is:', options: ['50%', '80%', '95%', '100%'], correctAnswer: 3, explanation: 'Electric resistance heating is 100% efficient at point of use — all electrical energy converts directly to heat.' },
  { id: 'q-m04-10', question: 'Gas manifold pressure is measured in:', options: ['PSI', 'Inches of water column (in. w.c.)', 'Microns', 'CFM'], correctAnswer: 1, explanation: 'Gas manifold pressure is measured in inches of water column using a manometer. Natural gas: typically 3.5 in. w.c.' },
  { id: 'q-m04-11', question: 'The flame sensor proves ignition by:', options: ['Measuring gas pressure', 'Detecting a small DC current through the flame', 'Monitoring flue temperature', 'Checking inducer speed'], correctAnswer: 1, explanation: 'The flame sensor passes a small DC current through the flame. No flame = control board shuts off the gas valve.' },
  { id: 'q-m04-12', question: 'A furnace that short-cycles is most commonly caused by:', options: ['Low gas pressure', 'High-limit tripping due to restricted airflow', 'Thermostat failure', 'Igniter failure'], correctAnswer: 1, explanation: 'Short cycling = high-limit tripping. The heat exchanger overheats because airflow is restricted — check filter and blower.' },
  { id: 'q-m04-13', question: 'Heat pump COP of 3 means:', options: ['30% efficient', '3 units of heat per unit of electricity consumed', '3x more expensive to run', '300% less efficient than gas'], correctAnswer: 1, explanation: 'COP = heat output ÷ electrical input. COP 3 = 300% efficient — 3 units of heat delivered per unit of electricity.' },
  { id: 'q-m04-14', question: 'Combustion analysis measures:', options: ['Airflow only', 'O2, CO2, CO, flue temperature, and efficiency', 'Gas pressure only', 'Electrical load'], correctAnswer: 1, explanation: 'A combustion analyzer measures O2, CO2, CO, flue temperature, and calculates efficiency — essential for furnace tuning.' },
  { id: 'q-m04-15', question: 'High CO in flue gas indicates:', options: ['Perfect combustion', 'Incomplete combustion — a safety hazard', 'Too much excess air', 'Normal operation'], correctAnswer: 1, explanation: 'CO in flue gas indicates incomplete combustion. Acceptable: under 100 ppm air-free. Above 400 ppm is dangerous.' },
  { id: 'q-m04-16', question: 'Electric heat strips are staged to:', options: ['Increase efficiency', 'Prevent simultaneous high current draw from tripping breakers', 'Reduce noise', 'Improve airflow'], correctAnswer: 1, explanation: 'Staging prevents all strips from energizing simultaneously, avoiding large inrush current that could trip breakers.' },
  { id: 'q-m04-17', question: 'The reversing valve in a heat pump is controlled by:', options: ['The compressor', 'A solenoid energized by the thermostat O or B terminal', 'The capacitor', 'The high-pressure switch'], correctAnswer: 1, explanation: 'The reversing valve solenoid is energized by the O terminal (cooling on most systems) or B terminal (Rheem/Ruud).' },
  { id: 'q-m04-18', question: 'Heat pump defrost mode temporarily switches to:', options: ['Higher heating capacity', 'Cooling mode to melt frost from the outdoor coil', 'Fan-only mode', 'Emergency heat only'], correctAnswer: 1, explanation: 'Defrost reverses the cycle (cooling mode) so the outdoor coil becomes the condenser, melting frost with hot refrigerant.' },
  { id: 'q-m04-19', question: 'A dirty filter causes a furnace to:', options: ['Run more efficiently', 'Overheat and trip the high-limit switch', 'Use less gas', 'Improve combustion'], correctAnswer: 1, explanation: 'A dirty filter restricts airflow, causing the heat exchanger to overheat and trip the high-limit switch.' },
  { id: 'q-m04-20', question: 'Standard heat pumps lose efficiency below approximately:', options: ['50°F', '35–40°F', '20°F', '0°F'], correctAnswer: 1, explanation: 'Standard heat pumps lose efficiency below 35–40°F. Below this, backup electric strips or gas furnace supplements heating.' },
];

export const COOLING_SYSTEMS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m05-06', question: 'TXV systems are charged by:', options: ['Superheat method', 'Subcooling method', 'Weight method only', 'Sight glass only'], correctAnswer: 1, explanation: 'TXV systems are charged by subcooling — target typically 10–15°F at the liquid line.' },
  { id: 'q-m05-07', question: 'Fixed orifice systems are charged by:', options: ['Subcooling method', 'Superheat method', 'Weight method only', 'Pressure method only'], correctAnswer: 1, explanation: 'Fixed orifice systems are charged by superheat — target varies by outdoor temperature and indoor wet bulb.' },
  { id: 'q-m05-08', question: 'A frozen evaporator coil is most commonly caused by:', options: ['Overcharge', 'Low airflow or low refrigerant charge', 'High ambient temperature', 'Dirty condenser'], correctAnswer: 1, explanation: 'Low airflow (dirty filter, closed registers) or low charge causes coil temperature to drop below 32°F.' },
  { id: 'q-m05-09', question: 'Scroll compressors dominate residential HVAC because:', options: ['They are cheapest', 'They are quieter, more efficient, and more reliable than reciprocating types', 'They handle liquid better', 'They are easier to repair'], correctAnswer: 1, explanation: 'Scroll compressors have fewer moving parts, run quieter, and are more efficient than reciprocating piston compressors.' },
  { id: 'q-m05-10', question: 'A dirty condenser coil causes:', options: ['Lower head pressure', 'Higher head pressure and reduced efficiency', 'Lower suction pressure', 'No measurable effect'], correctAnswer: 1, explanation: 'Dirt insulates the condenser coil, reducing heat transfer. Head pressure rises and compressor amperage increases.' },
  { id: 'q-m05-11', question: 'Subcooling is measured at the:', options: ['Compressor discharge', 'Condenser outlet / liquid line', 'Evaporator outlet', 'Metering device inlet only'], correctAnswer: 1, explanation: 'Subcooling = saturation temperature at condenser pressure minus actual liquid temperature, measured at the liquid line.' },
  { id: 'q-m05-12', question: 'High superheat (above 15°F) typically indicates:', options: ['Overcharge', 'Undercharge or restricted metering device', 'Dirty condenser', 'Non-condensables'], correctAnswer: 1, explanation: 'High superheat means the refrigerant fully evaporates too early — usually from undercharge or a restricted metering device.' },
  { id: 'q-m05-13', question: 'Low superheat (near 0°F) indicates:', options: ['Undercharge', 'Overcharge or flooding — liquid may reach the compressor', 'Normal operation', 'Dirty condenser'], correctAnswer: 1, explanation: 'Near-zero superheat means liquid refrigerant is not fully evaporating — flood-back risk to the compressor.' },
  { id: 'q-m05-14', question: 'A clogged condensate drain causes:', options: ['Higher efficiency', 'Water overflow and safety switch shutdown', 'Lower humidity only', 'No operational effect'], correctAnswer: 1, explanation: 'A blocked drain causes the condensate pan to overflow. Most systems have a float switch that shuts down the system.' },
  { id: 'q-m05-15', question: 'Non-condensable gases in a system cause:', options: ['Lower head pressure', 'Higher head pressure than the PT chart predicts', 'Lower suction pressure', 'No measurable effect'], correctAnswer: 1, explanation: 'Non-condensables (air, nitrogen) raise head pressure because they cannot condense and occupy space in the condenser.' },
  { id: 'q-m05-16', question: 'Bubbles in the liquid line sight glass indicate:', options: ['Normal operation', 'Low refrigerant charge', 'Overcharge', 'Air in the system only'], correctAnswer: 1, explanation: 'Bubbles mean flash gas is forming — the charge is low or there is a restriction causing pressure drop before the metering device.' },
  { id: 'q-m05-17', question: 'A compressor that hums but does not start most likely has:', options: ['A refrigerant leak', 'A failed run/start capacitor or seized compressor', 'A thermostat problem', 'A dirty filter'], correctAnswer: 1, explanation: 'Humming without starting indicates the motor is trying but cannot turn. Check the capacitor first.' },
  { id: 'q-m05-18', question: 'Condenser fan airflow on a standard residential unit is:', options: ['Down through the coil', 'Up through the coil and out the top', 'Horizontal through the coil', 'Recirculated internally'], correctAnswer: 1, explanation: 'Residential condensers draw air in through the sides of the coil and discharge it upward out the top.' },
  { id: 'q-m05-19', question: 'The accumulator on a heat pump protects the compressor from:', options: ['High pressure', 'Liquid refrigerant flood-back', 'Electrical overload', 'Overheating'], correctAnswer: 1, explanation: 'The accumulator catches liquid refrigerant before it reaches the compressor — critical during defrost.' },
  { id: 'q-m05-20', question: 'R-410A must be charged as:', options: ['Vapor only', 'Liquid from the cylinder', 'Either liquid or vapor', 'Gas from the top of the cylinder'], correctAnswer: 1, explanation: 'R-410A is a near-azeotropic blend and must be charged as liquid to prevent fractionation.' },
];

export const REFRIGERATION_DIAGNOSTICS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m11-06', question: 'High head pressure and normal suction most likely indicates:', options: ['Undercharge', 'Dirty condenser, high ambient, or non-condensables', 'Low evaporator airflow', 'Failed compressor'], correctAnswer: 1, explanation: 'High head with normal suction = condenser problem. Dirty coil, restricted airflow, high ambient, or non-condensables.' },
  { id: 'q-m11-07', question: 'Low suction and high superheat most likely indicates:', options: ['Overcharge', 'Undercharge or restricted metering device', 'Dirty condenser', 'Non-condensables'], correctAnswer: 1, explanation: 'Low suction + high superheat = evaporator starved. Check refrigerant charge, metering device, and evaporator airflow.' },
  { id: 'q-m11-08', question: 'Both high suction and high head pressure indicates:', options: ['Undercharge', 'Overcharge or non-condensables', 'Restriction', 'Normal at high load'], correctAnswer: 1, explanation: 'Both pressures high = overcharge or non-condensables. Too much refrigerant or air in the system.' },
  { id: 'q-m11-09', question: 'Both low suction and low head pressure indicates:', options: ['Overcharge', 'Undercharge or very low load', 'Restriction', 'Non-condensables'], correctAnswer: 1, explanation: 'Both pressures low = undercharge or very low load. Not enough refrigerant circulating.' },
  { id: 'q-m11-10', question: 'A TXV stuck closed causes:', options: ['High suction pressure', 'Very low suction pressure and high superheat', 'Overcharge symptoms', 'No pressure change'], correctAnswer: 1, explanation: 'A stuck-closed TXV starves the evaporator — suction pressure drops dramatically and superheat rises.' },
  { id: 'q-m11-11', question: 'Ice on the suction line at the outdoor unit indicates:', options: ['Normal operation in cold weather', 'Low charge or severely restricted evaporator airflow', 'Overcharge', 'High ambient temperature'], correctAnswer: 1, explanation: 'Ice on the suction line means refrigerant is not absorbing enough heat — low charge or low airflow.' },
  { id: 'q-m11-12', question: 'The subcooling charging method targets:', options: ['0–2°F subcooling', '10–15°F subcooling at the liquid line', '30°F subcooling', 'Maximum subcooling possible'], correctAnswer: 1, explanation: 'TXV systems target 10–15°F subcooling at the liquid line service valve.' },
  { id: 'q-m11-13', question: 'Non-condensables are removed by:', options: ['Adding refrigerant', 'Full recovery, deep evacuation, and recharge with virgin refrigerant', 'Purging through the Schrader valve', 'Running the system at high load'], correctAnswer: 1, explanation: 'Non-condensables cannot be selectively purged. Full recovery, evacuation, and recharge is required.' },
  { id: 'q-m11-14', question: 'A weak run capacitor causes the motor to:', options: ['Draw less amperage', 'Draw more amperage and run hotter', 'Run at higher speed', 'Have no measurable effect'], correctAnswer: 1, explanation: 'A weak capacitor reduces phase shift, causing the motor to draw excess current, run hotter, and eventually fail.' },
  { id: 'q-m11-15', question: 'Pitted contactor contacts cause:', options: ['Higher efficiency', 'Voltage drop, overheating, and eventual failure', 'Lower amperage draw', 'No operational effect'], correctAnswer: 1, explanation: 'Pitted contacts increase resistance, causing voltage drop and heat. Severely pitted contacts may weld closed.' },
  { id: 'q-m11-16', question: 'A control board fault code is retrieved by:', options: ['Calling the manufacturer', 'Counting LED flash sequences or reading a digital display', 'Measuring voltage at the board', 'Replacing the board'], correctAnswer: 1, explanation: 'Most control boards flash LED codes to indicate fault history. Count flashes and compare to the legend on the board.' },
  { id: 'q-m11-17', question: 'Before replacing a control board, the technician should:', options: ['Replace it immediately', 'Verify all inputs are correct and the board is actually at fault', 'Check refrigerant charge', 'Replace all sensors first'], correctAnswer: 1, explanation: 'Control boards are expensive. Always verify all inputs before condemning the board — a bad sensor is often the real cause.' },
  { id: 'q-m11-18', question: 'A rollout switch trips when:', options: ['The filter is dirty', 'Flames roll out of the burner box — indicating a cracked heat exchanger or blocked flue', 'The thermostat is set too high', 'The capacitor fails'], correctAnswer: 1, explanation: 'Rollout switches are manual-reset safety devices. Flame rollout indicates a serious combustion problem.' },
  { id: 'q-m11-19', question: 'The limit switch on a furnace opens when:', options: ['The thermostat calls for heat', 'Heat exchanger temperature exceeds a safe limit due to low airflow', 'The gas valve closes', 'The inducer starts'], correctAnswer: 1, explanation: 'The high-limit switch opens the gas valve circuit if the heat exchanger overheats. Repeated tripping = airflow problem.' },
  { id: 'q-m11-20', question: 'A pressure switch on a furnace opens when:', options: ['The thermostat calls for heat', 'Inducer draft pressure is insufficient — blocked flue or failed inducer', 'The heat exchanger is hot', 'The gas valve opens'], correctAnswer: 1, explanation: 'The pressure switch verifies adequate draft. If insufficient (blocked flue, failed inducer), it opens and locks out the furnace.' },
];

export const INSTALLATION_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m12-06', question: 'Manual J calculates:', options: ['Duct sizing', 'Building heat load for equipment sizing', 'Refrigerant charge', 'Electrical load'], correctAnswer: 1, explanation: 'Manual J calculates the heating and cooling load of a building to determine proper equipment size.' },
  { id: 'q-m12-07', question: 'Nitrogen flows through copper tubing during brazing to:', options: ['Cool the joint', 'Prevent copper oxide scale inside the tubing', 'Test for leaks', 'Increase pressure'], correctAnswer: 1, explanation: 'Flowing dry nitrogen prevents oxidation scale that would contaminate the refrigerant system.' },
  { id: 'q-m12-08', question: 'Duct static pressure is measured in:', options: ['PSI', 'Inches of water column (in. w.c.)', 'Microns', 'CFM'], correctAnswer: 1, explanation: 'Duct static pressure is measured in inches of water column using a manometer.' },
  { id: 'q-m12-09', question: 'Total external static pressure (TESP) is measured:', options: ['At the supply plenum only', 'Across the air handler — supply plenum minus return plenum', 'At each register', 'At the outdoor unit'], correctAnswer: 1, explanation: 'TESP = supply plenum pressure minus return plenum pressure — the total resistance the blower must overcome.' },
  { id: 'q-m12-10', question: 'Typical maximum TESP for residential equipment is:', options: ['0.1 in. w.c.', '0.5 in. w.c.', '2.0 in. w.c.', '5.0 in. w.c.'], correctAnswer: 1, explanation: 'Most residential equipment is rated for 0.5 in. w.c. TESP. Exceeding this reduces airflow and causes comfort problems.' },
  { id: 'q-m12-11', question: 'Mastic sealant is preferred over duct tape because:', options: ['It is cheaper', 'It remains flexible and adheres permanently — duct tape fails within years', 'It is easier to apply', 'It is required by code only'], correctAnswer: 1, explanation: 'Mastic bonds permanently and stays flexible. Standard duct tape dries out and fails within 1–5 years.' },
  { id: 'q-m12-12', question: 'A flow hood (balometer) measures:', options: ['Static pressure', 'CFM at a supply or return register', 'Duct leakage', 'Temperature differential'], correctAnswer: 1, explanation: 'A flow hood captures all air from a register and measures CFM directly — the most accurate field method.' },
  { id: 'q-m12-13', question: 'Duct leakage testing uses:', options: ['A refrigerant gauge set', 'A duct blaster to pressurize the duct system and measure leakage CFM', 'A manometer only', 'Visual inspection only'], correctAnswer: 1, explanation: 'A duct blaster pressurizes the duct system to 25 Pa and measures the CFM required to maintain that pressure.' },
  { id: 'q-m12-14', question: 'Before starting a newly installed system, the technician should:', options: ['Immediately turn it on', 'Verify charge, check electrical connections, verify airflow, and leak test', 'Only check the thermostat', 'Run it for 5 minutes and walk away'], correctAnswer: 1, explanation: 'A complete pre-startup checklist includes verifying charge, electrical, airflow, leak testing, and performance verification.' },
  { id: 'q-m12-15', question: 'Temperature rise across a gas furnace heat exchanger should match:', options: ['Outdoor temperature', 'The manufacturer\'s specified range (typically 35–65°F)', 'Exactly 70°F always', 'The thermostat setpoint'], correctAnswer: 1, explanation: 'Temperature rise is a key furnace performance indicator. Too high = low airflow; too low = high airflow or low gas pressure.' },
  { id: 'q-m12-16', question: 'Cooling temperature split across the evaporator should be approximately:', options: ['5–8°F', '14–22°F', '30–40°F', '50°F+'], correctAnswer: 1, explanation: 'A 14–22°F temperature split indicates proper heat transfer. Lower = low airflow or low charge; higher = very low airflow.' },
  { id: 'q-m12-17', question: 'Duct insulation in unconditioned spaces is required to:', options: ['Reduce noise', 'Prevent heat gain/loss and condensation', 'Increase airflow', 'Meet fire codes only'], correctAnswer: 1, explanation: 'Uninsulated ducts in attics or crawlspaces gain or lose significant heat. R-6 to R-8 minimum is required by energy codes.' },
  { id: 'q-m12-18', question: 'A flare fitting requires:', options: ['Brazing', 'A properly flared tube end compressed against a fitting', 'Soldering', 'Press-fit connection'], correctAnswer: 1, explanation: 'Flare fittings use a flared tube end compressed against a fitting with a flare nut. No heat required.' },
  { id: 'q-m12-19', question: 'Heat pump charging in cooling mode uses:', options: ['Heating mode subcooling', 'Cooling mode superheat (fixed orifice) or subcooling (TXV)', 'Weight method only', 'Outdoor temperature chart only'], correctAnswer: 1, explanation: 'Charge heat pumps in cooling mode using the same method as a standard AC: superheat for fixed orifice, subcooling for TXV.' },
  { id: 'q-m12-20', question: 'The balance point of a heat pump is:', options: ['The most efficient outdoor temperature', 'The outdoor temperature where heat pump capacity equals building heat loss', 'The defrost initiation temperature', 'The minimum operating temperature'], correctAnswer: 1, explanation: 'The balance point is where heat pump output exactly meets building heat loss. Below this, auxiliary heat supplements.' },
];

export const TROUBLESHOOTING_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m13-06', question: 'The first step in systematic troubleshooting is:', options: ['Replace the most common failed part', 'Verify the customer complaint', 'Check refrigerant charge', 'Call for help'], correctAnswer: 1, explanation: 'Always verify the complaint first. Then gather data, isolate the problem, test, repair, and verify the fix.' },
  { id: 'q-m13-07', question: 'A gas furnace that ignites then shuts off after a few seconds most likely has:', options: ['A gas pressure problem', 'A dirty or failed flame sensor', 'A cracked heat exchanger', 'A bad thermostat'], correctAnswer: 1, explanation: 'Ignites then shuts off = flame sensor not proving the flame. Clean the flame sensor — most common cause.' },
  { id: 'q-m13-08', question: 'A furnace pressure switch that trips repeatedly on a 90%+ furnace often means:', options: ['Normal operation', 'Blocked condensate drain', 'Low gas pressure', 'Thermostat wiring issue'], correctAnswer: 1, explanation: 'On 90%+ furnaces, a blocked condensate drain backs up water and blocks the pressure port — most common cause.' },
  { id: 'q-m13-09', question: 'CO in the living space from an HVAC system requires:', options: ['Normal operation — ignore it', 'Immediate evacuation and inspection of heat exchanger and flue', 'Low gas pressure check only', 'Filter replacement'], correctAnswer: 1, explanation: 'CO in the living space is a life-safety emergency. Evacuate, ventilate, and inspect before restarting.' },
  { id: 'q-m13-10', question: 'If the condenser fan runs but the compressor does not, check:', options: ['The filter', 'Capacitor, contactor contacts, compressor overload, and windings', 'Refrigerant charge first', 'The thermostat only'], correctAnswer: 1, explanation: 'Fan runs but compressor does not: contactor is closing. Check compressor-specific circuit: capacitor, overload, windings.' },
  { id: 'q-m13-11', question: 'A heat pump that heats but does not cool most likely has:', options: ['Low refrigerant charge', 'Reversing valve stuck in heating position or O-terminal wiring issue', 'Failed compressor', 'Dirty filter'], correctAnswer: 1, explanation: 'Heats but no cooling = reversing valve stuck in heating position, or O-terminal not energizing in cooling mode.' },
  { id: 'q-m13-12', question: 'Auxiliary heat running continuously in mild weather (above 40°F) indicates:', options: ['Normal operation', 'Heat pump is not operating — check compressor, reversing valve, or charge', 'High efficiency mode', 'Correct thermostat setting'], correctAnswer: 1, explanation: 'Aux heat should only run when the heat pump cannot keep up. Continuous aux in mild weather = heat pump not contributing.' },
  { id: 'q-m13-13', question: 'After completing a repair, the technician must:', options: ['Leave immediately', 'Verify the repair solved the complaint and system is operating within spec', 'Only check the thermostat', 'File paperwork only'], correctAnswer: 1, explanation: 'Always verify the repair: confirm the complaint is resolved and check operating parameters.' },
  { id: 'q-m13-14', question: 'When a repair will cost more than the estimate, you should:', options: ['Complete the work and surprise the customer', 'Stop, contact the customer, explain, and get approval before proceeding', 'Reduce scope without telling the customer', 'Complete the work and offer a discount'], correctAnswer: 1, explanation: 'Always get customer approval before exceeding an estimate. Surprise bills destroy trust.' },
  { id: 'q-m13-15', question: 'Service documentation should include:', options: ['Customer name only', 'Date, complaint, findings, work performed, parts used, and operating parameters after repair', 'Invoice amount only', 'Technician name only'], correctAnswer: 1, explanation: 'Complete service records protect the technician, help future technicians, and are required for warranty and EPA compliance.' },
  { id: 'q-m13-16', question: 'High head pressure and low suction pressure together typically indicates:', options: ['Overcharge', 'Restriction in the liquid line, metering device, or dirty condenser', 'Normal operation', 'Undercharge only'], correctAnswer: 1, explanation: 'Low suction + high head = restriction. Refrigerant is trapped on the high side and starved on the low side.' },
  { id: 'q-m13-17', question: 'A "shotgun" approach (replacing parts without diagnosis) is problematic because:', options: ['It is too slow', 'It wastes parts and money, may not fix the real problem, and damages customer trust', 'It is too accurate', 'It is required by some manufacturers'], correctAnswer: 1, explanation: 'Replacing parts without diagnosis wastes money, may not fix the root cause, and erodes customer confidence.' },
  { id: 'q-m13-18', question: 'When a customer is upset about a recurring problem, the best response is:', options: ['Blame the previous technician', 'Acknowledge frustration, take ownership, and focus on solving the problem', 'Offer a refund immediately', 'Argue that the previous repair was correct'], correctAnswer: 1, explanation: 'Acknowledge the frustration, take ownership of the solution, and focus on fixing the problem.' },
  { id: 'q-m13-19', question: 'Safety violations during a competency assessment result in:', options: ['A point deduction only', 'Immediate stop of that station — safety is non-negotiable', 'A warning only', 'No consequence if the task is completed'], correctAnswer: 1, explanation: 'Safety violations result in immediate station failure. Safety is always the first priority.' },
  { id: 'q-m13-20', question: 'When you encounter a problem beyond your skill level, you should:', options: ['Guess and hope for the best', 'Acknowledge the limit and contact your supervisor or a more experienced technician', 'Pretend you fixed it', 'Charge the customer anyway'], correctAnswer: 1, explanation: 'Knowing your limits and asking for help is professional. Guessing on complex systems can cause expensive damage.' },
];

export const OSHA_30_QUIZ_EXT: QuizQuestion[] = [
  { id: 'q-m14-09', question: 'The "Fatal Four" in construction are:', options: ['Cuts, burns, falls, electrocution', 'Falls, struck-by, caught-in/between, and electrocution', 'Falls, heat stroke, chemical exposure, noise', 'Electrocution, fire, explosion, falls'], correctAnswer: 1, explanation: 'OSHA\'s Fatal Four account for over 60% of construction deaths.' },
  { id: 'q-m14-10', question: 'Ladders must extend how far above the landing for roof access?', options: ['1 foot', '3 feet', '5 feet', '6 feet'], correctAnswer: 1, explanation: 'Ladders used for roof access must extend at least 3 feet above the landing point.' },
  { id: 'q-m14-11', question: 'The correct ladder angle (4:1 rule) means:', options: ['45 degrees', '1 foot out for every 4 feet up (≈75 degrees)', '90 degrees vertical', '60 degrees'], correctAnswer: 1, explanation: 'For every 4 feet of ladder height, the base should be 1 foot from the wall — approximately 75 degrees.' },
  { id: 'q-m14-12', question: 'Stored energy that must be released before LOTO work includes:', options: ['Electrical energy only', 'Electrical, pneumatic, hydraulic, gravitational, thermal, and spring energy', 'Electrical and pneumatic only', 'Only energy above 50V'], correctAnswer: 1, explanation: 'All forms of stored energy must be released: capacitors discharged, springs relaxed, pneumatic lines bled.' },
  { id: 'q-m14-13', question: 'An SDS (Safety Data Sheet) has how many sections?', options: ['8', '12', '16', '24'], correctAnswer: 2, explanation: 'GHS-format SDS has 16 standardized sections covering identification, hazards, composition, first aid, and more.' },
  { id: 'q-m14-14', question: 'The confined space attendant\'s primary duty is:', options: ['Entering to help if needed', 'Monitoring entrants and conditions from outside — never entering the space', 'Operating rescue equipment inside', 'Testing the atmosphere inside'], correctAnswer: 1, explanation: 'The attendant stays outside, monitors entrants and conditions, and initiates rescue if needed — they do NOT enter.' },
  { id: 'q-m14-15', question: 'A fire watch must be maintained for how long after hot work?', options: ['5 minutes', '30 minutes minimum', '1 hour', 'Until the next day'], correctAnswer: 1, explanation: 'A fire watch must continue for at least 30 minutes after hot work ends — smoldering materials can ignite later.' },
  { id: 'q-m14-16', question: 'PASS stands for:', options: ['Pull, Aim, Squeeze, Sweep', 'Push, Aim, Spray, Sweep', 'Pull, Activate, Spray, Sweep', 'Point, Aim, Squeeze, Spray'], correctAnswer: 0, explanation: 'Pull the pin, Aim at the base of the fire, Squeeze the handle, Sweep side to side.' },
  { id: 'q-m14-17', question: 'Hearing protection is required when noise levels exceed:', options: ['70 dBA for 8 hours', '85 dBA for 8 hours (action level)', '90 dBA for 8 hours', '100 dBA for any duration'], correctAnswer: 1, explanation: 'OSHA\'s action level is 85 dBA for 8 hours — hearing protection must be provided.' },
  { id: 'q-m14-18', question: 'Gloves for handling refrigerants should be:', options: ['Standard latex gloves', 'Cryogenic or insulated gloves rated for low-temperature exposure', 'Cotton work gloves', 'No gloves needed'], correctAnswer: 1, explanation: 'Liquid refrigerant causes cryogenic burns. Use insulated or cryogenic gloves rated for the refrigerant\'s boiling point.' },
  { id: 'q-m14-19', question: 'PPE is the last line of defense because:', options: ['It is too expensive', 'Engineering and administrative controls should eliminate hazards first', 'It is uncomfortable', 'OSHA does not require it'], correctAnswer: 1, explanation: 'Hierarchy of controls: eliminate → substitute → engineering → administrative → PPE. PPE is the last resort.' },
  { id: 'q-m14-20', question: 'A2L refrigerants (R-32, R-454B) require:', options: ['No special precautions', 'Elimination of ignition sources, proper ventilation, and A2L-rated tools', 'Only a fire extinguisher nearby', 'OSHA permit only'], correctAnswer: 1, explanation: 'A2L refrigerants are mildly flammable. Eliminate ignition sources and ensure proper ventilation when working with them.' },
];
// ── 40-Question Final Exam ────────────────────────────────────────────────────
// Covers all 16 modules. Used at hvac-16-02 (Proctored EPA 608 Exam) and
// hvac-16-03 (Final Competency Assessment written component).

// ── Module 5 (Refrigeration Cycle) exam extension — brings hvac-05-06 to 20q ─
export const REFRIGERATION_CYCLE_QUIZ_EXT: QuizQuestion[] = [
  { id: 'rc-ext-01', question: 'What is the primary function of the metering device in a refrigeration cycle?', options: ['Compress the refrigerant', 'Remove heat from the condenser', 'Reduce refrigerant pressure and control flow into the evaporator', 'Circulate refrigerant through the system'], correctAnswer: 2, explanation: 'The metering device (TXV or fixed orifice) drops refrigerant pressure and meters flow into the evaporator, enabling heat absorption.' },
  { id: 'rc-ext-02', question: 'Superheat is measured at which point in the refrigeration cycle?', options: ['Condenser outlet', 'Compressor inlet (suction line)', 'Metering device inlet', 'Receiver outlet'], correctAnswer: 1, explanation: 'Superheat is the temperature rise above saturation at the compressor suction — it confirms all liquid has evaporated before entering the compressor.' },
  { id: 'rc-ext-03', question: 'What does subcooling indicate in a refrigeration system?', options: ['Refrigerant is partially evaporated', 'Liquid refrigerant has been cooled below its condensing temperature', 'The compressor is overheating', 'The evaporator is flooded'], correctAnswer: 1, explanation: 'Subcooling confirms the refrigerant leaving the condenser is fully liquid and cooled below saturation — prevents flash gas at the metering device.' },
  { id: 'rc-ext-04', question: 'Which component absorbs heat from the conditioned space?', options: ['Compressor', 'Condenser', 'Evaporator', 'Receiver'], correctAnswer: 2, explanation: 'The evaporator absorbs heat from the air or space being cooled as low-pressure liquid refrigerant evaporates inside it.' },
  { id: 'rc-ext-05', question: 'What happens to refrigerant pressure as it passes through the compressor?', options: ['Pressure decreases', 'Pressure stays the same', 'Pressure increases', 'Pressure fluctuates randomly'], correctAnswer: 2, explanation: 'The compressor raises refrigerant pressure and temperature, moving it from the low-pressure suction side to the high-pressure discharge side.' },
  { id: 'rc-ext-06', question: 'A TXV (thermostatic expansion valve) senses which condition to modulate flow?', options: ['Condenser pressure', 'Suction line superheat', 'Compressor discharge temperature', 'Ambient temperature'], correctAnswer: 1, explanation: 'The TXV bulb senses suction line superheat and modulates the valve opening to maintain a set superheat, optimizing evaporator efficiency.' },
  { id: 'rc-ext-07', question: 'What is the saturation temperature of a refrigerant?', options: ['The temperature at which it freezes', 'The temperature at which it changes state at a given pressure', 'The maximum operating temperature', 'The temperature inside the compressor'], correctAnswer: 1, explanation: 'Saturation temperature is the boiling/condensing point at a specific pressure — it changes with pressure, which is why pressure-temperature charts are essential.' },
  { id: 'rc-ext-08', question: 'High head pressure in a system most commonly indicates:', options: ['Low refrigerant charge', 'Dirty or blocked condenser', 'Faulty metering device', 'Low ambient temperature'], correctAnswer: 1, explanation: 'A dirty or blocked condenser cannot reject heat efficiently, causing refrigerant to back up and head pressure to rise.' },
  { id: 'rc-ext-09', question: 'Low suction pressure typically indicates:', options: ['Overcharge of refrigerant', 'Restricted airflow across evaporator or low refrigerant charge', 'Condenser fan failure', 'Compressor running too fast'], correctAnswer: 1, explanation: 'Low suction pressure points to restricted evaporator airflow, a clogged filter, or undercharge — all reduce the refrigerant\'s ability to absorb heat.' },
  { id: 'rc-ext-10', question: 'Which refrigerant is classified as an HFC and is commonly used in residential air conditioning?', options: ['R-22', 'R-410A', 'R-11', 'R-123'], correctAnswer: 1, explanation: 'R-410A is an HFC blend that replaced R-22 in residential systems. It operates at higher pressures and has zero ozone depletion potential.' },
  { id: 'rc-ext-11', question: 'What does a pressure-enthalpy (P-H) diagram show?', options: ['Electrical load on the compressor', 'The thermodynamic state of refrigerant at each cycle point', 'Airflow through the duct system', 'Refrigerant toxicity levels'], correctAnswer: 1, explanation: 'A P-H diagram plots refrigerant state (pressure vs. enthalpy) at each cycle point, allowing technicians to calculate efficiency and diagnose problems.' },
  { id: 'rc-ext-12', question: 'What is the purpose of a liquid line filter-drier?', options: ['Increase refrigerant pressure', 'Remove moisture and contaminants from the refrigerant', 'Regulate superheat', 'Separate oil from refrigerant'], correctAnswer: 1, explanation: 'The filter-drier removes moisture and particulates that could cause acid formation, ice blockages, or valve damage.' },
  { id: 'rc-ext-13', question: 'Refrigerant migrates to the compressor crankcase during the off cycle because:', options: ['The compressor creates a vacuum', 'Refrigerant is attracted to oil and moves to the coldest point', 'The condenser fan pushes it there', 'The TXV opens fully'], correctAnswer: 1, explanation: 'Refrigerant is miscible with compressor oil and migrates to the crankcase (the coldest point) during off cycles — causing liquid slugging on startup if not managed.' },
  { id: 'rc-ext-14', question: 'What is the function of a crankcase heater?', options: ['Heat the discharge gas', 'Prevent refrigerant migration into compressor oil during off cycles', 'Warm the suction line', 'Defrost the evaporator'], correctAnswer: 1, explanation: 'A crankcase heater keeps the compressor oil warm during off cycles, preventing refrigerant from dissolving into the oil and causing liquid slugging on startup.' },
  { id: 'rc-ext-15', question: 'Which condition causes the evaporator to frost over completely?', options: ['High superheat', 'Adequate airflow with correct charge', 'Insufficient airflow or severely low refrigerant charge', 'High ambient temperature'], correctAnswer: 2, explanation: 'Complete evaporator frosting results from insufficient airflow (dirty filter, failed fan) or severe undercharge — both prevent adequate heat absorption.' },
];

// ── Module 6 (EPA 608 Core) exam extension — brings hvac-06-12 to 20q ─────────
export const EPA_608_CORE_QUIZ_EXT: QuizQuestion[] = [
  { id: 'epa-core-ext-01', question: 'Under Section 608, who is required to be certified to purchase refrigerants in containers larger than 2 lbs?', options: ['Anyone over 18', 'Only licensed contractors', 'EPA 608 certified technicians', 'OSHA certified workers'], correctAnswer: 2, explanation: 'EPA 608 certification is required to purchase refrigerants in containers larger than 2 lbs — this applies to all regulated refrigerants.' },
  { id: 'epa-core-ext-02', question: 'What is the maximum allowable leak rate for comfort cooling equipment over 50 lbs before repair is required?', options: ['5% per year', '10% per year', '15% per year', '25% per year'], correctAnswer: 2, explanation: 'EPA regulations require repair when leak rates exceed 15% per year for comfort cooling equipment containing more than 50 lbs of refrigerant.' },
  { id: 'epa-core-ext-03', question: 'Which refrigerant is classified as a CFC (chlorofluorocarbon)?', options: ['R-410A', 'R-134a', 'R-11', 'R-32'], correctAnswer: 2, explanation: 'R-11 (trichlorofluoromethane) is a CFC — it contains chlorine, fluorine, and carbon. CFCs have the highest ozone depletion potential.' },
  { id: 'epa-core-ext-04', question: 'What does the Montreal Protocol require?', options: ['Annual refrigerant leak testing', 'Phase-out of ozone-depleting substances globally', 'Mandatory EPA 608 certification for all HVAC workers', 'Minimum efficiency standards for HVAC equipment'], correctAnswer: 1, explanation: 'The Montreal Protocol is an international treaty requiring the phase-out of ozone-depleting substances, including CFCs and HCFCs.' },
  { id: 'epa-core-ext-05', question: 'Refrigerant recovery equipment manufactured after November 15, 1993 must be:', options: ['UL listed', 'EPA certified', 'ARI rated', 'ASHRAE approved'], correctAnswer: 1, explanation: 'Recovery equipment manufactured after November 15, 1993 must be certified by an EPA-approved equipment testing organization.' },
  { id: 'epa-core-ext-06', question: 'What is the purpose of reclaiming refrigerant?', options: ['To reuse it immediately on the same job', 'To restore it to ARI 700 purity standards for resale', 'To dispose of it safely', 'To mix it with virgin refrigerant'], correctAnswer: 1, explanation: 'Reclamation restores used refrigerant to ARI 700 purity standards — it must be sent to a certified reclaimer and can then be resold.' },
  { id: 'epa-core-ext-07', question: 'Which action is a violation of Section 608 regulations?', options: ['Recovering refrigerant before opening a system', 'Venting refrigerant intentionally to the atmosphere', 'Using certified recovery equipment', 'Repairing leaks within 30 days'], correctAnswer: 1, explanation: 'Intentional venting of refrigerants is a federal violation under Section 608. Fines can reach $44,539 per day per violation.' },
  { id: 'epa-core-ext-08', question: 'What is the ozone depletion potential (ODP) of R-410A?', options: ['1.0', '0.5', '0.05', '0'], correctAnswer: 3, explanation: 'R-410A has an ODP of zero — it contains no chlorine and does not deplete the ozone layer. However, it has a high global warming potential (GWP).' },
  { id: 'epa-core-ext-09', question: 'Before opening any refrigerant circuit, a technician must:', options: ['Obtain a work permit', 'Recover the refrigerant to the required vacuum level', 'Notify the EPA', 'Replace the filter-drier'], correctAnswer: 1, explanation: 'Refrigerant must be recovered before opening any system component — this is a federal requirement under Section 608.' },
  { id: 'epa-core-ext-10', question: 'Which document must be kept for three years after servicing equipment with more than 50 lbs of refrigerant?', options: ['OSHA incident report', 'Service record documenting refrigerant added or removed', 'Equipment warranty', 'Customer invoice only'], correctAnswer: 1, explanation: 'EPA requires service records documenting refrigerant quantities added or removed to be kept for at least three years for equipment over 50 lbs.' },
  { id: 'epa-core-ext-11', question: 'HFCs (hydrofluorocarbons) were introduced as refrigerant replacements primarily because they:', options: ['Are cheaper than CFCs', 'Have zero ozone depletion potential', 'Have lower global warming potential than CFCs', 'Are non-flammable in all concentrations'], correctAnswer: 1, explanation: 'HFCs contain no chlorine, giving them zero ODP. They were adopted to comply with the Montreal Protocol phase-out of ozone-depleting CFCs and HCFCs.' },
  { id: 'epa-core-ext-12', question: 'What is the AIM Act\'s primary impact on HVAC technicians?', options: ['Requires annual recertification', 'Phases down HFC production and use due to high GWP', 'Mandates new recovery equipment by 2025', 'Bans R-410A immediately'], correctAnswer: 1, explanation: 'The AIM Act (2020) authorizes EPA to phase down HFCs by 85% over 15 years due to their high global warming potential — technicians must transition to lower-GWP alternatives.' },
  { id: 'epa-core-ext-13', question: 'Which refrigerant is being phased out under the AIM Act due to its high GWP?', options: ['R-32', 'R-410A', 'R-454B', 'R-744'], correctAnswer: 1, explanation: 'R-410A has a GWP of 2,088 and is being phased down under the AIM Act. R-454B and R-32 are lower-GWP alternatives being adopted for new equipment.' },
  { id: 'epa-core-ext-14', question: 'What is the required response time to repair a leak in industrial process refrigeration equipment?', options: ['30 days', '120 days', 'Immediately', '1 year'], correctAnswer: 1, explanation: 'Industrial process refrigeration with leak rates exceeding 35% must be repaired within 120 days (or 180 days with an extension).' },
  { id: 'epa-core-ext-15', question: 'A technician who knowingly releases refrigerant can face civil penalties of up to:', options: ['$500 per violation', '$5,000 per violation', '$44,539 per day per violation', '$100 per pound released'], correctAnswer: 2, explanation: 'EPA can assess civil penalties of up to $44,539 per day per violation for knowing releases of refrigerant — criminal penalties also apply.' },
];

// ── Module 15 (Career Readiness) exam extension — brings hvac-15-05 to 20q ───
export const CAREER_READINESS_QUIZ_EXT: QuizQuestion[] = [
  { id: 'cr-ext-01', question: 'What should a resume for an entry-level HVAC technician emphasize?', options: ['Years of management experience', 'EPA 608 certification, OSHA 10, and any hands-on training', 'College GPA', 'Unrelated work history only'], correctAnswer: 1, explanation: 'Entry-level HVAC resumes should lead with certifications (EPA 608, OSHA 10), hands-on training, and any relevant technical skills.' },
  { id: 'cr-ext-02', question: 'During an HVAC job interview, when asked about a weakness, the best approach is:', options: ['Say you have no weaknesses', 'Describe a genuine area of growth and what you are doing to improve it', 'Refuse to answer', 'List multiple serious flaws'], correctAnswer: 1, explanation: 'Employers want self-awareness. Describe a real development area and pair it with concrete steps you are taking — this shows maturity and initiative.' },
  { id: 'cr-ext-03', question: 'What does a union apprenticeship typically offer compared to non-union employment?', options: ['Lower wages but more flexibility', 'Structured wage progression, benefits, and formal apprenticeship hours toward journeyman status', 'Faster path to master technician', 'No certification requirements'], correctAnswer: 1, explanation: 'Union apprenticeships (UA, IBEW) offer structured wage scales, health benefits, pension, and documented OJT hours required for journeyman licensing.' },
  { id: 'cr-ext-04', question: 'What is the primary purpose of a cover letter?', options: ['Repeat everything on the resume', 'Explain why you are a strong fit for this specific employer and role', 'List references', 'Describe your salary requirements'], correctAnswer: 1, explanation: 'A cover letter connects your specific skills and experience to the employer\'s needs — it should be tailored, not generic.' },
  { id: 'cr-ext-05', question: 'Which behavior is most important for maintaining employment as an HVAC technician?', options: ['Arriving exactly on time occasionally', 'Consistent punctuality, professional communication, and completing work correctly', 'Knowing the most advanced techniques immediately', 'Having the newest tools'], correctAnswer: 1, explanation: 'Employers consistently cite reliability, communication, and quality work as the top retention factors — technical skills can be developed, but professionalism is expected from day one.' },
  { id: 'cr-ext-06', question: 'What does NATE certification demonstrate to employers?', options: ['You completed an apprenticeship', 'Verified technical knowledge across HVAC specialties through third-party testing', 'You have 10 years of experience', 'You are licensed to pull permits'], correctAnswer: 1, explanation: 'NATE (North American Technician Excellence) is the industry\'s premier third-party certification — it signals verified competency and is valued by residential and commercial employers.' },
  { id: 'cr-ext-07', question: 'When a customer complains about a repair you completed, the professional response is:', options: ['Argue that the repair was correct', 'Listen, acknowledge their concern, and offer to return to assess the issue', 'Ignore the complaint', 'Blame the equipment manufacturer'], correctAnswer: 1, explanation: 'Customer service is part of the job. Listening without defensiveness and offering to resolve the issue protects your reputation and the company\'s relationship with the customer.' },
  { id: 'cr-ext-08', question: 'What is the purpose of maintaining a professional portfolio as an HVAC technician?', options: ['Required by EPA regulations', 'Documents certifications, completed projects, and skills for career advancement', 'Required for union membership', 'Replaces the need for references'], correctAnswer: 1, explanation: 'A portfolio of certifications, training records, and project documentation supports promotions, wage negotiations, and job applications throughout your career.' },
  { id: 'cr-ext-09', question: 'Which of the following is a red flag during a job offer negotiation?', options: ['Employer asks about your certifications', 'Employer refuses to provide a written offer or job description', 'Employer asks for references', 'Employer discusses benefits'], correctAnswer: 1, explanation: 'Legitimate employers provide written offers. Refusing to document terms is a warning sign of wage theft, misclassification, or unstable employment.' },
  { id: 'cr-ext-10', question: 'What does "misclassification as an independent contractor" mean for a worker?', options: ['You get paid more', 'You lose employee protections, benefits, and the employer avoids payroll taxes', 'You have more flexibility with no downside', 'It is required for HVAC work'], correctAnswer: 1, explanation: 'Misclassification denies workers unemployment insurance, workers\' comp, overtime protections, and employer tax contributions — it is illegal when the work relationship is actually employment.' },
  { id: 'cr-ext-11', question: 'What is the best way to handle a situation where you are unsure how to complete a repair on the job?', options: ['Guess and proceed', 'Tell the customer you cannot help them', 'Contact your supervisor or a more experienced technician before proceeding', 'Skip the repair and move on'], correctAnswer: 2, explanation: 'Asking for guidance is professional and prevents costly mistakes. Experienced technicians and supervisors expect new technicians to ask questions.' },
  { id: 'cr-ext-12', question: 'Which document proves you are legally authorized to work in the United States for I-9 purposes?', options: ['Social Security card alone', 'A List A document (passport or Employment Authorization Card) OR List B + List C documents combined', 'Driver\'s license alone', 'Birth certificate alone'], correctAnswer: 1, explanation: 'I-9 verification requires either one List A document (passport, EAD) or a combination of List B (identity) and List C (work authorization) documents.' },
  { id: 'cr-ext-13', question: 'What is the purpose of a 90-day probationary period at a new employer?', options: ['To delay benefits permanently', 'To allow both parties to assess fit before full employment terms apply', 'Required by federal law', 'To reduce your pay permanently'], correctAnswer: 1, explanation: 'Probationary periods let employers assess performance and let employees evaluate the workplace — most benefits and full protections apply after this period.' },
  { id: 'cr-ext-14', question: 'Which professional organization provides networking and continuing education for HVAC technicians?', options: ['ABA (American Bar Association)', 'ACCA (Air Conditioning Contractors of America)', 'AMA (American Medical Association)', 'AICPA'], correctAnswer: 1, explanation: 'ACCA is the primary trade association for HVAC contractors and technicians — it offers training, certification, and industry networking.' },
  { id: 'cr-ext-15', question: 'What is the most effective way to advance from apprentice to journeyman technician?', options: ['Wait for automatic promotion after 5 years', 'Accumulate documented OJT hours, pass licensing exams, and pursue additional certifications', 'Change employers frequently', 'Focus only on residential work'], correctAnswer: 1, explanation: 'Journeyman advancement requires documented OJT hours (typically 8,000 in Indiana), passing the journeyman exam, and often additional certifications like NATE.' },
];

// ── Module 16 (Capstone) exam extension — brings hvac-16-05 to 20q ────────────
export const CAPSTONE_QUIZ_EXT: QuizQuestion[] = [
  { id: 'cap-ext-01', question: 'What is the primary purpose of the capstone project in this program?', options: ['To earn additional college credits', 'To demonstrate integrated competency across all program modules', 'To replace the EPA 608 exam', 'To satisfy OSHA requirements'], correctAnswer: 1, explanation: 'The capstone integrates skills from all 16 modules — it demonstrates that you can apply technical knowledge, safety practices, and professional skills in a real-world scenario.' },
  { id: 'cap-ext-02', question: 'Which credential must be earned before program completion?', options: ['NATE Core', 'EPA 608 Universal', 'CompTIA A+', 'NCCER Level 2'], correctAnswer: 1, explanation: 'EPA 608 Universal is the primary credential target of this program — it is federally required to handle refrigerants and is the gateway to employment.' },
  { id: 'cap-ext-03', question: 'What does a program completion certificate from Elevate for Humanity document?', options: ['A college degree', 'Completion of an ETPL-eligible workforce training program with specific competencies', 'A state contractor license', 'OSHA 30 certification'], correctAnswer: 1, explanation: 'The completion certificate documents ETPL-eligible training, competencies earned, and credentials achieved — it supports WIOA reporting and employer verification.' },
  { id: 'cap-ext-04', question: 'After completing this program, what is the recommended next step for career advancement?', options: ['Immediately open your own HVAC company', 'Secure an apprentice technician position and begin accumulating OJT hours toward journeyman status', 'Return to school for a 4-year degree', 'Wait for employers to contact you'], correctAnswer: 1, explanation: 'The immediate next step is employment as an apprentice technician — accumulating documented OJT hours is required for journeyman licensing in Indiana.' },
  { id: 'cap-ext-05', question: 'Which agency administers the ETPL (Eligible Training Provider List) in Indiana?', options: ['IRS', 'Indiana Department of Workforce Development (DWD)', 'Indiana Department of Education', 'OSHA'], correctAnswer: 1, explanation: 'Indiana DWD administers the ETPL — programs on this list are approved to receive WIOA funding for eligible students.' },
  { id: 'cap-ext-06', question: 'What does WIOA funding cover for eligible students?', options: ['Living expenses only', 'Tuition, materials, exam fees, and supportive services for eligible participants', 'Only the EPA 608 exam fee', 'Transportation costs only'], correctAnswer: 1, explanation: 'WIOA Individual Training Accounts (ITAs) can cover tuition, books, materials, exam fees, and supportive services like transportation and childcare for eligible participants.' },
  { id: 'cap-ext-07', question: 'A graduate who wants to specialize in commercial refrigeration should pursue which additional certification?', options: ['OSHA 30', 'EPA 608 Type II or Universal plus NATE Commercial Refrigeration', 'CompTIA Network+', 'CDL Class A'], correctAnswer: 1, explanation: 'Commercial refrigeration specialization builds on EPA 608 with NATE Commercial Refrigeration certification and hands-on experience with larger systems.' },
  { id: 'cap-ext-08', question: 'What is the purpose of the program exit interview?', options: ['To determine final grades', 'To document outcomes, identify barriers, and connect graduates to employment resources', 'To collect tuition balance', 'To assign OSHA violations'], correctAnswer: 1, explanation: 'Exit interviews document employment outcomes for WIOA reporting, identify any remaining barriers, and connect graduates to job placement resources.' },
  { id: 'cap-ext-09', question: 'Which of the following best describes a "performance outcome" for WIOA reporting?', options: ['Attendance percentage', 'Employment, credential attainment, or measurable skill gain after program exit', 'Quiz scores during training', 'Number of labs completed'], correctAnswer: 1, explanation: 'WIOA performance outcomes include employment at exit, credential attainment, median earnings, and measurable skill gains — these are reported to the state and federal government.' },
  { id: 'cap-ext-10', question: 'What is the significance of being on the ETPL for Elevate for Humanity?', options: ['It allows the school to issue college degrees', 'It authorizes the program to receive WIOA funding for eligible students', 'It exempts the program from state oversight', 'It guarantees employment for all graduates'], correctAnswer: 1, explanation: 'ETPL status authorizes Elevate to receive WIOA Individual Training Account funding — students can use their ITA to pay for the program at no out-of-pocket cost.' },
  { id: 'cap-ext-11', question: 'What should a graduate do if they cannot find employment within 30 days of program completion?', options: ['Re-enroll in the program', 'Contact the career services team and their WorkOne case manager for job placement support', 'Give up and pursue a different field', 'Wait indefinitely'], correctAnswer: 1, explanation: 'Career services and WorkOne case managers have employer connections and job placement resources — graduates should actively use these supports.' },
  { id: 'cap-ext-12', question: 'Which document should a graduate keep permanently as proof of training?', options: ['Only the final quiz score', 'Program completion certificate, EPA 608 certificate, and OSHA 10 card', 'Attendance records only', 'The enrollment agreement only'], correctAnswer: 1, explanation: 'Graduates should retain all credential documents permanently — EPA 608 certificates, OSHA cards, and program completion certificates are required for employment verification.' },
  { id: 'cap-ext-13', question: 'What is the Indiana journeyman HVAC license requirement for supervised work hours?', options: ['1,000 hours', '4,000 hours', '8,000 hours', '2,000 hours'], correctAnswer: 2, explanation: 'Indiana requires approximately 8,000 hours of supervised work experience (about 4 years) plus passing the journeyman exam for HVAC licensure.' },
  { id: 'cap-ext-14', question: 'Which employer type is most likely to sponsor an apprentice for journeyman licensing?', options: ['Retail stores', 'Established HVAC contractors with union or registered apprenticeship programs', 'Government agencies only', 'Manufacturers only'], correctAnswer: 1, explanation: 'Established HVAC contractors — especially those with union affiliations or DOL-registered apprenticeship programs — are most likely to sponsor and document OJT hours.' },
  { id: 'cap-ext-15', question: 'What is the best way to maintain your EPA 608 certification after earning it?', options: ['Retake the exam every year', 'EPA 608 does not expire — keep your certificate in a safe place', 'Pay an annual renewal fee', 'Complete 10 hours of continuing education annually'], correctAnswer: 1, explanation: 'EPA 608 certification does not expire and requires no renewal — keep your original certificate safe as it is required for employment and refrigerant purchases.' },
];

export const HVAC_FINAL_EXAM: QuizQuestion[] = [
  // Refrigeration Fundamentals (Q1–5)
  { id: 'final-01', question: 'The refrigeration cycle moves heat by exploiting:', options: ['Electrical resistance', 'Refrigerant phase changes between liquid and vapor', 'Combustion', 'Magnetic fields'], correctAnswer: 1, explanation: 'Refrigerants absorb large amounts of latent heat when evaporating and release it when condensing.' },
  { id: 'final-02', question: 'The four main components of the refrigeration cycle in order are:', options: ['Compressor→Evaporator→Condenser→Metering', 'Evaporator→Compressor→Condenser→Metering', 'Condenser→Compressor→Evaporator→Metering', 'Metering→Compressor→Condenser→Evaporator'], correctAnswer: 1, explanation: 'Evaporator (absorb heat) → Compressor (raise pressure) → Condenser (reject heat) → Metering device (drop pressure).' },
  { id: 'final-03', question: 'Superheat is defined as:', options: ['Temperature above ambient', 'Vapor temperature above saturation temperature at a given pressure', 'Temperature of liquid below saturation', 'Discharge minus suction temperature'], correctAnswer: 1, explanation: 'Superheat = actual vapor temperature minus saturation temperature at that pressure. Ensures no liquid reaches the compressor.' },
  { id: 'final-04', question: 'Subcooling is defined as:', options: ['Vapor temperature below saturation', 'Liquid temperature below saturation temperature at a given pressure', 'Suction line temperature', 'Condenser inlet temperature'], correctAnswer: 1, explanation: 'Subcooling = saturation temperature at condenser pressure minus actual liquid temperature. Ensures solid liquid at the metering device.' },
  { id: 'final-05', question: 'Heat always flows from:', options: ['Cold to hot', 'Hot to cold', 'High pressure to low pressure', 'Wet to dry'], correctAnswer: 1, explanation: 'Second Law of Thermodynamics: heat always flows from warmer to cooler objects.' },

  // EPA 608 Regulations (Q6–10)
  { id: 'final-06', question: 'EPA Section 608 certification is required to:', options: ['Install ductwork', 'Purchase and handle regulated refrigerants', 'Change air filters', 'Wire a thermostat'], correctAnswer: 1, explanation: 'Section 608 requires certification to purchase refrigerants in containers larger than 2 lbs and to service refrigerant-containing equipment.' },
  { id: 'final-07', question: 'Intentionally venting refrigerant to the atmosphere is:', options: ['Permitted for small amounts', 'A federal violation with penalties up to $44,539 per day', 'Only prohibited for CFCs', 'Permitted if the system is being retired'], correctAnswer: 1, explanation: 'The Clean Air Act prohibits knowing venting of any regulated refrigerant. Penalties up to $44,539 per day per violation.' },
  { id: 'final-08', question: 'Recovery means:', options: ['Cleaning refrigerant to ARI 700 standards', 'Removing refrigerant from a system into an external container', 'Reusing refrigerant in the same system', 'Destroying refrigerant'], correctAnswer: 1, explanation: 'Recovery removes refrigerant from a system into an approved recovery cylinder.' },
  { id: 'final-09', question: 'R-410A has zero ODP because:', options: ['It contains chlorine', 'It is an HFC — contains no chlorine or bromine', 'It was banned under the Montreal Protocol', 'It has a low boiling point'], correctAnswer: 1, explanation: 'R-410A is an HFC. HFCs contain no chlorine or bromine, so they have zero ozone depletion potential.' },
  { id: 'final-10', question: 'Recovery cylinders must not be filled beyond:', options: ['50% capacity', '60% capacity', '80% capacity by weight', '100% capacity'], correctAnswer: 2, explanation: 'Recovery cylinders must not exceed 80% of capacity by weight to allow for thermal expansion.' },

  // Electrical (Q11–15)
  { id: 'final-11', question: 'Ohm\'s Law: a 240V circuit with 20Ω resistance draws:', options: ['4,800A', '220A', '12A', '260A'], correctAnswer: 2, explanation: 'I = V ÷ R = 240 ÷ 20 = 12A.' },
  { id: 'final-12', question: 'The "Y" thermostat terminal controls:', options: ['Heat', 'Fan only', 'Cooling (compressor contactor)', 'Emergency heat'], correctAnswer: 2, explanation: 'Y energizes the cooling circuit — signals the outdoor unit contactor to start the compressor and condenser fan.' },
  { id: 'final-13', question: 'A run capacitor improves motor efficiency by:', options: ['Increasing voltage', 'Providing a phase-shifted current to create a rotating magnetic field', 'Reducing amperage draw', 'Storing energy for starting'], correctAnswer: 1, explanation: 'Run capacitors shift current phase in the start winding, creating a rotating magnetic field that keeps single-phase motors running efficiently.' },
  { id: 'final-14', question: 'Before servicing any electrical component, you must:', options: ['Turn off the thermostat only', 'De-energize and lock out / tag out the equipment', 'Wear rubber boots only', 'Call the utility company'], correctAnswer: 1, explanation: 'LOTO ensures equipment cannot be energized while you are working on it — a life-safety requirement.' },
  { id: 'final-15', question: 'A GFCI outlet protects against:', options: ['Overloads', 'Short circuits', 'Ground faults that can cause electrocution', 'Voltage surges'], correctAnswer: 2, explanation: 'GFCI detects small current imbalances indicating a ground fault and trips in milliseconds.' },

  // Heating Systems (Q16–20)
  { id: 'final-16', question: 'A cracked heat exchanger is dangerous because:', options: ['It reduces efficiency slightly', 'CO can enter the conditioned airstream', 'It causes short cycling only', 'It increases gas pressure'], correctAnswer: 1, explanation: 'A cracked heat exchanger allows carbon monoxide — odorless and deadly — to mix with conditioned air.' },
  { id: 'final-17', question: 'A gas furnace that ignites then shuts off after a few seconds most likely has:', options: ['A gas pressure problem', 'A dirty or failed flame sensor', 'A cracked heat exchanger', 'A bad thermostat'], correctAnswer: 1, explanation: 'Ignites then shuts off = flame sensor not proving the flame. Clean the flame sensor — most common cause.' },
  { id: 'final-18', question: 'Heat pump COP of 3 means:', options: ['30% efficient', '3 units of heat per unit of electricity consumed', '3x more expensive than gas', '300% less efficient than resistance heat'], correctAnswer: 1, explanation: 'COP = heat output ÷ electrical input. COP 3 = 300% efficient — 3 units of heat per unit of electricity.' },
  { id: 'final-19', question: 'The reversing valve in a heat pump switches:', options: ['Compressor speed', 'Refrigerant flow direction between heating and cooling modes', 'Auxiliary heat on/off', 'Fan speed'], correctAnswer: 1, explanation: 'The reversing valve redirects refrigerant flow, making the outdoor coil the evaporator (heating) or condenser (cooling).' },
  { id: 'final-20', question: 'Heat pump defrost mode temporarily switches to:', options: ['Higher heating capacity', 'Cooling mode to melt frost from the outdoor coil', 'Fan-only mode', 'Emergency heat only'], correctAnswer: 1, explanation: 'Defrost reverses the cycle so the outdoor coil becomes the condenser, melting frost with hot refrigerant.' },

  // Diagnostics and Charging (Q21–27)
  { id: 'final-21', question: 'High head pressure and low suction pressure together indicates:', options: ['Overcharge', 'Restriction in the liquid line, metering device, or dirty condenser', 'Normal operation', 'Undercharge only'], correctAnswer: 1, explanation: 'Low suction + high head = restriction. Refrigerant is trapped on the high side and starved on the low side.' },
  { id: 'final-22', question: 'Both high suction and high head pressure indicates:', options: ['Undercharge', 'Overcharge or non-condensables', 'Restriction', 'Normal at high load'], correctAnswer: 1, explanation: 'Both pressures high = overcharge or non-condensables in the system.' },
  { id: 'final-23', question: 'TXV systems are charged by:', options: ['Superheat method', 'Subcooling method', 'Weight method only', 'Sight glass only'], correctAnswer: 1, explanation: 'TXV systems are charged by subcooling — target typically 10–15°F at the liquid line.' },
  { id: 'final-24', question: 'Bubbles in the liquid line sight glass indicate:', options: ['Normal operation', 'Low refrigerant charge or restriction upstream of the sight glass', 'Overcharge', 'Air in the system only'], correctAnswer: 1, explanation: 'Bubbles mean flash gas is forming — the charge is low or there is a restriction causing pressure drop.' },
  { id: 'final-25', question: 'The target evacuation level for most HVAC systems is:', options: ['29 in. Hg', '500 microns or below', '1,000 microns', '0 psig'], correctAnswer: 1, explanation: '500 microns (0.5 mm Hg absolute) indicates adequate moisture removal and absence of non-condensables.' },
  { id: 'final-26', question: 'A frozen evaporator coil is most commonly caused by:', options: ['Overcharge', 'Low airflow or low refrigerant charge', 'High ambient temperature', 'Dirty condenser'], correctAnswer: 1, explanation: 'Low airflow (dirty filter, closed registers) or low charge causes coil temperature to drop below 32°F.' },
  { id: 'final-27', question: 'Non-condensable gases are identified by:', options: ['Low head pressure', 'Head pressure higher than the PT chart predicts for the condensing temperature', 'Low superheat', 'High subcooling'], correctAnswer: 1, explanation: 'Non-condensables raise head pressure above what the PT chart predicts at the measured condensing temperature.' },

  // Airflow and Duct Systems (Q28–30)
  { id: 'final-28', question: 'Total external static pressure (TESP) is measured:', options: ['At the supply plenum only', 'Across the air handler — supply plenum minus return plenum', 'At each register', 'At the outdoor unit'], correctAnswer: 1, explanation: 'TESP = supply plenum pressure minus return plenum pressure — the total resistance the blower must overcome.' },
  { id: 'final-29', question: 'Mastic sealant is preferred over duct tape for sealing because:', options: ['It is cheaper', 'It remains flexible and adheres permanently — duct tape fails within years', 'It is easier to apply', 'It is required by code only'], correctAnswer: 1, explanation: 'Mastic bonds permanently and stays flexible. Standard duct tape dries out and fails within 1–5 years.' },
  { id: 'final-30', question: 'A MERV 13 filter captures particles as small as:', options: ['10 microns only', '0.3–1.0 microns including bacteria and smoke', '100 microns only', 'No particles under 5 microns'], correctAnswer: 1, explanation: 'MERV 13 captures 50%+ of particles 0.3–1.0 microns — including bacteria, smoke, and fine dust.' },

  // OSHA and Safety (Q31–34)
  { id: 'final-31', question: 'The "Fatal Four" in construction are:', options: ['Cuts, burns, falls, electrocution', 'Falls, struck-by, caught-in/between, and electrocution', 'Falls, heat stroke, chemical exposure, noise', 'Electrocution, fire, explosion, falls'], correctAnswer: 1, explanation: 'OSHA\'s Fatal Four account for over 60% of construction deaths.' },
  { id: 'final-32', question: 'Each worker performing LOTO must:', options: ['Share one lock with the crew', 'Apply their own personal lock to the energy isolation point', 'Only sign the tag', 'Rely on the supervisor\'s lock'], correctAnswer: 1, explanation: 'Each worker applies their own lock. No one can remove another person\'s lock.' },
  { id: 'final-33', question: 'A2L refrigerants (R-32, R-454B) require:', options: ['No special precautions', 'Elimination of ignition sources, proper ventilation, and A2L-rated tools', 'Only a fire extinguisher nearby', 'OSHA permit only'], correctAnswer: 1, explanation: 'A2L refrigerants are mildly flammable. Eliminate ignition sources and ensure proper ventilation.' },
  { id: 'final-34', question: 'The confined space attendant must:', options: ['Enter to help if needed', 'Stay outside, monitor entrants and conditions, and initiate rescue if needed', 'Test the atmosphere inside', 'Operate rescue equipment inside'], correctAnswer: 1, explanation: 'The attendant stays outside at all times — they monitor and initiate rescue but never enter the space.' },

  // Career and Professionalism (Q35–37)
  { id: 'final-35', question: 'The first step in systematic troubleshooting is:', options: ['Replace the most common failed part', 'Verify the customer complaint and gather operating data', 'Check refrigerant charge', 'Call technical support'], correctAnswer: 1, explanation: 'Always verify the complaint first. Then gather data, form a hypothesis, test, repair, and verify the fix.' },
  { id: 'final-36', question: 'After completing a repair, the technician must:', options: ['Leave immediately', 'Verify the repair solved the complaint and system is operating within spec', 'Only check the thermostat', 'File paperwork only'], correctAnswer: 1, explanation: 'Always verify the repair: confirm the complaint is resolved and check operating parameters.' },
  { id: 'final-37', question: 'EPA 608 certification, once earned, is:', options: ['Valid for 2 years', 'Valid for 5 years', 'Lifetime — it does not expire', 'Valid until you change employers'], correctAnswer: 2, explanation: 'EPA 608 certification does not expire. Once earned, it is valid for life.' },

  // EPA 608 Type-specific (Q38–40)
  { id: 'final-38', question: 'Type I certification covers appliances with:', options: ['More than 50 lbs of refrigerant', '5 lbs or less of refrigerant', 'Only R-22 systems', 'Commercial refrigeration only'], correctAnswer: 1, explanation: 'Type I covers small appliances — household refrigerators, window ACs, and similar equipment with 5 lbs or less.' },
  { id: 'final-39', question: 'Type III certification covers systems using:', options: ['High-pressure refrigerants', 'Low-pressure refrigerants that operate below atmospheric pressure', 'Small appliances', 'All refrigerant types'], correctAnswer: 1, explanation: 'Type III covers low-pressure chillers using R-11, R-113, or R-123 — these operate below atmospheric pressure.' },
  { id: 'final-40', question: 'Universal EPA 608 certification requires passing:', options: ['Core only', 'Core and Type II only', 'Core plus all three Type exams (I, II, and III)', 'Any two Type exams'], correctAnswer: 2, explanation: 'Universal certification requires passing Core plus all three Type exams — it covers all refrigerant-containing equipment.' },
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
  "hvac-01-04": [...ORIENTATION_QUIZ, ...ORIENTATION_QUIZ_EXT],

  // ── Module 2: HVAC Fundamentals ──
  "hvac-02-01": QUIZ_02_01,
  "hvac-02-02": QUIZ_02_02,
  "hvac-02-03": QUIZ_02_03,
  "hvac-02-04": QUIZ_02_04,
  "hvac-02-05": [...HVAC_FUNDAMENTALS_QUIZ, ...HVAC_FUNDAMENTALS_QUIZ_EXT],

  // ── Module 3: Electrical Basics ──
  "hvac-03-01": QUIZ_03_01,
  "hvac-03-02": QUIZ_03_02,
  "hvac-03-03": QUIZ_03_03,
  "hvac-03-04": QUIZ_03_04,
  "hvac-03-05": [...ELECTRICAL_BASICS_QUIZ, ...ELECTRICAL_BASICS_QUIZ_EXT],

  // ── Module 4: Heating Systems ──
  "hvac-04-01": QUIZ_04_01,
  "hvac-04-02": QUIZ_04_02,
  "hvac-04-03": QUIZ_04_03,
  "hvac-04-04": QUIZ_04_04,
  "hvac-04-05": QUIZ_04_05,
  "hvac-04-06": [...HEATING_SYSTEMS_QUIZ, ...HEATING_SYSTEMS_QUIZ_EXT],

  // ── Module 5: Refrigeration Cycle ──
  "hvac-05-01": QUIZ_05_01,
  "hvac-05-02": QUIZ_05_02,
  "hvac-05-03": QUIZ_05_03,
  "hvac-05-04": QUIZ_05_04,
  "hvac-05-05": QUIZ_05_05,
  "hvac-05-06": [...QUIZ_05_06, ...REFRIGERATION_CYCLE_QUIZ_EXT],

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
  "hvac-06-12": [...QUIZ_06_12, ...EPA_608_CORE_QUIZ_EXT],

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
  "hvac-10-07": [...COOLING_SYSTEMS_QUIZ, ...COOLING_SYSTEMS_QUIZ_EXT],

  // ── Module 11: Controls and Thermostats ──
  "hvac-11-01": QUIZ_11_01,
  "hvac-11-02": QUIZ_11_02,
  "hvac-11-03": QUIZ_11_03,
  "hvac-11-04": QUIZ_11_04,
  "hvac-11-05": [...REFRIGERATION_DIAGNOSTICS_QUIZ, ...REFRIGERATION_DIAGNOSTICS_QUIZ_EXT],

  // ── Module 12: Heat Pumps ──
  "hvac-12-01": QUIZ_12_01,
  "hvac-12-02": QUIZ_12_02,
  "hvac-12-03": QUIZ_12_03,
  "hvac-12-04": QUIZ_12_04,
  "hvac-12-05": QUIZ_12_05,
  "hvac-12-06": [...INSTALLATION_QUIZ, ...INSTALLATION_QUIZ_EXT],

  // ── Module 13: Troubleshooting ──
  "hvac-13-01": QUIZ_13_01,
  "hvac-13-02": QUIZ_13_02,
  "hvac-13-03": QUIZ_13_03,
  "hvac-13-04": QUIZ_13_04,
  "hvac-13-05": QUIZ_13_05,
  "hvac-13-06": [...TROUBLESHOOTING_QUIZ, ...TROUBLESHOOTING_QUIZ_EXT],

  // ── Module 14: OSHA 10-Hour Safety ──
  "hvac-14-01": QUIZ_14_01,
  "hvac-14-02": QUIZ_14_02,
  "hvac-14-03": QUIZ_14_03,
  "hvac-14-04": QUIZ_14_04,
  "hvac-14-05": QUIZ_14_05,
  "hvac-14-06": QUIZ_14_06,
  "hvac-14-07": QUIZ_14_07,
  "hvac-14-08": [...OSHA_30_QUIZ, ...OSHA_30_QUIZ_EXT],

  // ── Module 15: Career Readiness ──
  "hvac-15-01": QUIZ_15_01,
  "hvac-15-02": QUIZ_15_02,
  "hvac-15-03": QUIZ_15_03,
  "hvac-15-04": QUIZ_15_04,
  "hvac-15-05": [...QUIZ_15_05, ...CAREER_READINESS_QUIZ_EXT],

  // ── Module 16: Capstone ──
  "hvac-16-01": [...EPA_608_CORE, ...EPA_608_TYPE_I, ...EPA_608_TYPE_II, ...EPA_608_TYPE_III],
  "hvac-16-02": HVAC_FINAL_EXAM,
  "hvac-16-03": QUIZ_16_03,
  "hvac-16-04": QUIZ_16_04,
  "hvac-16-05": [...QUIZ_16_05, ...CAPSTONE_QUIZ_EXT],
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


