/**
 * HVAC Tool-by-Tool Breakdowns
 * Every tool a technician uses with step-by-step procedures
 */

export interface HVACTool {
  id: string;
  name: string;
  category: 'measurement' | 'electrical' | 'refrigerant' | 'hand' | 'power' | 'safety' | 'brazing';
  whatItIs: string;
  whatItLooksLike: string;
  whenToUse: string;
  howToUse: string[];
  howToRead?: string;
  calibration?: string;
  commonMistakes: string[];
  safetyNotes: string[];
  costRange: string;
  modules: string[];
}

export const HVAC_TOOLS: HVACTool[] = [];
function add(t: HVACTool) { HVAC_TOOLS.push(t); }

// ─── MEASUREMENT TOOLS ──────────────────────────────────

add({
  id: 'manifold-gauges',
  name: 'Manifold Gauge Set',
  category: 'measurement',
  whatItIs: 'A set of two pressure gauges (compound/low side and high side) connected by hoses to service ports on an AC system. The compound gauge reads vacuum and pressure. The high-side gauge reads pressure only. A center hose connects to a vacuum pump, recovery machine, or refrigerant cylinder.',
  whatItLooksLike: 'Two round gauges mounted on a metal or plastic manifold body. Blue gauge on the left (low side), red gauge on the right (high side). Three or four hoses: blue (low/suction), red (high/liquid), yellow (center/utility). Hand valves on the manifold control flow.',
  whenToUse: 'Every cooling diagnostic call. Connect to measure suction and discharge pressures, calculate superheat and subcooling, charge refrigerant, recover refrigerant, and pull vacuum.',
  howToUse: [
    'Identify suction (large line) and liquid (small line) service ports on the system',
    'Connect blue hose to suction port (low side), red hose to liquid port (high side)',
    'With both valves CLOSED, turn on the system and let it run 15+ minutes',
    'Read suction pressure on the blue gauge, discharge pressure on the red gauge',
    'Convert pressures to saturation temperatures using the PT chart for the correct refrigerant',
    'To charge: connect yellow hose to refrigerant cylinder, open the appropriate valve slowly',
    'To recover: connect yellow hose to recovery machine, open both valves',
    'To evacuate: connect yellow hose to vacuum pump, open both valves',
    'When done: close valves, disconnect hoses, cap service ports',
  ],
  howToRead: 'The outer scale shows psig (pounds per square inch gauge). Inner scales show saturation temperatures for common refrigerants (R-22, R-410A, R-134a). The compound gauge also shows inches of mercury vacuum (below 0 psig). Read where the needle points on the psig scale, then use the PT chart for exact saturation temp.',
  calibration: 'With hoses disconnected and at rest, both needles should point to 0 psig. If not, use the adjustment screw on the face of the gauge to zero it. Replace gauges that cannot be zeroed.',
  commonMistakes: [
    'Connecting to the wrong ports (blue to high side)',
    'Opening valves before connecting hoses (venting refrigerant)',
    'Taking readings before system has run 15 minutes',
    'Using R-22 PT chart scale for an R-410A system',
    'Forgetting to cap service ports after disconnecting',
    'Not zeroing gauges before use',
  ],
  safetyNotes: [
    'High-side pressures on R-410A can exceed 500 psig — use rated hoses',
    'Liquid refrigerant through hoses can cause frostbite',
    'Never open both valves simultaneously while charging (creates a path through the system)',
  ],
  costRange: '$80-$300',
  modules: ['hvac-02', 'hvac-05', 'hvac-06', 'hvac-07', 'hvac-08', 'hvac-09', 'hvac-10', 'hvac-11', 'hvac-16'],
});

