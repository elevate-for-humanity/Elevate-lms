'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Lock,
  PartyPopper,
  Play,
CheckCircle, } from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  price: number;
  stripePriceId?: string; // Stripe Price ID for payment
  topics: string[];
  certification: string;
  prerequisite?: string;
}

const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'tax-basics',
    title: 'Tax Preparation Fundamentals',
    description:
      'Complete beginner course covering everything you need to start preparing tax returns. Learn the Elevate method - no prior experience required!',
    duration: '12 hours',
    lessons: 24,
    price: 199, // FREE for employees, $199 for public
    stripePriceId: 'price_tax_prep_fundamentals', // Replace with actual Stripe Price ID
    topics: [
      'Understanding the U.S. tax system',
      'Filing status determination (Single, MFJ, MFS, HOH, QW)',
      'Personal exemptions and dependents',
      'Income types: W-2 wages and salaries',
      'Income types: 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV',
      'Self-employment income (Schedule C)',
      'Standard deduction vs itemized deductions',
      'Common itemized deductions (mortgage interest, property tax, charitable)',
      'Above-the-line deductions (student loan interest, IRA contributions)',
      'Child Tax Credit and Additional Child Tax Credit',
      'Earned Income Tax Credit (EITC)',
      'American Opportunity Tax Credit and Lifetime Learning Credit',
      'Tax calculations and tax brackets',
      'Federal withholding and estimated taxes',
      'Form 1040 line-by-line walkthrough',
      'Common schedules (Schedule 1, 2, 3)',
      'State tax return basics',
      'IRS forms and where to find them',
      'Ethics and due diligence requirements',
      'Client confidentiality (IRC Section 7216)',
      'PTIN requirements and how to get one',
      'Practice returns: Simple W-2 only',
      'Practice returns: W-2 with dependents and credits',
      'Practice returns: Self-employment income',
    ],
    certification: 'Elevate for Humanity Tax Preparation Certificate',
  },
  {
    id: 'irs-regulations',
    title: 'IRS Ethics & Professional Standards',
    description:
      'Learn IRS regulations, preparer responsibilities, and ethical standards. Elevate-certified training ensures compliance.',
    duration: '6 hours',
    lessons: 12,
    price: 149, // FREE for employees, $149 for public
    stripePriceId: 'price_irs_ethics',
    topics: [
      'IRS Circular 230 overview',
      'Preparer Tax Identification Number (PTIN)',
      'Who must have a PTIN',
      'Preparer penalties and sanctions',
      'Due diligence requirements for EITC, CTC, AOTC, and HOH',
      'Client confidentiality requirements (IRC 7216)',
      'Consent requirements for disclosure',
      'Record retention requirements',
      'Preparer signature requirements',
      'Electronic filing requirements',
      'Continuing education requirements',
      'Professional conduct and best practices',
    ],
    certification: 'Elevate for Humanity Ethics Certificate',
  },
  {
    id: 'advanced-returns',
    title: 'Advanced Tax Strategies',
    description:
      'Master complex tax situations including rental property, investments, and multi-state returns using Elevate-proven techniques.',
    duration: '16 hours',
    lessons: 20,
    price: 199,
    stripePriceId: 'price_advanced_returns',
    prerequisite: 'tax-basics',
    topics: [
      'Rental property income and expenses (Schedule E)',
      'Depreciation and Section 179',
      'Capital gains and losses (Schedule D)',
      'Form 8949 for investment sales',
      'Cryptocurrency taxation',
      'Stock options and RSUs',
      'Qualified Business Income Deduction (QBI)',
      'Home office deduction',
      'Vehicle expenses (actual vs standard mileage)',
      'Multi-state tax returns',
      'Part-year resident returns',
      'Nonresident state returns',
      'Retirement distributions (1099-R)',
      'Social Security taxation',
      'Health Savings Accounts (HSA)',
      'Alternative Minimum Tax (AMT)',
      'Net Investment Income Tax',
      'Self-employment tax calculations',
      'Estimated tax payments',
      'Practice: Complex return with rental and investments',
    ],
    certification: 'Elevate for Humanity Advanced Tax Certificate',
  },
  {
    id: 'business-returns',
    title: 'Business Tax Mastery',
    description:
      'Learn to prepare business returns for sole proprietors, partnerships, S-corps, and C-corps with Elevate best practices.',
    duration: '20 hours',
    lessons: 25,
    price: 299,
    stripePriceId: 'price_business_returns',
    prerequisite: 'advanced-returns',
    topics: [
      'Business entity types overview',
      'Schedule C for sole proprietors',
      'Business income and expense categories',
      'Cost of goods sold (COGS)',
      'Business use of home',
      'Business vehicle expenses',
      'Form 1065 for partnerships',
      'Partnership K-1s',
      'Form 1120S for S-corporations',
      'S-corp shareholder basis',
      'Form 1120 for C-corporations',
      'Corporate tax rates and calculations',
      'Payroll tax basics',
      'Form 941 quarterly payroll',
      'Form 940 unemployment tax',
      'W-2 and W-3 preparation',
      '1099-NEC for contractors',
      'Sales tax obligations',
      'Business tax credits',
      'Section 199A QBI deduction',
      'Accounting methods (cash vs accrual)',
      'Inventory valuation',
      'Depreciation methods',
      'Practice: Schedule C return',
      'Practice: Partnership return',
    ],
    certification: 'Elevate for Humanity Business Tax Certificate',
  },
  {
    id: 'tax-software-mastery',
    title: 'Professional Tax Software Excellence',
    description:
      'Master professional tax software with Elevate-exclusive training methods, data entry shortcuts, and e-filing procedures.',
    duration: '10 hours',
    lessons: 15,
    price: 149,
    stripePriceId: 'price_software_mastery',
    prerequisite: 'tax-basics',
    topics: [
      'Professional tax software overview',
      'Creating and managing client files',
      'Data entry best practices',
      'Keyboard shortcuts for speed',
      'Form navigation',
      'Automatic calculations and overrides',
      'Error checking and diagnostics',
      'E-file setup and EFIN',
      'E-file transmission procedures',
      'Acknowledgment processing',
      'Rejection troubleshooting',
      'State e-file procedures',
      'Bank products and refund transfers',
      'Printing and PDF generation',
      'Practice: Complete return start to e-file',
    ],
    certification: 'Elevate for Humanity Tax Software Certificate',
  },
  {
    id: 'refund-advances',
    title: 'Refund Advance Products',
    description:
      'Learn to offer and process refund advances using Elevate-approved methods, maximizing revenue while helping clients.',
    duration: '4 hours',
    lessons: 8,
    price: 99,
    stripePriceId: 'price_refund_advances',
    prerequisite: 'tax-basics',
    topics: [
      'Refund advance overview and benefits',
      'EPS Financial products and integration',
      'Pathward Bank partnership',
      'Application process step-by-step',
      'Eligibility requirements',
      'Fee structures and disclosure requirements',
      'Compliance and regulations',
      'Customer service and objection handling',
    ],
    certification: 'Elevate for Humanity Refund Advance Specialist Certificate',
  },
  {
    id: 'client-service',
    title: 'Client Service Excellence',
    description:
      'Build a successful tax practice with Elevate-proven client service, marketing, and retention strategies.',
    duration: '6 hours',
    lessons: 10,
    price: 79,
    stripePriceId: 'price_client_service',
    topics: [
      'Client intake and onboarding',
      'Effective client communication',
      'Managing client expectations',
      'Handling difficult situations',
      'Marketing your tax services',
      'Social media for tax preparers',
      'Referral programs',
      'Client retention strategies',
      'Pricing your services',
      'Building a year-round practice',
    ],
    certification: 'Elevate for Humanity Client Service Certificate',
  },
];



