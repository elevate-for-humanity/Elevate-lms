import React from 'react';
import { HVAC_MODULE_DATA, type ModuleData } from './hvac-module-data';
import { getModuleEquipment } from './hvac-equipment-models';
import { getModuleDiagrams } from './hvac-visual-library';
import { getModuleScenarios } from './hvac-service-scenarios';
import { HVAC_LESSON_CONTENT } from './hvac-lesson-content';
import { COURSE_DEFINITIONS } from './definitions';

const course = COURSE_DEFINITIONS.find((c) => c.slug === 'hvac-technician')!;

/* ── Shared helpers ── */

function B({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="text-sm text-slate-700 flex gap-2">
          <span className="text-brand-blue-500 mt-0.5">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-slate-900 mb-3">{children}</h2>;
}

/* ── Universal Module Content Renderer ── */

function ModuleContent({ mod }: { mod: ModuleData }) {
  const modId = `hvac-${String(mod.num).padStart(2, '0')}`;
  const courseMod = course.modules.find((m) => m.id === modId);
  const equipment = getModuleEquipment(modId);
  const diagrams = getModuleDiagrams(modId);
  const scenarios = getModuleScenarios(modId);

  return (
    <div className="space-y-8">
      {/* Module overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading>Module {mod.num}: {mod.title}</SectionHeading>
          <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-3 py-1 rounded-full flex-shrink-0">
            {mod.week}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">What This Module Teaches</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{mod.teaches}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Why This Matters on the Job</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{mod.whyItMatters}</p>
          </div>
        </div>
      </div>

      {/* Competency objectives */}
      {courseMod?.competencyObjectives && courseMod.competencyObjectives.length > 0 && (
        <div>
          <SectionHeading>What You Must Be Able to Do</SectionHeading>
          <div className="space-y-2">
            {courseMod.competencyObjectives.map((obj) => (
              <div key={obj.id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-green-50 flex items-center justify-center text-brand-green-600 text-xs font-bold mt-0.5">&#10003;</span>
                <div>
                  <p className="text-sm text-slate-800 font-medium">{obj.statement}</p>
                  {obj.standard && (
                    <p className="text-xs text-slate-500 mt-0.5">Standard: {obj.standard}</p>
                  )}
                  {obj.credentialAlignment && (
                    <span className="inline-block text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded mt-1">
                      {obj.credentialAlignment}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {mod.tools.length > 0 && mod.tools[0].name !== 'No tools in this module' && (
        <div>
          <SectionHeading>Tools Used in This Module</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-3">
            {mod.tools.map((tool, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="font-semibold text-slate-800 text-sm">{tool.name}</p>
                <p className="text-xs text-slate-600 mt-1">{tool.whatItIs}</p>
                <p className="text-xs text-slate-500 mt-1 italic">Used for: {tool.usedFor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Systems & Components */}
      <div>
        <SectionHeading>Systems &amp; Components You Will Learn</SectionHeading>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <B items={mod.systems} />
        </div>
      </div>

      {/* Practical Skills */}
      <div>
        <SectionHeading>Practical Skills You Will Build</SectionHeading>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <B items={mod.skills} />
        </div>
      </div>

      {/* Equipment Models */}
      {equipment.length > 0 && (
        <div>
          <SectionHeading>Equipment You Will Work With</SectionHeading>
          <p className="text-sm text-slate-600 mb-3">
            These are the same equipment models used throughout the program. You will see them again in later modules during troubleshooting and service call labs.
          </p>
          {equipment.map((eq) => (
            <div key={eq.id} className="bg-white border border-slate-200 rounded-xl p-5 mb-3">
              <h3 className="font-bold text-slate-900">{eq.name}</h3>
              <p className="text-sm text-slate-600 mt-1">{eq.description}</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {eq.components.slice(0, 6).map((comp) => (
                  <div key={comp.name} className="bg-slate-50 rounded-lg p-3">
                    <p className="font-semibold text-slate-800 text-sm">{comp.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{comp.description.length > 120 ? comp.description.slice(0, 120) + '\u2026' : comp.description}</p>
                  </div>
                ))}
              </div>
              {eq.components.length > 6 && (
                <p className="text-xs text-slate-500 mt-2">+ {eq.components.length - 6} more components covered in the lab</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diagrams available */}
      {diagrams.length > 0 && (
        <div>
          <SectionHeading>Visual Diagrams in This Module</SectionHeading>
          <p className="text-sm text-slate-600 mb-3">
            These diagrams appear in the Content tab above. Click on components to learn what they do. The same diagrams reappear in later modules during troubleshooting &#8212; repetition builds understanding.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {diagrams.map((d) => (
              <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  {d.hasInteractive && (
                    <span className="text-xs bg-brand-green-50 text-brand-green-700 px-2 py-0.5 rounded font-medium">Interactive</span>
                  )}
                  <h3 className="font-semibold text-slate-800 text-sm">{d.name}</h3>
                </div>
                <p className="text-xs text-slate-600">{d.learningObjective}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service call scenarios preview */}
      {scenarios.length > 0 && (
        <div>
          <SectionHeading>Service Call Scenarios</SectionHeading>
          <p className="text-sm text-slate-600 mb-3">
            These real-world diagnostic scenarios are available in the Lab tab. Work through each one step by step.
          </p>
          <div className="space-y-2">
            {scenarios.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    s.difficulty === 'beginner' ? 'bg-green-100 text-green-700'
                      : s.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {s.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-800 font-medium mt-1">&ldquo;{s.complaint}&rdquo;</p>
                <p className="text-xs text-slate-500 mt-1">{s.conditions} &middot; {s.diagnosticSteps.length} diagnostic steps</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Tasks */}
      <div>
        <SectionHeading>Real Job Tasks This Prepares You For</SectionHeading>
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-5">
          <B items={mod.jobTasks} />
        </div>
      </div>

      {/* Lessons with deep content */}
      {courseMod && (
        <div>
          <SectionHeading>Lessons in This Module</SectionHeading>
          <div className="space-y-4">
            {courseMod.lessons.map((lesson) => {
              const deep = HVAC_LESSON_CONTENT[lesson.id];
              return (
                <details key={lesson.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
                  <summary className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        lesson.type === 'video' ? 'bg-purple-50 text-purple-600'
                          : lesson.type === 'lab' ? 'bg-green-50 text-green-600'
                          : lesson.type === 'quiz' ? 'bg-amber-50 text-amber-600'
                          : lesson.type === 'assignment' ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-50 text-slate-600'
                      }`}>
                        {lesson.type === 'video' ? '\u25B6' : lesson.type === 'lab' ? '\uD83D\uDD27' : lesson.type === 'quiz' ? '?' : lesson.type === 'assignment' ? '\uD83D\uDCDD' : '\uD83D\uDCD6'}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-slate-400 capitalize">{lesson.type}</span>
                          {lesson.durationMinutes && <span className="text-xs text-slate-400">{lesson.durationMinutes} min</span>}
                        </div>
                      </div>
                    </div>
                  </summary>
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                    {deep ? (
                      <>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Concept</h4>
                          <p className="text-sm text-slate-700 leading-relaxed">{deep.concept}</p>
                        </div>
                        {deep.keyTerms.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Key Terms</h4>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {deep.keyTerms.map((kt) => (
                                <div key={kt.term} className="bg-slate-50 rounded-lg p-3">
                                  <p className="font-semibold text-slate-800 text-sm">{kt.term}</p>
                                  <p className="text-xs text-slate-600 mt-0.5">{kt.definition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">On the Job</h4>
                          <p className="text-sm text-slate-700">{deep.jobApplication}</p>
                        </div>
                        {deep.watchFor.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-1">Watch For</h4>
                            <ul className="space-y-1">
                              {deep.watchFor.map((w, i) => (
                                <li key={i} className="text-sm text-amber-900 flex gap-2">
                                  <span className="text-amber-500 flex-shrink-0">&#9888;</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {deep.diagramRef && (
                          <p className="text-xs text-brand-blue-600 font-medium">
                            &#128200; See the interactive diagram for this lesson in the diagrams section above.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">{lesson.description}</p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone */}
      {courseMod?.milestone && (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 text-center">
          <p className="text-xs font-bold text-brand-blue-600 uppercase mb-1">Module Milestone</p>
          <p className="text-lg font-bold text-brand-blue-800">{courseMod.milestone}</p>
        </div>
      )}
    </div>
  );
}

/* ── Module 1 Custom Content (orientation — unique structure) ── */

function Module01() {
  return (
    <div className="space-y-10">

      {/* ── FULL PROGRAM ROADMAP ── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your 16-Module Training Roadmap</h2>
        <p className="text-sm text-slate-600 mb-6">This is your complete program. Each module builds on the last. Read every section below so you understand exactly what you are walking into, what tools you will use, and what job skills you are building.</p>

        {HVAC_MODULE_DATA.map((mod) => (
          <div key={mod.num} className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900">Module {mod.num}: {mod.title}</h3>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-3 py-1 rounded-full">{mod.week}</span>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">What This Module Teaches</h4>
              <p className="text-sm text-slate-700">{mod.teaches}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Why This Matters on the Job</h4>
              <p className="text-sm text-slate-700">{mod.whyItMatters}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Tools Used in This Module</h4>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                {mod.tools.map((tool, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <p className="font-semibold text-slate-800 text-sm">{tool.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{tool.whatItIs}</p>
                    <p className="text-xs text-slate-500 mt-0.5"><em>Used for: {tool.usedFor}</em></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Systems &amp; Components You Will Learn</h4>
              <B items={mod.systems} />
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Practical Skills You Will Build</h4>
              <B items={mod.skills} />
            </div>

            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-brand-green-700 uppercase mb-1">Real Job Tasks This Prepares You For</h4>
              <B items={mod.jobTasks} />
            </div>
          </div>
        ))}
      </div>

      {/* ── CREDENTIALS ── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Three Credentials</h2>
        {[
          { name: 'EPA 608 Universal Certification', issuer: 'U.S. Environmental Protection Agency', why: 'Federal law (Clean Air Act Section 608) requires this to purchase or handle any refrigerant. Without it, you cannot legally work on AC or refrigeration systems. Period.', details: ['Covers Type I (small appliances under 5 lbs), Type II (high-pressure like residential AC), Type III (low-pressure like commercial chillers)', 'Exam is 80 multiple-choice questions \u2014 you must pass each of the 4 sections with 70% or higher', 'Certification is lifetime \u2014 it never expires once you pass', 'Exam fee is $120-180 \u2014 covered by WIOA funding if you are eligible', 'You take the official proctored exam in Module 16 of this program'] },
          { name: 'OSHA 30-Hour Construction Safety', issuer: 'OSHA / CareerSafe', why: 'Most HVAC employers will not hire you without OSHA 30. It proves you can recognize hazards, follow safety protocols, and protect yourself and your coworkers on a construction site.', details: ['30 hours of training covering fall protection, scaffolding, electrical safety, excavation, PPE, hazard communication, and more', 'You receive an official DOL (Department of Labor) wallet card upon completion', 'Many employers pay $2-4/hr more for OSHA 30 certified workers \u2014 that is $4,000-8,000 more per year', 'Covers Module 14 of this program \u2014 one full week dedicated to safety'] },
          { name: 'CPR / AED / First Aid', issuer: 'American Heart Association', why: 'You will work in attics in 140\u00B0F heat, on rooftops in winter, in crawl spaces with limited air. Heat stroke, electrical shock, falls \u2014 knowing how to respond to a medical emergency is not optional in this trade.', details: ['Covers adult CPR, AED (automated external defibrillator) use, choking response, wound care, and shock management', 'Certification is valid for 2 years \u2014 you must renew it', 'Includes hands-on skills assessment with a mannequin \u2014 not just a written test', 'Takes approximately 4 hours to complete \u2014 covered in Module 15'] },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 mb-3">
            <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
            <p className="text-xs text-slate-500 mb-2">Issued by: {c.issuer}</p>
            <p className="text-sm text-slate-700 mb-3">{c.why}</p>
            <B items={c.details} />
          </div>
        ))}
      </div>

      {/* ── FUNDING ── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">How Your Training Is Paid For</h2>
        <p className="text-sm text-slate-600 mb-4">Most students in this program pay nothing out of pocket. Here is every funding option explained.</p>
        {[
          { name: 'WIOA (Workforce Innovation and Opportunity Act)', what: 'Federal workforce funding administered through your local WorkOne office. This is the most common funding source for our students.', covers: ['Full tuition and program fees', 'Books, study guides, and printed materials', 'HVAC tool kit (gauge manifold, multimeter, hand tools)', 'Transportation \u2014 gas cards, bus passes, or mileage reimbursement', 'Childcare during training hours', 'Work clothing \u2014 steel-toe boots, safety glasses, work pants', 'All certification exam fees (EPA 608, OSHA 30, CPR)'], reqs: ['Must register at indianacareerconnect.com \u2014 this is required, do it now if you have not', 'Must meet income eligibility or other qualifying criteria (dislocated worker, veteran, etc.)', 'Must maintain 80% attendance throughout the program', 'Must complete all required documentation on time'] },
          { name: 'Workforce Ready Grant (WRG)', what: 'Indiana state funding specifically for high-demand certifications. No income requirements \u2014 if you are an Indiana resident in an approved program, you may qualify.', covers: ['Full tuition for approved certificate programs', 'Open to all Indiana residents regardless of income'], reqs: ['Must be an Indiana resident', 'Must be enrolled in a program on the ETPL (Eligible Training Provider List)', 'Our HVAC program is ETPL-approved'] },
          { name: 'Justice Reinvestment Initiative (JRI)', what: 'Funding for justice-involved individuals re-entering the workforce. Your past does not define your future \u2014 this program is proof of that.', covers: ['Full tuition coverage', 'Supportive services including housing assistance', 'Job placement support after completion', 'Case management throughout the program'], reqs: ['Must be referred through the criminal justice system', 'Must meet program eligibility criteria', 'Must be committed to completing the full 16-week program'] },
          { name: 'Self-Pay Options', what: 'For students who do not qualify for grant funding. We will work with you to find a payment option.', covers: ['Flexible payment plans', 'Buy Now Pay Later: Klarna, Afterpay, Sezzle, Affirm, or Zip', 'Custom arrangements \u2014 talk to our enrollment team'], reqs: ['Contact the Elevate enrollment team to discuss your situation'] },
        ].map((f, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 mb-3">
            <h3 className="font-bold text-slate-900 text-lg">{f.name}</h3>
            <p className="text-sm text-slate-700 mb-3">{f.what}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><p className="text-xs font-bold text-slate-500 uppercase mb-1">What It Covers</p><B items={f.covers} /></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase mb-1">Requirements</p><B items={f.reqs} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ATTENDANCE ── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Attendance &amp; Academic Requirements</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {[
            ['80%', 'Minimum Attendance', 'Tracked daily for online and in-person. 3 unexcused absences = intervention meeting. 2 consecutive = probation. This is not flexible \u2014 your funding depends on it.'],
            ['70%', 'Minimum Quiz Score', 'Every module quiz must be passed. Retakes available with instructor approval. Review the material before retaking \u2014 do not guess.'],
            ['24 hrs', 'Absence Notification', 'You must notify your instructor within 24 hours if you will be absent. Make-up work must be completed within one week. No exceptions.'],
            ['3 lates = 1 absence', 'Tardiness Policy', 'Three or more late arrivals in a month counts as one unexcused absence. Be on time. Set your alarm 30 minutes earlier than you think you need to.'],
          ].map(([num, label, detail], i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-amber-600">{num}</p>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-600 mt-1">{detail}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900"><strong>Life happens.</strong> Transportation broke down. Kid got sick. You are dealing with something. Talk to your case manager \u2014 we have supportive services for exactly these situations. But you have to communicate. Disappearing without a word is how you lose your funding.</p>
        </div>
      </div>

      {/* ── DOCUMENTATION ── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Required Documentation</h2>
        <p className="text-sm text-slate-600 mb-4">You need these documents to complete enrollment and maintain funding. Get them together now.</p>
        {[
          ['Indiana Career Connect Registration', 'Go to indianacareerconnect.com and create an account. This is the state workforce system. WIOA funding cannot be processed without it. Do this today if you have not already.'],
          ['Government-Issued Photo ID', 'Driver\'s license, state ID card, or U.S. passport. Must be current \u2014 not expired. If yours is expired, go to the BMV before your program start date.'],
          ['Social Security Card', 'The original card \u2014 not a photocopy. If you lost it, request a replacement at ssa.gov or your local Social Security office. Processing takes 2-4 weeks so do not wait.'],
          ['Proof of Residence', 'A utility bill (electric, gas, water), lease agreement, or bank statement dated within the last 30 days. Must show your name and an Indiana address.'],
          ['Selective Service Registration', 'Required for males ages 18-25. Register at sss.gov \u2014 it takes 2 minutes. If you are over 25 and never registered, you may need a Status Information Letter from Selective Service.'],
          ['High School Diploma or GED', 'Original diploma or a certified copy from your school district. If you do not have a diploma or GED, ask us about our GED partnership program \u2014 you can work on both at the same time.'],
        ].map(([title, detail], i) => (
          <div key={i} className="flex gap-3 bg-white border border-slate-200 rounded-lg p-4 mb-2">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-50 flex items-center justify-center text-sm font-bold text-brand-blue-600">{i + 1}</span>
            <div><p className="font-semibold text-slate-800">{title}</p><p className="text-sm text-slate-600 mt-1">{detail}</p></div>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Build the content map for all 16 modules ── */

function buildContentMap(): Record<string, React.ReactNode> {
  const map: Record<string, React.ReactNode> = {
    'hvac-01': <Module01 />,
  };

  // Modules 2-16 use the universal renderer
  for (let i = 1; i < HVAC_MODULE_DATA.length; i++) {
    const mod = HVAC_MODULE_DATA[i];
    const modId = `hvac-${String(mod.num).padStart(2, '0')}`;
    if (!map[modId]) {
      map[modId] = <ModuleContent mod={mod} />;
    }
  }

  return map;
}

export const HVAC_MODULE_CONTENT: Record<string, React.ReactNode> = buildContentMap();