add({
  id: 'digital-multimeter',
  name: 'Digital Multimeter (DMM)',
  category: 'electrical',
  whatItIs: 'Measures voltage (AC and DC), resistance (ohms), amperage, capacitance, and continuity. The single most important electrical diagnostic tool. Used on every service call to verify power, test components, and diagnose electrical failures.',
  whatItLooksLike: 'Handheld device with a digital display, a rotary dial to select measurement type, and two probe leads (red positive, black negative/common). Some have clamp jaws for amperage.',
  whenToUse: 'Every service call. Check voltage at disconnect, test capacitors, measure compressor winding resistance, verify contactor operation, test transformer output, check thermostat signals.',
  howToUse: [
    'Select the correct function on the dial (V~ for AC voltage, V= for DC, Ω for resistance, µF for capacitance)',
    'For AC voltage: set to V~, insert black probe in COM port, red in VΩ port. Touch probes to the two points you want to measure across',
    'For resistance: TURN OFF POWER FIRST. Set to Ω. Touch probes across the component. Read ohms on display',
    'For capacitance: TURN OFF POWER. Discharge the capacitor first (short terminals with insulated screwdriver). Set to µF. Touch probes to capacitor terminals',
    'For continuity: set to continuity (speaker icon). Touch probes across wire or switch. Beep = continuous path. No beep = open circuit',
    'For amperage (clamp meter): clamp around a SINGLE wire (not the whole cable). Read amps on display',
  ],
  howToRead: 'The display shows the numerical value. Make sure the decimal point is in the right place. AC voltage should read 208-253V for single phase (nominal 240V) or 104-127V (nominal 120V). Resistance of a good wire = near 0 ohms. Open circuit = OL (overload/infinity).',
  calibration: 'Touch probes together on resistance setting — should read 0.0 ohms (or very close). If not, replace leads. Most DMMs are factory calibrated and do not need field calibration.',
  commonMistakes: [
    'Measuring resistance with power ON (damages meter, gives wrong reading)',
    'Using DC voltage setting for AC circuits (reads 0)',
    'Not discharging capacitor before testing (shock hazard)',
    'Clamping around entire cable instead of single wire for amperage',
    'Probes in wrong ports (amp port when measuring voltage = blown fuse)',
    'Ignoring a reading of OL — it means open circuit, not zero',
  ],
  safetyNotes: [
    'Use a CAT III or CAT IV rated meter for HVAC work',
    'Never measure resistance on a live circuit',
    'Discharge capacitors before touching terminals',
    'Inspect probe insulation before each use — cracked insulation = shock risk',
    'Use one hand when possible to avoid current path through your chest',
  ],
  costRange: '$50-$400 (Fluke 117 or 116 recommended for HVAC)',
  modules: ['hvac-02', 'hvac-03', 'hvac-04', 'hvac-05', 'hvac-08', 'hvac-09', 'hvac-10', 'hvac-11'],
});

add({
  id: 'thermometer',
  name: 'Digital Thermometer / Temperature Clamp',
  category: 'measurement',
  whatItIs: 'Measures temperature at specific points in the system. Pipe clamp thermometers attach to copper lines to read suction and liquid line temperatures for superheat/subcooling calculations. Pocket thermometers measure air temperature at supply and return registers.',
  whatItLooksLike: 'Pipe clamp: spring-loaded clamp with a wire lead to a digital readout. Pocket: pen-shaped with a probe tip. Some multimeters have a thermocouple input (K-type).',
  whenToUse: 'Every cooling diagnostic. Clamp to suction line for superheat calculation, clamp to liquid line for subcooling calculation. Measure supply and return air temps for temperature split.',
  howToUse: [
    'For superheat: clamp pipe thermometer to suction line (large copper pipe) near the outdoor unit service valve',
    'Insulate the clamp with foam tape so ambient air does not affect the reading',
    'Wait 2-3 minutes for the reading to stabilize',
    'Read the temperature — this is your actual suction line temperature',
    'Subtract the saturation temperature (from gauge pressure + PT chart) to get superheat',
    'For subcooling: same process on the liquid line (small copper pipe)',
    'For air temp split: measure supply air temp at a register, then return air temp at the return grille. Difference should be 15-22°F for cooling.',
  ],
  howToRead: 'Digital display shows temperature in °F or °C. Make sure you are reading the correct unit. For pipe clamps, the reading is the surface temperature of the pipe, which closely matches the refrigerant temperature inside.',
  commonMistakes: [
    'Not insulating the pipe clamp (ambient air skews reading)',
    'Reading before temperature stabilizes (takes 2-3 minutes)',
    'Clamping to the wrong line (suction vs liquid)',
    'Measuring air temp too close to the unit (not at the register)',
  ],
  safetyNotes: [
    'Suction lines can be very cold (frostbite risk on bare skin)',
    'Discharge lines can exceed 200°F (burn risk)',
  ],
  costRange: '$30-$150',
  modules: ['hvac-02', 'hvac-05', 'hvac-06', 'hvac-07', 'hvac-08'],
});

