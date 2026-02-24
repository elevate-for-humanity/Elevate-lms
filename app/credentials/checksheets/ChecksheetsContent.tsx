"use client";

import { Printer, ClipboardCheck } from "lucide-react";
import { useState } from "react";

/* ── Checksheet Data ── */

interface CheckItem {
  id: string;
  task: string;
  criteria: string;
}

interface Checksheet {
  id: string;
  title: string;
  competencyCode: string;
  competencyName: string;
  domain: string;
  estimatedMinutes: number;
  tools: string[];
  safetyRequirements: string[];
  items: CheckItem[];
}

const CHECKSHEETS: Checksheet[] = [
  {
    id: "brazing",
    title: "Brazing & Soldering",
    competencyCode: "5.6",
    competencyName:
      "Perform brazing and soldering on copper refrigerant lines",
    domain: "D5: Installation Procedures",
    estimatedMinutes: 60,
    tools: [
      "Oxy-acetylene torch kit",
      "Nitrogen regulator and tank",
      "Copper tubing (3/8\" and 3/4\")",
      "Silver brazing alloy (15% silver minimum)",
      "Flux (if required by alloy type)",
      "Tube cutter and deburring tool",
      "Fire extinguisher (ABC rated)",
      "Heat shield / fire blanket",
    ],
    safetyRequirements: [
      "Safety glasses with shade lens",
      "Leather welding gloves",
      "Fire-resistant clothing (no synthetic fabrics)",
      "Fire extinguisher within arm's reach",
      "Combustibles cleared 35 feet from work area",
      "Nitrogen flowing through pipe during brazing",
    ],
    items: [
      { id: "B1", task: "Set up oxy-acetylene equipment and check for leaks", criteria: "No leaks detected at all connections; regulators set to proper pressures" },
      { id: "B2", task: "Cut copper tubing square using tube cutter", criteria: "Cut is square within 1/16\"; no deformation of tube" },
      { id: "B3", task: "Deburr inside and outside of cut tube", criteria: "All burrs removed; no copper shavings inside tube" },
      { id: "B4", task: "Properly size and assemble joint (tube into fitting)", criteria: "Correct overlap depth; joint assembled without forcing" },
      { id: "B5", task: "Connect nitrogen purge and verify flow", criteria: "Nitrogen flowing at 2-5 PSI through pipe before applying heat" },
      { id: "B6", task: "Apply heat evenly to joint area", criteria: "Heat applied to fitting (not filler); even color change around joint" },
      { id: "B7", task: "Apply brazing alloy and achieve full penetration", criteria: "Alloy drawn into joint by capillary action; visible fillet around entire joint" },
      { id: "B8", task: "Allow joint to cool naturally (no quenching)", criteria: "Joint cooled without water or forced air; no thermal shock" },
      { id: "B9", task: "Pressure test completed joint", criteria: "Joint holds 300+ PSI nitrogen for 10 minutes with no pressure drop" },
      { id: "B10", task: "Shut down equipment and secure work area", criteria: "Tanks closed, hoses bled, area inspected for fire hazards" },
    ],
  },
  {
    id: "gauge-reading",
    title: "Manifold Gauge Reading & Interpretation",
    competencyCode: "6.3",
    competencyName: "Diagnose system faults using manifold gauge readings",
    domain: "D6: Diagnostics & Troubleshooting",
    estimatedMinutes: 45,
    tools: [
      "Manifold gauge set (R-410A rated)",
      "Temperature clamps (suction and liquid line)",
      "PT chart for system refrigerant",
      "Digital thermometer",
      "Notepad for recording readings",
    ],
    safetyRequirements: [
      "Safety glasses",
      "Work gloves (refrigerant protection)",
      "System must be running for minimum 15 minutes before readings",
      "Verify service valve positions before connecting",
    ],
    items: [
      { id: "G1", task: "Identify refrigerant type from equipment data plate", criteria: "Correct refrigerant identified; correct PT chart selected" },
      { id: "G2", task: "Connect manifold gauges to service ports", criteria: "Hoses connected without cross-threading; no refrigerant loss during connection" },
      { id: "G3", task: "Read and record suction (low-side) pressure", criteria: "Accurate reading recorded in PSI; gauge at eye level" },
      { id: "G4", task: "Read and record discharge (high-side) pressure", criteria: "Accurate reading recorded in PSI" },
      { id: "G5", task: "Measure and record suction line temperature", criteria: "Temperature clamp placed 6 inches from compressor; insulated from ambient" },
      { id: "G6", task: "Measure and record liquid line temperature", criteria: "Temperature clamp placed near condenser outlet" },
      { id: "G7", task: "Calculate superheat from readings", criteria: "Correct formula applied: suction line temp - saturation temp = superheat" },
      { id: "G8", task: "Calculate subcooling from readings", criteria: "Correct formula applied: saturation temp - liquid line temp = subcooling" },
      { id: "G9", task: "Interpret readings and state diagnosis", criteria: "Correctly identifies system condition (normal, overcharged, undercharged, restriction, airflow issue)" },
      { id: "G10", task: "Disconnect gauges without refrigerant loss", criteria: "Proper disconnect procedure; minimal refrigerant release" },
    ],
  },
  {
    id: "charging",
    title: "Refrigerant Charging",
    competencyCode: "4.6",
    competencyName:
      "Perform refrigerant charging using weight and superheat methods",
    domain: "D4: Refrigeration Cycle Principles",
    estimatedMinutes: 60,
    tools: [
      "Refrigerant scale (digital, calibrated)",
      "Manifold gauge set",
      "Refrigerant tank (correct type for system)",
      "Temperature clamps",
      "PT chart",
      "Manufacturer data plate / charge specifications",
    ],
    safetyRequirements: [
      "Safety glasses",
      "Refrigerant-rated gloves",
      "Adequate ventilation",
      "Refrigerant tank upright and secured",
      "Never exceed manufacturer-specified charge",
    ],
    items: [
      { id: "C1", task: "Verify system refrigerant type and required charge", criteria: "Correct refrigerant identified from data plate; charge amount documented" },
      { id: "C2", task: "Zero and calibrate refrigerant scale", criteria: "Scale reads 0.0 oz with tank placed; calibration verified" },
      { id: "C3", task: "Connect charging hose to liquid port (for liquid charging)", criteria: "Proper connection; tank inverted or liquid port used for R-410A" },
      { id: "C4", task: "Add refrigerant by weight per manufacturer specification", criteria: "Charge added within ±2 oz of specification" },
      { id: "C5", task: "Monitor suction and discharge pressures during charging", criteria: "Pressures tracked and recorded at 5-minute intervals" },
      { id: "C6", task: "Verify superheat is within target range (fixed orifice)", criteria: "Superheat within manufacturer specification or 10-15°F for TXV" },
      { id: "C7", task: "Verify subcooling is within target range (TXV system)", criteria: "Subcooling within manufacturer specification (typically 10-15°F)" },
      { id: "C8", task: "Check amp draw against nameplate FLA", criteria: "Compressor amps at or below FLA; fan motor amps normal" },
      { id: "C9", task: "Record all final readings as system baseline", criteria: "All pressures, temperatures, and amp readings documented" },
      { id: "C10", task: "Secure refrigerant tank and disconnect equipment", criteria: "Tank valve closed; hoses properly disconnected; no leaks" },
    ],
  },
  {
    id: "leak-detection",
    title: "Leak Detection",
    competencyCode: "6.4",
    competencyName: "Perform leak detection using approved methods",
    domain: "D6: Diagnostics & Troubleshooting",
    estimatedMinutes: 45,
    tools: [
      "Electronic refrigerant leak detector",
      "Soap bubble solution",
      "UV leak detection kit (lamp + dye)",
      "Nitrogen tank and regulator",
      "Manifold gauge set",
    ],
    safetyRequirements: [
      "Safety glasses (UV-blocking for UV detection)",
      "Work gloves",
      "Adequate ventilation in work area",
      "Do not use open flame detectors (halide torch) indoors",
    ],
    items: [
      { id: "L1", task: "Verify system has adequate charge for leak detection", criteria: "System has enough refrigerant to produce detectable leak; pressurize with nitrogen if needed" },
      { id: "L2", task: "Calibrate electronic leak detector per manufacturer instructions", criteria: "Detector passes self-test; sensitivity verified with reference leak" },
      { id: "L3", task: "Systematically scan all joints, connections, and fittings", criteria: "Detector probe moved at 1 inch/second, 1/4 inch from surface; all connections checked" },
      { id: "L4", task: "Identify leak location with electronic detector", criteria: "Leak location identified; detector alarm confirmed at specific point" },
      { id: "L5", task: "Confirm exact leak location with soap bubbles", criteria: "Bubbles visible at leak point; exact location marked" },
      { id: "L6", task: "Demonstrate UV dye detection method", criteria: "Explains dye injection process; demonstrates UV lamp scanning technique" },
      { id: "L7", task: "Perform standing pressure test with nitrogen", criteria: "System pressurized to 300 PSI nitrogen; pressure monitored for 30+ minutes" },
      { id: "L8", task: "Document leak location, size estimate, and repair recommendation", criteria: "Written documentation includes location, suspected cause, and recommended repair" },
      { id: "L9", task: "Explain EPA leak repair requirements and timelines", criteria: "Correctly states repair thresholds (10% comfort cooling, 20% commercial refrigeration) and 30-day timeline" },
      { id: "L10", task: "Clean up and secure all detection equipment", criteria: "Detector stored properly; nitrogen tank secured; work area clean" },
    ],
  },
  {
    id: "system-startup",
    title: "System Startup & Verification",
    competencyCode: "5.8",
    competencyName:
      "Execute system startup procedures and verify operation",
    domain: "D5: Installation Procedures",
    estimatedMinutes: 90,
    tools: [
      "Manifold gauge set",
      "Digital multimeter",
      "Amp clamp",
      "Temperature clamps (supply, return, suction, liquid)",
      "Anemometer or manometer (airflow measurement)",
      "Manufacturer installation manual",
      "Startup checklist form",
    ],
    safetyRequirements: [
      "Safety glasses",
      "Verify all electrical connections are tight before energizing",
      "Confirm refrigerant charge before starting compressor",
      "Ensure crankcase heater has been energized for minimum 8 hours (if applicable)",
    ],
    items: [
      { id: "S1", task: "Verify all electrical connections per wiring diagram", criteria: "All connections match manufacturer diagram; all terminals tight; no exposed conductors" },
      { id: "S2", task: "Verify thermostat wiring and programming", criteria: "Correct wire terminations; thermostat programmed for system type (heat pump vs conventional)" },
      { id: "S3", task: "Check and record voltage at disconnect", criteria: "Voltage within ±10% of nameplate rating; recorded on startup form" },
      { id: "S4", task: "Verify refrigerant charge (by weight or superheat/subcooling)", criteria: "Charge matches manufacturer specification; superheat and subcooling within range" },
      { id: "S5", task: "Start system in cooling mode and verify operation", criteria: "Compressor and fan start; no unusual noises; system runs smoothly" },
      { id: "S6", task: "Measure and record compressor amp draw", criteria: "Amps at or below nameplate RLA/FLA; recorded on startup form" },
      { id: "S7", task: "Measure and record fan motor amp draws", criteria: "Indoor and outdoor fan amps within nameplate ratings" },
      { id: "S8", task: "Measure supply and return air temperatures", criteria: "Temperature split (delta-T) within manufacturer specification (typically 16-22°F cooling)" },
      { id: "S9", task: "Test heating mode operation (if heat pump or furnace)", criteria: "System switches to heating; temperature rise within specification" },
      { id: "S10", task: "Verify defrost operation (heat pump only)", criteria: "Defrost initiates and terminates properly; reversing valve switches" },
      { id: "S11", task: "Check airflow across evaporator coil", criteria: "Airflow meets 400 CFM/ton (±10%); no restrictions or unusual noise" },
      { id: "S12", task: "Complete startup form with all readings and sign", criteria: "All fields completed; readings within specification; technician signature and date" },
    ],
  },
];

