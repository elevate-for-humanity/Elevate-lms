'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// Form state type
interface ApplicationFormState {
  // Step 1: Eligibility
  isOver18: boolean | null;
  hasHighSchoolDiploma: boolean | null;
  hasWorkAuthorization: boolean | null;
  isIndianaResident: boolean | null;
  canCommitToSchedule: boolean | null;

  // Step 2: Personal Information
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  race: string[];
  gender: string;
  pronouns: string;
  educationLevel: string;
  isVeteran: boolean | null;
  militaryStatus: string;

  // Step 3: Income & WIOA Eligibility
  employmentStatus: string;
  annualIncome: string;
  numberOfDependents: string;
  receivesPublicAssistance: string[];
  housingStatus: string;
  hasJusticeInvolvement: boolean | null;

  // Step 4: Work Authorization & Barriers
  workAuthDocument: string;
  documentExpirationDate: string;
  barriers: string[];
  otherBarrier: string;
  hasCaseManager: boolean | null;
  caseManagerAgency: string;
  supportNeeds: string;

  // Step 5: Program Selection & Contact
  program: string;
  preferredContact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;

  // Step 6: Consents
  consentBackgroundCheck: boolean;
  consentPhotoVideo: boolean;
  consentDataSharing: boolean;
  consentTextMessages: boolean;
}

const initialState: ApplicationFormState = {
  isOver18: null,
  hasHighSchoolDiploma: null,
  hasWorkAuthorization: null,
  isIndianaResident: null,
  canCommitToSchedule: null,
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  race: [],
  gender: '',
  pronouns: '',
  educationLevel: '',
  isVeteran: null,
  militaryStatus: '',
  employmentStatus: '',
  annualIncome: '',
  numberOfDependents: '',
  receivesPublicAssistance: [],
  housingStatus: '',
  hasJusticeInvolvement: null,
  workAuthDocument: '',
  documentExpirationDate: '',
  barriers: [],
  otherBarrier: '',
  hasCaseManager: null,
  caseManagerAgency: '',
  supportNeeds: '',
  program: '',
  preferredContact: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip: '',
  consentBackgroundCheck: false,
  consentPhotoVideo: false,
  consentDataSharing: false,
  consentTextMessages: false,
};

const steps = [
  {
    number: 1,
    title: 'Eligibility',
    description: 'Confirm you meet requirements',
  },
  { number: 2, title: 'Personal Info', description: 'Tell us about yourself' },
  {
    number: 3,
    title: 'Income & WIOA',
    description: 'Verify funding eligibility',
  },
  {
    number: 4,
    title: 'Authorization',
    description: 'Work documents & barriers',
  },
  { number: 5, title: 'Program', description: 'Choose your path' },
  { number: 6, title: 'Review', description: 'Confirm and submit' },
];

