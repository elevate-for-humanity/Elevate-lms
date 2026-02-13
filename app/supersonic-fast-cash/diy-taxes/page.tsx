'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Calculator,
  FileText,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

const SOFTWARE_VERSION = '2026.1.0';

interface TaxReturn {
  // Personal Info
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;

  // Filing Status
  filingStatus:
    | 'single'
    | 'married_joint'
    | 'married_separate'
    | 'head_of_household'
    | 'qualifying_widow'
    | '';

  // Spouse (if married)
  spouseFirstName: string;
  spouseLastName: string;
  spouseSSN: string;
  spouseDateOfBirth: string;

  // Dependents
  dependents: Array<{
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    relationship: string;
  }>;

  // Income
  w2Income: Array<{
    employer: string;
    ein: string;
    wages: number;
    federalWithholding: number;
    stateWithholding: number;
  }>;

  form1099Income: Array<{
    type: string;
    payer: string;
    amount: number;
    federalWithholding: number;
  }>;

  selfEmploymentIncome: {
    hasIncome: boolean;
    businessName: string;
    grossReceipts: number;
    expenses: number;
  };

  // Deductions
  deductionType: 'standard' | 'itemized' | '';
  itemizedDeductions: {
    mortgageInterest: number;
    propertyTax: number;
    charitableContributions: number;
    medicalExpenses: number;
    stateLocalTaxes: number;
  };

  // Credits
  hasChildTaxCredit: boolean;
  hasEITC: boolean;
  hasEducationCredits: boolean;

  // Bank Info
  bankName: string;
  accountType: 'checking' | 'savings' | '';
  routingNumber: string;
  accountNumber: string;
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: FileText },
  { id: 2, title: 'Filing Status', icon: FileText },
  { id: 3, title: 'Income', icon: DollarSign },
  { id: 4, title: 'Deductions', icon: Calculator },
  { id: 5, title: 'Credits', icon: CheckCircle },
  { id: 6, title: 'Review & File', icon: CheckCircle },
];



