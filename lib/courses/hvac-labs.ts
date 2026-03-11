import type { LabConfig } from '@/components/lms/DragDropLab';

/**
 * Interactive drag-and-drop lab simulations for hands-on HVAC lessons.
 * Maps lesson UUID → lab config.
 */

// Lesson 8: System Components Identification
const SYSTEM_COMPONENTS_LAB: LabConfig = {
  id: 'lab-system-components',
  title: 'Identify HVAC System Components',
  instruction: 'Drag each component name to its correct location on the system diagram.',
  backgroundColor: '#0A1628',
  dropZones: [
    { id: 'z-compressor', label: 'Outdoor Unit (Bottom)', x: 20, y: 70, correctItemId: 'compressor' },
    { id: 'z-condenser', label: 'Outdoor Unit (Top)', x: 20, y: 30, correctItemId: 'condenser' },
    { id: 'z-evaporator', label: 'Indoor Unit (Top)', x: 80, y: 30, correctItemId: 'evaporator' },
    { id: 'z-metering', label: 'Between Units', x: 50, y: 50, correctItemId: 'metering' },
    { id: 'z-blower', label: 'Indoor Unit (Bottom)', x: 80, y: 70, correctItemId: 'blower' },
  ],
  draggables: [
    { id: 'compressor', label: 'Compressor' },
    { id: 'condenser', label: 'Condenser Coil' },
    { id: 'evaporator', label: 'Evaporator Coil' },
    { id: 'metering', label: 'Metering Device (TXV)' },
    { id: 'blower', label: 'Blower Fan' },
  ],
  successMessage: 'You correctly identified all 5 major components. The compressor and condenser are in the outdoor unit. The evaporator and blower are in the indoor unit. The metering device connects them.',
};

// Lesson 12: Multimeter & Amp Clamp Lab
const MULTIMETER_LAB: LabConfig = {
  id: 'lab-multimeter',
  title: 'Multimeter Setup Lab',
  instruction: 'Connect the multimeter leads to the correct terminals to measure voltage across the contactor.',
  backgroundColor: '#1a1a2e',
  dropZones: [
    { id: 'z-red-lead', label: 'Line Side L1', x: 30, y: 40, correctItemId: 'red-lead' },
    { id: 'z-black-lead', label: 'Line Side L2', x: 30, y: 60, correctItemId: 'black-lead' },
    { id: 'z-dial', label: 'Meter Dial Setting', x: 70, y: 50, correctItemId: 'vac-setting' },
  ],
  draggables: [
    { id: 'red-lead', label: 'Red Lead (+)' },
    { id: 'black-lead', label: 'Black Lead (COM)' },
    { id: 'vac-setting', label: 'VAC (Voltage AC)' },
    { id: 'ohm-setting', label: 'Ω (Ohms)' },
    { id: 'amp-setting', label: 'AMP (Current)' },
  ],
  successMessage: 'Correct! To measure voltage: set the dial to VAC, place the red lead on L1 and black lead on L2. You should read 240V on a single-phase system.',
};

// Lesson 25: Superheat & Subcooling Lab
const SUPERHEAT_LAB: LabConfig = {
  id: 'lab-superheat',
  title: 'Superheat & Subcooling Measurement',
  instruction: 'Place the gauges and temperature probes at the correct locations to measure superheat and subcooling.',
  backgroundColor: '#0A1628',
  dropZones: [
    { id: 'z-low-gauge', label: 'Suction Line (Low Side)', x: 25, y: 35, correctItemId: 'low-gauge' },
    { id: 'z-high-gauge', label: 'Liquid Line (High Side)', x: 75, y: 35, correctItemId: 'high-gauge' },
    { id: 'z-suction-temp', label: 'Suction Line Temp Probe', x: 25, y: 65, correctItemId: 'suction-temp' },
    { id: 'z-liquid-temp', label: 'Liquid Line Temp Probe', x: 75, y: 65, correctItemId: 'liquid-temp' },
  ],
  draggables: [
    { id: 'low-gauge', label: 'Low-Side Gauge (Blue)' },
    { id: 'high-gauge', label: 'High-Side Gauge (Red)' },
    { id: 'suction-temp', label: 'Temp Clamp (Suction)' },
    { id: 'liquid-temp', label: 'Temp Clamp (Liquid)' },
    { id: 'center-hose', label: 'Center Hose (Yellow)' },
  ],
  successMessage: 'Correct! Superheat = suction line temp minus saturation temp (from low-side gauge). Subcooling = saturation temp (from high-side gauge) minus liquid line temp. These are the two most important diagnostic measurements.',
};

