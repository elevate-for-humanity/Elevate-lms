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

// ── EPA 608 Core (75 questions) ─────────────────────────────────────────

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
  // ── Core questions 26–75 ──────────────────────────────────────────────
  { id: "epa-core-26", question: "Which refrigerant has zero ozone depletion potential AND zero global warming potential?", options: ["R-410A", "R-22", "R-744 (CO2)", "R-134a"], correctAnswer: 2, explanation: "R-744 (CO2) has ODP of 0 and GWP of 1 (the baseline). It is used in transcritical refrigeration systems." },
  { id: "epa-core-27", question: "The Kigali Amendment to the Montreal Protocol targets the phase-down of:", options: ["CFCs", "HCFCs", "HFCs", "HFOs"], correctAnswer: 2, explanation: "The 2016 Kigali Amendment added HFCs to the Montreal Protocol phase-down schedule due to their high global warming potential." },
  { id: "epa-core-28", question: "What does GWP stand for?", options: ["Gas Weight Potential", "Global Warming Potential", "Greenhouse Water Pressure", "Gas Vent Prohibition"], correctAnswer: 1, explanation: "GWP (Global Warming Potential) measures how much heat a greenhouse gas traps relative to CO2 over 100 years." },
  { id: "epa-core-29", question: "R-32 is classified as what ASHRAE safety group?", options: ["A1", "A2L", "B1", "A3"], correctAnswer: 1, explanation: "R-32 is A2L — low toxicity, mildly flammable. A2L refrigerants require special handling to eliminate ignition sources." },
  { id: "epa-core-30", question: "Which of the following is an A2L (mildly flammable) refrigerant?", options: ["R-22", "R-410A", "R-454B", "R-123"], correctAnswer: 2, explanation: "R-454B (Opteon XL41) is an A2L refrigerant and a leading replacement for R-410A in new residential equipment." },
  { id: "epa-core-31", question: "The stratospheric ozone layer is located approximately how far above Earth's surface?", options: ["1–5 miles", "6–30 miles", "50–100 miles", "100–200 miles"], correctAnswer: 1, explanation: "The stratospheric ozone layer is located roughly 6–30 miles (10–50 km) above Earth's surface." },
  { id: "epa-core-32", question: "Which organization sets the ARI 700 purity standard for reclaimed refrigerants?", options: ["EPA", "OSHA", "AHRI (formerly ARI)", "ASHRAE"], correctAnswer: 2, explanation: "AHRI (Air-Conditioning, Heating, and Refrigeration Institute, formerly ARI) sets the 700 standard for reclaimed refrigerant purity." },
  { id: "epa-core-33", question: "A technician who purchases refrigerant for resale must:", options: ["Have no special certification", "Be EPA 608 certified", "Hold a contractor's license only", "Register with OSHA"], correctAnswer: 1, explanation: "Anyone purchasing refrigerant — including for resale — must be EPA 608 certified." },
  { id: "epa-core-34", question: "What is the ASHRAE safety classification for R-410A?", options: ["A1", "A2L", "B1", "A3"], correctAnswer: 0, explanation: "R-410A is classified A1 — low toxicity, non-flammable. It is safe to handle under normal conditions." },
  { id: "epa-core-35", question: "Refrigerant containers must be labeled with:", options: ["Only the refrigerant name", "Refrigerant type, pressure, and hazard warnings", "Only the manufacturer name", "No labeling is required"], correctAnswer: 1, explanation: "Refrigerant containers must be properly labeled with the refrigerant type, pressure rating, and appropriate hazard warnings." },
  { id: "epa-core-36", question: "Which of the following is NOT a CFC refrigerant?", options: ["R-11", "R-12", "R-22", "R-113"], correctAnswer: 2, explanation: "R-22 is an HCFC (hydrochlorofluorocarbon), not a CFC. R-11, R-12, and R-113 are all CFCs." },
  { id: "epa-core-37", question: "The term 'azeotrope' describes a refrigerant blend that:", options: ["Separates into components at different pressures", "Behaves like a single compound and does not fractionate", "Has zero ODP", "Contains only one chemical compound"], correctAnswer: 1, explanation: "Azeotropic blends (like R-502) behave as a single substance — they do not fractionate (separate) during normal operation." },
  { id: "epa-core-38", question: "A zeotropic refrigerant blend:", options: ["Does not change composition during phase change", "Has components that evaporate and condense at different rates (temperature glide)", "Is always an HFC", "Cannot be recovered"], correctAnswer: 1, explanation: "Zeotropic blends (like R-407C, R-410A) exhibit temperature glide — components change proportion during phase change." },
  { id: "epa-core-39", question: "What is temperature glide?", options: ["The difference between suction and discharge temperature", "The range of temperatures over which a zeotropic blend changes phase", "The rate of temperature change during startup", "The difference between indoor and outdoor temperature"], correctAnswer: 1, explanation: "Temperature glide is the difference between the bubble point and dew point of a zeotropic blend during phase change." },
  { id: "epa-core-40", question: "Refrigerant that has been recovered and not yet processed is called:", options: ["Reclaimed refrigerant", "Recycled refrigerant", "Recovered refrigerant", "Virgin refrigerant"], correctAnswer: 2, explanation: "Recovered refrigerant has been removed from a system but not yet cleaned or tested. It may be recycled or sent for reclamation." },
  { id: "epa-core-41", question: "Which refrigerant is used in most modern motor vehicle air conditioning systems?", options: ["R-12", "R-22", "R-134a", "R-410A"], correctAnswer: 2, explanation: "R-134a replaced R-12 in automotive AC systems. Newer vehicles are transitioning to R-1234yf." },
  { id: "epa-core-42", question: "R-1234yf is classified as:", options: ["A1 — non-flammable", "A2L — mildly flammable", "A3 — highly flammable", "B1 — toxic"], correctAnswer: 1, explanation: "R-1234yf is A2L — mildly flammable with very low GWP (4). It is the primary automotive AC refrigerant in new vehicles." },
  { id: "epa-core-43", question: "The EPA's SNAP (Significant New Alternatives Policy) program:", options: ["Regulates refrigerant recovery equipment", "Evaluates and lists acceptable substitutes for ozone-depleting substances", "Sets energy efficiency standards", "Certifies HVAC technicians"], correctAnswer: 1, explanation: "SNAP evaluates substitutes for ozone-depleting substances and lists acceptable alternatives for various end uses." },
  { id: "epa-core-44", question: "What is the purpose of a refrigerant identifier?", options: ["Measure system pressure", "Identify refrigerant type and detect contamination or non-condensables", "Measure refrigerant weight", "Test for leaks"], correctAnswer: 1, explanation: "A refrigerant identifier analyzes the refrigerant in a system to confirm its type and detect contamination or mixed refrigerants." },
  { id: "epa-core-45", question: "Mixing different refrigerants in a recovery cylinder is:", options: ["Acceptable if they are both HFCs", "Prohibited — it creates a contaminated blend that cannot be reclaimed", "Required for proper recovery", "Acceptable with manufacturer approval"], correctAnswer: 1, explanation: "Never mix refrigerants in a recovery cylinder. Contaminated blends cannot be reclaimed and must be destroyed at significant cost." },
  { id: "epa-core-46", question: "The DOT classification for refrigerant cylinders requires them to meet:", options: ["OSHA 29 CFR standards", "DOT 49 CFR pressure vessel standards", "ASHRAE 15 standards", "UL 207 standards"], correctAnswer: 1, explanation: "Refrigerant cylinders must meet DOT 49 CFR pressure vessel standards for safe transport and storage." },
  { id: "epa-core-47", question: "What is the purpose of the 'de minimis' exemption?", options: ["Allows venting of any amount of refrigerant", "Allows release of refrigerant in trace amounts that are unavoidable during good-faith recovery", "Exempts small appliances from all regulations", "Allows technicians to vent R-134a"], correctAnswer: 1, explanation: "The de minimis exemption allows unavoidable trace releases during good-faith recovery efforts. It does not permit intentional venting." },
  { id: "epa-core-48", question: "Refrigerant R-404A is primarily used in:", options: ["Residential AC", "Commercial refrigeration (medium and low temperature)", "Centrifugal chillers", "Automotive AC"], correctAnswer: 1, explanation: "R-404A is widely used in commercial refrigeration — supermarket cases, walk-in coolers, and transport refrigeration." },
  { id: "epa-core-49", question: "What does the 'H' in HFC stand for?", options: ["Halogen", "Hydrogen", "Hydro", "High"], correctAnswer: 2, explanation: "HFC = Hydrofluorocarbon. The 'H' stands for hydro (hydrogen). HFCs contain hydrogen, fluorine, and carbon — no chlorine." },
  { id: "epa-core-50", question: "Which refrigerant has the highest GWP among common HVAC refrigerants?", options: ["R-22", "R-410A", "R-404A", "R-134a"], correctAnswer: 2, explanation: "R-404A has a GWP of approximately 3,922 — among the highest of common refrigerants. R-410A is about 2,088." },
  { id: "epa-core-51", question: "A technician must keep records of refrigerant purchases for:", options: ["1 year", "3 years", "5 years", "10 years"], correctAnswer: 1, explanation: "EPA regulations require technicians and businesses to maintain refrigerant purchase and disposal records for at least 3 years." },
  { id: "epa-core-52", question: "What is the purpose of a pressure relief valve on a refrigerant cylinder?", options: ["Regulate operating pressure", "Release pressure if the cylinder overheats to prevent explosion", "Measure cylinder pressure", "Control refrigerant flow"], correctAnswer: 1, explanation: "Pressure relief valves protect cylinders from catastrophic failure if they are exposed to excessive heat or overfilling." },
  { id: "epa-core-53", question: "Refrigerant cylinders should never be exposed to temperatures above:", options: ["100°F", "125°F", "150°F", "200°F"], correctAnswer: 1, explanation: "Refrigerant cylinders must not be exposed to temperatures above 125°F. Higher temperatures increase pressure and risk cylinder failure." },
  { id: "epa-core-54", question: "Which of the following actions is legal under EPA Section 608?", options: ["Venting R-22 to speed up a repair", "Recovering R-22 before opening the system", "Mixing R-22 with R-410A in a recovery cylinder", "Selling R-22 to an uncertified person"], correctAnswer: 1, explanation: "Recovering refrigerant before opening a system is required by law. All other options are violations." },
  { id: "epa-core-55", question: "The term 'ozone depletion potential' (ODP) is measured relative to:", options: ["R-22", "R-12", "R-11", "CO2"], correctAnswer: 2, explanation: "ODP is measured relative to R-11, which has an ODP of 1.0. All other refrigerants are compared to this baseline." },
  { id: "epa-core-56", question: "HFOs (hydrofluoroolefins) like R-1234yf are considered environmentally preferable because:", options: ["They have high ODP", "They have very low GWP and zero ODP", "They are non-toxic", "They are cheaper than HFCs"], correctAnswer: 1, explanation: "HFOs have near-zero GWP (typically 1–10) and zero ODP, making them the next generation of environmentally friendly refrigerants." },
  { id: "epa-core-57", question: "What is the primary difference between R-22 and R-410A?", options: ["R-22 is an HFC; R-410A is an HCFC", "R-22 is an HCFC with ODP; R-410A is an HFC with zero ODP", "They are interchangeable", "R-410A has higher ODP"], correctAnswer: 1, explanation: "R-22 is an HCFC with ODP of 0.05. R-410A is an HFC with zero ODP but higher GWP." },
  { id: "epa-core-58", question: "A refrigerant leak that is discovered must be reported to the EPA if:", options: ["Any amount leaks", "The system has more than 50 lbs and exceeds the applicable leak rate threshold", "The leak is from a small appliance", "The technician is not certified"], correctAnswer: 1, explanation: "Systems with more than 50 lbs of refrigerant that exceed the applicable leak rate threshold must be repaired; reporting requirements apply to larger systems." },
  { id: "epa-core-59", question: "What is the purpose of a manifold gauge set?", options: ["Measure electrical current", "Connect to refrigerant lines to measure suction and discharge pressures", "Test for refrigerant leaks", "Measure airflow"], correctAnswer: 1, explanation: "Manifold gauges connect to the high and low side service ports to measure system pressures and allow refrigerant charging or recovery." },
  { id: "epa-core-60", question: "The low-side (suction) gauge on a manifold set is typically:", options: ["Red", "Blue", "Yellow", "Green"], correctAnswer: 1, explanation: "By convention, the low-side (suction) gauge is blue, the high-side (discharge) gauge is red, and the center utility hose is yellow." },
  { id: "epa-core-61", question: "Refrigerant R-502 was commonly used in:", options: ["Residential AC", "Low-temperature commercial refrigeration", "Centrifugal chillers", "Automotive AC"], correctAnswer: 1, explanation: "R-502 (a CFC/HCFC blend) was widely used in low-temperature commercial refrigeration before being phased out." },
  { id: "epa-core-62", question: "What does 'fractionation' mean in the context of refrigerant blends?", options: ["Separating refrigerant from oil", "The preferential evaporation of lower-boiling components from a blend", "Measuring refrigerant purity", "Mixing two refrigerants together"], correctAnswer: 1, explanation: "Fractionation occurs when components of a zeotropic blend evaporate at different rates, changing the blend's composition." },
  { id: "epa-core-63", question: "Which of the following is a drop-in replacement for R-22?", options: ["R-410A", "R-407C", "R-134a", "R-404A"], correctAnswer: 1, explanation: "R-407C is a near-drop-in replacement for R-22 in existing systems. R-410A requires different equipment and cannot be used in R-22 systems." },
  { id: "epa-core-64", question: "The EPA Section 608 regulations apply to:", options: ["Only commercial HVAC systems", "All stationary refrigeration and AC equipment", "Only systems over 50 lbs", "Only new equipment installations"], correctAnswer: 1, explanation: "Section 608 applies to all stationary refrigeration and AC equipment — residential, commercial, and industrial." },
  { id: "epa-core-65", question: "What is the purpose of a filter-drier in a refrigeration system?", options: ["Increase system pressure", "Remove moisture and contaminants from the refrigerant", "Measure refrigerant flow", "Control superheat"], correctAnswer: 1, explanation: "Filter-driers remove moisture, acid, and particulate contaminants that can damage compressors and other components." },
  { id: "epa-core-66", question: "Refrigerant that has been reclaimed to ARI 700 standards can be:", options: ["Used only in the original system", "Sold as equivalent to virgin refrigerant", "Used only in commercial systems", "Disposed of only"], correctAnswer: 1, explanation: "Reclaimed refrigerant meeting ARI 700 standards is equivalent to virgin refrigerant and can be sold and used in any compatible system." },
  { id: "epa-core-67", question: "What is the primary hazard of liquid refrigerant contact with skin?", options: ["Chemical burns from toxicity", "Frostbite from rapid evaporation and extreme cold", "Allergic reaction", "No significant hazard"], correctAnswer: 1, explanation: "Liquid refrigerant evaporates rapidly on contact with skin, causing frostbite. Always wear gloves and eye protection." },
  { id: "epa-core-68", question: "The EPA requires that recovery equipment be used:", options: ["Only on systems over 50 lbs", "On all refrigerant-containing equipment before opening for service", "Only on commercial systems", "Only when the technician chooses to"], correctAnswer: 1, explanation: "Recovery equipment must be used on all refrigerant-containing equipment before opening for service, regardless of size." },
  { id: "epa-core-69", question: "Which refrigerant is NOT subject to EPA Section 608 venting prohibition?", options: ["R-22", "R-410A", "R-744 (CO2)", "R-134a"], correctAnswer: 2, explanation: "CO2 (R-744) is not an ozone-depleting substance and is not subject to the Section 608 venting prohibition, though it is a greenhouse gas." },
  { id: "epa-core-70", question: "A technician who violates EPA Section 608 regulations may face:", options: ["Only a warning letter", "Civil penalties up to $44,539 per day per violation and loss of certification", "A $500 fine only", "No penalties if it is a first offense"], correctAnswer: 1, explanation: "Violations can result in civil penalties up to $44,539 per day per violation, criminal penalties, and revocation of certification." },
  { id: "epa-core-71", question: "What is the purpose of the 'safe disposal' exemption for small appliances?", options: ["Allows venting during disposal", "Allows persons other than certified technicians to recover refrigerant from small appliances being disposed of, using approved equipment", "Exempts small appliances from all regulations", "Allows disposal without recovery"], correctAnswer: 1, explanation: "The safe disposal exemption allows non-certified persons (e.g., scrap dealers) to recover refrigerant from small appliances using approved equipment." },
  { id: "epa-core-72", question: "Refrigerant cylinders must be transported:", options: ["In any position", "Upright and secured to prevent tipping", "On their side to prevent valve damage", "In the passenger compartment only"], correctAnswer: 1, explanation: "Cylinders must be transported upright and secured. They should be in a ventilated area, not the passenger compartment." },
  { id: "epa-core-73", question: "What is the ASHRAE 15 standard?", options: ["Refrigerant purity standard", "Safety standard for refrigeration systems — machinery room requirements, refrigerant quantities, ventilation", "Energy efficiency standard", "Installation standard for split systems"], correctAnswer: 1, explanation: "ASHRAE 15 is the Safety Standard for Refrigeration Systems, covering machinery room design, refrigerant quantity limits, and ventilation requirements." },
  { id: "epa-core-74", question: "Which of the following refrigerants is flammable (A3 classification)?", options: ["R-410A", "R-22", "R-290 (propane)", "R-134a"], correctAnswer: 2, explanation: "R-290 (propane) is classified A3 — low toxicity but highly flammable. It is used in some small commercial refrigeration equipment." },
  { id: "epa-core-75", question: "The EPA Section 608 program is administered by:", options: ["OSHA", "DOE", "EPA's Office of Air and Radiation", "ASHRAE"], correctAnswer: 2, explanation: "EPA's Office of Air and Radiation administers the Section 608 refrigerant management program." },
  // ── Core questions 76–100: high-frequency real-exam topics ────────────
  { id: "epa-core-76", question: "There are NO 'drop-in' replacements for CFC or HCFC refrigerants because:", options: ["They are too expensive", "Substitute refrigerants have different pressures, lubricant requirements, and materials compatibility", "The EPA prohibits substitutes", "Only the original refrigerant can be used in any system"], correctAnswer: 1, explanation: "No true drop-in replacements exist. Substitutes require different oils, may need different seals/hoses, and operate at different pressures." },
  { id: "epa-core-77", question: "R-134a requires what type of lubricant?", options: ["Mineral oil", "Alkylbenzene oil", "Polyol ester (POE) oil", "Any oil works"], correctAnswer: 2, explanation: "R-134a is not miscible with mineral oil. It requires polyol ester (POE) oil, which is hygroscopic and must be kept sealed." },
  { id: "epa-core-78", question: "R-22 systems typically use what type of lubricant?", options: ["POE oil", "PAG oil", "Mineral oil or alkylbenzene oil", "Synthetic oil only"], correctAnswer: 2, explanation: "R-22 is miscible with mineral oil and alkylbenzene oil. Alkylbenzene is preferred for retrofit situations." },
  { id: "epa-core-79", question: "When retrofitting an R-22 system to R-407C, the lubricant must be changed to:", options: ["Mineral oil", "Alkylbenzene oil", "POE oil", "No change needed"], correctAnswer: 2, explanation: "R-407C (an HFC blend) requires POE oil. Mineral oil must be flushed out before charging with R-407C." },
  { id: "epa-core-80", question: "Which factor does NOT speed up refrigerant recovery?", options: ["Heating the appliance being recovered from", "Chilling the recovery vessel", "Using larger diameter hoses", "Adding more refrigerant to the system"], correctAnswer: 3, explanation: "Recovery speed is increased by heating the appliance (raises pressure), chilling the recovery vessel (lowers pressure), and using larger/shorter hoses. Adding refrigerant does not help." },
  { id: "epa-core-81", question: "Chilling the recovery vessel during recovery:", options: ["Slows recovery", "Speeds recovery by lowering pressure in the vessel, increasing the pressure differential", "Has no effect", "Is prohibited"], correctAnswer: 1, explanation: "A colder recovery vessel has lower internal pressure, creating a greater pressure differential that pulls refrigerant in faster." },
  { id: "epa-core-82", question: "Heating the appliance during recovery:", options: ["Slows recovery", "Speeds recovery by raising system pressure, increasing the pressure differential", "Has no effect", "Is prohibited"], correctAnswer: 1, explanation: "Heating the appliance raises refrigerant pressure, increasing the pressure differential that drives refrigerant into the recovery vessel." },
  { id: "epa-core-83", question: "Long recovery hoses:", options: ["Speed up recovery", "Slow recovery due to increased pressure drop and flow resistance", "Have no effect on recovery speed", "Are required by EPA"], correctAnswer: 1, explanation: "Long hoses increase flow resistance and pressure drop, slowing recovery. Use the shortest hoses practical." },
  { id: "epa-core-84", question: "To avoid mixing refrigerants during recovery, a technician should:", options: ["Use the same recovery machine for all refrigerants", "Use dedicated recovery equipment per refrigerant type, or purge and change oil between refrigerants", "Mix is acceptable if both are HFCs", "Only use new recovery cylinders"], correctAnswer: 1, explanation: "Mixing refrigerants creates a contaminated blend that cannot be reclaimed. Use dedicated equipment or thoroughly purge between refrigerant types." },
  { id: "epa-core-85", question: "What is the purpose of evacuating a system before charging?", options: ["Remove refrigerant", "Remove air (non-condensables) and moisture that would cause problems in the system", "Test for leaks only", "Cool the system down"], correctAnswer: 1, explanation: "Evacuation removes air (which raises head pressure and reduces efficiency) and moisture (which causes acid formation and corrosion)." },
  { id: "epa-core-86", question: "Nitrogen is used for leak testing instead of compressed air because:", options: ["Nitrogen is cheaper", "Compressed air contains moisture and oxygen that can contaminate the system and create explosion risk", "Nitrogen is required by law", "Compressed air is too cold"], correctAnswer: 1, explanation: "Compressed air contains moisture (causes acid/corrosion) and oxygen (explosion risk with oil at high temperatures). Dry nitrogen is inert and dry." },
  { id: "epa-core-87", question: "When using nitrogen for leak testing, you must use:", options: ["Any regulator", "A pressure regulator and a pressure relief valve", "No regulator — full cylinder pressure", "Only a relief valve"], correctAnswer: 1, explanation: "Always use a pressure regulator to control nitrogen pressure and a relief valve to prevent over-pressurization of the system." },
  { id: "epa-core-88", question: "Disposable refrigerant cylinders:", options: ["Can be refilled once", "Must never be refilled — it is illegal and dangerous", "Can be refilled if pressure-tested", "Can be refilled by certified technicians only"], correctAnswer: 1, explanation: "Disposable cylinders are designed for single use only. Refilling is illegal under DOT regulations and extremely dangerous." },
  { id: "epa-core-89", question: "What is the color code for a recovery cylinder?", options: ["All yellow", "Yellow body with gray top", "Gray body with yellow top", "Green body with yellow top"], correctAnswer: 1, explanation: "Recovery cylinders are yellow with a gray top — the standard DOT color code for used/recovered refrigerant." },
  { id: "epa-core-90", question: "A refrigerant cylinder must never be filled beyond what percentage of its capacity?", options: ["60%", "70%", "80%", "90%"], correctAnswer: 2, explanation: "Cylinders must not be filled beyond 80% of capacity by weight to allow for thermal expansion and prevent hydrostatic pressure buildup." },
  { id: "epa-core-91", question: "What personal protective equipment (PPE) is required when handling refrigerants?", options: ["Only safety glasses", "Gloves and goggles (eye protection)", "Only a respirator", "No PPE required for small amounts"], correctAnswer: 1, explanation: "Gloves protect against frostbite from liquid refrigerant contact. Goggles protect eyes from refrigerant spray. Both are required." },
  { id: "epa-core-92", question: "Refrigerant vapor in high concentrations can cause cardiac sensitization, meaning:", options: ["The heart beats faster", "The heart becomes sensitized to adrenaline, potentially causing fatal arrhythmia", "The heart rate slows", "No cardiac effects"], correctAnswer: 1, explanation: "High concentrations of refrigerant vapor can sensitize the heart to adrenaline (epinephrine), potentially causing fatal cardiac arrhythmia." },
  { id: "epa-core-93", question: "The CFC phaseout in the United States was completed by:", options: ["January 1, 1990", "January 1, 1996", "January 1, 2000", "January 1, 2010"], correctAnswer: 1, explanation: "CFC production and import was phased out in the US by January 1, 1996, per the Montreal Protocol schedule." },
  { id: "epa-core-94", question: "Which of the following correctly identifies refrigerant types?", options: ["R-12 = HFC, R-22 = CFC, R-134a = HCFC", "R-12 = CFC, R-22 = HCFC, R-134a = HFC", "R-12 = HCFC, R-22 = HFC, R-134a = CFC", "R-12 = HFC, R-22 = HFC, R-134a = CFC"], correctAnswer: 1, explanation: "R-12 is a CFC (phased out 1996), R-22 is an HCFC (phased out 2020), R-134a is an HFC (zero ODP)." },
  { id: "epa-core-95", question: "The venting prohibition under Section 608 applies to:", options: ["CFCs only", "CFCs and HCFCs only", "All refrigerants used in stationary equipment, including HFCs and substitutes", "Only refrigerants with ODP above 0.1"], correctAnswer: 2, explanation: "The venting prohibition applies to all refrigerants used in stationary equipment — CFCs, HCFCs, HFCs, and substitutes." },
  { id: "epa-core-96", question: "Fractionation of a zeotropic blend during a leak means:", options: ["The blend becomes more pure", "The composition of the remaining refrigerant changes — lighter components leak faster", "The blend separates into layers", "No change in composition"], correctAnswer: 1, explanation: "During a vapor leak, lighter (lower-boiling) components escape faster, changing the blend's composition. The remaining charge may not perform correctly." },
  { id: "epa-core-97", question: "Because of fractionation risk, a leaking zeotropic blend system should be:", options: ["Topped off with the same blend", "Fully recovered and recharged with a fresh charge", "Topped off with the dominant component", "Left as-is — fractionation is minor"], correctAnswer: 1, explanation: "A leaking zeotropic blend should be fully recovered and recharged. Topping off changes the composition further." },
  { id: "epa-core-98", question: "ASHRAE Standard 15 requires what safety device in all refrigerant machinery rooms?", options: ["A fire suppression system", "An oxygen deprivation (refrigerant) sensor with alarm", "A pressure relief valve only", "A CO detector"], correctAnswer: 1, explanation: "ASHRAE 15 requires a refrigerant detector/oxygen deprivation sensor with an alarm in all machinery rooms, regardless of refrigerant type." },
  { id: "epa-core-99", question: "Refrigerant shipping containers must be labeled with:", options: ["Only the refrigerant name", "Refrigerant identification and DOT hazard classification label", "Only the manufacturer's name", "No labeling required for small containers"], correctAnswer: 1, explanation: "Refrigerant containers must have the refrigerant identification and the appropriate DOT hazard classification label for transport." },
  { id: "epa-core-100", question: "The pressure-temperature (PT) relationship means that for a pure refrigerant in a sealed container:", options: ["Pressure and temperature are unrelated", "Knowing the pressure tells you the saturation temperature, and vice versa", "Temperature is always higher than pressure", "Pressure is always higher than temperature"], correctAnswer: 1, explanation: "For a pure refrigerant with liquid and vapor present, pressure and saturation temperature have a fixed relationship — the PT chart." },
];