add({
  id: 'micron-gauge',
  name: 'Micron Gauge (Digital Vacuum Gauge)',
  category: 'measurement',
  whatItIs: 'Measures deep vacuum levels in microns. A compound gauge cannot accurately read below 1 inch Hg. A micron gauge reads from atmospheric pressure down to single-digit microns. Required for proper evacuation verification.',
  whatItLooksLike: 'Small digital device with a sensor that connects directly to the manifold or system port via a short hose. Digital display shows microns.',
  whenToUse: 'Every time you evacuate a system after opening it for repair. Connect to verify you reach 500 microns or below, then perform a decay test.',
  howToUse: [
    'Connect the micron gauge sensor directly to the system (not at the vacuum pump end of the hose)',
    'Start the vacuum pump with both manifold valves open',
    'Watch the micron gauge — it should steadily drop',
    'When it reaches 500 microns or below, close the manifold valves (isolate the pump)',
    'Watch for decay: if microns rise above 500 within 10 minutes, there is a leak or moisture',
    'If it holds below 500 for 10 minutes, the evacuation is complete',
    'If it rises: reopen valves, continue pumping, or find and fix the leak',
  ],
  howToRead: '500 microns = good evacuation. 1000 microns = acceptable but not ideal. Above 1500 = moisture or leak present. 0 microns = perfect vacuum (theoretical). Atmospheric pressure = 760,000 microns.',
  commonMistakes: [
    'Connecting the gauge at the pump instead of at the system (hose restriction gives false low reading)',
    'Not performing a decay test (pump may pull 500 but system leaks back up)',
    'Using a compound gauge instead of a micron gauge',
    'Rushing — proper evacuation takes time, especially in humid conditions',
  ],
  safetyNotes: [
    'Never open refrigerant to a system under vacuum — charge with nitrogen first to break vacuum, then charge refrigerant',
  ],
  costRange: '$100-$300',
  modules: ['hvac-07', 'hvac-08', 'hvac-10'],
});

add({
  id: 'manometer',
  name: 'Manometer (Gas Pressure Gauge)',
  category: 'measurement',
  whatItIs: 'Measures gas pressure in inches of water column (in. w.c.) or millibar. Used to verify natural gas and propane manifold pressure at the furnace. Also used to measure static pressure in ductwork.',
  whatItLooksLike: 'Digital handheld device with a rubber hose and probe tip. Some are dual-port for measuring pressure differential.',
  whenToUse: 'Every furnace installation and maintenance call. Verify gas manifold pressure (natural gas: 3.5 in. w.c., propane: 10-11 in. w.c.). Measure duct static pressure to verify airflow.',
  howToUse: [
    'For gas pressure: connect hose to the pressure tap on the gas valve (small screw port)',
    'Turn on the furnace and let burners fire',
    'Read manifold pressure on the display — should be 3.5 in. w.c. for natural gas',
    'If incorrect, adjust the gas valve regulator screw (clockwise = increase)',
    'For static pressure: drill a small hole in supply and return ductwork near the unit',
    'Insert the probe tip into the duct, read pressure',
    'Total external static pressure = supply + return (should be under 0.5 in. w.c. for most systems)',
  ],
  howToRead: 'Display shows inches of water column. Natural gas manifold: 3.5 in. w.c. (±0.3). Propane: 10-11 in. w.c. Total duct static: under 0.5 in. w.c. is ideal. Over 0.8 = restricted ductwork or dirty filter.',
  commonMistakes: [
    'Not zeroing the manometer before use',
    'Measuring gas pressure with burners OFF (need to measure under load)',
    'Forgetting to replace the pressure tap screw after testing',
    'Confusing supply static with total static',
  ],
  safetyNotes: [
    'Gas leaks: use soap bubbles to check all connections after adjusting',
    'Never use a match or lighter to check for gas leaks',
    'Replace the pressure tap screw and verify no leak after testing',
  ],
  costRange: '$50-$200',
  modules: ['hvac-04', 'hvac-09', 'hvac-11'],
});

