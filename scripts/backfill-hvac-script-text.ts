/**
 * scripts/backfill-hvac-script-text.ts
 *
 * Backfills curriculum_lessons.script_text for all 95 HVAC lessons
 * using HVAC_LESSON_CONTENT + HVAC_LESSON_NUMBER_TO_DEF_ID as the source.
 *
 * Safe to re-run — only updates rows where script_text is NULL or empty.
 * Pass --force to overwrite all rows regardless.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-hvac-script-text.ts
 *   pnpm tsx scripts/backfill-hvac-script-text.ts --force
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { HVAC_LESSON_CONTENT, type LessonContent } from '../lib/courses/hvac-lesson-content';
import { HVAC_LESSON_NUMBER_TO_DEF_ID } from '../lib/courses/hvac-lesson-number-map';

/** Build HTML from a LessonContent object with consistent h2 heading. */
function buildHtmlFromContent(c: LessonContent, title: string): string {
  const keyTermsHtml = c.keyTerms?.length
    ? `<h3>Key Terms</h3><dl>${c.keyTerms.map(k =>
        `<dt>${k.term}</dt><dd>${k.definition}</dd>`).join('')}</dl>`
    : '';

  const watchForHtml = c.watchFor?.length
    ? `<h3>Watch For</h3><ul>${c.watchFor.map(w => `<li>${w}</li>`).join('')}</ul>`
    : '';

  const jobHtml = c.jobApplication
    ? `<h3>Job Application</h3><p>${c.jobApplication}</p>`
    : '';

  return `<h2>${title}</h2>
<p>${c.concept}</p>
${keyTermsHtml}
${jobHtml}
${watchForHtml}`.trim();
}