// ── EPA 608 Type I — Small Appliances (75 questions) ────────────────────

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
  // ── Type I questions 26–75 ────────────────────────────────────────────
  { id: "epa-t1-26", question: "A household refrigerator manufactured after 1995 most likely contains:", options: ["R-12", "R-22", "R-134a", "R-410A"], correctAnswer: 2, explanation: "R-134a replaced R-12 in household refrigerators after the CFC phase-out in 1996." },
  { id: "epa-t1-27", question: "What is the maximum charge size for a small appliance?", options: ["2 lbs", "5 lbs", "10 lbs", "50 lbs"], correctAnswer: 1, explanation: "Small appliances are defined as systems manufactured, charged, and hermetically sealed with 5 lbs or less of refrigerant." },
  { id: "epa-t1-28", question: "A hermetically sealed system means:", options: ["The system has no service valves", "The refrigerant circuit is factory-sealed with no service ports", "The system uses only HFCs", "The compressor is externally driven"], correctAnswer: 1, explanation: "Hermetically sealed systems are factory-sealed with no service ports. Access requires piercing valves or process stubs." },
  { id: "epa-t1-29", question: "When using a system-dependent recovery device, the appliance compressor must:", options: ["Be non-operational", "Be operational to push refrigerant into the recovery vessel", "Be bypassed", "Be replaced first"], correctAnswer: 1, explanation: "System-dependent (passive) recovery relies on the appliance's own compressor or internal pressure to move refrigerant." },
  { id: "epa-t1-30", question: "Recovery efficiency of 90% for small appliances with operating compressors was established:", options: ["Before November 15, 1993", "After November 15, 1993", "After January 1, 2020", "After January 1, 2010"], correctAnswer: 1, explanation: "The 90% recovery requirement applies to small appliances manufactured after November 15, 1993." },
  { id: "epa-t1-31", question: "A portable room air conditioner (window unit) is classified as:", options: ["Type II high-pressure equipment", "A small appliance", "Type III low-pressure equipment", "Commercial refrigeration"], correctAnswer: 1, explanation: "Window and portable room AC units contain less than 5 lbs of refrigerant and are small appliances." },
  { id: "epa-t1-32", question: "What refrigerant is commonly found in older household refrigerators (pre-1996)?", options: ["R-134a", "R-22", "R-12", "R-410A"], correctAnswer: 2, explanation: "R-12 (a CFC) was used in household refrigerators before the phase-out. It was replaced by R-134a." },
  { id: "epa-t1-33", question: "A water cooler with built-in refrigeration is classified as:", options: ["Type II equipment", "A small appliance", "Type III equipment", "Not regulated"], correctAnswer: 1, explanation: "Water coolers with built-in refrigeration contain less than 5 lbs of refrigerant and are small appliances." },
  { id: "epa-t1-34", question: "When a small appliance has already leaked to atmospheric pressure, recovery required is:", options: ["90%", "80%", "0% — no recovery required", "50%"], correctAnswer: 2, explanation: "If a small appliance has already leaked to atmospheric pressure (0 psig), no additional recovery is required." },
  { id: "epa-t1-35", question: "A piercing valve is used to:", options: ["Measure system pressure only", "Access a sealed system by piercing the process tube", "Recover refrigerant from large systems", "Test for leaks"], correctAnswer: 1, explanation: "Piercing valves clamp onto the process stub of a sealed small appliance to provide access for recovery." },
  { id: "epa-t1-36", question: "After using a piercing valve, the technician should:", options: ["Leave it in place permanently", "Check for leaks and cap the valve", "Remove it and seal the tube", "Leave it open for future access"], correctAnswer: 1, explanation: "After recovery, check the piercing valve for leaks and cap it to prevent refrigerant release." },
  { id: "epa-t1-37", question: "Self-contained recovery equipment certified after November 15, 1993 must be certified by:", options: ["The manufacturer", "EPA or an EPA-approved testing organization", "OSHA", "The state licensing board"], correctAnswer: 1, explanation: "Recovery equipment must be certified by EPA or an EPA-approved testing organization (such as UL or ETL)." },
  { id: "epa-t1-38", question: "A chest freezer is classified as:", options: ["Type II equipment", "A small appliance", "Type III equipment", "Commercial refrigeration"], correctAnswer: 1, explanation: "Household chest freezers contain less than 5 lbs of refrigerant and are small appliances." },
  { id: "epa-t1-39", question: "The recovery cylinder used for small appliance refrigerant must be:", options: ["Any available cylinder", "A DOT-approved recovery cylinder", "A new cylinder only", "A cylinder rated for the specific refrigerant only"], correctAnswer: 1, explanation: "Recovery cylinders must meet DOT standards and be appropriate for the refrigerant being recovered." },
  { id: "epa-t1-40", question: "What is the purpose of the process stub on a small appliance?", options: ["Electrical connection point", "Access point for refrigerant recovery and charging", "Mounting bracket", "Oil drain port"], correctAnswer: 1, explanation: "The process stub is a small copper tube used as the access point for recovery and charging on sealed small appliances." },
  { id: "epa-t1-41", question: "A technician recovering from a small appliance with a non-operating compressor must achieve:", options: ["90% recovery", "80% recovery", "0 psig", "500 microns"], correctAnswer: 1, explanation: "For small appliances with non-operating compressors, 80% of the refrigerant must be recovered." },
  { id: "epa-t1-42", question: "Which of the following is NOT a small appliance?", options: ["Household refrigerator", "Window air conditioner", "5-ton split system", "Dehumidifier"], correctAnswer: 2, explanation: "A 5-ton split system contains far more than 5 lbs of refrigerant and is Type II high-pressure equipment." },
  { id: "epa-t1-43", question: "Recovered refrigerant from a small appliance can be:", options: ["Vented if less than 1 lb", "Stored in a recovery cylinder for recycling or reclamation", "Mixed with other refrigerants", "Disposed of in a drain"], correctAnswer: 1, explanation: "Recovered refrigerant must be stored in approved recovery cylinders and sent for recycling or reclamation." },
  { id: "epa-t1-44", question: "A PTAC (Packaged Terminal Air Conditioner) is commonly found in:", options: ["Residential homes", "Hotels and motels", "Industrial facilities", "Centrifugal chiller plants"], correctAnswer: 1, explanation: "PTACs are the through-the-wall units common in hotel and motel rooms. They are small appliances." },
  { id: "epa-t1-45", question: "The refrigerant charge in a typical window AC unit is approximately:", options: ["0.5–2 lbs", "5–10 lbs", "10–20 lbs", "20–50 lbs"], correctAnswer: 0, explanation: "Window AC units typically contain 0.5–2 lbs of refrigerant, well within the 5 lb small appliance threshold." },
  { id: "epa-t1-46", question: "Before disposing of a household refrigerator, the refrigerant must be:", options: ["Vented — it is a small amount", "Recovered by a certified technician or under the safe disposal exemption", "Left in the unit", "Drained into a container"], correctAnswer: 1, explanation: "Refrigerant must be recovered before disposal. The safe disposal exemption allows non-certified persons to use approved equipment for this purpose." },
  { id: "epa-t1-47", question: "What does 'passive recovery' mean for small appliances?", options: ["Using a vacuum pump", "Allowing refrigerant to flow into the recovery vessel using system pressure only", "Using the appliance compressor to push refrigerant out", "No recovery is performed"], correctAnswer: 1, explanation: "Passive recovery uses the system's own pressure differential to move refrigerant into the recovery vessel without an external compressor." },
  { id: "epa-t1-48", question: "A recovery cylinder must be labeled with:", options: ["Only the technician's name", "The refrigerant type and that it contains used refrigerant", "Only the date of recovery", "No labeling is required"], correctAnswer: 1, explanation: "Recovery cylinders must be labeled with the refrigerant type and marked as containing used (recovered) refrigerant." },
  { id: "epa-t1-49", question: "R-600a (isobutane) is used in some modern household refrigerators because:", options: ["It has high ODP", "It has very low GWP and good thermodynamic properties", "It is non-flammable", "It is cheaper than R-134a only"], correctAnswer: 1, explanation: "R-600a has near-zero GWP and excellent efficiency. It is A3 (flammable) but used in small charges in sealed household appliances." },
  { id: "epa-t1-50", question: "A technician must have Type I certification to service:", options: ["Any HVAC system", "Only small appliances with 5 lbs or less", "High-pressure systems only", "Low-pressure chillers only"], correctAnswer: 1, explanation: "Type I certification is specifically for small appliances with 5 lbs or less of refrigerant." },
  { id: "epa-t1-51", question: "What is the primary advantage of self-contained recovery equipment over system-dependent equipment?", options: ["It is cheaper", "It works even when the appliance compressor is non-functional", "It recovers refrigerant faster always", "It requires no power"], correctAnswer: 1, explanation: "Self-contained equipment has its own compressor, so it can recover refrigerant regardless of the appliance's condition." },
  { id: "epa-t1-52", question: "A technician who recovers refrigerant from a small appliance must:", options: ["Dispose of it immediately", "Store it in an approved recovery cylinder", "Return it to the manufacturer", "Mix it with new refrigerant"], correctAnswer: 1, explanation: "Recovered refrigerant must be stored in DOT-approved recovery cylinders for proper handling." },
  { id: "epa-t1-53", question: "The safe disposal exemption applies to:", options: ["All HVAC equipment", "Small appliances being disposed of (not serviced)", "Commercial refrigeration only", "Any system under 50 lbs"], correctAnswer: 1, explanation: "The safe disposal exemption applies only to small appliances being disposed of, not to equipment being serviced." },
  { id: "epa-t1-54", question: "Which of the following small appliances uses R-290 (propane) as a refrigerant?", options: ["All modern refrigerators", "Some commercial display cases and household refrigerators in certain markets", "Window AC units", "Dehumidifiers"], correctAnswer: 1, explanation: "R-290 is used in some commercial display cases and household refrigerators, particularly in European markets and increasingly in the US." },
  { id: "epa-t1-55", question: "When recovering from a small appliance, the recovery vessel should be:", options: ["Warm to increase pressure", "Cool to increase recovery efficiency", "At room temperature only", "Temperature does not matter"], correctAnswer: 1, explanation: "Cooling the recovery vessel increases the pressure differential, improving recovery efficiency and speed." },
  { id: "epa-t1-56", question: "A technician finds a small appliance with a broken compressor. The correct recovery method is:", options: ["System-dependent active recovery", "Self-contained recovery equipment", "No recovery needed — compressor is broken", "Vent the refrigerant"], correctAnswer: 1, explanation: "When the compressor is broken, self-contained recovery equipment must be used since system-dependent methods require a working compressor." },
  { id: "epa-t1-57", question: "What is the purpose of an oil separator in recovery equipment?", options: ["Remove moisture", "Separate compressor oil from recovered refrigerant", "Measure refrigerant purity", "Control recovery speed"], correctAnswer: 1, explanation: "Oil separators remove compressor oil from recovered refrigerant to prevent oil contamination of the recovery cylinder." },
  { id: "epa-t1-58", question: "Small appliances are exempt from which EPA requirement?", options: ["Recovery before disposal", "Venting prohibition", "Mandatory leak repair requirements", "Certification requirements"], correctAnswer: 2, explanation: "Small appliances are exempt from mandatory leak repair requirements. Recovery and venting prohibition still apply." },
  { id: "epa-t1-59", question: "A technician recovering from a small appliance should connect the recovery equipment to:", options: ["The electrical terminals", "The process stub or piercing valve", "The condenser coil", "The evaporator drain"], correctAnswer: 1, explanation: "Recovery equipment connects to the process stub (or a piercing valve installed on the process stub) to access the refrigerant circuit." },
  { id: "epa-t1-60", question: "After recovery from a small appliance, the technician should verify:", options: ["The refrigerant color", "That the required recovery percentage was achieved", "The refrigerant smell", "That the compressor runs"], correctAnswer: 1, explanation: "The technician must verify that the required recovery percentage (80% or 90% depending on compressor status) was achieved." },
  { id: "epa-t1-61", question: "R-134a in a household refrigerator has what ODP?", options: ["1.0", "0.05", "0", "0.5"], correctAnswer: 2, explanation: "R-134a is an HFC with zero ODP. It contains no chlorine or bromine." },
  { id: "epa-t1-62", question: "A technician who services small appliances without EPA 608 certification:", options: ["Is only subject to a warning", "Faces civil penalties up to $44,539 per day", "Is exempt if the system is under 2 lbs", "Only needs state certification"], correctAnswer: 1, explanation: "Servicing refrigerant-containing equipment without EPA 608 certification is a federal violation with penalties up to $44,539 per day." },
  { id: "epa-t1-63", question: "What is the typical refrigerant charge in a household chest freezer?", options: ["0.25–0.75 lbs", "5–10 lbs", "10–20 lbs", "20–50 lbs"], correctAnswer: 0, explanation: "Household chest freezers typically contain 0.25–0.75 lbs of refrigerant — well within the 5 lb small appliance threshold." },
  { id: "epa-t1-64", question: "A vending machine refrigeration system is classified as a small appliance because:", options: ["It uses R-134a", "It is manufactured, charged, and hermetically sealed with 5 lbs or less of refrigerant", "It is portable", "It is used commercially"], correctAnswer: 1, explanation: "Vending machine refrigeration systems meet the small appliance definition — hermetically sealed with 5 lbs or less." },
  { id: "epa-t1-65", question: "When is it acceptable to vent refrigerant from a small appliance?", options: ["When the charge is less than 1 lb", "When the system has already leaked to atmospheric pressure", "When the technician is in a hurry", "Never — venting is always prohibited"], correctAnswer: 1, explanation: "If a small appliance has already leaked to atmospheric pressure, no recovery is required. Otherwise, venting is prohibited." },
  { id: "epa-t1-66", question: "The process stub on a small appliance is typically made of:", options: ["Steel", "Copper", "Aluminum", "Plastic"], correctAnswer: 1, explanation: "Process stubs are typically small copper tubes that are pinched off after factory charging." },
  { id: "epa-t1-67", question: "A technician must keep records of refrigerant recovered from small appliances for:", options: ["No records required", "1 year", "3 years", "5 years"], correctAnswer: 2, explanation: "Records of refrigerant recovery must be kept for at least 3 years." },
  { id: "epa-t1-68", question: "Which of the following is a correct statement about Type I recovery requirements?", options: ["90% recovery is always required", "80% recovery is always required", "Recovery requirements depend on whether the compressor is operational", "No recovery is required for small appliances"], correctAnswer: 2, explanation: "Type I recovery: 90% if compressor works, 80% if compressor doesn't work, 0% if already at atmospheric pressure." },
  { id: "epa-t1-69", question: "A dehumidifier with a 2 lb refrigerant charge is classified as:", options: ["Type II high-pressure equipment", "A small appliance", "Type III low-pressure equipment", "Not regulated"], correctAnswer: 1, explanation: "A dehumidifier with 2 lbs of refrigerant is a small appliance — under the 5 lb threshold." },
  { id: "epa-t1-70", question: "What should a technician do if a recovery cylinder is nearly full?", options: ["Continue filling until it is completely full", "Stop recovery and use a new cylinder — never exceed 80% capacity", "Vent the remaining refrigerant", "Heat the cylinder to compress the refrigerant"], correctAnswer: 1, explanation: "Recovery cylinders must not exceed 80% capacity. Stop and use a new cylinder when approaching the limit." },
  { id: "epa-t1-71", question: "A small appliance that uses R-600a (isobutane) requires:", options: ["No special precautions", "Elimination of ignition sources due to flammability", "Type III certification", "Commercial refrigeration certification"], correctAnswer: 1, explanation: "R-600a is A3 (highly flammable). Eliminate all ignition sources when working on systems containing flammable refrigerants." },
  { id: "epa-t1-72", question: "The 'safe disposal' exemption allows:", options: ["Venting refrigerant during disposal", "Non-certified persons to recover refrigerant from small appliances being disposed of using approved equipment", "Disposal without any refrigerant handling", "Certified technicians to skip recovery"], correctAnswer: 1, explanation: "The safe disposal exemption allows non-certified persons (scrap dealers, appliance retailers) to recover refrigerant from small appliances being disposed of." },
  { id: "epa-t1-73", question: "After recovering refrigerant from a small appliance, the technician should:", options: ["Immediately recharge the system", "Label the recovery cylinder with the refrigerant type", "Mix the recovered refrigerant with new refrigerant", "Dispose of the recovery cylinder"], correctAnswer: 1, explanation: "Recovery cylinders must be labeled with the refrigerant type and marked as containing used refrigerant." },
  { id: "epa-t1-74", question: "A technician using system-dependent recovery on a small appliance should monitor:", options: ["The electrical current", "The pressure in the recovery vessel to ensure it does not exceed safe limits", "The ambient temperature only", "The refrigerant color"], correctAnswer: 1, explanation: "Monitor recovery vessel pressure to ensure it stays within safe limits during system-dependent recovery." },
  { id: "epa-t1-75", question: "Which statement about EPA 608 Type I certification is correct?", options: ["It allows work on all refrigerant-containing equipment", "It is limited to small appliances with 5 lbs or less of refrigerant", "It expires after 5 years", "It requires annual renewal"], correctAnswer: 1, explanation: "Type I certification covers only small appliances (5 lbs or less). It does not expire once earned." },
  // ── Type I questions 76–100: high-frequency real-exam topics ──────────
  { id: "epa-t1-76", question: "When using a passive (system-dependent) recovery device on a small appliance with an inoperative compressor, the technician should:", options: ["Give up and vent the refrigerant", "Install access valves on both the high and low side to maximize recovery", "Use only the high side access valve", "Use only the low side access valve"], correctAnswer: 1, explanation: "For inoperative compressors, install access valves on both high and low sides to maximize refrigerant recovery using system pressure." },
  { id: "epa-t1-77", question: "To recover from a small appliance with an inoperative compressor using a passive device, the technician can:", options: ["Only wait for pressure to equalize", "Heat the appliance and/or strike the compressor to try to free it, then use system pressure", "Add nitrogen to push refrigerant out", "Vent the refrigerant — no other option exists"], correctAnswer: 1, explanation: "Heating the appliance raises pressure. Striking the compressor may free a stuck compressor. Both help maximize passive recovery." },
  { id: "epa-t1-78", question: "Solderless (Schrader-type) access fittings installed during service on a small appliance should be:", options: ["Left in place permanently for future service", "Removed at the conclusion of service to prevent leaks", "Capped but left in place", "Replaced with solder fittings"], correctAnswer: 1, explanation: "Solderless access fittings must be removed at the conclusion of service. They are not designed for permanent installation and can leak." },
  { id: "epa-t1-79", question: "R-134a is the likely substitute for R-12 in small appliances because:", options: ["It has the same pressure as R-12", "It is an HFC with zero ODP and similar thermodynamic properties", "It uses the same oil as R-12", "It is cheaper than R-12"], correctAnswer: 1, explanation: "R-134a replaced R-12 in household refrigerators and small appliances. It has zero ODP and similar cooling performance, though it requires POE oil." },
  { id: "epa-t1-80", question: "Refrigerants can decompose at high temperatures (such as near open flames or hot surfaces) to produce:", options: ["Harmless water vapor", "Toxic gases including phosgene and hydrofluoric acid", "Oxygen", "Carbon dioxide only"], correctAnswer: 1, explanation: "At high temperatures, refrigerants decompose into toxic products including phosgene (from CFCs) and hydrofluoric acid. Never expose refrigerants to open flames." },
  { id: "epa-t1-81", question: "Using pressure and temperature readings together on a small appliance helps a technician:", options: ["Measure the refrigerant charge weight", "Identify the refrigerant type and detect non-condensable gases", "Determine the compressor efficiency", "Measure airflow"], correctAnswer: 1, explanation: "Comparing measured pressure to the PT chart for the expected refrigerant confirms the refrigerant type and reveals non-condensables if pressure is higher than expected." },
  { id: "epa-t1-82", question: "Non-condensable gases in a small appliance are indicated by:", options: ["Lower than expected pressure for the measured temperature", "Higher than expected pressure for the measured temperature", "Normal pressure readings", "Zero pressure"], correctAnswer: 1, explanation: "Non-condensables (air) add to system pressure. If measured pressure is higher than the PT chart predicts for the measured temperature, non-condensables are present." },
  { id: "epa-t1-83", question: "The recovery efficiency requirement for small appliances manufactured BEFORE November 15, 1993 with an operating compressor is:", options: ["90%", "80%", "70%", "60%"], correctAnswer: 1, explanation: "For small appliances made before November 15, 1993 with an operating compressor, 80% recovery is required." },
  { id: "epa-t1-84", question: "The recovery efficiency requirement for small appliances manufactured AFTER November 15, 1993 with an operating compressor is:", options: ["80%", "90%", "95%", "100%"], correctAnswer: 1, explanation: "For small appliances made after November 15, 1993 with an operating compressor, 90% recovery is required." },
  { id: "epa-t1-85", question: "A mail-in (open-book) Type I exam has a passing score of:", options: ["70%", "75%", "80%", "84%"], correctAnswer: 3, explanation: "Mail-in open-book Type I exams require 84% to pass. Closed-book proctored exams require 70%." },
  { id: "epa-t1-86", question: "A mail-in Type I certification can be used toward Universal certification:", options: ["Yes, it counts for the Type I portion", "No — Universal requires all sections to be taken as closed-book proctored exams", "Yes, if the score was above 90%", "Only if taken within the last 2 years"], correctAnswer: 1, explanation: "Universal certification requires all sections (Core + Type I + II + III) to be taken as closed-book proctored exams. Mail-in Type I does not qualify." },
  { id: "epa-t1-87", question: "When operating a compressor to assist passive recovery, the technician should:", options: ["Run the compressor until the system reaches 0 psig", "Run the compressor to push refrigerant into the recovery vessel, monitoring vessel pressure", "Run the compressor at maximum speed only", "Never run the compressor during recovery"], correctAnswer: 1, explanation: "Running the appliance compressor pushes refrigerant into the recovery vessel. Monitor vessel pressure to stay within safe limits." },
  { id: "epa-t1-88", question: "A small appliance that uses R-600a (isobutane) presents what additional hazard compared to R-134a?", options: ["Higher toxicity", "Flammability — R-600a is A3 (highly flammable)", "Higher ODP", "Higher pressure"], correctAnswer: 1, explanation: "R-600a is classified A3 — highly flammable. Eliminate all ignition sources before working on appliances containing R-600a." },
  { id: "epa-t1-89", question: "What is the correct recovery procedure when a small appliance has both liquid and vapor refrigerant?", options: ["Recover vapor only", "Recover liquid first, then vapor, to speed up the process", "Recover vapor first, then liquid", "Order does not matter"], correctAnswer: 1, explanation: "Recovering liquid first is faster because liquid contains more refrigerant mass per volume than vapor." },
  { id: "epa-t1-90", question: "After recovery from a small appliance, the technician should verify the recovery was complete by:", options: ["Checking the refrigerant color", "Confirming the system pressure is at or below the required recovery level", "Smelling the refrigerant", "Checking the compressor amperage"], correctAnswer: 1, explanation: "Verify recovery by confirming system pressure is at or below the required level (0 psig if leaked to atmosphere, or 80%/90% by weight)." },
  { id: "epa-t1-91", question: "A technician who cannot achieve the required recovery level due to equipment limitations must:", options: ["Vent the remaining refrigerant", "Document the problem and use the best available equipment", "Stop work entirely", "Call the EPA for a waiver"], correctAnswer: 1, explanation: "If required recovery levels cannot be achieved, the technician must document the problem and recover as much as possible with available equipment." },
  { id: "epa-t1-92", question: "The EPA 608 Type I exam consists of:", options: ["25 questions (Type I topics only)", "50 questions (25 Core + 25 Type I)", "75 questions", "100 questions"], correctAnswer: 1, explanation: "The Type I exam has 50 questions: 25 from the Core group (environmental/regulatory) and 25 from the Type I technical group." },
  { id: "epa-t1-93", question: "Which of the following is a correct statement about recovery from small appliances?", options: ["Recovery is only required for systems over 2 lbs", "Recovery is required before any service that involves opening the refrigerant circuit", "Recovery is only required before disposal", "Recovery is optional for certified technicians"], correctAnswer: 1, explanation: "Recovery is required before any service that involves opening the refrigerant circuit, not just before disposal." },
  { id: "epa-t1-94", question: "A technician finds a small appliance with a charge that has partially leaked. The technician should:", options: ["Add refrigerant to top off the charge without recovery", "Recover the remaining refrigerant before opening the system", "Vent the remaining charge since it is small", "Leave the system as-is"], correctAnswer: 1, explanation: "Even a partial charge must be recovered before opening the system. Venting is prohibited regardless of the amount remaining." },
  { id: "epa-t1-95", question: "What is the purpose of installing a high-side access valve on a small appliance with an inoperative compressor?", options: ["To add refrigerant", "To allow recovery of high-side liquid refrigerant that cannot be moved by the compressor", "To measure discharge pressure", "To connect the manifold gauge set"], correctAnswer: 1, explanation: "With an inoperative compressor, high-side liquid refrigerant cannot be moved. A high-side access valve allows direct recovery of that liquid." },
  { id: "epa-t1-96", question: "The term 'hermetically sealed' in the context of small appliances means:", options: ["The system has service valves", "The compressor and motor are sealed in the same housing with no external shaft seal", "The system uses only HFC refrigerants", "The system has no moving parts"], correctAnswer: 1, explanation: "A hermetic compressor has the motor and compressor sealed in the same welded housing, eliminating shaft seals and reducing leak points." },
  { id: "epa-t1-97", question: "A technician recovering from a small appliance should connect recovery equipment to:", options: ["Only the high side", "Only the low side", "Both high and low sides when possible for maximum recovery", "The electrical terminals"], correctAnswer: 2, explanation: "Connecting to both high and low sides maximizes recovery efficiency, especially when the compressor is inoperative." },
  { id: "epa-t1-98", question: "What happens to refrigerant composition in a zeotropic blend small appliance during a vapor leak?", options: ["Composition stays the same", "Lighter components leak preferentially, changing the blend composition (fractionation)", "Heavier components leak first", "Only oil leaks out"], correctAnswer: 1, explanation: "Fractionation: lighter (lower-boiling) components escape faster during a vapor leak, leaving a charge with altered composition." },
  { id: "epa-t1-99", question: "A small appliance technician must be certified under which EPA 608 type?", options: ["Type II", "Type III", "Type I", "Universal only"], correctAnswer: 2, explanation: "Type I certification is required to service small appliances. Universal certification also covers Type I work." },
  { id: "epa-t1-100", question: "The safe disposal exemption does NOT apply to:", options: ["Household refrigerators being scrapped", "Small appliances being serviced and returned to service", "Window AC units being disposed of", "Vending machines being scrapped"], correctAnswer: 1, explanation: "The safe disposal exemption applies only to appliances being disposed of — not to equipment being serviced and returned to service." },
];