add({
  id: 'combustion-analyzer',
  name: 'Combustion Analyzer',
  category: 'measurement',
  whatItIs: 'Measures flue gas composition: CO (carbon monoxide), O2, CO2, and stack temperature. Calculates combustion efficiency. Required for furnace installation and annual maintenance to verify safe, efficient operation.',
  whatItLooksLike: 'Handheld device with a probe on a flexible metal tube. The probe inserts into the flue pipe. Digital display shows gas readings.',
  whenToUse: 'Every furnace installation, annual maintenance, and any no-heat call where combustion is suspect. Required to verify the furnace is not producing dangerous CO levels.',
  howToUse: [
    'Let the furnace run for 10+ minutes to reach steady state',
    'Insert the probe into the flue pipe through a test hole (drill if needed)',
    'Position the probe tip in the center of the flue gas stream',
    'Wait for readings to stabilize (30-60 seconds)',
    'Record: CO (ppm), O2 (%), CO2 (%), stack temp (°F), efficiency (%)',
    'CO in flue should be under 100 ppm (air-free). Over 100 = problem',
    'CO in living space should be 0 ppm. Any reading requires investigation',
    'Remove probe, seal test hole, document readings on service report',
  ],
  howToRead: 'CO: under 100 ppm in flue is acceptable. 100-400 ppm = needs attention. Over 400 ppm = shut down immediately. O2: 4-9% is normal range. Stack temp: varies by furnace type (80% efficiency = 350-500°F, 90%+ = 100-130°F). Efficiency: 80% for standard, 90-98% for condensing.',
  calibration: 'Most analyzers auto-calibrate on fresh air at startup. Run the fresh air calibration cycle before each use. Sensors have a lifespan (typically 2-5 years) and must be replaced.',
  commonMistakes: [
    'Not letting the furnace reach steady state before testing',
    'Probe not centered in flue gas stream',
    'Not calibrating on fresh air before use',
    'Ignoring elevated CO readings',
    'Testing with the flue pipe disconnected',
  ],
  safetyNotes: [
    'Any CO in the living space is dangerous — investigate immediately',
    'CO over 400 ppm in flue: shut down furnace, red-tag it, notify occupants',
    'Carry a personal CO detector when working on gas appliances',
  ],
  costRange: '$300-$1,500',
  modules: ['hvac-04', 'hvac-09'],
});

// ─── REFRIGERANT TOOLS ──────────────────────────────────