/** Review content for each checkpoint lesson — shown in the reading tab before the quiz. */
const CHECKPOINT_REVIEW: Record<number, string> = {
  4: `<h2>Orientation Quiz — Review</h2>
<p>Before taking this quiz, confirm you can answer these questions from memory.</p>
<h3>What to Know</h3>
<ul>
<li><strong>WIOA</strong> covers tuition, tools, transportation, childcare, and exam fees for eligible students</li>
<li><strong>WRG</strong> (Workforce Ready Grant) is Indiana state funding — no income requirement</li>
<li><strong>JRI</strong> (Job Ready Indy) serves justice-involved individuals</li>
<li>Attendance requirement: <strong>80%</strong> — missing more than 20% risks losing funding</li>
<li>Register at <strong>indianacareerconnect.com</strong> before your first WorkOne appointment</li>
<li>Career levels: Apprentice → Journeyman → Master Technician → Contractor</li>
<li>Starting wages: $16–22/hr apprentice, $22–32/hr journeyman</li>
</ul>
<h3>Key Terms</h3>
<dl>
<dt>ITA</dt><dd>Individual Training Account — the WIOA mechanism that pays tuition directly to the training provider.</dd>
<dt>Case Manager</dt><dd>Your WorkOne representative who manages your funding and tracks your progress.</dd>
<dt>ETPL</dt><dd>Eligible Training Provider List — Elevate must be on this list for WIOA funding to apply.</dd>
</dl>`,

  9: `<h2>HVAC Fundamentals Quiz — Review</h2>
<p>This quiz covers system components, tools, and safety. Review these before starting.</p>
<h3>System Components</h3>
<ul>
<li><strong>Suction line</strong> — large insulated copper line, carries cold low-pressure vapor from evaporator to compressor</li>
<li><strong>Liquid line</strong> — small copper line, carries warm high-pressure liquid from condenser to metering device</li>
<li><strong>Condenser</strong> — outdoor unit, rejects heat to outside air</li>
<li><strong>Evaporator</strong> — indoor coil, absorbs heat from room air</li>
<li><strong>Air handler</strong> — indoor unit with blower motor, evaporator coil, and filter</li>
</ul>
<h3>Tools</h3>
<ul>
<li><strong>Multimeter</strong> — measures voltage, resistance, continuity, capacitance</li>
<li><strong>Clamp meter</strong> — measures amperage without disconnecting wires</li>
<li><strong>Manifold gauge set</strong> — blue = low side, red = high side</li>
<li><strong>Micron gauge</strong> — measures deep vacuum during evacuation</li>
</ul>
<h3>Safety</h3>
<ul>
<li>LOTO: disconnect power, lock the disconnect, verify 0 volts with YOUR multimeter</li>
<li>Capacitor stores charge even when power is off — always discharge before handling</li>
<li>Refrigerant is heavier than air — sinks in enclosed spaces, displaces oxygen</li>
</ul>`,

  14: `<h2>Electrical Basics Quiz — Review</h2>
<p>Review Ohm's Law and electrical component operation before this quiz.</p>
<h3>Ohm's Law</h3>
<ul>
<li>V = I × R (Voltage = Current × Resistance)</li>
<li>I = V ÷ R (Current = Voltage ÷ Resistance)</li>
<li>R = V ÷ I (Resistance = Voltage ÷ Current)</li>
</ul>
<h3>Components</h3>
<ul>
<li><strong>Capacitor</strong> — stores charge to start and run motors. Measured in microfarads (µF). ±6% tolerance.</li>
<li><strong>Contactor</strong> — high-voltage relay controlled by 24V thermostat signal. Pulls in to connect line voltage to compressor and condenser fan.</li>
<li><strong>Relay</strong> — low-voltage switching device. Controls one circuit with another.</li>
<li><strong>Transformer</strong> — steps 240V down to 24V for control circuits</li>
</ul>
<h3>Reading Wiring Diagrams</h3>
<ul>
<li>Ladder diagrams read left to right, top to bottom</li>
<li>Dashed lines indicate factory wiring; solid lines indicate field wiring</li>
<li>Always trace the control circuit (24V) separately from the power circuit (240V)</li>
</ul>`,

  20: `<h2>Heating Systems Quiz — Review</h2>
<p>Review gas furnace sequence, heat pump operation, and combustion analysis before this quiz.</p>
<h3>Gas Furnace Sequence of Operation</h3>
<ol>
<li>Thermostat calls for heat (W terminal energized)</li>
<li>Draft inducer starts</li>
<li>Pressure switch closes (proves inducer running)</li>
<li>Igniter glows (1800°F+)</li>
<li>Gas valve opens, burners ignite</li>
<li>Flame sensor proves flame (microamps through rod)</li>
<li>Heat exchanger warms up</li>
<li>Blower starts after time delay</li>
<li>Warm air flows through ducts</li>
</ol>
<h3>Key Facts</h3>
<ul>
<li>Dirty flame sensor = #1 no-heat call. Clean with fine steel wool.</li>
<li>Heat exchanger crack = CO leak into living space. Red-tag the system.</li>
<li>Natural gas manifold pressure: 3.5 in. w.c.</li>
<li>Heat pump reversing valve: O wire = cooling on Carrier/Honeywell, B wire = heating on Rheem/Ruud</li>
<li>Temperature rise must be within nameplate range (typically 35–65°F)</li>
</ul>`,

  26: `<h2>Cooling Systems Quiz — Review</h2>
<p>This is a cumulative quiz covering Modules 1–5. Review refrigeration cycle fundamentals and cooling system operation.</p>
<h3>Refrigeration Cycle</h3>
<ol>
<li>Compressor compresses low-pressure vapor → hot high-pressure vapor</li>
<li>Condenser coil rejects heat → warm high-pressure liquid</li>
<li>Metering device drops pressure → cold low-pressure liquid/vapor mix</li>
<li>Evaporator coil absorbs heat → low-pressure vapor returns to compressor</li>
</ol>
<h3>Pressure-Temperature Relationship</h3>
<ul>
<li>Higher pressure = higher boiling point (condensing side)</li>
<li>Lower pressure = lower boiling point (evaporating side)</li>
<li>Use PT chart to convert gauge pressure to saturation temperature</li>
</ul>
<h3>Superheat and Subcooling</h3>
<ul>
<li><strong>Superheat</strong> — temperature of vapor above its saturation point at suction pressure. Indicates refrigerant charge on TXV systems.</li>
<li><strong>Subcooling</strong> — temperature of liquid below its saturation point at discharge pressure. Indicates refrigerant charge on fixed-orifice systems.</li>
</ul>`,

  34: `<h2>EPA 608 Core — Review</h2>
<p>The Core section covers environmental law, refrigerant classifications, and handling rules. All four certification levels require passing Core.</p>
<h3>Ozone and Environmental Law</h3>
<ul>
<li>CFCs (R-11, R-12) — highest ozone depletion potential, fully phased out</li>
<li>HCFCs (R-22) — lower ODP, being phased out. R-22 production ended 2020.</li>
<li>HFCs (R-410A, R-134a) — zero ODP but high GWP. Current standard.</li>
<li>HFOs (R-32, R-454B) — low GWP, next generation</li>
<li>Venting refrigerant intentionally = federal violation, up to $44,539/day fine</li>
</ul>
<h3>Recovery, Recycling, Reclamation</h3>
<ul>
<li><strong>Recovery</strong> — removing refrigerant from system into approved cylinder (field operation)</li>
<li><strong>Recycling</strong> — cleaning refrigerant for reuse in same system (field operation)</li>
<li><strong>Reclamation</strong> — processing to ARI 700 purity standard (certified facility only)</li>
</ul>
<h3>Sales Restrictions</h3>
<ul>
<li>Refrigerants in containers over 2 lbs may only be sold to EPA 608 certified technicians</li>
<li>Exception: small cans (under 2 lbs) of R-134a for automotive use</li>
</ul>`,

  39: `<h2>EPA 608 Type I — Review</h2>
<p>Type I covers small appliances — systems with 5 lbs or less of refrigerant, factory-sealed, hermetically sealed compressors.</p>
<h3>Key Rules</h3>
<ul>
<li>Small appliances: refrigerators, window ACs, PTACs, dehumidifiers, water coolers, vending machines</li>
<li>System-dependent recovery equipment is allowed for Type I (does not need to be self-contained)</li>
<li>Required recovery efficiency: 80% if compressor is operational, 90% if not</li>
<li>No leak repair requirements for small appliances (unlike Type II/III)</li>
<li>Technicians may use system-dependent equipment — does not need to be UL-certified for Type I</li>
</ul>
<h3>Recovery Equipment</h3>
<ul>
<li>System-dependent (passive) equipment uses the system's own compressor to push refrigerant into the recovery cylinder</li>
<li>Self-contained equipment has its own compressor — required for Type II and III</li>
</ul>`,

  46: `<h2>EPA 608 Type II — Review</h2>
<p>Type II covers high-pressure systems — R-22, R-410A, R-404A, and most residential and commercial HVAC equipment.</p>
<h3>Recovery Requirements</h3>
<ul>
<li>Systems with less than 200 lbs: recover to 0 psig (or 4 in. Hg vacuum if system has no compressor)</li>
<li>Systems with 200+ lbs: recover to 4 in. Hg vacuum</li>
<li>Self-contained recovery equipment required (not system-dependent)</li>
</ul>
<h3>Leak Repair Requirements</h3>
<ul>
<li>Commercial/industrial systems with 50+ lbs: repair leaks within 30 days if annual leak rate exceeds 20%</li>
<li>Comfort cooling systems with 50+ lbs: repair within 30 days if annual leak rate exceeds 15%</li>
<li>Must keep records of refrigerant added to systems with 50+ lbs</li>
</ul>
<h3>Leak Detection</h3>
<ul>
<li>Electronic leak detectors, UV dye, soap bubbles — all acceptable</li>
<li>Must check within 30 days of adding refrigerant to a leaking system</li>
</ul>`,

  52: `<h2>EPA 608 Type III — Review</h2>
<p>Type III covers low-pressure systems — R-11, R-113, R-123. These are large centrifugal chillers found in commercial buildings.</p>
<h3>Key Characteristics</h3>
<ul>
<li>Low-pressure systems operate below atmospheric pressure (in a vacuum)</li>
<li>Air and moisture enter through leaks (opposite of high-pressure systems)</li>
<li>Purge units remove non-condensables (air) that accumulate in the system</li>
<li>Water in low-pressure systems causes acid formation and compressor damage</li>
</ul>
<h3>Recovery Requirements</h3>
<ul>
<li>Recover to 25 mm Hg absolute (approximately 29.6 in. Hg vacuum)</li>
<li>Self-contained recovery equipment required</li>
</ul>
<h3>Purge Units</h3>
<ul>
<li>High-efficiency purge units emit less than 0.5 lbs of refrigerant per pound of air purged</li>
<li>Must keep records of purge unit emissions</li>
</ul>`,

  55: `<h2>EPA 608 Core — Full Practice Exam Review</h2>
<p>Final review before the full-length Core practice exam. Focus on the areas most commonly missed.</p>
<h3>Most Missed Topics</h3>
<ul>
<li>ODP vs GWP — know which refrigerants have high ODP (CFCs) vs high GWP (HFCs)</li>
<li>Recovery efficiency percentages — 80% (operational compressor) vs 90% (non-operational) for small appliances</li>
<li>Reclamation vs recycling — reclamation is to ARI 700 standard at a certified facility; recycling is field operation</li>
<li>Venting prohibition — applies to ALL refrigerants, not just CFCs/HCFCs</li>
<li>Sales restriction threshold — containers over 2 lbs require EPA 608 certification to purchase</li>
</ul>`,

  56: `<h2>EPA 608 Type I — Full Practice Exam Review</h2>
<p>Final review before the full-length Type I practice exam.</p>
<h3>Most Missed Topics</h3>
<ul>
<li>System-dependent vs self-contained equipment — Type I allows system-dependent</li>
<li>Recovery efficiency: 80% if compressor works, 90% if it does not</li>
<li>Small appliance definition: factory-sealed, hermetically sealed compressor, 5 lbs or less</li>
<li>No leak repair requirements for small appliances</li>
<li>Technicians servicing small appliances must still be certified</li>
</ul>`,

  57: `<h2>EPA 608 Type II — Full Practice Exam Review</h2>
<p>Final review before the full-length Type II practice exam.</p>
<h3>Most Missed Topics</h3>
<ul>
<li>Recovery levels: 0 psig for systems under 200 lbs; 4 in. Hg vacuum for 200+ lbs</li>
<li>Leak rate thresholds: 15% for comfort cooling, 20% for commercial/industrial (50+ lb systems)</li>
<li>Repair deadline: 30 days after discovering a leak exceeding the threshold</li>
<li>Record-keeping required for systems with 50+ lbs of refrigerant</li>
<li>Self-contained recovery equipment required — system-dependent not allowed</li>
</ul>`,

  58: `<h2>EPA 608 Type III — Full Practice Exam Review</h2>
<p>Final review before the full-length Type III practice exam.</p>
<h3>Most Missed Topics</h3>
<ul>
<li>Low-pressure systems operate below atmospheric — air enters through leaks (not refrigerant escaping)</li>
<li>Recovery level: 25 mm Hg absolute</li>
<li>Purge unit emission limit: less than 0.5 lbs refrigerant per pound of air purged</li>
<li>Water contamination causes acid — more damaging in low-pressure systems than high-pressure</li>
<li>R-123 is the current low-pressure refrigerant (replaced R-11)</li>
</ul>`,

  59: `<h2>EPA 608 Universal — Final Practice Exam Review</h2>
<p>This is the final practice exam before your proctored EPA 608 Universal certification. You must pass all four sections: Core, Type I, Type II, and Type III.</p>
<h3>Passing Requirements</h3>
<ul>
<li>Each section scored separately — must pass each section individually</li>
<li>Passing score: 70% on each section</li>
<li>Universal certification = passing all four sections</li>
</ul>
<h3>Final Review — High-Yield Topics</h3>
<ul>
<li>CFC/HCFC/HFC/HFO classifications and their ODP/GWP profiles</li>
<li>Recovery efficiency requirements by system type and compressor status</li>
<li>Leak rate thresholds and repair deadlines for large systems</li>
<li>Reclamation = ARI 700 standard at certified facility (not field operation)</li>
<li>Venting prohibition applies to all refrigerants</li>
<li>Sales restriction: containers over 2 lbs require certification</li>
<li>Low-pressure recovery level: 25 mm Hg absolute</li>
<li>Type I allows system-dependent equipment; Type II and III require self-contained</li>
</ul>`,

  64: `<h2>Refrigeration Diagnostics Quiz — Review</h2>
<p>Review refrigerant charging methods and gauge reading interpretation before this quiz.</p>
<h3>Charging Methods</h3>
<ul>
<li><strong>Superheat method</strong> — used with fixed-orifice metering devices (piston, orifice). Measure suction line temp, compare to saturation temp at suction pressure. Target superheat varies by outdoor temp and indoor wet bulb.</li>
<li><strong>Subcooling method</strong> — used with TXV/EEV metering devices. Measure liquid line temp, compare to saturation temp at discharge pressure. Target: 10–15°F subcooling.</li>
</ul>
<h3>Gauge Reading Interpretation</h3>
<ul>
<li>High suction + high discharge = overcharged or non-condensables</li>
<li>Low suction + low discharge = undercharged or low airflow</li>
<li>High suction + low discharge = bad compressor (not pumping)</li>
<li>Normal suction + high discharge = dirty condenser or high outdoor temp</li>
</ul>`,

  70: `<h2>Installation Quiz — Review</h2>
<p>Review system installation procedures and startup checklist before this quiz.</p>
<h3>Installation Sequence</h3>
<ol>
<li>Site assessment — clearances, electrical capacity, duct sizing</li>
<li>Set outdoor unit on pad, level within 1/4 inch</li>
<li>Install indoor unit, connect to ductwork</li>
<li>Run line set — support every 6 feet, protect from damage</li>
<li>Make electrical connections — verify voltage and ampacity</li>
<li>Pressure test with nitrogen — 150–300 psig, hold 15 minutes minimum</li>
<li>Evacuate to 500 microns or lower</li>
<li>Charge system per manufacturer specifications</li>
<li>Startup — verify temperatures, pressures, amp draws</li>
</ol>
<h3>Key Numbers</h3>
<ul>
<li>Nitrogen test pressure: 150–300 psig (never use refrigerant for leak testing)</li>
<li>Evacuation target: 500 microns or lower (300 microns preferred)</li>
<li>Line set support: every 6 feet horizontally</li>
</ul>`,

  76: `<h2>Troubleshooting Quiz — Cumulative Review (Modules 1–13)</h2>
<p>This is a cumulative mastery checkpoint. Review the systematic troubleshooting method and common failure patterns.</p>
<h3>Systematic Troubleshooting Method</h3>
<ol>
<li>Gather information — customer complaint, system history, recent work</li>
<li>Verify the complaint — confirm the problem exists</li>
<li>Identify possible causes — list all systems that could cause this symptom</li>
<li>Determine most likely cause — use measurements to narrow down</li>
<li>Test your hypothesis — make one change, observe result</li>
<li>Verify the fix — confirm normal operation before leaving</li>
</ol>
<h3>Common Failure Patterns</h3>
<ul>
<li>No cooling: check power → thermostat → contactor → capacitor → refrigerant charge</li>
<li>No heating (gas): check power → thermostat → inducer → pressure switch → igniter → flame sensor → gas valve</li>
<li>Short cycling: check refrigerant charge → airflow → thermostat location → oversized equipment</li>
<li>Frozen coil: check airflow (filter, blower) → refrigerant charge → metering device</li>
</ul>`,

  84: `<h2>OSHA 10 Final Exam — Review</h2>
<p>Review the core OSHA 10 topics before the certification exam.</p>
<h3>High-Yield Topics</h3>
<ul>
<li><strong>Fall protection</strong> — required at 6 feet in construction. Guardrails, safety nets, or personal fall arrest systems.</li>
<li><strong>Electrical safety</strong> — GFCI required near water. Lockout/tagout before working on electrical equipment.</li>
<li><strong>HazCom</strong> — Safety Data Sheets (SDS) required for all hazardous chemicals. Employees must be trained on chemicals they use.</li>
<li><strong>PPE</strong> — employer must assess hazards and provide appropriate PPE at no cost to employee.</li>
<li><strong>Confined spaces</strong> — permit-required confined spaces need atmospheric testing, attendant, and rescue plan.</li>
<li><strong>Scaffolding</strong> — must support 4x the intended load. Guardrails required above 10 feet.</li>
</ul>
<h3>OSHA Rights</h3>
<ul>
<li>Right to a safe workplace</li>
<li>Right to receive training in a language you understand</li>
<li>Right to report injuries without retaliation</li>
<li>Right to request an OSHA inspection</li>
</ul>`,

  89: `<h2>Rise Up Assessment — Review</h2>
<p>The NRF Foundation Rise Up assessment covers customer service fundamentals, professional communication, and retail/service industry standards. These skills apply directly to HVAC service work.</p>
<h3>Key Topics</h3>
<ul>
<li><strong>Customer service</strong> — greet professionally, listen actively, resolve complaints without escalating</li>
<li><strong>Professional communication</strong> — clear, respectful, and solution-focused in all interactions</li>
<li><strong>Appearance and conduct</strong> — uniform, cleanliness, punctuality signal professionalism to customers</li>
<li><strong>Problem resolution</strong> — acknowledge the issue, explain what you will do, follow through</li>
<li><strong>Teamwork</strong> — HVAC technicians work with dispatchers, other techs, and office staff</li>
</ul>
<h3>Applied to HVAC</h3>
<ul>
<li>Introduce yourself and explain what you are going to do before starting work</li>
<li>Protect the customer's property — use drop cloths, wear shoe covers</li>
<li>Explain findings in plain language — avoid jargon</li>
<li>Never leave without confirming the customer is satisfied</li>
</ul>`,

  95: `<h2>Career Readiness Quiz — Review</h2>
<p>Final checkpoint before program completion. Review wages, credentials, and professional standards.</p>
<h3>Wages and Career Path</h3>
<ul>
<li>Apprentice: $18–$22/hr (day 1 after certification)</li>
<li>Journeyman: $22–$35/hr (2–5 years)</li>
<li>Senior Tech / Lead: $30–$40/hr (5–10 years)</li>
<li>Business Owner: $60K–$100K+ (3–5 years)</li>
</ul>
<h3>Credentials Earned</h3>
<ul>
<li>EPA 608 Universal — federally required to handle refrigerants</li>
<li>OSHA 10 — DOL wallet card, required by most employers</li>
<li>CPR/AED/First Aid — required for most field positions</li>
<li>Elevate for Humanity Program Completion Certificate</li>
</ul>
<h3>What Employers Evaluate in First 90 Days</h3>
<ul>
<li>Callback rate — how often do you have to return to fix the same problem?</li>
<li>Punctuality — on time to every job, every day</li>
<li>Documentation quality — accurate service reports, parts used, time on site</li>
</ul>`,
};

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const FORCE = process.argv.includes('--force');