// ── EPA 608 Type II — High-Pressure Systems (75 questions) ──────────────

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
  // ── Type II questions 26–75 ───────────────────────────────────────────
  { id: "epa-t2-26", question: "What is the recovery requirement for high-pressure systems with less than 200 lbs of refrigerant when using equipment manufactured after November 15, 1993?", options: ["0 psig", "4 in. Hg vacuum", "10 in. Hg vacuum", "500 microns"], correctAnswer: 0, explanation: "Systems under 200 lbs must be recovered to 0 psig using equipment manufactured after November 15, 1993." },
  { id: "epa-t2-27", question: "What is the recovery requirement for high-pressure systems with 200 lbs or more using equipment manufactured after November 15, 1993?", options: ["0 psig", "4 in. Hg vacuum", "10 in. Hg vacuum", "500 microns"], correctAnswer: 2, explanation: "Systems with 200 lbs or more must be recovered to 10 in. Hg vacuum using post-1993 equipment." },
  { id: "epa-t2-28", question: "What is the recovery requirement for high-pressure systems under 200 lbs using equipment manufactured BEFORE November 15, 1993?", options: ["0 psig", "4 in. Hg vacuum", "10 in. Hg vacuum", "500 microns"], correctAnswer: 1, explanation: "Using pre-1993 equipment on systems under 200 lbs requires recovery to 4 in. Hg vacuum." },
  { id: "epa-t2-29", question: "What is the recovery requirement for high-pressure systems 200 lbs or more using equipment manufactured BEFORE November 15, 1993?", options: ["0 psig", "4 in. Hg vacuum", "10 in. Hg vacuum", "15 in. Hg vacuum"], correctAnswer: 3, explanation: "Using pre-1993 equipment on systems with 200 lbs or more requires recovery to 15 in. Hg vacuum." },
  { id: "epa-t2-30", question: "R-410A requires manifold gauges rated for at least:", options: ["250 psig", "400 psig", "800 psig", "1,000 psig"], correctAnswer: 2, explanation: "R-410A operates at much higher pressures than R-22. Gauges must be rated for at least 800 psig on the high side." },
  { id: "epa-t2-31", question: "What is the normal operating suction pressure range for R-410A in a residential AC system at 75°F indoor conditions?", options: ["50–70 psig", "100–130 psig", "200–250 psig", "300–350 psig"], correctAnswer: 1, explanation: "R-410A suction pressure typically runs 100–130 psig at normal residential cooling conditions." },
  { id: "epa-t2-32", question: "What is the normal operating discharge pressure range for R-410A in a residential AC system?", options: ["100–150 psig", "200–250 psig", "300–400 psig", "400–500 psig"], correctAnswer: 2, explanation: "R-410A discharge pressure typically runs 300–400 psig at normal residential cooling conditions." },
  { id: "epa-t2-33", question: "A fixed orifice metering device (piston) is charged using:", options: ["Subcooling method", "Superheat method", "Weight method only", "Sight glass only"], correctAnswer: 1, explanation: "Fixed orifice (piston) systems are charged using the superheat method. TXV systems use subcooling." },
  { id: "epa-t2-34", question: "Target superheat for a fixed orifice system is typically:", options: ["0–5°F", "10–20°F", "25–35°F", "40–50°F"], correctAnswer: 1, explanation: "Target superheat for fixed orifice systems is typically 10–20°F at the suction line near the evaporator." },
  { id: "epa-t2-35", question: "Target subcooling for a TXV system is typically:", options: ["0–5°F", "10–15°F", "25–35°F", "40–50°F"], correctAnswer: 1, explanation: "Target subcooling for TXV systems is typically 10–15°F at the liquid line, per manufacturer specifications." },
  { id: "epa-t2-36", question: "What does a low suction pressure and low discharge pressure together indicate?", options: ["Overcharge", "Undercharge or refrigerant leak", "Non-condensables", "Dirty condenser"], correctAnswer: 1, explanation: "Both pressures low = undercharge. The system does not have enough refrigerant to build normal operating pressures." },
  { id: "epa-t2-37", question: "What does a high suction pressure and high discharge pressure together indicate?", options: ["Undercharge", "Overcharge or non-condensables in the system", "Restriction in the liquid line", "Low airflow over evaporator"], correctAnswer: 1, explanation: "Both pressures high = overcharge or non-condensables. Too much refrigerant or air in the system raises both pressures." },
  { id: "epa-t2-38", question: "What does a low suction pressure and high discharge pressure together indicate?", options: ["Undercharge", "Overcharge", "Restriction in the metering device or liquid line", "Normal operation at high load"], correctAnswer: 2, explanation: "Low suction + high discharge = restriction. Refrigerant is backed up on the high side and starved on the low side." },
  { id: "epa-t2-39", question: "The purpose of a liquid line filter-drier is to:", options: ["Increase system pressure", "Remove moisture and contaminants from the liquid refrigerant", "Measure refrigerant flow", "Control superheat"], correctAnswer: 1, explanation: "Liquid line filter-driers protect the metering device and compressor from moisture, acid, and particulate contamination." },
  { id: "epa-t2-40", question: "A clogged filter-drier will cause:", options: ["High suction pressure", "A pressure drop across the drier and starved evaporator", "High discharge pressure only", "No effect on system operation"], correctAnswer: 1, explanation: "A clogged filter-drier restricts refrigerant flow, causing a pressure drop and starving the evaporator of refrigerant." },
  { id: "epa-t2-41", question: "What is the purpose of an accumulator on the suction line?", options: ["Increase suction pressure", "Prevent liquid refrigerant from reaching the compressor", "Store excess refrigerant", "Measure superheat"], correctAnswer: 1, explanation: "The accumulator traps liquid refrigerant and oil, allowing only vapor to enter the compressor, preventing liquid slugging." },
  { id: "epa-t2-42", question: "Liquid slugging in a compressor is caused by:", options: ["High superheat", "Liquid refrigerant entering the compressor", "Low discharge pressure", "High ambient temperature"], correctAnswer: 1, explanation: "Liquid slugging occurs when liquid refrigerant enters the compressor. Liquids are incompressible and can destroy the compressor." },
  { id: "epa-t2-43", question: "What is the purpose of a crankcase heater on a compressor?", options: ["Heat the refrigerant before compression", "Prevent refrigerant migration into the oil during off cycles", "Increase compressor efficiency", "Reduce starting current"], correctAnswer: 1, explanation: "Crankcase heaters keep the oil warm during off cycles, preventing refrigerant from migrating into and diluting the oil." },
  { id: "epa-t2-44", question: "A scroll compressor differs from a reciprocating compressor in that it:", options: ["Uses pistons", "Uses two spiral scrolls to compress refrigerant", "Operates at lower pressures", "Requires more oil"], correctAnswer: 1, explanation: "Scroll compressors use two interlocking spiral scrolls — one fixed, one orbiting — to compress refrigerant continuously." },
  { id: "epa-t2-45", question: "What is the purpose of a hard start kit?", options: ["Increase compressor speed", "Provide extra starting torque to a compressor that struggles to start", "Reduce starting current", "Protect against overload"], correctAnswer: 1, explanation: "Hard start kits add a start capacitor and potential relay to provide extra starting torque for compressors with high starting loads." },
  { id: "epa-t2-46", question: "A dual-run capacitor has how many terminals?", options: ["2", "3", "4", "5"], correctAnswer: 1, explanation: "A dual-run capacitor has three terminals: HERM (compressor), FAN (fan motor), and C (common)." },
  { id: "epa-t2-47", question: "What is the purpose of a high-pressure switch?", options: ["Measure discharge pressure", "Shut down the compressor if discharge pressure exceeds safe limits", "Control refrigerant flow", "Measure superheat"], correctAnswer: 1, explanation: "The high-pressure switch is a safety device that shuts down the compressor if discharge pressure exceeds the setpoint." },
  { id: "epa-t2-48", question: "What is the purpose of a low-pressure switch?", options: ["Measure suction pressure", "Shut down the compressor if suction pressure drops below safe limits", "Control refrigerant flow", "Measure subcooling"], correctAnswer: 1, explanation: "The low-pressure switch shuts down the compressor if suction pressure drops too low, protecting against loss of charge." },
  { id: "epa-t2-49", question: "A heat pump in heating mode has the outdoor coil acting as the:", options: ["Condenser", "Evaporator", "Metering device", "Accumulator"], correctAnswer: 1, explanation: "In heating mode, the reversing valve redirects refrigerant so the outdoor coil absorbs heat from outdoor air (evaporator)." },
  { id: "epa-t2-50", question: "The balance point of a heat pump is:", options: ["The outdoor temperature at which the heat pump operates most efficiently", "The outdoor temperature at which heat pump output equals building heat loss", "The indoor setpoint temperature", "The temperature at which defrost activates"], correctAnswer: 1, explanation: "The balance point is the outdoor temperature where heat pump capacity equals building heat loss. Below this, supplemental heat is needed." },
  { id: "epa-t2-51", question: "What is the purpose of a defrost cycle on a heat pump?", options: ["Cool the indoor coil", "Melt frost that accumulates on the outdoor coil in heating mode", "Increase heating capacity", "Test the reversing valve"], correctAnswer: 1, explanation: "In heating mode, the outdoor coil can frost over. Defrost temporarily reverses the cycle to melt the frost." },
  { id: "epa-t2-52", question: "During defrost, the heat pump temporarily switches to:", options: ["Heating mode at higher capacity", "Cooling mode to send hot refrigerant to the outdoor coil", "Fan-only mode", "Emergency heat only"], correctAnswer: 1, explanation: "During defrost, the cycle reverses to cooling mode, sending hot discharge gas to the outdoor coil to melt frost." },
  { id: "epa-t2-53", question: "What is the purpose of a bi-flow filter-drier in a heat pump?", options: ["Filter refrigerant in one direction only", "Filter refrigerant flowing in either direction (heating and cooling modes)", "Measure refrigerant flow", "Control superheat"], correctAnswer: 1, explanation: "Heat pumps reverse refrigerant flow, so bi-flow filter-driers are used to filter in both directions." },
  { id: "epa-t2-54", question: "A variable-speed (inverter-driven) compressor adjusts capacity by:", options: ["Cycling on and off", "Varying the compressor motor speed", "Bypassing refrigerant", "Changing the refrigerant type"], correctAnswer: 1, explanation: "Inverter-driven compressors vary motor speed to precisely match the load, improving efficiency and comfort." },
  { id: "epa-t2-55", question: "What is the purpose of a check valve in a heat pump refrigerant circuit?", options: ["Prevent refrigerant from flowing backward through a metering device", "Measure refrigerant flow", "Control superheat", "Filter contaminants"], correctAnswer: 0, explanation: "Check valves allow refrigerant to bypass a metering device in one flow direction, allowing the same metering device to work in both heating and cooling modes." },
  { id: "epa-t2-56", question: "Refrigerant R-407C is a replacement for R-22 with what characteristic?", options: ["Zero temperature glide", "Temperature glide of approximately 7°F", "Higher ODP than R-22", "Same pressure as R-410A"], correctAnswer: 1, explanation: "R-407C has a temperature glide of approximately 7°F. It must be charged as a liquid to maintain proper composition." },
  { id: "epa-t2-57", question: "What is the purpose of a suction line accumulator in a heat pump?", options: ["Increase suction pressure", "Protect the compressor from liquid refrigerant during mode switching", "Store excess refrigerant", "Measure superheat"], correctAnswer: 1, explanation: "During mode switching (heating to cooling or vice versa), liquid refrigerant can flood back. The accumulator protects the compressor." },
  { id: "epa-t2-58", question: "A comfort cooling system with more than 50 lbs of refrigerant must be repaired if the annual leak rate exceeds:", options: ["5%", "10%", "20%", "35%"], correctAnswer: 1, explanation: "Comfort cooling systems (residential and commercial AC) must be repaired if the annual leak rate exceeds 10%." },
  { id: "epa-t2-59", question: "Commercial refrigeration systems must be repaired if the annual leak rate exceeds:", options: ["10%", "20%", "30%", "35%"], correctAnswer: 1, explanation: "Commercial refrigeration systems must be repaired if the annual leak rate exceeds 20%." },
  { id: "epa-t2-60", question: "Industrial process refrigeration systems must be repaired if the annual leak rate exceeds:", options: ["10%", "20%", "30%", "35%"], correctAnswer: 2, explanation: "Industrial process refrigeration systems must be repaired if the annual leak rate exceeds 30%." },
  { id: "epa-t2-61", question: "After a major repair, a system must be leak-tested before recharging using:", options: ["Refrigerant at operating pressure", "Dry nitrogen at 150 psig or manufacturer's specified test pressure", "Compressed air", "Oxygen"], correctAnswer: 1, explanation: "Dry nitrogen is used for pressure testing after major repairs. Never use oxygen (explosion risk) or compressed air (moisture)." },
  { id: "epa-t2-62", question: "What is the purpose of a standing vacuum test?", options: ["Measure system charge", "Verify system integrity — a rising vacuum indicates a leak", "Measure superheat", "Test the compressor"], correctAnswer: 1, explanation: "After evacuation, a standing vacuum test monitors for rising pressure (vacuum loss), which indicates a leak or moisture in the system." },
  { id: "epa-t2-63", question: "A micron gauge reads 500 microns after evacuation. The technician then isolates the vacuum pump and the reading rises to 1,500 microns. This indicates:", options: ["Normal — vacuum always rises slightly", "A leak or moisture in the system", "The vacuum pump is too powerful", "The system is properly evacuated"], correctAnswer: 1, explanation: "A rising vacuum after isolation indicates either a leak (air entering) or moisture boiling off. The system is not ready to charge." },
  { id: "epa-t2-64", question: "What is the purpose of a refrigerant recovery machine's oil separator?", options: ["Remove moisture from refrigerant", "Separate compressor oil from recovered refrigerant to prevent contamination of the recovery cylinder", "Measure refrigerant purity", "Control recovery speed"], correctAnswer: 1, explanation: "The oil separator prevents recovery machine oil from contaminating the recovered refrigerant in the recovery cylinder." },
  { id: "epa-t2-65", question: "When charging R-410A into a system, the refrigerant must be added as:", options: ["Vapor from the top of the cylinder", "Liquid from the bottom of the cylinder (cylinder inverted)", "Either vapor or liquid", "Gas at low pressure only"], correctAnswer: 1, explanation: "R-410A is a near-azeotropic blend that must be charged as liquid to maintain proper composition. Invert the cylinder to charge liquid." },
  { id: "epa-t2-66", question: "What is the purpose of a liquid line solenoid valve?", options: ["Control compressor speed", "Stop refrigerant flow to the evaporator when the system shuts down (pump-down)", "Measure liquid refrigerant temperature", "Filter contaminants"], correctAnswer: 1, explanation: "Liquid line solenoid valves close when the system shuts down, preventing refrigerant migration to the evaporator (pump-down control)." },
  { id: "epa-t2-67", question: "A pump-down cycle:", options: ["Removes refrigerant from the system", "Moves refrigerant from the low side to the high side before shutdown", "Adds refrigerant to the system", "Tests the compressor"], correctAnswer: 1, explanation: "Pump-down moves refrigerant from the low side to the receiver/high side before shutdown, preventing liquid migration during the off cycle." },
  { id: "epa-t2-68", question: "What is the purpose of a receiver in a refrigeration system?", options: ["Store excess refrigerant and ensure a solid liquid supply to the metering device", "Measure refrigerant charge", "Filter contaminants", "Control superheat"], correctAnswer: 0, explanation: "The receiver stores excess refrigerant and ensures a continuous supply of liquid refrigerant to the metering device under varying load conditions." },
  { id: "epa-t2-69", question: "A sight glass with a green moisture indicator means:", options: ["The system is overcharged", "Moisture content is acceptable", "The system needs evacuation", "The refrigerant is contaminated"], correctAnswer: 1, explanation: "A green moisture indicator in the sight glass means moisture is within acceptable limits. Yellow indicates moisture is present." },
  { id: "epa-t2-70", question: "What is the purpose of a hot gas bypass valve?", options: ["Recover refrigerant", "Prevent evaporator freeze-up at low loads by bypassing hot discharge gas to the suction side", "Increase system capacity", "Control condenser fan speed"], correctAnswer: 1, explanation: "Hot gas bypass prevents evaporator freeze-up at low loads by introducing hot discharge gas to maintain minimum evaporator pressure." },
  { id: "epa-t2-71", question: "A compressor with high amperage draw and low suction pressure most likely has:", options: ["A refrigerant overcharge", "A worn or failed compressor (internal leak)", "A dirty condenser", "A bad capacitor"], correctAnswer: 1, explanation: "High amperage with low suction pressure suggests the compressor is working hard but not pumping effectively — internal wear or failure." },
  { id: "epa-t2-72", question: "What is the purpose of a crankcase pressure regulator (CPR)?", options: ["Regulate discharge pressure", "Limit suction pressure to the compressor during pulldown to prevent motor overload", "Control refrigerant flow", "Measure crankcase oil level"], correctAnswer: 1, explanation: "CPR valves limit suction pressure during pulldown (when a warm system starts up), preventing compressor motor overload." },
  { id: "epa-t2-73", question: "An evaporator pressure regulator (EPR) is used to:", options: ["Increase evaporator pressure", "Maintain minimum evaporator pressure to prevent freezing in multi-temperature systems", "Control superheat", "Measure evaporator temperature"], correctAnswer: 1, explanation: "EPR valves maintain minimum evaporator pressure in multi-temperature systems, preventing the warmest evaporator from freezing." },
  { id: "epa-t2-74", question: "What is the purpose of a head pressure control valve?", options: ["Limit discharge pressure", "Maintain minimum head pressure in cold weather to ensure proper refrigerant flow", "Control compressor speed", "Measure discharge temperature"], correctAnswer: 1, explanation: "Head pressure control valves maintain minimum condensing pressure in cold weather, ensuring adequate pressure differential for refrigerant flow." },
  { id: "epa-t2-75", question: "A technician must verify that a high-pressure system is properly evacuated before charging. The correct sequence is:", options: ["Charge first, then evacuate", "Pressure test with nitrogen, then evacuate to 500 microns or below, then charge", "Evacuate, then pressure test, then charge", "Charge, then pressure test"], correctAnswer: 1, explanation: "Correct sequence: pressure test with nitrogen to verify no leaks, then evacuate to 500 microns or below, then charge with refrigerant." },
  // ── Type II questions 76–100: high-frequency real-exam topics ─────────
  { id: "epa-t2-76", question: "System-dependent recovery equipment is prohibited on high-pressure systems containing more than:", options: ["5 lbs", "10 lbs", "15 lbs", "50 lbs"], correctAnswer: 2, explanation: "System-dependent recovery equipment cannot be used on high-pressure systems with more than 15 lbs of refrigerant. Self-contained equipment is required." },
  { id: "epa-t2-77", question: "A 'major repair' on a high-pressure system is defined as:", options: ["Any repair costing over $500", "Any repair that involves opening the refrigerant circuit (breaking a refrigerant-containing joint)", "Replacing the compressor only", "Any repair requiring more than 1 hour"], correctAnswer: 1, explanation: "A major repair is any repair that involves opening the refrigerant circuit — breaking a joint, replacing a component, etc." },
  { id: "epa-t2-78", question: "After a major repair on a high-pressure system, before recharging, the technician must:", options: ["Charge immediately", "Leak test with nitrogen, then evacuate to required level", "Only evacuate — no leak test needed", "Only leak test — no evacuation needed"], correctAnswer: 1, explanation: "After a major repair: pressure test with nitrogen to verify the repair, then evacuate to the required level before recharging." },
  { id: "epa-t2-79", question: "For a non-major repair on a high-pressure system with a leak, the recovery requirement is:", options: ["Same as major repair", "0 psig (atmospheric pressure)", "10 in. Hg vacuum", "No recovery required"], correctAnswer: 1, explanation: "For non-major repairs on leaky systems, recovery to 0 psig is required. Major repairs require deeper evacuation." },
  { id: "epa-t2-80", question: "The preferred gas for leak testing a high-pressure system is:", options: ["Pure refrigerant at operating pressure", "Nitrogen alone, or nitrogen with a trace of HCFC-22 as a tracer", "Compressed air", "Oxygen"], correctAnswer: 1, explanation: "Nitrogen alone is best. Nitrogen with a trace of HCFC-22 as a tracer gas is also acceptable. Never use compressed air (moisture) or oxygen (explosion risk)." },
  { id: "epa-t2-81", question: "After reaching the required vacuum level, a technician should wait before charging because:", options: ["The vacuum pump needs to cool down", "A pressure rise indicates residual liquid refrigerant or moisture that needs more time to evacuate", "The refrigerant needs to warm up", "Waiting is not necessary"], correctAnswer: 1, explanation: "After isolation, monitor for pressure rise. Rising pressure means liquid refrigerant is still boiling off or moisture is present — continue evacuation." },
  { id: "epa-t2-82", question: "Signs of a refrigerant leak in a hermetically sealed high-pressure system include:", options: ["Low head pressure only", "Excessive superheat and oil traces around fittings and joints", "High suction pressure", "Normal operating pressures"], correctAnswer: 1, explanation: "Excessive superheat (starved evaporator) and oil traces (oil migrates with refrigerant through leak points) are key signs of a leak." },
  { id: "epa-t2-83", question: "A comfort cooling system with more than 50 lbs of refrigerant that exceeds the 10% annual leak rate must be repaired within:", options: ["15 days", "30 days", "60 days", "120 days"], correctAnswer: 1, explanation: "Comfort cooling systems must be repaired within 30 days of discovering the leak rate exceeds 10% annually." },
  { id: "epa-t2-84", question: "An extension to the 30-day leak repair deadline may be granted if:", options: ["The technician is busy", "The owner submits a retrofit or retirement plan within 30 days", "The system is over 10 years old", "The refrigerant is R-410A"], correctAnswer: 1, explanation: "A one-time extension is available if the owner submits a written plan to retrofit or retire the equipment within the 30-day window." },
  { id: "epa-t2-85", question: "Leak repair records for systems with more than 50 lbs of refrigerant must be kept for:", options: ["1 year", "3 years", "5 years", "10 years"], correctAnswer: 1, explanation: "Leak repair records must be maintained for at least 3 years and made available to EPA inspectors upon request." },
  { id: "epa-t2-86", question: "To speed up recovery from a high-pressure system, a technician should:", options: ["Add more refrigerant first", "Recover liquid refrigerant first, then vapor", "Recover vapor first, then liquid", "Only recover vapor"], correctAnswer: 1, explanation: "Recovering liquid first is faster — liquid contains far more refrigerant mass per volume than vapor." },
  { id: "epa-t2-87", question: "To speed up recovery, the recovery vessel should be:", options: ["Heated", "Chilled (placed in ice or cold water)", "At room temperature", "Pressurized with nitrogen"], correctAnswer: 1, explanation: "Chilling the recovery vessel lowers its internal pressure, increasing the pressure differential that drives refrigerant in faster." },
  { id: "epa-t2-88", question: "Hydrocarbons (propane, isobutane) are NOT approved for retrofitting high-pressure HVAC systems because:", options: ["They are too expensive", "They are highly flammable and not approved by EPA SNAP for this use", "They have high ODP", "They are not available in the US"], correctAnswer: 1, explanation: "EPA SNAP has not approved hydrocarbon refrigerants for retrofit of residential or commercial AC systems due to flammability risk." },
  { id: "epa-t2-89", question: "ASHRAE Standard 15 requires an oxygen deprivation sensor in machinery rooms because:", options: ["Refrigerants are toxic", "All refrigerants can displace oxygen and cause suffocation, regardless of toxicity", "Only toxic refrigerants require sensors", "Only flammable refrigerants require sensors"], correctAnswer: 1, explanation: "ASHRAE 15 requires oxygen deprivation sensors for all refrigerant machinery rooms — all refrigerants can displace oxygen." },
  { id: "epa-t2-90", question: "A hermetic compressor should never be energized while under vacuum because:", options: ["It wastes electricity", "The motor windings can overheat and burn out without refrigerant vapor for cooling", "It will draw in air", "The oil will foam"], correctAnswer: 1, explanation: "Hermetic compressor motors are cooled by refrigerant vapor. Running under vacuum removes this cooling, causing motor winding failure." },
  { id: "epa-t2-91", question: "The psig to psia conversion is:", options: ["psia = psig − 14.7", "psia = psig + 14.7", "psia = psig × 14.7", "psia = psig ÷ 14.7"], correctAnswer: 1, explanation: "Absolute pressure (psia) = gauge pressure (psig) + atmospheric pressure (14.7 psi). PT charts use psia; gauges read psig." },
  { id: "epa-t2-92", question: "On a PT chart, the listed pressure for R-410A at 40°F is approximately 118 psig. This means the absolute pressure is:", options: ["118 psia", "103.3 psia", "132.7 psia", "14.7 psia"], correctAnswer: 2, explanation: "psia = psig + 14.7 = 118 + 14.7 = 132.7 psia. PT charts may list either psig or psia — always check the chart header." },
  { id: "epa-t2-93", question: "In a high-pressure system, the refrigerant in the liquid line is in what state?", options: ["Superheated vapor", "Saturated vapor", "Subcooled liquid", "Two-phase mixture"], correctAnswer: 2, explanation: "The liquid line carries subcooled liquid refrigerant from the condenser to the metering device. Subcooling ensures no flash gas at the metering device." },
  { id: "epa-t2-94", question: "In a high-pressure system, the refrigerant in the suction line is in what state?", options: ["Subcooled liquid", "Saturated liquid", "Superheated vapor", "Two-phase mixture"], correctAnswer: 2, explanation: "The suction line carries superheated vapor from the evaporator to the compressor. Superheat ensures no liquid reaches the compressor." },
  { id: "epa-t2-95", question: "The receiver in a refrigeration system stores refrigerant in what state?", options: ["Superheated vapor", "Subcooled liquid", "Saturated liquid (liquid and vapor)", "Frozen solid"], correctAnswer: 2, explanation: "The receiver stores refrigerant as saturated liquid (with some vapor space above). It acts as a reservoir to accommodate charge variations." },
  { id: "epa-t2-96", question: "The accumulator in a refrigeration system stores refrigerant in what state?", options: ["Subcooled liquid", "Superheated vapor", "Saturated mixture — traps liquid, allows only vapor to pass to compressor", "Frozen solid"], correctAnswer: 2, explanation: "The accumulator traps liquid refrigerant and oil, allowing only vapor to pass to the compressor, preventing liquid slugging." },
  { id: "epa-t2-97", question: "To reduce cross-contamination when switching between refrigerant types on recovery equipment:", options: ["Just connect and start — contamination is minor", "Change the compressor oil and replace filter-driers in the recovery machine", "Only change the hoses", "No action needed if both refrigerants are HFCs"], correctAnswer: 1, explanation: "Change the recovery machine's compressor oil and replace its filter-driers between different refrigerant types to prevent cross-contamination." },
  { id: "epa-t2-98", question: "The EPA 608 Type II exam consists of:", options: ["25 questions (Type II topics only)", "50 questions (25 Core + 25 Type II)", "75 questions", "100 questions"], correctAnswer: 1, explanation: "The Type II exam has 50 questions: 25 from the Core group and 25 from the Type II technical group." },
  { id: "epa-t2-99", question: "A high-pressure system with 150 lbs of R-410A requires recovery to what level before a major repair, using post-1993 equipment?", options: ["4 in. Hg vacuum", "0 psig", "10 in. Hg vacuum", "500 microns"], correctAnswer: 1, explanation: "High-pressure systems under 200 lbs require recovery to 0 psig using post-November 15, 1993 equipment before major repairs." },
  { id: "epa-t2-100", question: "A high-pressure system with 250 lbs of R-410A requires recovery to what level before a major repair, using post-1993 equipment?", options: ["0 psig", "4 in. Hg vacuum", "10 in. Hg vacuum", "500 microns"], correctAnswer: 2, explanation: "High-pressure systems with 200 lbs or more require recovery to 10 in. Hg vacuum using post-November 15, 1993 equipment." },
];