add({
  id: 'vacuum-pump',
  name: 'Vacuum Pump',
  category: 'refrigerant',
  whatItIs: 'Removes air and moisture from a refrigeration system by pulling a deep vacuum. After any repair that opens the system, you must evacuate before recharging. The pump creates a vacuum that boils moisture at room temperature, allowing it to be pulled out as vapor.',
  whatItLooksLike: 'Electric motor with a pump head, oil reservoir, inlet port, and exhaust. Sizes range from 3 CFM (residential) to 12+ CFM (commercial). Has an oil sight glass.',
  whenToUse: 'After any repair that opens the refrigerant circuit: replacing a compressor, condenser, evaporator, metering device, filter-drier, or any brazed connection.',
  howToUse: [
    'Check oil level in sight glass — add vacuum pump oil if low',
    'Connect pump inlet to the center (yellow) hose on the manifold',
    'Open both manifold valves (low and high side)',
    'Connect micron gauge to the system (not at the pump)',
    'Turn on the vacuum pump',
    'Pull vacuum until micron gauge reads 500 microns or below',
    'Close both manifold valves to isolate the pump from the system',
    'Turn off the pump',
    'Watch micron gauge for 10 minutes — should hold below 500',
    'If it rises: reopen valves, continue pumping, or find leak',
    'When decay test passes, system is ready for charging',
  ],
  commonMistakes: [
    'Low oil level — pump cannot pull deep vacuum',
    'Using contaminated oil — change oil between jobs',
    'Connecting micron gauge at the pump instead of the system',
    'Not performing a decay test',
    'Hoses too long or too small diameter — restricts vacuum',
    'Rushing — large systems take hours to evacuate properly',
  ],
  safetyNotes: [
    'Vacuum pump oil absorbs moisture and acid — change regularly',
    'Exhaust contains refrigerant vapor — use in ventilated area',
    'Never run pump with inlet capped — damages the pump',
  ],
  costRange: '$150-$600',
  modules: ['hvac-07', 'hvac-08', 'hvac-10'],
});

add({
  id: 'recovery-machine',
  name: 'Refrigerant Recovery Machine',
  category: 'refrigerant',
  whatItIs: 'Removes refrigerant from a system and stores it in a recovery cylinder. Required by law before opening any system for service or before disposing of equipment. The machine has its own compressor that pulls refrigerant out of the system.',
  whatItLooksLike: 'Portable unit with inlet and outlet ports, a compressor, gauges, and a power cord. Some are designed for specific refrigerant types (high-pressure vs low-pressure).',
  whenToUse: 'Before any repair that requires opening the refrigerant circuit. Before disposing of any equipment containing refrigerant. When a system needs to be recharged with fresh refrigerant.',
  howToUse: [
    'Connect inlet hose from recovery machine to the system service port',
    'Connect outlet hose from recovery machine to the recovery cylinder (gray/yellow)',
    'Place recovery cylinder on a scale to monitor weight (do not exceed 80% capacity)',
    'Open valves and turn on the recovery machine',
    'Machine pulls refrigerant from system into the cylinder',
    'Monitor system pressure — recover to required level (0 psig or 10 in. Hg depending on system)',
    'When target is reached, close valves and turn off machine',
    'Weigh the cylinder and record the amount recovered',
    'Label the cylinder with refrigerant type and date',
  ],
  commonMistakes: [
    'Overfilling recovery cylinder above 80% (explosion risk)',
    'Not weighing the cylinder during recovery',
    'Mixing refrigerant types in the same cylinder',
    'Not labeling the cylinder',
    'Using a recovery machine rated for the wrong refrigerant pressure',
  ],
  safetyNotes: [
    'NEVER exceed 80% fill on recovery cylinder',
    'Recovery cylinders must be DOT-rated (gray body, yellow top)',
    'Never refill disposable cylinders',
    'Keep cylinder upright during recovery',
    'Verify refrigerant type before connecting to avoid contamination',
  ],
  costRange: '$500-$2,000',
  modules: ['hvac-06', 'hvac-07', 'hvac-10', 'hvac-16'],
});

