// Maps lesson UUIDs to simulation keys
export const lessonUuidToSimulationKey: Record<string, keyof typeof hvacLessonSimulations> = {
  '2f172cb2-4657-5460-9b93-f9b062ad8dd2': 'hvac-01-01',
  'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56': 'hvac-module-1', // How HVAC Systems Work — condenser unit lab
}

export const hvacLessonSimulations = {
  'hvac-module-1': {
    modelPath: '/models/hvac-condenser.glb',
    title: 'Residential Condenser Unit — Identify the Components',
    teaching: {
      intro: 'The condenser unit is the outdoor half of a split air conditioning system. It contains the components responsible for compressing refrigerant, rejecting heat to the outdoor air, and controlling electrical power to the system. Study these five components before you interact with the 3D model.',
      components: [
        {
          id: 'compressor',
          name: 'Compressor',
          location: 'Inside the lower section of the condenser cabinet',
          function: 'Pumps refrigerant through the entire system. It receives low-pressure, low-temperature gas from the evaporator (indoor coil) and compresses it into high-pressure, high-temperature gas that flows to the condenser coil.',
          whyItMatters: 'The compressor is the most expensive component in the system. A failed compressor usually means a full system replacement on older units.',
          fieldTip: 'Always check amperage draw against the nameplate rating. High amps with low cooling output often indicates a failing compressor.',
        },
        {
          id: 'fan-motor',
          name: 'Fan Motor',
          location: 'Top of the condenser unit, behind the protective grille',
          function: 'Pulls outdoor air across the condenser coil so the refrigerant inside can release heat and change from a high-pressure gas back to a high-pressure liquid. The fan is driven by a dedicated motor mounted to the fan shroud.',
          whyItMatters: 'If the condenser fan fails, the unit cannot reject heat. High-side pressure will spike, the compressor will overheat, and the system will shut down on a safety limit.',
          fieldTip: 'Spin the fan blade by hand with the power off. If it does not spin freely, the motor bearings are failing. Check the fan capacitor before replacing the motor.',
        },
        {
          id: 'capacitor',
          name: 'Capacitor',
          location: 'Mounted inside the electrical compartment panel — usually a silver or gold cylinder',
          function: 'Stores and releases electrical energy to start and run the compressor and fan motors. A dual-run capacitor handles both motors from one unit. A start capacitor provides extra torque during startup only.',
          whyItMatters: 'Capacitors are the single most common failure point in residential HVAC. A weak capacitor causes hard starting, overheating, and eventual motor burnout.',
          fieldTip: 'Test with a multimeter set to microfarads (µF). If the reading is more than 10% below the rated value printed on the capacitor, replace it.',
        },
        {
          id: 'contactor',
          name: 'Contactor',
          location: 'Inside the electrical compartment, between the power supply and the compressor/fan motor',
          function: 'An electrically controlled switch. When the thermostat calls for cooling, it sends 24V to the contactor coil, which pulls the contacts closed and connects line voltage (240V) to the compressor and fan motor.',
          whyItMatters: 'A stuck or pitted contactor can cause the system to run continuously or not start at all. Burned contacts increase resistance and waste energy.',
          fieldTip: 'Look for pitting or burn marks on the contact surfaces. If the contacts are visibly damaged, replace the contactor — do not file them smooth.',
        },
        {
          id: 'service-valves',
          name: 'Service Valves',
          location: 'On the refrigerant lines where they exit the condenser unit — typically two copper tubes of different diameters',
          function: 'Provide access points for technicians to connect gauge manifolds, measure system pressures, add or recover refrigerant, and perform vacuum and leak tests. The larger line is the suction (vapor) line; the smaller line is the liquid line.',
          whyItMatters: 'Service valves are the only way to measure operating pressures and charge the system. Damaged valve cores cause refrigerant leaks.',
          fieldTip: 'Always replace Schrader valve cores and caps after service. A missing cap is the number one cause of slow refrigerant leaks at the service valve.',
        },
      ],
    },
    hotspots: [
      {
        id: 'compressor',
        label: 'Compressor',
        description: 'Pumps refrigerant through the system by compressing low-pressure gas into high-pressure, high-temperature gas. Common problems: high amperage draw, hard starting, overheating, mechanical seizure. A failed compressor is the most expensive condenser repair.',
        position: [0.15, 0.3, 0.1] as [number, number, number],
      },
      {
        id: 'fan-motor',
        label: 'Fan Motor',
        description: 'Drives the fan blade that pulls outdoor air across the condenser coil to reject heat. Common problems: seized bearings, weak capacitor causing slow startup, overheating from restricted airflow. Spin the blade by hand — it should rotate freely.',
        position: [0, 1.35, 0] as [number, number, number],
      },
      {
        id: 'capacitor',
        label: 'Capacitor',
        description: 'Stores and releases electrical energy to start and run the compressor and fan motors. Common problems: bulging top, leaking oil, low µF reading. The #1 most common failure point in residential HVAC — always test with a multimeter.',
        position: [-0.35, 0.35, 0.15] as [number, number, number],
      },
      {
        id: 'contactor',
        label: 'Contactor',
        description: 'Electrically controlled switch that connects 240V line voltage to the compressor and fan motor when the thermostat calls for cooling. Common problems: pitted or burned contacts, stuck coil, chattering. Inspect contact surfaces for carbon buildup.',
        position: [-0.15, 0.45, 0.45] as [number, number, number],
      },
      {
        id: 'condenser-coil',
        label: 'Condenser Coil',
        description: 'Copper tubing with aluminum fins wrapping the inside of the cabinet. Hot refrigerant gas flows through and releases heat to outdoor air. Common problems: dirty or clogged fins, bent fins restricting airflow, corrosion from chemicals or salt air. Clean from inside out with low-pressure water.',
        position: [0.55, 0.6, 0] as [number, number, number],
      },
      {
        id: 'refrigerant-lines',
        label: 'Refrigerant Lines',
        description: 'Two copper tubes connecting the condenser to the indoor evaporator. The larger insulated line is the suction (vapor) line; the smaller uninsulated line is the liquid line. Common problems: refrigerant leaks at fittings, missing insulation on suction line, oil stains indicating a slow leak.',
        position: [0.45, 0.25, 0] as [number, number, number],
      },
      {
        id: 'service-valves',
        label: 'Service Valves',
        description: 'Access ports on the refrigerant lines for connecting gauge manifolds. Used to measure pressures, charge or recover refrigerant, and perform vacuum tests. Common problems: missing caps causing slow leaks, damaged Schrader valve cores, cross-threaded fittings.',
        position: [0.45, 0.45, 0] as [number, number, number],
      },
    ],
    requiredHotspotIds: ['compressor', 'fan-motor', 'capacitor', 'contactor', 'condenser-coil', 'refrigerant-lines', 'service-valves'],
  },
} as const