// ── EPA 608 Type III — Low-Pressure Systems (75 questions) ──────────────

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
  // ── Type III questions 26–75 ──────────────────────────────────────────
  { id: "epa-t3-26", question: "R-11 is classified as what type of refrigerant?", options: ["HFC", "HCFC", "CFC", "HFO"], correctAnswer: 2, explanation: "R-11 (trichlorofluoromethane) is a CFC with an ODP of 1.0 — the baseline for ozone depletion potential." },
  { id: "epa-t3-27", question: "R-123 is classified as what type of refrigerant?", options: ["CFC", "HCFC", "HFC", "HFO"], correctAnswer: 1, explanation: "R-123 is an HCFC with a much lower ODP (0.02) than R-11 (1.0). It replaced R-11 in centrifugal chillers." },
  { id: "epa-t3-28", question: "What is the boiling point of R-123 at atmospheric pressure?", options: ["−40°F", "−21°F", "82°F", "212°F"], correctAnswer: 2, explanation: "R-123 boils at approximately 82°F at atmospheric pressure, which is why low-pressure systems operate in vacuum at normal temperatures." },
  { id: "epa-t3-29", question: "What is the boiling point of R-11 at atmospheric pressure?", options: ["−40°F", "−21°F", "74.5°F", "212°F"], correctAnswer: 2, explanation: "R-11 boils at approximately 74.5°F at atmospheric pressure." },
  { id: "epa-t3-30", question: "A centrifugal chiller evaporator typically operates at what absolute pressure?", options: ["Above 14.7 psia", "Below 14.7 psia (in vacuum)", "Exactly 14.7 psia", "Above 100 psia"], correctAnswer: 1, explanation: "Low-pressure chiller evaporators operate below atmospheric pressure (below 14.7 psia) — in vacuum — during normal operation." },
  { id: "epa-t3-31", question: "What is the primary reason air leaks INTO a low-pressure system rather than refrigerant leaking out?", options: ["The refrigerant is heavier than air", "The system operates below atmospheric pressure (in vacuum)", "The refrigerant is non-toxic", "The system has no service valves"], correctAnswer: 1, explanation: "Since the system operates below atmospheric pressure, the pressure differential drives air inward through any leak." },
  { id: "epa-t3-32", question: "Non-condensable gases in a low-pressure chiller cause:", options: ["Lower head pressure", "Higher condenser pressure and reduced efficiency", "Lower evaporator pressure", "No effect"], correctAnswer: 1, explanation: "Non-condensables (air) accumulate in the condenser, raising condenser pressure and reducing chiller efficiency." },
  { id: "epa-t3-33", question: "A purge unit on a centrifugal chiller operates:", options: ["Manually only", "Automatically to continuously remove non-condensables", "Only during startup", "Only during shutdown"], correctAnswer: 1, explanation: "Modern purge units operate automatically, continuously monitoring and removing non-condensable gases from the condenser." },
  { id: "epa-t3-34", question: "The purge unit removes non-condensables by:", options: ["Heating the refrigerant", "Separating refrigerant from air and venting the air while recovering the refrigerant", "Compressing the air into the refrigerant", "Draining the air through the oil system"], correctAnswer: 1, explanation: "Purge units separate refrigerant vapor from air, recover the refrigerant, and vent the air (with minimal refrigerant loss)." },
  { id: "epa-t3-35", question: "A high-efficiency purge unit must lose less than how much refrigerant per pound of air purged?", options: ["0.5 lbs", "0.1 lbs", "1.0 lbs", "0.01 lbs"], correctAnswer: 1, explanation: "High-efficiency purge units must lose less than 0.1 lbs of refrigerant per pound of air removed." },
  { id: "epa-t3-36", question: "What is the purpose of the economizer on a centrifugal chiller?", options: ["Remove non-condensables", "Flash-cool liquid refrigerant between the condenser and evaporator to improve efficiency", "Control water flow", "Monitor refrigerant level"], correctAnswer: 1, explanation: "The economizer flash-cools liquid refrigerant, reducing the load on the evaporator and improving overall chiller efficiency." },
  { id: "epa-t3-37", question: "Centrifugal chiller capacity is typically controlled by:", options: ["Cycling the compressor on and off", "Inlet guide vanes (IGVs) that vary refrigerant flow into the compressor", "Changing the refrigerant charge", "Varying condenser water flow only"], correctAnswer: 1, explanation: "Inlet guide vanes (IGVs) modulate refrigerant flow into the centrifugal compressor, allowing continuous capacity control." },
  { id: "epa-t3-38", question: "What is 'surge' in a centrifugal compressor?", options: ["Normal high-capacity operation", "Unstable reverse flow of refrigerant through the compressor at low load", "High-speed operation", "Startup condition"], correctAnswer: 1, explanation: "Surge occurs when the compressor cannot maintain flow against the head pressure, causing refrigerant to flow backward. It is damaging and must be avoided." },
  { id: "epa-t3-39", question: "To prevent surge, centrifugal chillers use:", options: ["Higher refrigerant charge", "Hot gas bypass or inlet guide vane control at low loads", "Faster compressor speed", "Lower condenser water temperature"], correctAnswer: 1, explanation: "Hot gas bypass and IGV control prevent surge by maintaining minimum flow through the compressor at low loads." },
  { id: "epa-t3-40", question: "What is the purpose of the oil management system on a centrifugal chiller?", options: ["Cool the refrigerant", "Lubricate bearings and return oil from the refrigerant circuit to the compressor", "Filter non-condensables", "Control capacity"], correctAnswer: 1, explanation: "The oil management system lubricates compressor bearings and recovers oil that migrates into the refrigerant circuit." },
  { id: "epa-t3-41", question: "Oil dilution in a low-pressure chiller occurs when:", options: ["Too much oil is added", "Refrigerant migrates into the oil during off cycles, thinning it", "The oil overheats", "The compressor runs too fast"], correctAnswer: 1, explanation: "Refrigerant can migrate into the oil sump during off cycles, diluting the oil and reducing lubrication effectiveness." },
  { id: "epa-t3-42", question: "Before opening a low-pressure chiller for service, the technician must first:", options: ["Pressurize with nitrogen", "Recover refrigerant to the required level", "Drain the chilled water", "Remove the purge unit"], correctAnswer: 1, explanation: "Refrigerant must be recovered to the required level (0 psig for under 200 lbs, 25 mm Hg absolute for 200 lbs or more) before opening." },
  { id: "epa-t3-43", question: "To facilitate recovery from a low-pressure chiller, the technician can:", options: ["Cool the system to reduce pressure", "Heat the refrigerant (raise chilled water temperature) to increase pressure above 0 psig", "Add nitrogen to increase pressure", "Use a vacuum pump to pull refrigerant out"], correctAnswer: 1, explanation: "Heating the refrigerant raises its pressure above 0 psig, making recovery possible without requiring a vacuum on the recovery side." },
  { id: "epa-t3-44", question: "What is the maximum nitrogen pressure for leak testing a low-pressure chiller?", options: ["5 psig", "10 psig", "150 psig", "Manufacturer's specified test pressure"], correctAnswer: 3, explanation: "Never exceed the manufacturer's specified test pressure. Low-pressure vessels are not designed for high pressures." },
  { id: "epa-t3-45", question: "A rupture disc on a low-pressure chiller is designed to burst at:", options: ["Any pressure above atmospheric", "A predetermined pressure to prevent vessel failure", "10 psig always", "The normal operating pressure"], correctAnswer: 1, explanation: "Rupture discs are one-time safety devices that burst at a predetermined pressure to relieve overpressure and prevent catastrophic failure." },
  { id: "epa-t3-46", question: "After a rupture disc bursts on a low-pressure chiller:", options: ["It resets automatically", "It must be replaced — it is a one-time device", "The system can continue operating", "It can be repaired in the field"], correctAnswer: 1, explanation: "Rupture discs are one-time devices. After bursting, they must be replaced before the system can be returned to service." },
  { id: "epa-t3-47", question: "What is the purpose of the chilled water pump in a chiller system?", options: ["Circulate refrigerant", "Circulate chilled water from the evaporator to the building cooling coils", "Cool the condenser", "Lubricate the compressor"], correctAnswer: 1, explanation: "The chilled water pump circulates water between the chiller evaporator and the building's air handling units." },
  { id: "epa-t3-48", question: "What is the purpose of the condenser water pump in a water-cooled chiller?", options: ["Circulate chilled water", "Circulate condenser water between the chiller condenser and the cooling tower", "Lubricate the compressor", "Control refrigerant flow"], correctAnswer: 1, explanation: "The condenser water pump circulates water between the chiller condenser and the cooling tower, rejecting heat." },
  { id: "epa-t3-49", question: "A cooling tower rejects heat by:", options: ["Refrigeration", "Evaporative cooling — water evaporation removes heat from the condenser water", "Conduction to the ground", "Radiation only"], correctAnswer: 1, explanation: "Cooling towers use evaporative cooling — a small portion of water evaporates, removing large amounts of heat from the remaining water." },
  { id: "epa-t3-50", question: "Approach temperature in a cooling tower is:", options: ["The difference between entering and leaving water temperature", "The difference between leaving water temperature and wet-bulb temperature", "The outdoor dry-bulb temperature", "The condenser water supply temperature"], correctAnswer: 1, explanation: "Approach temperature is the difference between the cooling tower leaving water temperature and the ambient wet-bulb temperature." },
  { id: "epa-t3-51", question: "What is the purpose of blowdown in a cooling tower?", options: ["Remove non-condensables", "Remove concentrated minerals and contaminants by draining a portion of the water", "Increase water flow", "Test water quality"], correctAnswer: 1, explanation: "Blowdown removes concentrated minerals that build up as water evaporates, preventing scale and corrosion." },
  { id: "epa-t3-52", question: "Legionella bacteria can grow in cooling towers when:", options: ["Water temperature is below 32°F", "Water temperature is between 77–113°F with stagnant conditions", "Water is treated with biocide", "Water flow is continuous"], correctAnswer: 1, explanation: "Legionella thrives in warm, stagnant water (77–113°F). Cooling towers require regular water treatment and maintenance." },
  { id: "epa-t3-53", question: "What is the leaving chilled water temperature (LCHWT) for a typical comfort cooling chiller?", options: ["32°F", "44–45°F", "55–60°F", "65–70°F"], correctAnswer: 1, explanation: "Typical comfort cooling chillers produce chilled water at 44–45°F leaving the evaporator." },
  { id: "epa-t3-54", question: "What is the chilled water temperature differential (delta-T) for a typical chiller system?", options: ["1–2°F", "5–10°F", "15–20°F", "25–30°F"], correctAnswer: 1, explanation: "Typical chilled water systems have a 10°F delta-T — 44°F supply and 54°F return." },
  { id: "epa-t3-55", question: "What is the condenser water supply temperature for a typical water-cooled chiller?", options: ["44°F", "55°F", "85°F", "120°F"], correctAnswer: 2, explanation: "Condenser water typically enters the chiller at 85°F and leaves at 95°F in standard design conditions." },
  { id: "epa-t3-56", question: "A chiller's COP (coefficient of performance) is calculated as:", options: ["Cooling capacity divided by power input", "Power input divided by cooling capacity", "Cooling capacity times power input", "Condenser load divided by evaporator load"], correctAnswer: 0, explanation: "COP = cooling capacity (tons or BTU/hr) divided by power input (kW or BTU/hr). Higher COP = more efficient." },
  { id: "epa-t3-57", question: "kW/ton is a measure of:", options: ["Chiller cooling capacity", "Chiller energy efficiency — lower is better", "Refrigerant charge", "Condenser water flow"], correctAnswer: 1, explanation: "kW/ton measures how many kilowatts of electricity are consumed per ton of cooling. Lower kW/ton = more efficient." },
  { id: "epa-t3-58", question: "What is the purpose of a chiller's oil cooler?", options: ["Cool the refrigerant", "Remove heat from the compressor oil to maintain proper viscosity", "Cool the condenser water", "Reduce discharge temperature"], correctAnswer: 1, explanation: "The oil cooler removes heat from compressor oil, maintaining proper viscosity for lubrication." },
  { id: "epa-t3-59", question: "Hydrolysis in a low-pressure chiller produces:", options: ["Nitrogen gas", "Hydrochloric and hydrofluoric acids", "Carbon dioxide", "Oxygen"], correctAnswer: 1, explanation: "Water reacting with R-11 or R-123 produces hydrochloric and hydrofluoric acids, which corrode system components." },
  { id: "epa-t3-60", question: "What is the purpose of a moisture indicator in a low-pressure chiller?", options: ["Measure refrigerant level", "Detect moisture in the refrigerant circuit", "Measure oil level", "Control purge unit operation"], correctAnswer: 1, explanation: "Moisture indicators detect water in the refrigerant circuit, which can cause hydrolysis and acid formation." },
  { id: "epa-t3-61", question: "A low-pressure chiller that has been open to atmosphere must be:", options: ["Recharged immediately", "Evacuated and dehydrated before recharging", "Pressurized with nitrogen only", "Inspected visually only"], correctAnswer: 1, explanation: "After being open to atmosphere, the system must be thoroughly evacuated and dehydrated to remove air and moisture before recharging." },
  { id: "epa-t3-62", question: "What is the purpose of a chiller's capacity control system?", options: ["Control refrigerant charge", "Match chiller output to building cooling load to maintain setpoint efficiently", "Control condenser water temperature", "Monitor refrigerant purity"], correctAnswer: 1, explanation: "Capacity control matches chiller output to the actual cooling load, maintaining the chilled water setpoint while minimizing energy use." },
  { id: "epa-t3-63", question: "A chiller that is 'hunting' (cycling capacity up and down rapidly) may indicate:", options: ["Normal operation", "Oversized chiller, control system issue, or low load conditions", "Undercharge", "Dirty condenser"], correctAnswer: 1, explanation: "Hunting typically indicates an oversized chiller for the current load, a control system problem, or very low load conditions." },
  { id: "epa-t3-64", question: "What is the purpose of a chiller's evaporator freeze protection?", options: ["Prevent refrigerant from freezing", "Shut down the chiller if chilled water temperature approaches 32°F to prevent tube freezing", "Control chilled water flow", "Monitor refrigerant level"], correctAnswer: 1, explanation: "Freeze protection shuts down the chiller if chilled water temperature drops too low, preventing ice formation and tube rupture." },
  { id: "epa-t3-65", question: "The leak rate threshold for industrial process refrigeration requiring repair is:", options: ["10%", "20%", "30%", "35%"], correctAnswer: 2, explanation: "Industrial process refrigeration systems must be repaired if the annual leak rate exceeds 30%." },
  { id: "epa-t3-66", question: "What is the purpose of a chiller log?", options: ["Record refrigerant purchases only", "Track operating parameters to identify trends and detect problems early", "Record technician certifications", "Document customer complaints only"], correctAnswer: 1, explanation: "Chiller logs record daily operating parameters (pressures, temperatures, amps, water temperatures) to identify trends and catch problems early." },
  { id: "epa-t3-67", question: "A centrifugal chiller's impeller speed is typically:", options: ["1,750 RPM", "3,600 RPM", "10,000–20,000 RPM", "100,000 RPM"], correctAnswer: 2, explanation: "Centrifugal compressor impellers typically spin at 10,000–20,000 RPM to generate sufficient velocity for compression." },
  { id: "epa-t3-68", question: "What is the purpose of a variable frequency drive (VFD) on a centrifugal chiller?", options: ["Control refrigerant flow", "Vary compressor speed to match load and improve part-load efficiency", "Control condenser water flow", "Monitor refrigerant purity"], correctAnswer: 1, explanation: "VFDs vary compressor motor speed, allowing the chiller to operate efficiently at part load — a major efficiency improvement." },
  { id: "epa-t3-69", question: "A chiller with a VFD can achieve efficiency improvements at part load because:", options: ["It uses less refrigerant", "Reducing speed reduces power consumption by the cube of the speed ratio", "It bypasses the condenser", "It uses a smaller impeller"], correctAnswer: 1, explanation: "Centrifugal fan/pump laws: power varies with the cube of speed. Reducing speed to 80% reduces power to about 51%." },
  { id: "epa-t3-70", question: "What is the purpose of a chiller's oil heater?", options: ["Heat the refrigerant", "Prevent refrigerant migration into the oil during off cycles", "Heat the chilled water", "Warm the compressor before startup"], correctAnswer: 1, explanation: "Oil heaters keep the oil warm during off cycles, preventing refrigerant from migrating into and diluting the oil." },
  { id: "epa-t3-71", question: "Before starting a centrifugal chiller after a long shutdown, the technician should:", options: ["Start immediately at full load", "Verify oil level, check for refrigerant migration, run oil heater, and start at minimum load", "Add refrigerant first", "Test the purge unit only"], correctAnswer: 1, explanation: "Pre-startup checks include verifying oil level, ensuring oil heater has been on, checking for refrigerant migration, and starting at minimum load." },
  { id: "epa-t3-72", question: "What is the purpose of a chiller's condenser pressure transducer?", options: ["Measure chilled water temperature", "Monitor condenser (high-side) pressure for control and safety", "Control refrigerant charge", "Measure oil pressure"], correctAnswer: 1, explanation: "Condenser pressure transducers monitor high-side pressure for capacity control, safety cutouts, and performance monitoring." },
  { id: "epa-t3-73", question: "A low-pressure chiller that shows increasing purge frequency over time indicates:", options: ["Normal aging", "A developing leak allowing air to enter the system", "Overcharge of refrigerant", "Improving efficiency"], correctAnswer: 1, explanation: "Increasing purge frequency means more air is entering the system — a leak is developing and must be found and repaired." },
  { id: "epa-t3-74", question: "What is the purpose of a chiller's evaporator pressure transducer?", options: ["Measure chilled water flow", "Monitor evaporator (low-side) pressure for control, freeze protection, and safety", "Control refrigerant charge", "Measure oil temperature"], correctAnswer: 1, explanation: "Evaporator pressure transducers monitor low-side pressure for capacity control, freeze protection, and safety cutouts." },
  { id: "epa-t3-75", question: "Type III certification is required to service:", options: ["Any refrigerant-containing equipment", "Low-pressure systems such as centrifugal chillers using R-11, R-113, or R-123", "High-pressure systems only", "Small appliances only"], correctAnswer: 1, explanation: "Type III certification covers low-pressure equipment — centrifugal chillers and similar systems using low-pressure refrigerants." },
  // ── Type III questions 76–100: high-frequency real-exam topics ────────
  { id: "epa-t3-76", question: "The preferred method to pressurize a low-pressure chiller for leak testing is:", options: ["Nitrogen at 150 psig", "Hot water method or a built-in pressurization device (e.g., Prevac)", "Compressed air", "Refrigerant at operating pressure"], correctAnswer: 1, explanation: "The preferred pressurization methods for low-pressure chillers are the hot water method or a built-in device like Prevac. Nitrogen is acceptable but must not exceed 10 psig." },
  { id: "epa-t3-77", question: "The maximum pressure for pressurizing a low-pressure chiller with nitrogen for leak testing is:", options: ["5 psig", "10 psig", "50 psig", "150 psig"], correctAnswer: 1, explanation: "Low-pressure chiller vessels are not designed for high pressures. Never exceed 10 psig with nitrogen unless the manufacturer specifies a higher test pressure." },
  { id: "epa-t3-78", question: "Excessive purging from a low-pressure chiller's purge unit is a sign of:", options: ["Normal operation", "A leak allowing air to enter the system", "Overcharge of refrigerant", "High efficiency operation"], correctAnswer: 1, explanation: "Frequent or excessive purging means air is continuously entering through a leak. The leak must be found and repaired." },
  { id: "epa-t3-79", question: "Before recovering refrigerant from a low-pressure chiller, the technician should heat the refrigerant to:", options: ["Freeze the water side", "Raise refrigerant pressure above 0 psig to enable recovery without pulling a vacuum on the recovery side", "Cool the system for safety", "Increase refrigerant viscosity"], correctAnswer: 1, explanation: "Heating raises the refrigerant pressure above atmospheric, allowing recovery equipment to push refrigerant into the recovery vessel without needing to pull a vacuum." },
  { id: "epa-t3-80", question: "During recovery from a low-pressure chiller, the technician must also recover:", options: ["Only liquid refrigerant", "Both liquid AND vapor refrigerant", "Only vapor refrigerant", "Only the refrigerant in the evaporator"], correctAnswer: 1, explanation: "Both liquid and vapor must be recovered from low-pressure systems. Recovering only liquid leaves significant vapor refrigerant in the system." },
  { id: "epa-t3-81", question: "Before removing oil from a low-pressure chiller, the oil should be heated to approximately:", options: ["70°F", "100°F", "130°F", "200°F"], correctAnswer: 2, explanation: "Heating oil to 130°F before removal drives dissolved refrigerant out of the oil, minimizing refrigerant release when the oil is drained." },
  { id: "epa-t3-82", question: "During evacuation of a low-pressure chiller, the water in the chiller tubes must be:", options: ["Left in place — it helps cooling", "Circulated or removed to prevent freezing as the system pressure drops below atmospheric", "Heated to boiling", "Drained completely before starting"], correctAnswer: 1, explanation: "As the chiller is evacuated, pressure drops and water temperature can fall below 32°F. Circulating or removing the water prevents tube-rupturing ice formation." },
  { id: "epa-t3-83", question: "When recharging a low-pressure chiller, refrigerant vapor should be introduced:", options: ["After all the liquid", "Before liquid, to prevent freezing of water in the evaporator tubes", "Only as liquid", "It does not matter"], correctAnswer: 1, explanation: "Introducing vapor first warms the evaporator tubes slightly, preventing the sudden temperature drop that could freeze water in the tubes when liquid is added." },
  { id: "epa-t3-84", question: "Refrigerant should be charged into a centrifugal chiller through:", options: ["The condenser charging valve", "The evaporator charging valve", "The purge unit", "The oil separator"], correctAnswer: 1, explanation: "Centrifugal chillers are charged through the evaporator charging valve to ensure proper distribution and prevent liquid slugging of the compressor." },
  { id: "epa-t3-85", question: "After reaching the required vacuum on a low-pressure chiller, the technician should wait and monitor because:", options: ["The vacuum pump needs to cool", "A pressure rise indicates residual liquid refrigerant boiling off or a leak — more evacuation is needed", "The refrigerant needs to settle", "Waiting is not required"], correctAnswer: 1, explanation: "After isolation, monitor for pressure rise. Rising pressure means liquid is still present or there is a leak — continue evacuation until pressure stabilizes." },
  { id: "epa-t3-86", question: "For low-pressure systems under 200 lbs, the recovery requirement before a major repair using post-1993 equipment is:", options: ["25 mm Hg absolute", "0 psig", "10 in. Hg vacuum", "500 microns"], correctAnswer: 1, explanation: "Low-pressure systems under 200 lbs must be recovered to 0 psig before major repairs using post-November 15, 1993 equipment." },
  { id: "epa-t3-87", question: "For low-pressure systems with 200 lbs or more, the recovery requirement before a major repair using post-1993 equipment is:", options: ["0 psig", "25 mm Hg absolute", "10 in. Hg vacuum", "500 microns"], correctAnswer: 1, explanation: "Low-pressure systems with 200 lbs or more must be recovered to 25 mm Hg absolute before major repairs using post-November 15, 1993 equipment." },
  { id: "epa-t3-88", question: "A 'major repair' on a low-pressure system is defined as:", options: ["Any repair costing over $1,000", "Any repair that involves opening the refrigerant circuit", "Replacing the purge unit only", "Any repair requiring more than 4 hours"], correctAnswer: 1, explanation: "A major repair is any repair that involves opening the refrigerant circuit — breaking a refrigerant-containing joint or replacing a component." },
  { id: "epa-t3-89", question: "For a non-major repair on a low-pressure system, the allowable pressurization methods are:", options: ["Nitrogen at any pressure", "Controlled hot water or a Prevac-type device only", "Refrigerant at operating pressure", "Compressed air"], correctAnswer: 1, explanation: "For non-major repairs, low-pressure systems may be pressurized using controlled hot water or a built-in pressurization device (Prevac). Nitrogen must not exceed 10 psig." },
  { id: "epa-t3-90", question: "The annual leak rate threshold requiring repair for comfort cooling low-pressure systems (over 50 lbs) is:", options: ["5%", "10%", "20%", "35%"], correctAnswer: 1, explanation: "Comfort cooling systems (including low-pressure chillers used for comfort cooling) must be repaired if the annual leak rate exceeds 10%." },
  { id: "epa-t3-91", question: "The annual leak rate threshold requiring repair for industrial process low-pressure refrigeration is:", options: ["10%", "20%", "30%", "35%"], correctAnswer: 2, explanation: "Industrial process refrigeration systems must be repaired if the annual leak rate exceeds 30%." },
  { id: "epa-t3-92", question: "ASHRAE Standard 15 requires a refrigerant sensor specifically for R-123 because:", options: ["R-123 is flammable", "R-123 has a B1 (higher toxicity) safety classification requiring detection before dangerous concentrations are reached", "R-123 has high ODP", "R-123 is heavier than air"], correctAnswer: 1, explanation: "R-123 is classified B1 (higher toxicity). ASHRAE 15 requires a refrigerant sensor/alarm in R-123 machinery rooms to detect leaks before concentrations reach dangerous levels." },
  { id: "epa-t3-93", question: "The high-pressure cut-out on recovery equipment used with low-pressure appliances must be set to prevent:", options: ["The recovery vessel from overfilling", "The recovery equipment from over-pressurizing the low-pressure vessel during recovery", "The compressor from overheating", "The refrigerant from freezing"], correctAnswer: 1, explanation: "Recovery equipment used on low-pressure systems must have a high-pressure cut-out to prevent the recovery machine from pressurizing the low-pressure vessel above safe limits." },
  { id: "epa-t3-94", question: "R-245fa is a low-pressure refrigerant used as a replacement for:", options: ["R-22", "R-11 and R-123 in some centrifugal chiller applications", "R-410A", "R-134a"], correctAnswer: 1, explanation: "R-245fa (an HFC) is used in some centrifugal chillers as a low-pressure refrigerant, replacing R-11 and R-123." },
  { id: "epa-t3-95", question: "R-113 is classified as what type of refrigerant?", options: ["HFC", "HCFC", "CFC", "HFO"], correctAnswer: 2, explanation: "R-113 is a CFC (trichlorotrifluoroethane) with high ODP. It was used in some centrifugal chillers and has been phased out." },
  { id: "epa-t3-96", question: "A low-pressure chiller that shows a steady rise in condenser pressure over several weeks, with no change in load, most likely has:", options: ["A refrigerant overcharge", "Non-condensable gas accumulation from a developing air leak", "A failing compressor", "A dirty evaporator"], correctAnswer: 1, explanation: "Steadily rising condenser pressure with constant load indicates non-condensable gas (air) accumulating from a developing leak." },
  { id: "epa-t3-97", question: "The EPA 608 Type III exam consists of:", options: ["25 questions (Type III topics only)", "50 questions (25 Core + 25 Type III)", "75 questions", "100 questions"], correctAnswer: 1, explanation: "The Type III exam has 50 questions: 25 from the Core group and 25 from the Type III technical group." },
  { id: "epa-t3-98", question: "A low-pressure chiller's evaporator pressure gauge reads 26 in. Hg vacuum. This means the absolute pressure is approximately:", options: ["26 psia", "3.9 psia", "14.7 psia", "0 psia"], correctAnswer: 1, explanation: "26 in. Hg vacuum = approximately 3.9 psia (14.7 − (26 × 0.491) ≈ 14.7 − 12.8 = 1.9 psia). Low-pressure chillers operate well below atmospheric." },
  { id: "epa-t3-99", question: "When a low-pressure chiller is shut down for an extended period, the main concern is:", options: ["Refrigerant overcharge", "Air and moisture leaking into the system through seals and gaskets", "Oil degradation only", "Electrical corrosion"], correctAnswer: 1, explanation: "During extended shutdown, the system may warm above the refrigerant's boiling point, creating a slight positive pressure — but cooling can pull it back into vacuum, drawing in air through any imperfect seals." },
  { id: "epa-t3-100", question: "The Universal EPA 608 exam consists of:", options: ["50 questions", "75 questions", "100 questions (25 Core + 25 Type I + 25 Type II + 25 Type III)", "150 questions"], correctAnswer: 2, explanation: "The Universal exam has 100 questions: 25 Core + 25 Type I + 25 Type II + 25 Type III. Passing score is 70% on each section." },
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
  { id: 'q-m01-11', question: 'JRI funding in Indiana is administered by:', options: ['IRS', 'Indiana DWD', 'FEMA', 'HUD'], correctAnswer: 1, explanation: 'The Job Ready Indy is an Indiana Department of Workforce Development program for justice-involved individuals.' },
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