add({
  id: 'refrigerant-scale',
  name: 'Refrigerant Scale',
  category: 'refrigerant',
  whatItIs: 'A precision scale for weighing refrigerant during charging and recovery. Charging by weight is the most accurate method. The scale sits under the refrigerant cylinder and shows how much has been added or removed.',
  whatItLooksLike: 'Flat platform scale with a digital display. Some have programmable charge targets with auto-shutoff.',
  whenToUse: 'Every time you charge or recover refrigerant. Weigh-in charging is the most accurate method, especially for systems with a known charge amount on the nameplate.',
  howToUse: [
    'Place the refrigerant cylinder on the scale',
    'Zero/tare the scale with the cylinder on it',
    'Connect hoses and begin charging',
    'Watch the scale — it counts down as refrigerant leaves the cylinder',
    'Stop when you have added the target amount',
    'For recovery: tare with empty recovery cylinder, monitor weight added',
  ],
  commonMistakes: [
    'Not zeroing the scale before starting',
    'Scale on uneven surface (inaccurate reading)',
    'Hose tension pulling on the cylinder (false weight)',
    'Not accounting for refrigerant in the hoses',
  ],
  safetyNotes: ['Keep scale away from heat sources', 'Verify scale accuracy periodically with a known weight'],
  costRange: '$80-$300',
  modules: ['hvac-05', 'hvac-06', 'hvac-07', 'hvac-10'],
});

add({
  id: 'leak-detector',
  name: 'Electronic Leak Detector',
  category: 'refrigerant',
  whatItIs: 'Detects refrigerant leaks by sensing halogenated gas molecules. The most sensitive portable leak detection method. Heated diode and infrared types are most common for HVAC.',
  whatItLooksLike: 'Handheld wand with a flexible probe tip, sensitivity adjustment, and audible/visual alarm. Battery or rechargeable.',
  whenToUse: 'When a system is low on charge, after a repair to verify no leaks, during installation to check all brazed joints and connections.',
  howToUse: [
    'Turn on and let the detector warm up (30-60 seconds)',
    'Calibrate per manufacturer instructions',
    'Move the probe tip slowly (1 inch per second) along joints, connections, and fittings',
    'Start at the TOP of each joint and work down (refrigerant is heavier than air)',
    'When the alarm triggers, stop and pinpoint the exact location',
    'Confirm with soap bubbles on the suspected joint',
    'Mark the leak location for repair',
  ],
  commonMistakes: [
    'Moving the probe too fast (misses small leaks)',
    'Starting at the bottom of joints (refrigerant sinks — start at top)',
    'Using in a windy area (disperses the gas)',
    'Not calibrating before use',
    'Contaminated probe tip (oil, dirt) reduces sensitivity',
  ],
  safetyNotes: [
    'Do not use near open flames (phosgene risk)',
    'Ventilate the area if a large leak is found',
  ],
  costRange: '$100-$500',
  modules: ['hvac-06', 'hvac-07', 'hvac-08', 'hvac-10'],
});

// ─── BRAZING TOOLS ──────────────────────────────────────

add({
  id: 'brazing-torch',
  name: 'Oxy-Acetylene / Air-Acetylene Brazing Torch',
  category: 'brazing',
  whatItIs: 'Joins copper tubing using silver-bearing brazing alloy (Silfos or silver solder). HVAC systems use brazed joints for refrigerant lines because they are stronger and more leak-resistant than soldered joints. Air-acetylene is most common for HVAC field work.',
  whatItLooksLike: 'Torch handle with a tip, connected by hose to an acetylene tank (and oxygen tank for oxy-acetylene). Air-acetylene uses ambient air instead of a separate oxygen tank.',
  whenToUse: 'Replacing a compressor, condenser, evaporator, filter-drier, or any copper line repair. Any joint in the refrigerant circuit must be brazed, not soldered.',
  howToUse: [
    'Purge the lines with dry nitrogen flowing through the system (prevents oxidation inside the pipe)',
    'Clean the copper tube ends with emery cloth or sandpaper',
    'Assemble the joint — tube should insert fully into the fitting',
    'Open acetylene valve slightly, ignite with a striker (NEVER a lighter)',
    'Adjust flame to a neutral or slightly reducing flame (inner cone visible)',
    'Heat the joint evenly — move the flame around the fitting, not just one spot',
    'When the copper reaches brazing temperature (1100-1500°F), touch the brazing rod to the joint',
    'Capillary action pulls the alloy into the joint — do NOT melt the rod with the flame directly',
    'Let the alloy flow completely around the joint',
    'Remove heat and let cool naturally — do not quench with water',
    'Continue nitrogen purge until the joint cools below 500°F',
  ],
  commonMistakes: [
    'Not flowing nitrogen during brazing (creates copper oxide scale inside the pipe that clogs metering devices)',
    'Overheating the joint (burns the alloy, weakens the copper)',
    'Melting the rod with the flame instead of letting the hot copper melt it',
    'Not cleaning the tube ends (contamination prevents alloy flow)',
    'Quenching with water (thermal shock can crack the joint)',
    'Heating one spot instead of moving around the joint',
  ],
  safetyNotes: [
    'Keep a fire extinguisher within reach',
    'Use a heat shield behind the joint to protect nearby surfaces',
    'Wear safety glasses — brazing alloy can splatter',
    'Never braze near refrigerant — evacuate the system first',
    'Acetylene is explosive above 15 psig — never exceed regulator setting',
    'Always use a striker, never a lighter or match',
  ],
  costRange: '$150-$400 (torch kit), $50-$100 (tank refills)',
  modules: ['hvac-02', 'hvac-07', 'hvac-10'],
});

