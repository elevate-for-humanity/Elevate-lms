'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  FileText,
  Upload,
  Save,
  Clock
} from 'lucide-react';

interface ApplicationWizardProps {
  className?: string;
}

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'contact', title: 'Contact', icon: Mail },
  { id: 'background', title: 'Background', icon: Briefcase },
  { id: 'education', title: 'Education', icon: GraduationCap },
  { id: 'funding', title: 'Funding', icon: DollarSign },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

export function ApplicationWizard({ className = '' }: ApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dob: '',
    ssn: '',
    program: '',
    employment: '',
    income: '',
    funding: [] as string[],
    emergencyName: '',
    emergencyPhone: '',
  });
  const [saved, setSaved] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleFundingChange = (funding: string) => {
    setFormData((prev) => ({
      ...prev,
      funding: prev.funding.includes(funding)
        ? prev.funding.filter((f) => f !== funding)
        : [...prev.funding, funding],
    }));
    setSaved(false);
  };

  const saveProgress = () => {
    localStorage.setItem('applicationProgress', JSON.stringify({ ...formData, step: currentStep }));
    setSaved(true);
  };

  const nextStep = () => {
    saveProgress();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-red-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <button
              key={step.id}
              onClick={() => index <= currentStep && setCurrentStep(index)}
              className={`flex flex-col items-center min-w-[80px] ${
                index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              disabled={index > currentStep}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                  isActive
                    ? 'bg-brand-red-600 text-white'
                    : isComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs ${isActive ? 'text-brand-red-600 font-medium' : 'text-slate-500'}`}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Personal Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Program Interest *</label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    >
                      <option value="">Select a program</option>
                      <option value="barber">Barbering</option>
                      <option value="hvac">HVAC/R Technician</option>
                      <option value="cna">CNA + Medication Aide</option>
                      <option value="cdl">CDL Class A</option>
                      <option value="billing">Medical Billing</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Contact */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                        required
                      >
                        <option value="">Select</option>
                        <option value="IN">Indiana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Background */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Employment Background</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Employment Status *</label>
                    <select
                      name="employment"
                      value={formData.employment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                      required
                    >
                      <option value="">Select status</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="part-time">Employed Part-Time</option>
                      <option value="full-time">Employed Full-Time</option>
                      <option value="student">Student</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Household Income</label>
                    <select
                      name="income"
                      value={formData.income}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600"
                    >
                      <option value="">Select range</option>
                      <option value="0-15000">$0 - $15,000</option>
                      <option value="15001-30000">$15,001 - $30,000</option>
                      <option value="30001-50000">$30,001 - $50,000</option>
                      <option value="50001+">$50,001+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Education */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Education Background</h2>
                <p className="text-slate-600">Tell us about your education so we can better support your learning journey.</p>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> A high school diploma or GED is required for most programs. 
                    If you need assistance obtaining your GED, we can help connect you with resources.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Funding */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Funding Options</h2>
                <p className="text-slate-600">Select all funding sources you would like us to explore for your training.</p>
                <div className="space-y-3">
                  {[
                    { id: 'wioa', name: 'WIOA Funding', desc: 'May cover up to 100% of tuition' },
                    { id: 'pell', name: 'Pell Grant', desc: 'Federal grant up to $7,395/year' },
                    { id: 'vr', name: 'Vocational Rehabilitation', desc: 'Individualized support services' },
                    { id: 'employer', name: 'Employer Sponsorship', desc: 'Employer-paid training' },
                    { id: 'payment', name: 'Payment Plan', desc: '0% interest monthly payments' },
                  ].map((fund) => (
                    <label
                      key={fund.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        formData.funding.includes(fund.id)
                          ? 'border-brand-red-600 bg-brand-red-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.funding.includes(fund.id)}
                        onChange={() => handleFundingChange(fund.id)}
                        className="mt-1 w-5 h-5 text-brand-red-600 rounded focus:ring-brand-red-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{fund.name}</p>
                        <p className="text-sm text-slate-500">{fund.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Required Documents</h2>
                <p className="text-slate-600">Upload the following documents to complete your application.</p>
                <div className="space-y-4">
                  {[
                    { name: 'Government ID', desc: 'Driver\'s license or state ID' },
                    { name: 'Social Security Card', desc: 'Or proof of SSN' },
                    { name: 'High School Diploma/GED', desc: 'Or transcripts' },
                    { name: 'Proof of Income', desc: 'Tax returns or pay stubs' },
                  ].map((doc) => (
                    <div key={doc.name} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-brand-red-400 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.desc}</p>
                      <button className="mt-2 text-sm text-brand-red-600 font-medium">Upload File</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Review Your Application</h2>
                <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900">Almost done!</p>
                    <p className="text-sm text-emerald-700">Review your information below and submit your application.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-medium text-slate-900 mb-2">Personal Information</h3>
                    <p className="text-slate-600">{formData.firstName} {formData.lastName}</p>
                    <p className="text-sm text-slate-500">Program: {formData.program || 'Not selected'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-medium text-slate-900 mb-2">Contact</h3>
                    <p className="text-slate-600">{formData.email}</p>
                    <p className="text-slate-600">{formData.phone}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-medium text-slate-900 mb-2">Funding</h3>
                    <p className="text-slate-600">{formData.funding.length > 0 ? formData.funding.join(', ') : 'None selected'}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={saveProgress}
              className="flex items-center gap-2 px-4 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
              >
                Submit Application
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Saved Indicator */}
        {saved && (
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Progress saved
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationWizard;
