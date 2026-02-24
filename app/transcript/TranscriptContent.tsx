"use client";

import { Printer, FileText, Shield, CheckCircle2, XCircle, Clock } from "lucide-react";

/*
  Transcript page — displays student competency record.
  In production this would pull from Supabase (student progress, quiz scores, OJT records).
  For now it renders a structured template that demonstrates the format for
  workforce board reviewers and employer partners.
*/

/* ── Domain & Competency Data (mirrors standards page) ── */

const DOMAINS = [
  {
    code: "D1",
    name: "Safety & Regulatory Compliance",
    theoryHours: 14,
    ojtHours: 6,
    competencies: [
      { code: "1.1", name: "Identify program structure, credentials, and career pathways", type: "Theory" },
      { code: "1.2", name: "Explain WIOA funding requirements and attendance policies", type: "Theory" },
      { code: "1.3", name: "Describe HVAC career pathways and earning potential", type: "Theory" },
      { code: "1.4", name: "Select and use appropriate PPE for HVAC work environments", type: "OJT" },
      { code: "1.5", name: "Complete OSHA 30-Hour Construction Safety certification", type: "Partner Cert" },
      { code: "1.6", name: "Identify fall hazards and apply fall protection standards", type: "Theory" },
      { code: "1.7", name: "Apply electrical safety procedures and lockout/tagout", type: "OJT" },
      { code: "1.8", name: "Interpret SDS sheets and apply HazCom standards", type: "Theory" },
      { code: "1.9", name: "Identify confined space and excavation hazards", type: "Theory" },
      { code: "1.10", name: "Apply fire prevention and hot work safety procedures", type: "Theory" },
      { code: "1.11", name: "Complete CPR/First Aid/AED certification", type: "Partner Cert" },
      { code: "1.12", name: "Administer basic first aid for common workplace injuries", type: "Theory" },
    ],
  },
  {
    code: "D2",
    name: "Tools & Trade Math",
    theoryHours: 8,
    ojtHours: 4,
    competencies: [
      { code: "2.1", name: "Explain how heating, cooling, and ventilation systems function", type: "Theory" },
      { code: "2.2", name: "Identify and properly use HVAC hand tools and power tools", type: "OJT" },
      { code: "2.3", name: "Identify major HVAC system components and their functions", type: "Theory" },
    ],
  },
  {
    code: "D3",
    name: "Electrical Fundamentals",
    theoryHours: 10,
    ojtHours: 6,
    competencies: [
      { code: "3.1", name: "Apply Ohm's Law to calculate voltage, current, and resistance", type: "Theory" },
      { code: "3.2", name: "Read and interpret wiring diagrams and schematics", type: "Theory" },
      { code: "3.3", name: "Use a multimeter and amp clamp to measure electrical values", type: "OJT" },
      { code: "3.4", name: "Identify capacitors, contactors, and relays", type: "Theory" },
    ],
  },
  {
    code: "D4",
    name: "Refrigeration Cycle Principles",
    theoryHours: 14,
    ojtHours: 8,
    competencies: [
      { code: "4.1", name: "Identify the four components of the refrigeration cycle", type: "Theory" },
      { code: "4.2", name: "Explain pressure-temperature relationship using PT charts", type: "Theory" },
      { code: "4.3", name: "Compare reciprocating, scroll, and rotary compressor types", type: "Theory" },
      { code: "4.4", name: "Identify TXV, piston, and capillary tube metering devices", type: "Theory" },
      { code: "4.5", name: "Calculate superheat and subcooling from gauge readings", type: "OJT" },
      { code: "4.6", name: "Perform refrigerant charging using weight and superheat methods", type: "OJT" },
    ],
  },
  {
    code: "D5",
    name: "Installation Procedures",
    theoryHours: 16,
    ojtHours: 12,
    competencies: [
      { code: "5.1", name: "Explain gas furnace operation and combustion process", type: "Theory" },
      { code: "5.2", name: "Describe electric heat strip operation and sequencer function", type: "Theory" },
      { code: "5.3", name: "Explain heat pump operation in heating mode", type: "Theory" },
      { code: "5.4", name: "Design and install ductwork per ACCA Manual D standards", type: "Theory" },
      { code: "5.5", name: "Size HVAC equipment using Manual J load calculations", type: "Theory" },
      { code: "5.6", name: "Perform brazing and soldering on copper refrigerant lines", type: "OJT" },
      { code: "5.7", name: "Install refrigerant line sets with proper insulation", type: "OJT" },
      { code: "5.8", name: "Execute system startup procedures and verify operation", type: "OJT" },
      { code: "5.9", name: "Prepare for on-the-job training and internship requirements", type: "Theory" },
    ],
  },
  {
    code: "D6",
    name: "Diagnostics & Troubleshooting",
    theoryHours: 14,
    ojtHours: 10,
    competencies: [
      { code: "6.1", name: "Perform combustion analysis and interpret results", type: "OJT" },
      { code: "6.2", name: "Conduct furnace inspection using manufacturer checklist", type: "OJT" },
      { code: "6.3", name: "Diagnose system faults using manifold gauge readings", type: "OJT" },
      { code: "6.4", name: "Perform leak detection using approved methods", type: "OJT" },
      { code: "6.5", name: "Apply systematic troubleshooting methodology", type: "Theory" },
      { code: "6.6", name: "Diagnose common air conditioning failures", type: "Theory" },
      { code: "6.7", name: "Diagnose common heating system failures", type: "Theory" },
      { code: "6.8", name: "Resolve field troubleshooting scenarios", type: "Theory" },
      { code: "6.9", name: "Communicate technical findings to customers professionally", type: "Theory" },
      { code: "6.10", name: "Prepare a trade-specific resume highlighting certifications", type: "Theory" },
      { code: "6.11", name: "Demonstrate professional interview skills", type: "Theory" },
      { code: "6.12", name: "Identify employer partners and apprenticeship opportunities", type: "Theory" },
    ],
  },
  {
    code: "D7",
    name: "Refrigerant Handling & EPA Compliance",
    theoryHours: 34,
    ojtHours: 4,
    competencies: [
      { code: "7.1", name: "Explain ozone depletion and environmental impact", type: "Theory" },
      { code: "7.2", name: "Identify Clean Air Act Section 608 requirements", type: "Theory" },
      { code: "7.3", name: "Apply refrigerant safety procedures", type: "Theory" },
      { code: "7.4", name: "Classify refrigerants by type, ODP, and GWP", type: "Theory" },
      { code: "7.5", name: "Use pressure-temperature charts for common refrigerants", type: "Theory" },
      { code: "7.6", name: "Demonstrate proper recovery, recycling, and reclamation", type: "OJT" },
      { code: "7.7", name: "Explain refrigerant sales restrictions", type: "Theory" },
      { code: "7.8", name: "Identify small appliance systems and charge limits", type: "Theory" },
      { code: "7.9", name: "Apply Type I recovery requirements", type: "Theory" },
      { code: "7.10", name: "Operate self-contained recovery equipment", type: "OJT" },
      { code: "7.11", name: "Identify leak repair exemptions for small appliances", type: "Theory" },
      { code: "7.12", name: "Describe high-pressure system characteristics", type: "Theory" },
      { code: "7.13", name: "Apply Type II recovery requirements and evacuation levels", type: "Theory" },
      { code: "7.14", name: "Perform leak detection using multiple methods", type: "OJT" },
      { code: "7.15", name: "Execute proper evacuation procedures", type: "OJT" },
      { code: "7.16", name: "Apply leak repair requirements for high-pressure systems", type: "Theory" },
      { code: "7.17", name: "Describe low-pressure chiller system characteristics", type: "Theory" },
      { code: "7.18", name: "Apply Type III recovery requirements", type: "Theory" },
      { code: "7.19", name: "Explain purge unit operation", type: "Theory" },
      { code: "7.20", name: "Identify water management issues in low-pressure systems", type: "Theory" },
      { code: "7.21", name: "Explain rupture disc and pressure relief requirements", type: "Theory" },
    ],
  },
];

