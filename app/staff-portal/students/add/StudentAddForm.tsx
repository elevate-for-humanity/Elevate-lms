'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, Briefcase, FileText, ChevronRight, ChevronLeft, Upload, CheckCircle, } from 'lucide-react';
import EnrollmentDocumentStep from '@/components/enrollment/EnrollmentDocumentStep';

interface Program {
  id: string;
  name: string;
  slug: string;
  funding_types: string[];
  price_self_pay: number | null;
}

interface FundingType {
  value: string;
  label: string;
}

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface Props {
  programs: Program[];
  fundingTypes: FundingType[];
  staffId: string;
}

const APPRENTICE_DOCUMENT_REQUIREMENTS = [
  {
    type: 'photo_id',
    label: 'Photo ID',
    description: 'Government-issued photo ID (driver\'s license, state ID, or passport)',
    required: true,
  },
];

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Program', icon: GraduationCap },
  { id: 3, name: 'Funding', icon: Briefcase },
  { id: 4, name: 'Documents', icon: Upload },
  { id: 5, name: 'Case Manager', icon: FileText },
  { id: 6, name: 'Review', icon: CheckCircle },
];

export default function StudentAddForm({ programs, fundingTypes, staffId }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: 'IN',
    zipCode: '',
    county: '',
    programId: '',
    fundingType: '',
    caseManagerName: '',
    caseManagerEmail: '',
    caseManagerPhone: '',
    notes: '',
  });

  // Check if selected program is barber apprenticeship
  const selectedProgram = programs.find(p => p.id === formData.programId);
  const isApprenticeshipProgram = selectedProgram?.slug?.includes('barber') || 
    selectedProgram?.slug?.includes('apprentice');

  const handleDocumentUpload = async (documentType: string, file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('documentType', documentType);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formDataUpload,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload document');
    }

    const data = await response.json();
    setUploadedDocuments(prev => [...prev, {
      id: data.document.id,
      document_type: documentType,
      file_name: file.name,
      status: 'pending',
    }]);
  };

  const handleDocumentRemove = async (documentId: string) => {
    // For now, just remove from local state
    // In production, you'd also delete from storage
    setUploadedDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call API to handle enrollment (creates profile, enrollment, apprentice record, sends email)
      const response = await fetch('/api/staff/enroll-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          staffId,
          documentIds: uploadedDocuments.map(d => d.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enroll student');
      }

      router.push('/staff-portal/students?success=enrolled');
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep > step.id ? 'bg-brand-green-500 text-white' :
              currentStep === step.id ? 'bg-brand-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step.id ? <span className="text-slate-400 flex-shrink-0">•</span> : <step.icon className="w-5 h-5" />}
            </div>
            <span className={`ml-2 text-sm hidden sm:block ${currentStep === step.id ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              {step.name}
            </span>
            {idx < steps.length - 1 && <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-brand-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <input type="text" value={formData.county} onChange={e => updateField('county', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={e => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={formData.state} onChange={e => updateField('state', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input type="text" value={formData.zipCode} onChange={e => updateField('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Select Program</h2>
            {programs.length === 0 ? (
              <p className="text-gray-500">No active programs available.</p>
            ) : (
              <div className="space-y-3">
                {programs.map(program => (
                  <label key={program.id} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-white ${
                    formData.programId === program.id ? 'border-brand-orange-500 bg-brand-orange-50' : ''
                  }`}>
                    <input type="radio" name="program" value={program.id} checked={formData.programId === program.id}
                      onChange={e => updateField('programId', e.target.value)} className="w-4 h-4 text-brand-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium">{program.name}</p>
                      <p className="text-sm text-gray-500">
                        {program.funding_types?.join(', ') || 'Self Pay'}
                        {program.price_self_pay && ` • $${program.price_self_pay}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Funding Source</h2>
            <div className="space-y-3">
              {fundingTypes.map(type => (
                <label key={type.value} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-white ${
                  formData.fundingType === type.value ? 'border-brand-orange-500 bg-brand-orange-50' : ''
                }`}>
                  <input type="radio" name="funding" value={type.value} checked={formData.fundingType === type.value}
                    onChange={e => updateField('fundingType', e.target.value)} className="w-4 h-4 text-brand-orange-500" />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <EnrollmentDocumentStep
              requirements={isApprenticeshipProgram ? APPRENTICE_DOCUMENT_REQUIREMENTS : []}
              uploadedDocuments={uploadedDocuments}
              onUpload={handleDocumentUpload}
              onRemove={handleDocumentRemove}
            />
            {!isApprenticeshipProgram && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-sm">
                  No documents required for this program. You can proceed to the next step.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Case Manager Information</h2>
            <p className="text-sm text-gray-500 mb-4">Optional: Enter case manager details if applicable</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Manager Name</label>
                <input type="text" value={formData.caseManagerName} onChange={e => updateField('caseManagerName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Manager Email</label>
                <input type="email" value={formData.caseManagerEmail} onChange={e => updateField('caseManagerEmail', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Manager Phone</label>
                <input type="tel" value={formData.caseManagerPhone} onChange={e => updateField('caseManagerPhone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={e => updateField('notes', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Review Enrollment</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Student Information</h3>
                <p className="text-sm text-gray-600">{formData.firstName} {formData.lastName}</p>
                <p className="text-sm text-gray-600">{formData.email}</p>
                {formData.phone && <p className="text-sm text-gray-600">{formData.phone}</p>}
                {formData.city && formData.state && (
                  <p className="text-sm text-gray-600">{formData.city}, {formData.state} {formData.zipCode}</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Program</h3>
                <p className="text-sm text-gray-600">{selectedProgram?.name || 'No program selected'}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Funding</h3>
                <p className="text-sm text-gray-600">
                  {fundingTypes.find(f => f.value === formData.fundingType)?.label || 'Not specified'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Documents</h3>
                {uploadedDocuments.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {uploadedDocuments.map(doc => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {doc.file_name} ({doc.document_type})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                )}
              </div>
              {formData.caseManagerName && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Case Manager</h3>
                  <p className="text-sm text-gray-600">{formData.caseManagerName}</p>
                  {formData.caseManagerEmail && <p className="text-sm text-gray-600">{formData.caseManagerEmail}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <button onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          {currentStep < 6 ? (
            <button onClick={() => setCurrentStep(s => s + 1)}
              disabled={currentStep === 1 && (!formData.firstName || !formData.lastName || !formData.email)}
              className="flex items-center gap-2 px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="px-6 py-2 bg-brand-green-500 text-white rounded-lg hover:bg-brand-green-600 disabled:opacity-50">
              {isSubmitting ? 'Enrolling...' : 'Complete Enrollment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