async function main() {
  console.log(`Backfilling HVAC script_text${FORCE ? ' (force mode)' : ' (empty only)'}...\n`);

  const { data: lessons, error } = await db
    .from('curriculum_lessons')
    .select('id, lesson_slug, lesson_title, lesson_order, script_text')
    .eq('program_id', PROGRAM_ID)
    .order('lesson_order');

  if (error) { console.error('Fetch failed:', error.message); process.exit(1); }
  if (!lessons?.length) { console.error('No curriculum lessons found.'); process.exit(1); }

  console.log(`Found ${lessons.length} lessons.\n`);

  // Inline content for lessons 92-95 which have no entry in HVAC_LESSON_CONTENT
  const INLINE_CONTENT: Record<string, string> = {
    'hvac-lesson-92': `<h2>Employer Partner Introductions</h2>
<p>Elevate for Humanity maintains active partnerships with HVAC employers across the Indianapolis metro area. These companies have committed to interviewing program graduates and offering apprentice positions to qualified candidates.</p>
<h3>What Employer Partners Provide</h3>
<ul>
<li>Entry-level apprentice positions starting at $18–$22/hr</li>
<li>On-the-job training hours toward journeyman licensure</li>
<li>Mentorship from licensed technicians</li>
<li>Benefits including health insurance and tool allowances at many companies</li>
</ul>
<h3>How to Prepare for Employer Introductions</h3>
<p>Your resume should be complete before this session. Dress professionally. Bring copies of your certifications — EPA 608, OSHA 10, and CPR/AED cards. Employers are evaluating your professionalism and attitude as much as your technical knowledge.</p>
<h3>Key Terms</h3>
<dl>
<dt>Apprentice</dt><dd>Entry-level technician working under a licensed journeyman, accumulating on-the-job hours toward licensure.</dd>
<dt>Journeyman</dt><dd>Licensed technician who has completed required OJT hours and passed the state licensing exam.</dd>
<dt>OJT</dt><dd>On-the-Job Training — documented work hours required for licensure, typically 2,000–8,000 hours depending on state.</dd>
</dl>`,

    'hvac-lesson-93': `<h2>OJT Internship Orientation</h2>
<p>Your on-the-job training (OJT) internship is where classroom knowledge becomes field competency. This lesson covers what to expect in your first weeks on the job, how to document your hours, and how to build a professional reputation quickly.</p>
<h3>First 30 Days on the Job</h3>
<ul>
<li>Arrive early, stay late — your work ethic is your first impression</li>
<li>Ask questions, but attempt the task first</li>
<li>Keep your tools organized and your van clean</li>
<li>Document every job: equipment model, serial number, work performed, parts used</li>
<li>Never work on equipment you are not trained on without supervision</li>
</ul>
<h3>Documenting OJT Hours</h3>
<p>Indiana requires documented OJT hours for journeyman licensure. Keep a log of every job you work, signed by your supervising journeyman. Your employer may have a system — use it. If not, use a simple spreadsheet: date, job type, hours, supervisor signature.</p>
<h3>Key Terms</h3>
<dl>
<dt>OJT Log</dt><dd>Documentation of on-the-job training hours, required for licensure applications.</dd>
<dt>Supervising Journeyman</dt><dd>Licensed technician responsible for overseeing and signing off on apprentice work.</dd>
<dt>Callback Rate</dt><dd>Percentage of jobs requiring a return visit to fix the same problem — a key quality metric employers track.</dd>
</dl>`,

    'hvac-lesson-94': `<h2>Program Completion Checklist</h2>
<p>Before you leave this program, verify that every credential and document is in order. Missing paperwork after graduation is harder to fix than before.</p>
<h3>Credentials to Verify</h3>
<ul>
<li><strong>EPA 608 Universal</strong> — Certificate from ESCO Group or equivalent proctor. Verify your name is spelled correctly.</li>
<li><strong>OSHA 10</strong> — DOL wallet card mailed within 2–4 weeks of exam completion. Confirm your mailing address is current.</li>
<li><strong>CPR/AED/First Aid</strong> — Card from American Red Cross or American Heart Association. Check expiration date (2 years).</li>
<li><strong>Program Completion Certificate</strong> — Issued by Elevate for Humanity. Required for WIOA closeout.</li>
</ul>
<h3>Documents to Collect</h3>
<ul>
<li>Unofficial transcript or training record from Elevate</li>
<li>WIOA closeout paperwork signed by your case manager</li>
<li>Reference letters from instructors if requested</li>
<li>OJT log if you completed an internship</li>
</ul>
<h3>Next Steps After Graduation</h3>
<p>Register with the Indiana Professional Licensing Agency (IPLA) to begin tracking your journeyman hours. Connect with your employer partner contact within 48 hours of graduation. Update your resume with all new credentials.</p>`,

    'hvac-lesson-95': `<h2>Career Readiness Quiz</h2>
<p>This final checkpoint covers career readiness, professional conduct, credential documentation, and the pathway from apprentice to journeyman technician. Review the following before taking the quiz.</p>
<h3>Key Review Points</h3>
<ul>
<li>Starting wages for EPA 608 certified HVAC apprentices: $18–$22/hr in Indianapolis</li>
<li>Journeyman technician wages: $22–$35/hr</li>
<li>OJT hours required for Indiana journeyman license: varies by jurisdiction, typically 2,000–4,000 hours</li>
<li>EPA 608 Universal certification is federally required to purchase or handle refrigerants</li>
<li>OSHA 10 DOL card is required by most HVAC employers before field work</li>
<li>CPR/AED certification is required for most employer partner positions</li>
<li>Callback rate, punctuality, and documentation quality are the top three things employers evaluate in the first 90 days</li>
</ul>
<h3>Professional Standards</h3>
<p>HVAC technicians enter customers' homes and businesses. Your professionalism — appearance, communication, and respect for property — directly affects your employer's reputation and your own advancement. Technicians who build trust with customers get promoted faster and earn more referrals.</p>`,
  };

  let updated = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const lesson of lessons) {
    // Skip if already has content and not forcing
    if (!FORCE && lesson.script_text && lesson.script_text.trim().length > 100) {
      skipped++;
      continue;
    }

    // Resolve defId: first by lesson_order number map, then by slug direct match
    const lessonNum = lesson.lesson_order;
    const defId =
      HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNum] ??
      lesson.lesson_slug;

    // Checkpoint lessons get review content instead of (or in addition to) concept content
    const checkpointReview = CHECKPOINT_REVIEW[lessonNum];
    const inlineHtml = INLINE_CONTENT[lesson.lesson_slug];
    const contentDef = HVAC_LESSON_CONTENT[defId];

    if (!checkpointReview && !inlineHtml && !contentDef) {
      missing.push(`${lesson.lesson_slug} (order=${lessonNum}, defId=${defId})`);
      continue;
    }

    // Checkpoints: use review content (authoritative). Others: build from content def.
    const html = checkpointReview
      ?? inlineHtml
      ?? buildHtmlFromContent(contentDef!, lesson.lesson_title ?? '');

    const { error: updateError } = await db
      .from('curriculum_lessons')
      .update({ script_text: html })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`Failed: ${lesson.lesson_slug}: ${updateError.message}`);
      process.exit(1);
    }

    const tag = checkpointReview ? '[checkpoint-review]' : inlineHtml ? '[inline]' : `[${defId}]`;
    console.log(`  ✅ ${lesson.lesson_slug.padEnd(25)} ${tag.padEnd(22)} ${lesson.lesson_title?.slice(0, 40)}`);
    updated++;
  }

  console.log(`\nUpdated: ${updated}  Skipped (already had content): ${skipped}`);

  if (missing.length) {
    console.error(`\n❌ No content definition found for ${missing.length} lessons:`);
    missing.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log('\n✅ Backfill complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
