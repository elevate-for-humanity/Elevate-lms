"use client";

import { FileText, Shield, Wrench, Zap, Thermometer, Settings, Search, Snowflake, Clock, CheckCircle2, Building2, GraduationCap } from "lucide-react";

/* ── Competency Framework Data ── */

const DOMAINS = [
  {
    code: "D1",
    name: "Safety & Regulatory Compliance",
    icon: Shield,
    color: "brand-red",
    hours: { theory: 14, ojt: 6 },
    competencies: [
      { code: "1.1", name: "Identify program structure, credentials, and career pathways", lessons: [1, 4, 94] },
      { code: "1.2", name: "Explain WIOA funding requirements and attendance policies", lessons: [2] },
      { code: "1.3", name: "Describe HVAC career pathways and earning potential", lessons: [3] },
      { code: "1.4", name: "Select and use appropriate PPE for HVAC work environments", lessons: [7, 81], verification: "OJT" },
      { code: "1.5", name: "Complete OSHA 30-Hour Construction Safety certification", lessons: [77, 84], verification: "Partner Cert" },
      { code: "1.6", name: "Identify fall hazards and apply fall protection standards", lessons: [78] },
      { code: "1.7", name: "Apply electrical safety procedures and lockout/tagout", lessons: [79], verification: "OJT" },
      { code: "1.8", name: "Interpret SDS sheets and apply HazCom standards", lessons: [80] },
      { code: "1.9", name: "Identify confined space and excavation hazards", lessons: [82] },
      { code: "1.10", name: "Apply fire prevention and hot work safety procedures", lessons: [83] },
      { code: "1.11", name: "Complete CPR/First Aid/AED certification", lessons: [85, 87], verification: "Partner Cert" },
      { code: "1.12", name: "Administer basic first aid for common workplace injuries", lessons: [86] },
    ],
  },
  {
    code: "D2",
    name: "Tools & Trade Math",
    icon: Wrench,
    color: "brand-orange",
    hours: { theory: 8, ojt: 4 },
    competencies: [
      { code: "2.1", name: "Explain how heating, cooling, and ventilation systems function", lessons: [5, 9] },
      { code: "2.2", name: "Identify and properly use HVAC hand tools and power tools", lessons: [6], verification: "OJT" },
      { code: "2.3", name: "Identify major HVAC system components and their functions", lessons: [8] },
    ],
  },
  {
    code: "D3",
    name: "Electrical Fundamentals",
    icon: Zap,
    color: "yellow",
    hours: { theory: 10, ojt: 6 },
    competencies: [
      { code: "3.1", name: "Apply Ohm's Law to calculate voltage, current, and resistance", lessons: [10, 14] },
      { code: "3.2", name: "Read and interpret wiring diagrams and schematics", lessons: [11] },
      { code: "3.3", name: "Use a multimeter and amp clamp to measure electrical values", lessons: [12], verification: "OJT" },
      { code: "3.4", name: "Identify capacitors, contactors, and relays and explain their function", lessons: [13] },
    ],
  },
  {
    code: "D4",
    name: "Refrigeration Cycle Principles",
    icon: Thermometer,
    color: "cyan",
    hours: { theory: 14, ojt: 8 },
    competencies: [
      { code: "4.1", name: "Identify the four components of the refrigeration cycle", lessons: [5, 21, 26] },
      { code: "4.2", name: "Explain pressure-temperature relationship using PT charts", lessons: [22] },
      { code: "4.3", name: "Compare reciprocating, scroll, and rotary compressor types", lessons: [23] },
      { code: "4.4", name: "Identify TXV, piston, and capillary tube metering devices", lessons: [24] },
      { code: "4.5", name: "Calculate superheat and subcooling from gauge readings", lessons: [25], verification: "OJT" },
      { code: "4.6", name: "Perform refrigerant charging using weight and superheat methods", lessons: [60], verification: "OJT" },
    ],
  },
  {
    code: "D5",
    name: "Installation Procedures",
    icon: Settings,
    color: "brand-green",
    hours: { theory: 16, ojt: 12 },
    competencies: [
      { code: "5.1", name: "Explain gas furnace operation and combustion process", lessons: [15, 20] },
      { code: "5.2", name: "Describe electric heat strip operation and sequencer function", lessons: [16] },
      { code: "5.3", name: "Explain heat pump operation in heating mode including reversing valve", lessons: [17] },
      { code: "5.4", name: "Design and install ductwork per ACCA Manual D standards", lessons: [65, 70] },
      { code: "5.5", name: "Size HVAC equipment using Manual J load calculations", lessons: [66] },
      { code: "5.6", name: "Perform brazing and soldering on copper refrigerant lines", lessons: [67], verification: "OJT" },
      { code: "5.7", name: "Install refrigerant line sets with proper insulation and support", lessons: [68], verification: "OJT" },
      { code: "5.8", name: "Execute system startup procedures and verify operation", lessons: [69], verification: "OJT" },
      { code: "5.9", name: "Prepare for on-the-job training and internship requirements", lessons: [93] },
    ],
  },
  {
    code: "D6",
    name: "Diagnostics & Troubleshooting",
    icon: Search,
    color: "purple",
    hours: { theory: 14, ojt: 10 },
    competencies: [
      { code: "6.1", name: "Perform combustion analysis and interpret results", lessons: [18], verification: "OJT" },
      { code: "6.2", name: "Conduct furnace inspection using manufacturer checklist", lessons: [19], verification: "OJT" },
      { code: "6.3", name: "Diagnose system faults using manifold gauge readings", lessons: [61, 64], verification: "OJT" },
      { code: "6.4", name: "Perform leak detection using approved methods", lessons: [62], verification: "OJT" },
      { code: "6.5", name: "Apply systematic troubleshooting methodology", lessons: [71, 76] },
      { code: "6.6", name: "Diagnose common air conditioning failures", lessons: [72] },
      { code: "6.7", name: "Diagnose common heating system failures", lessons: [73] },
      { code: "6.8", name: "Resolve field troubleshooting scenarios using diagnostic data", lessons: [74] },
      { code: "6.9", name: "Communicate technical findings to customers professionally", lessons: [75, 88, 89] },
      { code: "6.10", name: "Prepare a trade-specific resume highlighting certifications", lessons: [90, 95] },
      { code: "6.11", name: "Demonstrate professional interview skills for trade positions", lessons: [91] },
      { code: "6.12", name: "Identify employer partners and apprenticeship opportunities", lessons: [92] },
    ],
  },
  {
    code: "D7",
    name: "Refrigerant Handling & EPA Compliance",
    icon: Snowflake,
    color: "brand-blue",
    hours: { theory: 34, ojt: 4 },
    competencies: [
      { code: "7.1", name: "Explain ozone depletion and environmental impact of refrigerants", lessons: [27, 34, 53, 55] },
      { code: "7.2", name: "Identify Clean Air Act Section 608 requirements and penalties", lessons: [28] },
      { code: "7.3", name: "Apply refrigerant safety procedures including proper ventilation", lessons: [29] },
      { code: "7.4", name: "Classify refrigerants by type, ODP, and GWP", lessons: [30] },
      { code: "7.5", name: "Use pressure-temperature charts for common refrigerants", lessons: [31] },
      { code: "7.6", name: "Demonstrate proper recovery, recycling, and reclamation procedures", lessons: [32, 63], verification: "OJT" },
      { code: "7.7", name: "Explain refrigerant sales restrictions and certification requirements", lessons: [33] },
      { code: "7.8", name: "Identify small appliance systems and refrigerant charge limits", lessons: [35, 39, 54, 56] },
      { code: "7.9", name: "Apply Type I recovery requirements for small appliances", lessons: [36] },
      { code: "7.10", name: "Operate self-contained recovery equipment", lessons: [37], verification: "OJT" },
      { code: "7.11", name: "Identify leak repair exemptions for small appliances", lessons: [38] },
      { code: "7.12", name: "Describe high-pressure system characteristics and components", lessons: [40, 46, 54, 57] },
      { code: "7.13", name: "Apply Type II recovery requirements and evacuation levels", lessons: [41, 45] },
      { code: "7.14", name: "Perform leak detection using electronic, ultrasonic, and UV methods", lessons: [42], verification: "OJT" },
      { code: "7.15", name: "Execute proper evacuation procedures to required micron levels", lessons: [43], verification: "OJT" },
      { code: "7.16", name: "Apply leak repair requirements for high-pressure systems", lessons: [44] },
      { code: "7.17", name: "Describe low-pressure chiller system characteristics", lessons: [47, 52, 54, 58] },
      { code: "7.18", name: "Apply Type III recovery requirements for low-pressure systems", lessons: [48] },
      { code: "7.19", name: "Explain purge unit operation and non-condensable removal", lessons: [49] },
      { code: "7.20", name: "Identify water management issues in low-pressure systems", lessons: [50] },
      { code: "7.21", name: "Explain rupture disc and pressure relief device requirements", lessons: [51] },
    ],
  },
];

