/**
 * Visual library for the HVAC Technician training program.
 * Maps every diagram to its category, purpose, and which modules use it.
 * Diagram components reference these IDs so the same visual appears
 * consistently across lessons and labs.
 */

export type DiagramCategory =
  | 'core-system'
  | 'equipment-breakdown'
  | 'electrical'
  | 'airflow'
  | 'diagnostic'
  | 'tool';

export interface DiagramEntry {
  id: string;
  name: string;
  category: DiagramCategory;
  description: string;
  /** What students learn from this diagram */
  learningObjective: string;
  /** Module IDs where this diagram appears */
  moduleIds: string[];
  /** Which equipment model this diagram relates to (if any) */
  equipmentModelId?: string;
  /** Whether an interactive SVG component exists for this diagram */
  hasInteractive: boolean;
  /** Component name if interactive (for dynamic import) */
  componentName?: string;
}

export const DIAGRAM_CATEGORIES: Record<DiagramCategory, { label: string; description: string }> = {
  'core-system': {
    label: 'Core System Diagrams',
    description: 'Show how the entire HVAC system works. Appear in early modules and are reused throughout the program.',
  },
  'equipment-breakdown': {
    label: 'Equipment Breakdown Diagrams',
    description: 'Show internal parts of equipment technicians service. Used in component identification and maintenance modules.',
  },
  electrical: {
    label: 'Electrical System Diagrams',
    description: 'Explain control circuits, wiring, and electrical components. Support the electrical and thermostat modules.',
  },
  airflow: {
    label: 'Airflow & Ventilation Diagrams',
    description: 'Show how conditioned air moves through ductwork. Used in airflow, ventilation, and troubleshooting modules.',
  },
  diagnostic: {
    label: 'Diagnostic & Troubleshooting Diagrams',
    description: 'Help students learn systematic problem-solving. Used in troubleshooting and service call modules.',
  },
  tool: {
    label: 'Tool & Equipment Diagrams',
    description: 'Help students visually recognize diagnostic tools and understand how to use them.',
  },
};