// ─── HAND & POWER TOOLS ─────────────────────────────────

add({
  id: 'tube-cutter',
  name: 'Tube Cutter',
  category: 'hand',
  whatItIs: 'Cuts copper tubing cleanly and squarely. A cutting wheel scores the tube as you rotate the cutter around it, tightening slightly each revolution. Produces a clean cut without copper shavings entering the tube.',
  whatItLooksLike: 'C-shaped body with a cutting wheel and two rollers. A knob tightens the wheel against the tube. Mini cutters fit in tight spaces.',
  whenToUse: 'Any time you need to cut copper refrigerant line, water line, or tubing for a repair or installation.',
  howToUse: [
    'Place the tube in the cutter between the wheel and rollers',
    'Tighten the knob until the wheel just touches the tube',
    'Rotate the cutter around the tube one full turn',
    'Tighten the knob 1/4 turn',
    'Rotate again — repeat until the tube separates',
    'Remove the burr from the inside of the cut with the built-in reamer or a deburring tool',
    'CRITICAL: Always deburr. A burr restricts flow and catches contaminants',
  ],
  commonMistakes: [
    'Tightening too much per revolution (deforms the tube, creates an egg shape)',
    'Not deburring the inside edge (restriction, contamination trap)',
    'Letting copper shavings fall into the tube (clogs metering devices)',
  ],
  safetyNotes: ['Cutting wheel is sharp — handle carefully', 'Copper edges are sharp after cutting'],
  costRange: '$15-$60',
  modules: ['hvac-02', 'hvac-07', 'hvac-10'],
});

add({
  id: 'swaging-flaring-tool',
  name: 'Swaging & Flaring Tool Set',
  category: 'hand',
  whatItIs: 'Swaging expands the end of a copper tube so another tube of the same size can slide inside for brazing (eliminates the need for a coupling fitting). Flaring creates a cone-shaped end on soft copper for flare fittings (mechanical connections without brazing).',
  whatItLooksLike: 'Swaging tool: punch-style or hydraulic expander. Flaring tool: a bar with holes for different tube sizes and a yoke with a cone that presses into the tube end.',
  whenToUse: 'Swaging: when joining two pieces of the same size copper without a coupling. Flaring: when connecting soft copper to a flare fitting (common on mini-splits and gas lines).',
  howToUse: [
    'FLARING: Cut tube squarely and deburr',
    'Slide the flare nut onto the tube BEFORE flaring (you cannot add it after)',
    'Clamp the tube in the flaring bar with the correct amount extending above',
    'Place the yoke over the bar and tighten the cone into the tube end',
    'Tighten evenly until the flare is formed — should be smooth and even',
    'SWAGING: Cut and deburr the tube',
    'Select the correct size swaging punch',
    'Insert the punch into the tube end and drive it in (hammer or hydraulic)',
    'The expanded end should accept the mating tube with a slight friction fit',
  ],
  commonMistakes: [
    'Forgetting to put the flare nut on before flaring (most common mistake)',
    'Uneven flare (causes leaks)',
    'Cracked flare from over-tightening the yoke',
    'Not deburring before flaring (rough edge causes leak path)',
    'Over-swaging (tube wall too thin, weak joint)',
  ],
  safetyNotes: ['Copper edges are sharp', 'Use proper tube support to prevent kinking'],
  costRange: '$30-$150',
  modules: ['hvac-02', 'hvac-07'],
});

