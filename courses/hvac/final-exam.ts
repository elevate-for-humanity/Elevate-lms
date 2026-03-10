/**
 * EPA 608 Final Practice Exam
 * 50 questions covering all 10 modules.
 * Students must score 70% (35/50) to pass — matching the real EPA 608 passing threshold.
 */

export const finalExam = [
  // ── Core (Module 5) ──────────────────────────────────────────────
  { question: 'What federal law requires EPA 608 certification?', options: ['Clean Water Act', 'Clean Air Act Section 608', 'OSHA Act', 'National Fire Code'], answer: 'Clean Air Act Section 608' },
  { question: 'What is the maximum fine per day per violation for knowingly venting refrigerant?', options: ['$10,000', '$27,500', '$44,539', '$100,000'], answer: '$44,539' },
  { question: 'Which refrigerant type has the highest ozone depletion potential (ODP)?', options: ['HFC', 'HCFC', 'CFC', 'HFO'], answer: 'CFC' },
  { question: 'What is the difference between recovery and reclamation?', options: ['Recovery removes refrigerant from a system; reclamation reprocesses it to ARI 700 purity standards', 'They are the same thing', 'Recovery is for CFCs only', 'Reclamation is done on-site'], answer: 'Recovery removes refrigerant from a system; reclamation reprocesses it to ARI 700 purity standards' },
  { question: 'Refrigerant cylinders should never be exposed to temperatures above what?', options: ['100 degrees F', '125 degrees F', '150 degrees F', '200 degrees F'], answer: '125 degrees F' },
  { question: 'What color is a recovery cylinder?', options: ['Green', 'Yellow with gray top', 'Blue', 'Red'], answer: 'Yellow with gray top' },
  { question: 'R-22 is classified as what type of refrigerant?', options: ['CFC', 'HCFC', 'HFC', 'HFO'], answer: 'HCFC' },
  { question: 'R-410A is classified as what type of refrigerant?', options: ['CFC', 'HCFC', 'HFC', 'HFO'], answer: 'HFC' },
  { question: 'What does ODP stand for?', options: ['Oxygen Depletion Potential', 'Ozone Depletion Potential', 'Operating Discharge Pressure', 'Outdoor Design Point'], answer: 'Ozone Depletion Potential' },
  { question: 'Who can purchase refrigerant?', options: ['Anyone', 'Only EPA 608 certified technicians', 'Only contractors', 'Only wholesalers'], answer: 'Only EPA 608 certified technicians' },

  // ── Type I (Module 6) ────────────────────────────────────────────
  { question: 'Type I certification covers equipment containing less than how many pounds of refrigerant?', options: ['2 lbs', '5 lbs', '10 lbs', '50 lbs'], answer: '5 lbs' },
  { question: 'What is the required recovery efficiency for small appliances manufactured before November 15, 1993?', options: ['80%', '85%', '90%', '95%'], answer: '80%' },
  { question: 'What is the required recovery efficiency for small appliances manufactured after November 15, 1993?', options: ['80%', '85%', '90%', '95%'], answer: '90%' },
  { question: 'A self-contained recovery device for small appliances must be certified by whom?', options: ['OSHA', 'UL or ETL', 'EPA or an EPA-approved testing organization', 'The manufacturer'], answer: 'EPA or an EPA-approved testing organization' },
  { question: 'What is an example of a small appliance?', options: ['Residential central AC', 'Window air conditioner under 5 lbs charge', 'Commercial chiller', 'Rooftop unit'], answer: 'Window air conditioner under 5 lbs charge' },

  // ── Type II (Module 6) ───────────────────────────────────────────
  { question: 'Type II certification covers what type of equipment?', options: ['Small appliances', 'High-pressure equipment', 'Low-pressure equipment', 'Motor vehicle AC'], answer: 'High-pressure equipment' },
  { question: 'What vacuum level must be achieved when evacuating a system with over 200 lbs of R-410A?', options: ['0 psig', '500 microns', '1000 microns', '1500 microns'], answer: '500 microns' },
  { question: 'A comfort cooling system with more than 50 lbs of refrigerant must be repaired if the annual leak rate exceeds what?', options: ['5%', '10%', '15%', '20%'], answer: '10%' },
  { question: 'What are three acceptable methods of leak detection?', options: ['Electronic detector, UV dye, soap bubbles', 'Visual only', 'Pressure gauge only', 'Temperature measurement only'], answer: 'Electronic detector, UV dye, soap bubbles' },
  { question: 'After a major repair, a system must be tested for leaks using what?', options: ['Refrigerant', 'Dry nitrogen', 'Compressed air', 'Oxygen'], answer: 'Dry nitrogen' },

  // ── Type III (Module 7) ──────────────────────────────────────────
  { question: 'Type III covers what type of equipment?', options: ['Small appliances', 'High-pressure systems', 'Low-pressure systems like centrifugal chillers', 'Automotive AC'], answer: 'Low-pressure systems like centrifugal chillers' },
  { question: 'What is the recovery requirement for low-pressure equipment with less than 200 lbs?', options: ['0 psig', '25 mm Hg absolute', '500 microns', '29 inches Hg'], answer: '0 psig' },
  { question: 'What is the recovery requirement for low-pressure equipment with 200 lbs or more?', options: ['0 psig', '25 mm Hg absolute', '500 microns', '29 inches Hg'], answer: '25 mm Hg absolute' },
  { question: 'What is the purpose of a purge unit on a low-pressure chiller?', options: ['Add refrigerant', 'Remove air and non-condensables', 'Measure superheat', 'Control compressor speed'], answer: 'Remove air and non-condensables' },
  { question: 'Low-pressure refrigerant R-123 boils at approximately what temperature at atmospheric pressure?', options: ['Below 0 degrees F', '27 degrees F', '82 degrees F', '212 degrees F'], answer: '82 degrees F' },

  // ── Fundamentals (Module 1) ──────────────────────────────────────
  { question: 'What are the six major components inside a residential condenser unit?', options: ['Compressor, condenser coil, fan motor, capacitor, contactor, service valves', 'Evaporator, blower, filter, thermostat, ductwork, register', 'Compressor, evaporator, expansion valve, accumulator, filter drier, sight glass', 'Furnace, heat exchanger, gas valve, ignitor, flame sensor, blower'], answer: 'Compressor, condenser coil, fan motor, capacitor, contactor, service valves' },
  { question: 'What is the most common failure point in residential HVAC?', options: ['Compressor', 'Capacitor', 'Thermostat', 'Ductwork'], answer: 'Capacitor' },
  { question: 'What does LOTO stand for?', options: ['Lock Out Tag Out', 'Low Output Temperature Override', 'Line Operated Thermal Overload', 'Liquid Outlet Test Opening'], answer: 'Lock Out Tag Out' },

  // ── Electrical (Module 2) ────────────────────────────────────────
  { question: 'According to Ohm\'s Law, voltage equals what?', options: ['Current times resistance', 'Current divided by resistance', 'Resistance divided by current', 'Power times current'], answer: 'Current times resistance' },
  { question: 'What setting on a multimeter measures capacitance?', options: ['Volts AC', 'Ohms', 'Microfarads', 'Amps DC'], answer: 'Microfarads' },

  // ── Heating (Module 3) ───────────────────────────────────────────
  { question: 'What safety device shuts down a furnace if the heat exchanger overheats?', options: ['Thermostat', 'High-limit switch', 'Pressure switch', 'Gas valve'], answer: 'High-limit switch' },
  { question: 'What component proves the presence of flame in a gas furnace?', options: ['Thermocouple or flame sensor', 'Pressure switch', 'Limit switch', 'Gas valve'], answer: 'Thermocouple or flame sensor' },
  { question: 'A cracked heat exchanger is dangerous because it can leak what into the airstream?', options: ['Refrigerant', 'Carbon monoxide', 'Water', 'Nitrogen'], answer: 'Carbon monoxide' },

  // ── Cooling & Refrigeration (Module 4) ───────────────────────────
  { question: 'What are the four stages of the refrigeration cycle?', options: ['Compression, condensation, expansion, evaporation', 'Heating, cooling, filtering, humidifying', 'Intake, compression, power, exhaust', 'Absorption, desorption, condensation, evaporation'], answer: 'Compression, condensation, expansion, evaporation' },
  { question: 'What does subcooling measure?', options: ['Temperature below the condensing point at discharge pressure', 'Temperature above the boiling point at suction pressure', 'The total system charge', 'Indoor humidity level'], answer: 'Temperature below the condensing point at discharge pressure' },
  { question: 'What tool is used to look up the boiling point of a refrigerant at a given pressure?', options: ['Multimeter', 'PT chart', 'Psychrometric chart', 'Duct calculator'], answer: 'PT chart' },

  // ── Advanced (Module 8) ──────────────────────────────────────────
  { question: 'What pressure must a brazed joint hold during a nitrogen pressure test?', options: ['50 psi', '100 psi', '150 psi', '300 psi'], answer: '150 psi' },
  { question: 'What is Manual J used for?', options: ['Refrigerant charging', 'Calculating heating and cooling loads', 'Ductwork fabrication', 'Electrical wiring'], answer: 'Calculating heating and cooling loads' },
  { question: 'When charging by subcooling method, the system is properly charged when subcooling is within what tolerance of manufacturer specs?', options: ['Plus or minus 1 degree F', 'Plus or minus 2 degrees F', 'Plus or minus 5 degrees F', 'Plus or minus 10 degrees F'], answer: 'Plus or minus 2 degrees F' },

  // ── Troubleshooting (Module 9) ───────────────────────────────────
  { question: 'What is the first step in systematic troubleshooting?', options: ['Replace the capacitor', 'Verify the customer complaint', 'Check refrigerant charge', 'Call the manufacturer'], answer: 'Verify the customer complaint' },
  { question: 'A frozen evaporator coil is most commonly caused by what?', options: ['Overcharge', 'Low charge or restricted airflow', 'High outdoor temperature', 'Bad contactor'], answer: 'Low charge or restricted airflow' },
  { question: 'High head pressure with normal suction pressure usually indicates what?', options: ['Low refrigerant charge', 'Dirty condenser coil or failed condenser fan', 'Bad compressor', 'Restricted metering device'], answer: 'Dirty condenser coil or failed condenser fan' },

  // ── Safety & Career (Modules 9-10) ───────────────────────────────
  { question: 'What additional safety certifications are required for this program?', options: ['None', 'OSHA 10 and CPR/First Aid/AED', 'OSHA 30 only', 'Forklift certification'], answer: 'OSHA 10 and CPR/First Aid/AED' },
  { question: 'How many sections must you pass to earn EPA 608 Universal?', options: ['2', '3', '4 (Core plus Type I, II, and III)', '5'], answer: '4 (Core plus Type I, II, and III)' },
  { question: 'What passing score is required on each section of the EPA 608 exam?', options: ['60%', '70%', '80%', '90%'], answer: '70%' },

  // ── Mixed review ─────────────────────────────────────────────────
  { question: 'What is the suction line on a split system?', options: ['The smaller copper line', 'The larger copper line that feels cool and sweats', 'The drain line', 'The gas supply line'], answer: 'The larger copper line that feels cool and sweats' },
  { question: 'What component in the indoor unit absorbs heat from the air?', options: ['Condenser coil', 'Evaporator coil', 'Compressor', 'Blower motor'], answer: 'Evaporator coil' },
  { question: 'Before working on any electrical component, what must a technician do first?', options: ['Put on gloves', 'Disconnect and lock out power', 'Call the customer', 'Check the thermostat'], answer: 'Disconnect and lock out power' },
]

export const PASSING_SCORE = 35 // 70% of 50 questions
export const TOTAL_QUESTIONS = 50
