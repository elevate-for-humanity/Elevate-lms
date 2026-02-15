'use client';

import { useState } from 'react';
import { Shield, CheckCircle, Info } from 'lucide-react';

interface RAPIDSData {
  // Personal
  middleName?: string;
  suffix?: string;
  dateOfBirth: string;
  gender: string;
  ssnLastFour?: string;
  
  // Demographics (for EEO reporting)
  raceEthnicity: string;
  veteranStatus: boolean;
  disabilityStatus: boolean;
  educationLevel: string;
  
  // Employer (if known)
  employerName?: string;
  employerCity?: string;
  employerState?: string;
  
  // Consent
  rapidsConsent: boolean;
}

interface RAPIDSDataCollectionProps {
  onDataChange: (data: Partial<RAPIDSData>) => void;
  initialData?: Partial<RAPIDSData>;
  programName?: string;
  required?: boolean;
}

const RACE_ETHNICITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'hispanic_latino', label: 'Hispanic or Latino' },
  { value: 'american_indian', label: 'American Indian or Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black or African American' },
  { value: 'pacific_islander', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'two_or_more', label: 'Two or More Races' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const EDUCATION_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'less_than_hs', label: 'Less than High School' },
  { value: 'hs_diploma', label: 'High School Diploma' },
  { value: 'ged', label: 'GED or Equivalent' },
  { value: 'some_college', label: 'Some College, No Degree' },
  { value: 'certificate', label: 'Certificate/Credential' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: 'Bachelor\'s Degree' },
  { value: 'master_plus', label: 'Master\'s Degree or Higher' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'X', label: 'Non-binary / Other' },
];

export function RAPIDSDataCollection({
  onDataChange,
  initialData = {},
  programName = 'this apprenticeship program',
  required = true,
}: RAPIDSDataCollectionProps) {
  const [data, setData] = useState<Partial<RAPIDSData>>(initialData);
  const [showEmployer, setShowEmployer] = useState(!!initialData.employerName);

  const handleChange = (field: keyof RAPIDSData, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onDataChange(newData);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-brand-blue-100 rounded-lg">
          <Shield className="w-5 h-5 text-brand-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">RAPIDS Registration Information</h3>
          <p className="text-sm text-gray-600 mt-1">
            As a USDOL Registered Apprenticeship program, we are required to collect this information 
            for federal reporting. Your data is protected and used only for compliance purposes.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-brand-blue-800">
            <p className="font-medium">Why do we need this?</p>
            <p className="mt-1">
              The U.S. Department of Labor requires registered apprenticeship sponsors to report 
              demographic data for Equal Employment Opportunity (EEO) compliance. This information 
              helps ensure fair access to apprenticeship opportunities.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={data.dateOfBirth || ''}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={data.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value)}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={data.middleName || ''}
                onChange={(e) => handleChange('middleName', e.target.value)}
                placeholder="Middle name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suffix <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={data.suffix || ''}
                onChange={(e) => handleChange('suffix', e.target.value)}
                placeholder="Jr., Sr., III, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Demographics (EEO Reporting)</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Race/Ethnicity <span className="text-red-500">*</span>
              </label>
              <select
                value={data.raceEthnicity || ''}
                onChange={(e) => handleChange('raceEthnicity', e.target.value)}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                {RACE_ETHNICITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education Level <span className="text-red-500">*</span>
              </label>
              <select
                value={data.educationLevel || ''}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                {EDUCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.veteranStatus || false}
                onChange={(e) => handleChange('veteranStatus', e.target.checked)}
                className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
              />
              <span className="text-sm text-gray-700">I am a veteran of the U.S. Armed Forces</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.disabilityStatus || false}
                onChange={(e) => handleChange('disabilityStatus', e.target.checked)}
                className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
              />
              <span className="text-sm text-gray-700">I have a disability</span>
            </label>
          </div>
        </div>

        {/* Employer (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Employer Information</h4>
            <button
              type="button"
              onClick={() => setShowEmployer(!showEmployer)}
              className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
            >
              {showEmployer ? 'Hide' : 'Add employer'}
            </button>
          </div>
          
          {showEmployer && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employer Name
                </label>
                <input
                  type="text"
                  value={data.employerName || ''}
                  onChange={(e) => handleChange('employerName', e.target.value)}
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={data.employerCity || ''}
                  onChange={(e) => handleChange('employerCity', e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={data.employerState || ''}
                  onChange={(e) => handleChange('employerState', e.target.value)}
                  placeholder="IN"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Consent */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={data.rapidsConsent || false}
              onChange={(e) => handleChange('rapidsConsent', e.target.checked)}
              required={required}
              className="w-4 h-4 mt-1 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <span className="text-sm text-gray-700">
              I understand that {programName} is a USDOL Registered Apprenticeship program and 
              I consent to my information being reported to the Department of Labor for compliance 
              and EEO purposes. I certify that the information provided is accurate.
              <span className="text-red-500"> *</span>
            </span>
          </label>
        </div>
      </div>

      {/* Validation Status */}
      {data.rapidsConsent && data.dateOfBirth && data.gender && data.raceEthnicity && data.educationLevel && (
        <div className="mt-6 flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">RAPIDS information complete</span>
        </div>
      )}
    </div>
  );
}

export default RAPIDSDataCollection;