export default function TrainingPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [enrolledModules, setEnrolledModules] = useState<string[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState('');

  const handleEnroll = async (moduleId: string, isFree: boolean = false) => {
    const module = TRAINING_MODULES.find((m) => m.id === moduleId);
    if (!module) return;

    // If employee with valid key, enroll for free
    if (isEmployee) {
      setEnrolledModules([...enrolledModules, moduleId]);
      alert('Enrolled successfully! Access granted as employee.');
      return;
    }

    // If trying to enroll in paid course, redirect to Stripe checkout
    if (module.price > 0 && module.stripePriceId) {
      try {
        const response = await fetch(
          '/api/supersonic-fast-cash/create-checkout',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceId: module.stripePriceId,
              courseId: module.id,
              courseName: module.title,
              successUrl: `${window.location.origin}/supersonic-fast-cash/careers/training?success=true&course=${module.id}`,
              cancelUrl: `${window.location.origin}/supersonic-fast-cash/careers/training?canceled=true`,
            }),
          }
        );

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        alert('Error processing payment. Please try again.');
        logger.error('Stripe checkout error:', error);
      }
      return;
    }

    // Free course for public (shouldn't happen with current setup)
    setEnrolledModules([...enrolledModules, moduleId]);
    alert('Enrollment successful! You will receive access details via email.');
  };

  const handleAccessKeySubmit = async () => {
    // Validate access key
    try {
      const response = await fetch(
        '/api/supersonic-fast-cash/validate-access-key',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessKey, email: employeeEmail }),
        }
      );

      const result = await response.json();

      if (result.valid) {
        setIsEmployee(true);
        setShowAccessKeyModal(false);
        // Enroll in all courses automatically
        setEnrolledModules(TRAINING_MODULES.map((m) => m.id));
        alert(
          'Access key validated! You now have FREE access to ALL courses as an employee.'
        );
      } else {
        alert(
          'Invalid access key. Please check your email for the correct key or contact HR.'
        );
      }
    } catch (error) {
      alert('Error validating access key. Please try again.');
    }
  };

  const isPrerequisiteMet = (module: TrainingModule) => {
    if (!module.prerequisite) return true;
    return completedModules.includes(module.prerequisite);
  };

  const selectedModuleData = selectedModule
    ? TRAINING_MODULES.find((m) => m.id === selectedModule)
    : null;

  return (
    <div className="min-h-screen bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Training" }]} />
      </div>
