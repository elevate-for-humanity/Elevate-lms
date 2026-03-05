/**
 * Service call scenarios for HVAC troubleshooting labs.
 * Each scenario is tied to an equipment model and maps to specific modules.
 * Students work through these in the troubleshooting and service call modules.
 */

export interface DiagnosticStep {
  action: string;
  finding: string;
  /** Whether this step reveals the root cause */
  isKeyFinding?: boolean;
}

export interface ServiceScenario {
  id: string;
  /** Which equipment model this scenario uses */
  equipmentModelId: string;
  /** Which modules this scenario appears in */
  moduleIds: string[];
  /** Customer complaint as they would describe it */
  complaint: string;
  /** Season / conditions */
  conditions: string;
  /** System details */
  systemInfo: string;
  /** The actual root cause */
  rootCause: string;
  /** Correct repair */
  correctRepair: string;
  /** Step-by-step diagnostic process */
  diagnosticSteps: DiagnosticStep[];
  /** Incorrect diagnoses students commonly make */
  commonMistakes: string[];
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const HVAC_SERVICE_SCENARIOS: ServiceScenario[] = [
  // ── SPLIT-SYSTEM AC SCENARIOS ──
  {
    id: 'sc-01-bad-capacitor',
    equipmentModelId: 'split-system-ac',
    moduleIds: ['hvac-03', 'hvac-05', 'hvac-13'],
    complaint: 'The AC is not cooling. The outdoor unit is humming but the fan is not spinning.',
    conditions: 'Summer, 95°F outdoor temperature. System was working yesterday.',
    systemInfo: '3-ton R-410A split system, 5 years old. Dual run capacitor rated 45/5 µF.',
    rootCause: 'Failed run capacitor. The fan motor side (5 µF) has dropped to 1.2 µF, preventing the condenser fan from starting. The compressor side (45 µF) reads 38 µF — still within tolerance but weakening.',
    correctRepair: 'Replace the dual run capacitor with a matching 45/5 µF ±6% capacitor. Verify fan motor amp draw after replacement. Recommend replacing the capacitor proactively at the next maintenance visit since the compressor side is also weakening.',
    diagnosticSteps: [
      { action: 'Verify thermostat is set to COOL, setpoint below room temp', finding: 'Thermostat set correctly, calling for cooling.' },
      { action: 'Check disconnect and breaker', finding: 'Power is on. 240V measured at disconnect.' },
      { action: 'Observe outdoor unit', finding: 'Compressor is humming. Fan is not spinning. Unit is vibrating.', isKeyFinding: true },
      { action: 'Turn off power and discharge capacitor', finding: 'Safety first — bleed capacitor through a resistor.' },
      { action: 'Measure capacitor with multimeter', finding: 'Fan side reads 1.2 µF (rated 5 µF) — FAILED. Compressor side reads 38 µF (rated 45 µF) — weak but within tolerance.', isKeyFinding: true },
      { action: 'Inspect capacitor visually', finding: 'Slight bulge on top of capacitor. No oil leak.' },
      { action: 'Replace capacitor with matching 45/5 µF', finding: 'New capacitor installed. Fan starts immediately on power-up.' },
      { action: 'Verify operation — measure amp draw', finding: 'Fan motor: 1.8A (nameplate 2.1A). Compressor: 12.5A (RLA 14.0A). System cooling normally.' },
    ],
    commonMistakes: [
      'Assuming the fan motor is bad without testing the capacitor first',
      'Replacing only the fan side capacitor instead of the entire dual capacitor',
      'Not discharging the capacitor before handling it',
      'Spinning the fan blade by hand and thinking the problem is fixed',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'sc-02-low-charge',
    equipmentModelId: 'split-system-ac',
    moduleIds: ['hvac-05', 'hvac-08', 'hvac-11', 'hvac-13'],
    complaint: 'The house is not getting cool enough. The AC runs all day but the temperature stays at 78°F.',
    conditions: 'Summer, 92°F outdoor temperature. Problem has been getting worse over several weeks.',
    systemInfo: '2.5-ton R-410A split system, 8 years old. TXV metering device.',
    rootCause: 'Refrigerant leak at the evaporator coil service valve. System has lost approximately 30% of its charge over several months. Low refrigerant causes reduced cooling capacity and eventually ice formation on the evaporator.',
    correctRepair: 'Locate and repair the leak at the service valve (replace the Schrader core and cap). Recover remaining refrigerant, evacuate to 500 microns, and recharge to manufacturer specification using the subcooling method.',
    diagnosticSteps: [
      { action: 'Check thermostat and filter', finding: 'Thermostat set correctly. Filter is clean (replaced last month).' },
      { action: 'Measure supply air temperature', finding: 'Supply air is 62°F. Return air is 78°F. Temperature split is 16°F — slightly low but not terrible.' },
      { action: 'Inspect outdoor unit', finding: 'Condenser coil is clean. Fan running. Suction line feels cold but not sweating as much as expected.' },
      { action: 'Connect manifold gauges', finding: 'Suction: 95 psig (should be ~118-130). Discharge: 290 psig (should be ~350-400). Both pressures are low.', isKeyFinding: true },
      { action: 'Calculate superheat', finding: 'Suction saturation temp: 32°F. Suction line temp: 48°F. Superheat = 16°F (should be 8-12°F with TXV). High superheat confirms low charge.' },
      { action: 'Calculate subcooling', finding: 'Liquid saturation temp: 95°F. Liquid line temp: 90°F. Subcooling = 5°F (should be 10-15°F). Low subcooling confirms low charge.', isKeyFinding: true },
      { action: 'Perform leak detection', finding: 'Electronic leak detector alarms at the evaporator coil service valve Schrader core.', isKeyFinding: true },
      { action: 'Repair leak, recover, evacuate, recharge', finding: 'Replaced Schrader core and cap. Evacuated to 400 microns. Charged to 10°F subcooling per manufacturer spec. System cooling normally.' },
    ],
    commonMistakes: [
      'Adding refrigerant without finding and fixing the leak',
      'Diagnosing a dirty coil or bad TXV without checking pressures first',
      'Not calculating both superheat AND subcooling to confirm the diagnosis',
      'Assuming the system needs a full recharge when it only lost partial charge',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'sc-03-frozen-coil',
    equipmentModelId: 'split-system-ac',
    moduleIds: ['hvac-05', 'hvac-10', 'hvac-13'],
    complaint: 'Water is dripping from the ceiling near the hallway. The AC seems to be running but the house is warm.',
    conditions: 'Summer, 88°F outdoor temperature. System has been running continuously for 2 days.',
    systemInfo: '3-ton R-410A split system, 3 years old. Filter last changed 4 months ago.',
    rootCause: 'Severely dirty air filter has restricted airflow across the evaporator coil. The coil froze into a solid block of ice. As the ice melts, water overflows the drain pan and drips through the ceiling.',
    correctRepair: 'Turn off the system and let the ice melt completely (2-4 hours). Replace the air filter. Verify the condensate drain is clear. Check the evaporator coil for dirt. Restart and verify normal operation.',
    diagnosticSteps: [
      { action: 'Observe the indoor unit', finding: 'Ice visible on the suction line where it exits the air handler. Water dripping from the unit.' },
      { action: 'Check the air filter', finding: 'Filter is completely clogged — cannot see light through it. Has not been changed in 4+ months.', isKeyFinding: true },
      { action: 'Measure supply airflow', finding: 'Almost no air coming from supply registers. Blower is running but airflow is severely restricted.' },
      { action: 'Turn system OFF', finding: 'Must let ice melt before any further diagnosis. Running the system with a frozen coil can damage the compressor (liquid slugging).' },
      { action: 'Replace air filter', finding: 'Installed new MERV 8 filter.' },
      { action: 'Wait for ice to melt (2-4 hours)', finding: 'Ice has melted. Drain pan is full — cleared the condensate drain.' },
      { action: 'Restart system and verify', finding: 'System running normally. Supply air 55°F. Good airflow at all registers. Suction pressure normal.' },
    ],
    commonMistakes: [
      'Trying to diagnose refrigerant charge while the coil is frozen (pressures will be misleading)',
      'Using a heat gun or torch to melt the ice (can damage the coil)',
      'Not checking the condensate drain after the ice melts',
      'Restarting the system before all ice has melted',
    ],
    difficulty: 'beginner',
  },

  // ── GAS FURNACE SCENARIOS ──
  {
    id: 'sc-04-dirty-flame-sensor',
    equipmentModelId: 'gas-furnace',
    moduleIds: ['hvac-04', 'hvac-13'],
    complaint: 'The furnace starts up, the burners light for a few seconds, then everything shuts off. It tries again and does the same thing.',
    conditions: 'Winter, 25°F outdoor temperature. Furnace is 6 years old.',
    systemInfo: 'Single-stage 80,000 BTU gas furnace with hot surface igniter. Natural gas.',
    rootCause: 'Dirty flame sensor. Carbon buildup on the flame sensor rod prevents it from detecting flame current. The control board sees no flame signal and shuts the gas valve as a safety measure.',
    correctRepair: 'Remove the flame sensor (one screw) and clean it with fine emery cloth or a Scotch-Brite pad. Reinstall and verify flame signal is 2+ microamps. This is the most common no-heat service call.',
    diagnosticSteps: [
      { action: 'Observe the startup sequence', finding: 'Draft inducer starts. Igniter glows. Gas valve opens. Burners light. After 3-5 seconds, burners go out. System locks out after 3 attempts.', isKeyFinding: true },
      { action: 'Read control board LED codes', finding: 'LED flashing code indicates "flame sense failure" or "no flame detected."', isKeyFinding: true },
      { action: 'Inspect the flame sensor', finding: 'Thin metal rod in the flame path has visible carbon/oxide buildup on the tip.' },
      { action: 'Measure flame signal (if meter available)', finding: 'Flame signal reads 0.3 µA — should be 2-6 µA minimum.' },
      { action: 'Clean flame sensor with emery cloth', finding: 'Removed carbon buildup. Rod is now shiny.' },
      { action: 'Reinstall and test', finding: 'Burners light and stay lit. Flame signal now reads 4.2 µA. Furnace completes full heating cycle.' },
    ],
    commonMistakes: [
      'Replacing the flame sensor instead of cleaning it (unnecessary cost)',
      'Replacing the gas valve thinking it is not opening (it is opening — the board shuts it off)',
      'Replacing the igniter (the igniter is working — the burners DO light)',
      'Not reading the control board fault codes before starting diagnosis',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'sc-05-cracked-heat-exchanger',
    equipmentModelId: 'gas-furnace',
    moduleIds: ['hvac-04', 'hvac-13', 'hvac-14'],
    complaint: 'The furnace smells strange when it runs. Family members have been getting headaches.',
    conditions: 'Winter, 30°F outdoor temperature. Furnace is 18 years old.',
    systemInfo: '100,000 BTU gas furnace, natural gas. Original equipment, never replaced.',
    rootCause: 'Cracked heat exchanger. Combustion gases (including carbon monoxide) are leaking into the supply air stream. This is a life-threatening safety hazard.',
    correctRepair: 'RED-TAG the system immediately — do not allow operation. Inform the customer of the carbon monoxide hazard. Recommend heat exchanger replacement or full furnace replacement (usually more cost-effective on an 18-year-old unit).',
    diagnosticSteps: [
      { action: 'Test for CO in the living space', finding: 'CO detector reads 35 ppm in the hallway near the return grille. This is above the 9 ppm action level.', isKeyFinding: true },
      { action: 'Test CO in the supply air', finding: 'CO in supply air reads 180 ppm. This confirms combustion gases are entering the air stream.', isKeyFinding: true },
      { action: 'Visual inspection of heat exchanger', finding: 'Visible crack along the bottom of the primary heat exchanger cell. Rust and corrosion around the crack.' },
      { action: 'Flame disturbance test', finding: 'With the blower running, the burner flame flickers and distorts — air from the blower is entering the combustion chamber through the crack.' },
      { action: 'RED-TAG the system', finding: 'System shut down and tagged. Customer informed of CO hazard. Recommended immediate furnace replacement.' },
    ],
    commonMistakes: [
      'Not testing for CO first — headaches and strange smells are CO warning signs',
      'Continuing to run the system while diagnosing',
      'Attempting to repair a cracked heat exchanger (replacement is the only safe option)',
      'Not informing the customer of the life-threatening hazard',
    ],
    difficulty: 'intermediate',
  },

  // ── HEAT PUMP SCENARIOS ──
  {
    id: 'sc-06-stuck-reversing-valve',
    equipmentModelId: 'heat-pump',
    moduleIds: ['hvac-04', 'hvac-09', 'hvac-13'],
    complaint: 'The heat pump is blowing cold air in heating mode. The thermostat is set to heat but the air from the vents feels cold.',
    conditions: 'Winter, 35°F outdoor temperature.',
    systemInfo: '3-ton R-410A heat pump, 7 years old. Honeywell thermostat (O wire energized in cooling).',
    rootCause: 'Stuck reversing valve. The valve is stuck in cooling position, so the system is cooling instead of heating. The solenoid coil may be energized but the valve slide is mechanically stuck.',
    correctRepair: 'Verify 24V at the reversing valve solenoid. If voltage is correct, try tapping the valve body gently while energizing/de-energizing the solenoid. If the valve does not shift, replace the reversing valve (major repair — requires recovery, brazing, evacuation, and recharge).',
    diagnosticSteps: [
      { action: 'Verify thermostat is in HEAT mode', finding: 'Thermostat set to HEAT, 72°F setpoint. Room is 65°F. System is running.' },
      { action: 'Measure supply air temperature', finding: 'Supply air is 55°F — the system is cooling, not heating.', isKeyFinding: true },
      { action: 'Check outdoor unit', finding: 'Outdoor coil is hot (rejecting heat). In heating mode, the outdoor coil should be cold (absorbing heat). System is operating in cooling mode.', isKeyFinding: true },
      { action: 'Check reversing valve solenoid', finding: 'Solenoid should be de-energized in heating mode (Honeywell O-wire system). Measured 0V at solenoid — correct for heating mode.' },
      { action: 'Energize solenoid manually to test', finding: 'Applied 24V to solenoid. Heard a click but valve did not shift. Outdoor coil still hot.' },
      { action: 'Tap valve body while cycling solenoid', finding: 'After several attempts, valve shifted. Outdoor coil is now cold. Supply air warming up.' },
      { action: 'Monitor operation', finding: 'Valve may stick again. Recommend reversing valve replacement at next convenient time.' },
    ],
    commonMistakes: [
      'Assuming the thermostat is wired wrong without checking the reversing valve',
      'Not understanding O vs B wire convention (O = cooling, B = heating)',
      'Replacing the solenoid coil when the valve slide is mechanically stuck',
      'Not checking supply air temperature to confirm the actual operating mode',
    ],
    difficulty: 'advanced',
  },

  // ── DUCT SYSTEM SCENARIOS ──
  {
    id: 'sc-07-disconnected-duct',
    equipmentModelId: 'duct-system',
    moduleIds: ['hvac-10', 'hvac-13'],
    complaint: 'One bedroom is always hot in summer and cold in winter. The rest of the house is comfortable.',
    conditions: 'Summer, 90°F outdoor temperature. Problem has existed since the family moved in.',
    systemInfo: 'Flex duct system in the attic. House is 12 years old.',
    rootCause: 'The flex duct to the affected bedroom is disconnected at the supply plenum. It was either never properly connected during construction or came loose over time. Conditioned air is blowing into the attic instead of the bedroom.',
    correctRepair: 'Reconnect the flex duct to the supply plenum takeoff using a metal clamp and mastic sealant. Verify airflow at the bedroom register after repair.',
    diagnosticSteps: [
      { action: 'Check supply register in the affected bedroom', finding: 'Very little air coming from the register. Other rooms have strong airflow.' },
      { action: 'Check if the register damper is open', finding: 'Register is fully open. Still minimal airflow.' },
      { action: 'Inspect the attic ductwork', finding: 'The flex duct to the bedroom is disconnected from the supply plenum takeoff. The open end is blowing conditioned air into the attic.', isKeyFinding: true },
      { action: 'Reconnect the duct', finding: 'Pulled flex duct over the takeoff collar. Secured with a metal clamp and sealed with mastic.' },
      { action: 'Verify repair', finding: 'Strong airflow now at the bedroom register. Room temperature dropping.' },
    ],
    commonMistakes: [
      'Assuming the system is undersized without checking ductwork first',
      'Closing registers in other rooms to "force" more air to the problem room',
      'Not physically inspecting the attic ductwork',
      'Blaming the equipment when the problem is in the distribution system',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'sc-08-high-static-pressure',
    equipmentModelId: 'duct-system',
    moduleIds: ['hvac-10', 'hvac-12', 'hvac-13'],
    complaint: 'The system is noisy and the energy bills are very high. Some rooms are too hot and some are too cold.',
    conditions: 'Year-round problem. House was recently renovated and rooms were added.',
    systemInfo: '4-ton system with original ductwork designed for a 3-ton system. Renovation added 2 rooms without adding duct capacity.',
    rootCause: 'The duct system is undersized for the current load. The renovation added rooms and registers to the existing ductwork without increasing duct size or adding return air capacity. Total external static pressure is 0.92" w.c. (should be below 0.50" w.c.).',
    correctRepair: 'Add a dedicated return air path for the new rooms. Upsize the main trunk line or add a second trunk. Verify static pressure drops below 0.50" w.c. after modifications.',
    diagnosticSteps: [
      { action: 'Measure total external static pressure', finding: 'Supply static: +0.55" w.c. Return static: -0.37" w.c. Total: 0.92" w.c. — nearly double the 0.50" maximum.', isKeyFinding: true },
      { action: 'Measure airflow at registers', finding: 'Original rooms have adequate airflow. New rooms have very weak airflow.' },
      { action: 'Inspect ductwork', finding: 'Original trunk line is 10" round. Two new 6" flex ducts were tapped into the existing trunk. No additional return air was added for the new rooms.', isKeyFinding: true },
      { action: 'Check blower amp draw', finding: 'Blower drawing 4.8A (nameplate 3.5A). Motor is working harder than designed due to high static pressure.' },
      { action: 'Recommend duct modifications', finding: 'Need to add return air for new rooms and upsize the main trunk or add a second supply trunk.' },
    ],
    commonMistakes: [
      'Replacing the blower motor with a larger one (treats the symptom, not the cause)',
      'Increasing blower speed (increases noise and static pressure further)',
      'Not measuring static pressure — guessing based on symptoms',
      'Blaming the equipment when the duct system is the bottleneck',
    ],
    difficulty: 'advanced',
  },

  // ── ADDITIONAL SCENARIOS ──
  {
    id: 'sc-09-furnace-pressure-switch',
    equipmentModelId: 'gas-furnace',
    moduleIds: ['hvac-09', 'hvac-13'],
    complaint: 'The furnace tries to start but never lights. I can hear a motor running but no flame.',
    conditions: 'Winter, 20°F outdoor temperature. Furnace is 10 years old.',
    systemInfo: '80,000 BTU two-stage gas furnace with hot surface igniter. Condensing (90%+ AFUE).',
    rootCause: 'Blocked condensate drain. The condensing furnace produces condensate that drains through a PVC line. The line is clogged with algae/sediment, backing water into the inducer housing. The pressure switch cannot sense proper draft because the inducer housing is partially filled with water.',
    correctRepair: 'Clear the condensate drain line with compressed air or a wet/dry vacuum. Clean the inducer housing. Verify the pressure switch closes when the inducer runs. Check the condensate trap and clean if needed.',
    diagnosticSteps: [
      { action: 'Read control board fault codes', finding: 'LED code indicates "pressure switch open" or "pressure switch stuck open."', isKeyFinding: true },
      { action: 'Observe startup sequence', finding: 'Draft inducer starts and runs. Igniter never glows. System locks out after 3 attempts.' },
      { action: 'Check pressure switch with multimeter', finding: 'Pressure switch stays open (no continuity) even with inducer running.', isKeyFinding: true },
      { action: 'Inspect inducer and drain', finding: 'Water visible in the inducer housing. Condensate drain line is clogged.', isKeyFinding: true },
      { action: 'Clear condensate drain', finding: 'Used wet/dry vacuum to clear the drain line. Water drained from inducer housing.' },
      { action: 'Restart and verify', finding: 'Inducer runs, pressure switch closes, igniter glows, burners light. Furnace operates normally.' },
    ],
    commonMistakes: [
      'Replacing the pressure switch without checking why it will not close',
      'Jumping the pressure switch to bypass it — dangerous, allows operation without proper draft',
      'Not checking the condensate drain on a condensing furnace',
      'Replacing the inducer motor when the problem is a blocked drain',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'sc-10-overcharge',
    equipmentModelId: 'split-system-ac',
    moduleIds: ['hvac-08', 'hvac-11', 'hvac-13'],
    complaint: 'The AC is running but the electric bill doubled this month. The house feels humid.',
    conditions: 'Summer, 88°F outdoor temperature. A different company serviced the system last month.',
    systemInfo: '3-ton R-410A split system with TXV. System is 4 years old.',
    rootCause: 'Overcharged system. The previous technician added refrigerant without checking superheat/subcooling, resulting in approximately 2 lbs of excess charge. High subcooling (22°F vs target 12°F) and low superheat confirm overcharge. The system runs inefficiently with high head pressure and reduced dehumidification.',
    correctRepair: 'Recover excess refrigerant until subcooling reaches the manufacturer target (10-14°F). Verify superheat is also within range. Measure amp draw to confirm compressor is not overloaded.',
    diagnosticSteps: [
      { action: 'Check thermostat and filter', finding: 'Thermostat set correctly. Filter is clean.' },
      { action: 'Measure supply air temperature', finding: 'Supply air is 58°F. Return is 76°F. Split is 18°F — within range but house feels humid.' },
      { action: 'Connect manifold gauges', finding: 'Suction: 145 psig (slightly high). Discharge: 460 psig (high).', isKeyFinding: true },
      { action: 'Calculate subcooling', finding: 'Liquid saturation: 120°F. Liquid line temp: 98°F. Subcooling = 22°F — well above the 10-14°F target.', isKeyFinding: true },
      { action: 'Calculate superheat', finding: 'Suction saturation: 48°F. Suction line temp: 52°F. Superheat = 4°F — too low. Risk of liquid slugging.' },
      { action: 'Check service records', finding: 'Previous company added 2 lbs of refrigerant last month without documenting pressures.' },
      { action: 'Remove excess charge', finding: 'Recovered refrigerant until subcooling reached 12°F. Superheat now 8°F. Pressures normal.' },
    ],
    commonMistakes: [
      'Adding more refrigerant to a system that is already overcharged',
      'Not calculating subcooling — just looking at pressures',
      'Blaming the TXV for low superheat when the real problem is overcharge',
      'Not checking the previous service history',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'sc-11-blower-failure',
    equipmentModelId: 'duct-system',
    moduleIds: ['hvac-12', 'hvac-13'],
    complaint: 'No air is coming from any of the vents. The outdoor unit seems to be running.',
    conditions: 'Summer, 90°F outdoor temperature.',
    systemInfo: '3-ton split system, 6 years old. PSC blower motor with 10 µF run capacitor.',
    rootCause: 'Failed blower motor run capacitor. The 10 µF capacitor has dropped to 3.2 µF, preventing the blower motor from starting. The outdoor unit runs normally but with no indoor airflow, the evaporator coil will freeze within 30 minutes.',
    correctRepair: 'Replace the blower motor run capacitor with a matching 10 µF capacitor. Verify blower motor amp draw after replacement. Check the evaporator coil for ice — if frozen, turn off the system and let it thaw before restarting.',
    diagnosticSteps: [
      { action: 'Check supply registers', finding: 'No air from any register. Outdoor unit is running.' },
      { action: 'Check indoor unit', finding: 'Blower motor is humming but not spinning.', isKeyFinding: true },
      { action: 'Turn off system', finding: 'Prevent evaporator coil from freezing while diagnosing.' },
      { action: 'Check blower capacitor', finding: 'Capacitor reads 3.2 µF — rated 10 µF. Failed.', isKeyFinding: true },
      { action: 'Replace capacitor', finding: 'Installed new 10 µF capacitor. Blower starts immediately.' },
      { action: 'Check evaporator coil', finding: 'Light frost on coil. Let it thaw for 30 minutes before restarting.' },
      { action: 'Restart and verify', finding: 'System running normally. Good airflow at all registers. Supply air 56°F.' },
    ],
    commonMistakes: [
      'Replacing the blower motor without checking the capacitor first',
      'Leaving the outdoor unit running while the blower is not working — freezes the coil',
      'Not checking for ice on the evaporator before restarting',
      'Spinning the blower wheel by hand and thinking the problem is fixed',
    ],
    difficulty: 'beginner',
  },
];

/** Get scenarios for a specific module */
export function getModuleScenarios(moduleId: string): ServiceScenario[] {
  return HVAC_SERVICE_SCENARIOS.filter((s) => s.moduleIds.includes(moduleId));
}

/** Get scenarios for a specific equipment model */
export function getEquipmentScenarios(equipmentModelId: string): ServiceScenario[] {
  return HVAC_SERVICE_SCENARIOS.filter((s) => s.equipmentModelId === equipmentModelId);
}

/** Get scenarios by difficulty */
export function getScenariosByDifficulty(difficulty: ServiceScenario['difficulty']): ServiceScenario[] {
  return HVAC_SERVICE_SCENARIOS.filter((s) => s.difficulty === difficulty);
}
