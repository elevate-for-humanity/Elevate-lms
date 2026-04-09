'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, DollarSign, FileText, Shield } from 'lucide-react';
import { getOrientationConfig, formatCurrency } from '@/lms-data/orientationConfig';

const config = getOrientationConfig('cosmetology-apprenticeship')!;

export default function CosmetologyOrientationPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = [
    {
      title: 'What This Program Leads To',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>Upon successful completion of this program, you will be eligible to:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>Obtain your {config.licenseTitle} through the {config.licensingBody}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>Work legally as a licensed cosmetologist in the state of Indiana</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>Earn {config.salaryRange} annually depending on location and clientele</span>
            </li>
          </ul>
          <p className="text-sm text-black mt-4">
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
          <p>The {config.programTitle} requires <strong>{config.hoursLabel}</strong> of combined training:</p>
          <div className="grid gap-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900">On-the-Job Training (OJT)</h4>
              <p className="text-purple-800 text-sm">{config.ojtDescription}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900">Related Technical Instruction (RTI)</h4>
              <p className="text-purple-800 text-sm">{config.rtiDescription}</p>
            </div>
          </div>
          <p className="text-sm text-black mt-4">
            Your hours are logged digitally and verified by your instructor. You can track progress in your dashboard.
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
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span><strong>Attend consistently.</strong> Missed hours must be made up. Excessive absences may result in program dismissal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span><strong>Maintain professionalism.</strong> You represent the salon and the program. Dress code and conduct standards apply.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span><strong>Complete coursework on time.</strong> RTI modules have deadlines. Falling behind affects your progress.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span><strong>Communicate proactively.</strong> If issues arise, contact your coordinator immediately. We&apos;re here to help.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Pay & Funding',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl">
            <p className="text-2xl font-black text-purple-900 mb-1">$0 Tuition</p>
            <p className="text-purple-800 text-sm">This is an earn-while-you-learn apprenticeship. There is no tuition.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">You earn wages from your host salon</p>
                <p className="text-slate-600 text-sm">Apprentices are employees. Your salon pays you at least minimum wage throughout training.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">WIOA & Workforce Ready Grant may cover tools and exam fees</p>
                <p className="text-slate-600 text-sm">If you qualify, public workforce funding can cover your state board exam fee, tools, and supplies.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">State board exam fee: ~$75</p>
                <p className="text-slate-600 text-sm">Paid directly to Indiana IPLA when you apply for your license after completing 2,000 hours.</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500">{config.tuition.fundingNote}</p>
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
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>This is a state-regulated apprenticeship program with legal requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>You must complete all required hours and coursework to earn your license</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>Your progress is tracked and reported to regulatory bodies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black flex-shrink-0">•</span>
              <span>Withdrawal or dismissal does not automatically entitle you to a refund</span>
            </li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> Enrollment is program-based. Courses, projects, and work activities are part of your program and cannot be accessed independently.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleComplete = async () => {
    if (!acknowledged) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/enrollment/complete-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'cosmetology-apprenticeship' }),
      });
      
      if (response.ok) {
        router.push('/programs/cosmetology-apprenticeship/documents');
      } else {
        router.push('/programs/cosmetology-apprenticeship/documents');
      }
    } catch {
      router.push('/programs/cosmetology-apprenticeship/documents');
    }
  };

  const CurrentIcon = sections[currentSection].icon;
  const isLastSection = currentSection === sections.length - 1;
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-black">
              Orientation Progress
            </span>
            <span className="text-sm font-bold text-slate-900">
              {currentSection + 1} of {sections.length}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {sections[currentSection].title}
              </h2>
            </div>
          </div>

          <div className="p-6 min-h-[300px]">
            {sections[currentSection].content}
          </div>

          {isLastSection && (
            <div className="px-6 pb-6">
              <label className="flex items-start gap-3 p-4 bg-white rounded-lg cursor-pointer hover:bg-white transition">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-700">
                  <strong>I understand my responsibilities and agree to proceed.</strong>
                  <br />
                  <span className="text-sm text-black">
                    By checking this box, I confirm I have read and understood all orientation materials.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentSection === 0}
              className="px-6 py-3 text-black font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 transition"
            >
              Previous
            </button>

            {isLastSection ? (
              <button
                onClick={handleComplete}
                disabled={!acknowledged || submitting}
                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
              >
                {submitting ? 'Processing...' : 'Continue to Program'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-black text-sm mt-6">
          Estimated time: {config.estimatedTime}
        </p>
      </div>
    </div>
  );
}