export const HVAC_VISUAL_LIBRARY: DiagramEntry[] = [
  // ── CORE SYSTEM DIAGRAMS ──
  {
    id: 'hvac-system-overview',
    name: 'HVAC System Overview',
    category: 'core-system',
    description:
      'Shows the condenser unit outside, evaporator coil inside, furnace/air handler, ductwork, and thermostat. Arrows illustrate airflow direction and refrigerant flow between indoor and outdoor units.',
    learningObjective: 'Students see how all major parts of the system work together.',
    moduleIds: ['hvac-01', 'hvac-02', 'hvac-05', 'hvac-10', 'hvac-16'],
    equipmentModelId: 'split-system-ac',
    hasInteractive: true,
    componentName: 'HVACSystemOverview',
  },
  {
    id: 'refrigeration-cycle',
    name: 'Refrigeration Cycle',
    category: 'core-system',
    description:
      'Illustrates the four stages: compression, condensation, expansion, and evaporation. Each stage is labeled with pressure and temperature changes. The compressor, condenser coil, expansion device, and evaporator coil are clearly identified.',
    learningObjective: 'Students learn how refrigerant moves through the system and how cooling is produced.',
    moduleIds: ['hvac-05', 'hvac-06', 'hvac-07', 'hvac-08', 'hvac-11', 'hvac-13', 'hvac-16'],
    equipmentModelId: 'split-system-ac',
    hasInteractive: true,
    componentName: 'RefrigerationCycleDiagram',
  },
  {
    id: 'heat-transfer',
    name: 'Heat Transfer Diagram',
    category: 'core-system',
    description:
      'Illustrates how heat moves from inside the building to outside using refrigerant. Shows the direction of heat flow at the evaporator (absorbing) and condenser (rejecting).',
    learningObjective: 'Students understand that HVAC systems move heat, not create cold.',
    moduleIds: ['hvac-02', 'hvac-05'],
    hasInteractive: false,
  },

  // ── EQUIPMENT BREAKDOWN DIAGRAMS ──
  {
    id: 'condenser-breakdown',
    name: 'Condenser Unit Breakdown',
    category: 'equipment-breakdown',
    description:
      'Shows the inside of an outdoor condenser unit with labeled parts: compressor, condenser coil, fan motor, capacitor, contactor, and service valves.',
    learningObjective: 'Students recognize internal components technicians inspect during service calls.',
    moduleIds: ['hvac-02', 'hvac-03', 'hvac-05', 'hvac-11', 'hvac-12', 'hvac-13'],
    equipmentModelId: 'split-system-ac',
    hasInteractive: true,
    componentName: 'CondenserBreakdownDiagram',
  },
  {
    id: 'furnace-breakdown',
    name: 'Furnace / Air Handler Breakdown',
    category: 'equipment-breakdown',
    description:
      'Shows internal components of a furnace: blower motor, heat exchanger, burner assembly, evaporator coil, air filter, control board, and safety switches.',
    learningObjective: 'Students learn the heating and airflow components inside indoor equipment.',
    moduleIds: ['hvac-04', 'hvac-09', 'hvac-12', 'hvac-13'],
    equipmentModelId: 'gas-furnace',
    hasInteractive: true,
    componentName: 'FurnaceBreakdownDiagram',
  },
  {
    id: 'heat-pump-system',
    name: 'Heat Pump System Diagram',
    category: 'equipment-breakdown',
    description:
      'Shows the reversing valve, compressor, outdoor coil, indoor coil, and auxiliary heat strips. Illustrates how the system operates in both heating and cooling modes.',
    learningObjective: 'Students understand how heat pumps reverse the refrigeration cycle for heating.',
    moduleIds: ['hvac-04', 'hvac-09', 'hvac-13'],
    equipmentModelId: 'heat-pump',
    hasInteractive: false,
  },

  // ── ELECTRICAL SYSTEM DIAGRAMS ──
  {
    id: 'thermostat-wiring',
    name: 'Thermostat Wiring Diagram',
    category: 'electrical',
    description:
      'Shows wiring terminals: R (power), C (common), Y (cooling), G (fan), W (heating), and O/B (heat pump reversing valve). Each wire is explained with its function.',
    learningObjective: 'Students learn how thermostats communicate with the HVAC system.',
    moduleIds: ['hvac-03', 'hvac-04', 'hvac-09', 'hvac-11', 'hvac-13'],
    hasInteractive: true,
    componentName: 'ThermostatWiringDiagram',
  },
  {
    id: 'control-circuit',
    name: 'Electrical Control Circuit',
    category: 'electrical',
    description:
      'Shows how the thermostat activates the contactor through the 24V control circuit, starting the compressor and fan. Includes transformer, relay, and safety switches.',
    learningObjective: 'Students learn how the thermostat signals the system to turn on.',
    moduleIds: ['hvac-03', 'hvac-04', 'hvac-11'],
    hasInteractive: true,
    componentName: 'ElectricalCircuitDiagram',
  },
  {
    id: 'capacitor-diagram',
    name: 'Capacitor Diagram',
    category: 'electrical',
    description:
      'Illustrates how start and run capacitors support motor operation. Shows dual-run capacitor with HERM, FAN, and C terminals.',
    learningObjective: 'Students learn how capacitors help motors start and run efficiently.',
    moduleIds: ['hvac-03', 'hvac-13'],
    hasInteractive: false,
  },

  // ── AIRFLOW & VENTILATION DIAGRAMS ──
  {
    id: 'duct-distribution',
    name: 'Duct Distribution Diagram',
    category: 'airflow',
    description:
      'Shows how conditioned air moves through ductwork from the air handler into different rooms. Supply ducts, return ducts, registers, and air filters are labeled.',
    learningObjective: 'Students learn how air circulation affects comfort and system efficiency.',
    moduleIds: ['hvac-10', 'hvac-12', 'hvac-13'],
    equipmentModelId: 'duct-system',
    hasInteractive: true,
    componentName: 'DuctDistributionDiagram',
  },
  {
    id: 'static-pressure',
    name: 'Static Pressure Diagram',
    category: 'airflow',
    description:
      'Illustrates how airflow restrictions affect system performance. Shows measurement points for total external static pressure.',
    learningObjective: 'Students learn how to measure and interpret static pressure readings.',
    moduleIds: ['hvac-10', 'hvac-12'],
    equipmentModelId: 'duct-system',
    hasInteractive: false,
  },
  {
    id: 'air-filtration',
    name: 'Air Filtration Diagram',
    category: 'airflow',
    description:
      'Shows how filters protect equipment and improve indoor air quality. Illustrates MERV ratings and filter placement.',
    learningObjective: 'Students understand filter selection and maintenance.',
    moduleIds: ['hvac-10', 'hvac-12'],
    hasInteractive: false,
  },

  // ── DIAGNOSTIC & TROUBLESHOOTING DIAGRAMS ──
  {
    id: 'troubleshooting-flowchart',
    name: 'HVAC Troubleshooting Flowchart',
    category: 'diagnostic',
    description:
      'Shows a logical troubleshooting process: check thermostat → inspect airflow → measure refrigerant pressure → test electrical components. Branches for no-cool, no-heat, and short-cycling complaints.',
    learningObjective: 'Students learn systematic problem-solving instead of guessing.',
    moduleIds: ['hvac-13', 'hvac-14', 'hvac-16'],
    hasInteractive: true,
    componentName: 'TroubleshootingFlowchart',
  },
  {
    id: 'pt-chart',
    name: 'Pressure-Temperature Chart',
    category: 'diagnostic',
    description:
      'Shows the relationship between refrigerant pressure and saturation temperature for R-410A and R-22. Used to calculate superheat and subcooling.',
    learningObjective: 'Students learn to convert between pressure and temperature for diagnostics.',
    moduleIds: ['hvac-05', 'hvac-06', 'hvac-08', 'hvac-11'],
    hasInteractive: false,
  },
  {
    id: 'system-diagnostic-points',
    name: 'System Diagnostic Points',
    category: 'diagnostic',
    description:
      'Illustrates where technicians connect gauges, thermometers, and test instruments on a split system. Shows suction line, liquid line, and electrical measurement points.',
    learningObjective: 'Students learn where to take measurements during diagnostics.',
    moduleIds: ['hvac-05', 'hvac-08', 'hvac-11', 'hvac-13'],
    equipmentModelId: 'split-system-ac',
    hasInteractive: false,
  },

  // ── TOOL & EQUIPMENT DIAGRAMS ──
  {
    id: 'multimeter-diagram',
    name: 'Multimeter Diagram',
    category: 'tool',
    description:
      'Labels the dial positions for voltage (AC/DC), resistance (ohms), continuity, capacitance, and amperage. Shows proper probe placement for each measurement.',
    learningObjective: 'Students learn to select the correct meter function and connect probes safely.',
    moduleIds: ['hvac-03', 'hvac-04', 'hvac-13'],
    hasInteractive: false,
  },
  {
    id: 'manifold-gauge',
    name: 'Manifold Gauge Set Diagram',
    category: 'tool',
    description:
      'Shows the high-pressure (red) and low-pressure (blue) gauges, center hose (yellow), and valve positions. Labels suction, discharge, and service connections.',
    learningObjective: 'Students learn how to connect and read a gauge manifold.',
    moduleIds: ['hvac-02', 'hvac-05', 'hvac-08', 'hvac-11'],
    hasInteractive: false,
  },
  {
    id: 'recovery-machine',
    name: 'Refrigerant Recovery Machine Diagram',
    category: 'tool',
    description:
      'Explains how refrigerant is removed from systems into recovery cylinders. Shows connections, valve positions, and the recovery process.',
    learningObjective: 'Students learn proper refrigerant recovery procedures.',
    moduleIds: ['hvac-06', 'hvac-07', 'hvac-08', 'hvac-16'],
    hasInteractive: false,
  },
  {
    id: 'vacuum-pump',
    name: 'Vacuum Pump Diagram',
    category: 'tool',
    description:
      'Explains how moisture and non-condensable gases are removed from refrigerant lines. Shows connections to the manifold and micron gauge.',
    learningObjective: 'Students learn proper evacuation procedures.',
    moduleIds: ['hvac-08', 'hvac-11', 'hvac-12'],
    hasInteractive: false,
  },
];

/** Get all diagrams for a specific module */
export function getModuleDiagrams(moduleId: string): DiagramEntry[] {
  return HVAC_VISUAL_LIBRARY.filter((d) => d.moduleIds.includes(moduleId));
}

/** Get all diagrams in a category */
export function getDiagramsByCategory(category: DiagramCategory): DiagramEntry[] {
  return HVAC_VISUAL_LIBRARY.filter((d) => d.category === category);
}

/** Get all interactive diagrams (ones with SVG components) */
export function getInteractiveDiagrams(): DiagramEntry[] {
  return HVAC_VISUAL_LIBRARY.filter((d) => d.hasInteractive);
}

/** Get a specific diagram by ID */
export function getDiagram(id: string): DiagramEntry | undefined {
  return HVAC_VISUAL_LIBRARY.find((d) => d.id === id);
}
