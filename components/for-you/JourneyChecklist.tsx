import React from 'react';
import {
  Clock,
  FileCheck,
  GraduationCap,
  Phone,
CheckCircle, } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  duration: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Apply',
    duration: '2 minutes',
    description: 'Fill out simple form with your name, email, and phone number',
    icon: <FileCheck className="h-10 w-10" />,
  },
  {
    number: 2,
    title: 'We Call You',
    duration: '24 hours',
    description:
      'An advisor reviews your application and calls to explain next steps',
    icon: <Phone className="h-10 w-10" />,
  },
  {
    number: 3,
    title: 'Check Eligibility',
    duration: '1 week',
    description: 'We handle all funding paperwork and eligibility verification',
    icon: <span className="text-slate-400 flex-shrink-0">•</span>,
  },
  {
    number: 4,
    title: 'Start Training',
    duration: '1-2 weeks',
    description: 'Enroll with accredited provider and begin your program',
    icon: <GraduationCap className="h-10 w-10" />,
  },
  {
    number: 5,
    title: 'Earn Credential',
    duration: 'Varies by program',
    description:
      'Complete training, pass certification exam, launch your new career',
    icon: <GraduationCap className="h-10 w-10" />,
  },
];

export function JourneyChecklist() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block" />

        <div className="space-y-8">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative flex gap-6 items-start">
              {/* Step number circle */}
              <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                {step.number}
              </div>

              {/* Step content */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-brand-blue-600">{step.icon}</div>
                    <h3 className="text-xl font-bold text-black">
                      {step.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-black text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{step.duration}</span>
                  </div>
                </div>
                <p className="text-black">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary box */}
      <div className="mt-12 bg-brand-blue-50 border-2 border-brand-blue-600 rounded-lg p-8 text-center">
        <h4 className="text-2xl font-bold text-brand-blue-900 mb-3">
          Total Timeline: 2-4 Weeks to Start
        </h4>
        <p className="text-brand-blue-900 text-lg">
          From application to first day of training, most students start within
          2-4 weeks.
        </p>
      </div>
    </div>
  );
}
