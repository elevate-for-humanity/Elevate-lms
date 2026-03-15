'use client';

/**
 * EPA 608 Universal Certification Study Guide
 * Printable and downloadable. Covers all four exam sections.
 * Based on actual ESCO exam content areas.
 */

import React, { useState } from 'react';
import { Printer, Download, BookOpen, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

/* ── Data ─────────────────────────────────────────────────────── */

const REFRIGERANT_TABLE = [
  { name: 'R-12',    type: 'CFC',  odp: '1.0',  gwp: '10,900', color: 'White',      status: 'Banned 1996',        safety: 'A1' },
  { name: 'R-22',    type: 'HCFC', odp: '0.05', gwp: '1,810',  color: 'Green',      status: 'Phased out 2020',    safety: 'A1' },
  { name: 'R-410A',  type: 'HFC',  odp: '0',    gwp: '2,088',  color: 'Rose/Pink',  status: 'Being phased down',  safety: 'A1' },
  { name: 'R-134a',  type: 'HFC',  odp: '0',    gwp: '1,430',  color: 'Light Blue', status: 'Active',             safety: 'A1' },
  { name: 'R-404A',  type: 'HFC',  odp: '0',    gwp: '3,922',  color: 'Orange',     status: 'Being phased down',  safety: 'A1' },
  { name: 'R-32',    type: 'HFC',  odp: '0',    gwp: '675',    color: 'Blue/Red',   status: 'Active (A2L)',       safety: 'A2L' },
  { name: 'R-454B',  type: 'HFO',  odp: '0',    gwp: '466',    color: 'Varies',     status: 'R-410A replacement', safety: 'A2L' },
  { name: 'R-123',   type: 'HCFC', odp: '0.02', gwp: '77',     color: 'Gray',       status: 'Chiller use only',   safety: 'B1' },
  { name: 'R-11',    type: 'CFC',  odp: '1.0',  gwp: '4,750',  color: 'Orange',     status: 'Banned 1996',        safety: 'A1' },
];

const RECOVERY_LEVELS = [
  { system: 'High-pressure < 200 lbs',  level: '0 psig',          note: 'Atmospheric pressure' },
  { system: 'High-pressure ≥ 200 lbs',  level: '10 in. Hg vacuum', note: 'Below atmospheric' },
  { system: 'Low-pressure < 200 lbs',   level: '0 psig',          note: 'Atmospheric pressure' },
  { system: 'Low-pressure ≥ 200 lbs',   level: '25 mm Hg absolute', note: 'Deep vacuum' },
  { system: 'Small appliance (operating)', level: '90% of charge', note: 'By weight' },
  { system: 'Small appliance (non-operating)', level: '80% of charge', note: 'By weight' },
];

const LEAK_RATES = [
  { type: 'Comfort cooling (residential/commercial AC)', rate: '10%', days: '30 days to repair' },
  { type: 'Commercial refrigeration',                    rate: '20%', days: '30 days to repair' },
  { type: 'Industrial process refrigeration',            rate: '35%', days: '30 days to repair' },
];

const PHASE_OUT_TIMELINE = [
  { year: '1996', event: 'CFC production banned in the US (R-12, R-11, R-113)' },
  { year: '2010', event: 'R-22 banned in NEW equipment. Existing systems can still be serviced.' },
  { year: '2018', event: 'EPA 608 certification required to purchase ANY refrigerant (including HFCs)' },
  { year: '2020', event: 'R-22 production and import fully ended. Reclaimed R-22 only.' },
  { year: '2023+', event: 'AIM Act HFC phasedown begins. R-410A being replaced by A2L refrigerants.' },
  { year: '2025+', event: 'New residential AC systems shipping with R-454B (Opteon XL41) instead of R-410A.' },
];

const CERT_TYPES = [
  { type: 'Core',      covers: 'Required for ALL types. Ozone, Clean Air Act, refrigerant safety, recovery basics.' },
  { type: 'Type I',    covers: 'Small appliances — factory-charged, 5 lbs or less. Window units, PTACs, vending machines.' },
  { type: 'Type II',   covers: 'High-pressure systems — R-410A, R-22, R-134a. Residential and commercial AC.' },
  { type: 'Type III',  covers: 'Low-pressure systems — R-11, R-123 centrifugal chillers.' },
  { type: 'Universal', covers: 'Passes all four sections. Work on any system type. Most valuable for technicians.' },
];

const MUST_KNOW_QA = [
  { q: 'Maximum fine for knowingly venting refrigerant?', a: '$44,539 per day per violation (Clean Air Act)' },
  { q: 'What does ODP stand for?', a: 'Ozone Depletion Potential. R-12 = 1.0 (reference). R-410A = 0.' },
  { q: 'What does GWP stand for?', a: 'Global Warming Potential. Measured relative to CO₂ (GWP=1).' },
  { q: 'Recovery cylinder max fill level?', a: '80% of water capacity. Never overfill — liquid expands with heat.' },
  { q: 'DOT hydrostatic retest interval?', a: 'Every 5 years. Expired = cannot be legally refilled.' },
  { q: 'Recovery cylinder color (DOT standard)?', a: 'Gray body, yellow top.' },
  { q: 'R-410A cylinder color?', a: 'Rose/pink.' },
  { q: 'R-22 cylinder color?', a: 'Green.' },
  { q: 'Who can purchase refrigerant (since 2018)?', a: 'Only EPA 608 certified technicians.' },
  { q: 'Difference between recovery, recycling, reclamation?', a: 'Recovery = remove from system. Recycling = clean on-site for reuse. Reclamation = process to ARI 700 purity at certified facility.' },
  { q: 'What gas is NEVER used to pressure test a system?', a: 'Oxygen or compressed air — explosive with refrigerant oil. Use dry nitrogen only.' },
  { q: 'Target vacuum level before charging?', a: '500 microns or below. Verify with micron gauge, not manifold gauge.' },
  { q: 'What is a de minimis release?', a: 'Small unavoidable release when connecting/disconnecting hoses. The only legal release.' },
  { q: 'ASHRAE 34 safety group for R-410A?', a: 'A1 — low toxicity, non-flammable.' },
  { q: 'ASHRAE 34 safety group for R-32 and R-454B?', a: 'A2L — low toxicity, mildly flammable.' },
  { q: 'What does A2L mean?', a: 'Low toxicity (A), mildly flammable (2L). Burning velocity ≤10 cm/s.' },
  { q: 'How long must refrigerant records be kept?', a: '3 years, available for EPA inspection.' },
  { q: 'Leak repair deadline after trigger rate exceeded?', a: '30 days.' },
  { q: 'What is a purge unit on a low-pressure chiller?', a: 'Removes air and non-condensables that leak INTO the system (low-pressure systems operate below atmospheric).' },
  { q: 'Can recovered refrigerant be returned to the same system without reclamation?', a: 'Yes — same owner\'s equipment only. Different owner requires reclamation to ARI 700.' },
];

/* ── Components ───────────────────────────────────────────────── */

function SectionHeader({ number, title, color }: { number: string; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${color} print:break-before-page`}>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${color.replace('border-', 'bg-')}`}>
        {number}
      </span>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function CollapsibleQA() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2 print:space-y-3">
      {MUST_KNOW_QA.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden print:border-slate-300">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white transition print:hidden"
          >
            <span className="font-semibold text-slate-900 text-sm">{i + 1}. {item.q}</span>
            {open === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          </button>
          {/* Always visible in print */}
          <div className={`px-4 pb-3 ${open === i ? 'block' : 'hidden'} print:block`}>
            <p className="hidden print:block font-semibold text-slate-900 text-sm pt-3">{i + 1}. {item.q}</p>
            <p className="text-sm text-brand-green-700 font-semibold mt-1 flex gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 print:hidden" />
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */

export default function StudyGuideClient() {
  const { t } = useI18n();
  const sg = (key: string) => t(`hvac.studyGuide.${key}`);
  const handlePrint = () => window.print();

  const handleDownload = () => {
    const content = buildTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EPA-608-Study-Guide-Elevate.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildTextContent = () => {
    let text = 'EPA 608 UNIVERSAL CERTIFICATION STUDY GUIDE\n';
    text += 'Elevate for Humanity Career & Training Institute\n';
    text += '='.repeat(60) + '\n\n';

    text += 'CERTIFICATION TYPES\n' + '-'.repeat(40) + '\n';
    CERT_TYPES.forEach(c => { text += `${c.type}: ${c.covers}\n`; });

    text += '\nREFRIGERANT QUICK REFERENCE\n' + '-'.repeat(40) + '\n';
    REFRIGERANT_TABLE.forEach(r => {
      text += `${r.name} | ${r.type} | ODP: ${r.odp} | GWP: ${r.gwp} | Color: ${r.color} | ${r.status} | Safety: ${r.safety}\n`;
    });

    text += '\nRECOVERY LEVELS\n' + '-'.repeat(40) + '\n';
    RECOVERY_LEVELS.forEach(r => { text += `${r.system}: ${r.level} (${r.note})\n`; });

    text += '\nLEAK REPAIR TRIGGER RATES\n' + '-'.repeat(40) + '\n';
    LEAK_RATES.forEach(r => { text += `${r.type}: ${r.rate} — ${r.days}\n`; });

    text += '\nPHASE-OUT TIMELINE\n' + '-'.repeat(40) + '\n';
    PHASE_OUT_TIMELINE.forEach(p => { text += `${p.year}: ${p.event}\n`; });

    text += '\n20 MUST-KNOW Q&A\n' + '-'.repeat(40) + '\n';
    MUST_KNOW_QA.forEach((item, i) => {
      text += `${i + 1}. Q: ${item.q}\n   A: ${item.a}\n\n`;
    });

    text += '\n' + '='.repeat(60) + '\n';
    text += 'Elevate for Humanity | Indianapolis, IN\n';
    text += 'ETPL Program #10004322 | WIOA-Approved\n';
    return text;
  };

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print/Download toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900">EPA 608 Study Guide</h1>
            <p className="text-xs text-slate-500">Elevate for Humanity · HVAC Technician Program</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-white text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              {sg('download')}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              {sg('print')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-0 space-y-10">

        {/* Cover */}
        <div className="text-center py-8 print:py-4">
          <div className="inline-flex items-center gap-2 bg-white text-white px-4 py-1.5 rounded-full text-xs font-bold mb-4 print:hidden">
            <BookOpen className="w-3.5 h-3.5" />
            OFFICIAL STUDY GUIDE
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">{sg('title')}</h1>
          <p className="text-lg text-slate-600 mb-1">{sg('subtitle')}</p>
          <p className="text-sm text-slate-500">{sg('school')}</p>
          <p className="text-xs text-slate-500 mt-1">ETPL Program #10004322 · WIOA-Approved · Free to Enrolled Students</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {sg('warning')}
          </div>
        </div>

        {/* Section 1 — Certification Types */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="1" title={sg('certTypes')} color="border-brand-blue-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-3 py-2 font-bold text-slate-700 rounded-l-lg">Type</th>
                  <th className="px-3 py-2 font-bold text-slate-700 rounded-r-lg">What It Covers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CERT_TYPES.map((c) => (
                  <tr key={c.type} className={c.type === 'Universal' ? 'bg-brand-green-50' : ''}>
                    <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">{c.type}</td>
                    <td className="px-3 py-2.5 text-slate-700">{c.covers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2 — Refrigerant Quick Reference */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="2" title={sg('refrigerantRef')} color="border-brand-orange-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white text-left">
                  {['Refrigerant', 'Type', 'ODP', 'GWP', 'Cylinder Color', 'Status', 'Safety Group'].map(h => (
                    <th key={h} className="px-2 py-2 font-bold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REFRIGERANT_TABLE.map((r) => (
                  <tr key={r.name} className={r.safety === 'A2L' ? 'bg-amber-50' : r.odp !== '0' ? 'bg-red-50' : ''}>
                    <td className="px-2 py-2 font-bold text-slate-900">{r.name}</td>
                    <td className="px-2 py-2 text-slate-600">{r.type}</td>
                    <td className="px-2 py-2 font-semibold text-slate-900">{r.odp}</td>
                    <td className="px-2 py-2 text-slate-600">{r.gwp}</td>
                    <td className="px-2 py-2 text-slate-600">{r.color}</td>
                    <td className="px-2 py-2 text-slate-600">{r.status}</td>
                    <td className={`px-2 py-2 font-bold ${r.safety === 'A2L' ? 'text-amber-700' : r.safety === 'B1' ? 'text-red-700' : 'text-brand-green-700'}`}>{r.safety}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">🟡 Yellow = A2L (mildly flammable — requires A2L-rated equipment) · 🔴 Red = ODP &gt; 0 (ozone depleting)</p>
        </div>

        {/* Section 3 — Recovery Levels */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="3" title={sg('recoveryLevels')} color="border-brand-green-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-3 py-2 font-bold text-slate-700">System Type</th>
                  <th className="px-3 py-2 font-bold text-slate-700">Required Level</th>
                  <th className="px-3 py-2 font-bold text-slate-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECOVERY_LEVELS.map((r) => (
                  <tr key={r.system}>
                    <td className="px-3 py-2.5 text-slate-700">{r.system}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{r.level}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LEAK_RATES.map((r) => (
              <div key={r.type} className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Leak Trigger Rate</p>
                <p className="text-sm font-semibold text-slate-900">{r.type}</p>
                <p className="text-2xl font-black text-brand-red-600 mt-1">{r.rate}</p>
                <p className="text-xs text-slate-500">{r.days}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Phase-Out Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="4" title={sg('phaseOut')} color="border-purple-500" />
          <div className="space-y-3">
            {PHASE_OUT_TIMELINE.map((p) => (
              <div key={p.year} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-14 text-right font-black text-brand-blue-600 text-sm pt-0.5">{p.year}</span>
                <div className="flex-shrink-0 w-px bg-slate-200 self-stretch mx-1" />
                <p className="text-sm text-slate-700">{p.event}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Key Rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="5" title={sg('keyRules')} color="border-brand-red-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Max fine for venting', '$44,539 per day per violation'],
              ['Cylinder max fill', '80% of water capacity'],
              ['DOT retest interval', 'Every 5 years'],
              ['Recovery cylinder color', 'Gray body, yellow top'],
              ['Records retention', '3 years minimum'],
              ['Leak repair deadline', '30 days after trigger exceeded'],
              ['Vacuum target', '500 microns or below'],
              ['Pressure test gas', 'Dry nitrogen ONLY — never oxygen'],
              ['Refrigerant purchases', 'EPA 608 cert required since 2018'],
              ['De minimis release', 'Hose connect/disconnect only — all others illegal'],
            ].map(([rule, value]) => (
              <div key={rule} className="flex gap-3 bg-white rounded-xl p-3 border border-slate-100">
                <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-xs uppercase tracking-wide">{rule}</p>
                  <p className="text-slate-700 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6 — 20 Must-Know Q&A */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:rounded-none">
          <SectionHeader number="6" title={sg('mustKnow')} color="border-indigo-500" />
          <p className="text-sm text-slate-500 mb-4 print:hidden">{sg('clickToReveal')}</p>
          <CollapsibleQA />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-8 print:pb-4">
          <p>Elevate for Humanity Career & Training Institute · Indianapolis, IN</p>
          <p className="mt-1">{sg('footer')}</p>
          <p className="mt-1">{sg('footerNote')}</p>
        </div>
      </div>
    </div>
  );
}
