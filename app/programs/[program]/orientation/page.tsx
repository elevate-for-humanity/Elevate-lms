'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Clock, Users, DollarSign, FileText, Shield } from 'lucide-react';
import { getOrientationConfig, formatCurrency } from '@/lms-data/orientationConfig';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';

export default function BeautyOrientationPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const cfg = getBeautyProgram(params.program);
  const orientationCfg = getOrientationConfig(params.program);
  const c = colorClasses(cfg?.color ?? 'blue');

  const [currentSection, setCurrentSection] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!cfg || !orientationCfg) {
    router.replace(`/programs/${params.program}`);
    return null;
  }

  const sections = [
    {
      title: 'What This Program Leads To',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>Upon successful completion of this program, you will be eligible to:</p>
          <ul className="space-y-2">
            {[
              `Obtain your ${orientationCfg.licenseTitle} through the ${orientationCfg.licensingBody}`,
              `Work legally as a licensed ${cfg.shortTitle.toLowerCase()} in the state of Indiana`,
              `Earn ${orientationCfg.salaryRange} annually depending on location and clientele`,
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-slate-900 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 mt-4">
            This is a USDOL Registered Apprenticeship program. Your credential is nationally recognized.
          </p>
        </div>
      ),
    },
    {
      title: 'How the Apprenticeship Works',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            The {orientationCfg.programTitle} requires <strong>{orientationCfg.hoursLabel}</strong> of combined training:
          </p>
          <div className="grid gap-4 mt-4">
            <div className={`${c.bgLight} p-4 rounded-lg`}>
              <h4 className={`font-bold ${c.textLight}`}>On-the-Job Training (OJT)</h4>
              <p className={`${c.text} text-sm`}>{orientationCfg.ojtDescription}</p>
            </div>
            <div className={`${c.bgLight} p-4 rounded-lg`}>
              <h4 className={`font-bold ${c.textLight}`}>Related Technical Instruction (RTI)</h4>
              <p className={`${c.text} text-sm`}>{orientationCfg.rtiDescription}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Your hours are logged digitally and verified by your instructor. Track progress in your dashboard.
          </p>
        </div>
      ),
    },
    {
      title: 'Attendance & Conduct Expectations',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>As an apprentice, you are expected to:</p>
          <ul className="space-y-3">
            {[
              { title: 'Attend consistently.', desc: 'Missed hours must be made up. Excessive absences may result in program dismissal.' },
              { title: 'Maintain professionalism.', desc: 'You represent the salon and the program. Dress code and conduct standards apply.' },
              { title: 'Complete coursework on time.', desc: 'RTI modules have deadlines. Falling behind affects your progress.' },
              { title: 'Communicate proactively.', desc: "If issues arise, contact your coordinator immediately. We're here to help." },
            ].map(({ title, desc }, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`w-6 h-6 ${c.bg} text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                  {i + 1}
                </span>
                <span><strong>{title}</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: 'Pay & Funding',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          {cfg.earnWhileYouLearn ? (
            <div className={`${c.bgLight} ${c.border} border p-5 rounded-xl`}>
              <p className={`text-2xl font-black ${c.textLight} mb-1`}>$0 Tuition</p>
              <p className={`${c.text} text-sm`}>
                This is an earn-while-you-learn apprenticeship. There is no tuition.
              </p>
            </div>
          ) : (
            <div className={`${c.bgLight} ${c.border} border p-5 rounded-xl`}>
              <p className={`text-2xl font-black ${c.textLight} mb-1`}>
                {formatCurrency(orientationCfg.tuition.total)}
              </p>
              <p className={`${c.text} text-sm`}>
                Total program cost — deposit secures your spot, balance paid weekly.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {cfg.earnWhileYouLearn ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <span className={`w-6 h-6 ${c.bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>1</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">You earn wages from your host salon</p>
                    <p className="text-slate-600 text-sm">Apprentices are employees. Your salon pays you at least minimum wage throughout training.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <span className={`w-6 h-6 ${c.bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>2</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">State board exam fee: ~$75</p>
                    <p className="text-slate-600 text-sm">Paid directly to Indiana IPLA when you apply for your license after completing {cfg.ojtHours.toLocaleString()} hours.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <span className={`w-6 h-6 ${c.bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>1</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Deposit secures your spot</p>
                    <p className="text-slate-600 text-sm">Pay the deposit now. Remaining balance is billed {orientationCfg.tuition.paymentFrequency.toLowerCase()}.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <span className={`w-6 h-6 ${c.bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>2</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Funding may be available</p>
                    <p className="text-slate-600 text-sm"> (SNAP/TANF recipients) and employer sponsorship can cover part or all of your cost.</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-slate-500">{orientationCfg.tuition.fundingNote}</p>
        </div>
      ),
    },
    {
      title: 'Compliance & Agreement',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>By continuing, you acknowledge:</p>
          <ul className="space-y-2">
            {[
              'This is a state-regulated apprenticeship program with legal requirements',
              'You must complete all required hours and coursework to earn your license',
              'Your progress is tracked and reported to regulatory bodies',
              'Withdrawal or dismissal does not automatically entitle you to a refund',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-slate-900 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> Enrollment is program-based. Courses, projects, and work
              activities are part of your program and cannot be accessed independently.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    if (!acknowledged) return;
    setSubmitting(true);
    try {
      await fetch('/api/enrollment/complete-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: cfg.slug }),
      });
    } catch {
      // Non-fatal — proceed regardless
    }
    router.push(`/programs/${cfg.slug}/documents`);
  };

  const CurrentIcon = sections[currentSection].icon;
  const isLastSection = currentSection === sections.length - 1;
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Orientation Progress</span>
            <span className="text-sm font-bold text-slate-900">{currentSection + 1} of {sections.length}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full ${c.bg} transition-all duration-300`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className={`${c.bg} px-6 py-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${c.bgDark} rounded-lg flex items-center justify-center`}>
                <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{sections[currentSection].title}</h2>
            </div>
          </div>

          <div className="p-6 min-h-[300px]">{sections[currentSection].content}</div>

          {isLastSection && (
            <div className="px-6 pb-4">
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => setAcknowledged(e.target.checked)}
                  className={`w-5 h-5 mt-0.5 rounded border-slate-300 ${c.text} focus:${c.ring}`}
                />
                <span className="text-slate-700">
                  <strong>I understand my responsibilities and agree to proceed.</strong>
                  <br />
                  <span className="text-sm text-slate-500">
                    By checking this box, I confirm I have read and understood all orientation materials.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentSection(s => s - 1)}
              disabled={currentSection === 0}
              className="px-6 py-3 text-slate-500 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 transition"
            >
              Previous
            </button>
            {isLastSection ? (
              <button
                onClick={handleComplete}
                disabled={!acknowledged || submitting}
                className={`px-8 py-3 ${c.bg} text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${c.hover} transition`}
              >
                {submitting ? 'Processing...' : 'Continue to Program'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentSection(s => s + 1)}
                className={`px-8 py-3 ${c.bg} text-white font-bold rounded-lg ${c.hover} transition`}
              >
                Next
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Estimated time: {orientationCfg.estimatedTime}
        </p>
      </div>
    </div>
  );
}
