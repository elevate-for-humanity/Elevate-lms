/**
 * HVAC Step-by-Step Procedure Library
 * Real procedures a technician performs daily
 */

export interface HVACProcedure {
  id: string;
  title: string;
  category: 'refrigerant' | 'electrical' | 'combustion' | 'airflow' | 'installation' | 'service';
  whenToPerform: string;
  toolsRequired: string[];
  steps: { step: number; action: string; detail: string; warning?: string }[];
  commonMistakes: string[];
  modules: string[];
}

export const HVAC_PROCEDURES: HVACProcedure[] = [];
function add(p: HVACProcedure) { HVAC_PROCEDURES.push(p); }

add({
  id: 'proc-vacuum',
  title: 'System Evacuation (Pulling a Vacuum)',
  category: 'refrigerant',
  whenToPerform: 'After any repair that opens the refrigerant circuit.',
  toolsRequired: ['Vacuum pump', 'Micron gauge', 'Manifold gauges', 'Core removal tool', 'Nitrogen (for triple evacuation)'],
  steps: [
    { step: 1, action: 'Remove Schrader valve cores', detail: 'Use a core removal tool to remove cores from both service ports. This eliminates restriction and speeds evacuation dramatically.' },
    { step: 2, action: 'Connect vacuum pump', detail: 'Connect pump inlet to center (yellow) hose. Use short, large-diameter hoses to minimize restriction.' },
    { step: 3, action: 'Connect micron gauge at the system', detail: 'Attach directly to a service port or tee — NOT at the pump end. Reading at the pump gives a false low number.' },
    { step: 4, action: 'Open both manifold valves', detail: 'Both high and low side valves fully open so the pump pulls from the entire system.' },
    { step: 5, action: 'Start the vacuum pump', detail: 'Check oil level first. Run the pump and watch the micron gauge drop.' },
    { step: 6, action: 'Pull to 500 microns or below', detail: 'This may take 30 minutes to several hours depending on system size and moisture content. Do not rush.', warning: 'If the gauge stalls above 1500 microns, there is a leak or significant moisture.' },
    { step: 7, action: 'Isolate and decay test', detail: 'Close both manifold valves. Turn off the pump. Watch the micron gauge for 10 minutes.' },
    { step: 8, action: 'Evaluate decay', detail: 'Holds below 500 microns = pass. Rises to 1000-2000 = moisture (keep pumping). Rises above 2000 rapidly = leak (find and fix).' },
    { step: 9, action: 'Reinstall Schrader cores', detail: 'Use the core tool to reinstall cores in both ports before charging.' },
    { step: 10, action: 'Charge the system', detail: 'Break vacuum with refrigerant (not nitrogen). Charge per nameplate or superheat/subcooling targets.' },
  ],
  commonMistakes: ['Leaving Schrader cores in during evacuation', 'Micron gauge at pump instead of system', 'Skipping the decay test', 'Using hoses that are too long or small diameter'],
  modules: ['hvac-07', 'hvac-08', 'hvac-10'],
});

add({
  id: 'proc-recovery',
  title: 'Refrigerant Recovery',
  category: 'refrigerant',
  whenToPerform: 'Before opening any system for repair. Before disposing of equipment.',
  toolsRequired: ['Recovery machine', 'Recovery cylinder (gray/yellow)', 'Refrigerant scale', 'Manifold gauges', 'Hoses'],
  steps: [
    { step: 1, action: 'Identify the refrigerant', detail: 'Check the nameplate or data plate. Never assume. If unknown, use a refrigerant identifier.' },
    { step: 2, action: 'Weigh the recovery cylinder', detail: 'Place on scale. Note the tare weight stamped on the cylinder. Calculate 80% capacity — never exceed this.', warning: 'Overfilling above 80% risks hydrostatic rupture.' },
    { step: 3, action: 'Connect hoses', detail: 'System service port → recovery machine inlet. Recovery machine outlet → recovery cylinder vapor port.' },
    { step: 4, action: 'Open valves and start recovery', detail: 'Open the cylinder valve, then start the recovery machine. Monitor the scale.' },
    { step: 5, action: 'Recover to required level', detail: 'Under 200 lbs charge: recover to 0 psig. 200+ lbs: recover to 10 inches Hg vacuum. Known leak: recover to 0 psig.' },
    { step: 6, action: 'Monitor cylinder weight', detail: 'Stop BEFORE reaching 80% capacity. If the cylinder fills, close the valve and switch to a new cylinder.' },
    { step: 7, action: 'Close valves and disconnect', detail: 'Close cylinder valve first, then stop the machine, then disconnect hoses.' },
    { step: 8, action: 'Label the cylinder', detail: 'Write: refrigerant type, date, amount recovered, your name. Attach a tag.' },
    { step: 9, action: 'Record on service report', detail: 'Document the amount recovered, refrigerant type, and system information.' },
  ],
  commonMistakes: ['Not weighing the cylinder', 'Mixing refrigerant types in one cylinder', 'Exceeding 80% fill', 'Not labeling the cylinder', 'Forgetting to recover before opening the system'],
  modules: ['hvac-06', 'hvac-07', 'hvac-10', 'hvac-16'],
});