export default function DIYTaxesPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [taxReturn, setTaxReturn] = useState<TaxReturn>({
    firstName: '',
    lastName: '',
    ssn: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    email: '',
    phone: '',
    filingStatus: '',
    spouseFirstName: '',
    spouseLastName: '',
    spouseSSN: '',
    spouseDateOfBirth: '',
    dependents: [],
    w2Income: [],
    form1099Income: [],
    selfEmploymentIncome: {
      hasIncome: false,
      businessName: '',
      grossReceipts: 0,
      expenses: 0,
    },
    deductionType: '',
    itemizedDeductions: {
      mortgageInterest: 0,
      propertyTax: 0,
      charitableContributions: 0,
      medicalExpenses: 0,
      stateLocalTaxes: 0,
    },
    hasChildTaxCredit: false,
    hasEITC: false,
    hasEducationCredits: false,
    bankName: '',
    accountType: '',
    routingNumber: '',
    accountNumber: '',
  });

  const [estimatedRefund, setEstimatedRefund] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const hasLoggedEntry = useRef(false);

  // Audit log: DIY tax flow opened
  useEffect(() => {
    if (!hasLoggedEntry.current) {
      hasLoggedEntry.current = true;
      fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tax_diy_opened',
          metadata: { path: '/supersonic-fast-cash/diy-taxes', software_version: SOFTWARE_VERSION },
        }),
      }).catch(() => {}); // Non-blocking
    }
  }, []);

  // Calculate estimated refund whenever data changes
  useEffect(() => {
    calculateRefund();
  }, [taxReturn]);

  const calculateRefund = async () => {
    setCalculating(true);
    try {
      const response = await fetch('/api/supersonic-fast-cash/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxReturn),
      });
      const result = await response.json();
      setEstimatedRefund(result.estimatedRefund || 0);
    } catch (error) {
      logger.error('Calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const saveProgress = async () => {
    try {
      await fetch('/api/supersonic-fast-cash/save-tax-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxReturn, currentStep }),
      });
      alert('Progress saved!');
    } catch (error) {
      logger.error('Save error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const addDependent = () => {
    setTaxReturn({
      ...taxReturn,
      dependents: [
        ...taxReturn.dependents,
        {
          firstName: '',
          lastName: '',
          ssn: '',
          dateOfBirth: '',
          relationship: '',
        },
      ],
    });
  };

  const addW2 = () => {
    setTaxReturn({
      ...taxReturn,
      w2Income: [
        ...taxReturn.w2Income,
        {
          employer: '',
          ein: '',
          wages: 0,
          federalWithholding: 0,
          stateWithholding: 0,
        },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Diy Taxes" }]} />
      </div>
<div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Do Your Own Taxes</h1>
          <p className="text-xl text-black">
            Step-by-step guidance to maximize your refund
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Secure Session</p>
              <p className="text-sm text-blue-700">
                Your information is protected with industry-standard encryption. Sensitive data such as Social Security Numbers is collected only within this secure, authenticated session and is never stored unencrypted.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-black'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Estimated Refund */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-sm text-black mb-1">Estimated Refund</div>
            <div className="text-3xl font-bold text-green-600">
              {calculating
                ? 'Calculating...'
                : `$${estimatedRefund.toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={taxReturn.firstName}
                      onChange={(e) =>
                        setTaxReturn({
                          ...taxReturn,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={taxReturn.lastName}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">
                      Social Security Number *
                    </label>
                    <input
                      type="text"
                      value={taxReturn.ssn}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, ssn: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="XXX-XX-XXXX"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={taxReturn.dateOfBirth}
                      onChange={(e) =>
                        setTaxReturn({
                          ...taxReturn,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={taxReturn.address}
                    onChange={(e) =>
                      setTaxReturn({ ...taxReturn, address: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">City *</label>
                    <input
                      type="text"
                      value={taxReturn.city}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">State *</label>
                    <input
                      type="text"
                      value={taxReturn.state}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, state: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={taxReturn.zip}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, zip: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      value={taxReturn.email}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={taxReturn.phone}
                      onChange={(e) =>
                        setTaxReturn({ ...taxReturn, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Filing Status */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Filing Status</h2>
              <p className="text-black mb-6">
                Your filing status determines your tax rates and standard
                deduction amount.
              </p>

              <div className="space-y-4">
                {[
                  {
                    value: 'single',
                    label: 'Single',
                    description: 'Unmarried, divorced, or legally separated',
                  },
                  {
                    value: 'married_joint',
                    label: 'Married Filing Jointly',
                    description: 'Married and filing together',
                  },
                  {
                    value: 'married_separate',
                    label: 'Married Filing Separately',
                    description: 'Married but filing separate returns',
                  },
                  {
                    value: 'head_of_household',
                    label: 'Head of Household',
                    description:
                      'Unmarried and pay more than half the cost of keeping up a home',
                  },
                  {
                    value: 'qualifying_widow',
                    label: 'Qualifying Widow(er)',
                    description:
                      'Spouse died in previous 2 years and you have a dependent child',
                  },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() =>
                      setTaxReturn({
                        ...taxReturn,
                        filingStatus: status.value as any,
                      })
                    }
                    className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                      taxReturn.filingStatus === status.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                          taxReturn.filingStatus === status.value
                            ? 'border-green-600 bg-green-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {taxReturn.filingStatus === status.value && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{status.label}</div>
                        <div className="text-sm text-black">
                          {status.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Spouse Info if Married */}
              {(taxReturn.filingStatus === 'married_joint' ||
                taxReturn.filingStatus === 'married_separate') && (
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">Spouse Information</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          Spouse First Name *
                        </label>
                        <input
                          type="text"
                          value={taxReturn.spouseFirstName}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              spouseFirstName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Spouse Last Name *
                        </label>
                        <input
                          type="text"
                          value={taxReturn.spouseLastName}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              spouseLastName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          Spouse SSN *
                        </label>
                        <input
                          type="text"
                          value={taxReturn.spouseSSN}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              spouseSSN: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                          placeholder="XXX-XX-XXXX"
                          maxLength={11}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Spouse Date of Birth *
                        </label>
                        <input
                          type="date"
                          value={taxReturn.spouseDateOfBirth}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              spouseDateOfBirth: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dependents */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Dependents</h3>
                  <button
                    onClick={addDependent}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    + Add Dependent
                  </button>
                </div>

                {taxReturn.dependents.length === 0 ? (
                  <div className="text-center py-8 text-black">
                    No dependents added yet. Click "Add Dependent" to add one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {taxReturn.dependents.map((dependent, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={dependent.firstName}
                            onChange={(e) => {
                              const newDependents = [...taxReturn.dependents];
                              newDependents[index].firstName = e.target.value;
                              setTaxReturn({
                                ...taxReturn,
                                dependents: newDependents,
                              });
                            }}
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={dependent.lastName}
                            onChange={(e) => {
                              const newDependents = [...taxReturn.dependents];
                              newDependents[index].lastName = e.target.value;
                              setTaxReturn({
                                ...taxReturn,
                                dependents: newDependents,
                              });
                            }}
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="SSN"
                            value={dependent.ssn}
                            onChange={(e) => {
                              const newDependents = [...taxReturn.dependents];
                              newDependents[index].ssn = e.target.value;
                              setTaxReturn({
                                ...taxReturn,
                                dependents: newDependents,
                              });
                            }}
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="date"
                            placeholder="Date of Birth"
                            value={dependent.dateOfBirth}
                            onChange={(e) => {
                              const newDependents = [...taxReturn.dependents];
                              newDependents[index].dateOfBirth = e.target.value;
                              setTaxReturn({
                                ...taxReturn,
                                dependents: newDependents,
                              });
                            }}
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Relationship (Son, Daughter, etc.)"
                            value={dependent.relationship}
                            onChange={(e) => {
                              const newDependents = [...taxReturn.dependents];
                              newDependents[index].relationship =
                                e.target.value;
                              setTaxReturn({
                                ...taxReturn,
                                dependents: newDependents,
                              });
                            }}
                            className="px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Income - Will add in next part */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Income</h2>
              <p className="text-black mb-6">
                Tell us about all your income for 2024.
              </p>

              {/* W-2 Income */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">W-2 Wages</h3>
                  <button
                    onClick={addW2}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    + Add W-2
                  </button>
                </div>

                {taxReturn.w2Income.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-black">
                    No W-2s added yet. Click "Add W-2" or upload your W-2 to
                    auto-fill.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {taxReturn.w2Income.map((w2, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Employer Name"
                            value={w2.employer}
                            onChange={(e) => {
                              const newW2s = [...taxReturn.w2Income];
                              newW2s[index].employer = e.target.value;
                              setTaxReturn({ ...taxReturn, w2Income: newW2s });
                            }}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                          <div className="grid md:grid-cols-3 gap-3">
                            <input
                              type="number"
                              placeholder="Wages (Box 1)"
                              value={w2.wages || ''}
                              onChange={(e) => {
                                const newW2s = [...taxReturn.w2Income];
                                newW2s[index].wages =
                                  parseFloat(e.target.value) || 0;
                                setTaxReturn({
                                  ...taxReturn,
                                  w2Income: newW2s,
                                });
                              }}
                              className="px-4 py-2 border rounded-lg"
                            />
                            <input
                              type="number"
                              placeholder="Federal Withholding (Box 2)"
                              value={w2.federalWithholding || ''}
                              onChange={(e) => {
                                const newW2s = [...taxReturn.w2Income];
                                newW2s[index].federalWithholding =
                                  parseFloat(e.target.value) || 0;
                                setTaxReturn({
                                  ...taxReturn,
                                  w2Income: newW2s,
                                });
                              }}
                              className="px-4 py-2 border rounded-lg"
                            />
                            <input
                              type="number"
                              placeholder="State Withholding (Box 17)"
                              value={w2.stateWithholding || ''}
                              onChange={(e) => {
                                const newW2s = [...taxReturn.w2Income];
                                newW2s[index].stateWithholding =
                                  parseFloat(e.target.value) || 0;
                                setTaxReturn({
                                  ...taxReturn,
                                  w2Income: newW2s,
                                });
                              }}
                              className="px-4 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload W-2 Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="mb-4">
                  Have a W-2? Upload it and we'll extract the data
                  automatically!
                </p>
                <button
                  onClick={() =>
                    (window.location.href =
                      '/supersonic-fast-cash/tools/smart-upload')
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
                >
                  Upload W-2 with OCR
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Deductions */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Deductions</h2>
              <p className="text-black mb-6">
                Choose between standard deduction or itemized deductions.
              </p>

              <div className="space-y-4 mb-8">
                <button
                  onClick={() =>
                    setTaxReturn({ ...taxReturn, deductionType: 'standard' })
                  }
                  className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                    taxReturn.deductionType === 'standard'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                        taxReturn.deductionType === 'standard'
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-400'
                      }`}
                    >
                      {taxReturn.deductionType === 'standard' && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        Standard Deduction
                      </div>
                      <div className="text-sm text-black">
                        Recommended for most people. Amount: $14,600 (Single),
                        $29,200 (Married)
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setTaxReturn({ ...taxReturn, deductionType: 'itemized' })
                  }
                  className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                    taxReturn.deductionType === 'itemized'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                        taxReturn.deductionType === 'itemized'
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-400'
                      }`}
                    >
                      {taxReturn.deductionType === 'itemized' && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        Itemized Deductions
                      </div>
                      <div className="text-sm text-black">
                        Choose this if you have mortgage interest, large
                        charitable donations, or high medical expenses
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Itemized Deductions Form */}
              {taxReturn.deductionType === 'itemized' && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">
                    Itemized Deductions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-2">
                        Mortgage Interest (Form 1098)
                      </label>
                      <input
                        type="number"
                        value={
                          taxReturn.itemizedDeductions.mortgageInterest || ''
                        }
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            itemizedDeductions: {
                              ...taxReturn.itemizedDeductions,
                              mortgageInterest: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                        placeholder="$0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">
                        Property Tax (Real Estate Tax)
                      </label>
                      <input
                        type="number"
                        value={taxReturn.itemizedDeductions.propertyTax || ''}
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            itemizedDeductions: {
                              ...taxReturn.itemizedDeductions,
                              propertyTax: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                        placeholder="$0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">
                        Charitable Contributions
                      </label>
                      <input
                        type="number"
                        value={
                          taxReturn.itemizedDeductions
                            .charitableContributions || ''
                        }
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            itemizedDeductions: {
                              ...taxReturn.itemizedDeductions,
                              charitableContributions:
                                parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                        placeholder="$0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">
                        Medical Expenses (over 7.5% of income)
                      </label>
                      <input
                        type="number"
                        value={
                          taxReturn.itemizedDeductions.medicalExpenses || ''
                        }
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            itemizedDeductions: {
                              ...taxReturn.itemizedDeductions,
                              medicalExpenses: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                        placeholder="$0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">
                        State and Local Taxes (SALT - max $10,000)
                      </label>
                      <input
                        type="number"
                        value={
                          taxReturn.itemizedDeductions.stateLocalTaxes || ''
                        }
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            itemizedDeductions: {
                              ...taxReturn.itemizedDeductions,
                              stateLocalTaxes: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                        placeholder="$0"
                        max={10000}
                      />
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          Total Itemized Deductions:
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          $
                          {(
                            taxReturn.itemizedDeductions.mortgageInterest +
                            taxReturn.itemizedDeductions.propertyTax +
                            taxReturn.itemizedDeductions
                              .charitableContributions +
                            taxReturn.itemizedDeductions.medicalExpenses +
                            Math.min(
                              taxReturn.itemizedDeductions.stateLocalTaxes,
                              10000
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Credits */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tax Credits</h2>
              <p className="text-black mb-6">
                Tax credits reduce your tax bill dollar-for-dollar. Let's see
                which ones you qualify for.
              </p>

              <div className="space-y-4">
                {/* Child Tax Credit */}
                <div className="p-6 border-2 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxReturn.hasChildTaxCredit}
                      onChange={(e) =>
                        setTaxReturn({
                          ...taxReturn,
                          hasChildTaxCredit: e.target.checked,
                        })
                      }
                      className="w-6 h-6 mt-1"
                    />
                    <div>
                      <div className="font-bold text-lg">Child Tax Credit</div>
                      <div className="text-sm text-black mt-1">
                        Up to $2,000 per qualifying child under age 17. Based on
                        your {taxReturn.dependents.length} dependent(s).
                      </div>
                      {taxReturn.hasChildTaxCredit && (
                        <div className="mt-3 text-green-600 font-semibold">
                          Estimated Credit: $
                          {Math.min(
                            taxReturn.dependents.length * 2000,
                            taxReturn.dependents.length * 2000
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Earned Income Tax Credit */}
                <div className="p-6 border-2 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxReturn.hasEITC}
                      onChange={(e) =>
                        setTaxReturn({
                          ...taxReturn,
                          hasEITC: e.target.checked,
                        })
                      }
                      className="w-6 h-6 mt-1"
                    />
                    <div>
                      <div className="font-bold text-lg">
                        Earned Income Tax Credit (EITC)
                      </div>
                      <div className="text-sm text-black mt-1">
                        For low to moderate income workers. Amount varies based
                        on income and number of children.
                      </div>
                      {taxReturn.hasEITC && (
                        <div className="mt-3 text-green-600 font-semibold">
                          We'll calculate your exact EITC amount based on your
                          income.
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Education Credits */}
                <div className="p-6 border-2 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxReturn.hasEducationCredits}
                      onChange={(e) =>
                        setTaxReturn({
                          ...taxReturn,
                          hasEducationCredits: e.target.checked,
                        })
                      }
                      className="w-6 h-6 mt-1"
                    />
                    <div>
                      <div className="font-bold text-lg">Education Credits</div>
                      <div className="text-sm text-black mt-1">
                        American Opportunity Credit (up to $2,500) or Lifetime
                        Learning Credit (up to $2,000) for college expenses.
                      </div>
                      {taxReturn.hasEducationCredits && (
                        <div className="mt-3 text-green-600 font-semibold">
                          You may qualify for up to $2,500 in education credits.
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">
                  Estimated Total Credits
                </h3>
                <div className="text-3xl font-bold text-green-600">
                  $
                  {(
                    (taxReturn.hasChildTaxCredit
                      ? taxReturn.dependents.length * 2000
                      : 0) +
                    (taxReturn.hasEITC ? 3000 : 0) +
                    (taxReturn.hasEducationCredits ? 2500 : 0)
                  ).toLocaleString()}
                </div>
                <p className="text-sm text-black mt-2">
                  This is an estimate. Final amount will be calculated based on
                  your complete tax return.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Review & File */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Review & File Your Return
              </h2>

              {/* Summary */}
              <div className="space-y-6">
                {/* Personal Info Summary */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Name:</strong> {taxReturn.firstName}{' '}
                      {taxReturn.lastName}
                    </div>
                    <div>
                      <strong>SSN:</strong> ***-**-{taxReturn.ssn.slice(-4)}
                    </div>
                    <div>
                      <strong>Filing Status:</strong>{' '}
                      {taxReturn.filingStatus?.replace('_', ' ')}
                    </div>
                    <div>
                      <strong>Dependents:</strong> {taxReturn.dependents.length}
                    </div>
                  </div>
                </div>

                {/* Income Summary */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Income</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>W-2 Wages:</span>
                      <span className="font-semibold">
                        $
                        {taxReturn.w2Income
                          .reduce((sum, w2) => sum + w2.wages, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Federal Withholding:</span>
                      <span className="font-semibold">
                        $
                        {taxReturn.w2Income
                          .reduce((sum, w2) => sum + w2.federalWithholding, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Summary */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Deductions</h3>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold">
                        {taxReturn.deductionType === 'standard'
                          ? 'Standard Deduction'
                          : 'Itemized Deductions'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Summary */}
                <div className="p-8 bg-slate-700 text-white rounded-lg text-center">
                  <div className="text-lg mb-2">Your Estimated Refund</div>
                  <div className="text-5xl font-bold mb-4">
                    ${estimatedRefund.toLocaleString()}
                  </div>
                  <p className="text-sm opacity-90">
                    This is an estimate. Final amount will be confirmed after
                    filing.
                  </p>
                </div>

                {/* Bank Info for Direct Deposit */}
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">
                    Direct Deposit Information
                  </h3>
                  <p className="text-sm text-black mb-4">
                    Get your refund faster with direct deposit!
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={taxReturn.bankName}
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            bankName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">
                        Account Type
                      </label>
                      <select
                        value={taxReturn.accountType}
                        onChange={(e) =>
                          setTaxReturn({
                            ...taxReturn,
                            accountType: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          value={taxReturn.routingNumber}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              routingNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={taxReturn.accountNumber}
                          onChange={(e) =>
                            setTaxReturn({
                              ...taxReturn,
                              accountNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Button */}
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Ready to file your tax return? This will submit your return to the IRS via e-file.'
                      )
                    ) {
                      try {
                        // Audit log: tax return submission
                        fetch('/api/audit/log', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'tax_return_submitted',
                            metadata: { software_version: SOFTWARE_VERSION },
                          }),
                        }).catch(() => {});

                        const response = await fetch(
                          '/api/supersonic-fast-cash/file-return',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(taxReturn),
                          }
                        );
                        const result = await response.json();
                        if (result.success) {
                          alert(
                            'Tax return filed successfully! You will receive a confirmation email.'
                          );
                          window.location.href = '/supersonic-fast-cash/portal';
                        }
                      } catch (error) {
                        alert(
                          'Error filing return. Please try again or contact support.'
                        );
                      }
                    }
                  }}
                  className="w-full bg-green-600 text-white py-6 rounded-lg font-bold text-xl hover:bg-green-700"
                >
                  File My Tax Return Now
                </button>

                <p className="text-center text-sm text-black">
                  By filing, you agree to our terms and authorize e-filing with
                  the IRS.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
          )}

          <button
            onClick={saveProgress}
            className="bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Progress
          </button>

          {currentStep < STEPS.length && (
            <button
              onClick={nextStep}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