export default function WIOAApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormState>(initialState);
  const [isEligible, setIsEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof ApplicationFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (
    field: keyof ApplicationFormState,
    value: string
  ) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const checkEligibility = () => {
    const {
      isOver18,
      hasHighSchoolDiploma,
      hasWorkAuthorization,
      isIndianaResident,
      canCommitToSchedule,
    } = formData;

    if (
      isOver18 === false ||
      hasHighSchoolDiploma === false ||
      hasWorkAuthorization === false ||
      isIndianaResident === false ||
      canCommitToSchedule === false
    ) {
      setIsEligible(false);
      return false;
    }
    setIsEligible(true);
    return true;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.isOver18 !== null &&
          formData.hasHighSchoolDiploma !== null &&
          formData.hasWorkAuthorization !== null &&
          formData.isIndianaResident !== null &&
          formData.canCommitToSchedule !== null
        );
      case 2:
        return (
          formData.firstName.trim() !== '' &&
          formData.lastName.trim() !== '' &&
          formData.dateOfBirth !== '' &&
          formData.educationLevel !== ''
        );
      case 3:
        return (
          formData.employmentStatus !== '' &&
          formData.annualIncome !== '' &&
          formData.housingStatus !== ''
        );
      case 4:
        return (
          formData.workAuthDocument !== '' && formData.hasCaseManager !== null
        );
      case 5:
        return (
          formData.program !== '' &&
          formData.email !== '' &&
          formData.phone !== '' &&
          formData.city !== '' &&
          formData.zip !== '' &&
          formData.preferredContact !== ''
        );
      case 6:
        return formData.consentBackgroundCheck && formData.consentDataSharing;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!checkEligibility()) {
        return;
      }
    }

    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('Please complete all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      setError('Please accept required consents before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/applications/wioa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      // Redirect to success page with reference number
      window.location.href = `/apply/success?ref=${data.referenceNumber}`;
    } catch (err: any) {
      setError(
        err.message || 'Failed to submit application. Please try again.'
      );
      setSubmitting(false);
    }
  };

  // Ineligible screen
  if (!isEligible && currentStep === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              <AlertTriangle className="w-5 h-5 inline-block" />
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black mb-4">
            Thank you for your interest
          </h2>
          <p className="text-black mb-6">
            Based on your responses, you do not meet one or all of the following
            minimum eligibility requirements:
          </p>
          <ul className="text-left text-black space-y-2 mb-6 max-w-md mx-auto">
            <li>• At least 18 years of age</li>
            <li>• High school diploma or equivalent</li>
            <li>• Able to provide proof of U.S. work authorization</li>
            <li>• Indiana resident</li>
            <li>• Able to commit to training schedule</li>
          </ul>
          <p className="text-sm text-black mb-6">
            If your situation changes, please resubmit this form. Best of luck
            on your future endeavors!
          </p>
          <button
            onClick={() => {
              setFormData(initialState);
              setIsEligible(true);
              setCurrentStep(1);
            }}
            className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    currentStep > step.number
                      ? 'bg-brand-blue-600 text-white'
                      : currentStep === step.number
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-slate-200 text-black'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="text-center mt-2 hidden md:block">
                  <div
                    className={`text-xs font-semibold ${currentStep >= step.number ? 'text-black' : 'text-slate-500'}`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition ${
                    currentStep > step.number
                      ? 'bg-brand-blue-600'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8 mb-6">
        {/* Step content will go here */}
        {currentStep === 1 && (
          <Step1Eligibility formData={formData} updateField={updateField} />
        )}
        {currentStep === 2 && (
          <Step2PersonalInfo
            formData={formData}
            updateField={updateField}
            toggleArrayField={toggleArrayField}
          />
        )}
        {currentStep === 3 && (
          <Step3IncomeWIOA
            formData={formData}
            updateField={updateField}
            toggleArrayField={toggleArrayField}
          />
        )}
        {currentStep === 4 && (
          <Step4Authorization
            formData={formData}
            updateField={updateField}
            toggleArrayField={toggleArrayField}
          />
        )}
        {currentStep === 5 && (
          <Step5Program formData={formData} updateField={updateField} />
        )}
        {currentStep === 6 && (
          <Step6Review formData={formData} updateField={updateField} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
        )}

        <div className="flex-1" />

        {currentStep < 6 ? (
          <button
            onClick={nextStep}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg hover:bg-brand-blue-700 transition shadow-lg"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components (to be implemented)
function Step1Eligibility({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Eligibility Screening
        </h2>
        <p className="text-black">
          Please answer these questions to confirm you meet our basic
          requirements.
        </p>
      </div>

      {[
        { field: 'isOver18', question: 'Are you 18 years or older?' },
        {
          field: 'hasHighSchoolDiploma',
          question: 'Do you have a High School diploma/equivalent or higher?',
        },
        {
          field: 'hasWorkAuthorization',
          question:
            'Are you able to provide valid proof of U.S. Work Authorization?',
        },
        { field: 'isIndianaResident', question: 'Do you reside in Indiana?' },
        {
          field: 'canCommitToSchedule',
          question:
            'Are you able to commit to attending during live instruction times?',
        },
      ].map(({ field, question }) => (
        <div key={field} className="border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-black mb-3">{question}</p>
          <div className="flex gap-4">
            <button
              onClick={() => updateField(field, true)}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                formData[field] === true
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => updateField(field, false)}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                formData[field] === false
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              No
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Step2PersonalInfo({
  formData,
  updateField,
  toggleArrayField,
}: any) {
  const raceOptions = [
    'American Indian/Alaska Native',
    'Asian',
    'Black/African American',
    'Hispanic/Latino',
    'Native Hawaiian/Pacific Islander',
    'White',
    'Two or More Races',
    'Prefer not to say',
  ];
  const educationLevels = [
    'Less than High School',
    'High School Diploma/GED',
    'Some College',
    'Associate Degree',
    "Bachelor's Degree",
    'Graduate Degree',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Personal Information
        </h2>
        <p className="text-black">
          This information helps us serve you better and is required for WIOA
          reporting.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateField('dateOfBirth', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Race/Ethnicity (Select all that apply)
        </label>
        <div className="grid md:grid-cols-2 gap-2">
          {raceOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.race.includes(option)}
                onChange={() => toggleArrayField('race', option)}
                className="w-4 h-4 text-brand-blue-600"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Gender Identity
        </label>
        <select
          value={formData.gender}
          onChange={(e) => updateField('gender', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Highest Education Level *
        </label>
        <select
          value={formData.educationLevel}
          onChange={(e) => updateField('educationLevel', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          {educationLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <p className="font-semibold text-black mb-3">
          Are you a U.S. Military Veteran?
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => updateField('isVeteran', true)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.isVeteran === true ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField('isVeteran', false)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.isVeteran === false ? 'bg-slate-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

function Step3IncomeWIOA({ formData, updateField, toggleArrayField }: any) {
  const publicAssistanceOptions = [
    'SNAP (Food Stamps)',
    'TANF (Cash Assistance)',
    'SSI',
    'Unemployment Benefits',
    'Housing Assistance',
    'Medicaid',
    'None',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Income & WIOA Eligibility
        </h2>
        <p className="text-black">
          This information determines funding eligibility. All information is
          confidential.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Current Employment Status *
        </label>
        <select
          value={formData.employmentStatus}
          onChange={(e) => updateField('employmentStatus', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          <option value="Employed Full-Time">Employed Full-Time</option>
          <option value="Employed Part-Time">Employed Part-Time</option>
          <option value="Unemployed">Unemployed</option>
          <option value="Student">Student</option>
          <option value="Not in Labor Force">Not in Labor Force</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Annual Household Income *
        </label>
        <select
          value={formData.annualIncome}
          onChange={(e) => updateField('annualIncome', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          <option value="Under $15,000">Under $15,000</option>
          <option value="$15,000 - $25,000">$15,000 - $25,000</option>
          <option value="$25,000 - $35,000">$25,000 - $35,000</option>
          <option value="$35,000 - $50,000">$35,000 - $50,000</option>
          <option value="Over $50,000">Over $50,000</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Number of Dependents
        </label>
        <input
          type="number"
          min="0"
          value={formData.numberOfDependents}
          onChange={(e) => updateField('numberOfDependents', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-3">
          Do you receive any public assistance? (Select all that apply)
        </label>
        <div className="grid md:grid-cols-2 gap-2">
          {publicAssistanceOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.receivesPublicAssistance.includes(option)}
                onChange={() =>
                  toggleArrayField('receivesPublicAssistance', option)
                }
                className="w-4 h-4 text-brand-blue-600"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Housing Status *
        </label>
        <select
          value={formData.housingStatus}
          onChange={(e) => updateField('housingStatus', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          <option value="Own">Own Home</option>
          <option value="Rent">Rent</option>
          <option value="Living with Family/Friends">
            Living with Family/Friends
          </option>
          <option value="Homeless">Homeless</option>
          <option value="Transitional Housing">Transitional Housing</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <p className="font-semibold text-black mb-3">
          Have you been involved in the justice system?
        </p>
        <p className="text-sm text-black mb-3">
          This helps us connect you with additional support services (JRI
          funding).
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => updateField('hasJusticeInvolvement', true)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.hasJusticeInvolvement === true ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField('hasJusticeInvolvement', false)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.hasJusticeInvolvement === false ? 'bg-slate-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

function Step4Authorization({
  formData,
  updateField,
  toggleArrayField,
}: any) {
  const workAuthDocs = [
    'U.S. Passport',
    'Birth Certificate',
    "Driver's License + Social Security Card",
    'Permanent Resident Card (Green Card)',
    'Employment Authorization Document (EAD)',
    'Other',
  ];
  const barrierOptions = [
    'Transportation',
    'Childcare',
    'Housing instability',
    'Health issues',
    'Disability',
    'Language barrier',
    'Technology access',
    'None',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Work Authorization & Barriers
        </h2>
        <p className="text-black">
          Required for enrollment and to identify support needs.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Work Authorization Document Type *
        </label>
        <select
          value={formData.workAuthDocument}
          onChange={(e) => updateField('workAuthDocument', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          {workAuthDocs.map((doc) => (
            <option key={doc} value={doc}>
              {doc}
            </option>
          ))}
        </select>
      </div>

      {formData.workAuthDocument &&
        formData.workAuthDocument !== 'Birth Certificate' &&
        formData.workAuthDocument !== 'Other' && (
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Document Expiration Date (if applicable)
            </label>
            <input
              type="date"
              value={formData.documentExpirationDate}
              onChange={(e) =>
                updateField('documentExpirationDate', e.target.value)
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        )}

      <div>
        <label className="block text-sm font-semibold text-black mb-3">
          Do you face any barriers to training? (Select all that apply)
        </label>
        <div className="grid md:grid-cols-2 gap-2">
          {barrierOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.barriers.includes(option)}
                onChange={() => toggleArrayField('barriers', option)}
                className="w-4 h-4 text-brand-blue-600"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {formData.barriers.includes('Other') && (
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Please describe other barriers
          </label>
          <textarea
            value={formData.otherBarrier}
            onChange={(e) => updateField('otherBarrier', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="border border-slate-200 rounded-lg p-4">
        <p className="font-semibold text-black mb-3">
          Do you have a case manager? *
        </p>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => updateField('hasCaseManager', true)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.hasCaseManager === true ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField('hasCaseManager', false)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${formData.hasCaseManager === false ? 'bg-slate-600 text-white' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
          >
            No
          </button>
        </div>
        {formData.hasCaseManager && (
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Case Manager Agency
            </label>
            <input
              type="text"
              value={formData.caseManagerAgency}
              onChange={(e) => updateField('caseManagerAgency', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., WorkOne, Goodwill, etc."
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Additional Support Needs
        </label>
        <textarea
          value={formData.supportNeeds}
          onChange={(e) => updateField('supportNeeds', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Tell us about any other support you might need..."
        />
      </div>
    </div>
  );
}

function Step5Program({ formData, updateField }: any) {
  const [programs, setPrograms] = useState<string[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        const data = await res.json();
        if (data.status === 'success' && data.programs) {
          const programNames = data.programs.map((p: any) => p.name);
          programNames.push('Other');
          setPrograms(programNames);
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
        setPrograms(['Other']);
      } finally {
        setLoadingPrograms(false);
      }
    }
    fetchPrograms();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Program Selection & Contact
        </h2>
        <p className="text-black">
          Choose your program and provide contact information.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Program of Interest *
        </label>
        <select
          value={formData.program}
          onChange={(e) => updateField('program', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
          disabled={loadingPrograms}
        >
          <option value="">{loadingPrograms ? 'Loading programs...' : 'Select a program...'}</option>
          {programs.map((prog) => (
            <option key={prog} value={prog}>
              {prog}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Street Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.zip}
            onChange={(e) => updateField('zip', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Preferred Contact Method *
        </label>
        <select
          value={formData.preferredContact}
          onChange={(e) => updateField('preferredContact', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        >
          <option value="">Select...</option>
          <option value="Phone">Phone</option>
          <option value="Email">Email</option>
          <option value="Text">Text Message</option>
        </select>
      </div>
    </div>
  );
}

function Step6Review({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Review & Consent
        </h2>
        <p className="text-black">
          Please review your information and provide required consents.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-black">Application Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Name:</strong> {formData.firstName} {formData.lastName}
          </div>
          <div>
            <strong>Program:</strong> {formData.program}
          </div>
          <div>
            <strong>Email:</strong> {formData.email}
          </div>
          <div>
            <strong>Phone:</strong> {formData.phone}
          </div>
          <div>
            <strong>City:</strong> {formData.city}, {formData.zip}
          </div>
          <div>
            <strong>Employment:</strong> {formData.employmentStatus}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentBackgroundCheck}
            onChange={(e) =>
              updateField('consentBackgroundCheck', e.target.checked)
            }
            className="w-5 h-5 text-brand-blue-600 mt-1"
            required
          />
          <div className="text-sm">
            <strong className="text-black">
              Background Check Consent *
            </strong>
            <p className="text-black mt-1">
              I consent to a background check as required for program enrollment
              and employment placement.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentPhotoVideo}
            onChange={(e) => updateField('consentPhotoVideo', e.target.checked)}
            className="w-5 h-5 text-brand-blue-600 mt-1"
          />
          <div className="text-sm">
            <strong className="text-black">Photo/Video Release</strong>
            <p className="text-black mt-1">
              I consent to the use of my photo/video for marketing and
              promotional purposes.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentDataSharing}
            onChange={(e) =>
              updateField('consentDataSharing', e.target.checked)
            }
            className="w-5 h-5 text-brand-blue-600 mt-1"
            required
          />
          <div className="text-sm">
            <strong className="text-black">Data Sharing Consent *</strong>
            <p className="text-black mt-1">
              I consent to sharing my information with funding partners (WIOA,
              WRG, JRI) and training partners for program administration and
              reporting.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentTextMessages}
            onChange={(e) =>
              updateField('consentTextMessages', e.target.checked)
            }
            className="w-5 h-5 text-brand-blue-600 mt-1"
          />
          <div className="text-sm">
            <strong className="text-black">Text Message Opt-In</strong>
            <p className="text-black mt-1">
              I consent to receive text messages about my application, program
              updates, and important notifications.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-black">
        <p>
          <strong>Note:</strong> By submitting this application, you certify
          that all information provided is true and accurate to the best of your
          knowledge. False information may result in denial or termination from
          the program.
        </p>
      </div>
    </div>
  );
}