/* ── Printable Checksheet Component ── */

function PrintableChecksheet({ sheet }: { sheet: Checksheet }) {
  return (
    <div className="print:break-before-page">
      {/* Header */}
      <div className="border-2 border-gray-900 p-4 mb-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Elevate for Humanity — HVAC Technician Training Program
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              Performance Checksheet: {sheet.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Competency {sheet.competencyCode}: {sheet.competencyName}
            </p>
            <p className="text-xs text-gray-500">
              {sheet.domain} &middot; Estimated time: {sheet.estimatedMinutes}{" "}
              minutes
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Form ID: EFH-CS-{sheet.id.toUpperCase()}</p>
            <p>Version 1.0</p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="border-x-2 border-gray-900 p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="text-xs text-gray-500 block">Student Name</label>
          <div className="border-b border-gray-400 h-6 mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block">Date</label>
          <div className="border-b border-gray-400 h-6 mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block">
            OJT Supervisor Name
          </label>
          <div className="border-b border-gray-400 h-6 mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block">
            Employer Partner
          </label>
          <div className="border-b border-gray-400 h-6 mt-1" />
        </div>
      </div>

      {/* Tools Required */}
      <div className="border-x-2 border-gray-900 p-4 border-t">
        <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
          Required Tools &amp; Materials
        </h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-700">
          {sheet.tools.map((t) => (
            <span key={t}>&#9634; {t}</span>
          ))}
        </div>
      </div>

      {/* Safety */}
      <div className="border-x-2 border-gray-900 p-4 border-t bg-red-50 print:bg-white">
        <h3 className="text-xs font-semibold uppercase text-red-700 mb-2">
          Safety Requirements
        </h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-700">
          {sheet.safetyRequirements.map((s) => (
            <span key={s}>&#9888; {s}</span>
          ))}
        </div>
      </div>

      {/* Performance Items */}
      <table className="w-full border-2 border-gray-900 text-sm">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-100">
            <th className="border border-gray-400 px-2 py-2 text-left w-8">
              #
            </th>
            <th className="border border-gray-400 px-2 py-2 text-left">
              Task
            </th>
            <th className="border border-gray-400 px-2 py-2 text-left">
              Acceptance Criteria
            </th>
            <th className="border border-gray-400 px-2 py-2 text-center w-16">
              Pass
            </th>
            <th className="border border-gray-400 px-2 py-2 text-center w-24">
              Remediate
            </th>
          </tr>
        </thead>
        <tbody>
          {sheet.items.map((item) => (
            <tr key={item.id}>
              <td className="border border-gray-400 px-2 py-2 text-xs font-mono text-gray-500">
                {item.id}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-gray-800">
                {item.task}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-xs text-gray-600">
                {item.criteria}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <div className="w-5 h-5 border border-gray-400 mx-auto" />
              </td>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <div className="w-5 h-5 border border-gray-400 mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Result & Signatures */}
      <div className="border-x-2 border-b-2 border-gray-900 p-4">
        <div className="grid grid-cols-3 gap-6 text-sm mb-6">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Overall Result
            </label>
            <div className="flex gap-4">
              <span>&#9634; PASS</span>
              <span>&#9634; REMEDIATE</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Attempts
            </label>
            <div className="flex gap-4">
              <span>&#9634; 1st</span>
              <span>&#9634; 2nd</span>
              <span>&#9634; 3rd</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Time Taken
            </label>
            <div className="border-b border-gray-400 h-5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <label className="text-xs text-gray-500 block">
              Supervisor Signature
            </label>
            <div className="border-b border-gray-400 h-8 mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">
              Student Signature
            </label>
            <div className="border-b border-gray-400 h-8 mt-1" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Supervisor: By signing, you verify that the student performed all
          tasks under your direct observation and met the acceptance criteria
          indicated. Remediation notes should be documented on the reverse side.
        </p>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function ChecksheetsContent() {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen view: index */}
      <div className="print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-7 h-7 text-brand-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              OJT Performance Checksheets
            </h1>
          </div>
          <p className="text-gray-600 mb-8">
            These checksheets are used by OJT supervisors at employer partner
            sites to verify hands-on competency. Select a checksheet to view and
            print.
          </p>

          <div className="grid gap-4">
            {CHECKSHEETS.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() =>
                  setSelected(selected === sheet.id ? null : sheet.id)
                }
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selected === sheet.id
                    ? "border-brand-blue-500 bg-brand-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {sheet.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Competency {sheet.competencyCode} &middot; {sheet.domain}{" "}
                      &middot; {sheet.items.length} tasks &middot;{" "}
                      {sheet.estimatedMinutes} min
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    EFH-CS-{sheet.id.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="mt-8">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                >
                  <Printer className="w-4 h-4" />
                  Print Checksheet
                </button>
              </div>
              <PrintableChecksheet
                sheet={CHECKSHEETS.find((s) => s.id === selected)!}
              />
            </div>
          )}
        </div>
      </div>

      {/* Print view: show selected or all */}
      <div className="hidden print:block p-4">
        {selected ? (
          <PrintableChecksheet
            sheet={CHECKSHEETS.find((s) => s.id === selected)!}
          />
        ) : (
          CHECKSHEETS.map((sheet) => (
            <PrintableChecksheet key={sheet.id} sheet={sheet} />
          ))
        )}
      </div>
    </div>
  );
}
