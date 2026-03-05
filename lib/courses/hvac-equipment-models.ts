/**
 * Core equipment models for the HVAC Technician training program.
 * Every lab, diagram, troubleshooting scenario, and service call simulation
 * references these same models for consistency across the curriculum.
 */

export interface EquipmentComponent {
  name: string;
  description: string;
  /** Where a technician physically finds this part */
  location: string;
  /** What to check during diagnostics */
  diagnosticPoints: string[];
}

export interface EquipmentModel {
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Which modules use this model */
  moduleIds: string[];
  components: EquipmentComponent[];
  /** Common faults technicians diagnose on this equipment */
  commonFaults: string[];
}

export const HVAC_EQUIPMENT_MODELS: EquipmentModel[] = [
  {
    id: 'split-system-ac',
    name: 'Residential Split-System Air Conditioner',
    shortName: 'Split-System AC',
    description:
      'The most common residential cooling system. An outdoor condenser unit connects to an indoor air handler or furnace with an evaporator coil via refrigerant lines. Technicians service this system more than any other.',
    moduleIds: [
      'hvac-01', 'hvac-02', 'hvac-03', 'hvac-04', 'hvac-05',
      'hvac-06', 'hvac-07', 'hvac-08', 'hvac-11', 'hvac-12',
      'hvac-13', 'hvac-14', 'hvac-16',
    ],
    components: [
      {
        name: 'Compressor',
        description: 'Pumps refrigerant through the system by compressing low-pressure vapor into high-pressure, high-temperature gas.',
        location: 'Inside the outdoor condenser unit, mounted on rubber isolators at the bottom of the cabinet.',
        diagnosticPoints: [
          'Measure amp draw with clamp meter — compare to RLA on nameplate',
          'Check for locked rotor amps (LRA) indicating a seized compressor',
          'Measure winding resistance between C-S, C-R, and S-R terminals',
          'Check for grounded windings (megohm test to ground)',
        ],
      },
      {
        name: 'Condenser Coil',
        description: 'Rejects heat from the high-pressure refrigerant to the outdoor air. Refrigerant enters as hot gas and leaves as warm liquid.',
        location: 'Wraps around the inside perimeter of the outdoor unit cabinet.',
        diagnosticPoints: [
          'Inspect for dirt, debris, or bent fins restricting airflow',
          'Measure discharge pressure — high pressure indicates dirty coil',
          'Check temperature split across coil with thermometer',
        ],
      },
      {
        name: 'Condenser Fan Motor',
        description: 'Pulls outdoor air through the condenser coil to remove heat from the refrigerant.',
        location: 'Mounted at the top of the outdoor unit with the fan blade attached to the shaft.',
        diagnosticPoints: [
          'Check amp draw against nameplate rating',
          'Verify fan blade spins freely with power off',
          'Test run capacitor — weak capacitor causes slow or no start',
          'Listen for bearing noise indicating motor wear',
        ],
      },
      {
        name: 'Run Capacitor',
        description: 'Stores and releases electrical energy to keep the compressor and fan motor running efficiently. Rated in microfarads (µF).',
        location: 'Inside the outdoor unit electrical compartment, usually a silver or black cylinder.',
        diagnosticPoints: [
          'Measure capacitance with multimeter — must be within ±6% of rated value',
          'Inspect for bulging top, oil leaks, or burn marks',
          'A weak capacitor causes hard starting and high amp draw',
        ],
      },
      {
        name: 'Contactor',
        description: 'An electrically controlled switch that connects line voltage to the compressor and fan motor when the thermostat calls for cooling.',
        location: 'Inside the outdoor unit electrical compartment, near the capacitor.',
        diagnosticPoints: [
          'Check for pitted or burned contacts',
          'Measure 24V across the coil terminals when thermostat calls',
          'Verify contacts close fully — stuck open means no cooling',
          'Stuck closed means compressor runs continuously',
        ],
      },
      {
        name: 'Evaporator Coil',
        description: 'Absorbs heat from indoor air. Cold refrigerant flows through the coil while the blower pushes warm air across it.',
        location: 'Mounted above the furnace or inside the air handler, in the supply plenum.',
        diagnosticPoints: [
          'Check for ice buildup indicating low airflow or low charge',
          'Measure temperature drop across coil (should be 15–22°F)',
          'Inspect drain pan and condensate line for clogs',
        ],
      },
      {
        name: 'Metering Device (TXV or Piston)',
        description: 'Creates a pressure drop that converts high-pressure liquid refrigerant into a low-pressure mixture entering the evaporator.',
        location: 'At the inlet of the evaporator coil, connected to the liquid line.',
        diagnosticPoints: [
          'Measure superheat — high superheat may indicate restricted TXV',
          'Check TXV sensing bulb is properly mounted on suction line',
          'Verify subcooling at the condenser outlet',
        ],
      },
      {
        name: 'Air Filter',
        description: 'Removes dust and particles from return air before it passes over the evaporator coil. A dirty filter is the most common cause of airflow problems.',
        location: 'In the return air duct, at the air handler, or in a wall/ceiling return grille.',
        diagnosticPoints: [
          'Inspect visually — replace if light cannot pass through',
          'Measure static pressure drop across filter',
          'Dirty filter causes low airflow, ice on coil, and high head pressure',
        ],
      },
    ],
    commonFaults: [
      'System not cooling — bad capacitor, failed contactor, or tripped breaker',
      'Frozen evaporator coil — dirty filter, low refrigerant charge, or blower failure',
      'High head pressure — dirty condenser coil, failed fan motor, or overcharge',
      'Short cycling — thermostat location, oversized system, or low charge',
      'Compressor not starting — bad capacitor, open overload, or locked rotor',
      'Refrigerant leak — coil corrosion, vibration damage, or poor braze joint',
    ],
  },
  {
    id: 'gas-furnace',
    name: 'Gas Furnace System',
    shortName: 'Gas Furnace',
    description:
      'The primary heating system in most residential buildings. Burns natural gas or propane to heat air, which the blower distributes through ductwork. Technicians must understand combustion, gas piping, and safety controls.',
    moduleIds: ['hvac-04', 'hvac-09', 'hvac-12', 'hvac-13', 'hvac-14', 'hvac-16'],
    components: [
      {
        name: 'Burner Assembly',
        description: 'Mixes gas with air and produces a controlled flame inside the combustion chamber.',
        location: 'At the bottom of the furnace, inside the combustion chamber.',
        diagnosticPoints: [
          'Inspect flame color — blue with small yellow tips is normal',
          'Check for delayed ignition (boom on startup)',
          'Verify gas pressure at manifold with manometer',
        ],
      },
      {
        name: 'Heat Exchanger',
        description: 'Transfers heat from combustion gases to the room air without mixing them. A cracked heat exchanger can leak carbon monoxide into the living space.',
        location: 'Above the burner assembly, inside the furnace cabinet.',
        diagnosticPoints: [
          'Visual inspection for cracks, rust, or holes',
          'CO test in supply air — any reading above 9 ppm is a concern',
          'Flame disturbance test with blower running',
          'A cracked heat exchanger is a safety emergency — red-tag the system',
        ],
      },
      {
        name: 'Blower Motor',
        description: 'Pushes conditioned air through the duct system. Modern furnaces use ECM (variable speed) motors for efficiency.',
        location: 'At the bottom of the furnace, below the heat exchanger.',
        diagnosticPoints: [
          'Check amp draw against nameplate',
          'Verify correct speed tap for heating and cooling',
          'Listen for bearing noise or vibration',
          'ECM motors: check for fault codes on the control board',
        ],
      },
      {
        name: 'Ignition System (HSI / DSI)',
        description: 'Hot surface igniters (HSI) glow red-hot to ignite gas. Direct spark ignition (DSI) uses an electric spark. Older systems use standing pilots.',
        location: 'Near the burner assembly, positioned to ignite the gas stream.',
        diagnosticPoints: [
          'HSI: measure resistance — typically 40–200 ohms when cold',
          'HSI: inspect for cracks in the silicon carbide/nitride element',
          'DSI: verify spark at the electrode gap',
          'Check ignition sequence timing on the control board',
        ],
      },
      {
        name: 'Flame Sensor',
        description: 'Proves flame is present after ignition. If it cannot sense flame within a few seconds, the gas valve closes to prevent gas buildup.',
        location: 'Mounted in the burner assembly, positioned in the flame path.',
        diagnosticPoints: [
          'Measure flame signal in microamps — should be 1–6 µA minimum',
          'Clean with fine abrasive pad if signal is low',
          'A dirty flame sensor is the most common no-heat call',
        ],
      },
      {
        name: 'Gas Valve',
        description: 'Controls gas flow to the burners. Opens when the control board signals demand and the safety circuit is satisfied.',
        location: 'Connected to the gas supply line, near the burner assembly.',
        diagnosticPoints: [
          'Measure 24V at the gas valve when calling for heat',
          'Check inlet and outlet gas pressure with manometer',
          'Verify valve opens and closes properly during cycle',
        ],
      },
      {
        name: 'Control Board',
        description: 'The brain of the furnace. Sequences the ignition process, monitors safety switches, and controls blower operation.',
        location: 'Inside the furnace cabinet, usually behind a removable panel.',
        diagnosticPoints: [
          'Read LED fault codes — refer to the code chart on the panel',
          'Check for burned traces or damaged relays',
          'Verify 24V transformer output and R-C voltage',
        ],
      },
      {
        name: 'Safety Switches',
        description: 'Limit switch (high temperature), pressure switch (draft), and rollout switch (flame) protect against unsafe conditions.',
        location: 'Mounted on the furnace cabinet near the heat exchanger and draft inducer.',
        diagnosticPoints: [
          'Limit switch: opens if supply air exceeds safe temperature',
          'Pressure switch: proves draft inducer is running before gas valve opens',
          'Rollout switch: trips if flame rolls out of the combustion chamber',
          'A tripped safety switch indicates a real problem — do not bypass',
        ],
      },
    ],
    commonFaults: [
      'No heat — dirty flame sensor (most common), failed igniter, or tripped safety',
      'Furnace short cycling — dirty filter, blocked return, or failed limit switch',
      'Delayed ignition — dirty burners, low gas pressure, or cracked igniter',
      'Blower runs continuously — fan switch set to ON, or failed control board relay',
      'Carbon monoxide — cracked heat exchanger, blocked flue, or incomplete combustion',
      'Pressure switch error — blocked condensate drain, failed inducer motor, or cracked hose',
    ],
  },
  {
    id: 'heat-pump',
    name: 'Heat Pump System',
    shortName: 'Heat Pump',
    description:
      'Operates like an air conditioner but can reverse the refrigeration cycle to provide heating. The reversing valve switches between heating and cooling modes. Auxiliary electric heat strips supplement when outdoor temperatures drop too low.',
    moduleIds: ['hvac-04', 'hvac-05', 'hvac-09', 'hvac-11', 'hvac-13', 'hvac-16'],
    components: [
      {
        name: 'Reversing Valve',
        description: 'A 4-way valve that changes refrigerant flow direction, switching the system between heating and cooling modes.',
        location: 'Inside the outdoor unit, connected to the compressor discharge and suction lines.',
        diagnosticPoints: [
          'Check solenoid coil for 24V when mode changes',
          'Measure temperature difference across the valve — should be minimal',
          'A stuck reversing valve causes heating in cooling mode or vice versa',
          'Listen for a click when the thermostat switches modes',
        ],
      },
      {
        name: 'Compressor',
        description: 'Same function as in a split-system AC — compresses refrigerant. In a heat pump, it runs in both heating and cooling seasons.',
        location: 'Inside the outdoor unit.',
        diagnosticPoints: [
          'Higher run hours than AC-only systems — check amp draw regularly',
          'Measure suction and discharge pressures in both modes',
          'Check for liquid slugging in heating mode (low outdoor temps)',
        ],
      },
      {
        name: 'Outdoor Coil',
        description: 'Acts as the condenser in cooling mode and the evaporator in heating mode. In heating mode, it absorbs heat from outdoor air.',
        location: 'Wraps around the outdoor unit cabinet.',
        diagnosticPoints: [
          'Check for ice buildup in heating mode — defrost should clear it',
          'Inspect for dirt and debris restricting airflow',
          'In heating mode, the outdoor coil should be cold to the touch',
        ],
      },
      {
        name: 'Defrost Control',
        description: 'Monitors outdoor coil temperature and activates defrost cycle when ice accumulates. Temporarily switches to cooling mode to melt ice off the outdoor coil.',
        location: 'On the control board or as a separate timer/sensor on the outdoor unit.',
        diagnosticPoints: [
          'Verify defrost initiates when coil temperature drops below setpoint',
          'Check defrost termination temperature (typically 50–70°F)',
          'Failed defrost causes ice buildup and reduced heating capacity',
        ],
      },
      {
        name: 'Auxiliary Heat Strips',
        description: 'Electric resistance heating elements that supplement the heat pump when outdoor temperatures are too low for efficient heat pump operation.',
        location: 'Inside the indoor air handler, downstream of the evaporator coil.',
        diagnosticPoints: [
          'Measure amp draw on each heat strip element',
          'Verify sequencer energizes strips in stages',
          'Check that aux heat only activates when needed — running constantly indicates a problem',
        ],
      },
      {
        name: 'Indoor Coil',
        description: 'Acts as the evaporator in cooling mode and the condenser in heating mode. In heating mode, it releases heat into the indoor air.',
        location: 'Inside the air handler, in the supply plenum.',
        diagnosticPoints: [
          'In heating mode, supply air should be warm (not hot like a furnace)',
          'Check for proper refrigerant charge using superheat/subcooling for the current mode',
          'Verify airflow across the coil is adequate',
        ],
      },
    ],
    commonFaults: [
      'Stuck reversing valve — system heats when it should cool or vice versa',
      'Outdoor coil iced over — failed defrost control, low charge, or restricted airflow',
      'Aux heat running constantly — low refrigerant charge, failed compressor, or stuck reversing valve',
      'System not switching modes — bad reversing valve solenoid or thermostat wiring error',
      'Low heating output — normal at low outdoor temps, but check charge and airflow',
      'Defrost not terminating — failed defrost sensor or control board',
    ],
  },
  {
    id: 'packaged-unit',
    name: 'Packaged HVAC Unit (Rooftop Unit)',
    shortName: 'Rooftop Unit',
    description:
      'A self-contained system with heating and cooling components in one cabinet, typically installed on a commercial building roof. Technicians must understand rooftop access safety, economizers, and commercial controls.',
    moduleIds: ['hvac-10', 'hvac-12', 'hvac-14'],
    components: [
      {
        name: 'Compressor Section',
        description: 'Contains the compressor, condenser coil, and condenser fan — similar to a residential condenser but inside the packaged cabinet.',
        location: 'One side of the rooftop unit cabinet.',
        diagnosticPoints: [
          'Same diagnostics as residential condenser components',
          'Check for proper refrigerant charge using manufacturer specs',
          'Verify condenser fan operation and coil cleanliness',
        ],
      },
      {
        name: 'Evaporator Section',
        description: 'Contains the evaporator coil, blower, and air filter — similar to a residential air handler but inside the same cabinet.',
        location: 'The other side of the rooftop unit cabinet.',
        diagnosticPoints: [
          'Measure static pressure across the filter and coil',
          'Check blower belt tension and condition (belt-drive blowers)',
          'Verify proper airflow through the duct system',
        ],
      },
      {
        name: 'Economizer',
        description: 'Uses outdoor air for free cooling when conditions allow. Dampers open to bring in cool outdoor air instead of running the compressor.',
        location: 'On the side of the rooftop unit where outdoor air enters.',
        diagnosticPoints: [
          'Verify damper actuator operates through full range',
          'Check enthalpy or dry-bulb sensor readings',
          'Stuck-open economizer causes heating complaints; stuck-closed wastes energy',
        ],
      },
      {
        name: 'Gas Heat Section',
        description: 'Many packaged units include a gas furnace section for heating. Contains burners, heat exchanger, and gas valve.',
        location: 'Inside the packaged unit cabinet, separate from the refrigeration section.',
        diagnosticPoints: [
          'Same diagnostics as residential gas furnace components',
          'Check combustion air intake is not blocked',
          'Verify gas pressure and flame characteristics',
        ],
      },
      {
        name: 'Supply and Return Duct Connections',
        description: 'Ductwork connects through the roof curb to distribute conditioned air throughout the building.',
        location: 'Bottom of the rooftop unit, through the roof curb.',
        diagnosticPoints: [
          'Check for duct leaks at the roof curb connection',
          'Measure static pressure in supply and return',
          'Verify damper positions in the duct system',
        ],
      },
    ],
    commonFaults: [
      'Economizer stuck open — building too cold, compressor running unnecessarily',
      'Economizer stuck closed — no free cooling, higher energy bills',
      'Belt-drive blower slipping — reduced airflow, comfort complaints',
      'Roof curb leaks — water damage, energy loss, comfort problems',
      'Gas heat not firing — same diagnostics as residential furnace',
      'Compressor failure — same diagnostics as residential split system',
    ],
  },
  {
    id: 'duct-system',
    name: 'Duct Distribution and Airflow System',
    shortName: 'Duct System',
    description:
      'Many HVAC problems are caused by airflow issues, not equipment failure. This model covers supply ducts, return ducts, registers, grilles, filters, and dampers. Technicians must understand how air moves through a building.',
    moduleIds: ['hvac-10', 'hvac-12', 'hvac-13', 'hvac-14'],
    components: [
      {
        name: 'Supply Ducts',
        description: 'Carry conditioned air from the air handler to each room. Can be rigid metal, flex duct, or duct board.',
        location: 'Run from the supply plenum through the attic, crawlspace, or between floors to supply registers.',
        diagnosticPoints: [
          'Check for disconnected or crushed flex duct',
          'Measure airflow at each supply register with an anemometer',
          'Look for duct leaks at connections and joints',
        ],
      },
      {
        name: 'Return Ducts',
        description: 'Carry room air back to the air handler for reconditioning. Undersized returns are a common cause of airflow problems.',
        location: 'Run from return grilles back to the air handler return plenum.',
        diagnosticPoints: [
          'Verify return is not blocked by furniture or closed doors',
          'Measure return static pressure — high negative pressure indicates restriction',
          'Check for duct leaks pulling unconditioned air from attic or crawlspace',
        ],
      },
      {
        name: 'Supply Registers',
        description: 'Adjustable grilles that direct conditioned air into rooms. Can be wall, floor, or ceiling mounted.',
        location: 'In each conditioned room, connected to supply ducts.',
        diagnosticPoints: [
          'Verify registers are open and unobstructed',
          'Measure air temperature at each register',
          'Check for excessive noise indicating high velocity',
        ],
      },
      {
        name: 'Return Grilles',
        description: 'Fixed or filtered grilles where room air enters the return duct system.',
        location: 'Typically in hallways or central areas, sometimes with a filter behind the grille.',
        diagnosticPoints: [
          'Verify grille is not blocked or covered',
          'Check filter behind grille if applicable',
          'Measure return air temperature',
        ],
      },
      {
        name: 'Dampers',
        description: 'Adjustable plates inside ducts that control airflow to different zones. Manual dampers are set during installation; automatic dampers are controlled by zone systems.',
        location: 'Inside duct branches, near the supply plenum or at zone takeoffs.',
        diagnosticPoints: [
          'Verify damper position matches the season and zone demand',
          'Check automatic damper actuators for proper operation',
          'A closed damper to an occupied room causes comfort complaints',
        ],
      },
      {
        name: 'Air Filter',
        description: 'Removes particles from return air. A dirty filter is the single most common cause of HVAC performance problems.',
        location: 'At the air handler, in the return duct, or behind a return grille.',
        diagnosticPoints: [
          'Inspect monthly — replace when dirty',
          'Measure pressure drop across filter with manometer',
          'A dirty filter causes low airflow, frozen coils, and high energy bills',
        ],
      },
    ],
    commonFaults: [
      'Low airflow — dirty filter, crushed flex duct, or closed damper',
      'Hot/cold rooms — disconnected duct, closed register, or duct leak',
      'High static pressure — undersized ducts, dirty filter, or too many closed registers',
      'Duct leaks — energy loss, comfort problems, and humidity issues',
      'Noise complaints — high velocity from undersized ducts or damper flutter',
      'Humidity problems — duct leaks pulling in unconditioned air',
    ],
  },
];

/** Look up an equipment model by ID */
export function getEquipmentModel(id: string): EquipmentModel | undefined {
  return HVAC_EQUIPMENT_MODELS.find((m) => m.id === id);
}

/** Get all equipment models used in a given module */
export function getModuleEquipment(moduleId: string): EquipmentModel[] {
  return HVAC_EQUIPMENT_MODELS.filter((m) => m.moduleIds.includes(moduleId));
}