add({
  id: 'proc-brazing',
  title: 'Brazing Copper Joints with Nitrogen Purge',
  category: 'installation',
  whenToPerform: 'Any time you join copper refrigerant lines — compressor replacement, line repair, new installation.',
  toolsRequired: ['Air-acetylene torch', 'Silfos brazing alloy', 'Nitrogen tank with regulator', 'Emery cloth', 'Heat shield', 'Fire extinguisher', 'Safety glasses'],
  steps: [
    { step: 1, action: 'Set up nitrogen purge', detail: 'Connect nitrogen to one end of the line set. Set regulator to 2-5 psig (just a trickle). The nitrogen flows through the pipe during brazing to prevent copper oxide formation inside.', warning: 'Brazing without nitrogen creates black copper oxide scale that clogs metering devices and contaminates the system.' },
    { step: 2, action: 'Clean tube ends', detail: 'Use emery cloth to clean the outside of the tube and inside of the fitting until shiny copper is visible. Contamination prevents alloy flow.' },
    { step: 3, action: 'Assemble the joint', detail: 'Insert tube fully into fitting. The gap between tube and fitting should be 0.001-0.005 inches for capillary action.' },
    { step: 4, action: 'Position heat shield', detail: 'Place behind the joint to protect nearby surfaces, insulation, and wiring from the flame.' },
    { step: 5, action: 'Light the torch', detail: 'Open acetylene valve slightly. Ignite with a striker (never a lighter). Adjust to a neutral flame — inner cone visible, no acetylene feather.', warning: 'Acetylene is explosive above 15 psig. Never exceed regulator setting.' },
    { step: 6, action: 'Heat the joint evenly', detail: 'Move the flame around the fitting, heating the larger mass (fitting) more than the tube. The fitting should reach cherry red (1100-1500°F).' },
    { step: 7, action: 'Apply brazing alloy', detail: 'Touch the rod to the joint — NOT to the flame. The hot copper melts the alloy. Capillary action pulls it into the gap. You should see a ring of alloy around the entire joint.' },
    { step: 8, action: 'Remove heat and cool', detail: 'Let the joint cool naturally. Do NOT quench with water — thermal shock can crack the joint. Continue nitrogen purge until below 500°F.' },
    { step: 9, action: 'Inspect the joint', detail: 'Look for a complete ring of alloy around the joint. No gaps, no pinholes. The joint should be smooth and shiny.' },
  ],
  commonMistakes: ['No nitrogen purge (oxide contamination)', 'Overheating (weakens copper, burns alloy)', 'Melting rod with flame instead of hot copper', 'Quenching with water', 'Dirty tube ends'],
  modules: ['hvac-02', 'hvac-07', 'hvac-10'],
});

add({
  id: 'proc-furnace-startup',
  title: 'Gas Furnace Startup & Safety Inspection',
  category: 'combustion',
  whenToPerform: 'Annual maintenance, new installation, any no-heat service call.',
  toolsRequired: ['Combustion analyzer', 'Manometer', 'Digital multimeter', 'Thermometer', 'Screwdrivers', 'Flame sensor cleaning tool (emery cloth or dollar bill)'],
  steps: [
    { step: 1, action: 'Visual inspection', detail: 'Check for obvious damage, rust, water stains, soot. Inspect the heat exchanger visually (use a mirror and flashlight). Look for cracks or holes.' },
    { step: 2, action: 'Check the air filter', detail: 'Replace if dirty. A clogged filter restricts airflow and can cause the furnace to overheat and shut down on limit.' },
    { step: 3, action: 'Verify gas supply', detail: 'Check that the gas valve is open. Verify gas type matches the furnace rating (natural gas vs propane).' },
    { step: 4, action: 'Check electrical connections', detail: 'Tighten all wire connections. Check for burned or melted wires. Verify 24V at the thermostat terminals.' },
    { step: 5, action: 'Start the furnace', detail: 'Set thermostat to call for heat. Observe the startup sequence: draft inducer starts → pressure switch closes → igniter glows → gas valve opens → burners ignite → flame sensor proves flame → blower starts after delay.' },
    { step: 6, action: 'Clean the flame sensor', detail: 'Remove the flame sensor (single screw). Clean the rod with fine emery cloth or a dollar bill. Reinstall. A dirty flame sensor is the #1 no-heat call.', warning: 'Do not use sandpaper — it is too aggressive and can damage the sensor.' },
    { step: 7, action: 'Measure flame sensor microamps', detail: 'With the furnace running, connect your meter (µA DC) in series with the flame sensor wire. Should read 1-6 µA. Below 1 µA = sensor needs cleaning or replacement.' },
    { step: 8, action: 'Measure gas manifold pressure', detail: 'Connect manometer to the pressure tap on the gas valve. Natural gas: 3.5 in. w.c. Propane: 10-11 in. w.c. Adjust if needed.' },
    { step: 9, action: 'Measure temperature rise', detail: 'Measure supply air temp and return air temp. Subtract: supply minus return = temperature rise. Compare to the range on the furnace nameplate (typically 35-65°F). Adjust blower speed if outside range.' },
    { step: 10, action: 'Run combustion analysis', detail: 'Insert probe into flue. Record CO, O2, stack temp, efficiency. CO must be under 100 ppm in flue. Any CO in living space = investigate immediately.' },
    { step: 11, action: 'Check control board fault codes', detail: 'Read the LED flash pattern on the control board. Compare to the code chart on the furnace door. Document any stored codes.' },
    { step: 12, action: 'Document everything', detail: 'Record all readings on the service report: gas pressure, temp rise, CO, flame sensor µA, filter condition, fault codes.' },
  ],
  commonMistakes: ['Skipping the flame sensor cleaning', 'Not measuring temperature rise', 'Not running combustion analysis', 'Ignoring control board fault codes', 'Not checking the filter'],
  modules: ['hvac-04', 'hvac-09', 'hvac-11'],
});

