import type { QuizQuestion } from "./hvac-quizzes";

/** Quiz questions for all HVAC lessons. Maps lesson UUID to 5 EPA 608-style questions. */
export const HVAC_QUICK_CHECKS: Record<string, QuizQuestion[]> = {
  "2f172cb2-4657-5460-9b93-f9b062ad8dd2": [
    {
      "id": "l1-q1",
      "question": "What is the primary focus of the EPA 608 certification?",
      "options": [
        "Electrical safety",
        "Refrigerant handling",
        "Plumbing codes",
        "Building design"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 certification focuses on the safe handling and disposal of refrigerants to prevent environmental harm. This is a key component of the exam and your future responsibilities."
    },
    {
      "id": "l1-q2",
      "question": "Which section of the EPA 608 exam covers small appliances?",
      "options": [
        "Core",
        "Type I",
        "Type II",
        "Type III"
      ],
      "correctAnswer": 1,
      "explanation": "Type I of the EPA 608 exam specifically deals with small appliances. It's important to know which section aligns with the equipment you're working on."
    },
    {
      "id": "l1-q3",
      "question": "Why is knowledge of the Clean Air Act important for HVAC technicians?",
      "options": [
        "For electrical safety compliance",
        "To prevent legal issues",
        "To ensure HVAC equipment efficiency",
        "For plumbing compliance"
      ],
      "correctAnswer": 1,
      "explanation": "Understanding the Clean Air Act is crucial because it outlines the legal requirements for refrigerant handling, helping you avoid fines and legal problems."
    },
    {
      "id": "l1-q4",
      "question": "What environmental issue is most associated with refrigerants?",
      "options": [
        "Global warming",
        "Ozone depletion",
        "Water pollution",
        "Deforestation"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerants are closely linked to ozone depletion, which is why the EPA 608 certification emphasizes proper handling and disposal to mitigate environmental impact."
    },
    {
      "id": "l1-q5",
      "question": "Which type of refrigerant is most commonly restricted due to environmental concerns?",
      "options": [
        "HFC",
        "CFC",
        "R-22",
        "Ammonia"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs are heavily restricted due to their high ozone-depleting potential. Understanding refrigerant types is crucial for compliance and environmental protection."
    }
  ],
  "96576bf0-cbd5-581f-99aa-f36e48e694fd": [
    {
      "id": "l2-q1",
      "question": "What does WIOA stand for?",
      "options": [
        "Workforce Innovation and Opportunity Act",
        "Workplace Investment and Opportunity Act",
        "Workforce Integration and Opportunity Act",
        "Workplace Innovation and Organization Act"
      ],
      "correctAnswer": 0,
      "explanation": "WIOA stands for Workforce Innovation and Opportunity Act, a federal initiative to help individuals gain access to training for high-demand jobs, like HVAC."
    },
    {
      "id": "l2-q2",
      "question": "Why is consistent attendance important for WIOA funding?",
      "options": [
        "It ensures you become a better technician",
        "It fulfills a requirement to maintain funding",
        "It helps you meet more people",
        "It shows dedication to your employer"
      ],
      "correctAnswer": 1,
      "explanation": "Consistent attendance is crucial to meet the requirements of WIOA funding. Failure to comply can result in losing financial support."
    },
    {
      "id": "l2-q3",
      "question": "What type of services are included in support services?",
      "options": [
        "Only career counseling",
        "Tutoring, career counseling, and job placement",
        "Financial aid only",
        "Housing assistance"
      ],
      "correctAnswer": 1,
      "explanation": "Support services can include tutoring, career counseling, and job placement assistance, all of which are beneficial for your educational journey."
    },
    {
      "id": "l2-q4",
      "question": "Which of the following is NOT a topic covered by the EPA 608 exam?",
      "options": [
        "Refrigerant types",
        "Recovery techniques",
        "Plumbing installation",
        "Safety procedures"
      ],
      "correctAnswer": 2,
      "explanation": "The EPA 608 exam covers refrigerant types, recovery techniques, and safety procedures, but not plumbing installation."
    },
    {
      "id": "l2-q5",
      "question": "What is a key benefit of using support services?",
      "options": [
        "They provide free tools",
        "They offer extra help to understand complex exam topics",
        "They guarantee a job",
        "They extend your course duration"
      ],
      "correctAnswer": 1,
      "explanation": "Support services offer extra help, such as tutoring, which is crucial for understanding complex topics covered in the EPA 608 exam."
    }
  ],
  "5c5b516c-2e7c-5cae-8231-1f4483c1a912": [
    {
      "id": "l3-q1",
      "question": "Which certification is required for HVAC technicians working with refrigerants?",
      "options": [
        "EPA 609",
        "EPA 608",
        "NATE",
        "OSHA"
      ],
      "correctAnswer": 1,
      "explanation": "EPA 608 certification is mandatory for technicians who handle refrigerants, ensuring they understand the regulations and safety practices."
    },
    {
      "id": "l3-q2",
      "question": "What is a potential career path after becoming an experienced HVAC technician?",
      "options": [
        "HVAC Estimator",
        "Electrical Engineer",
        "Carpenter",
        "Plumber"
      ],
      "correctAnswer": 0,
      "explanation": "With experience and further training, an HVAC technician can advance to roles such as HVAC Estimator, which involves planning and costing HVAC projects."
    },
    {
      "id": "l3-q3",
      "question": "Which of the following is NOT a section of the EPA 608 exam?",
      "options": [
        "Core",
        "Type I",
        "Type IV",
        "Type III"
      ],
      "correctAnswer": 2,
      "explanation": "The EPA 608 exam consists of Core, Type I, Type II, and Type III sections. There is no Type IV section."
    },
    {
      "id": "l3-q4",
      "question": "Why is understanding environmental regulations important in HVAC?",
      "options": [
        "To design better systems",
        "To handle refrigerants safely",
        "To increase profits",
        "To avoid mechanical failures"
      ],
      "correctAnswer": 1,
      "explanation": "Understanding environmental regulations ensures safe refrigerant handling and compliance with laws, reducing environmental impact."
    },
    {
      "id": "l3-q5",
      "question": "What role might involve designing HVAC systems for energy efficiency?",
      "options": [
        "HVAC Technician",
        "System Designer",
        "Journeyman Plumber",
        "Welder"
      ],
      "correctAnswer": 1,
      "explanation": "A System Designer focuses on creating HVAC systems that are efficient and environmentally friendly, often requiring advanced knowledge of energy management."
    }
  ],
  "4097148b-7a06-5784-9807-5e3470d4c091": [
    {
      "id": "l4-q1",
      "question": "Which type of refrigerant is known for having the highest ozone depletion potential?",
      "options": [
        "HFCs",
        "CFCs",
        "HFOs",
        "HCs"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs, or chlorofluorocarbons, have the highest ozone depletion potential. This is a critical concept covered under the EPA 608 regulations, highlighting the importance of proper refrigerant management."
    },
    {
      "id": "l4-q2",
      "question": "What is the main purpose of the EPA Section 608 certification?",
      "options": [
        "To increase job opportunities",
        "To ensure safe handling of refrigerants",
        "To reduce energy consumption",
        "To improve HVAC system design"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA Section 608 certification is primarily designed to ensure that technicians handle refrigerants safely and responsibly, minimizing environmental impact."
    },
    {
      "id": "l4-q3",
      "question": "What personal protective equipment is recommended when handling refrigerants?",
      "options": [
        "Sunglasses",
        "Rubber gloves",
        "Steel-toed boots",
        "Hard hat"
      ],
      "correctAnswer": 1,
      "explanation": "Rubber gloves are essential when handling refrigerants to prevent skin contact and frostbite, a key safety measure discussed in our lessons."
    },
    {
      "id": "l4-q4",
      "question": "Which regulation requires technicians to minimize refrigerant releases?",
      "options": [
        "Clean Water Act",
        "Clean Air Act",
        "Safe Drinking Water Act",
        "Resource Conservation and Recovery Act"
      ],
      "correctAnswer": 1,
      "explanation": "The Clean Air Act, particularly Section 608, requires technicians to minimize refrigerant releases to protect the atmosphere, a crucial point for the EPA 608 exam."
    },
    {
      "id": "l4-q5",
      "question": "What should you do if you suspect a refrigerant leak?",
      "options": [
        "Ignore it",
        "Use a leak detector",
        "Evacuate the area",
        "Call the fire department"
      ],
      "correctAnswer": 1,
      "explanation": "Using a leak detector is the appropriate action to confirm and locate refrigerant leaks, as discussed in our safety protocols."
    }
  ],
  "ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56": [
    {
      "id": "l5-q1",
      "question": "Which component in the refrigeration cycle is responsible for compressing the refrigerant?",
      "options": [
        "Condenser",
        "Compressor",
        "Expansion Valve",
        "Evaporator Coil"
      ],
      "correctAnswer": 1,
      "explanation": "The compressor compresses the refrigerant, increasing its pressure and temperature, which is crucial for the refrigeration cycle to function."
    },
    {
      "id": "l5-q2",
      "question": "What is the primary function of the condenser coil in an HVAC system?",
      "options": [
        "Absorb heat",
        "Release heat",
        "Reduce refrigerant pressure",
        "Vaporize refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "The condenser coil releases heat from the refrigerant to the outside air, allowing it to condense into a liquid."
    },
    {
      "id": "l5-q3",
      "question": "What happens to the refrigerant in the evaporator coil?",
      "options": [
        "It is compressed",
        "It absorbs heat",
        "It releases heat",
        "It condenses"
      ],
      "correctAnswer": 1,
      "explanation": "In the evaporator coil, the refrigerant absorbs heat from the indoor air, causing it to evaporate."
    },
    {
      "id": "l5-q4",
      "question": "Why is superheat important in an HVAC system?",
      "options": [
        "To increase refrigerant pressure",
        "To ensure refrigerant is vaporized",
        "To condense refrigerant",
        "To cool refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Superheat ensures that the refrigerant is fully vaporized before it reaches the compressor, preventing potential damage to the system."
    },
    {
      "id": "l5-q5",
      "question": "What role does the expansion valve play in the refrigeration cycle?",
      "options": [
        "Increases refrigerant pressure",
        "Decreases refrigerant pressure",
        "Condenses refrigerant",
        "Absorbs heat"
      ],
      "correctAnswer": 1,
      "explanation": "The expansion valve decreases the pressure of the refrigerant, allowing it to cool before entering the evaporator coil."
    }
  ],
  "fea2c0e6-ac93-518e-ae22-9528daa1ec3f": [
    {
      "id": "l6-q1",
      "question": "Which tool is used to measure the pressure of refrigerants in a system?",
      "options": [
        "Recovery machine",
        "Manifold gauge set",
        "Leak detector",
        "Vacuum pump"
      ],
      "correctAnswer": 1,
      "explanation": "The manifold gauge set is specifically designed to measure refrigerant pressures, allowing technicians to assess system performance."
    },
    {
      "id": "l6-q2",
      "question": "What is the purpose of a recovery machine in HVAC?",
      "options": [
        "To measure refrigerant pressure",
        "To recover refrigerants from a system",
        "To detect refrigerant leaks",
        "To remove air and moisture"
      ],
      "correctAnswer": 1,
      "explanation": "A recovery machine is used to safely extract refrigerants from systems, complying with EPA regulations to prevent venting."
    },
    {
      "id": "l6-q3",
      "question": "What is the primary function of vacuum pumps?",
      "options": [
        "To measure refrigerant pressure",
        "To recover refrigerants",
        "To remove air and moisture",
        "To detect leaks"
      ],
      "correctAnswer": 2,
      "explanation": "Vacuum pumps are essential for evacuating air and moisture from HVAC systems to ensure proper refrigerant charge."
    },
    {
      "id": "l6-q4",
      "question": "According to EPA 608, what must be done if a refrigerant leak is detected?",
      "options": [
        "Ignore it",
        "Repair it promptly",
        "Vent refrigerant into the atmosphere",
        "Use a recovery machine"
      ],
      "correctAnswer": 1,
      "explanation": "EPA 608 regulations require that refrigerant leaks be repaired promptly to protect the environment and ensure system efficiency."
    },
    {
      "id": "l6-q5",
      "question": "What tool is used to find refrigerant leaks within a system?",
      "options": [
        "Recovery machine",
        "Vacuum pump",
        "Leak detector",
        "Manifold gauge set"
      ],
      "correctAnswer": 2,
      "explanation": "Leak detectors are specifically designed to locate refrigerant leaks, ensuring systems are environmentally compliant and efficient."
    }
  ],
  "f2878977-fe02-568e-afdf-7d6fcf67b375": [
    {
      "id": "l7-q1",
      "question": "What is the primary purpose of wearing safety goggles in an HVAC environment?",
      "options": [
        "To look professional",
        "To prevent eye damage from refrigerants",
        "To block out UV rays",
        "To enhance night vision"
      ],
      "correctAnswer": 1,
      "explanation": "Safety goggles are essential in protecting your eyes from splashes of refrigerants, which can cause severe damage. This aligns with EPA guidelines on safe refrigerant handling."
    },
    {
      "id": "l7-q2",
      "question": "Which type of clothing is recommended when working near open flames?",
      "options": [
        "Cotton T-shirt",
        "Flame-resistant clothing",
        "Polyester jacket",
        "Raincoat"
      ],
      "correctAnswer": 1,
      "explanation": "Flame-resistant clothing reduces the risk of burns from open flames, an important safety measure in the HVAC field."
    },
    {
      "id": "l7-q3",
      "question": "Why is respiratory protection necessary when handling refrigerants?",
      "options": [
        "To filter dust",
        "To protect against harmful chemical inhalation",
        "To keep warm",
        "To prevent allergies"
      ],
      "correctAnswer": 1,
      "explanation": "Respiratory protection prevents inhalation of harmful chemicals, crucial during refrigerant recovery and disposal, and aligns with EPA safety standards."
    },
    {
      "id": "l7-q4",
      "question": "What is the consequence of prolonged exposure to high noise levels without hearing protection?",
      "options": [
        "Improved hearing",
        "Hearing loss",
        "Better concentration",
        "Reduced stress"
      ],
      "correctAnswer": 1,
      "explanation": "Without hearing protection, prolonged exposure to high noise levels can lead to permanent hearing loss, emphasizing the need for ear protection in loud environments."
    },
    {
      "id": "l7-q5",
      "question": "What should always be worn when handling sharp objects?",
      "options": [
        "Baseball cap",
        "Gloves",
        "Sunglasses",
        "Scarf"
      ],
      "correctAnswer": 1,
      "explanation": "Gloves provide essential protection against cuts and abrasions from sharp objects, ensuring personal safety during HVAC work."
    }
  ],
  "317fd364-2d8c-5d5f-9ade-e096ec30ab26": [
    {
      "id": "l8-q1",
      "question": "What is the primary function of the compressor in an HVAC system?",
      "options": [
        "To absorb heat from indoor air",
        "To pressurize refrigerant",
        "To exchange heat with outdoor air",
        "To regulate refrigerant flow"
      ],
      "correctAnswer": 1,
      "explanation": "The compressor pressurizes refrigerant, converting it from a gas to a liquid, which is crucial for the refrigeration cycle."
    },
    {
      "id": "l8-q2",
      "question": "Where is the condenser typically located in an HVAC system?",
      "options": [
        "Inside the furnace",
        "Outside the building",
        "In the ductwork",
        "Next to the evaporator coil"
      ],
      "correctAnswer": 1,
      "explanation": "The condenser is usually located outside the building to release heat into the outdoor environment."
    },
    {
      "id": "l8-q3",
      "question": "How does the expansion valve affect the refrigerant?",
      "options": [
        "It absorbs heat from the air",
        "It pressurizes the refrigerant",
        "It allows refrigerant flow to the evaporator",
        "It releases heat to the condenser"
      ],
      "correctAnswer": 2,
      "explanation": "The expansion valve regulates the flow of refrigerant into the evaporator, reducing its pressure and cooling it."
    },
    {
      "id": "l8-q4",
      "question": "What happens in the evaporator coil?",
      "options": [
        "Refrigerant is pressurized",
        "Heat is absorbed from indoor air",
        "Heat is released to the outdoor air",
        "Refrigerant flow is regulated"
      ],
      "correctAnswer": 1,
      "explanation": "The evaporator coil absorbs heat from indoor air, cooling it before it's circulated back into the space."
    },
    {
      "id": "l8-q5",
      "question": "Which component is often referred to as the 'heart' of the HVAC system?",
      "options": [
        "Condenser",
        "Evaporator Coil",
        "Compressor",
        "Expansion Valve"
      ],
      "correctAnswer": 2,
      "explanation": "The compressor is considered the 'heart' of the HVAC system as it pumps and pressurizes the refrigerant."
    }
  ],
  "b38d2dfa-ad67-5664-98a1-f831d3d7ea07": [
    {
      "id": "l9-q1",
      "question": "Which refrigerant is no longer manufactured due to its ozone depletion potential?",
      "options": [
        "R-410A",
        "R-22",
        "R-134a",
        "R-404A"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is an HCFC and has been phased out due to its ozone depletion potential. This aligns with EPA regulations to protect the ozone layer."
    },
    {
      "id": "l9-q2",
      "question": "What is the purpose of recovery equipment?",
      "options": [
        "To increase refrigerant pressure",
        "To cool the refrigerant",
        "To remove refrigerant from a system",
        "To heat the refrigerant"
      ],
      "correctAnswer": 2,
      "explanation": "Recovery equipment is used to safely remove refrigerant from a system, in compliance with EPA regulations, to prevent release into the atmosphere."
    },
    {
      "id": "l9-q3",
      "question": "What safety equipment should be worn when handling refrigerants?",
      "options": [
        "Sunglasses",
        "Rubber gloves",
        "Heavy boots",
        "Hard hat"
      ],
      "correctAnswer": 1,
      "explanation": "Rubber gloves protect against refrigerant burns and frostbite, which are risks when handling refrigerants."
    },
    {
      "id": "l9-q4",
      "question": "Which of these systems typically requires a high-pressure recovery machine?",
      "options": [
        "Centrifugal chillers",
        "Window air conditioners",
        "Low-pressure chillers",
        "Domestic refrigerators"
      ],
      "correctAnswer": 1,
      "explanation": "Window air conditioners operate as high-pressure systems and require appropriate recovery equipment to handle the refrigerant safely."
    },
    {
      "id": "l9-q5",
      "question": "What is the maximum allowable time to repair a leak in a commercial refrigeration system under EPA regulations?",
      "options": [
        "30 days",
        "45 days",
        "60 days",
        "90 days"
      ],
      "correctAnswer": 0,
      "explanation": "Under EPA regulations, leaks in commercial refrigeration systems must be repaired within 30 days to minimize environmental harm."
    }
  ],
  "dba03432-fb85-5f6f-bc69-4cc785a7904a": [
    {
      "id": "l10-q1",
      "question": "What is the unit of measurement for electrical current?",
      "options": [
        "Volts",
        "Amperes",
        "Ohms",
        "Watts"
      ],
      "correctAnswer": 1,
      "explanation": "Current is measured in amperes, which indicates the flow of electric charge in a circuit, as discussed in the lesson."
    },
    {
      "id": "l10-q2",
      "question": "According to Ohm's Law, how do you calculate current?",
      "options": [
        "I = R/V",
        "I = V/R",
        "I = V*R",
        "I = V+R"
      ],
      "correctAnswer": 1,
      "explanation": "Ohm's Law states that current (I) equals voltage (V) divided by resistance (R). This formula is essential for calculating electrical values."
    },
    {
      "id": "l10-q3",
      "question": "Which term describes the opposition to the flow of current?",
      "options": [
        "Voltage",
        "Current",
        "Resistance",
        "Power"
      ],
      "correctAnswer": 2,
      "explanation": "Resistance is the opposition to the flow of current, affecting how much current flows at a given voltage."
    },
    {
      "id": "l10-q4",
      "question": "What is the unit of measurement for resistance?",
      "options": [
        "Volts",
        "Amperes",
        "Ohms",
        "Watts"
      ],
      "correctAnswer": 2,
      "explanation": "Resistance is measured in ohms, which indicates how much it opposes current flow in a circuit."
    },
    {
      "id": "l10-q5",
      "question": "If you increase the voltage in a circuit but keep the resistance the same, what happens to the current?",
      "options": [
        "It decreases",
        "It increases",
        "It stays the same",
        "It doubles"
      ],
      "correctAnswer": 1,
      "explanation": "According to Ohm's Law, increasing voltage while keeping resistance constant increases the current."
    }
  ],
  "ba8f7e3f-af6b-50bc-9564-f2bb0b303349": [
    {
      "id": "l11-q1",
      "question": "What is the main purpose of a wiring diagram?",
      "options": [
        "To show refrigerant flow",
        "To show electrical connections",
        "To show air flow",
        "To show component specifications"
      ],
      "correctAnswer": 1,
      "explanation": "Wiring diagrams are used to show electrical connections and the layout of an HVAC system. This helps in troubleshooting and understanding how the system components interact."
    },
    {
      "id": "l11-q2",
      "question": "Which symbol is commonly used to represent a resistor in a schematic?",
      "options": [
        "A circle",
        "A zigzag line",
        "A triangle",
        "A square"
      ],
      "correctAnswer": 1,
      "explanation": "In schematics, a zigzag line is typically used to represent a resistor, which is crucial for controlling current flow in circuits."
    },
    {
      "id": "l11-q3",
      "question": "How are switches commonly depicted in wiring diagrams?",
      "options": [
        "As a solid line",
        "As a broken line",
        "As a line with a break",
        "As a circle"
      ],
      "correctAnswer": 2,
      "explanation": "Switches are often shown as a line with a break, indicating the ability to open or close the circuit path."
    },
    {
      "id": "l11-q4",
      "question": "Which component might be shown as a rectangle with a diagonal line inside?",
      "options": [
        "Capacitor",
        "Compressor",
        "Relay",
        "Transformer"
      ],
      "correctAnswer": 2,
      "explanation": "A relay is typically shown as a rectangle with a diagonal line, representing its function to open or close circuits in response to an electrical signal."
    },
    {
      "id": "l11-q5",
      "question": "What should you always do before working on an HVAC system's electrical components?",
      "options": [
        "Check refrigerant levels",
        "Power down the system",
        "Adjust the thermostat",
        "Clean the filters"
      ],
      "correctAnswer": 1,
      "explanation": "For safety, always ensure the system is powered down before working on electrical components to prevent shock or injury."
    }
  ],
  "598c6f54-1ea9-5e73-ac5b-f8e29a556110": [
    {
      "id": "l12-q1",
      "question": "What setting should be used on a multimeter to measure resistance?",
      "options": [
        "Voltage",
        "Ohms",
        "Amperage",
        "Capacitance"
      ],
      "correctAnswer": 1,
      "explanation": "Resistance is measured in ohms, so the multimeter needs to be set to the ohms setting to accurately measure resistance."
    },
    {
      "id": "l12-q2",
      "question": "How should an amp clamp be used to measure current?",
      "options": [
        "Around entire cable",
        "Around single conductor",
        "Around two wires",
        "Direct contact with wire"
      ],
      "correctAnswer": 1,
      "explanation": "The amp clamp must be placed around a single conductor to measure the current flowing through it, as placing it around multiple wires can give an inaccurate reading."
    },
    {
      "id": "l12-q3",
      "question": "What does a continuity test verify?",
      "options": [
        "Voltage level",
        "Complete circuit",
        "Current flow",
        "Capacitance value"
      ],
      "correctAnswer": 1,
      "explanation": "A continuity test checks whether a circuit is complete or unbroken, essential for diagnosing open circuits or broken connections."
    },
    {
      "id": "l12-q4",
      "question": "What safety equipment is essential when using a multimeter?",
      "options": [
        "Sunglasses",
        "Insulated gloves",
        "Steel-toed boots",
        "Hard hat"
      ],
      "correctAnswer": 1,
      "explanation": "Insulated gloves are crucial when working with electrical equipment to protect against electric shock, ensuring safe handling of the multimeter."
    },
    {
      "id": "l12-q5",
      "question": "Why is it important to zero a meter before use?",
      "options": [
        "To save battery",
        "For accurate readings",
        "To calibrate the probe",
        "To test continuity"
      ],
      "correctAnswer": 1,
      "explanation": "Zeroing a meter ensures that the readings are accurate and eliminates any offsets that might affect the measurement results."
    }
  ],
  "1020f5bf-0d4f-5f87-b43b-da658cb24fab": [
    {
      "id": "l13-q1",
      "question": "What is the primary function of a run capacitor in an HVAC system?",
      "options": [
        "Store energy for emergency use",
        "Provide continuous torque to a motor",
        "Control the operation of the thermostat",
        "Switch electrical circuits on and off"
      ],
      "correctAnswer": 1,
      "explanation": "A run capacitor provides continuous torque to a motor while it's running, which is essential for efficient operation. This was discussed in the lesson where we covered how capacitors support motor functions."
    },
    {
      "id": "l13-q2",
      "question": "Which component is used to switch high power circuits in HVAC systems?",
      "options": [
        "Capacitor",
        "Relay",
        "Contactor",
        "Thermostat"
      ],
      "correctAnswer": 2,
      "explanation": "Contactors are used to switch high power circuits, which allows them to control the flow of electricity necessary for operating components like compressors."
    },
    {
      "id": "l13-q3",
      "question": "How should a capacitor be handled before performing maintenance?",
      "options": [
        "Leave it connected to the circuit",
        "Discharge it safely",
        "Submerge it in water",
        "Check its resistance"
      ],
      "correctAnswer": 1,
      "explanation": "Capacitors can store a charge even when power is off, so they must be discharged safely to prevent electrical shock. This is crucial for safety and was emphasized during the lesson."
    },
    {
      "id": "l13-q4",
      "question": "What is a common use for relays in HVAC systems?",
      "options": [
        "Starting compressors",
        "Controlling blower motors",
        "Regulating refrigerant flow",
        "Heating water"
      ],
      "correctAnswer": 1,
      "explanation": "Relays are used to control blower motors and other lower power circuits, making them a versatile component in HVAC systems."
    },
    {
      "id": "l13-q5",
      "question": "What happens when a contactor is energized?",
      "options": [
        "It opens the circuit",
        "It closes the circuit",
        "It overheats",
        "It discharges electricity"
      ],
      "correctAnswer": 1,
      "explanation": "When a contactor is energized, it closes the circuit, allowing current to pass through and operate the connected equipment, as explained in the lesson."
    }
  ],
  "b23ca62f-295e-5c2c-aa00-783f16e91ed9": [
    {
      "id": "l14-q1",
      "question": "Which formula represents Ohm's Law?",
      "options": [
        "P = IV",
        "V = IR",
        "V = I/R",
        "P = I^2R"
      ],
      "correctAnswer": 1,
      "explanation": "Ohm's Law is represented by the formula V = IR, which shows the relationship between voltage, current, and resistance."
    },
    {
      "id": "l14-q2",
      "question": "In a series circuit, how is the current distributed?",
      "options": [
        "It is divided among the components",
        "It is constant throughout",
        "It depends on the voltage",
        "It varies with resistance"
      ],
      "correctAnswer": 1,
      "explanation": "In a series circuit, the current is constant through all components, as they are connected end-to-end."
    },
    {
      "id": "l14-q3",
      "question": "What is the main advantage of a parallel circuit?",
      "options": [
        "Increased voltage",
        "Independent operation of components",
        "Reduced current",
        "Simplified wiring"
      ],
      "correctAnswer": 1,
      "explanation": "Parallel circuits allow components to operate independently of each other, as each branch can draw current separately."
    },
    {
      "id": "l14-q4",
      "question": "What should you always do before working on an electrical component?",
      "options": [
        "Check the voltage",
        "Use a multimeter",
        "Turn off the power",
        "Wear rubber shoes"
      ],
      "correctAnswer": 2,
      "explanation": "Always turn off the power before working on electrical components to ensure safety and prevent electrical shock."
    },
    {
      "id": "l14-q5",
      "question": "What does a wiring diagram help you do?",
      "options": [
        "Calculate resistance",
        "Identify circuit types",
        "Troubleshoot electrical problems",
        "Increase circuit efficiency"
      ],
      "correctAnswer": 2,
      "explanation": "Wiring diagrams serve as roadmaps for identifying and troubleshooting electrical problems in HVAC systems."
    }
  ],
  "baed04b3-35ae-51c7-a325-c678fbd0e725": [
    {
      "id": "l15-q1",
      "question": "What is the primary function of the heat exchanger in a gas furnace?",
      "options": [
        "To ignite the gas",
        "To transfer heat and prevent combustion gases from entering the living space",
        "To circulate air",
        "To expel combustion gases"
      ],
      "correctAnswer": 1,
      "explanation": "The heat exchanger transfers heat from the combustion process while preventing harmful gases from entering the home, ensuring safe operation."
    },
    {
      "id": "l15-q2",
      "question": "Which component is responsible for expelling combustion gases in a gas furnace?",
      "options": [
        "Blower",
        "Thermostat",
        "Draft Inducer Motor",
        "Gas Valve"
      ],
      "correctAnswer": 2,
      "explanation": "The draft inducer motor ensures that combustion gases are safely vented outside, crucial for maintaining indoor air quality."
    },
    {
      "id": "l15-q3",
      "question": "What triggers the gas valve to open in a gas furnace?",
      "options": [
        "Blower motor",
        "Thermostat signal",
        "Limit switch",
        "Heat exchanger temperature"
      ],
      "correctAnswer": 1,
      "explanation": "The thermostat sends a signal to the gas valve to open when heat is needed, initiating the heating cycle."
    },
    {
      "id": "l15-q4",
      "question": "Why is the limit switch important in gas furnace operation?",
      "options": [
        "It ignites the gas",
        "It shuts off the burner to prevent overheating",
        "It circulates air",
        "It opens the gas valve"
      ],
      "correctAnswer": 1,
      "explanation": "The limit switch prevents the furnace from overheating by shutting off the burner, ensuring safe operation."
    },
    {
      "id": "l15-q5",
      "question": "What is the role of the blower in a gas furnace?",
      "options": [
        "To ignite the gas",
        "To expel combustion gases",
        "To circulate warm air through the ductwork",
        "To open the gas valve"
      ],
      "correctAnswer": 2,
      "explanation": "The blower circulates warm air throughout the home, distributing the heat generated by the furnace."
    }
  ],
  "9bfa7972-4169-5360-9b82-84aef75ce4d4": [
    {
      "id": "l16-q1",
      "question": "What is a primary function of heat strips in a heat pump system?",
      "options": [
        "To cool the air",
        "To provide auxiliary heat",
        "To humidify the air",
        "To filter the air"
      ],
      "correctAnswer": 1,
      "explanation": "Heat strips provide auxiliary heat, especially when the outdoor temperature is too low for the heat pump to efficiently extract heat from the outside air."
    },
    {
      "id": "l16-q2",
      "question": "How does resistance heating generate heat?",
      "options": [
        "By compressing air",
        "By using solar energy",
        "By passing electricity through a conductor",
        "By chemical reaction"
      ],
      "correctAnswer": 2,
      "explanation": "Resistance heating generates heat by passing electricity through a conductor that resists the flow of electricity, thus converting electrical energy into heat."
    },
    {
      "id": "l16-q3",
      "question": "Which safety precaution is important when inspecting heat strips?",
      "options": [
        "Check for dust and debris",
        "Use a gas detector",
        "Ensure there is no water leakage",
        "Check for refrigerant levels"
      ],
      "correctAnswer": 0,
      "explanation": "Checking for dust and debris is important to prevent fire hazards, as accumulated debris can ignite when the strips heat up."
    },
    {
      "id": "l16-q4",
      "question": "Why is it important to calculate the electrical load of heat strips?",
      "options": [
        "To prevent system overheating",
        "To ensure energy efficiency",
        "To avoid circuit overload",
        "To maintain refrigerant charge"
      ],
      "correctAnswer": 2,
      "explanation": "Accurate calculation of the electrical load is essential to avoid circuit overload, which can lead to electrical hazards and system malfunctions."
    },
    {
      "id": "l16-q5",
      "question": "In what scenario are heat strips most commonly used?",
      "options": [
        "During heavy rain",
        "In high humidity",
        "In low outdoor temperatures",
        "When the system is cooling"
      ],
      "correctAnswer": 2,
      "explanation": "Heat strips are typically used in low outdoor temperatures when the heat pump alone cannot efficiently extract enough heat from the outside air."
    }
  ],
  "b84ebdfa-ff58-53c2-96eb-5975e584cbc1": [
    {
      "id": "l17-q1",
      "question": "What does the reversing valve do in a heat pump during heating mode?",
      "options": [
        "Reduces refrigerant pressure",
        "Changes refrigerant flow direction",
        "Increases refrigerant temperature",
        "Activates the defrost cycle"
      ],
      "correctAnswer": 1,
      "explanation": "The reversing valve changes the direction of refrigerant flow, allowing the system to switch between heating and cooling modes."
    },
    {
      "id": "l17-q2",
      "question": "Which component is responsible for raising the refrigerant's pressure and temperature?",
      "options": [
        "Evaporator coil",
        "Condenser coil",
        "Compressor",
        "Metering device"
      ],
      "correctAnswer": 2,
      "explanation": "The compressor increases the pressure and temperature of the refrigerant, which is essential for the heat transfer process."
    },
    {
      "id": "l17-q3",
      "question": "Why is the defrost cycle necessary in heating mode?",
      "options": [
        "To increase indoor temperature",
        "To remove frost from the indoor coil",
        "To melt accumulated frost on the outdoor coil",
        "To reduce refrigerant pressure"
      ],
      "correctAnswer": 2,
      "explanation": "The defrost cycle is necessary to melt frost that accumulates on the outdoor coil, ensuring efficient heat pump operation."
    },
    {
      "id": "l17-q4",
      "question": "What role does the metering device play in heating mode?",
      "options": [
        "Compresses the refrigerant",
        "Controls refrigerant flow",
        "Reverses refrigerant flow",
        "Activates the defrost cycle"
      ],
      "correctAnswer": 1,
      "explanation": "The metering device controls the flow of refrigerant, ensuring optimal heat exchange between the coils."
    },
    {
      "id": "l17-q5",
      "question": "In heating mode, what function does the outdoor coil perform?",
      "options": [
        "Acts as the condenser",
        "Acts as the evaporator",
        "Increases refrigerant pressure",
        "Activates the defrost cycle"
      ],
      "correctAnswer": 1,
      "explanation": "In heating mode, the outdoor coil acts as the evaporator, absorbing heat from the outside air."
    }
  ],
  "26bfd436-bfa9-587a-a98a-93a89ae0af22": [
    {
      "id": "l18-q1",
      "question": "What is the primary goal of combustion analysis?",
      "options": [
        "Decrease fuel consumption",
        "Ensure complete combustion",
        "Increase combustion speed",
        "Reduce system noise"
      ],
      "correctAnswer": 1,
      "explanation": "The primary goal of combustion analysis is to ensure complete combustion, which improves efficiency and safety by reducing harmful byproducts."
    },
    {
      "id": "l18-q2",
      "question": "Which of the following gases is measured during combustion analysis?",
      "options": [
        "Nitrogen",
        "Methane",
        "Oxygen",
        "Helium"
      ],
      "correctAnswer": 2,
      "explanation": "Oxygen levels are measured during combustion analysis to ensure there is enough oxygen for complete combustion, which is crucial for preventing the formation of carbon monoxide."
    },
    {
      "id": "l18-q3",
      "question": "What dangerous gas can be produced by incomplete combustion?",
      "options": [
        "Carbon Dioxide",
        "Carbon Monoxide",
        "Ozone",
        "Sulfur Dioxide"
      ],
      "correctAnswer": 1,
      "explanation": "Carbon monoxide is a dangerous gas that can be produced by incomplete combustion, highlighting the importance of proper combustion analysis."
    },
    {
      "id": "l18-q4",
      "question": "Why is it important to maintain combustion efficiency in HVAC systems?",
      "options": [
        "To increase noise levels",
        "To extend filter life",
        "To ensure safety and reduce fuel waste",
        "To minimize airflow"
      ],
      "correctAnswer": 2,
      "explanation": "Maintaining combustion efficiency is important to ensure the safety of the system by preventing harmful emissions and to reduce fuel waste, leading to cost savings."
    },
    {
      "id": "l18-q5",
      "question": "Which tool is essential for performing a combustion analysis?",
      "options": [
        "Multimeter",
        "Thermometer",
        "Combustion Analyzer",
        "Vacuum Gauge"
      ],
      "correctAnswer": 2,
      "explanation": "A combustion analyzer is essential for performing a combustion analysis as it measures the levels of various gases to assess combustion efficiency."
    }
  ],
  "9a82e78f-eb1c-5592-a013-c7fe58033531": [
    {
      "id": "l19-q1",
      "question": "Before inspecting a furnace, what is the first safety step?",
      "options": [
        "Check the thermostat",
        "Shut off power to the furnace",
        "Inspect the heat exchanger",
        "Clean the burners"
      ],
      "correctAnswer": 1,
      "explanation": "Shutting off power ensures there is no electrical current, preventing potential electric shock during inspection."
    },
    {
      "id": "l19-q2",
      "question": "What is a sign of a cracked heat exchanger?",
      "options": [
        "Dust buildup",
        "Rust or corrosion",
        "Soot near the burners",
        "Loud noises"
      ],
      "correctAnswer": 2,
      "explanation": "Soot near the burners can indicate improper combustion due to a cracked heat exchanger, posing a carbon monoxide risk."
    },
    {
      "id": "l19-q3",
      "question": "What should be checked on the furnace's burner?",
      "options": [
        "Presence of refrigerant",
        "Cleanliness",
        "Fuel type",
        "Control board settings"
      ],
      "correctAnswer": 1,
      "explanation": "Burners should be clean and free of debris to ensure efficient and safe operation."
    },
    {
      "id": "l19-q4",
      "question": "Why is it important to inspect the blower assembly?",
      "options": [
        "To check for refrigerant leaks",
        "To ensure it spins freely",
        "To adjust the thermostat",
        "To change the filter"
      ],
      "correctAnswer": 1,
      "explanation": "Ensuring the blower spins freely prevents reduced efficiency and potential increased energy costs."
    },
    {
      "id": "l19-q5",
      "question": "What should you use to confirm the power is off before inspecting?",
      "options": [
        "Thermometer",
        "Multimeter",
        "Screwdriver",
        "Flashlight"
      ],
      "correctAnswer": 1,
      "explanation": "A multimeter is used to check for electrical current, ensuring the power is off and the inspection is safe."
    }
  ],
  "ca5df4d7-f2c4-5f91-aa9a-a4d9b2730c03": [
    {
      "id": "l20-q1",
      "question": "Which type of heating system uses the process of radiation to transfer heat?",
      "options": [
        "Forced air",
        "Radiant",
        "Hydronic",
        "Electric"
      ],
      "correctAnswer": 1,
      "explanation": "Radiant heating systems transfer heat through radiation, which is effective for heating surfaces and objects directly, unlike forced air which uses convection."
    },
    {
      "id": "l20-q2",
      "question": "What is a primary concern when handling refrigerants according to EPA 608 regulations?",
      "options": [
        "Cost",
        "Ozone depletion",
        "System efficiency",
        "Energy consumption"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 regulations emphasize preventing ozone depletion, which is why proper handling and disposal of refrigerants is critical."
    },
    {
      "id": "l20-q3",
      "question": "What is the purpose of measuring superheat in HVAC systems?",
      "options": [
        "To ensure refrigerant efficiency",
        "To prevent compressor damage",
        "To check for leaks",
        "To measure airflow"
      ],
      "correctAnswer": 1,
      "explanation": "Measuring superheat ensures that the refrigerant is fully vaporized before reaching the compressor, preventing potential damage and ensuring efficiency."
    },
    {
      "id": "l20-q4",
      "question": "Which method is commonly used for detecting leaks in HVAC systems?",
      "options": [
        "Visual inspection",
        "Electronic leak detector",
        "Ultrasonic detection",
        "Pressure testing"
      ],
      "correctAnswer": 1,
      "explanation": "Electronic leak detectors are frequently used because they can effectively identify small leaks by detecting refrigerant presence."
    },
    {
      "id": "l20-q5",
      "question": "What is the main benefit of maintaining the proper refrigerant charge in a system?",
      "options": [
        "Reduced noise",
        "Improved system efficiency",
        "Lower installation cost",
        "Increased airflow"
      ],
      "correctAnswer": 1,
      "explanation": "Maintaining the proper refrigerant charge ensures the system operates efficiently and effectively, which is critical for optimal performance."
    }
  ],
  "3b753cee-2a4f-5702-9661-23d48f475b7b": [
    {
      "id": "l21-q1",
      "question": "What is the primary role of the compressor in the refrigeration cycle?",
      "options": [
        "To cool refrigerant",
        "To compress refrigerant",
        "To expand refrigerant",
        "To absorb heat"
      ],
      "correctAnswer": 1,
      "explanation": "The compressor's primary role is to compress the refrigerant from a low-pressure gas to a high-pressure gas, allowing it to circulate through the system."
    },
    {
      "id": "l21-q2",
      "question": "Where does the refrigerant release heat in the refrigeration cycle?",
      "options": [
        "Compressor",
        "Evaporator",
        "Condenser",
        "Expansion device"
      ],
      "correctAnswer": 2,
      "explanation": "The condenser is where the refrigerant releases heat and changes from a gas to a liquid."
    },
    {
      "id": "l21-q3",
      "question": "Which component is responsible for lowering the pressure of the refrigerant?",
      "options": [
        "Compressor",
        "Condenser",
        "Expansion device",
        "Evaporator"
      ],
      "correctAnswer": 2,
      "explanation": "The expansion device lowers the pressure and temperature of the refrigerant before it enters the evaporator."
    },
    {
      "id": "l21-q4",
      "question": "In the evaporator, what happens to the refrigerant?",
      "options": [
        "It absorbs heat",
        "It releases heat",
        "It compresses",
        "It condenses"
      ],
      "correctAnswer": 0,
      "explanation": "In the evaporator, the refrigerant absorbs heat from the air, causing it to boil and evaporate."
    },
    {
      "id": "l21-q5",
      "question": "What is the state of the refrigerant entering the compressor?",
      "options": [
        "High-pressure liquid",
        "Low-pressure gas",
        "High-pressure gas",
        "Low-pressure liquid"
      ],
      "correctAnswer": 1,
      "explanation": "The refrigerant enters the compressor as a low-pressure gas, which is then compressed to continue the cycle."
    }
  ],
  "cad2cb2e-8551-56ed-95ed-bfc0d6cb9c27": [
    {
      "id": "l22-q1",
      "question": "When the pressure in a refrigeration system increases, what happens to the temperature?",
      "options": [
        "It decreases",
        "It increases",
        "It stays the same",
        "It fluctuates"
      ],
      "correctAnswer": 1,
      "explanation": "According to the pressure-temperature relationship, as pressure increases, temperature also increases. This is crucial for understanding system operations, especially in the condenser."
    },
    {
      "id": "l22-q2",
      "question": "What happens to refrigerant in the evaporator?",
      "options": [
        "It releases heat",
        "It absorbs heat",
        "It stays unchanged",
        "It solidifies"
      ],
      "correctAnswer": 1,
      "explanation": "In the evaporator, refrigerant absorbs heat from the surrounding air, causing it to evaporate and cool the environment."
    },
    {
      "id": "l22-q3",
      "question": "How does lowering the pressure affect the refrigerant's boiling point?",
      "options": [
        "Increases it",
        "Decreases it",
        "Leaves it unchanged",
        "Causes it to freeze"
      ],
      "correctAnswer": 1,
      "explanation": "Lowering pressure decreases the refrigerant’s boiling point, allowing it to evaporate at a lower temperature, which is essential for cooling."
    },
    {
      "id": "l22-q4",
      "question": "In which part of the system is the refrigerant under high pressure?",
      "options": [
        "Evaporator",
        "Condenser",
        "Expansion valve",
        "Filter drier"
      ],
      "correctAnswer": 1,
      "explanation": "The refrigerant is under high pressure in the condenser, allowing it to release heat and condense into a liquid."
    },
    {
      "id": "l22-q5",
      "question": "What is the purpose of adjusting system pressures in HVAC systems?",
      "options": [
        "To change refrigerant color",
        "To alter refrigerant state temperatures",
        "To increase noise",
        "To reduce system lifespan"
      ],
      "correctAnswer": 1,
      "explanation": "Adjusting system pressures changes the temperatures at which refrigerants boil or condense, crucial for system efficiency and performance."
    }
  ],
  "866b89da-dbff-58c5-9fd3-2d3c8ccffa4a": [
    {
      "id": "l23-q1",
      "question": "Which type of compressor uses pistons driven by a crankshaft?",
      "options": [
        "Rotary",
        "Reciprocating",
        "Scroll",
        "Screw"
      ],
      "correctAnswer": 1,
      "explanation": "Reciprocating compressors use pistons driven by a crankshaft to compress refrigerant gas, making them a common choice for smaller systems."
    },
    {
      "id": "l23-q2",
      "question": "Which compressor type is known for its quiet and efficient operation using interleaved scrolls?",
      "options": [
        "Screw",
        "Rotary",
        "Scroll",
        "Reciprocating"
      ],
      "correctAnswer": 2,
      "explanation": "Scroll compressors use two interleaved scrolls for compression, providing quiet and efficient operation, ideal for high-efficiency systems."
    },
    {
      "id": "l23-q3",
      "question": "What is a key feature of screw compressors?",
      "options": [
        "Compact size",
        "Steady flow of compressed gas",
        "High maintenance",
        "Limited to small systems"
      ],
      "correctAnswer": 1,
      "explanation": "Screw compressors are known for providing a steady flow of compressed gas, making them suitable for large commercial and industrial applications."
    },
    {
      "id": "l23-q4",
      "question": "Which compressor type is most commonly used in residential air conditioning systems?",
      "options": [
        "Scroll",
        "Screw",
        "Rotary",
        "Reciprocating"
      ],
      "correctAnswer": 2,
      "explanation": "Rotary compressors are commonly used in residential air conditioning systems due to their compact size and smooth operation."
    },
    {
      "id": "l23-q5",
      "question": "What is a disadvantage of reciprocating compressors compared to other types?",
      "options": [
        "Higher cost",
        "Less durability",
        "More moving parts",
        "Low efficiency"
      ],
      "correctAnswer": 2,
      "explanation": "Reciprocating compressors have more moving parts, which can lead to higher maintenance needs compared to other types of compressors."
    }
  ],
  "41d3a7f1-2d0d-5034-96d6-fa0f44b58182": [
    {
      "id": "l24-q1",
      "question": "What is the primary function of a metering device in an HVAC system?",
      "options": [
        "Increase refrigerant pressure",
        "Control refrigerant flow into the evaporator",
        "Measure refrigerant temperature",
        "Compress the refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Metering devices control the flow of refrigerant into the evaporator, ensuring the correct pressure and temperature for optimal heat absorption."
    },
    {
      "id": "l24-q2",
      "question": "How does a Thermostatic Expansion Valve (TXV) adjust the refrigerant flow?",
      "options": [
        "By changing the orifice size",
        "By sensing evaporator superheat",
        "By controlling compressor speed",
        "By altering refrigerant type"
      ],
      "correctAnswer": 1,
      "explanation": "A TXV adjusts refrigerant flow by sensing the superheat at the evaporator outlet and reacting to temperature and pressure changes."
    },
    {
      "id": "l24-q3",
      "question": "What is a characteristic of a Fixed Orifice metering device?",
      "options": [
        "Adjusts flow based on load",
        "Has no moving parts",
        "Measures ambient temperature",
        "Controls compressor operation"
      ],
      "correctAnswer": 1,
      "explanation": "A Fixed Orifice, or capillary tube, is a simple device with no moving parts, allowing a fixed refrigerant flow based on system pressure."
    },
    {
      "id": "l24-q4",
      "question": "Why might a malfunctioning metering device cause reduced cooling capacity?",
      "options": [
        "Excessive refrigerant flow",
        "Improper refrigerant flow",
        "Excessive heat absorption",
        "Improper heat rejection"
      ],
      "correctAnswer": 1,
      "explanation": "A malfunctioning metering device can cause improper refrigerant flow, leading to inefficient heat absorption and reduced cooling capacity."
    },
    {
      "id": "l24-q5",
      "question": "What could happen if a TXV fails to adjust properly?",
      "options": [
        "Increased refrigerant charge",
        "Compressor overheating",
        "Stable system pressure",
        "Improved efficiency"
      ],
      "correctAnswer": 1,
      "explanation": "If a TXV fails to adjust properly, it can lead to improper refrigerant flow, potentially causing compressor overheating due to inadequate cooling."
    }
  ],
  "daf39e52-5588-5643-9638-3e990ddd4fda": [
    {
      "id": "l25-q1",
      "question": "What is superheat?",
      "options": [
        "The temperature of a liquid below its boiling point",
        "The temperature of a vapor above its boiling point",
        "The pressure of a vapor above its boiling point",
        "The pressure of a liquid below its boiling point"
      ],
      "correctAnswer": 1,
      "explanation": "Superheat is the temperature of a vapor above its boiling point at a given pressure, crucial for ensuring proper operation of HVAC systems."
    },
    {
      "id": "l25-q2",
      "question": "How do you determine the actual superheat?",
      "options": [
        "Subtract the saturation temperature from the liquid line temperature",
        "Subtract the saturation temperature from the suction line temperature",
        "Subtract the suction line temperature from the saturation temperature",
        "Subtract the liquid line temperature from the saturation temperature"
      ],
      "correctAnswer": 1,
      "explanation": "To determine actual superheat, subtract the saturation temperature from the actual temperature of the suction line."
    },
    {
      "id": "l25-q3",
      "question": "Why is it important to ensure accurate subcooling?",
      "options": [
        "It prevents the refrigerant from boiling in the evaporator",
        "It ensures the refrigerant is fully condensed in the condenser",
        "It prevents the refrigerant from freezing in the evaporator",
        "It ensures the refrigerant is fully vaporized in the evaporator"
      ],
      "correctAnswer": 1,
      "explanation": "Accurate subcooling ensures the refrigerant is fully condensed, promoting efficiency and preventing damage."
    },
    {
      "id": "l25-q4",
      "question": "What equipment is necessary to measure superheat?",
      "options": [
        "High-pressure gauge and thermometer",
        "Suction side gauge and thermometer",
        "Thermometer and hygrometer",
        "Low-pressure gauge and hygrometer"
      ],
      "correctAnswer": 1,
      "explanation": "Measuring superheat requires a suction side gauge to determine pressure and a thermometer to measure temperature."
    },
    {
      "id": "l25-q5",
      "question": "What safety equipment is essential when handling refrigerants?",
      "options": [
        "Safety goggles and gloves",
        "Steel-toed boots and a hard hat",
        "Ear protection and safety goggles",
        "Face shield and apron"
      ],
      "correctAnswer": 0,
      "explanation": "Safety goggles and gloves are essential to protect against refrigerant exposure and ensure safe handling procedures."
    }
  ],
  "8e4dbcd2-39b0-5bbc-a8eb-a7f880335a2c": [
    {
      "id": "l26-q1",
      "question": "Which component in the refrigeration cycle is responsible for compressing refrigerant vapor?",
      "options": [
        "Condenser",
        "Compressor",
        "Evaporator",
        "Expansion valve"
      ],
      "correctAnswer": 1,
      "explanation": "The compressor compresses refrigerant vapor, increasing its pressure and temperature, a critical step in the refrigeration cycle."
    },
    {
      "id": "l26-q2",
      "question": "What is the environmental concern associated with CFC refrigerants?",
      "options": [
        "Global warming",
        "Ozone layer depletion",
        "Acid rain",
        "Air pollution"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs are known to deplete the ozone layer, which is why their use is heavily regulated under the EPA 608 guidelines."
    },
    {
      "id": "l26-q3",
      "question": "During refrigerant recovery, what should be done if the system contains a mix of refrigerants?",
      "options": [
        "Recover into a separate, labeled tank",
        "Vent to the atmosphere",
        "Mix with new refrigerant",
        "Recover into the same tank as other refrigerants"
      ],
      "correctAnswer": 0,
      "explanation": "Mixed refrigerants should be recovered into a separate, labeled tank to prevent contamination and comply with EPA regulations."
    },
    {
      "id": "l26-q4",
      "question": "Which of the following is a common safety practice when handling refrigerants?",
      "options": [
        "Wear gloves and goggles",
        "Use water to cool hot components",
        "Work without ventilation",
        "Release refrigerants slowly into the air"
      ],
      "correctAnswer": 0,
      "explanation": "Wearing gloves and goggles is a basic safety practice to protect against refrigerant exposure and potential injuries."
    },
    {
      "id": "l26-q5",
      "question": "What is the purpose of an expansion valve in a cooling system?",
      "options": [
        "Increase pressure",
        "Decrease pressure",
        "Condense refrigerant",
        "Compress refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "The expansion valve decreases the pressure of the refrigerant, allowing it to expand and cool before entering the evaporator."
    }
  ],
  "785652db-1125-5e78-a1c9-de65f2aa331a": [
    {
      "id": "l27-q1",
      "question": "Which refrigerant has the highest ozone depletion potential (ODP)?",
      "options": [
        "HFCs",
        "CFCs",
        "HFOs",
        "HCFCs"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs have the highest ozone depletion potential due to their chlorine content, which is harmful to the ozone layer, as explained in the lesson."
    },
    {
      "id": "l27-q2",
      "question": "What is the primary purpose of the Montreal Protocol?",
      "options": [
        "To reduce greenhouse gas emissions",
        "To phase out ozone-depleting substances",
        "To regulate energy efficiency standards",
        "To promote renewable energy use"
      ],
      "correctAnswer": 1,
      "explanation": "The Montreal Protocol aims to phase out the production and consumption of ozone-depleting substances, protecting the ozone layer."
    },
    {
      "id": "l27-q3",
      "question": "Which type of refrigerant is known for having the lowest impact on ozone depletion?",
      "options": [
        "CFCs",
        "HFCs",
        "HCFCs",
        "R-22"
      ],
      "correctAnswer": 1,
      "explanation": "HFCs do not contain chlorine and therefore have no ozone depletion potential, making them a better choice for the environment."
    },
    {
      "id": "l27-q4",
      "question": "How does ozone depletion affect the environment?",
      "options": [
        "Increases oxygen levels",
        "Reduces UV radiation",
        "Increases UV radiation exposure",
        "Decreases greenhouse gases"
      ],
      "correctAnswer": 2,
      "explanation": "Ozone depletion leads to increased UV radiation exposure, which can cause health and environmental issues."
    },
    {
      "id": "l27-q5",
      "question": "What is an example of a refrigerant with a low global warming potential (GWP)?",
      "options": [
        "R-134a",
        "R-410A",
        "HFO-1234yf",
        "R-22"
      ],
      "correctAnswer": 2,
      "explanation": "HFO-1234yf is designed to have a low global warming potential, making it a more environmentally friendly option."
    }
  ],
  "e732905c-bd0a-5232-b019-9cd5c77273b7": [
    {
      "id": "l28-q1",
      "question": "Which of the following substances has a high Ozone Depletion Potential (ODP)?",
      "options": [
        "R-134a",
        "CFC-11",
        "HFC-410A",
        "CO2"
      ],
      "correctAnswer": 1,
      "explanation": "CFC-11 has a high Ozone Depletion Potential, making it a significant contributor to ozone layer depletion. This is why its use is highly controlled under EPA regulations."
    },
    {
      "id": "l28-q2",
      "question": "What process involves cleaning refrigerant for reuse without meeting new product specifications?",
      "options": [
        "Recovery",
        "Recycling",
        "Reclamation",
        "Venting"
      ],
      "correctAnswer": 1,
      "explanation": "Recycling involves cleaning the refrigerant so it can be reused, but it doesn't necessarily meet the purity standards of new refrigerant, unlike reclamation."
    },
    {
      "id": "l28-q3",
      "question": "What is prohibited by the Venting Prohibition under Section 608?",
      "options": [
        "Using CFCs",
        "Recycling refrigerants",
        "Intentional release of refrigerants",
        "Reclamation of refrigerants"
      ],
      "correctAnswer": 2,
      "explanation": "The Venting Prohibition strictly forbids the intentional release of refrigerants into the atmosphere due to their harmful environmental impact."
    },
    {
      "id": "l28-q4",
      "question": "What type of technician certification allows servicing all types of equipment?",
      "options": [
        "Type I",
        "Type II",
        "Type III",
        "Universal"
      ],
      "correctAnswer": 3,
      "explanation": "Universal certification allows a technician to service all types of equipment covered under the EPA 608 regulations, including small appliances, high-pressure systems, and low-pressure systems."
    },
    {
      "id": "l28-q5",
      "question": "Which process involves processing refrigerant to a purity level that meets new product specifications?",
      "options": [
        "Recovery",
        "Recycling",
        "Reclamation",
        "Venting"
      ],
      "correctAnswer": 2,
      "explanation": "Reclamation processes refrigerants to a purity level that meets new product specifications, unlike recycling, which only cleans the refrigerant for reuse."
    }
  ],
  "6bbfccf1-ca8b-5167-b911-33780e89c4cc": [
    {
      "id": "l29-q1",
      "question": "What is the primary purpose of wearing PPE when handling refrigerants?",
      "options": [
        "To look professional",
        "To protect against refrigerant exposure",
        "To prevent slipping",
        "To avoid fines"
      ],
      "correctAnswer": 1,
      "explanation": "PPE is essential for protecting against refrigerant exposure, which can be hazardous to your skin, eyes, and respiratory system."
    },
    {
      "id": "l29-q2",
      "question": "Why is proper ventilation important when working with refrigerants?",
      "options": [
        "To reduce noise",
        "To prevent suffocation",
        "To lower temperature",
        "To save energy"
      ],
      "correctAnswer": 1,
      "explanation": "Proper ventilation prevents suffocation by ensuring that refrigerant gases do not displace breathable air in a confined space."
    },
    {
      "id": "l29-q3",
      "question": "What is a key step in preventing refrigerant leaks?",
      "options": [
        "Using larger pipes",
        "Regular leak detection",
        "Increasing refrigerant charge",
        "Removing insulation"
      ],
      "correctAnswer": 1,
      "explanation": "Regular leak detection is crucial as it helps identify and fix leaks, preventing exposure and environmental harm."
    },
    {
      "id": "l29-q4",
      "question": "How should refrigerant cylinders be stored?",
      "options": [
        "Lying flat",
        "Upright and secured",
        "In direct sunlight",
        "Near heat sources"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant cylinders should be stored upright and secured to prevent tipping and potential leaks."
    },
    {
      "id": "l29-q5",
      "question": "What is the consequence of improperly labeled refrigerant containers?",
      "options": [
        "Higher energy usage",
        "Confusion and potential safety hazards",
        "Improved efficiency",
        "Faster refrigerant recovery"
      ],
      "correctAnswer": 1,
      "explanation": "Improperly labeled containers can lead to confusion and safety hazards as incorrect handling of refrigerants may occur."
    }
  ],
  "3325947e-f78e-5157-94f1-bb4b466cc2e4": [
    {
      "id": "l30-q1",
      "question": "Which refrigerant type has the highest ozone depletion potential?",
      "options": [
        "HFCs",
        "CFCs",
        "HFOs",
        "HCFCs"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs have the highest ozone depletion potential due to their chlorine content, making them the most harmful to the ozone layer."
    },
    {
      "id": "l30-q2",
      "question": "Which refrigerant type is being phased out due to its ozone depletion potential?",
      "options": [
        "HFOs",
        "HFCs",
        "CFCs",
        "HCFCs"
      ],
      "correctAnswer": 3,
      "explanation": "HCFCs are being phased out because, while they have a lower ODP than CFCs, they still contribute to ozone depletion."
    },
    {
      "id": "l30-q3",
      "question": "Which refrigerant type has no ozone depletion potential but a high global warming potential?",
      "options": [
        "HFOs",
        "CFCs",
        "HFCs",
        "HCFCs"
      ],
      "correctAnswer": 2,
      "explanation": "HFCs do not contain chlorine and thus have no ODP, but they do have a high GWP, which is a concern for climate change."
    },
    {
      "id": "l30-q4",
      "question": "What is the key advantage of HFOs over other refrigerant types?",
      "options": [
        "Higher ODP",
        "Lower efficiency",
        "Low GWP and no ODP",
        "Higher flammability"
      ],
      "correctAnswer": 2,
      "explanation": "HFOs are advantageous due to their low global warming potential and zero ozone depletion potential, making them environmentally preferable."
    },
    {
      "id": "l30-q5",
      "question": "Which refrigerant type is typically used in newer systems for its environmental benefits?",
      "options": [
        "HCFCs",
        "CFCs",
        "HFCs",
        "HFOs"
      ],
      "correctAnswer": 3,
      "explanation": "HFOs are used in newer systems because they have both low GWP and no ODP, aligning with environmental regulations."
    }
  ],
  "725fb861-b9ea-5e47-8de5-208923ed315a": [
    {
      "id": "l31-q1",
      "question": "What does the Pressure-Temperature Chart help a technician determine?",
      "options": [
        "Refrigerant type",
        "Saturated pressure at a given temperature",
        "System volume",
        "Compressor capacity"
      ],
      "correctAnswer": 1,
      "explanation": "The Pressure-Temperature Chart is used to determine the saturated pressure of a refrigerant at a specific temperature, which is essential for diagnosing system performance."
    },
    {
      "id": "l31-q2",
      "question": "What happens to the pressure of a refrigerant as its temperature increases, assuming volume remains constant?",
      "options": [
        "It decreases",
        "It remains constant",
        "It increases",
        "It fluctuates"
      ],
      "correctAnswer": 2,
      "explanation": "According to the ideal gas law, when the volume is constant, the pressure of a refrigerant increases as its temperature increases."
    },
    {
      "id": "l31-q3",
      "question": "What is the term used when refrigerant is cooled below its saturation temperature?",
      "options": [
        "Saturation",
        "Subcooling",
        "Superheating",
        "Dehydration"
      ],
      "correctAnswer": 1,
      "explanation": "Subcooling refers to cooling the refrigerant liquid below its saturation temperature, ensuring it is fully condensed before entering the evaporator."
    },
    {
      "id": "l31-q4",
      "question": "Why is superheat important in a refrigeration system?",
      "options": [
        "To ensure liquid refrigerant enters the compressor",
        "To increase system pressure",
        "To ensure only vapor enters the compressor",
        "To reduce system temperature"
      ],
      "correctAnswer": 2,
      "explanation": "Superheat ensures that only vapor enters the compressor, preventing potential damage caused by liquid refrigerant."
    },
    {
      "id": "l31-q5",
      "question": "What does saturation indicate in a refrigerant system?",
      "options": [
        "Maximum refrigerant capacity",
        "Equilibrium between liquid and vapor states",
        "Minimum operating temperature",
        "Compressor efficiency"
      ],
      "correctAnswer": 1,
      "explanation": "Saturation occurs when a refrigerant is in equilibrium between its liquid and vapor states, indicating a critical point in the refrigeration cycle."
    }
  ],
  "ad1bdab2-b5b3-525a-bcff-8baecc08a99f": [
    {
      "id": "l32-q1",
      "question": "What is the primary goal of refrigerant recovery?",
      "options": [
        "To increase the efficiency of the system",
        "To prevent the release of refrigerants into the atmosphere",
        "To convert the refrigerant into a new type",
        "To enhance cooling performance"
      ],
      "correctAnswer": 1,
      "explanation": "The primary goal of refrigerant recovery is to prevent the release of refrigerants into the atmosphere, as mandated by the Clean Air Act. This process is crucial for environmental protection and regulatory compliance."
    },
    {
      "id": "l32-q2",
      "question": "Which process cleans refrigerant for reuse without meeting virgin product purity standards?",
      "options": [
        "Reclamation",
        "Recycling",
        "Recovery",
        "Retrofitting"
      ],
      "correctAnswer": 1,
      "explanation": "Recycling involves cleaning refrigerant for reuse, but it doesn't meet the purity standards of newly manufactured refrigerant. This process can typically be done on-site."
    },
    {
      "id": "l32-q3",
      "question": "According to the EPA, when must refrigerants be recovered or reclaimed?",
      "options": [
        "Before system installation",
        "After system shutdown",
        "Before system maintenance or disposal",
        "During routine inspections"
      ],
      "correctAnswer": 2,
      "explanation": "Refrigerants must be recovered or reclaimed before system maintenance or disposal to comply with EPA regulations, preventing harmful environmental releases."
    },
    {
      "id": "l32-q4",
      "question": "What standard must reclaimed refrigerant meet?",
      "options": [
        "ISO 9001",
        "ASHRAE 34",
        "ARI Standard 700-1993",
        "EPA Section 608"
      ],
      "correctAnswer": 2,
      "explanation": "Reclaimed refrigerant must meet the purity standards outlined in ARI Standard 700-1993, ensuring it matches the quality of virgin refrigerant."
    },
    {
      "id": "l32-q5",
      "question": "Why is using EPA-certified recovery equipment important?",
      "options": [
        "To improve technician efficiency",
        "To comply with EPA regulations",
        "To decrease service time",
        "To avoid equipment damage"
      ],
      "correctAnswer": 1,
      "explanation": "Using EPA-certified recovery equipment is important for compliance with regulations and ensures the safe and effective management of refrigerants during recovery."
    }
  ],
  "f9bba6db-e8f3-5abe-b1bf-7a193851bd7b": [
    {
      "id": "l33-q1",
      "question": "Who is allowed to purchase refrigerants according to the EPA?",
      "options": [
        "Anyone over 18",
        "Certified technicians",
        "HVAC students",
        "Any HVAC company"
      ],
      "correctAnswer": 1,
      "explanation": "Only certified technicians can purchase refrigerants, as mandated by the EPA under the Clean Air Act to prevent unqualified handling."
    },
    {
      "id": "l33-q2",
      "question": "What is the purpose of refrigerant sales restrictions?",
      "options": [
        "To increase prices",
        "To reduce ozone depletion",
        "To limit sales quantity",
        "To promote brand loyalty"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant sales restrictions aim to minimize the release of ozone-depleting chemicals, protecting the environment."
    },
    {
      "id": "l33-q3",
      "question": "What section of the Clean Air Act outlines refrigerant sales restrictions?",
      "options": [
        "Section 101",
        "Section 608",
        "Section 202",
        "Section 404"
      ],
      "correctAnswer": 1,
      "explanation": "Section 608 of the Clean Air Act specifically addresses refrigerant sales restrictions and certification requirements."
    },
    {
      "id": "l33-q4",
      "question": "What size refrigerant containers require a certified technician for purchase?",
      "options": [
        "Any size",
        "Over 20 pounds",
        "Under 10 pounds",
        "Only bulk shipments"
      ],
      "correctAnswer": 1,
      "explanation": "Only certified technicians can purchase refrigerant containers larger than 20 pounds, according to EPA rules."
    },
    {
      "id": "l33-q5",
      "question": "What must distributors do with refrigerant sales records?",
      "options": [
        "Destroy them yearly",
        "Submit to EPA monthly",
        "Keep records for transparency",
        "Only track cash sales"
      ],
      "correctAnswer": 2,
      "explanation": "Distributors are required to keep detailed records of refrigerant sales to ensure compliance with EPA regulations."
    }
  ],
  "23fe3eb2-9acf-5deb-a5e1-ecfb100564f3": [
    {
      "id": "l34-q1",
      "question": "What is the primary goal of the Clean Air Act in relation to refrigerants?",
      "options": [
        "To promote energy efficiency",
        "To protect the ozone layer",
        "To reduce greenhouse gases",
        "To increase refrigerant use"
      ],
      "correctAnswer": 1,
      "explanation": "The Clean Air Act aims to protect the ozone layer by regulating substances like CFCs and HCFCs that can harm it. This understanding is crucial for grasping the purpose behind the EPA 608 regulations."
    },
    {
      "id": "l34-q2",
      "question": "Which refrigerant is known for having no ozone depletion potential?",
      "options": [
        "R-22",
        "R-410A",
        "R-12",
        "R-134a"
      ],
      "correctAnswer": 1,
      "explanation": "R-410A is a hydrofluorocarbon (HFC) refrigerant that does not deplete the ozone layer, making it a preferred alternative to older refrigerants like R-22."
    },
    {
      "id": "l34-q3",
      "question": "What is the correct procedure when recovering refrigerants from a system?",
      "options": [
        "Vent to atmosphere",
        "Use a certified recovery machine",
        "Mix refrigerants",
        "Skip documentation"
      ],
      "correctAnswer": 1,
      "explanation": "Using a certified recovery machine ensures compliance with EPA regulations by safely removing refrigerants without releasing them into the atmosphere."
    },
    {
      "id": "l34-q4",
      "question": "Why is accurate recordkeeping important in refrigerant handling?",
      "options": [
        "To track energy consumption",
        "To comply with legal requirements",
        "To increase refrigerant sales",
        "To reduce repair costs"
      ],
      "correctAnswer": 1,
      "explanation": "Accurate recordkeeping is a legal requirement under the EPA 608 rules, helping track refrigerant usage and ensuring compliance with environmental standards."
    },
    {
      "id": "l34-q5",
      "question": "Which of the following has been phased out due to its ozone depletion potential?",
      "options": [
        "R-410A",
        "R-22",
        "R-134a",
        "R-404A"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is a hydrochlorofluorocarbon (HCFC) that has been phased out due to its high ozone depletion potential, in line with the Montreal Protocol."
    }
  ],
  "6116718a-264f-5d03-8e12-8b141debcd9d": [
    {
      "id": "l35-q1",
      "question": "What is the maximum amount of refrigerant a small appliance can contain according to the EPA?",
      "options": [
        "10 pounds",
        "5 pounds",
        "15 pounds",
        "20 pounds"
      ],
      "correctAnswer": 1,
      "explanation": "Small appliances are defined by the EPA as those containing 5 pounds or less of refrigerant. This definition is crucial for identifying the proper recovery methods and handling procedures."
    },
    {
      "id": "l35-q2",
      "question": "What recovery efficiency is required for a non-operational compressor in small appliances?",
      "options": [
        "70%",
        "80%",
        "90%",
        "95%"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA requires an 80% recovery efficiency for non-operational compressors in small appliances to ensure environmental protection."
    },
    {
      "id": "l35-q3",
      "question": "Which type of compressor is commonly found in small appliances?",
      "options": [
        "Centrifugal",
        "Scroll",
        "Hermetic",
        "Open"
      ],
      "correctAnswer": 2,
      "explanation": "Hermetic compressors are commonly used in small appliances due to their sealed design, which is suitable for systems containing small amounts of refrigerant."
    },
    {
      "id": "l35-q4",
      "question": "What method is effective for detecting refrigerant leaks in small appliances?",
      "options": [
        "Ultrasound",
        "Infrared",
        "Electronic leak detector",
        "Thermography"
      ],
      "correctAnswer": 2,
      "explanation": "Electronic leak detectors are effective for detecting refrigerant leaks, ensuring minimal release of refrigerants into the environment."
    },
    {
      "id": "l35-q5",
      "question": "Before disposing of a small appliance, what must be done with the refrigerant?",
      "options": [
        "Vented into the atmosphere",
        "Recycled",
        "Recovered",
        "Diluted"
      ],
      "correctAnswer": 2,
      "explanation": "Refrigerant must be recovered from small appliances before disposal to prevent environmental harm, in compliance with EPA regulations."
    }
  ],
  "4699611d-28a6-51ea-ad08-71715ef53a7b": [
    {
      "id": "l36-q1",
      "question": "What is the maximum amount of refrigerant a small appliance can contain under Type I regulations?",
      "options": [
        "10 pounds",
        "5 pounds",
        "15 pounds",
        "1 pound"
      ],
      "correctAnswer": 1,
      "explanation": "Small appliances are defined as systems with five pounds or less of refrigerant. This is a key criterion for Type I certification."
    },
    {
      "id": "l36-q2",
      "question": "What must EPA-approved recovery equipment achieve when recovering refrigerant from a non-functional compressor?",
      "options": [
        "99% recovery",
        "95% recovery",
        "80% recovery",
        "50% recovery"
      ],
      "correctAnswer": 2,
      "explanation": "For a non-functional compressor, the recovery equipment must achieve at least 80% recovery efficiency, as per EPA standards."
    },
    {
      "id": "l36-q3",
      "question": "Which recovery method uses the appliance's own compressor and pressure?",
      "options": [
        "Passive Recovery",
        "Self-contained Recovery",
        "Active Recovery",
        "Dynamic Recovery"
      ],
      "correctAnswer": 0,
      "explanation": "Passive recovery utilizes the appliance's own compressor and pressure for refrigerant removal. This method is effective when the compressor is operational."
    },
    {
      "id": "l36-q4",
      "question": "What is the requirement for storing recovered refrigerant?",
      "options": [
        "Store in any container",
        "Use labeled and appropriate containers",
        "Store open to atmosphere",
        "Mix with other chemicals"
      ],
      "correctAnswer": 1,
      "explanation": "Recovered refrigerant must be stored in labeled and appropriate containers to prevent contamination and ensure safety."
    },
    {
      "id": "l36-q5",
      "question": "When did the EPA mandate certification for refrigerant recovery equipment?",
      "options": [
        "November 15, 1993",
        "January 1, 2000",
        "July 1, 1995",
        "April 22, 1990"
      ],
      "correctAnswer": 0,
      "explanation": "The mandate for certification of refrigerant recovery equipment by an EPA-approved lab took effect on November 15, 1993."
    }
  ],
  "597e92fe-4690-530f-839e-73099714e96e": [
    {
      "id": "l37-q1",
      "question": "What is the primary benefit of self-contained recovery equipment?",
      "options": [
        "It is less expensive than other types.",
        "It can recover refrigerant without using the system's compressor.",
        "It is faster than all other methods.",
        "It doesn't require maintenance."
      ],
      "correctAnswer": 1,
      "explanation": "Self-contained recovery equipment has its own built-in compressor, allowing it to recover refrigerant from the system independently, which is especially useful for systems that are not operational."
    },
    {
      "id": "l37-q2",
      "question": "According to EPA 608 regulations, what is the required evacuation level for systems with less than 200 pounds of refrigerant?",
      "options": [
        "5 psi",
        "0 psi",
        "15 psi",
        "10 psi"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA requires that systems with less than 200 pounds of refrigerant be evacuated to 0 psi to ensure minimal refrigerant is left in the system."
    },
    {
      "id": "l37-q3",
      "question": "Which of the following is NOT a maintenance task for recovery equipment?",
      "options": [
        "Checking for leaks",
        "Verifying pressure gauges",
        "Repainting the equipment",
        "Ensuring connections are secure"
      ],
      "correctAnswer": 2,
      "explanation": "While maintaining recovery equipment, tasks like checking for leaks, verifying pressure gauges, and securing connections are important, repainting the equipment is not considered a maintenance task."
    },
    {
      "id": "l37-q4",
      "question": "What safety equipment should be worn when operating recovery equipment?",
      "options": [
        "Sunglasses",
        "Protective gloves and goggles",
        "A high-visibility vest",
        "A hard hat"
      ],
      "correctAnswer": 1,
      "explanation": "Protective gloves and goggles are essential to ensure safety when working with refrigerants, protecting against accidental spills and exposure."
    },
    {
      "id": "l37-q5",
      "question": "Why is it important to understand the recovery rate of your equipment?",
      "options": [
        "To save time during the recovery process",
        "To ensure compliance with EPA evacuation level requirements",
        "To impress clients with your equipment knowledge",
        "To reduce noise pollution"
      ],
      "correctAnswer": 1,
      "explanation": "Understanding your equipment’s recovery rate is crucial to ensure it meets the EPA’s evacuation level requirements, ensuring environmentally safe refrigerant recovery."
    }
  ],
  "c858274b-b270-5362-9203-25ee6d79398a": [
    {
      "id": "l38-q1",
      "question": "Which type of equipment is typically exempt from leak repair requirements due to its small refrigerant charge?",
      "options": [
        "Commercial chillers",
        "Small appliances",
        "Industrial process refrigeration",
        "Comfort cooling systems"
      ],
      "correctAnswer": 1,
      "explanation": "Small appliances contain less than 5 pounds of refrigerant and are generally exempt from leak repair requirements due to their limited environmental impact."
    },
    {
      "id": "l38-q2",
      "question": "What is a key factor for qualifying comfort cooling systems for leak repair exemptions?",
      "options": [
        "System age",
        "Low leak rate and impracticality of repair",
        "Type of refrigerant",
        "Energy efficiency"
      ],
      "correctAnswer": 1,
      "explanation": "Comfort cooling systems may be exempt if they have a low leak rate and repairing them would be economically or technically impractical."
    },
    {
      "id": "l38-q3",
      "question": "Industrial process refrigeration might be exempt from leak repair if:",
      "options": [
        "The unit is larger than 50 tons",
        "The repair disrupts critical operations",
        "The refrigerant is non-toxic",
        "The system is more than 10 years old"
      ],
      "correctAnswer": 1,
      "explanation": "Exemptions might apply to industrial process refrigeration if repairing the leak would disrupt critical operations, but thorough documentation is required."
    },
    {
      "id": "l38-q4",
      "question": "What does 'De Minimis Releases' refer to?",
      "options": [
        "Major refrigeration leaks",
        "Releases during catastrophic failures",
        "Small releases during normal service",
        "Unintentional releases due to mishandling"
      ],
      "correctAnswer": 2,
      "explanation": "De Minimis Releases refer to small amounts of refrigerant released during normal service operations, such as when connecting or disconnecting hoses."
    },
    {
      "id": "l38-q5",
      "question": "Which statement about leak repair exemptions is true?",
      "options": [
        "All systems must be repaired within 30 days",
        "Only systems with CFCs are exempt",
        "Exemptions require documentation and justification",
        "Exemptions apply only to new systems"
      ],
      "correctAnswer": 2,
      "explanation": "Even if a system qualifies for an exemption, thorough documentation and justification are required to comply with EPA guidelines."
    }
  ],
  "d0a9f517-8ed8-59ac-8ab0-4dc5c5b249a6": [
    {
      "id": "l39-q1",
      "question": "What is the maximum amount of refrigerant a small appliance can contain under EPA regulations?",
      "options": [
        "10 pounds",
        "5 pounds",
        "15 pounds",
        "20 pounds"
      ],
      "correctAnswer": 1,
      "explanation": "Small appliances are defined as those containing 5 pounds or less of refrigerant, making this the correct answer."
    },
    {
      "id": "l39-q2",
      "question": "Which type of equipment is required to recover refrigerants from small appliances?",
      "options": [
        "Commercial recovery equipment",
        "Residential recovery equipment",
        "Certified recovery equipment",
        "Industrial recovery equipment"
      ],
      "correctAnswer": 2,
      "explanation": "Certified recovery equipment is specifically designed and tested to safely handle refrigerants, as per EPA regulations."
    },
    {
      "id": "l39-q3",
      "question": "What is the primary environmental concern related to the improper handling of refrigerants?",
      "options": [
        "Global warming",
        "Ozone layer depletion",
        "Air pollution",
        "Water contamination"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerants can cause ozone layer depletion, which is why proper handling and recovery are crucial to minimize environmental impact."
    },
    {
      "id": "l39-q4",
      "question": "How often must recovery equipment be tested for leaks?",
      "options": [
        "Annually",
        "Bi-annually",
        "Monthly",
        "Every five years"
      ],
      "correctAnswer": 0,
      "explanation": "Recovery equipment must be tested for leaks annually to ensure it is functioning properly and not releasing refrigerants into the atmosphere."
    },
    {
      "id": "l39-q5",
      "question": "What is the primary goal of the EPA 608 certification program?",
      "options": [
        "To regulate HVAC technicians",
        "To protect the ozone layer",
        "To standardize HVAC equipment",
        "To reduce energy consumption"
      ],
      "correctAnswer": 1,
      "explanation": "The primary goal of the EPA 608 certification program is to protect the ozone layer by ensuring that technicians handle refrigerants safely and in compliance with environmental regulations."
    }
  ],
  "97b819f5-81ff-5e3a-a165-911b207121d5": [
    {
      "id": "l40-q1",
      "question": "What component in a high-pressure system increases refrigerant pressure?",
      "options": [
        "Evaporator",
        "Condenser",
        "Compressor",
        "Metering Device"
      ],
      "correctAnswer": 2,
      "explanation": "The compressor increases the pressure and temperature of the refrigerant, making it a critical component in the refrigeration cycle."
    },
    {
      "id": "l40-q2",
      "question": "Which component is responsible for releasing absorbed heat in a high-pressure system?",
      "options": [
        "Evaporator",
        "Condenser",
        "Compressor",
        "Receiver"
      ],
      "correctAnswer": 1,
      "explanation": "The condenser releases heat absorbed from the refrigerant, which is essential for the refrigeration cycle."
    },
    {
      "id": "l40-q3",
      "question": "What is the primary function of the metering device in a refrigeration system?",
      "options": [
        "Increase refrigerant pressure",
        "Regulate refrigerant flow",
        "Absorb heat",
        "Condense vapor"
      ],
      "correctAnswer": 1,
      "explanation": "The metering device controls the flow of refrigerant into the evaporator, maintaining the pressure difference necessary for system efficiency."
    },
    {
      "id": "l40-q4",
      "question": "What occurs in the evaporator of a high-pressure system?",
      "options": [
        "Refrigerant is compressed",
        "Refrigerant absorbs heat",
        "Refrigerant is released",
        "Refrigerant is condensed"
      ],
      "correctAnswer": 1,
      "explanation": "The evaporator absorbs heat from the surrounding environment, crucial for converting liquid refrigerant back to vapor."
    },
    {
      "id": "l40-q5",
      "question": "In a high-pressure system, which component directly follows the compressor?",
      "options": [
        "Evaporator",
        "Condenser",
        "Metering Device",
        "Receiver"
      ],
      "correctAnswer": 1,
      "explanation": "After the refrigerant is compressed, it moves to the condenser where it is cooled and condensed."
    }
  ],
  "6e675133-b0f8-5a85-ab4c-d0cf7bbf9f8e": [
    {
      "id": "l41-q1",
      "question": "What certification is required for servicing high-pressure appliances?",
      "options": [
        "Type I",
        "Type II",
        "Type III",
        "Universal"
      ],
      "correctAnswer": 1,
      "explanation": "Type II certification is specifically for servicing and disposing of high-pressure appliances, as discussed in the lesson."
    },
    {
      "id": "l41-q2",
      "question": "What is the recovery level for R-22 with an operational compressor?",
      "options": [
        "0 psi",
        "0 inches of mercury",
        "10 psi",
        "15 inches of mercury"
      ],
      "correctAnswer": 1,
      "explanation": "For R-22, the recovery level with an operational compressor is 0 inches of mercury, ensuring thorough refrigerant removal."
    },
    {
      "id": "l41-q3",
      "question": "What should technicians ensure when using recovery cylinders?",
      "options": [
        "They are color-coded",
        "They are DOT-approved",
        "They are labeled with the technician's name",
        "They are at room temperature"
      ],
      "correctAnswer": 1,
      "explanation": "Recovery cylinders must be DOT-approved to safely contain refrigerants and comply with regulations."
    },
    {
      "id": "l41-q4",
      "question": "What is considered a high-pressure appliance?",
      "options": [
        "A system using R-134a",
        "A system using R-410A",
        "A system using propane",
        "A system using ammonia"
      ],
      "correctAnswer": 1,
      "explanation": "R-410A systems are classified as high-pressure appliances due to their refrigerant properties."
    },
    {
      "id": "l41-q5",
      "question": "Why are recovery requirements stricter for operational compressors?",
      "options": [
        "They are newer",
        "They have more refrigerant",
        "To ensure maximum refrigerant removal",
        "To protect the compressor"
      ],
      "correctAnswer": 2,
      "explanation": "Stricter recovery requirements for operational compressors ensure maximum removal of refrigerants, reducing environmental impact."
    }
  ],
  "380699d9-f6a0-5d7e-a09a-2b69bb4aff76": [
    {
      "id": "l42-q1",
      "question": "What method uses a tool that detects refrigerant vapor?",
      "options": [
        "Soap Bubble Test",
        "Electronic Leak Detector",
        "UV Dye Method",
        "Ultrasonic Leak Detector"
      ],
      "correctAnswer": 1,
      "explanation": "The electronic leak detector is specifically designed to detect refrigerant vapor, making it a crucial tool in leak detection."
    },
    {
      "id": "l42-q2",
      "question": "Which leak detection method involves listening for gas escaping?",
      "options": [
        "Soap Bubble Test",
        "UV Dye Method",
        "Electronic Leak Detector",
        "Ultrasonic Leak Detector"
      ],
      "correctAnswer": 3,
      "explanation": "Ultrasonic leak detectors are used to listen for the high-frequency sound of gas escaping from a leak."
    },
    {
      "id": "l42-q3",
      "question": "Which method involves adding a substance to the refrigerant that glows under UV light?",
      "options": [
        "Electronic Leak Detector",
        "Ultrasonic Leak Detector",
        "Soap Bubble Test",
        "UV Dye Method"
      ],
      "correctAnswer": 3,
      "explanation": "The UV Dye Method involves adding a UV-reactive dye to the system, which glows under UV light and helps locate leaks."
    },
    {
      "id": "l42-q4",
      "question": "What simple method uses a liquid solution to identify leaks by forming bubbles?",
      "options": [
        "Ultrasonic Leak Detector",
        "Soap Bubble Test",
        "UV Dye Method",
        "Electronic Leak Detector"
      ],
      "correctAnswer": 1,
      "explanation": "The Soap Bubble Test uses a liquid soap solution to form bubbles at the site of a leak, indicating the presence of escaping gas."
    },
    {
      "id": "l42-q5",
      "question": "According to EPA regulations, a leak in a system with 50 pounds of refrigerant must be repaired within how many days if the leak rate is exceeded?",
      "options": [
        "30 days",
        "45 days",
        "60 days",
        "90 days"
      ],
      "correctAnswer": 0,
      "explanation": "Per EPA regulations, any significant leak must be repaired within 30 days to prevent excessive refrigerant release into the environment."
    }
  ],
  "6fd12be2-26ff-5def-be3c-82af250b6441": [
    {
      "id": "l43-q1",
      "question": "What is the minimum vacuum level recommended during an evacuation?",
      "options": [
        "1000 microns",
        "500 microns",
        "2000 microns",
        "3000 microns"
      ],
      "correctAnswer": 1,
      "explanation": "A vacuum level of at least 500 microns is recommended to ensure that all air, moisture, and non-condensables are effectively removed, as discussed in our lesson."
    },
    {
      "id": "l43-q2",
      "question": "Why is it important to use a vacuum gauge during evacuation?",
      "options": [
        "To measure refrigerant levels",
        "To check for leaks",
        "To monitor vacuum levels",
        "To regulate pressure"
      ],
      "correctAnswer": 2,
      "explanation": "A vacuum gauge is used to monitor the vacuum levels in microns, ensuring that the evacuation process is thorough and complete."
    },
    {
      "id": "l43-q3",
      "question": "What is the purpose of performing a triple evacuation?",
      "options": [
        "To save time",
        "To ensure safety",
        "To remove all contaminants",
        "To balance the system pressure"
      ],
      "correctAnswer": 2,
      "explanation": "Triple evacuation helps to remove all contaminants, including moisture and non-condensables, ensuring system efficiency and longevity."
    },
    {
      "id": "l43-q4",
      "question": "What should be used to break the vacuum during a triple evacuation?",
      "options": [
        "Air",
        "Refrigerant",
        "Water",
        "Dry nitrogen"
      ],
      "correctAnswer": 3,
      "explanation": "Dry nitrogen is used to break the vacuum in a triple evacuation to avoid introducing moisture or other contaminants into the system."
    },
    {
      "id": "l43-q5",
      "question": "What safety precautions should be taken during evacuation?",
      "options": [
        "None are needed",
        "Use of safety goggles and gloves",
        "Working in a small, enclosed space",
        "Ignoring any leaks"
      ],
      "correctAnswer": 1,
      "explanation": "Safety goggles and gloves should be worn, and ensuring proper ventilation is important to maintain safety during evacuation."
    }
  ],
  "c0d9690c-2ba4-5c77-944f-83bc18d076a8": [
    {
      "id": "l44-q1",
      "question": "What is the EPA leak rate threshold for comfort cooling appliances containing more than 50 pounds of refrigerant?",
      "options": [
        "5%",
        "10%",
        "15%",
        "20%"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 standards specify that comfort cooling appliances must have leaks repaired if the annual leak rate exceeds 10%."
    },
    {
      "id": "l44-q2",
      "question": "How long do technicians have to repair a leak once it is identified?",
      "options": [
        "7 days",
        "14 days",
        "30 days",
        "60 days"
      ],
      "correctAnswer": 2,
      "explanation": "Technicians have 30 days to repair a leak once it is identified, according to EPA 608 regulations."
    },
    {
      "id": "l44-q3",
      "question": "For how many years must records of leak repairs be kept?",
      "options": [
        "One year",
        "Two years",
        "Three years",
        "Five years"
      ],
      "correctAnswer": 2,
      "explanation": "EPA 608 requires that records of leak repairs be maintained for three years to ensure compliance and accountability."
    },
    {
      "id": "l44-q4",
      "question": "What must be done if a system continuously leaks beyond the allowable threshold?",
      "options": [
        "Continue monitoring",
        "Add more refrigerant",
        "Retire or retrofit within 12 months",
        "Ignore it"
      ],
      "correctAnswer": 2,
      "explanation": "If a system continues to leak beyond the allowable threshold, it must be retrofitted or retired within 12 months, according to EPA 608."
    },
    {
      "id": "l44-q5",
      "question": "Which of the following is NOT a method of detecting refrigerant leaks?",
      "options": [
        "Electronic leak detectors",
        "Ultrasonic devices",
        "Soap bubbles",
        "Water spray"
      ],
      "correctAnswer": 3,
      "explanation": "Water spray is not a recognized method for detecting refrigerant leaks, whereas electronic leak detectors, ultrasonic devices, and soap bubbles are."
    }
  ],
  "22f4cbd7-49ea-5fb4-99d0-5d70a9cb876c": [
    {
      "id": "l45-q1",
      "question": "What is the maximum percentage a recovery cylinder should be filled?",
      "options": [
        "70%",
        "80%",
        "90%",
        "100%"
      ],
      "correctAnswer": 1,
      "explanation": "Recovery cylinders should not be filled past 80% to prevent overpressure situations that could lead to safety hazards."
    },
    {
      "id": "l45-q2",
      "question": "Which personal protective equipment is essential during refrigerant recovery?",
      "options": [
        "Helmet",
        "Safety glasses and gloves",
        "Steel-toed boots",
        "Ear plugs"
      ],
      "correctAnswer": 1,
      "explanation": "Safety glasses and gloves are essential to protect against refrigerant exposure and potential system pressure hazards."
    },
    {
      "id": "l45-q3",
      "question": "Why is it important to identify the refrigerant type before recovery?",
      "options": [
        "To save time",
        "To ensure correct recovery procedures",
        "To avoid contamination",
        "Both B and C"
      ],
      "correctAnswer": 3,
      "explanation": "Identifying the refrigerant type ensures correct recovery procedures and prevents contamination of recovery equipment and cylinders."
    },
    {
      "id": "l45-q4",
      "question": "What should you do if the recovery cylinder pressure exceeds safe levels?",
      "options": [
        "Continue recovering",
        "Stop and vent the refrigerant",
        "Stop and check for leaks",
        "Switch to a larger cylinder"
      ],
      "correctAnswer": 2,
      "explanation": "If pressure is too high, stop the recovery process and check for leaks or equipment issues to ensure safety."
    },
    {
      "id": "l45-q5",
      "question": "What is the purpose of switching to vapor recovery mode?",
      "options": [
        "To speed up the process",
        "To recover remaining vapors",
        "To save energy",
        "To clean the equipment"
      ],
      "correctAnswer": 1,
      "explanation": "Switching to vapor recovery mode ensures that all remaining refrigerant vapors are recovered, complying with EPA standards."
    }
  ],
  "bdb91a6e-6f15-5f4c-bb28-fd7260525f57": [
    {
      "id": "l46-q1",
      "question": "What is the maximum allowable annual leak rate for commercial refrigeration equipment with 50 pounds or more of refrigerant?",
      "options": [
        "10%",
        "20%",
        "30%",
        "40%"
      ],
      "correctAnswer": 1,
      "explanation": "For commercial refrigeration equipment, the EPA requires repairs if the leak rate exceeds 20% of the charge per year. This is to ensure the protection of the environment and compliance with regulations."
    },
    {
      "id": "l46-q2",
      "question": "Which refrigerant is being phased out due to its high Ozone Depletion Potential?",
      "options": [
        "R-134a",
        "R-410A",
        "R-22",
        "R-1234yf"
      ],
      "correctAnswer": 2,
      "explanation": "R-22 is being phased out because it has a high Ozone Depletion Potential, which contributes to ozone layer damage. Understanding refrigerant phases is crucial for compliance."
    },
    {
      "id": "l46-q3",
      "question": "What must technicians use to recover refrigerants from systems?",
      "options": [
        "Any vacuum pump",
        "Certified recovery equipment",
        "A standard air compressor",
        "Solar panels"
      ],
      "correctAnswer": 1,
      "explanation": "Technicians must use certified recovery equipment to ensure compliance with EPA standards and to minimize environmental harm. This ensures proper handling and recovery efficiency."
    },
    {
      "id": "l46-q4",
      "question": "Which of the following is a high-pressure refrigerant commonly found in HVAC systems?",
      "options": [
        "R-12",
        "R-22",
        "R-123",
        "R-718"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is a high-pressure refrigerant that is commonly used, but it's being phased out. Understanding refrigerant types and their pressures is key for Type II certification."
    },
    {
      "id": "l46-q5",
      "question": "What safety equipment is essential when handling refrigerants?",
      "options": [
        "Sunglasses",
        "Personal protective equipment",
        "Steel-toed boots",
        "Earplugs"
      ],
      "correctAnswer": 1,
      "explanation": "Personal protective equipment is crucial when handling refrigerants to ensure safety and compliance with regulations. This includes gloves, goggles, and protective clothing."
    }
  ],
  "68964a49-cfe1-5a4a-8e57-41a1dc3290e2": [
    {
      "id": "l47-q1",
      "question": "Which of the following is a common refrigerant used in low-pressure systems?",
      "options": [
        "R-410A",
        "R-123",
        "R-134a",
        "R-22"
      ],
      "correctAnswer": 1,
      "explanation": "R-123 is a common refrigerant used in low-pressure systems, specifically designed for large commercial and industrial applications."
    },
    {
      "id": "l47-q2",
      "question": "What is the required vacuum level for recovering refrigerants from a low-pressure system with more than 200 pounds of refrigerant?",
      "options": [
        "25 mm Hg absolute",
        "500 microns",
        "15 inches Hg",
        "760 mm Hg absolute"
      ],
      "correctAnswer": 0,
      "explanation": "For systems with more than 200 pounds of refrigerant, the EPA requires recovery to a vacuum level of 25 mm Hg absolute to prevent environmental harm."
    },
    {
      "id": "l47-q3",
      "question": "What is the main purpose of a purge unit in a low-pressure system?",
      "options": [
        "To increase refrigerant pressure",
        "To remove non-condensables",
        "To add refrigerant",
        "To decrease system temperature"
      ],
      "correctAnswer": 1,
      "explanation": "A purge unit is used to remove non-condensables from the system, maintaining efficiency and preventing air from entering under vacuum conditions."
    },
    {
      "id": "l47-q4",
      "question": "Why is leak detection crucial in low-pressure systems?",
      "options": [
        "To ensure correct refrigerant charge",
        "To prevent system overheating",
        "To maintain vacuum and prevent air entry",
        "To improve compressor efficiency"
      ],
      "correctAnswer": 2,
      "explanation": "Leak detection is crucial to maintain the vacuum required in low-pressure systems, preventing air and moisture from entering, which can lead to inefficiencies and damage."
    },
    {
      "id": "l47-q5",
      "question": "What happens if a low-pressure system's pressure rises above atmospheric levels?",
      "options": [
        "The system gains efficiency",
        "Non-condensables are introduced",
        "Refrigerant charge increases",
        "System becomes more stable"
      ],
      "correctAnswer": 1,
      "explanation": "If pressure rises above atmospheric levels, non-condensables can enter the system, which must be addressed immediately to maintain system efficiency and integrity."
    }
  ],
  "45de4da6-e35e-531f-bfc5-bc99501e7acd": [
    {
      "id": "l48-q1",
      "question": "What vacuum level must be achieved during recovery of low-pressure refrigerants?",
      "options": [
        "10 inches of Hg",
        "25 mm of Hg absolute",
        "15 mm of Hg absolute",
        "500 microns"
      ],
      "correctAnswer": 1,
      "explanation": "The correct vacuum level for recovering low-pressure refrigerants is 25 mm of Hg absolute, as it ensures maximum refrigerant removal."
    },
    {
      "id": "l48-q2",
      "question": "Which component is crucial in a recovery unit for low-pressure systems?",
      "options": [
        "Thermostatic expansion valve",
        "High-efficiency oil separator",
        "Condenser fan",
        "Sight glass"
      ],
      "correctAnswer": 1,
      "explanation": "A high-efficiency oil separator is crucial in recovery units for low-pressure systems to handle the oil mixed with refrigerants."
    },
    {
      "id": "l48-q3",
      "question": "Why is it important to remove non-condensables from a low-pressure system?",
      "options": [
        "They decrease system pressure",
        "They increase system efficiency",
        "They increase system pressure",
        "They reduce maintenance needs"
      ],
      "correctAnswer": 2,
      "explanation": "Non-condensables increase system pressure, which can reduce chiller efficiency and lead to operational issues."
    },
    {
      "id": "l48-q4",
      "question": "What is the EPA leak repair requirement for comfort cooling systems?",
      "options": [
        "10% annual leak rate",
        "20% annual leak rate",
        "5% annual leak rate",
        "15% annual leak rate"
      ],
      "correctAnswer": 2,
      "explanation": "The EPA requires that leaks be repaired if the annual leak rate exceeds 5% for comfort cooling systems."
    },
    {
      "id": "l48-q5",
      "question": "What tool is used to confirm the vacuum level in low-pressure systems?",
      "options": [
        "Thermometer",
        "Micron gauge",
        "Pressure gauge",
        "Voltmeter"
      ],
      "correctAnswer": 1,
      "explanation": "A micron gauge is used to accurately measure the vacuum level in low-pressure systems, ensuring proper recovery."
    }
  ],
  "cffd498d-d142-59c7-ac7d-fda4bab63015": [
    {
      "id": "l49-q1",
      "question": "What is the primary function of a purge unit in a refrigeration system?",
      "options": [
        "Add refrigerant",
        "Remove non-condensable gases",
        "Increase system pressure",
        "Monitor temperature"
      ],
      "correctAnswer": 1,
      "explanation": "Purge units are designed to remove non-condensable gases, such as air, from the refrigeration system to maintain efficiency and prevent damage."
    },
    {
      "id": "l49-q2",
      "question": "Which type of purge unit requires no manual intervention?",
      "options": [
        "Manual purge unit",
        "Automatic purge unit",
        "Semi-automatic purge unit",
        "None of the above"
      ],
      "correctAnswer": 1,
      "explanation": "Automatic purge units continuously remove non-condensables without manual intervention, making them more efficient for larger systems."
    },
    {
      "id": "l49-q3",
      "question": "Why is it important to handle purged gases according to EPA regulations?",
      "options": [
        "To reduce system pressure",
        "To prevent environmental harm",
        "To increase cooling efficiency",
        "To save costs"
      ],
      "correctAnswer": 1,
      "explanation": "Purged gases may contain refrigerants that can be harmful to the environment, so they must be managed according to EPA regulations to prevent environmental damage."
    },
    {
      "id": "l49-q4",
      "question": "What can happen if non-condensable gases are not removed from a refrigeration system?",
      "options": [
        "Reduced cooling efficiency",
        "Improved system performance",
        "Decreased refrigerant levels",
        "Increased system lubrication"
      ],
      "correctAnswer": 0,
      "explanation": "Non-condensable gases can increase head pressure and reduce cooling efficiency, potentially leading to system failure."
    },
    {
      "id": "l49-q5",
      "question": "What is a common source of non-condensable gases in a refrigeration system?",
      "options": [
        "Refrigerant leaks",
        "System overcharge",
        "Proper sealing",
        "Excess lubrication"
      ],
      "correctAnswer": 0,
      "explanation": "Non-condensable gases like air can enter the system through refrigerant leaks, which is why leak prevention and repair are crucial."
    }
  ],
  "bdde231a-d6e5-5ab6-9e59-1369423d23b0": [
    {
      "id": "l50-q1",
      "question": "What is the recommended evacuation level for low-pressure systems?",
      "options": [
        "50 mm of mercury absolute",
        "25 mm of mercury absolute",
        "500 microns",
        "10 mm of mercury absolute"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA recommends evacuating low-pressure systems to at least 25 mm of mercury absolute to ensure the removal of air and moisture."
    },
    {
      "id": "l50-q2",
      "question": "Why is water presence in low-pressure systems problematic?",
      "options": [
        "It increases system pressure",
        "It causes corrosion",
        "It improves efficiency",
        "It stabilizes refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Water causes corrosion, which can damage metal components and reduce system lifespan and efficiency."
    },
    {
      "id": "l50-q3",
      "question": "What tool is essential for detecting moisture in a system?",
      "options": [
        "Thermostat",
        "Micrometer gauge",
        "Vacuum pump",
        "Pressure gauge"
      ],
      "correctAnswer": 1,
      "explanation": "A micrometer gauge is used to measure the vacuum level and ensure moisture is removed from the system."
    },
    {
      "id": "l50-q4",
      "question": "What should be replaced if a system is opened for service?",
      "options": [
        "Compressor",
        "Expansion valve",
        "Filter drier",
        "Pressure gauge"
      ],
      "correctAnswer": 2,
      "explanation": "The filter drier should be replaced to remove any moisture and acids that may have formed during system exposure."
    },
    {
      "id": "l50-q5",
      "question": "Which component helps reduce moisture accumulation in systems?",
      "options": [
        "Condenser",
        "Gas ballast",
        "Evaporator",
        "Thermostatic expansion valve"
      ],
      "correctAnswer": 1,
      "explanation": "A gas ballast in a vacuum pump helps reduce moisture accumulation by allowing non-condensable gases to escape."
    }
  ],
  "29c86322-2428-55f6-b6b3-2c8044dfa00d": [
    {
      "id": "l51-q1",
      "question": "What is the primary function of a rupture disc in a refrigeration system?",
      "options": [
        "To regulate temperature",
        "To relieve excess pressure",
        "To circulate refrigerant",
        "To filter impurities"
      ],
      "correctAnswer": 1,
      "explanation": "A rupture disc is designed to relieve excess pressure by bursting at a predetermined level, thus protecting the system from overpressurization."
    },
    {
      "id": "l51-q2",
      "question": "Which device is used in conjunction with a rupture disc for additional safety?",
      "options": [
        "Compressor",
        "Condenser",
        "Pressure relief valve",
        "Expansion valve"
      ],
      "correctAnswer": 2,
      "explanation": "A pressure relief valve is often paired with a rupture disc to provide a secondary safety mechanism, ensuring the system remains safe under pressure changes."
    },
    {
      "id": "l51-q3",
      "question": "Why is it important to select pressure relief devices rated for specific refrigerants?",
      "options": [
        "To reduce noise",
        "For aesthetic purposes",
        "To ensure compatibility and safety",
        "To increase efficiency"
      ],
      "correctAnswer": 2,
      "explanation": "Pressure relief devices must be compatible with the specific refrigerant and system pressure to function correctly and safely."
    },
    {
      "id": "l51-q4",
      "question": "What happens when a pressure relief valve opens?",
      "options": [
        "It increases system pressure",
        "It releases excess pressure",
        "It stops refrigerant flow",
        "It closes the circuit"
      ],
      "correctAnswer": 1,
      "explanation": "A pressure relief valve opens to release excess pressure from the system, helping to restore normal conditions and prevent damage."
    },
    {
      "id": "l51-q5",
      "question": "What must be done to ensure rupture discs function properly?",
      "options": [
        "Install in reverse",
        "Maintain according to specifications",
        "Paint them regularly",
        "Replace refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Rupture discs must be installed and maintained according to manufacturer specifications to ensure they function properly and provide the necessary safety."
    }
  ],
  "585091b8-0a4f-5074-9374-1b552d98c413": [
    {
      "id": "l52-q1",
      "question": "What is the required vacuum level when recovering refrigerant from a low-pressure chiller?",
      "options": [
        "500 microns",
        "25 mm of Hg absolute",
        "0 psi",
        "10 psi"
      ],
      "correctAnswer": 1,
      "explanation": "The correct vacuum level for recovering refrigerant from a low-pressure chiller is 25 mm of Hg absolute. This ensures that the refrigerant is adequately evacuated from the system, preventing contamination."
    },
    {
      "id": "l52-q2",
      "question": "Which method is used to detect a leak in a low-pressure system?",
      "options": [
        "Ultrasonic detector",
        "Halide torch",
        "Soap bubbles",
        "Pressurizing with nitrogen"
      ],
      "correctAnswer": 3,
      "explanation": "Pressurizing with nitrogen is the preferred method for leak detection in low-pressure systems, as it helps to identify leaks without introducing air or moisture into the system."
    },
    {
      "id": "l52-q3",
      "question": "What is the primary concern when operating low-pressure chillers?",
      "options": [
        "Excessive refrigerant pressure",
        "Air and moisture infiltration",
        "High discharge temperatures",
        "Compressor overheating"
      ],
      "correctAnswer": 1,
      "explanation": "Low-pressure chillers operate below atmospheric pressure, making them susceptible to air and moisture infiltration, which can lead to system contamination and inefficiency."
    },
    {
      "id": "l52-q4",
      "question": "How should refrigerant recovery be conducted for a low-pressure appliance?",
      "options": [
        "Rapidly with high-pressure units",
        "Slowly to avoid freezing",
        "Using any available recovery machine",
        "In a closed loop system"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant recovery should be conducted slowly to avoid freezing, as low-pressure systems require careful handling to prevent damage."
    },
    {
      "id": "l52-q5",
      "question": "Why is accurate record-keeping important for refrigerant management?",
      "options": [
        "For tax purposes",
        "To ensure compliance with EPA regulations",
        "To forecast future refrigerant needs",
        "To maintain equipment warranties"
      ],
      "correctAnswer": 1,
      "explanation": "Accurate record-keeping is crucial for compliance with EPA regulations, ensuring proper tracking of refrigerant usage and disposal, and protecting the environment."
    }
  ],
  "1482eb8f-9259-5f81-9871-50ba2998593d": [
    {
      "id": "l53-q1",
      "question": "Which of the following contributes to ozone depletion?",
      "options": [
        "Ammonia",
        "CFCs",
        "Propane",
        "Carbon Dioxide"
      ],
      "correctAnswer": 1,
      "explanation": "CFCs contain chlorine, which breaks down ozone molecules in the stratosphere, leading to ozone depletion. This is why their use is heavily regulated under the Montreal Protocol."
    },
    {
      "id": "l53-q2",
      "question": "What is required before opening a system containing refrigerants?",
      "options": [
        "Notifying the EPA",
        "Recovering the refrigerant",
        "Replacing the compressor",
        "Adding refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant recovery is mandatory before opening a system to prevent gas release into the atmosphere, as per EPA regulations."
    },
    {
      "id": "l53-q3",
      "question": "Which document is critical for a technician to maintain EPA compliance?",
      "options": [
        "Refrigerant Usage Log",
        "Warranty Card",
        "Installation Guide",
        "Marketing Brochure"
      ],
      "correctAnswer": 0,
      "explanation": "A Refrigerant Usage Log is essential for tracking refrigerant usage and recovery, ensuring compliance with EPA regulations."
    },
    {
      "id": "l53-q4",
      "question": "What type of recovery equipment is needed for small appliances?",
      "options": [
        "Type I",
        "Type II",
        "Type III",
        "Universal"
      ],
      "correctAnswer": 0,
      "explanation": "Type I recovery equipment is used for small appliances, as defined by the EPA 608 certification requirements."
    },
    {
      "id": "l53-q5",
      "question": "What does the EPA require for leaks in systems containing more than 50 pounds of refrigerant?",
      "options": [
        "Immediate system shutdown",
        "Leak repair within 30 days",
        "Ignore if minor",
        "Increase refrigerant charge"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA mandates that leaks in systems with over 50 pounds of refrigerant must be repaired within 30 days to minimize environmental impact."
    }
  ],
  "a5da3faf-794d-5829-b0e2-e327c2fa021f": [
    {
      "id": "l54-q1",
      "question": "Which type of certification is required for servicing small appliances?",
      "options": [
        "Type II",
        "Type III",
        "Type I",
        "Universal"
      ],
      "correctAnswer": 2,
      "explanation": "Type I certification is specifically for servicing small appliances, which contain up to 5 pounds of refrigerant. This aligns with what we discussed about handling sealed systems like window air conditioners."
    },
    {
      "id": "l54-q2",
      "question": "What type of system would a Type II certified technician typically service?",
      "options": [
        "Chillers",
        "Window AC units",
        "Split systems",
        "Automotive ACs"
      ],
      "correctAnswer": 2,
      "explanation": "Type II certification is for high-pressure appliances, including split systems and rooftop units. These require specific recovery techniques due to the type of refrigerant used."
    },
    {
      "id": "l54-q3",
      "question": "Which refrigerant is commonly used in low-pressure systems?",
      "options": [
        "R-410A",
        "R-22",
        "R-123",
        "R-134a"
      ],
      "correctAnswer": 2,
      "explanation": "R-123 is commonly used in low-pressure systems like chillers, which are covered under Type III certification. This highlights the importance of understanding refrigerant types for different systems."
    },
    {
      "id": "l54-q4",
      "question": "What is a primary concern when servicing low-pressure appliances?",
      "options": [
        "High refrigerant pressure",
        "Compressor overheating",
        "Leak detection",
        "Electrical issues"
      ],
      "correctAnswer": 2,
      "explanation": "Leak detection is crucial for low-pressure systems because they operate under a vacuum, making them more prone to leaks. This is a key point discussed in Type III certification."
    },
    {
      "id": "l54-q5",
      "question": "What must be done before opening a high-pressure system for service?",
      "options": [
        "Check air filters",
        "Recover refrigerant",
        "Replace the compressor",
        "Inspect ductwork"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant must be recovered before opening high-pressure systems, as per EPA regulations. This is a critical safety and environmental protection measure discussed in Type II certification."
    }
  ],
  "e17d20d8-9499-5e2b-b07a-ea14491a6872": [
    {
      "id": "l55-q1",
      "question": "Which of the following refrigerants is classified as an HCFC?",
      "options": [
        "R-134a",
        "R-22",
        "R-410A",
        "R-1234yf"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is classified as an HCFC, which has ozone-depleting potential. This relates to the EPA's focus on controlling substances that harm the ozone layer."
    },
    {
      "id": "l55-q2",
      "question": "What is the primary purpose of the Clean Air Act as it relates to refrigerants?",
      "options": [
        "To reduce greenhouse gases",
        "To prevent ozone depletion",
        "To increase energy efficiency",
        "To promote use of natural refrigerants"
      ],
      "correctAnswer": 1,
      "explanation": "The Clean Air Act aims to prevent ozone depletion by regulating substances that harm the ozone layer, including refrigerants like CFCs and HCFCs."
    },
    {
      "id": "l55-q3",
      "question": "During recovery, why is it important to minimize refrigerant emissions?",
      "options": [
        "To save costs",
        "To reduce noise pollution",
        "To protect the ozone layer",
        "To comply with energy standards"
      ],
      "correctAnswer": 2,
      "explanation": "Minimizing refrigerant emissions is crucial to protect the ozone layer from substances that contribute to ozone depletion, a key focus of the EPA regulations."
    },
    {
      "id": "l55-q4",
      "question": "Which equipment is necessary for recovering refrigerant from small appliances?",
      "options": [
        "Reclaiming machine",
        "Recycling recovery machine",
        "Recovery machine",
        "Recharging station"
      ],
      "correctAnswer": 2,
      "explanation": "A recovery machine is used to safely remove refrigerant from small appliances, aligning with EPA regulations on refrigerant handling."
    },
    {
      "id": "l55-q5",
      "question": "What records must be kept by technicians to comply with EPA regulations?",
      "options": [
        "Service invoices",
        "Customer feedback forms",
        "Refrigerant usage records",
        "Equipment warranties"
      ],
      "correctAnswer": 2,
      "explanation": "Technicians must maintain records of refrigerant usage to comply with EPA regulations, ensuring accountability and environmental protection."
    }
  ],
  "89bf59f3-5aaa-5df2-83f3-5d32c91b5d83": [
    {
      "id": "l56-q1",
      "question": "What is the maximum allowable refrigerant charge for a small appliance under EPA Type I?",
      "options": [
        "10 pounds",
        "5 pounds",
        "15 pounds",
        "20 pounds"
      ],
      "correctAnswer": 1,
      "explanation": "Small appliances are defined by the EPA as those containing five pounds or less of refrigerant, a key point for Type I certification."
    },
    {
      "id": "l56-q2",
      "question": "What percentage of refrigerant must be recovered from a small appliance if the compressor is operational?",
      "options": [
        "50%",
        "70%",
        "90%",
        "100%"
      ],
      "correctAnswer": 2,
      "explanation": "The EPA requires that 90% of the refrigerant be recovered if the compressor in a small appliance is functional."
    },
    {
      "id": "l56-q3",
      "question": "Which refrigerant is commonly used in small appliances?",
      "options": [
        "R-404A",
        "R-22",
        "R-134a",
        "R-410A"
      ],
      "correctAnswer": 2,
      "explanation": "R-134a is commonly used in small appliances, making it important to understand its properties and handling."
    },
    {
      "id": "l56-q4",
      "question": "What is the main environmental concern associated with refrigerants?",
      "options": [
        "Energy consumption",
        "Ozone depletion",
        "Noise pollution",
        "Water contamination"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerants can contribute to ozone depletion if released into the atmosphere, which is why the EPA regulates their handling."
    },
    {
      "id": "l56-q5",
      "question": "What should technicians do before opening a system for service?",
      "options": [
        "Vent refrigerant into the air",
        "Recover refrigerant",
        "Add more refrigerant",
        "Replace the compressor"
      ],
      "correctAnswer": 1,
      "explanation": "Technicians must recover refrigerant from the system to comply with EPA regulations and prevent environmental harm."
    }
  ],
  "a59e3c1a-7b8e-5ddd-8bc0-17ec3cdf5c34": [
    {
      "id": "l57-q1",
      "question": "What is the required recovery level for refrigerants in a high-pressure appliance manufactured before November 15, 1993?",
      "options": [
        "0 inches of Hg",
        "10 inches of Hg",
        "15 inches of Hg",
        "20 inches of Hg"
      ],
      "correctAnswer": 1,
      "explanation": "The correct answer is 10 inches of Hg. According to EPA 608 regulations, high-pressure appliances manufactured before November 15, 1993, must be evacuated to 10 inches of Hg."
    },
    {
      "id": "l57-q2",
      "question": "Which of the following is NOT an approved method for leak detection?",
      "options": [
        "Ultrasonic detector",
        "Electronic detector",
        "Soap bubble test",
        "Visual inspection"
      ],
      "correctAnswer": 3,
      "explanation": "The correct answer is visual inspection. While visual inspection is important for maintenance, the EPA recommends ultrasonic, electronic, and soap bubble tests for effective leak detection."
    },
    {
      "id": "l57-q3",
      "question": "What is the maximum allowable leak rate for commercial refrigeration equipment containing 50 pounds or more of refrigerant?",
      "options": [
        "5%",
        "10%",
        "15%",
        "20%"
      ],
      "correctAnswer": 1,
      "explanation": "The correct answer is 10%. The EPA mandates that any system with a leak rate exceeding 10% must be repaired within 30 days."
    },
    {
      "id": "l57-q4",
      "question": "What is the consequence of knowingly venting refrigerants into the atmosphere?",
      "options": [
        "Fine only",
        "Imprisonment only",
        "Both fine and imprisonment",
        "No consequence"
      ],
      "correctAnswer": 2,
      "explanation": "The correct answer is both fine and imprisonment. Under the Clean Air Act, knowingly venting refrigerants can result in fines and imprisonment."
    },
    {
      "id": "l57-q5",
      "question": "Which type of equipment requires special considerations for recovery due to its design?",
      "options": [
        "Split systems",
        "Package units",
        "Industrial process refrigeration",
        "Window units"
      ],
      "correctAnswer": 2,
      "explanation": "The correct answer is industrial process refrigeration. These systems often require unique recovery approaches due to their complex designs and large refrigerant charges."
    }
  ],
  "b31efdba-26b4-56f0-8138-43822d35ae81": [
    {
      "id": "l58-q1",
      "question": "What is the required vacuum level for recovering refrigerant from a low-pressure chiller?",
      "options": [
        "15 mm Hg",
        "25 mm Hg",
        "500 microns",
        "10 mm Hg"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA requires a vacuum level of 25 mm of mercury absolute for low-pressure systems before the appliance can be opened for repairs. Achieving this level ensures that refrigerants are adequately recovered."
    },
    {
      "id": "l58-q2",
      "question": "Which refrigerant is commonly used in low-pressure chillers?",
      "options": [
        "R-22",
        "R-410A",
        "R-123",
        "R-134a"
      ],
      "correctAnswer": 2,
      "explanation": "R-123 is a commonly used refrigerant in low-pressure chillers. Understanding the properties and handling of this refrigerant is crucial for Type III certification."
    },
    {
      "id": "l58-q3",
      "question": "What is the maximum allowable leak rate for low-pressure systems before repairs are required?",
      "options": [
        "15% annually",
        "10% annually",
        "5% annually",
        "20% annually"
      ],
      "correctAnswer": 1,
      "explanation": "For low-pressure systems with 50 pounds of refrigerant or more, the EPA mandates repairs if the leak rate exceeds 10% per year. This helps minimize environmental impact."
    },
    {
      "id": "l58-q4",
      "question": "What does the de minimis release rule allow?",
      "options": [
        "Unlimited refrigerant release",
        "Release during equipment disposal",
        "Small refrigerant releases during service",
        "Intentional venting during maintenance"
      ],
      "correctAnswer": 2,
      "explanation": "The de minimis release rule allows for small amounts of refrigerant release during service, maintenance, or repair, provided it's unavoidable and minimized."
    },
    {
      "id": "l58-q5",
      "question": "Which of the following is a key step in effective leak detection for low-pressure systems?",
      "options": [
        "Using a vacuum gauge",
        "Listening for hissing sounds",
        "Applying soap bubbles",
        "Using an electronic leak detector"
      ],
      "correctAnswer": 3,
      "explanation": "Applying soap bubbles is a simple and effective method for detecting leaks in low-pressure systems. It allows for visual confirmation of leak sites."
    }
  ],
  "efae33d2-641f-56bc-9ad2-784129db4516": [
    {
      "id": "l59-q1",
      "question": "Which refrigerant is classified as having the highest ozone depletion potential?",
      "options": [
        "R-410A",
        "R-22",
        "R-134a",
        "R-12"
      ],
      "correctAnswer": 3,
      "explanation": "R-12 has the highest ozone depletion potential among common refrigerants. It's important to know these classifications for environmental compliance."
    },
    {
      "id": "l59-q2",
      "question": "Which type of system requires a Type II certification for servicing?",
      "options": [
        "Small appliances",
        "High-pressure systems",
        "Low-pressure systems",
        "Motor vehicle AC systems"
      ],
      "correctAnswer": 1,
      "explanation": "Type II certification covers high-pressure systems, which are commonly found in residential and commercial HVAC applications."
    },
    {
      "id": "l59-q3",
      "question": "What is the primary concern when handling refrigerants?",
      "options": [
        "Flammability",
        "Toxicity",
        "Environmental impact",
        "Cost"
      ],
      "correctAnswer": 2,
      "explanation": "While all factors are important, the primary concern for EPA regulations is the environmental impact, specifically on ozone layer depletion and global warming."
    },
    {
      "id": "l59-q4",
      "question": "What is a non-condensable gas, and why is it problematic in a refrigeration system?",
      "options": [
        "Air, because it increases pressure",
        "Refrigerant, because it leaks",
        "Moisture, because it freezes",
        "Oil, because it clogs filters"
      ],
      "correctAnswer": 0,
      "explanation": "Air is a non-condensable gas that can increase the pressure within a system, leading to inefficiencies and potential damage."
    },
    {
      "id": "l59-q5",
      "question": "What method is used to test for leaks in a low-pressure system?",
      "options": [
        "Ultrasonic detector",
        "Electronic leak detector",
        "Soap bubble test",
        "Vacuum test"
      ],
      "correctAnswer": 3,
      "explanation": "A vacuum test is commonly used in low-pressure systems to check for leaks, as it can reveal leaks that aren't detectable under normal pressure."
    }
  ],
  "0f05573b-f248-5a46-8089-fecbdb568ed9": [
    {
      "id": "l60-q1",
      "question": "What is the most accurate method for charging a refrigerant into a system?",
      "options": [
        "Superheat method",
        "Weight method",
        "Subcooling method",
        "Charging chart"
      ],
      "correctAnswer": 1,
      "explanation": "The weight method is considered the most accurate as it involves adding the exact amount of refrigerant specified by the manufacturer, preventing overcharging or undercharging."
    },
    {
      "id": "l60-q2",
      "question": "Which method is typically used with a fixed orifice metering device?",
      "options": [
        "Subcooling method",
        "Weight method",
        "Charging chart",
        "Superheat method"
      ],
      "correctAnswer": 3,
      "explanation": "The superheat method is used with systems that have a fixed orifice metering device to ensure the evaporator receives the correct amount of refrigerant."
    },
    {
      "id": "l60-q3",
      "question": "What does the subcooling method ensure in an HVAC system?",
      "options": [
        "The evaporator is receiving correct refrigerant",
        "The condenser is functioning efficiently",
        "The system is charged by weight",
        "The system is overcharged"
      ],
      "correctAnswer": 1,
      "explanation": "The subcooling method ensures that the condenser is functioning efficiently by maintaining the correct temperature differential."
    },
    {
      "id": "l60-q4",
      "question": "What should be referenced for the correct refrigerant type and amount?",
      "options": [
        "Charging chart",
        "System's nameplate",
        "Ambient temperature",
        "Service valve"
      ],
      "correctAnswer": 1,
      "explanation": "The system's nameplate or service manual provides the manufacturer's specifications for the correct refrigerant type and amount."
    },
    {
      "id": "l60-q5",
      "question": "A charging chart is typically used with which methods?",
      "options": [
        "Weight and subcooling",
        "Superheat and subcooling",
        "Weight and superheat",
        "None of the above"
      ],
      "correctAnswer": 1,
      "explanation": "Charging charts provide specific instructions based on ambient temperature and pressure readings, often used as a reference for both superheat and subcooling methods."
    }
  ],
  "de9cc92e-d9cf-5e65-bc33-e6be44c0d0d2": [
    {
      "id": "l61-q1",
      "question": "When connecting a manifold gauge set, where should the low-pressure side be connected?",
      "options": [
        "To the liquid line",
        "To the suction line",
        "To the discharge line",
        "To the purge port"
      ],
      "correctAnswer": 1,
      "explanation": "The low-pressure side of the manifold gauge set should be connected to the suction line. This allows for accurate reading of the suction pressure, which is crucial for diagnosing system performance."
    },
    {
      "id": "l61-q2",
      "question": "What does a high head pressure typically indicate?",
      "options": [
        "Refrigerant undercharge",
        "Dirty condenser coils",
        "Low evaporator temperature",
        "System restriction"
      ],
      "correctAnswer": 1,
      "explanation": "High head pressure often indicates dirty condenser coils or an overcharged system. This condition can reduce system efficiency and increase energy usage."
    },
    {
      "id": "l61-q3",
      "question": "What is 'superheat' in HVAC systems?",
      "options": [
        "Pressure above atmospheric level",
        "Temperature drop below condensing point",
        "Temperature increase above boiling point",
        "Temperature at freezing point"
      ],
      "correctAnswer": 2,
      "explanation": "Superheat is the temperature increase above the boiling point of the refrigerant in the evaporator. It is used to ensure the refrigerant is fully vaporized before entering the compressor."
    },
    {
      "id": "l61-q4",
      "question": "According to EPA regulations, when must leak inspections be conducted?",
      "options": [
        "Every year",
        "Every month",
        "For systems with more than 50 pounds of refrigerant",
        "Only when there is a system failure"
      ],
      "correctAnswer": 2,
      "explanation": "The EPA requires leak inspections for systems containing more than 50 pounds of refrigerant to minimize environmental impact and ensure system efficiency."
    },
    {
      "id": "l61-q5",
      "question": "What does subcooling indicate in an HVAC system?",
      "options": [
        "Efficient evaporator function",
        "Refrigerant undercharge",
        "Effective condenser operation",
        "System restriction"
      ],
      "correctAnswer": 2,
      "explanation": "Subcooling indicates effective condenser operation by showing the temperature drop below the condensing point, ensuring the refrigerant is fully condensed before entering the expansion device."
    }
  ],
  "14d196dc-5ed3-54c7-8ac7-5657ccc4abdf": [
    {
      "id": "l62-q1",
      "question": "Which tool is most commonly used for detecting refrigerant leaks in inaccessible areas?",
      "options": [
        "Visual Inspection",
        "Electronic Leak Detector",
        "UV Dye Kit",
        "Soap Bubble Method"
      ],
      "correctAnswer": 1,
      "explanation": "Electronic leak detectors are specifically designed to detect refrigerant leaks in areas that are difficult to access visually."
    },
    {
      "id": "l62-q2",
      "question": "What personal protective equipment should be worn during leak detection?",
      "options": [
        "Safety goggles and gloves",
        "Hard hat",
        "Steel-toed boots",
        "Ear protection"
      ],
      "correctAnswer": 0,
      "explanation": "Safety goggles and gloves are essential to protect against potential refrigerant exposure during leak detection."
    },
    {
      "id": "l62-q3",
      "question": "How should the electronic leak detector probe be moved for accurate detection?",
      "options": [
        "Quickly",
        "At a speed of 1 inch per second",
        "At random intervals",
        "In a circular motion"
      ],
      "correctAnswer": 1,
      "explanation": "The probe should be moved at a speed of about 1 inch per second to ensure accurate leak detection."
    },
    {
      "id": "l62-q4",
      "question": "What is the primary purpose of using a UV dye kit in leak detection?",
      "options": [
        "To lubricate the system",
        "To visually highlight leaks",
        "To cool the refrigerant",
        "To clean the system"
      ],
      "correctAnswer": 1,
      "explanation": "UV dye kits are used to visually highlight leaks when exposed to UV light, making them easier to locate."
    },
    {
      "id": "l62-q5",
      "question": "What must be done after detecting a refrigerant leak according to EPA regulations?",
      "options": [
        "Ignore it",
        "Repair it before refilling the system",
        "Refill the system immediately",
        "Document it and leave it"
      ],
      "correctAnswer": 1,
      "explanation": "According to EPA regulations, leaks must be repaired before the system is refilled to prevent further environmental harm."
    }
  ],
  "09b1654c-b197-5edb-abc1-97b1481f5cd6": [
    {
      "id": "l63-q1",
      "question": "What is the maximum allowable level of non-condensables in a system after evacuation?",
      "options": [
        "800 microns",
        "500 microns",
        "1000 microns",
        "200 microns"
      ],
      "correctAnswer": 1,
      "explanation": "After evacuation, a system should achieve a vacuum of 500 microns or lower to ensure all non-condensables and moisture are removed, in compliance with industry standards."
    },
    {
      "id": "l63-q2",
      "question": "Why is it important to check the recovery machine's oil level before starting recovery?",
      "options": [
        "To ensure the refrigerant purity",
        "To prevent damage to the machine",
        "To speed up the recovery process",
        "To increase refrigerant capacity"
      ],
      "correctAnswer": 1,
      "explanation": "Checking the oil level before starting is crucial to prevent damage to the recovery machine and ensure it operates efficiently."
    },
    {
      "id": "l63-q3",
      "question": "What should you do if the pressure does not decrease during recovery?",
      "options": [
        "Continue the process",
        "Check for leaks",
        "Change the refrigerant",
        "Increase the pressure"
      ],
      "correctAnswer": 1,
      "explanation": "If the pressure does not decrease, it might indicate a leak or an improper connection, so checking for leaks is essential."
    },
    {
      "id": "l63-q4",
      "question": "What is a micron gauge used for?",
      "options": [
        "Measuring refrigerant weight",
        "Testing electrical circuits",
        "Monitoring evacuation pressure",
        "Measuring system temperature"
      ],
      "correctAnswer": 2,
      "explanation": "A micron gauge is used to monitor evacuation pressure, ensuring that the system reaches the required vacuum level."
    },
    {
      "id": "l63-q5",
      "question": "What is the purpose of connecting the vacuum pump to the system?",
      "options": [
        "To add refrigerant",
        "To remove air and moisture",
        "To test for leaks",
        "To increase system pressure"
      ],
      "correctAnswer": 1,
      "explanation": "Connecting the vacuum pump is crucial to remove air and moisture from the system, ensuring optimal performance and compliance with EPA standards."
    }
  ],
  "570baadf-be07-57b7-8d5b-bcb8f8c23dfe": [
    {
      "id": "l64-q1",
      "question": "Which component in a refrigeration system is responsible for compressing the refrigerant and raising its pressure?",
      "options": [
        "Condenser",
        "Compressor",
        "Evaporator",
        "Expansion Valve"
      ],
      "correctAnswer": 1,
      "explanation": "The compressor raises the pressure of the refrigerant, which is essential for the refrigeration cycle. Understanding this is key to diagnosing system issues."
    },
    {
      "id": "l64-q2",
      "question": "What does a high superheat reading indicate in a refrigeration system?",
      "options": [
        "System overcharge",
        "Insufficient refrigerant",
        "Blocked condenser",
        "Faulty compressor"
      ],
      "correctAnswer": 1,
      "explanation": "A high superheat reading typically indicates that there is insufficient refrigerant in the system, causing the evaporator to be underfed."
    },
    {
      "id": "l64-q3",
      "question": "Which of the following readings would suggest a refrigerant overcharge in a system?",
      "options": [
        "Low subcooling",
        "High subcooling",
        "High superheat",
        "Low pressure"
      ],
      "correctAnswer": 1,
      "explanation": "High subcooling suggests that there is too much refrigerant in the system, leading to an overcharge condition."
    },
    {
      "id": "l64-q4",
      "question": "When recovering refrigerant from a system, what should be done to prevent refrigerant emissions?",
      "options": [
        "Use a vacuum pump",
        "Use a recovery machine",
        "Vent refrigerant to atmosphere",
        "Refrigerant recycling"
      ],
      "correctAnswer": 1,
      "explanation": "Using a recovery machine is crucial for preventing refrigerant emissions and is a regulatory requirement under EPA 608."
    },
    {
      "id": "l64-q5",
      "question": "What is the primary purpose of the expansion valve in a refrigeration system?",
      "options": [
        "Increase pressure",
        "Absorb heat",
        "Reduce pressure",
        "Transfer heat"
      ],
      "correctAnswer": 2,
      "explanation": "The expansion valve reduces the pressure of the refrigerant, allowing it to expand and cool, which is essential for the refrigeration process."
    }
  ],
  "d14effbf-eb31-5686-aa9c-a83a6e4c9ce9": [
    {
      "id": "l65-q1",
      "question": "What is a key consequence of undersized ductwork?",
      "options": [
        "Increased airflow",
        "Increased energy consumption",
        "Decreased system strain",
        "Improved distribution"
      ],
      "correctAnswer": 1,
      "explanation": "Undersized ductwork leads to increased energy consumption because the system has to work harder to maintain airflow."
    },
    {
      "id": "l65-q2",
      "question": "Which method is commonly used for duct sizing?",
      "options": [
        "Static Pressure Method",
        "Equal Friction Method",
        "Dynamic Loss Method",
        "Pressure Balance Method"
      ],
      "correctAnswer": 1,
      "explanation": "The Equal Friction Method is used to ensure a consistent pressure drop throughout the duct system, optimizing efficiency."
    },
    {
      "id": "l65-q3",
      "question": "Why is sealing duct joints important?",
      "options": [
        "To increase airflow",
        "To prevent air leaks",
        "To reduce noise",
        "To decrease insulation needs"
      ],
      "correctAnswer": 1,
      "explanation": "Sealing duct joints is crucial to prevent air leaks, which helps maintain system efficiency and reduce operational costs."
    },
    {
      "id": "l65-q4",
      "question": "What is a disadvantage of using flexible ductwork?",
      "options": [
        "High durability",
        "Low pressure loss",
        "Easy installation",
        "Higher pressure losses if not installed properly"
      ],
      "correctAnswer": 3,
      "explanation": "Flexible ducts can have higher pressure losses if not installed correctly, affecting system performance."
    },
    {
      "id": "l65-q5",
      "question": "How can you reduce noise in duct systems?",
      "options": [
        "Use thinner ducts",
        "Install sound attenuators",
        "Decrease airflow",
        "Increase duct length"
      ],
      "correctAnswer": 1,
      "explanation": "Installing sound attenuators or using lined ducts can significantly reduce noise transmission in duct systems."
    }
  ],
  "25fbe08b-6111-54ef-911c-d753dd71d748": [
    {
      "id": "l66-q1",
      "question": "What is the primary purpose of Manual J calculations?",
      "options": [
        "To determine the cost of HVAC equipment",
        "To calculate heating and cooling loads for a building",
        "To design the ductwork layout",
        "To select refrigerant types"
      ],
      "correctAnswer": 1,
      "explanation": "Manual J is used to calculate heating and cooling loads for residential structures, ensuring the HVAC system is appropriately sized for efficiency and comfort."
    },
    {
      "id": "l66-q2",
      "question": "Which factor is NOT considered in Manual J calculations?",
      "options": [
        "Building orientation",
        "Local climate",
        "Refrigerant type",
        "Window glazing"
      ],
      "correctAnswer": 2,
      "explanation": "Manual J focuses on the building's thermal properties and local climate, not the type of refrigerant used in the HVAC system."
    },
    {
      "id": "l66-q3",
      "question": "Why is it important to account for internal heat gain in Manual J?",
      "options": [
        "It affects the building's structural integrity",
        "It contributes to the total cooling load",
        "It determines the ductwork size",
        "It influences refrigerant selection"
      ],
      "correctAnswer": 1,
      "explanation": "Internal heat gain from occupants, appliances, and lighting adds to the cooling load, affecting the overall sizing of the HVAC system."
    },
    {
      "id": "l66-q4",
      "question": "How does building orientation affect Manual J calculations?",
      "options": [
        "It determines the HVAC brand",
        "It influences solar heat gain",
        "It dictates the refrigerant type",
        "It changes the ductwork material"
      ],
      "correctAnswer": 1,
      "explanation": "Building orientation affects solar heat gain, which is a critical component in determining the building's cooling load."
    },
    {
      "id": "l66-q5",
      "question": "What could result from an oversized HVAC system?",
      "options": [
        "Improved air quality",
        "Increased energy efficiency",
        "Short cycling and inefficiency",
        "Longer equipment lifespan"
      ],
      "correctAnswer": 2,
      "explanation": "An oversized system may short cycle, leading to inefficiency and wear, as it frequently turns on and off without reaching the optimal operating cycle."
    }
  ],
  "42151711-0da4-5579-99e2-0fa907d88a5c": [
    {
      "id": "l67-q1",
      "question": "What is the key difference between soldering and brazing?",
      "options": [
        "Soldering uses higher temperatures",
        "Brazing uses higher temperatures",
        "Soldering is used for steel",
        "Brazing uses less filler metal"
      ],
      "correctAnswer": 1,
      "explanation": "Brazing uses a filler metal that melts above 840°F, which is higher than the temperatures used in soldering."
    },
    {
      "id": "l67-q2",
      "question": "Which PPE is essential when brazing?",
      "options": [
        "Goggles and gloves",
        "Earplugs",
        "Dust mask",
        "Rubber boots"
      ],
      "correctAnswer": 0,
      "explanation": "Goggles and gloves protect you from heat and sparks during brazing, which is crucial for safety."
    },
    {
      "id": "l67-q3",
      "question": "What type of torch is commonly used for brazing?",
      "options": [
        "Oxy-acetylene torch",
        "Butane torch",
        "Electric torch",
        "Propane torch"
      ],
      "correctAnswer": 0,
      "explanation": "An oxy-acetylene torch provides the high temperatures needed for brazing, melting the filler metal above 840°F."
    },
    {
      "id": "l67-q4",
      "question": "Why is proper ventilation important during soldering?",
      "options": [
        "To prevent overheating",
        "To avoid inhaling fumes",
        "To reduce noise",
        "To save energy"
      ],
      "correctAnswer": 1,
      "explanation": "Proper ventilation is necessary to avoid inhaling potentially hazardous fumes generated during the soldering process."
    },
    {
      "id": "l67-q5",
      "question": "Which process is better suited for high-pressure environments?",
      "options": [
        "Soldering",
        "Brazing",
        "Both are equal",
        "Neither"
      ],
      "correctAnswer": 1,
      "explanation": "Brazing creates stronger joints suitable for high-pressure environments, making it ideal for many HVAC applications."
    }
  ],
  "60d1c15b-56c9-59cd-bda0-cdb6c1490e55": [
    {
      "id": "l68-q1",
      "question": "What is the primary purpose of insulating the suction line?",
      "options": [
        "To prevent refrigerant leaks",
        "To prevent condensation and energy loss",
        "To increase refrigerant pressure",
        "To allow for easier handling"
      ],
      "correctAnswer": 1,
      "explanation": "Insulating the suction line prevents condensation and energy loss, which helps maintain system efficiency. This is a commonly tested concept on the EPA 608 exam."
    },
    {
      "id": "l68-q2",
      "question": "Why is it important to avoid sharp bends in line sets?",
      "options": [
        "To reduce installation time",
        "To prevent refrigerant flow restriction",
        "To minimize heat transfer",
        "To simplify brazing"
      ],
      "correctAnswer": 1,
      "explanation": "Sharp bends can restrict refrigerant flow, leading to inefficiencies and potential system issues. This is an important installation consideration."
    },
    {
      "id": "l68-q3",
      "question": "What must be done before brazing line set connections?",
      "options": [
        "Ensure the system is on",
        "Purge with nitrogen",
        "Install insulation",
        "Measure refrigerant levels"
      ],
      "correctAnswer": 1,
      "explanation": "Purging with nitrogen prevents oxidation and the formation of acid, protecting the system from damage. This step is crucial for a clean and safe installation."
    },
    {
      "id": "l68-q4",
      "question": "What can happen if the line set is undersized?",
      "options": [
        "Improved efficiency",
        "Increased system pressure",
        "Reduced noise levels",
        "Simplified installation"
      ],
      "correctAnswer": 1,
      "explanation": "An undersized line set can increase system pressure, potentially leading to compressor failure, which is a critical system issue addressed in the EPA 608 exam."
    },
    {
      "id": "l68-q5",
      "question": "What does the EPA 608 regulation require regarding refrigerant release during installation?",
      "options": [
        "No regulations",
        "Controlled release with proper equipment",
        "Immediate release is allowed",
        "Release only at night"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 requires that any refrigerant release be controlled using proper recovery equipment to protect the environment, a key regulation for certification."
    }
  ],
  "15c1c957-28df-5cb2-bb8a-dd8f0792468f": [
    {
      "id": "l69-q1",
      "question": "What is the first step in the system startup procedure?",
      "options": [
        "Charge the system with refrigerant",
        "Inspect the system for visible damage",
        "Check thermostat settings",
        "Perform an operational test"
      ],
      "correctAnswer": 1,
      "explanation": "The first step is to inspect the system for visible damage. This ensures there are no physical issues before startup, which aligns with EPA best practices."
    },
    {
      "id": "l69-q2",
      "question": "Why is it important to use EPA-approved refrigerants?",
      "options": [
        "They are cheaper",
        "They are more efficient",
        "They comply with regulatory requirements",
        "They have a longer shelf life"
      ],
      "correctAnswer": 2,
      "explanation": "Using EPA-approved refrigerants ensures compliance with environmental regulations, preventing legal issues and fines."
    },
    {
      "id": "l69-q3",
      "question": "What should you check before charging the system with refrigerant?",
      "options": [
        "The system is under vacuum",
        "The compressor is running",
        "The thermostat is set to cooling",
        "The condenser fan is operational"
      ],
      "correctAnswer": 0,
      "explanation": "Ensuring the system is under vacuum prevents contamination of the refrigerant, which is crucial for system efficiency and longevity."
    },
    {
      "id": "l69-q4",
      "question": "How do you confirm there are no blockages in the airflow over the evaporator coil?",
      "options": [
        "Check system pressure readings",
        "Inspect the air filter",
        "Monitor temperature readings",
        "Listen for unusual sounds"
      ],
      "correctAnswer": 1,
      "explanation": "Inspecting the air filter is a straightforward way to ensure there are no blockages, which could impede airflow and affect system performance."
    },
    {
      "id": "l69-q5",
      "question": "What does an operational test include?",
      "options": [
        "Checking refrigerant type",
        "Securing electrical connections",
        "Confirming compressor cycling",
        "Inspecting for refrigerant leaks"
      ],
      "correctAnswer": 2,
      "explanation": "An operational test involves confirming that the compressor cycles correctly, ensuring the system operates as expected under normal conditions."
    }
  ],
  "f5222938-3bf3-5cc8-8e5f-764043881d89": [
    {
      "id": "l70-q1",
      "question": "Which of the following is the correct method for verifying the system is free of leaks after installation?",
      "options": [
        "Using a pressure gauge only",
        "Using an electronic leak detector",
        "By visual inspection",
        "By checking refrigerant levels"
      ],
      "correctAnswer": 1,
      "explanation": "The correct method for detecting leaks is to use an electronic leak detector, as it is sensitive and can detect even small leaks, which is necessary for compliance with EPA 608 standards."
    },
    {
      "id": "l70-q2",
      "question": "What is a critical step in the initial charging of a new HVAC system?",
      "options": [
        "Guessing the refrigerant charge",
        "Using the sight glass method",
        "Measuring superheat or subcooling",
        "Adding refrigerant until the system cools"
      ],
      "correctAnswer": 2,
      "explanation": "Measuring superheat or subcooling is crucial to ensure the system is charged correctly, maintaining efficiency and performance, as taught in the installation module."
    },
    {
      "id": "l70-q3",
      "question": "Why is it important to maintain accurate installation records?",
      "options": [
        "For personal reference",
        "To avoid fines",
        "For warranty purposes",
        "For EPA compliance requirements"
      ],
      "correctAnswer": 3,
      "explanation": "Accurate records are necessary for EPA compliance, as regulations require documentation of refrigerant types and quantities, which helps in environmental protection and legal adherence."
    },
    {
      "id": "l70-q4",
      "question": "When should a system be leak tested?",
      "options": [
        "Only if refrigerant levels drop",
        "After installation and before charging",
        "Only during annual maintenance",
        "Whenever the client requests"
      ],
      "correctAnswer": 1,
      "explanation": "A system should be leak tested after installation and before charging to ensure there are no leaks, preventing refrigerant loss and ensuring system integrity."
    },
    {
      "id": "l70-q5",
      "question": "What is the main purpose of using a vacuum pump during installation?",
      "options": [
        "To add refrigerant",
        "To check the system's pressure",
        "To remove moisture and air",
        "To measure superheat"
      ],
      "correctAnswer": 2,
      "explanation": "A vacuum pump is used to remove moisture and air from the system, which can cause system inefficiencies and potential damage if not properly evacuated."
    }
  ],
  "9b8de967-157d-5a9f-b3a5-f64ec6ca306d": [
    {
      "id": "l71-q1",
      "question": "What should be your first step in the Systematic Troubleshooting Method?",
      "options": [
        "Repair the component",
        "Identify the symptoms",
        "Replace refrigerant",
        "Test the system"
      ],
      "correctAnswer": 1,
      "explanation": "Identifying the symptoms is the first step in the Systematic Troubleshooting Method. It sets the stage for diagnosing the issue accurately by focusing on specific problems observed."
    },
    {
      "id": "l71-q2",
      "question": "Which step involves checking system pressures and temperatures?",
      "options": [
        "Repairing the system",
        "Gathering relevant data",
        "Testing the system",
        "Replacing components"
      ],
      "correctAnswer": 1,
      "explanation": "Gathering relevant data involves checking system pressures and temperatures to understand how each component is functioning, which is crucial for diagnosing issues."
    },
    {
      "id": "l71-q3",
      "question": "According to EPA 608, what is essential when handling refrigerants?",
      "options": [
        "Venting to the atmosphere",
        "Recycling or recovering",
        "Ignoring leaks",
        "Adding more refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 emphasizes the need to recycle or recover refrigerants to prevent environmental damage, as venting them into the atmosphere is prohibited."
    },
    {
      "id": "l71-q4",
      "question": "What is the final step in the Systematic Troubleshooting Method?",
      "options": [
        "Isolating the fault",
        "Testing the system",
        "Gathering data",
        "Identifying symptoms"
      ],
      "correctAnswer": 1,
      "explanation": "Testing the system is the final step, ensuring that repairs have resolved the initial issue and that the system functions correctly without new problems."
    },
    {
      "id": "l71-q5",
      "question": "Why is it important to analyze data before repairing a system?",
      "options": [
        "To save time",
        "To isolate the fault accurately",
        "To skip unnecessary steps",
        "To ensure all tools are used"
      ],
      "correctAnswer": 1,
      "explanation": "Analyzing data is crucial for accurately isolating the fault, ensuring that the correct issue is addressed without unnecessary repairs."
    }
  ],
  "3c9f427e-001c-557e-b777-eb488fbcea8a": [
    {
      "id": "l72-q1",
      "question": "What must be done if a system with more than 50 pounds of refrigerant has a leak?",
      "options": [
        "Monitor the leak",
        "Repair the leak within 30 days",
        "Ignore the leak",
        "Add more refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "According to EPA 608 regulations, any system with a refrigerant charge of over 50 pounds must have leaks repaired within 30 days to minimize environmental impact."
    },
    {
      "id": "l72-q2",
      "question": "What is a common cause of compressor failure?",
      "options": [
        "Excessive cooling",
        "Low ambient temperature",
        "Overheating",
        "Too much airflow"
      ],
      "correctAnswer": 2,
      "explanation": "Compressor failures often result from overheating, which can be due to insufficient lubrication or high operating temperatures."
    },
    {
      "id": "l72-q3",
      "question": "Which component issue can lead to poor cooling performance?",
      "options": [
        "Clean filters",
        "Blocked ducts",
        "New thermostat",
        "Low refrigerant"
      ],
      "correctAnswer": 1,
      "explanation": "Blocked ducts restrict airflow, leading to poor cooling performance. Regular maintenance is key to preventing this issue."
    },
    {
      "id": "l72-q4",
      "question": "What should be checked first if an AC unit doesn't turn on?",
      "options": [
        "Thermostat settings",
        "Refrigerant level",
        "Filter condition",
        "Ductwork"
      ],
      "correctAnswer": 0,
      "explanation": "If an AC unit doesn't turn on, the thermostat settings should be checked first to ensure it is calling for cooling."
    },
    {
      "id": "l72-q5",
      "question": "How should electrical failures be addressed?",
      "options": [
        "By replacing refrigerant",
        "By checking ductwork",
        "By inspecting wiring and fuses",
        "By cleaning filters"
      ],
      "correctAnswer": 2,
      "explanation": "Electrical failures should be addressed by inspecting wiring and fuses, as these are common sources of such issues."
    }
  ],
  "7d0523bb-3662-5d4f-ba73-c7080059d8a2": [
    {
      "id": "l73-q1",
      "question": "What is a common sign of a cracked heat exchanger?",
      "options": [
        "Increased airflow",
        "Carbon monoxide leakage",
        "Reduced thermostat sensitivity",
        "Excessive cooling"
      ],
      "correctAnswer": 1,
      "explanation": "A cracked heat exchanger can lead to carbon monoxide leaking into the living space, which is a serious safety hazard. This concept was covered in today's lesson."
    },
    {
      "id": "l73-q2",
      "question": "How can a clogged filter affect a heating system?",
      "options": [
        "Improves energy efficiency",
        "Increases airflow",
        "Causes overheating",
        "Reduces noise"
      ],
      "correctAnswer": 2,
      "explanation": "Clogged filters restrict airflow, causing the system to overheat and potentially shut down, as discussed in the lesson."
    },
    {
      "id": "l73-q3",
      "question": "What should you check if a thermostat is not controlling the system correctly?",
      "options": [
        "Filter condition",
        "Heat exchanger cracks",
        "Thermostat calibration",
        "Pilot light"
      ],
      "correctAnswer": 2,
      "explanation": "If a thermostat isn't functioning properly, checking its calibration is essential to ensure accurate system control, as explained in the video."
    },
    {
      "id": "l73-q4",
      "question": "An ignition failure in a furnace is often due to:",
      "options": [
        "Thermostat miscalibration",
        "Dirty ignition components",
        "Clogged air filters",
        "Cracked heat exchanger"
      ],
      "correctAnswer": 1,
      "explanation": "Ignition failures can occur due to dirty components, which may prevent the burners from igniting, as mentioned in today's lesson."
    },
    {
      "id": "l73-q5",
      "question": "What regular maintenance can prevent heating system failures?",
      "options": [
        "Ignoring filter changes",
        "Checking wiring annually",
        "Replacing filters regularly",
        "Calibrating thermostat bi-annually"
      ],
      "correctAnswer": 2,
      "explanation": "Regularly replacing filters is a simple maintenance task that can prevent many common heating failures, emphasizing the importance of routine checks."
    }
  ],
  "d574fdc2-314c-5f22-9c84-1e4658a93bf5": [
    {
      "id": "l74-q1",
      "question": "What is the first step in troubleshooting a system that isn't cooling properly?",
      "options": [
        "Check refrigerant levels",
        "Check thermostat settings",
        "Inspect condenser coils",
        "Inspect wiring"
      ],
      "correctAnswer": 1,
      "explanation": "The first step is to check the thermostat settings to ensure it is set correctly. This is a simple check that can often resolve the issue without needing to inspect other components."
    },
    {
      "id": "l74-q2",
      "question": "Why is it important to repair refrigerant leaks according to EPA 608 standards?",
      "options": [
        "To increase cooling efficiency",
        "To prevent environmental harm",
        "To reduce noise levels",
        "To improve airflow"
      ],
      "correctAnswer": 1,
      "explanation": "Repairing refrigerant leaks is important to prevent the release of ozone-depleting substances into the environment, which is a key concern addressed in the EPA 608 standards."
    },
    {
      "id": "l74-q3",
      "question": "Which tool is used to locate refrigerant leaks?",
      "options": [
        "Multimeter",
        "Leak detector",
        "Thermometer",
        "Wire stripper"
      ],
      "correctAnswer": 1,
      "explanation": "An electronic leak detector is used to locate refrigerant leaks. This tool helps to identify leaks precisely, ensuring they can be repaired effectively."
    },
    {
      "id": "l74-q4",
      "question": "What should be done if condenser coils are found to be dirty?",
      "options": [
        "Ignore them",
        "Clean them",
        "Replace them",
        "Cover them"
      ],
      "correctAnswer": 1,
      "explanation": "Dirty condenser coils should be cleaned, as they can restrict airflow and reduce cooling efficiency. Cleaning them helps maintain optimal system performance."
    },
    {
      "id": "l74-q5",
      "question": "What is a common sign of electrical issues in an HVAC system?",
      "options": [
        "Unusual odors",
        "System not starting",
        "Noisy operation",
        "Low refrigerant levels"
      ],
      "correctAnswer": 1,
      "explanation": "A system not starting can indicate electrical issues, such as faulty wiring or loose connections, which should be inspected and corrected to ensure safe and effective operation."
    }
  ],
  "5d6a053f-0690-567a-93e3-2ca9642f04ac": [
    {
      "id": "l75-q1",
      "question": "What is a key reason for translating technical HVAC details into simple terms for customers?",
      "options": [
        "To confuse the customer",
        "To ensure customer satisfaction",
        "To avoid responsibility",
        "To use industry jargon"
      ],
      "correctAnswer": 1,
      "explanation": "Simplifying technical details helps ensure customer satisfaction by making them easily understandable, which is crucial for effective communication."
    },
    {
      "id": "l75-q2",
      "question": "Why is active listening important in customer communication?",
      "options": [
        "To ignore customer concerns",
        "To quickly finish the job",
        "To accurately diagnose issues",
        "To sell more services"
      ],
      "correctAnswer": 2,
      "explanation": "Active listening allows you to accurately diagnose issues by understanding customer concerns, leading to better service and satisfaction."
    },
    {
      "id": "l75-q3",
      "question": "What should you do if a part needs to be ordered for a repair?",
      "options": [
        "Ignore the delay",
        "Tell the customer it will be quick",
        "Set realistic expectations about timing",
        "Tell the customer to order it"
      ],
      "correctAnswer": 2,
      "explanation": "Setting realistic expectations about timing builds trust and ensures the customer is informed about potential delays."
    },
    {
      "id": "l75-q4",
      "question": "What should be included in the documentation provided to customers after service?",
      "options": [
        "Personal opinions",
        "Detailed service report",
        "Future repair predictions",
        "Unnecessary technical details"
      ],
      "correctAnswer": 1,
      "explanation": "A detailed service report includes parts replaced, services performed, and future recommendations, providing valuable information to customers."
    },
    {
      "id": "l75-q5",
      "question": "How does effective communication relate to EPA 608 guidelines?",
      "options": [
        "It ensures quick repairs",
        "It helps in environmental compliance",
        "It focuses on selling more services",
        "It is not related at all"
      ],
      "correctAnswer": 1,
      "explanation": "Effective communication includes explaining the environmental impact of refrigerants, which aligns with EPA 608 guidelines on responsible refrigerant handling."
    }
  ],
  "b1c254a5-4216-5700-a420-f9c114265fbd": [
    {
      "id": "l76-q1",
      "question": "What is the primary concern when recovering refrigerants according to the EPA?",
      "options": [
        "Cost efficiency",
        "Environmental protection",
        "System downtime",
        "Ease of use"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA focuses on environmental protection to prevent the release of harmful refrigerants into the atmosphere, which is why recovery practices are strictly regulated."
    },
    {
      "id": "l76-q2",
      "question": "Which of the following refrigerants has the highest Ozone Depletion Potential (ODP)?",
      "options": [
        "R-134a",
        "R-22",
        "R-410a",
        "R-123"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 has a higher ODP compared to others like R-134a and R-410a, which are designed to have lower environmental impact."
    },
    {
      "id": "l76-q3",
      "question": "What is the mandatory action if a system containing 60 pounds of refrigerant has a leak that exceeds the allowed rate?",
      "options": [
        "Nothing, it's optional",
        "Repair the leak within 30 days",
        "Report to EPA immediately",
        "Replace the entire system"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA mandates repairs of leaks in systems with more than 50 pounds of refrigerant if they exceed the allowed leak rate, to ensure compliance with environmental standards."
    },
    {
      "id": "l76-q4",
      "question": "Why is proper evacuation important in HVAC systems?",
      "options": [
        "To prevent noise",
        "To remove moisture and non-condensables",
        "To increase pressure",
        "To reduce energy consumption"
      ],
      "correctAnswer": 1,
      "explanation": "Proper evacuation removes moisture and non-condensables, which can cause inefficiencies and potential system failures, ensuring optimal performance."
    },
    {
      "id": "l76-q5",
      "question": "What is a key factor in selecting a refrigerant for a specific application?",
      "options": [
        "Color of refrigerant",
        "Global Warming Potential (GWP)",
        "Size of the container",
        "Brand name"
      ],
      "correctAnswer": 1,
      "explanation": "The Global Warming Potential (GWP) of a refrigerant is crucial for selecting environmentally friendly options, aligning with EPA regulations."
    }
  ],
  "ce416471-0243-53cb-99af-8f4cb883c9f5": [
    {
      "id": "l77-q1",
      "question": "What is the primary purpose of the EPA 608 certification?",
      "options": [
        "To certify welding skills",
        "To ensure safe handling of refrigerants",
        "To provide OSHA training",
        "To teach electrical wiring"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 certification focuses on the safe handling of refrigerants to prevent environmental harm and ensure technician safety."
    },
    {
      "id": "l77-q2",
      "question": "Which of the following is considered a hazardous material in the HVAC field?",
      "options": [
        "Copper tubing",
        "Refrigerants",
        "Aluminum sheets",
        "PVC piping"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerants are considered hazardous materials due to their potential environmental impact and health risks if not handled properly."
    },
    {
      "id": "l77-q3",
      "question": "What piece of equipment is essential for protecting your eyes while handling refrigerants?",
      "options": [
        "Hard hat",
        "Goggles",
        "Steel-toed boots",
        "Ear plugs"
      ],
      "correctAnswer": 1,
      "explanation": "Goggles are crucial for protecting your eyes from potential refrigerant splashes or leaks during HVAC work."
    },
    {
      "id": "l77-q4",
      "question": "Effective communication in HVAC safety primarily helps to:",
      "options": [
        "Increase sales",
        "Prevent workplace accidents",
        "Improve refrigerant efficiency",
        "Reduce noise levels"
      ],
      "correctAnswer": 1,
      "explanation": "Effective communication ensures that all team members are aware of safety protocols and potential hazards, reducing the risk of accidents."
    },
    {
      "id": "l77-q5",
      "question": "What immediate action is required for substantial leaks in HVAC systems according to the EPA?",
      "options": [
        "Document the leak",
        "Notify the client",
        "Repair immediately",
        "Increase refrigerant charge"
      ],
      "correctAnswer": 2,
      "explanation": "Immediate repair of substantial leaks is mandated by the EPA to minimize environmental impact and ensure system integrity."
    }
  ],
  "8677ede9-251e-5f3d-b7e6-677c1740bffd": [
    {
      "id": "l78-q1",
      "question": "What is the minimum weight an anchor point must support in a personal fall arrest system?",
      "options": [
        "2,000 pounds",
        "5,000 pounds",
        "3,500 pounds",
        "4,000 pounds"
      ],
      "correctAnswer": 1,
      "explanation": "The correct answer is 5,000 pounds, as specified by OSHA standards for anchor points in personal fall arrest systems. This ensures the anchor can withstand the force of a fall, which is critical for safety."
    },
    {
      "id": "l78-q2",
      "question": "How high must guardrails be to comply with safety standards?",
      "options": [
        "30 inches",
        "42 inches",
        "48 inches",
        "50 inches"
      ],
      "correctAnswer": 1,
      "explanation": "Guardrails must be 42 inches high, with a mid-rail at 21 inches, to provide an effective barrier against falls, as outlined in safety regulations."
    },
    {
      "id": "l78-q3",
      "question": "What is the correct angle ratio for ladder placement?",
      "options": [
        "3:1",
        "4:1",
        "5:1",
        "6:1"
      ],
      "correctAnswer": 1,
      "explanation": "The recommended angle for placing a ladder is a 4:1 ratio. This ensures stability and safety when climbing, reducing the risk of tipping over."
    },
    {
      "id": "l78-q4",
      "question": "How often should fall protection equipment be inspected?",
      "options": [
        "Monthly",
        "Before each use",
        "Weekly",
        "Annually"
      ],
      "correctAnswer": 1,
      "explanation": "Fall protection equipment should be inspected before each use to ensure there are no signs of wear or damage that could compromise safety during a fall."
    },
    {
      "id": "l78-q5",
      "question": "What is a crucial aspect of ladder safety?",
      "options": [
        "Climbing with tools in hand",
        "Maintaining three points of contact",
        "Using the top rung",
        "Leaning the ladder against gutters"
      ],
      "correctAnswer": 1,
      "explanation": "Maintaining three points of contact—two hands and a foot or two feet and a hand—ensures stability and reduces the risk of falling when using a ladder."
    }
  ],
  "90fadab8-d9ba-57d5-92e2-8ba2d8b7bb99": [
    {
      "id": "l79-q1",
      "question": "What is the primary purpose of Lockout/Tagout procedures?",
      "options": [
        "To improve machine efficiency",
        "To prevent unexpected energization",
        "To label equipment parts",
        "To reduce energy consumption"
      ],
      "correctAnswer": 1,
      "explanation": "Lockout/Tagout procedures are designed to prevent unexpected energization of machines, ensuring the safety of workers during maintenance."
    },
    {
      "id": "l79-q2",
      "question": "Which of the following is considered appropriate PPE for electrical safety?",
      "options": [
        "Non-insulated gloves",
        "Insulated gloves",
        "Cotton clothing",
        "Metal jewelry"
      ],
      "correctAnswer": 1,
      "explanation": "Insulated gloves are essential PPE to protect against electrical shocks while working on electrical components."
    },
    {
      "id": "l79-q3",
      "question": "What does a Ground Fault Circuit Interrupter (GFCI) do?",
      "options": [
        "Monitors and interrupts power surges",
        "Balances the electrical load",
        "Protects against electric shock",
        "Regulates voltage"
      ],
      "correctAnswer": 2,
      "explanation": "A GFCI protects against electric shock by interrupting the circuit if an imbalance is detected, especially in wet environments."
    },
    {
      "id": "l79-q4",
      "question": "Why is proper electrical grounding important?",
      "options": [
        "To increase voltage",
        "To prevent circuit overload",
        "To provide a safe path for current",
        "To enhance signal clarity"
      ],
      "correctAnswer": 2,
      "explanation": "Proper electrical grounding provides a safe path for electrical current, reducing the risk of electric shock."
    },
    {
      "id": "l79-q5",
      "question": "In which scenario is the use of a GFCI most critical?",
      "options": [
        "Dry indoor environments",
        "Outdoor locations",
        "Near water sources",
        "In air-conditioned spaces"
      ],
      "correctAnswer": 2,
      "explanation": "GFCIs are most critical near water sources to prevent electric shock due to the increased risk in wet or damp conditions."
    }
  ],
  "798b6baa-28aa-5a06-b981-c88312fa4b1d": [
    {
      "id": "l80-q1",
      "question": "What is the primary purpose of Safety Data Sheets (SDS) in HazCom?",
      "options": [
        "To provide chemical pricing",
        "To provide detailed information on chemical hazards",
        "To serve as a marketing tool",
        "To list shipping requirements"
      ],
      "correctAnswer": 1,
      "explanation": "SDS are critical for providing detailed information on the hazards of chemicals, instructions for safe use, and emergency procedures, which aligns with the EPA 608 focus on safety."
    },
    {
      "id": "l80-q2",
      "question": "Which of the following is NOT required on a chemical label under HazCom?",
      "options": [
        "Chemical name",
        "Hazard warnings",
        "Manufacturer's information",
        "Expiration date"
      ],
      "correctAnswer": 3,
      "explanation": "While chemical name, hazard warnings, and manufacturer information are required to ensure safety, expiration dates are not a standard requirement for HazCom labels."
    },
    {
      "id": "l80-q3",
      "question": "Why is employee training important in HazCom?",
      "options": [
        "To increase company profits",
        "To ensure employees can identify and handle hazards safely",
        "To meet customer service standards",
        "To reduce inventory costs"
      ],
      "correctAnswer": 1,
      "explanation": "Employee training is crucial for ensuring that workers can safely identify and handle chemical hazards, a key goal of HazCom and part of the EPA 608 requirements."
    },
    {
      "id": "l80-q4",
      "question": "What must be done if a new chemical is introduced into the workplace?",
      "options": [
        "Nothing, if employees are experienced",
        "Update the SDS and provide training",
        "Only update the labels",
        "Only inform the management"
      ],
      "correctAnswer": 1,
      "explanation": "Introducing a new chemical requires updating the SDS and providing training to ensure all employees are aware of the new hazards and how to safely manage them."
    },
    {
      "id": "l80-q5",
      "question": "What is the role of labels in HazCom?",
      "options": [
        "To provide decorative elements",
        "To indicate price changes",
        "To communicate essential hazard information",
        "To list competitive advantages"
      ],
      "correctAnswer": 2,
      "explanation": "Labels are crucial for communicating essential hazard information about chemicals, helping to prevent misuse and ensuring safety, a key component of HazCom."
    }
  ],
  "23576f29-5103-59f8-ae9e-05e0a8013aee": [
    {
      "id": "l81-q1",
      "question": "What type of respirator is typically recommended for HVAC technicians handling refrigerants?",
      "options": [
        "Dust mask",
        "Half-face or full-face respirator with appropriate filters",
        "Surgical mask",
        "Cloth mask"
      ],
      "correctAnswer": 1,
      "explanation": "A half-face or full-face respirator with appropriate filters is recommended because it provides necessary protection against inhaling refrigerant vapors, which simpler masks like dust or surgical masks cannot."
    },
    {
      "id": "l81-q2",
      "question": "Which material is commonly used for gloves when working with refrigerants?",
      "options": [
        "Latex",
        "Cotton",
        "Nitrile",
        "Leather"
      ],
      "correctAnswer": 2,
      "explanation": "Nitrile gloves are commonly used because they are chemical-resistant and provide adequate protection against refrigerants, unlike latex or cotton gloves."
    },
    {
      "id": "l81-q3",
      "question": "Why is it important to inspect your respirator before use?",
      "options": [
        "To ensure the filters are over-saturated",
        "To make sure it is the latest model",
        "To check for damage and ensure a proper fit",
        "To adjust the color"
      ],
      "correctAnswer": 2,
      "explanation": "Inspecting your respirator ensures there is no damage that could compromise protection and that it fits properly, both critical for effective use."
    },
    {
      "id": "l81-q4",
      "question": "What is the primary purpose of wearing safety goggles while handling refrigerants?",
      "options": [
        "To look professional",
        "To protect eyes from splashes and fumes",
        "To keep out dust",
        "To correct vision"
      ],
      "correctAnswer": 1,
      "explanation": "Safety goggles protect your eyes from chemical splashes and harmful fumes, which is crucial when working with refrigerants."
    },
    {
      "id": "l81-q5",
      "question": "Which PPE item is used to prevent skin exposure to chemicals?",
      "options": [
        "Hard hat",
        "Steel-toed boots",
        "Coveralls",
        "Ear plugs"
      ],
      "correctAnswer": 2,
      "explanation": "Coveralls are used to prevent skin exposure to chemicals, providing a barrier between the skin and potentially hazardous substances."
    }
  ],
  "58ff8848-0bcf-5a64-88b6-8c51dcd9057e": [
    {
      "id": "l82-q1",
      "question": "What is the primary concern when working in a confined space?",
      "options": [
        "Noise levels",
        "Air quality",
        "Lighting",
        "Temperature"
      ],
      "correctAnswer": 1,
      "explanation": "Air quality is the primary concern in confined spaces due to the risk of toxic gas buildup or oxygen deficiency, which is emphasized in EPA 608 guidelines."
    },
    {
      "id": "l82-q2",
      "question": "Which organization sets the training requirements for working in confined spaces?",
      "options": [
        "EPA",
        "OSHA",
        "NFPA",
        "ANSI"
      ],
      "correctAnswer": 1,
      "explanation": "OSHA sets the training requirements for working in confined spaces, ensuring workers are aware of the hazards and necessary safety protocols."
    },
    {
      "id": "l82-q3",
      "question": "What should be done before entering a confined space?",
      "options": [
        "Start the equipment",
        "Test the air quality",
        "Turn off lights",
        "Remove all tools"
      ],
      "correctAnswer": 1,
      "explanation": "Air quality testing is crucial before entering a confined space to ensure it is safe from hazardous gases, as per EPA 608 standards."
    },
    {
      "id": "l82-q4",
      "question": "Which hazard is commonly associated with excavations?",
      "options": [
        "Wind gusts",
        "Cave-ins",
        "High temperatures",
        "Heavy rainfall"
      ],
      "correctAnswer": 1,
      "explanation": "Cave-ins are a common hazard in excavations, requiring proper shoring and trenching practices to prevent accidents."
    },
    {
      "id": "l82-q5",
      "question": "How should refrigerant leaks be handled during excavations?",
      "options": [
        "Vented to the atmosphere",
        "Ignored if small",
        "Captured and reclaimed",
        "Buried underground"
      ],
      "correctAnswer": 2,
      "explanation": "Refrigerant leaks should be captured and reclaimed to comply with EPA standards, preventing environmental damage and maintaining safety."
    }
  ],
  "e46831ad-a473-5d6a-b189-ae287ce02f42": [
    {
      "id": "l83-q1",
      "question": "What is the first action to take in the event of a fire?",
      "options": [
        "Fight the fire",
        "Evacuate the area",
        "Call your supervisor",
        "Keep working"
      ],
      "correctAnswer": 1,
      "explanation": "In the event of a fire, the first action should always be to evacuate the area to ensure personal safety, as emphasized in the lesson."
    },
    {
      "id": "l83-q2",
      "question": "Which piece of equipment is essential for welding safety?",
      "options": [
        "Basic safety glasses",
        "Regular gloves",
        "Welding goggles",
        "Cloth apron"
      ],
      "correctAnswer": 2,
      "explanation": "Welding goggles are crucial for protecting eyes from harmful UV light during welding, as covered in the lesson."
    },
    {
      "id": "l83-q3",
      "question": "Why is ventilation important in an HVAC workspace?",
      "options": [
        "To keep the area cool",
        "To prevent gas buildup",
        "To dry wet surfaces",
        "For noise reduction"
      ],
      "correctAnswer": 1,
      "explanation": "Proper ventilation prevents the buildup of flammable gases, reducing fire risk, which was discussed as a key safety measure."
    },
    {
      "id": "l83-q4",
      "question": "What type of fire extinguisher should be used for chemical fires?",
      "options": [
        "Water-based",
        "Foam-based",
        "Dry chemical",
        "CO2"
      ],
      "correctAnswer": 3,
      "explanation": "Dry chemical extinguishers are suitable for chemical fires, providing effective suppression as mentioned in the lesson."
    },
    {
      "id": "l83-q5",
      "question": "What should you do if refrigerants mix with air?",
      "options": [
        "Ignore it",
        "Vent the area immediately",
        "Add more refrigerant",
        "Seal the container"
      ],
      "correctAnswer": 1,
      "explanation": "If refrigerants mix with air, immediate ventilation is necessary to prevent toxic or flammable conditions, as highlighted in the lesson."
    }
  ],
  "cacd86ff-f6f0-5919-918b-94ce7f37a621": [
    {
      "id": "l84-q1",
      "question": "What is the primary reason for using PPE when handling refrigerants?",
      "options": [
        "To look professional",
        "To protect against chemical exposure",
        "To keep tools clean",
        "To avoid refrigerant theft"
      ],
      "correctAnswer": 1,
      "explanation": "Proper PPE protects you from chemical exposure, which can occur when handling refrigerants. This is crucial for safety and is a common theme in both OSHA and EPA 608 guidelines."
    },
    {
      "id": "l84-q2",
      "question": "Why is proper ventilation important when working with refrigerants?",
      "options": [
        "To save energy",
        "To reduce noise",
        "To prevent gas buildup",
        "To maintain temperature"
      ],
      "correctAnswer": 2,
      "explanation": "Proper ventilation prevents the accumulation of harmful gases, which ensures a safe working environment. This is emphasized in both OSHA safety practices and EPA 608 regulations."
    },
    {
      "id": "l84-q3",
      "question": "What does EPA 608 emphasize about refrigerant disposal?",
      "options": [
        "Release into the atmosphere",
        "Proper storage until evaporation",
        "Recycling or recovery",
        "Mixing with other chemicals"
      ],
      "correctAnswer": 2,
      "explanation": "EPA 608 requires refrigerants to be recovered or recycled to prevent atmospheric release, which is harmful to the ozone layer."
    },
    {
      "id": "l84-q4",
      "question": "What should be your first response in case of a refrigerant leak?",
      "options": [
        "Panic",
        "Use a fire extinguisher",
        "Evacuate the area",
        "Ignore it"
      ],
      "correctAnswer": 2,
      "explanation": "Evacuating the area is the safest initial response to a refrigerant leak to prevent exposure. This aligns with both OSHA and EPA 608 emergency procedures."
    },
    {
      "id": "l84-q5",
      "question": "How does OSHA training complement EPA 608 certification?",
      "options": [
        "By focusing on customer satisfaction",
        "By emphasizing HVAC marketing strategies",
        "By ensuring safety and regulatory compliance",
        "By increasing sales skills"
      ],
      "correctAnswer": 2,
      "explanation": "OSHA training ensures safety and regulatory compliance, which complements the environmental safety focus of EPA 608 certification."
    }
  ],
  "93ae75c1-65e2-57cd-99a3-3a3f91cd5733": [
    {
      "id": "l85-q1",
      "question": "Which of the following is NOT a component of a First Aid kit?",
      "options": [
        "Adhesive bandages",
        "Tourniquet",
        "Refrigerant scale",
        "Antiseptic wipes"
      ],
      "correctAnswer": 2,
      "explanation": "A refrigerant scale is not part of a First Aid kit. It is used to measure the weight of refrigerant, not for medical emergencies."
    },
    {
      "id": "l85-q2",
      "question": "What is the primary purpose of an AED?",
      "options": [
        "Measure blood pressure",
        "Administer CPR",
        "Analyze heart rhythm and deliver a shock if needed",
        "Provide oxygen"
      ],
      "correctAnswer": 2,
      "explanation": "An AED analyzes the heart's rhythm and delivers a shock to restore a normal heartbeat, which is critical in cardiac emergencies."
    },
    {
      "id": "l85-q3",
      "question": "Why is First Aid training important for HVAC technicians?",
      "options": [
        "To diagnose refrigerant issues",
        "To ensure safety in emergency medical situations",
        "To improve energy efficiency",
        "To calibrate HVAC systems"
      ],
      "correctAnswer": 1,
      "explanation": "First Aid training is crucial for handling medical emergencies, ensuring that technicians can provide immediate care when accidents occur."
    },
    {
      "id": "l85-q4",
      "question": "In which situation would you NOT use CPR?",
      "options": [
        "Someone not breathing",
        "No heartbeat",
        "Skin burn",
        "Unconsciousness with no pulse"
      ],
      "correctAnswer": 2,
      "explanation": "CPR is not used for treating burns; it is used when someone is not breathing or has no heartbeat."
    },
    {
      "id": "l85-q5",
      "question": "How often should CPR and First Aid certifications be renewed?",
      "options": [
        "Every year",
        "Every two years",
        "Every five years",
        "Never, once certified"
      ],
      "correctAnswer": 1,
      "explanation": "CPR and First Aid certifications typically need to be renewed every two years to ensure skills are up-to-date."
    }
  ],
  "685318ed-cfd1-5381-b546-4cdeec132928": [
    {
      "id": "l86-q1",
      "question": "What should you do first if a coworker is exposed to refrigerant?",
      "options": [
        "Apply a warm compress",
        "Move them to fresh air",
        "Give them water",
        "Call for electrical services"
      ],
      "correctAnswer": 1,
      "explanation": "Refrigerant exposure can lead to serious respiratory issues. Moving the individual to fresh air helps mitigate the immediate effects and is a crucial first step."
    },
    {
      "id": "l86-q2",
      "question": "When dealing with an electrical shock victim, what is the first step?",
      "options": [
        "Perform CPR",
        "Switch off the power source",
        "Move the victim",
        "Call their emergency contact"
      ],
      "correctAnswer": 1,
      "explanation": "Switching off the power source is essential to prevent further injury to the victim and yourself."
    },
    {
      "id": "l86-q3",
      "question": "Which item is essential in a first aid kit for cuts?",
      "options": [
        "Antacid",
        "Bandage",
        "Inhaler",
        "Thermometer"
      ],
      "correctAnswer": 1,
      "explanation": "Bandages are essential for covering cuts and preventing infection, making them a critical component of any first aid kit."
    },
    {
      "id": "l86-q4",
      "question": "What is the primary purpose of PPE in the HVAC industry?",
      "options": [
        "To improve efficiency",
        "To ensure personal safety",
        "To reduce noise",
        "To enhance communication"
      ],
      "correctAnswer": 1,
      "explanation": "PPE is designed to protect you from injuries and hazards specific to the HVAC environment, ensuring your personal safety."
    },
    {
      "id": "l86-q5",
      "question": "What is a critical first step in administering CPR?",
      "options": [
        "Check for a pulse",
        "Clear the airway",
        "Perform chest compressions",
        "Call for backup"
      ],
      "correctAnswer": 1,
      "explanation": "Clearing the airway ensures that the victim can breathe effectively, which is a critical initial step in CPR."
    }
  ],
  "30d609ca-1605-57ab-8864-8d81fc9f5707": [
    {
      "id": "l87-q1",
      "question": "What is the primary function of a CPR valve in an HVAC system?",
      "options": [
        "To increase refrigerant pressure",
        "To regulate refrigerant flow",
        "To decrease refrigerant temperature",
        "To expel air from the system"
      ],
      "correctAnswer": 1,
      "explanation": "The CPR valve regulates refrigerant flow to prevent pressure spikes that could damage the compressor, a key concept in compressor protection."
    },
    {
      "id": "l87-q2",
      "question": "Why is it important to use the correct refrigerant in a system?",
      "options": [
        "To increase system noise",
        "To ensure system efficiency and prevent damage",
        "To decrease system size",
        "To simplify maintenance"
      ],
      "correctAnswer": 1,
      "explanation": "Using the correct refrigerant ensures the system operates efficiently and avoids potential damage to components like the compressor."
    },
    {
      "id": "l87-q3",
      "question": "What can happen if a compressor is not properly protected during refrigerant recovery?",
      "options": [
        "Reduced noise levels",
        "Increased energy efficiency",
        "Compressor overheating or damage",
        "Improved cooling performance"
      ],
      "correctAnswer": 2,
      "explanation": "Without proper protection, compressors can overheat or suffer mechanical damage during recovery due to pressure fluctuations."
    },
    {
      "id": "l87-q4",
      "question": "Which of these is NOT a function of a recovery machine?",
      "options": [
        "Extract refrigerant safely",
        "Increase system pressure",
        "Prevent refrigerant backflow",
        "Facilitate refrigerant disposal"
      ],
      "correctAnswer": 1,
      "explanation": "Recovery machines are used to extract refrigerant safely and do not increase system pressure; they help prevent pressure-related issues."
    },
    {
      "id": "l87-q5",
      "question": "What is the EPA 608 requirement regarding refrigerant handling?",
      "options": [
        "Allowing refrigerant to vent freely",
        "Using only certified recovery equipment",
        "Mixing different refrigerants",
        "Ignoring refrigerant leaks"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 certification mandates the use of certified recovery equipment to handle refrigerants safely and prevent environmental harm."
    }
  ],
  "b7d10a5e-6896-524f-847c-f6e9978b144b": [
    {
      "id": "l88-q1",
      "question": "What does the EPA 608 certification primarily ensure?",
      "options": [
        "Proper customer service skills",
        "Correct handling of refrigerants",
        "Efficient sales techniques",
        "Knowledge of HVAC installations"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 certification ensures that technicians are trained in the correct handling of refrigerants, minimizing environmental impact and complying with legal standards."
    },
    {
      "id": "l88-q2",
      "question": "Why is it important to explain the Clean Air Act to customers?",
      "options": [
        "To increase sales",
        "To build credibility and trust",
        "To avoid technical explanations",
        "To ensure quick service"
      ],
      "correctAnswer": 1,
      "explanation": "Explaining the Clean Air Act builds credibility and trust, as it shows the technician's commitment to legal standards and environmental protection."
    },
    {
      "id": "l88-q3",
      "question": "Which refrigerant has a high ozone depletion potential?",
      "options": [
        "R-410A",
        "R-22",
        "R-32",
        "R-134a"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is known for its high ozone depletion potential, making it crucial for technicians to handle it properly and inform customers about its environmental impact."
    },
    {
      "id": "l88-q4",
      "question": "What is a key benefit of using R-410A over R-22?",
      "options": [
        "Lower cost",
        "Higher efficiency",
        "Environmentally friendly",
        "Easier to install"
      ],
      "correctAnswer": 2,
      "explanation": "R-410A is considered more environmentally friendly than R-22, as it does not contribute to ozone depletion, aligning with EPA regulations."
    },
    {
      "id": "l88-q5",
      "question": "What practice should be highlighted to assure customers of safety?",
      "options": [
        "Quick installations",
        "Use of recovery machines",
        "Low service charges",
        "Frequent promotions"
      ],
      "correctAnswer": 1,
      "explanation": "Highlighting the use of proper recovery machines assures customers that safety protocols are followed, which is essential in handling refrigerants."
    }
  ],
  "a7af0014-c14c-53c3-84df-cd3c0398e017": [
    {
      "id": "l89-q1",
      "question": "What is the primary purpose of refrigerant recovery during servicing?",
      "options": [
        "To reuse refrigerant",
        "To minimize environmental impact",
        "To speed up the repair process",
        "To save costs"
      ],
      "correctAnswer": 1,
      "explanation": "The primary purpose of refrigerant recovery is to minimize the environmental impact by preventing the release of ozone-depleting substances, as required by the EPA."
    },
    {
      "id": "l89-q2",
      "question": "Which type of recovery method uses a machine to assist in refrigerant removal?",
      "options": [
        "Manual",
        "Passive",
        "Active",
        "Static"
      ],
      "correctAnswer": 2,
      "explanation": "Active recovery employs a recovery machine to aid in refrigerant removal, making it faster and often more efficient than passive recovery."
    },
    {
      "id": "l89-q3",
      "question": "What must you verify about your recovery equipment before use?",
      "options": [
        "It is lightweight",
        "It is compatible with the refrigerant",
        "It is brand new",
        "It is inexpensive"
      ],
      "correctAnswer": 1,
      "explanation": "It is critical to verify that your recovery equipment is compatible with the type of refrigerant you are handling to ensure safety and compliance."
    },
    {
      "id": "l89-q4",
      "question": "What documentation is necessary after refrigerant recovery?",
      "options": [
        "Equipment warranty",
        "Recovery machine manual",
        "Type and amount of refrigerant recovered",
        "Repair invoice"
      ],
      "correctAnswer": 2,
      "explanation": "You must document the type and amount of refrigerant recovered, as well as the equipment used, to comply with EPA regulations."
    },
    {
      "id": "l89-q5",
      "question": "Why is it important to use EPA-certified recovery equipment?",
      "options": [
        "To ensure it is affordable",
        "To ensure it meets safety and performance standards",
        "To ensure it is easy to use",
        "To ensure it is portable"
      ],
      "correctAnswer": 1,
      "explanation": "Using EPA-certified recovery equipment ensures it meets the necessary safety and performance standards, which is critical for legal compliance and environmental protection."
    }
  ],
  "15d76752-0478-53f3-85c5-31c201cc9b09": [
    {
      "id": "l90-q1",
      "question": "Which section of your resume should prominently feature your EPA 608 certification?",
      "options": [
        "Professional Summary",
        "Skills Section",
        "Experience Section",
        "Education Section"
      ],
      "correctAnswer": 0,
      "explanation": "Your EPA 608 certification should be mentioned in the Professional Summary to immediately highlight your qualifications to employers."
    },
    {
      "id": "l90-q2",
      "question": "Why is it important to list specific HVAC systems you've worked on?",
      "options": [
        "To fill space on your resume",
        "To show your hands-on experience",
        "To confuse the employer",
        "To increase your resume length"
      ],
      "correctAnswer": 1,
      "explanation": "Listing specific systems demonstrates your hands-on experience and expertise, making you more attractive to employers."
    },
    {
      "id": "l90-q3",
      "question": "What should you include in the skills section of your resume?",
      "options": [
        "Hobbies",
        "Technical skills related to HVAC",
        "Personal achievements",
        "References"
      ],
      "correctAnswer": 1,
      "explanation": "The skills section should focus on technical skills relevant to HVAC, like system maintenance and diagnostics, which are crucial for the job role."
    },
    {
      "id": "l90-q4",
      "question": "Which type of verbs should you use in your experience section?",
      "options": [
        "Passive verbs",
        "Action verbs",
        "Uncommon verbs",
        "Complex verbs"
      ],
      "correctAnswer": 1,
      "explanation": "Action verbs such as 'installed,' 'maintained,' or 'repaired' clearly convey your role and contributions."
    },
    {
      "id": "l90-q5",
      "question": "How can quantifying your achievements on your resume benefit you?",
      "options": [
        "It adds unnecessary detail",
        "It makes your contributions clearer",
        "It can confuse the employer",
        "It isn't beneficial"
      ],
      "correctAnswer": 1,
      "explanation": "Quantifying achievements makes your contributions measurable and impactful, helping employers understand your value."
    }
  ],
  "8c59f3f2-0ef4-5db2-a9fb-4ed571ae4d05": [
    {
      "id": "l91-q1",
      "question": "Which of the following is a key component of preparing for an HVAC job interview?",
      "options": [
        "Arriving late",
        "Researching the company",
        "Ignoring company values",
        "Focusing only on salary"
      ],
      "correctAnswer": 1,
      "explanation": "Researching the company demonstrates your interest and preparedness, similar to how you study for the EPA 608 exam to ensure you're ready for certification."
    },
    {
      "id": "l91-q2",
      "question": "Why is it important to communicate clearly during an interview?",
      "options": [
        "To use complex jargon",
        "To impress the interviewer",
        "To ensure understanding",
        "To shorten the interview"
      ],
      "correctAnswer": 2,
      "explanation": "Clear communication ensures your thoughts are understood, akin to how clear understanding of EPA regulations is crucial in HVAC work."
    },
    {
      "id": "l91-q3",
      "question": "How can problem-solving skills be demonstrated in an interview?",
      "options": [
        "By avoiding technical questions",
        "By discussing past experiences",
        "By focusing on salary negotiations",
        "By critiquing the company's methods"
      ],
      "correctAnswer": 1,
      "explanation": "Discussing past experiences, like troubleshooting HVAC systems in compliance with EPA 608, shows your ability to solve problems effectively."
    },
    {
      "id": "l91-q4",
      "question": "What type of questions should you ask in an interview?",
      "options": [
        "None",
        "Only about salary",
        "About EPA compliance",
        "Irrelevant questions"
      ],
      "correctAnswer": 2,
      "explanation": "Asking about EPA compliance shows your commitment to industry standards and ongoing professional development."
    },
    {
      "id": "l91-q5",
      "question": "What is a benefit of practicing answers to common interview questions?",
      "options": [
        "It wastes time",
        "It reduces anxiety",
        "It guarantees a job",
        "It is unnecessary"
      ],
      "correctAnswer": 1,
      "explanation": "Practicing answers helps reduce anxiety and ensures you can convey your skills confidently, like preparing for an EPA 608 exam."
    }
  ],
  "40da8479-1a3a-560c-bfce-16937d1b94db": [
    {
      "id": "l92-q1",
      "question": "Which of the following is a benefit of having an EPA 608 Universal certification when meeting potential employers?",
      "options": [
        "It shows you can handle all refrigerants safely.",
        "It guarantees a job offer.",
        "It is required for all HVAC positions.",
        "It only applies to commercial systems."
      ],
      "correctAnswer": 0,
      "explanation": "Having an EPA 608 Universal certification shows employers that you are qualified to work with all types of refrigerants, which is a valuable skill in the HVAC industry."
    },
    {
      "id": "l92-q2",
      "question": "When discussing your practical experience, what should you focus on?",
      "options": [
        "Theoretical knowledge only",
        "Specific projects and problem-solving skills",
        "Your hobbies",
        "Your favorite tools"
      ],
      "correctAnswer": 1,
      "explanation": "Focusing on specific projects and problem-solving skills demonstrates your ability to apply what you have learned in real-world situations, which is vital to employers."
    },
    {
      "id": "l92-q3",
      "question": "How can you tailor your introduction for a formal interview?",
      "options": [
        "Use technical jargon extensively",
        "Prepare a brief elevator pitch",
        "Avoid discussing certifications",
        "Focus solely on salary expectations"
      ],
      "correctAnswer": 1,
      "explanation": "Preparing a brief elevator pitch allows you to concisely present your skills, experience, and certifications, which is appropriate for a formal interview setting."
    },
    {
      "id": "l92-q4",
      "question": "Why is expressing a willingness to learn important in the HVAC industry?",
      "options": [
        "It shows you are not confident",
        "The industry is static",
        "Employers prefer static skills",
        "The industry evolves constantly"
      ],
      "correctAnswer": 3,
      "explanation": "The HVAC industry is constantly evolving, so showing a willingness to learn indicates to employers that you are committed to staying current with industry trends and advancements."
    },
    {
      "id": "l92-q5",
      "question": "What is an effective strategy when introducing yourself at a networking event?",
      "options": [
        "Ignore your certification",
        "Be conversational but focused",
        "Talk about unrelated topics",
        "Discuss personal opinions on industry politics"
      ],
      "correctAnswer": 1,
      "explanation": "Being conversational but focused helps you engage effectively while still highlighting your professional qualifications and certifications, which is crucial in networking environments."
    }
  ],
  "b9bceecd-9ea5-5665-90e7-d5e01b3f7c7c": [
    {
      "id": "l93-q1",
      "question": "Which of the following is a primary benefit of an HVAC internship?",
      "options": [
        "Higher wages",
        "Hands-on experience",
        "Less responsibility",
        "More vacation time"
      ],
      "correctAnswer": 1,
      "explanation": "Internships provide hands-on experience, allowing you to apply theoretical knowledge in a real-world setting. This practical experience is invaluable and complements your EPA 608 exam preparation."
    },
    {
      "id": "l93-q2",
      "question": "During an internship, what is a key focus to prepare for the EPA 608 exam?",
      "options": [
        "Learning advanced HVAC design",
        "Understanding refrigerant recovery",
        "Managing a team",
        "Scheduling appointments"
      ],
      "correctAnswer": 1,
      "explanation": "Understanding refrigerant recovery is crucial as it is a major component of the EPA 608 exam and reflects compliance with environmental regulations."
    },
    {
      "id": "l93-q3",
      "question": "What is an effective way to build a professional network during an internship?",
      "options": [
        "Completing tasks alone",
        "Ignoring feedback",
        "Engaging with mentors",
        "Avoiding team meetings"
      ],
      "correctAnswer": 2,
      "explanation": "Engaging with mentors and other professionals provides mentorship, industry insights, and guidance, which can be beneficial for both your career and EPA 608 exam preparation."
    },
    {
      "id": "l93-q4",
      "question": "Why is it important to follow safety protocols during an internship?",
      "options": [
        "To impress your boss",
        "To ensure speed",
        "To reduce costs",
        "To protect safety and comply with EPA standards"
      ],
      "correctAnswer": 3,
      "explanation": "Following safety protocols protects your health and safety and ensures compliance with EPA standards, a crucial component of the EPA 608 certification."
    },
    {
      "id": "l93-q5",
      "question": "How does asking questions during an internship benefit you?",
      "options": [
        "Shows weakness",
        "Wastes time",
        "Prevents mistakes",
        "Demonstrates engagement and enhances learning"
      ],
      "correctAnswer": 3,
      "explanation": "Asking questions shows engagement and a willingness to learn, helping reinforce your understanding of key concepts that are relevant to the EPA 608 exam."
    }
  ],
  "ec1cbfea-55f5-5083-9a28-8d59248b676a": [
    {
      "id": "l94-q1",
      "question": "What is the purpose of the EPA 608 certification?",
      "options": [
        "To sell HVAC equipment",
        "To handle refrigerants legally",
        "To improve energy efficiency",
        "To reduce energy bills"
      ],
      "correctAnswer": 1,
      "explanation": "The EPA 608 certification is required to handle and purchase refrigerants legally. It ensures that technicians understand and comply with environmental regulations."
    },
    {
      "id": "l94-q2",
      "question": "Which type of equipment is covered under Type II certification?",
      "options": [
        "Low-pressure appliances",
        "Small appliances",
        "High-pressure appliances",
        "All appliances"
      ],
      "correctAnswer": 2,
      "explanation": "Type II certification focuses on high-pressure appliances, such as split systems and commercial refrigeration equipment."
    },
    {
      "id": "l94-q3",
      "question": "Why is the Montreal Protocol significant in the HVAC industry?",
      "options": [
        "It regulates energy efficiency",
        "It sets safety standards",
        "It phases out ozone-depleting substances",
        "It mandates technician certification"
      ],
      "correctAnswer": 2,
      "explanation": "The Montreal Protocol is an international treaty that aims to phase out substances that deplete the ozone layer, including certain refrigerants."
    },
    {
      "id": "l94-q4",
      "question": "What is a key responsibility of an EPA 608 certified technician?",
      "options": [
        "Selling refrigerants",
        "Installing HVAC systems",
        "Preventing refrigerant emissions",
        "Designing HVAC systems"
      ],
      "correctAnswer": 2,
      "explanation": "Certified technicians must ensure proper handling techniques to prevent refrigerant emissions, protecting the environment and complying with regulations."
    },
    {
      "id": "l94-q5",
      "question": "Which practice is NOT recommended for refrigerant recovery?",
      "options": [
        "Using a vacuum pump",
        "Ventilating refrigerants to the atmosphere",
        "Using recovery equipment",
        "Following EPA guidelines"
      ],
      "correctAnswer": 1,
      "explanation": "Ventilating refrigerants to the atmosphere is illegal and against EPA guidelines. Proper recovery equipment must be used to comply with environmental regulations."
    }
  ],
  "47c63c61-007f-5790-bc89-d390de683635": [
    {
      "id": "l95-q1",
      "question": "Which refrigerant is considered an ozone-depleting substance?",
      "options": [
        "R-134a",
        "R-22",
        "R-410A",
        "R-1234yf"
      ],
      "correctAnswer": 1,
      "explanation": "R-22 is a hydrochlorofluorocarbon (HCFC) and is an ozone-depleting substance, which is why it is being phased out. Understanding this is crucial for compliance with environmental regulations."
    },
    {
      "id": "l95-q2",
      "question": "What is one key component of safe refrigerant handling?",
      "options": [
        "Venting refrigerants",
        "Using recovery equipment",
        "Mixing refrigerants",
        "Ignoring leaks"
      ],
      "correctAnswer": 1,
      "explanation": "Using recovery equipment is essential for safe refrigerant handling to prevent the release of harmful substances into the atmosphere, as emphasized in the EPA 608 guidelines."
    },
    {
      "id": "l95-q3",
      "question": "Why is effective communication important in the HVAC field?",
      "options": [
        "It reduces repair time",
        "It helps in upselling services",
        "It ensures client satisfaction and safety",
        "It is not necessary"
      ],
      "correctAnswer": 2,
      "explanation": "Effective communication ensures that clients understand the work being done and feel safe and satisfied with the services provided, which is important for business success."
    },
    {
      "id": "l95-q4",
      "question": "What is the benefit of continuing education in HVAC?",
      "options": [
        "Reduces work hours",
        "Keeps skills up-to-date",
        "Increases equipment costs",
        "Decreases job opportunities"
      ],
      "correctAnswer": 1,
      "explanation": "Continuing education keeps your skills up-to-date with the latest industry standards and technologies, ensuring you remain competitive and knowledgeable in the field."
    },
    {
      "id": "l95-q5",
      "question": "What is a critical reason to stay compliant with EPA 608 certification?",
      "options": [
        "To avoid learning new skills",
        "To reduce equipment costs",
        "To ensure legal compliance and environmental protection",
        "To work less hours"
      ],
      "correctAnswer": 2,
      "explanation": "Staying compliant with EPA 608 certification ensures you are legally allowed to handle refrigerants and helps protect the environment by following regulations."
    }
  ]
};