// Lesson 45: Recovery Equipment Lab
const RECOVERY_LAB: LabConfig = {
  id: 'lab-recovery',
  title: 'Refrigerant Recovery Setup',
  instruction: 'Connect the recovery equipment in the correct order to recover refrigerant from a system.',
  backgroundColor: '#0A1628',
  dropZones: [
    { id: 'z-service-valve', label: 'System Service Valve', x: 15, y: 50, correctItemId: 'service-hose' },
    { id: 'z-manifold-in', label: 'Manifold Gauge Input', x: 35, y: 50, correctItemId: 'manifold' },
    { id: 'z-recovery-in', label: 'Recovery Machine Input', x: 55, y: 50, correctItemId: 'recovery-hose' },
    { id: 'z-recovery-out', label: 'Recovery Machine Output', x: 75, y: 50, correctItemId: 'tank-hose' },
    { id: 'z-tank', label: 'Recovery Tank', x: 90, y: 50, correctItemId: 'recovery-tank' },
  ],
  draggables: [
    { id: 'service-hose', label: 'Service Hose' },
    { id: 'manifold', label: 'Manifold Gauge Set' },
    { id: 'recovery-hose', label: 'Recovery Inlet Hose' },
    { id: 'tank-hose', label: 'Tank Connection Hose' },
    { id: 'recovery-tank', label: 'DOT Recovery Tank' },
    { id: 'nitrogen', label: 'Nitrogen Tank' },
  ],
  successMessage: 'Correct! The recovery path is: System → Service Hose → Manifold → Recovery Machine → Recovery Tank. The tank must be DOT-approved and not filled past 80% capacity. This is required by EPA Section 608.',
};

// Lesson 62: Leak Detection Lab
const LEAK_DETECTION_LAB: LabConfig = {
  id: 'lab-leak-detection',
  title: 'Leak Detection Methods',
  instruction: 'Match each leak detection method to the correct application.',
  backgroundColor: '#1a1a2e',
  dropZones: [
    { id: 'z-electronic', label: 'Small Residential Leak', x: 25, y: 30, correctItemId: 'electronic' },
    { id: 'z-bubbles', label: 'Visible Joint Check', x: 75, y: 30, correctItemId: 'soap-bubbles' },
    { id: 'z-uv', label: 'Hard-to-Reach Area', x: 25, y: 70, correctItemId: 'uv-dye' },
    { id: 'z-pressure', label: 'New Installation Test', x: 75, y: 70, correctItemId: 'pressure-test' },
  ],
  draggables: [
    { id: 'electronic', label: 'Electronic Leak Detector' },
    { id: 'soap-bubbles', label: 'Soap Bubble Solution' },
    { id: 'uv-dye', label: 'UV Dye + Black Light' },
    { id: 'pressure-test', label: 'Nitrogen Pressure Test' },
    { id: 'halide-torch', label: 'Halide Torch (Obsolete)' },
  ],
  successMessage: 'Correct! Electronic detectors are most sensitive for small leaks. Soap bubbles confirm exact location at joints. UV dye finds leaks in hard-to-reach areas over time. Nitrogen pressure tests verify new installations before charging.',
};

// Lesson 63: Recovery & Evacuation Lab
const EVACUATION_LAB: LabConfig = {
  id: 'lab-evacuation',
  title: 'System Evacuation Procedure',
  instruction: 'Put the evacuation steps in the correct order by placing them on the timeline.',
  backgroundColor: '#0A1628',
  dropZones: [
    { id: 'z-step1', label: 'Step 1', x: 15, y: 50, correctItemId: 'recover' },
    { id: 'z-step2', label: 'Step 2', x: 30, y: 50, correctItemId: 'connect-pump' },
    { id: 'z-step3', label: 'Step 3', x: 50, y: 50, correctItemId: 'pull-vacuum' },
    { id: 'z-step4', label: 'Step 4', x: 70, y: 50, correctItemId: 'hold-vacuum' },
    { id: 'z-step5', label: 'Step 5', x: 85, y: 50, correctItemId: 'charge' },
  ],
  draggables: [
    { id: 'recover', label: '1. Recover Refrigerant' },
    { id: 'connect-pump', label: '2. Connect Vacuum Pump' },
    { id: 'pull-vacuum', label: '3. Pull to 500 Microns' },
    { id: 'hold-vacuum', label: '4. Hold Vacuum 10 Min' },
    { id: 'charge', label: '5. Charge System' },
    { id: 'leak-test', label: 'Leak Test (Wrong Step)' },
  ],
  successMessage: 'Correct! The evacuation sequence is: Recover all refrigerant → Connect vacuum pump → Pull vacuum to 500 microns → Hold vacuum for 10 minutes (if it rises, there is a leak) → Charge the system. Never use the system compressor as a vacuum pump.',
};

/** Maps lesson UUID → lab config */
export const HVAC_LABS: Record<string, LabConfig> = {
  '317fd364-2d8c-5d5f-9ade-e096ec30ab26': SYSTEM_COMPONENTS_LAB,    // Lesson 8
  '598c6f54-1ea9-5e73-ac5b-f8e29a556110': MULTIMETER_LAB,           // Lesson 12
  'daf39e52-5588-5643-9638-3e990ddd4fda': SUPERHEAT_LAB,            // Lesson 25
  '22f4cbd7-49ea-5fb4-99d0-5d70a9cb876c': RECOVERY_LAB,             // Lesson 45
  '14d196dc-5ed3-54c7-8ac7-5657ccc4abdf': LEAK_DETECTION_LAB,       // Lesson 62
  '09b1654c-b197-5edb-abc1-97b1481f5cd6': EVACUATION_LAB,           // Lesson 63
};