add({
  id: 'proc-airflow',
  title: 'Airflow Measurement & Duct Static Pressure',
  category: 'airflow',
  whenToPerform: 'Every cooling diagnostic (before connecting gauges), new installation verification, comfort complaints.',
  toolsRequired: ['Manometer', 'Thermometer', 'Anemometer (optional)', 'Drill with 3/8" bit (for test ports)'],
  steps: [
    { step: 1, action: 'Measure total external static pressure', detail: 'Drill a small hole in the supply plenum (after the coil) and return plenum (before the filter). Insert manometer probes. Supply static + return static = total external static pressure (TESP).' },
    { step: 2, action: 'Compare to equipment rating', detail: 'Most residential systems are rated for 0.5 in. w.c. TESP. Over 0.5 = restricted ductwork. Over 0.8 = serious problem — system cannot deliver rated capacity.' },
    { step: 3, action: 'Measure temperature split', detail: 'Measure supply air temp at a register closest to the unit. Measure return air temp at the return grille. Cooling split should be 15-22°F. Heating split should match the furnace nameplate temp rise range.' },
    { step: 4, action: 'Calculate approximate CFM', detail: 'CFM = (BTU/hr) ÷ (1.08 × temperature split). Example: 36,000 BTU system, 18°F split → 36,000 ÷ (1.08 × 18) = 1,852 CFM. Target is 400 CFM per ton. 3-ton = 1,200 CFM.' },
    { step: 5, action: 'Check filter condition', detail: 'A dirty filter is the most common cause of low airflow. Replace if dirty. Note the filter size and type for the customer.' },
    { step: 6, action: 'Inspect ductwork', detail: 'Look for disconnected ducts, crushed flex duct, closed dampers, blocked registers. In attics, check for collapsed or kinked flex runs.' },
    { step: 7, action: 'Seal test ports', detail: 'Plug the holes you drilled with rubber plugs or foil tape. Do not leave open.' },
  ],
  commonMistakes: ['Skipping airflow check and going straight to gauges', 'Not checking the filter first', 'Measuring air temp at the unit instead of at registers', 'Forgetting to seal test ports'],
  modules: ['hvac-05', 'hvac-08', 'hvac-09', 'hvac-11'],
});

add({
  id: 'proc-service-ticket',
  title: 'Writing a Service Ticket / Work Order',
  category: 'service',
  whenToPerform: 'Every service call. Document what you found, what you did, and what the customer needs to know.',
  toolsRequired: ['Service ticket book or tablet/phone with service software'],
  steps: [
    { step: 1, action: 'Record customer info', detail: 'Name, address, phone, email. Equipment location (attic, basement, closet, rooftop).' },
    { step: 2, action: 'Record equipment info', detail: 'Manufacturer, model number, serial number, refrigerant type, date of manufacture. This is on the data plate.' },
    { step: 3, action: 'Document the complaint', detail: 'What the customer reported: "not cooling," "strange noise," "high electric bill." Use their words.' },
    { step: 4, action: 'Document your findings', detail: 'What you measured: pressures, temperatures, superheat, subcooling, amp draw, gas pressure, CO readings. What you observed: dirty filter, frozen coil, tripped breaker, etc.' },
    { step: 5, action: 'Document the repair', detail: 'What you did: replaced capacitor, cleaned flame sensor, added 8 oz R-410A, replaced filter. Include part numbers if applicable.' },
    { step: 6, action: 'Document recommendations', detail: 'What the customer should do: replace the system (with quote), schedule follow-up, change filter monthly, etc.' },
    { step: 7, action: 'Get customer signature', detail: 'Customer signs acknowledging the work performed. This protects you and the company.' },
  ],
  commonMistakes: ['Not recording model/serial numbers', 'Vague descriptions ("fixed AC")', 'Not documenting refrigerant amounts added or recovered', 'Forgetting customer signature'],
  modules: ['hvac-09', 'hvac-11', 'hvac-12', 'hvac-16'],
});

// ─── HELPER ─────────────────────────────────────────────

export function getProceduresByModule(moduleId: string): HVACProcedure[] {
  return HVAC_PROCEDURES.filter((p) => p.modules.includes(moduleId));
}