/**
 * Section Practice Exams — 50 questions each, matching the real EPA 608 format.
 * Real exam: 25 Core questions + 25 Type-specific questions = 50 total.
 * Uses questions 76–100 from Core (targeted real-exam topics) +
 * questions 76–100 from each Type section (targeted real-exam topics).
 * These are distinct from the 75-question practice banks.
 */
export const EPA_608_EXAM_TYPE_I: QuizQuestion[] = [
  // 25 Core questions (76–100) — targeted regulatory/safety topics
  ...EPA_608_CORE.slice(75, 100),
  // 25 Type I questions (76–100) — targeted small appliance topics
  ...EPA_608_TYPE_I.slice(75, 100),
];

export const EPA_608_EXAM_TYPE_II: QuizQuestion[] = [
  // 25 Core questions (76–100)
  ...EPA_608_CORE.slice(75, 100),
  // 25 Type II questions (76–100) — targeted high-pressure topics
  ...EPA_608_TYPE_II.slice(75, 100),
];

export const EPA_608_EXAM_TYPE_III: QuizQuestion[] = [
  // 25 Core questions (76–100)
  ...EPA_608_CORE.slice(75, 100),
  // 25 Type III questions (76–100) — targeted low-pressure/chiller topics
  ...EPA_608_TYPE_III.slice(75, 100),
];

/**
 * Timed Mock Exam — 100 questions, 120 minutes, 70% passing score per section.
 * Mirrors the real EPA 608 Universal exam: 25 Core + 25 Type I + 25 Type II + 25 Type III.
 * Uses questions 51–75 from each bank — different from both the practice banks (1–75)
 * and the section exams (76–100).
 */
export const HVAC_MOCK_EXAM: QuizQuestion[] = [
  // ── Core (questions 51–75) ──────────────────────────────────────────
  ...EPA_608_CORE.slice(50, 75),
  // ── Type I (questions 51–75) ────────────────────────────────────────
  ...EPA_608_TYPE_I.slice(50, 75),
  // ── Type II (questions 51–75) ───────────────────────────────────────
  ...EPA_608_TYPE_II.slice(50, 75),
  // ── Type III (questions 51–75) ──────────────────────────────────────
  ...EPA_608_TYPE_III.slice(50, 75),
];

export const MOCK_EXAM_TIME_LIMIT = 120; // minutes — matches real EPA 608 Universal exam
export const MOCK_EXAM_PASSING_SCORE = 70; // percent per section

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
// Expected: 100+100+100+100 + 5+5+5+5+5+5+5+5+8 = 453 questions


