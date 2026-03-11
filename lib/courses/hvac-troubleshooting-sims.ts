// lib/courses/hvac-troubleshooting-sims.ts
// 10 interactive troubleshooting simulations for the HVAC course.
// Each sim presents a scenario, symptom set, and branching diagnostic steps.

export interface SimStep {
  id: string;
  prompt: string;
  options: { label: string; next: string; correct?: boolean }[];
  feedback?: string;
}

export interface TroubleshootingSim {
  id: string;
  title: string;
  system: string;
  complaint: string;
  initialData: string[];
  steps: Record<string, SimStep>;
  entryStep: string;
  passingStep: string;
}

export const HVAC_TROUBLESHOOTING_SIMS: TroubleshootingSim[] = [
  {
    id: 'sim-01',
    title: 'No Cooling — Residential Split System',
    system: 'R-410A split system, 3-ton, TXV metering',
    complaint: 'Homeowner says the AC runs but the house will not cool down.',
    initialData: [
      'Thermostat set to 72°F, indoor temp 82°F',
      'Outdoor unit running — compressor and fan both audible',
      'Supply registers blowing air but it feels warm',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'What is your first diagnostic action?',
        options: [
          { label: 'Check refrigerant charge immediately', next: 's1-wrong' },
          { label: 'Measure supply and return air temperatures', next: 's2', correct: true },
          { label: 'Replace the thermostat', next: 's1-wrong' },
          { label: 'Check the condenser coil', next: 's1-partial' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'Jumping to refrigerant charge without baseline data wastes time. What should you measure first?',
        feedback: 'Always gather baseline operating data before opening the refrigerant circuit.',
        options: [{ label: 'Go back and measure temperatures', next: 's2', correct: true }],
      },
      's1-partial': {
        id: 's1-partial',
        prompt: 'The condenser coil looks clean. You still need baseline data. What next?',
        options: [{ label: 'Measure supply and return air temperatures', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'Return air: 78°F. Supply air: 72°F. Temperature split is 6°F (target 14–22°F). What does this tell you?',
        options: [
          { label: 'System is working normally', next: 's2-wrong' },
          { label: 'Low heat transfer — check airflow and refrigerant charge', next: 's3', correct: true },
          { label: 'Thermostat is miscalibrated', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'A 6°F split is well below the 14–22°F target. The system is not transferring heat properly.',
        feedback: 'Low temperature split = low airflow or low refrigerant charge.',
        options: [{ label: 'Check airflow and refrigerant charge', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'You check the filter — it is severely clogged. Static pressure reads 0.9 in. w.c. (rated 0.5). What do you do?',
        options: [
          { label: 'Add refrigerant — low charge is the problem', next: 's3-wrong' },
          { label: 'Replace the filter and recheck temperature split', next: 's4', correct: true },
          { label: 'Replace the blower motor', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'High static pressure and a clogged filter point to airflow restriction — not refrigerant charge. Fix the root cause first.',
        feedback: 'Never add refrigerant when airflow is restricted — you will overcharge the system.',
        options: [{ label: 'Replace the filter and recheck', next: 's4', correct: true }],
      },
      s4: {
        id: 's4',
        prompt: 'After replacing the filter, static pressure drops to 0.45 in. w.c. Temperature split is now 18°F. What do you do?',
        options: [
          { label: 'Verify the repair and document — system is operating correctly', next: 'pass', correct: true },
          { label: 'Add refrigerant anyway', next: 's4-wrong' },
          { label: 'Replace the TXV', next: 's4-wrong' },
        ],
      },
      's4-wrong': {
        id: 's4-wrong',
        prompt: 'The system is now operating within spec. No further repairs are needed.',
        feedback: 'When operating parameters are within spec after a repair, verify and document — do not add unnecessary parts.',
        options: [{ label: 'Verify and document the repair', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct diagnosis: severely clogged filter caused restricted airflow and low temperature split. Replacing the filter restored normal operation.',
        feedback: 'Root cause: clogged filter → high static pressure → low airflow → poor heat transfer.',
        options: [],
      },
    },
  },

  {
    id: 'sim-02',
    title: 'Compressor Hums But Will Not Start',
    system: 'R-410A split system, 2-ton',
    complaint: 'Outdoor unit hums loudly but the compressor does not start. Condenser fan runs normally.',
    initialData: [
      'Thermostat calling for cooling',
      'Contactor is pulled in (24V at coil)',
      'Condenser fan running at normal speed',
      'Compressor hums for 3–5 seconds then trips on overload',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'The contactor is closed and the fan runs. The compressor hums but trips. What is the most likely cause?',
        options: [
          { label: 'Failed contactor', next: 's1-wrong' },
          { label: 'Failed run/start capacitor', next: 's2', correct: true },
          { label: 'Low refrigerant charge', next: 's1-wrong' },
          { label: 'Bad thermostat', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'The contactor is confirmed closed (fan runs). Low charge would not cause humming. A humming motor that cannot start points to the capacitor.',
        feedback: 'Humming + trips on overload = motor trying but cannot turn = capacitor failure.',
        options: [{ label: 'Check the capacitor', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'Before testing the capacitor, what must you do?',
        options: [
          { label: 'Test it live with the system running', next: 's2-wrong' },
          { label: 'Discharge it with a 10kΩ resistor after LOTO', next: 's3', correct: true },
          { label: 'Just replace it without testing', next: 's2-partial' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'Testing a live capacitor without discharge is dangerous — it can hold a lethal charge even after power is removed.',
        feedback: 'Always discharge capacitors before handling. Use a 10kΩ, 5W resistor across the terminals.',
        options: [{ label: 'Discharge after LOTO, then test', next: 's3', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: 'Replacing without testing is acceptable in the field but wastes parts if the capacitor is good. What is the correct test?',
        options: [{ label: 'Discharge after LOTO, measure capacitance in microfarads', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'After LOTO and discharge, you measure the dual-run capacitor: HERM reads 28 µF (rated 45 µF), FAN reads 7.5 µF (rated 7.5 µF). What do you do?',
        options: [
          { label: 'Replace the entire dual-run capacitor', next: 'pass', correct: true },
          { label: 'Replace only the FAN section', next: 's3-wrong' },
          { label: 'The capacitor is fine — look elsewhere', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'The HERM section reads 28 µF vs. rated 45 µF — that is 38% low, well outside the ±6% tolerance. The dual-run capacitor must be replaced as a unit.',
        feedback: 'Dual-run capacitors are replaced as a complete unit. A weak HERM section causes the compressor to draw excess current and trip.',
        options: [{ label: 'Replace the dual-run capacitor', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Replacing the dual-run capacitor restored normal compressor starting. Root cause: weak HERM capacitor section caused insufficient starting torque.',
        feedback: 'Weak run capacitor → insufficient phase shift → motor cannot develop starting torque → hums and trips on thermal overload.',
        options: [],
      },
    },
  },

  {
    id: 'sim-03',
    title: 'Gas Furnace — Ignites Then Shuts Off',
    system: 'Natural gas 80% AFUE furnace',
    complaint: 'Furnace ignites but shuts off after 3–4 seconds. Repeats 3 times then locks out.',
    initialData: [
      'Thermostat calling for heat',
      'Inducer starts normally',
      'Hot surface igniter glows and gas ignites',
      'Flame visible for 3–4 seconds then gas valve closes',
      'Control board fault code: 3 flashes = flame sense fault',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'The fault code says flame sense fault. The flame is visible. What is the most likely cause?',
        options: [
          { label: 'Failed gas valve', next: 's1-wrong' },
          { label: 'Dirty or failed flame sensor', next: 's2', correct: true },
          { label: 'Cracked heat exchanger', next: 's1-wrong' },
          { label: 'Failed igniter', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'The igniter works (flame is visible) and the gas valve opens (flame appears). The board sees a flame sense fault — the sensor is not proving the flame.',
        feedback: 'Flame sense fault with visible flame = dirty or failed flame sensor. The igniter and gas valve are working.',
        options: [{ label: 'Check the flame sensor', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You locate the flame sensor — a metal rod in the burner flame path. What do you check first?',
        options: [
          { label: 'Replace it immediately', next: 's2-partial' },
          { label: 'Inspect for oxide coating and measure microamp signal', next: 's3', correct: true },
          { label: 'Check gas pressure', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'Gas pressure is not the issue — the flame ignites normally. The sensor is not proving the flame.',
        options: [{ label: 'Inspect the flame sensor', next: 's3', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: 'Replacing without diagnosis is acceptable but costly. The sensor has a white oxide coating — cleaning it may restore function.',
        options: [{ label: 'Clean with fine steel wool and retest', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'The sensor has a heavy white oxide coating. You clean it with fine steel wool. After reinstalling, the furnace runs through a full cycle. What do you do next?',
        options: [
          { label: 'Verify 2–3 complete heat cycles and document', next: 'pass', correct: true },
          { label: 'Replace the control board anyway', next: 's3-wrong' },
          { label: 'Leave immediately — it is fixed', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'Always verify the repair through multiple cycles before leaving. Document the fault code, cause, and repair.',
        options: [{ label: 'Verify 2–3 cycles and document', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Oxide buildup on the flame sensor prevented it from passing sufficient microamp current to prove the flame. Cleaning restored normal operation.',
        feedback: 'Flame sensor oxide coating is the most common cause of flame sense faults. Clean with fine steel wool — never sandpaper.',
        options: [],
      },
    },
  },

  {
    id: 'sim-04',
    title: 'Heat Pump — No Heating in Winter',
    system: 'R-410A heat pump, 3-ton, O-type wiring',
    complaint: 'Heat pump runs in winter but blows cold air. Auxiliary heat works.',
    initialData: [
      'Outdoor temp: 28°F',
      'Thermostat set to heat, 68°F setpoint',
      'Compressor and outdoor fan running',
      'Indoor air feels cold from supply registers',
      'Auxiliary heat strips work when Emergency Heat selected',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'The compressor runs but blows cold air in heat mode. Aux heat works. What is the most likely cause?',
        options: [
          { label: 'Low refrigerant charge', next: 's1-partial' },
          { label: 'Reversing valve stuck in cooling position or O-terminal wiring issue', next: 's2', correct: true },
          { label: 'Failed compressor', next: 's1-wrong' },
          { label: 'Dirty air filter', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'The compressor is running (audible). A dirty filter would not cause cold air in heat mode. The system is running in cooling mode when it should be heating.',
        options: [{ label: 'Check the reversing valve and O-terminal', next: 's2', correct: true }],
      },
      's1-partial': {
        id: 's1-partial',
        prompt: 'Low charge is possible but would not cause the system to blow cold air — it would just reduce heating capacity. The system appears to be in cooling mode.',
        options: [{ label: 'Check the reversing valve and O-terminal', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You check the thermostat O-terminal. In heat mode, O should be de-energized (O-type system). You measure 24V at O in heat mode. What does this mean?',
        options: [
          { label: 'Normal — O is always energized', next: 's2-wrong' },
          { label: 'The thermostat is energizing O in heat mode — it should not be', next: 's3', correct: true },
          { label: 'The reversing valve solenoid is failed open', next: 's2-partial' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'On O-type systems, O is energized in COOLING and de-energized in HEATING. 24V at O in heat mode means the thermostat is commanding cooling.',
        options: [{ label: 'The thermostat is misconfigured or failed', next: 's3', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: 'Possible, but first confirm the thermostat is not sending the wrong signal. 24V at O in heat mode points to the thermostat.',
        options: [{ label: 'Check thermostat O/B configuration', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'You check the thermostat settings. The O/B reversing valve setting is configured as "B" (energize in heating) instead of "O" (energize in cooling). What do you do?',
        options: [
          { label: 'Replace the thermostat', next: 's3-wrong' },
          { label: 'Change the O/B setting to "O" and verify heating operation', next: 'pass', correct: true },
          { label: 'Replace the reversing valve', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'The thermostat is misconfigured, not failed. Changing the O/B setting is the correct fix — no parts needed.',
        options: [{ label: 'Change O/B setting to "O" and verify', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. The thermostat O/B setting was configured for a B-type system (Rheem/Ruud) instead of O-type. Correcting the setting restored normal heating.',
        feedback: 'O-type: reversing valve energized in cooling. B-type: energized in heating. Always verify thermostat configuration matches the equipment.',
        options: [],
      },
    },
  },

  {
    id: 'sim-05',
    title: 'High Head Pressure — Outdoor Unit',
    system: 'R-410A split system, 4-ton',
    complaint: 'System runs but trips on high-pressure cutout after 20–30 minutes.',
    initialData: [
      'Outdoor temp: 95°F',
      'High-pressure cutout trips at 650 psig',
      'Suction pressure: 120 psig (normal for conditions)',
      'Subcooling: 22°F (target 10–15°F)',
      'Compressor amperage: 18A (RLA 16A)',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'High head pressure, high subcooling, high amperage. Suction is normal. What is the most likely cause?',
        options: [
          { label: 'Undercharge', next: 's1-wrong' },
          { label: 'Overcharge or dirty/restricted condenser', next: 's2', correct: true },
          { label: 'Failed TXV', next: 's1-wrong' },
          { label: 'Low indoor airflow', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'Undercharge causes LOW head pressure and LOW subcooling. High head + high subcooling + normal suction = overcharge or condenser problem.',
        options: [{ label: 'Check for overcharge or condenser restriction', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You inspect the condenser coil. The fins are heavily clogged with cottonwood seeds and debris. What do you do?',
        options: [
          { label: 'Recover refrigerant to reduce the overcharge', next: 's2-wrong' },
          { label: 'Clean the condenser coil and recheck pressures', next: 's3', correct: true },
          { label: 'Replace the condenser fan motor', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'The condenser coil is clogged — that is the root cause of high head pressure. Fix the restriction before adjusting refrigerant charge.',
        feedback: 'Never recover refrigerant to compensate for a dirty condenser. Clean the coil first, then recheck.',
        options: [{ label: 'Clean the condenser coil', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'After cleaning the coil, head pressure drops to 410 psig and subcooling is 12°F. Amperage is 15.5A. What do you do?',
        options: [
          { label: 'Add refrigerant — subcooling could be higher', next: 's3-wrong' },
          { label: 'System is within spec — verify operation and document', next: 'pass', correct: true },
          { label: 'Replace the high-pressure cutout switch', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: '12°F subcooling is within the 10–15°F target. The system is operating correctly after cleaning. No refrigerant adjustment needed.',
        options: [{ label: 'Verify operation and document', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Clogged condenser coil restricted airflow, reducing heat rejection and raising head pressure. Cleaning restored normal operation.',
        feedback: 'Dirty condenser → reduced heat transfer → high head pressure → high subcooling → compressor overload → HPC trip.',
        options: [],
      },
    },
  },
];

  {
    id: 'sim-06',
    title: 'Frozen Evaporator Coil',
    system: 'R-410A split system, 2-ton, fixed orifice',
    complaint: 'No cooling. Ice visible on the refrigerant lines at the air handler.',
    initialData: [
      'Ice on suction line at air handler',
      'Supply air barely moving from registers',
      'Suction pressure: 48 psig (saturation ~28°F)',
      'Superheat: 4°F',
      'System has been running for 6+ hours',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'Ice on the coil, very low suction pressure, low superheat, barely any airflow. What is the first action?',
        options: [
          { label: 'Add refrigerant immediately', next: 's1-wrong' },
          { label: 'Turn the system to fan-only to thaw the coil, then find the root cause', next: 's2', correct: true },
          { label: 'Replace the metering device', next: 's1-wrong' },
          { label: 'Check refrigerant charge with the coil frozen', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'You cannot accurately diagnose a frozen system. The coil must be thawed first. Adding refrigerant to a frozen system is dangerous.',
        feedback: 'Always thaw a frozen coil before diagnosis. Run fan-only for 30–60 minutes.',
        options: [{ label: 'Thaw the coil first', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'After 45 minutes on fan-only, the coil is thawed. You check the filter — it is completely blocked. Static pressure is 1.1 in. w.c. What do you do?',
        options: [
          { label: 'Check refrigerant charge', next: 's2-wrong' },
          { label: 'Replace the filter and recheck operating pressures', next: 's3', correct: true },
          { label: 'Replace the blower motor', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'A completely blocked filter is the obvious root cause of low airflow. Fix the airflow restriction before checking charge.',
        options: [{ label: 'Replace the filter and recheck', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'After replacing the filter, static pressure is 0.48 in. w.c. Suction pressure: 118 psig. Superheat: 9°F. Temperature split: 19°F. What do you do?',
        options: [
          { label: 'Add refrigerant — superheat could be higher', next: 's3-wrong' },
          { label: 'System is within spec — verify and document, advise customer on filter maintenance', next: 'pass', correct: true },
          { label: 'Replace the metering device', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'All parameters are within spec. The root cause was a blocked filter causing low airflow and coil freeze. No refrigerant adjustment needed.',
        options: [{ label: 'Verify, document, and advise on filter maintenance', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Blocked filter → low airflow → coil temperature below 32°F → freeze. Replacing the filter restored normal operation.',
        feedback: 'Frozen coil root causes: (1) low airflow — dirty filter, closed registers, failed blower; (2) low refrigerant charge. Always check airflow first.',
        options: [],
      },
    },
  },

  {
    id: 'sim-07',
    title: 'Refrigerant Leak — Low Charge Diagnosis',
    system: 'R-410A split system, 3-ton, TXV',
    complaint: 'System runs but cooling is inadequate. Customer says it has been getting worse over the summer.',
    initialData: [
      'Suction pressure: 95 psig (saturation ~42°F)',
      'Head pressure: 280 psig (saturation ~108°F)',
      'Superheat: 18°F (target 8–12°F for TXV)',
      'Subcooling: 4°F (target 10–15°F)',
      'Compressor amperage: 11A (RLA 14A)',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'Low suction, low head, high superheat, low subcooling, low amperage. What does this indicate?',
        options: [
          { label: 'Overcharge', next: 's1-wrong' },
          { label: 'Undercharge — low refrigerant', next: 's2', correct: true },
          { label: 'Dirty condenser', next: 's1-wrong' },
          { label: 'Failed TXV', next: 's1-partial' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'Overcharge causes HIGH head and HIGH subcooling. Dirty condenser causes HIGH head. All pressures are low — this is undercharge.',
        options: [{ label: 'Diagnose as undercharge', next: 's2', correct: true }],
      },
      's1-partial': {
        id: 's1-partial',
        prompt: 'A failed TXV (stuck closed) would cause very low suction and very high superheat. These readings are consistent with undercharge — the TXV is likely responding correctly to low charge.',
        options: [{ label: 'Diagnose as undercharge first', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'Before adding refrigerant, what must you do?',
        options: [
          { label: 'Add refrigerant immediately to restore charge', next: 's2-wrong' },
          { label: 'Find and repair the leak first', next: 's3', correct: true },
          { label: 'Replace the TXV', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'Adding refrigerant to a leaking system is a violation of EPA Section 608 and wastes refrigerant. Find and fix the leak first.',
        feedback: 'EPA requires leak repair before recharging systems with 50+ lbs. Even smaller systems should be repaired — not just topped off.',
        options: [{ label: 'Find and repair the leak', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'You use an electronic leak detector and find a leak at a flare fitting on the liquid line. What do you do?',
        options: [
          { label: 'Tighten the flare fitting and recharge', next: 's3-partial' },
          { label: 'Recover refrigerant, repair the flare, pressure test with nitrogen, evacuate, then recharge', next: 'pass', correct: true },
          { label: 'Add refrigerant and monitor', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'Adding refrigerant without repairing the leak is an EPA violation. The leak must be repaired first.',
        options: [{ label: 'Recover, repair, test, evacuate, recharge', next: 'pass', correct: true }],
      },
      's3-partial': {
        id: 's3-partial',
        prompt: 'Tightening without recovery risks venting refrigerant. The correct procedure is to recover first, then repair, test, evacuate, and recharge.',
        options: [{ label: 'Recover, repair, test, evacuate, recharge', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Low charge from a leaking flare fitting. Proper procedure: recover → repair → nitrogen pressure test → evacuate to 500 microns → recharge by subcooling.',
        feedback: 'Never add refrigerant to a leaking system. Always recover, repair, test, evacuate, and recharge.',
        options: [],
      },
    },
  },

  {
    id: 'sim-08',
    title: 'Furnace Short Cycling',
    system: 'Natural gas 96% AFUE two-stage furnace',
    complaint: 'Furnace turns on and off every 3–4 minutes. House never reaches setpoint.',
    initialData: [
      'Thermostat calling for heat continuously',
      'Furnace starts, runs 3–4 minutes, shuts off',
      'Control board fault code: 4 flashes = high limit open',
      'Filter was replaced last month',
      'Supply air temperature: 145°F (limit opens at 150°F)',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'High limit fault, supply air near the limit temperature, filter is clean. What do you check next?',
        options: [
          { label: 'Replace the high limit switch', next: 's1-wrong' },
          { label: 'Check for other airflow restrictions — registers, blower, duct system', next: 's2', correct: true },
          { label: 'Check gas pressure', next: 's1-wrong' },
          { label: 'Replace the heat exchanger', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'The high limit is doing its job — the heat exchanger is actually overheating. Replacing the limit without fixing the cause will result in a cracked heat exchanger.',
        feedback: 'Never replace a high limit without finding why it is tripping. The limit is a symptom, not the cause.',
        options: [{ label: 'Find the airflow restriction', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You check the supply registers — 4 of 12 are closed. You also measure static pressure: 0.85 in. w.c. (rated 0.5). What do you do?',
        options: [
          { label: 'Open the closed registers and recheck', next: 's3', correct: true },
          { label: 'Increase blower speed to compensate', next: 's2-partial' },
          { label: 'Replace the blower motor', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'The blower motor is not the problem — closed registers are restricting airflow. Fix the root cause.',
        options: [{ label: 'Open the closed registers', next: 's3', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: 'Increasing blower speed may help but does not fix the root cause. Open the registers first.',
        options: [{ label: 'Open the closed registers and recheck', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'After opening all registers, static pressure drops to 0.46 in. w.c. Supply air temperature stabilizes at 128°F. The furnace runs through a full cycle. What do you do?',
        options: [
          { label: 'Replace the high limit switch anyway', next: 's3-wrong' },
          { label: 'Verify multiple complete cycles, document, and advise customer not to close registers', next: 'pass', correct: true },
          { label: 'Check refrigerant charge', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'The system is operating correctly. The high limit switch is functioning properly — it was protecting the heat exchanger from overheating.',
        options: [{ label: 'Verify cycles, document, and advise customer', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Closed supply registers restricted airflow, causing the heat exchanger to overheat and trip the high limit. Opening registers restored normal operation.',
        feedback: 'Closed registers are a common cause of high limit trips. Educate customers: closing registers does not save energy — it causes equipment damage.',
        options: [],
      },
    },
  },

  {
    id: 'sim-09',
    title: 'EPA 608 — Refrigerant Recovery Scenario',
    system: 'R-410A rooftop unit, 10-ton, TXV',
    complaint: 'Compressor failed. Unit must be opened for compressor replacement.',
    initialData: [
      'System charge: approximately 18 lbs R-410A',
      'System pressure: 120 psig suction, 380 psig discharge',
      'Recovery machine available: rated for R-410A',
      'Recovery cylinder: gray body, yellow top, 50 lb capacity, currently empty',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'Before opening the refrigerant circuit, what must you do?',
        options: [
          { label: 'Open the system immediately — the compressor is already failed', next: 's1-wrong' },
          { label: 'Recover all refrigerant to the required level', next: 's2', correct: true },
          { label: 'Vent the refrigerant — the system is broken anyway', next: 's1-vent' },
          { label: 'Only recover if the system has more than 50 lbs', next: 's1-wrong' },
        ],
      },
      's1-vent': {
        id: 's1-vent',
        prompt: 'Intentionally venting refrigerant is a federal violation regardless of system condition. Penalties up to $44,539 per day.',
        feedback: 'Refrigerant must always be recovered before opening any refrigerant circuit — no exceptions.',
        options: [{ label: 'Recover the refrigerant properly', next: 's2', correct: true }],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'All refrigerant must be recovered before opening any refrigerant circuit, regardless of system size or condition.',
        options: [{ label: 'Recover the refrigerant', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You connect the recovery machine. What is the required recovery level for this system (less than 200 lbs, high-pressure)?',
        options: [
          { label: '0 psig (atmospheric)', next: 's2-wrong' },
          { label: '10 in. Hg vacuum', next: 'pass-check', correct: true },
          { label: '500 microns', next: 's2-partial' },
          { label: '4 in. Hg vacuum', next: 's2-wrong' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: 'For high-pressure systems with less than 200 lbs: required recovery level is 10 in. Hg vacuum. Systems with 200+ lbs require 4 in. Hg.',
        options: [{ label: '10 in. Hg vacuum is correct', next: 'pass-check', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: '500 microns is the evacuation standard for dehydration before charging — not the recovery standard. Recovery for this system size requires 10 in. Hg.',
        options: [{ label: '10 in. Hg vacuum is the recovery standard', next: 'pass-check', correct: true }],
      },
      'pass-check': {
        id: 'pass-check',
        prompt: 'Recovery is complete at 10 in. Hg. The recovery cylinder now contains approximately 18 lbs. The cylinder capacity is 50 lbs. Is it safe to use?',
        options: [
          { label: 'Yes — 18 lbs is well under 80% of 50 lbs (40 lbs max)', next: 'pass', correct: true },
          { label: 'No — the cylinder must be empty before use', next: 'pass-check-wrong' },
          { label: 'No — recovery cylinders cannot be reused', next: 'pass-check-wrong' },
        ],
      },
      'pass-check-wrong': {
        id: 'pass-check-wrong',
        prompt: 'Recovery cylinders can be reused and do not need to be empty — they just cannot exceed 80% of capacity by weight. 18 lbs in a 50 lb cylinder is 36% — well within limits.',
        options: [{ label: '18 lbs is within the 80% limit — safe to use', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Recover to 10 in. Hg for high-pressure systems under 200 lbs. Verify cylinder is under 80% capacity. Document the recovery.',
        feedback: 'Recovery requirements: <200 lbs high-pressure = 10 in. Hg; 200+ lbs = 4 in. Hg; low-pressure = 25 mm Hg absolute.',
        options: [],
      },
    },
  },

  {
    id: 'sim-10',
    title: 'Electrical — Contactor and Capacitor Diagnosis',
    system: 'R-410A split system, 2-ton',
    complaint: 'Outdoor unit not running. Indoor unit blows unconditioned air.',
    initialData: [
      'Thermostat calling for cooling — Y terminal has 24V',
      'Indoor blower running normally',
      'Outdoor unit completely off — no fan, no compressor',
      'Disconnect is closed',
      'Breaker is on',
    ],
    entryStep: 's1',
    passingStep: 'pass',
    steps: {
      s1: {
        id: 's1',
        prompt: 'Outdoor unit completely off, 24V at Y. What do you check first?',
        options: [
          { label: 'Check refrigerant charge', next: 's1-wrong' },
          { label: 'Check for 24V at the contactor coil and line voltage at the contactor', next: 's2', correct: true },
          { label: 'Replace the capacitor', next: 's1-wrong' },
          { label: 'Replace the thermostat', next: 's1-wrong' },
        ],
      },
      's1-wrong': {
        id: 's1-wrong',
        prompt: 'The outdoor unit is completely off — no electrical components are running. Trace the electrical circuit before checking refrigerant or replacing parts.',
        options: [{ label: 'Check voltage at the contactor', next: 's2', correct: true }],
      },
      s2: {
        id: 's2',
        prompt: 'You measure: 24V at contactor coil terminals ✓, 240V line voltage at contactor line side ✓, 0V at contactor load side. What does this mean?',
        options: [
          { label: 'The thermostat is not calling', next: 's2-wrong' },
          { label: 'The contactor coil has 24V but contacts are not closing — failed contactor', next: 's3', correct: true },
          { label: 'The breaker is tripped', next: 's2-wrong' },
          { label: 'The capacitor is failed', next: 's2-partial' },
        ],
      },
      's2-wrong': {
        id: 's2-wrong',
        prompt: '24V is present at the coil (thermostat is calling). 240V is present at the line side (breaker is on). 0V at load side means the contacts are not closing.',
        options: [{ label: 'Failed contactor — contacts not closing', next: 's3', correct: true }],
      },
      's2-partial': {
        id: 's2-partial',
        prompt: 'A failed capacitor would not prevent the contactor from closing. The contactor has power but is not passing it through — the contacts are failed.',
        options: [{ label: 'Failed contactor contacts', next: 's3', correct: true }],
      },
      s3: {
        id: 's3',
        prompt: 'You inspect the contactor — the contacts are severely pitted and burned. Before replacing, what else should you check?',
        options: [
          { label: 'Nothing — just replace the contactor', next: 's3-partial' },
          { label: 'Check the capacitor and compressor windings — pitted contacts often indicate a hard-starting compressor', next: 'pass', correct: true },
          { label: 'Check refrigerant charge', next: 's3-wrong' },
        ],
      },
      's3-wrong': {
        id: 's3-wrong',
        prompt: 'Refrigerant charge is not related to pitted contacts. Pitted contacts are often caused by a hard-starting compressor drawing excessive current.',
        options: [{ label: 'Check capacitor and compressor windings', next: 'pass', correct: true }],
      },
      's3-partial': {
        id: 's3-partial',
        prompt: 'Replacing the contactor alone may work, but pitted contacts often indicate a hard-starting compressor. Check the capacitor and windings to find the root cause.',
        options: [{ label: 'Check capacitor and compressor windings first', next: 'pass', correct: true }],
      },
      pass: {
        id: 'pass',
        prompt: 'Correct. Failed contactor contacts prevented power from reaching the outdoor unit. Pitted contacts indicate a hard-starting compressor — check the capacitor and consider a hard-start kit.',
        feedback: 'Pitted contactor contacts are often caused by a weak capacitor or hard-starting compressor drawing excessive inrush current. Fix the root cause, not just the symptom.',
        options: [],
      },
    },
  },
];

// Helper: get a simulation by ID
export function getHvacSim(id: string): TroubleshootingSim | undefined {
  return HVAC_TROUBLESHOOTING_SIMS.find(s => s.id === id);
}