<div className="max-w-7xl mx-auto px-6">
        {/* New Applicant Banner */}
        <div className="bg-slate-700 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              <GraduationCap className="w-5 h-5 inline-block" /> Two Ways to
              Access Training
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Option 1: Apply for Job */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-2xl font-bold mb-3">
                  Option 1: Work With Us
                </div>
                <div className="text-lg mb-4">
                  Get <strong>ALL courses FREE</strong> when you join our team!
                </div>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• FREE training (worth $1,000+)</li>
                  <li>• Earn money preparing taxes</li>
                  <li>• Flexible schedule</li>
                  <li>• Work from home option</li>
                </ul>
                <div className="space-y-2">
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Step 1:</strong> Apply for tax preparer position
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Step 2:</strong> Get FREE access to all training
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Step 3:</strong> Take competency test
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Step 4:</strong> Get hired & start earning!
                  </div>
                </div>
                <button
                  onClick={() =>
                    (window.location.href =
                      '/supersonic-fast-cash/careers/apply')
                  }
                  className="w-full mt-4 bg-white text-brand-green-600 py-3 px-6 rounded-lg font-bold hover:bg-white"
                >
                  Apply Now (Get FREE Training)
                </button>
              </div>

              {/* Option 2: Buy Training */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-2xl font-bold mb-3">
                  Option 2: Buy Training Only
                </div>
                <div className="text-lg mb-4">
                  Purchase courses individually or as bundles
                </div>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• Learn at your own pace</li>
                  <li>• Get certified</li>
                  <li>• Start your own tax business</li>
                  <li>• Lifetime access</li>
                </ul>
                <div className="space-y-2">
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Tax Prep Fundamentals:</strong> $199
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>IRS Ethics:</strong> $149
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Advanced Returns:</strong> $199
                  </div>
                  <div className="bg-white/20 rounded p-3 text-sm">
                    <strong>Complete Bundle:</strong> $799 (Save $200!)
                  </div>
                </div>
                <button
                  onClick={() => {
                    const taxBasics = document.getElementById('tax-basics');
                    taxBasics?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-4 bg-yellow-500 text-black py-3 px-6 rounded-lg font-bold hover:bg-yellow-400"
                >
                  Browse Courses Below
                </button>
              </div>
            </div>

            {/* Already Applied */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="mb-3">Have an employee access key?</p>
                  <button
                    onClick={() => setShowAccessKeyModal(true)}
                    className="bg-white text-brand-green-600 py-2 px-6 rounded-lg font-bold hover:bg-white"
                  >
                    Enter Access Key
                  </button>
                </div>
                <div className="text-center">
                  <p className="mb-3">Need tax software?</p>
                  <button
                    onClick={() =>
                      (window.location.href = '/supersonic-fast-cash/tools')
                    }
                    className="bg-white text-brand-green-600 py-2 px-6 rounded-lg font-bold hover:bg-white"
                  >
                    View Software Options
                  </button>
                </div>
                <div className="text-center">
                  <p className="mb-3">Already completed training?</p>
                  <button
                    onClick={() =>
                      (window.location.href =
                        '/supersonic-fast-cash/careers/competency-test')
                    }
                    className="bg-white text-brand-green-600 py-2 px-6 rounded-lg font-bold hover:bg-white"
                  >
                    Take Competency Test →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tax Preparer Training</h1>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Professional training courses. Get certified and start preparing tax
            returns.
          </p>
        </div>

        {/* Training Bundles */}
        <div className="bg-slate-700 rounded-xl shadow-lg p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-4">
            Training Bundles - Save Big!
          </h2>
          <div className="bg-yellow-400 text-black rounded-lg p-4 mb-6 font-bold text-center">
            <PartyPopper className="w-5 h-5 inline-block" /> Employees get ALL
            courses FREE! Apply now to save $1,000+
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">
                Complete Professional Bundle
              </h3>
              <p className="text-sm mb-3 opacity-90">
                All 7 courses - Everything you need to start a tax business
              </p>
              <div className="text-3xl font-bold mb-2">$799</div>
              <div className="text-sm opacity-75 line-through">
                Regular: $1,074
              </div>
              <div className="text-sm font-semibold">Save $275</div>
              <div className="mt-4 text-xs opacity-75">
                Includes: Tax Prep Fundamentals, IRS Ethics, Advanced Returns,
                Business Returns, Software Mastery, Refund Advances, Client
                Service
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">Starter Bundle</h3>
              <p className="text-sm mb-3 opacity-90">
                Perfect for beginners - Get started preparing taxes
              </p>
              <div className="text-3xl font-bold mb-2">$299</div>
              <div className="text-sm opacity-75 line-through">
                Regular: $497
              </div>
              <div className="text-sm font-semibold">Save $198</div>
              <div className="mt-4 text-xs opacity-75">
                Includes: Tax Prep Fundamentals, IRS Ethics, Software Mastery
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">Advanced Bundle</h3>
              <p className="text-sm mb-3 opacity-90">
                For experienced preparers wanting to level up
              </p>
              <div className="text-3xl font-bold mb-2">$499</div>
              <div className="text-sm opacity-75 line-through">
                Regular: $697
              </div>
              <div className="text-sm font-semibold">Save $198</div>
              <div className="mt-4 text-xs opacity-75">
                Includes: Advanced Returns, Business Returns, Refund Advances,
                Client Service
              </div>
            </div>
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {TRAINING_MODULES.map((module) => {
            const isEnrolled = enrolledModules.includes(module.id);
            const isCompleted = completedModules.includes(module.id);
            const prerequisiteMet = isPrerequisiteMet(module);

            return (
              <div
                key={module.id}
                id={module.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  !prerequisiteMet ? 'opacity-60' : ''
                } ${module.price === 0 ? 'ring-4 ring-yellow-400' : ''}`}
              >
                <div className="bg-slate-700 p-6 text-white relative">
                  {module.price === 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black px-3 py-2 rounded-full text-xs font-bold">
                      FREE!
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg pr-16">{module.title}</h3>
                    {isCompleted && <span className="text-black flex-shrink-0">•</span>}
                    {!prerequisiteMet && <Lock className="w-6 h-6" />}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {module.lessons} lessons
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-black text-sm mb-4">
                    {module.description}
                  </p>

                  {module.prerequisite && !prerequisiteMet && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                      <strong>Prerequisite:</strong> Complete{' '}
                      {
                        TRAINING_MODULES.find(
                          (m) => m.id === module.prerequisite
                        )?.title
                      }{' '}
                      first
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-brand-green-600" />
                      <span className="font-semibold text-sm">
                        Certification:
                      </span>
                    </div>
                    <p className="text-sm text-black">
                      {module.certification}
                    </p>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        {isEmployee ? (
                          <div>
                            <span className="text-3xl font-bold text-brand-green-600">
                              FREE
                            </span>
                            <div className="text-sm text-brand-green-600 font-semibold">
                              Employee Access
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-brand-green-600">
                              ${module.price}
                            </span>
                            <div className="text-sm text-black">
                              FREE for employees
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEmployee && (
                    <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-3 mb-3 text-sm text-brand-green-700">
                      • You have employee access to this course
                    </div>
                  )}

                  {isEnrolled ? (
                    <button
                      onClick={() => setSelectedModule(module.id)}
                      className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        prerequisiteMet && handleEnroll(module.id, isEmployee)
                      }
                      disabled={!prerequisiteMet}
                      className="w-full bg-brand-green-600 text-white py-3 rounded-lg font-bold hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {prerequisiteMet
                        ? isEmployee
                          ? 'Start Course (FREE)'
                          : `Enroll for $${module.price}`
                        : 'Locked'}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedModule(module.id)}
                    className="w-full mt-2 text-brand-blue-600 py-2 text-sm font-semibold hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Access Key Modal */}
        {showAccessKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold mb-4">Employee Access Key</h2>
              <p className="text-black mb-6">
                Enter the access key from your welcome email to get FREE access
                to all training courses.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-semibold mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Access Key *
                  </label>
                  <input
                    type="text"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border rounded-lg font-mono"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                  />
                  <p className="text-xs text-black mt-1">
                    Format: XXXX-XXXX-XXXX-XXXX (check your email)
                  </p>
                </div>
              </div>

              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6 text-sm">
                <strong>Don't have an access key?</strong>
                <p className="mt-1">
                  Access keys are sent to new employees after they pass the
                  competency test. If you haven't received yours, contact HR at
                  supersonicfastcashllc@gmail.com
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAccessKeyModal(false);
                    setAccessKey('');
                    setEmployeeEmail('');
                  }}
                  className="flex-1 bg-gray-300 text-black py-3 rounded-lg font-bold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccessKeySubmit}
                  disabled={!accessKey || !employeeEmail}
                  className="flex-1 bg-brand-green-600 text-white py-3 rounded-lg font-bold hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Validate Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Module Details Modal */}
        {selectedModuleData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-700 p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">
                  {selectedModuleData.title}
                </h2>
                <p className="text-lg opacity-90">
                  {selectedModuleData.description}
                </p>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-brand-green-600" />
                    <div className="font-bold">
                      {selectedModuleData.duration}
                    </div>
                    <div className="text-sm text-black">Duration</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-brand-blue-600" />
                    <div className="font-bold">
                      {selectedModuleData.lessons} Lessons
                    </div>
                    <div className="text-sm text-black">Content</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-brand-blue-600" />
                    <div className="font-bold">Certificate</div>
                    <div className="text-sm text-black">Upon Completion</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">Topics Covered:</h3>
                  <ul className="space-y-2">
                    {selectedModuleData.topics.map((topic, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-black flex-shrink-0">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-brand-green-600" />
                    <strong>Certification:</strong>
                  </div>
                  <p className="text-sm">{selectedModuleData.certification}</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="flex-1 bg-gray-300 text-black py-3 rounded-lg font-bold hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEnroll(selectedModuleData.id);
                      setSelectedModule(null);
                    }}
                    className="flex-1 bg-brand-green-600 text-white py-3 rounded-lg font-bold hover:bg-brand-green-700"
                  >
                    Enroll for ${selectedModuleData.price}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Training Information</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">What's Included:</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  • Live instruction from Elevate-certified tax professionals
                </li>
                <li>• Digital course materials and workbook</li>
                <li>• Practice tax returns and real-world scenarios</li>
                <li>• Professional tax software access (training version)</li>
                <li>• Elevate for Humanity certificate of completion</li>
                <li>• 30 days post-training email support</li>
                <li>• Access to recorded sessions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3">
                Certification Requirements:
              </h3>
              <ul className="space-y-2 text-sm">
                <li>1. Complete all required lessons</li>
                <li>2. Pass final exam (80% or higher)</li>
                <li>3. Complete hands-on practicum</li>
                <li>4. Submit sample tax return</li>
              </ul>

              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">Payment Options:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Credit/Debit card</li>
                  <li>• Pay in 4 with Klarna, Afterpay, or Zip</li>
                  <li>• Company purchase order</li>
                  <li>• Payment plans available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
