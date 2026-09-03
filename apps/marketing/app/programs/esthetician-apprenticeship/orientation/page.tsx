'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Users, DollarSign, FileText, Shield } from 'lucide-react';
import { getOrientationConfig, formatCurrency } from '@/lms-data/orientationConfig';

const config = getOrientationConfig('esthetician-apprenticeship')!;

export default function EstheticianOrientationPage() {
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
          <p>After completing the required education, you can prepare to pursue the Indiana licensing process for this occupation.</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>
                Prepare to apply for the {config.licenseTitle} through the {config.licensingBody}, subject to the agency’s current requirements
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>Build supervised esthetics service, sanitation, documentation, and client-care skills</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>Pursue esthetics employment or business opportunities after satisfying applicable licensing requirements</span>
            </li>
          </ul>
          <p className="text-sm text-slate-600 mt-4">
            Federal Registered Apprenticeship status is not currently published for the esthetician occupation in Elevate’s canonical RAPIDS registry. This orientation does not represent the pathway as federally registered.
          </p>
        </div>
      ),
    },
    {
      title: 'How the Program Works',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            The {config.programTitle} follows a competency-based Appendix A standard requiring <strong>{config.hoursLabel}</strong> with supervised practice documented as auditable evidence.
          </p>
          <div className="grid gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-900">Supervised Practice</h4>
              <p className="text-blue-800 text-sm">{config.ojtDescription}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-bold text-indigo-900">Related Instruction</h4>
              <p className="text-indigo-800 text-sm">{config.rtiDescription}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            Your education and supervised-practice records are tracked digitally. Licensing credit and acceptance remain subject to the applicable Indiana authority.
          </p>
        </div>
      ),
    },
    {
      title: 'Attendance & Conduct Expectations',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>As a participant, you are expected to:</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span><strong>Attend consistently.</strong> Required RTI hours and all Appendix A competencies must be completed and documented; supervised work hours remain auditable evidence.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span><strong>Maintain professionalism.</strong> Host-site dress, conduct, safety, and client-care standards apply.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span><strong>Complete instruction on time.</strong> Coursework and documented practice must remain current.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span><strong>Communicate proactively.</strong> Contact your coordinator when schedule, placement, documentation, or support issues arise.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Payment Terms',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <p>Your current self-pay enrollment record uses the following published program amount:</p>
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span>Program Total</span>
              <span className="font-bold">{formatCurrency(config.tuition.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Initial Payment Structure</span>
              <span className="font-bold">Confirmed at checkout</span>
            </div>
            <div className="flex justify-between">
              <span>Installment Availability</span>
              <span className="font-bold">{config.tuition.paymentFrequency}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600">{config.tuition.fundingNote}</p>
          <p className="text-sm text-red-600 font-medium">
            Review the signed enrollment agreement and checkout terms for the controlling payment, cancellation, and refund provisions.
          </p>
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
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>This pathway is designed around Indiana esthetics education and licensing requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>You must complete required education and satisfy the licensing authority’s current requirements before licensure</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>Your program progress and supporting records are maintained for verification and applicable reporting</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <span>Payment, withdrawal, cancellation, and refund rights are controlled by your signed enrollment documents and applicable law</span>
            </li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> Enrollment is program-based. Courses, projects, supervised practice, and documentation are components of the pathway and must remain connected to the participant’s program record.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSection < sections.length - 1) setCurrentSection(currentSection + 1);
  };

  const handlePrevious = () => {
    if (currentSection > 0) setCurrentSection(currentSection - 1);
  };

  const handleComplete = async () => {
    if (!acknowledged) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/enrollment/complete-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'esthetician-apprenticeship' }),
      });
      if (!response.ok) throw new Error('Orientation completion was not saved');
      router.push('/programs/esthetician-apprenticeship/documents');
    } catch {
      setSubmitting(false);
    }
  };

  const CurrentIcon = sections[currentSection].icon;
  const isLastSection = currentSection === sections.length - 1;
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Orientation Progress</span>
            <span className="text-sm font-bold text-slate-900">{currentSection + 1} of {sections.length}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-slate-900 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{sections[currentSection].title}</h2>
            </div>
          </div>

          <div className="p-6 min-h-[300px]">{sections[currentSection].content}</div>

          {isLastSection && (
            <div className="px-6 pb-6">
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
              onClick={handlePrevious}
              disabled={currentSection === 0}
              className="px-6 py-3 text-slate-600 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 transition"
            >
              Previous
            </button>
            {isLastSection ? (
              <button
                onClick={handleComplete}
                disabled={!acknowledged || submitting}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                {submitting ? 'Processing...' : 'Continue to Program'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">Estimated time: {config.estimatedTime}</p>
      </div>
    </div>
  );
}