const CREDENTIALS = [
  { name: "EPA 608 Universal Certification", issuer: "EPA-approved proctor", status: "pending" },
  { name: "OSHA 30-Hour Construction Safety", issuer: "CareerSafe", status: "pending" },
  { name: "CPR/First Aid/AED", issuer: "HSI", status: "pending" },
  { name: "NRF Rise Up Customer Service", issuer: "NRF Foundation", status: "pending" },
  { name: "Residential HVAC Certification Level 1", issuer: "Elevate for Humanity", status: "pending" },
  { name: "Residential HVAC Certification Level 2", issuer: "Elevate for Humanity", status: "pending" },
];

const TOTAL_THEORY = DOMAINS.reduce((s, d) => s + d.theoryHours, 0);
const TOTAL_OJT = DOMAINS.reduce((s, d) => s + d.ojtHours, 0);

export default function TranscriptContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print button — screen only */}
      <div className="print:hidden max-w-4xl mx-auto px-6 pt-8 flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          <Printer className="w-4 h-4" />
          Print Transcript
        </button>
      </div>

      {/* Transcript Document */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">
        <div className="bg-white border print:border-0 rounded-lg print:rounded-none">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Shield className="w-8 h-8 text-brand-blue-600 print:text-gray-900 mt-1" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Official Student Transcript
                  </h1>
                  <p className="text-sm text-gray-600">
                    Elevate for Humanity — HVAC Technician Training Program
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    CIP Code: 47.0201 &middot; SOC Code: 49-9021 &middot;{" "}
                    {TOTAL_THEORY + TOTAL_OJT} Clock Hours
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Document ID: EFH-TR-______</p>
                <p>
                  Date Issued: ___/___/______
                </p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Student Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-gray-400">Full Name</label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Student ID</label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  Enrollment Date
                </label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  Completion Date
                </label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  Funding Source
                </label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  Program Status
                </label>
                <div className="border-b border-gray-300 h-6 mt-1" />
              </div>
            </div>
          </div>

          {/* Clock Hours Summary */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Clock Hours Summary
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left py-2">Domain</th>
                  <th className="text-center py-2 w-20">Theory</th>
                  <th className="text-center py-2 w-20">OJT</th>
                  <th className="text-center py-2 w-20">Total</th>
                  <th className="text-center py-2 w-20">Completed</th>
                </tr>
              </thead>
              <tbody>
                {DOMAINS.map((d) => (
                  <tr key={d.code} className="border-b last:border-0">
                    <td className="py-2 text-gray-800">
                      {d.code}: {d.name}
                    </td>
                    <td className="text-center py-2 text-gray-600">
                      {d.theoryHours}
                    </td>
                    <td className="text-center py-2 text-gray-600">
                      {d.ojtHours}
                    </td>
                    <td className="text-center py-2 font-medium">
                      {d.theoryHours + d.ojtHours}
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-12 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t-2">
                  <td className="py-2">Total</td>
                  <td className="text-center py-2">{TOTAL_THEORY}</td>
                  <td className="text-center py-2">{TOTAL_OJT}</td>
                  <td className="text-center py-2">
                    {TOTAL_THEORY + TOTAL_OJT}
                  </td>
                  <td className="text-center py-2">
                    <div className="border-b border-gray-300 w-12 mx-auto" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Competency Record */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Competency Mastery Record
            </h2>
            {DOMAINS.map((domain) => (
              <div key={domain.code} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                  {domain.code}: {domain.name}
                </h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="text-left py-1 w-12">Code</th>
                      <th className="text-left py-1">Competency</th>
                      <th className="text-center py-1 w-16">Type</th>
                      <th className="text-center py-1 w-16">Score</th>
                      <th className="text-center py-1 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domain.competencies.map((comp) => (
                      <tr
                        key={comp.code}
                        className="border-b border-gray-100"
                      >
                        <td className="py-1.5 font-mono text-gray-500">
                          {comp.code}
                        </td>
                        <td className="py-1.5 text-gray-700">{comp.name}</td>
                        <td className="text-center py-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              comp.type === "OJT"
                                ? "bg-amber-50 text-amber-700"
                                : comp.type === "Partner Cert"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {comp.type}
                          </span>
                        </td>
                        <td className="text-center py-1.5">
                          <div className="border-b border-gray-300 w-10 mx-auto" />
                        </td>
                        <td className="text-center py-1.5">
                          <div className="border-b border-gray-300 w-10 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Credentials */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Credentials Earned
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left py-2">Credential</th>
                  <th className="text-left py-2">Issuing Body</th>
                  <th className="text-center py-2 w-24">Date Earned</th>
                  <th className="text-center py-2 w-24">Cert #</th>
                </tr>
              </thead>
              <tbody>
                {CREDENTIALS.map((cred) => (
                  <tr key={cred.name} className="border-b last:border-0">
                    <td className="py-2 text-gray-800">{cred.name}</td>
                    <td className="py-2 text-gray-600 text-xs">
                      {cred.issuer}
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-20 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-20 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* OJT Performance Verification */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              OJT Performance Verification
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left py-2">Checksheet</th>
                  <th className="text-left py-2">Competency</th>
                  <th className="text-center py-2 w-16">Result</th>
                  <th className="text-center py-2 w-24">Date</th>
                  <th className="text-center py-2 w-24">Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Brazing & Soldering", code: "5.6" },
                  { name: "Manifold Gauge Reading", code: "6.3" },
                  { name: "Refrigerant Charging", code: "4.6" },
                  { name: "Leak Detection", code: "6.4" },
                  { name: "System Startup & Verification", code: "5.8" },
                ].map((cs) => (
                  <tr key={cs.code} className="border-b last:border-0">
                    <td className="py-2 text-gray-800">{cs.name}</td>
                    <td className="py-2 text-gray-600 text-xs font-mono">
                      {cs.code}
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-12 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-20 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <div className="border-b border-gray-300 w-20 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Program Director Signature
                </label>
                <div className="border-b border-gray-400 h-10" />
                <p className="text-xs text-gray-400 mt-1">Date: ___/___/______</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Registrar / Authorized Official
                </label>
                <div className="border-b border-gray-400 h-10" />
                <p className="text-xs text-gray-400 mt-1">Date: ___/___/______</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-6 text-center">
              This transcript is an official document of Elevate for Humanity.
              Unauthorized alteration or reproduction is prohibited. Verify
              authenticity by contacting records@elevateforhumanity.org.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