const TOTAL_THEORY = DOMAINS.reduce((s, d) => s + d.hours.theory, 0);
const TOTAL_OJT = DOMAINS.reduce((s, d) => s + d.hours.ojt, 0);
const TOTAL_HOURS = TOTAL_THEORY + TOTAL_OJT;
const TOTAL_COMPETENCIES = DOMAINS.reduce((s, d) => s + d.competencies.length, 0);
const OJT_COMPETENCIES = DOMAINS.reduce(
  (s, d) => s + d.competencies.filter((c) => c.verification).length,
  0
);

/* ── Component ── */

export default function HVACStandardsContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-brand-blue-50 rounded-lg">
              <FileText className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-blue-600 uppercase tracking-wide mb-1">
                Elevate for Humanity
              </p>
              <h1 className="text-3xl font-bold text-gray-900">
                HVAC Technician Training Program
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Competency Standards &amp; Performance Requirements
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-8 border-t pt-6">
            <span>Document Version: 1.0</span>
            <span>Effective Date: March 2026</span>
            <span>CIP Code: 47.0201</span>
            <span>SOC Code: 49-9021</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Program Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Program Summary
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-4 text-gray-700 leading-relaxed">
            <p>
              The Elevate HVAC Technician Training Program is a {TOTAL_HOURS}-hour
              competency-based workforce development program that prepares
              students for entry-level HVAC technician positions. The program
              combines {TOTAL_THEORY} hours of online theory instruction with{" "}
              {TOTAL_OJT} hours of supervised on-the-job training (OJT) at
              employer partner sites.
            </p>
            <p>
              Students demonstrate mastery across {TOTAL_COMPETENCIES} competencies
              organized into 7 domains. Theory competencies are assessed through
              quizzes and cumulative exams with a minimum 80% passing score.
              Performance competencies ({OJT_COMPETENCIES} total) require
              hands-on verification by a qualified OJT supervisor using
              standardized skill checksheets.
            </p>
            <p>
              Upon successful completion, students earn six industry-recognized
              credentials: EPA 608 Universal Certification, OSHA 30-Hour
              Construction Safety, CPR/First Aid/AED, NRF Rise Up Customer
              Service, and Elevate Residential HVAC Certification Levels 1
              and 2.
            </p>
          </div>
        </section>

        {/* Clock Hours Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-blue-600" />
            Instructional Clock Hours
          </h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Domain
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Theory Hours
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    OJT Hours
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOMAINS.map((d) => (
                  <tr key={d.code} className="border-b last:border-0">
                    <td className="px-4 py-3 text-gray-800">
                      {d.code}: {d.name}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">
                      {d.hours.theory}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">
                      {d.hours.ojt}
                    </td>
                    <td className="text-center px-4 py-3 font-medium text-gray-800">
                      {d.hours.theory + d.hours.ojt}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="text-center px-4 py-3 text-gray-900">
                    {TOTAL_THEORY}
                  </td>
                  <td className="text-center px-4 py-3 text-gray-900">
                    {TOTAL_OJT}
                  </td>
                  <td className="text-center px-4 py-3 text-gray-900">
                    {TOTAL_HOURS}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Theory hours are delivered via the Elevate LMS platform. OJT hours
            are completed at approved employer partner sites under qualified
            supervisor observation.
          </p>
        </section>

        {/* Delivery Model */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-blue-600" />
            Hybrid Delivery Model
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-4 text-gray-700 leading-relaxed">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Online Theory ({TOTAL_THEORY} hours)
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>Video instruction with closed captions (ADA compliant)</li>
                  <li>Interactive reading materials and diagrams</li>
                  <li>Module quizzes with 80% minimum passing score</li>
                  <li>EPA 608 practice exams (25 questions per section)</li>
                  <li>Cumulative mastery assessments at domain boundaries</li>
                  <li>Sequential lesson locking — no skipping ahead</li>
                  <li>90% video completion required before advancing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  On-the-Job Training ({TOTAL_OJT} hours)
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>Supervised hands-on practice at employer partner sites</li>
                  <li>Standardized skill checksheets for each performance competency</li>
                  <li>Qualified supervisor observation and sign-off</li>
                  <li>Pass/Remediate scoring with documented remediation paths</li>
                  <li>Minimum hour requirements per competency domain</li>
                  <li>Employer partner evaluation of workplace readiness</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Assessment Standards */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-blue-600" />
            Assessment Standards
          </h2>
          <div className="bg-white rounded-lg border p-6">
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Theory Assessments
                </h3>
                <ul className="space-y-1">
                  <li>Minimum passing score: <strong>80%</strong></li>
                  <li>Module quizzes: 10 questions each</li>
                  <li>EPA 608 section exams: 25 questions each</li>
                  <li>EPA 608 Universal exam: 105 questions</li>
                  <li>Cumulative mastery exams at Modules 5, 10, and 13</li>
                  <li>Exam fees and retesting policies vary by certifying organization</li>
                  <li>Wrong-answer explanations for remediation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Performance Assessments (OJT)
                </h3>
                <ul className="space-y-1">
                  <li>Scoring: <strong>Pass / Remediate</strong></li>
                  <li>Observed by qualified OJT supervisor</li>
                  <li>Documented on standardized skill checksheets</li>
                  <li>Supervisor signature and date required</li>
                  <li>Remediation: additional practice + re-assessment</li>
                  <li>5 core performance checksheets required</li>
                </ul>
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                  <p className="font-medium text-gray-800 mb-1">Required Performance Checksheets:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Brazing &amp; Soldering (Competency 5.6)</li>
                    <li>Manifold Gauge Reading (Competency 6.3)</li>
                    <li>Refrigerant Charging (Competency 4.6)</li>
                    <li>Leak Detection (Competency 6.4)</li>
                    <li>System Startup &amp; Verification (Competency 5.8)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competency Domains */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Competency Domains &amp; Standards
          </h2>
          <div className="space-y-8">
            {DOMAINS.map((domain) => {
              const Icon = domain.icon;
              return (
                <div
                  key={domain.code}
                  className="bg-white rounded-lg border overflow-hidden"
                >
                  <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {domain.code}: {domain.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {domain.competencies.length} competencies &middot;{" "}
                        {domain.hours.theory}h theory + {domain.hours.ojt}h OJT
                      </p>
                    </div>
                  </div>
                  <div className="divide-y">
                    {domain.competencies.map((comp) => (
                      <div
                        key={comp.code}
                        className="px-6 py-3 flex items-start gap-4 text-sm"
                      >
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap mt-0.5">
                          {comp.code}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-800">{comp.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Lessons: {comp.lessons.join(", ")}
                            {comp.verification && (
                              <span className="ml-2 inline-flex items-center gap-1 text-brand-green-700 bg-brand-green-50 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                {comp.verification} Verified
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Credentials */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Credentials Awarded
          </h2>
          <div className="bg-white rounded-lg border p-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                { name: "EPA 608 Universal Certification", issuer: "EPA-approved proctor", type: "Federal" },
                { name: "OSHA 30-Hour Construction Safety", issuer: "CareerSafe (OSHA-authorized)", type: "Federal" },
                { name: "CPR/First Aid/AED", issuer: "HSI (OSHA-accepted)", type: "National" },
                { name: "NRF Rise Up Customer Service", issuer: "National Retail Federation", type: "National" },
                { name: "Residential HVAC Certification Level 1", issuer: "Elevate for Humanity", type: "Program" },
                { name: "Residential HVAC Certification Level 2", issuer: "Elevate for Humanity", type: "Program" },
              ].map((cred) => (
                <div key={cred.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <CheckCircle2 className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{cred.name}</p>
                    <p className="text-xs text-gray-500">
                      {cred.issuer} &middot; {cred.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Governance */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Governance &amp; Policies
          </h2>
          <div className="bg-white rounded-lg border p-6 text-sm text-gray-700 space-y-3">
            <p>
              <strong>Attendance:</strong> Students must complete all 95 lessons
              and accumulate the required OJT hours. Consecutive absence of 14+
              days without communication results in administrative withdrawal.
            </p>
            <p>
              <strong>Academic Integrity:</strong> All assessments must be
              completed independently. Sharing quiz answers or misrepresenting
              OJT performance results in disciplinary action up to program
              dismissal.
            </p>
            <p>
              <strong>Grading:</strong> Theory assessments require 80% minimum.
              Performance assessments are Pass/Remediate. Students who do not
              pass a performance competency receive additional supervised
              practice and re-assessment.
            </p>
            <p>
              <strong>ADA Compliance:</strong> All video content includes closed
              captions. Accommodations for documented disabilities are provided
              upon request through the student&apos;s case manager.
            </p>
            <p>
              <strong>Grievance Procedure:</strong> Students may submit
              grievances through the LMS support portal or directly to program
              administration. All grievances receive written response within 5
              business days.
            </p>
            <p>
              <strong>Instructor Qualifications:</strong> All OJT supervisors
              hold a minimum of EPA 608 Universal Certification and 3+ years of
              field experience. Theory content is developed and reviewed by
              licensed HVAC professionals.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-8 space-y-1">
          <p>
            Elevate for Humanity &middot; HVAC Technician Training Program
            &middot; Competency Standards v1.0
          </p>
          <p>
            This document is the intellectual property of Elevate for Humanity.
            Competency framework developed independently and is not affiliated
            with or endorsed by NCCER, AHRI, or any third-party credentialing
            body.
          </p>
        </div>
      </div>
    </div>
  );
}