add({
  id: 'drill-driver',
  name: 'Cordless Drill/Driver & Impact Driver',
  category: 'power',
  whatItIs: 'Drill/driver for drilling holes and driving screws. Impact driver for driving lag bolts, self-tappers, and removing stubborn fasteners. Every HVAC tech carries both.',
  whatItLooksLike: 'Cordless pistol-grip tools with rechargeable battery packs. Drill has a chuck that accepts round-shank bits. Impact has a hex collet for hex-shank bits.',
  whenToUse: 'Mounting equipment (condensers, air handlers, thermostats), drilling holes for refrigerant lines, driving sheet metal screws on ductwork, removing access panels.',
  howToUse: [
    'Select the correct bit for the task (drill bit for holes, driver bit for screws)',
    'Set the clutch on the drill to prevent over-driving screws into sheet metal',
    'For sheet metal: use self-tapping screws with a hex-head driver',
    'For concrete/masonry: use hammer drill mode with masonry bit',
    'For wood: standard drill bits, hole saws for line sets',
  ],
  commonMistakes: [
    'Using a drill when an impact is needed (strips screws)',
    'Not using the clutch setting (over-drives screws, strips holes)',
    'Dull bits (overheats, wanders, poor hole quality)',
  ],
  safetyNotes: ['Wear safety glasses when drilling', 'Check for wires and pipes before drilling into walls', 'Secure the workpiece — do not hold small pieces by hand'],
  costRange: '$100-$300 (combo kit)',
  modules: ['hvac-02', 'hvac-09', 'hvac-10'],
});

// ─── SAFETY EQUIPMENT ───────────────────────────────────

add({
  id: 'ppe-kit',
  name: 'Personal Protective Equipment (PPE)',
  category: 'safety',
  whatItIs: 'Safety equipment worn on every job. HVAC work involves electrical shock, refrigerant exposure, sharp metal, hot surfaces, and working at heights. PPE is not optional.',
  whatItLooksLike: 'Safety glasses, work gloves (leather for general, insulated for electrical), steel-toe boots, hard hat (when required), hearing protection (near compressors), knee pads.',
  whenToUse: 'Every job, every day. Specific PPE depends on the task.',
  howToUse: [
    'Safety glasses: wear at all times on the job site',
    'Gloves: leather for handling sheet metal and copper; insulated rubber for electrical work above 50V',
    'Steel-toe boots: required on all job sites',
    'Hard hat: required on construction sites and when working below overhead hazards',
    'Hearing protection: when operating power tools or near running compressors for extended periods',
    'Knee pads: when working on rooftop units or ground-level equipment',
  ],
  commonMistakes: [
    'Not wearing safety glasses (metal shavings, brazing splatter)',
    'Using leather gloves for electrical work (not insulated)',
    'Wearing loose clothing near rotating equipment (entanglement)',
  ],
  safetyNotes: [
    'Inspect PPE before each use — replace damaged items',
    'Insulated gloves must be tested per OSHA schedule',
    'Remove jewelry when working on electrical systems',
  ],
  costRange: '$50-$200 (full kit)',
  modules: ['hvac-02', 'hvac-14'],
});

// ─── HELPER ─────────────────────────────────────────────

export function getToolsByModule(moduleId: string): HVACTool[] {
  return HVAC_TOOLS.filter((t) => t.modules.includes(moduleId));
}

export function getToolsByCategory(category: HVACTool['category']): HVACTool[] {
  return HVAC_TOOLS.filter((t) => t.category === category);
}
