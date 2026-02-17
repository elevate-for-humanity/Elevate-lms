'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, User, Mail, Phone, MapPin, 
  FileText, Users, ArrowRight, 
  ArrowLeft, Loader2, AlertCircle, Upload, X,
} from 'lucide-react';
import { 
  DOCUMENT_TYPE_LABELS, 
  getRequiredDocuments,
  type DocumentType 
} from '@/lib/partner/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SponsorshipInfoPanel } from '@/components/partner/SponsorshipInfoPanel';

const AVAILABLE_PROGRAMS = [
  { id: 'BARBER', name: 'Barber Apprenticeship', description: 'Host barber apprentices for hands-on training' },
  { id: 'COSMETOLOGY', name: 'Cosmetology', description: 'Beauty and cosmetology training placement' },
  { id: 'CNA', name: 'CNA/Healthcare', description: 'Certified Nursing Assistant clinical placement' },
  { id: 'HVAC', name: 'HVAC', description: 'Heating, ventilation, and air conditioning apprenticeship' },
];

const US_STATES = [
  'Indiana', 'Illinois', 'Ohio', 'Michigan', 'Kentucky'
];

interface UploadedFile {
  docType: DocumentType;
  file: File;
  name: string;
}

interface FormData {
  shopName: string;
  dba: string;
  fein: string;
  ownerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  programsRequested: string[];
  agreedToTerms: boolean;
}

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    dba: '',
    fein: '',
    ownerName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: 'Indiana',
    zip: '',
    programsRequested: ['BARBER'],
    agreedToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleProgram = (programId: string) => {
    setFormData(prev => ({
      ...prev,
      programsRequested: prev.programsRequested.includes(programId)
        ? prev.programsRequested.filter(p => p !== programId)
        : [...prev.programsRequested, programId]
    }));
  };

  // Get required documents based on selected programs and state
  const getRequiredDocs = (): DocumentType[] => {
    const docs = new Set<DocumentType>();
    formData.programsRequested.forEach(programId => {
      getRequiredDocuments(programId, formData.state).forEach(d => docs.add(d));
    });
    return Array.from(docs);
  };

  const handleFileUpload = (docType: DocumentType, file: File) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.docType !== docType);
      return [...filtered, { docType, file, name: file.name }];
    });
  };

  const removeFile = (docType: DocumentType) => {
    setUploadedFiles(prev => prev.filter(f => f.docType !== docType));
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!(formData.shopName && formData.ownerName && formData.email && formData.phone);
      case 2:
        return !!(formData.addressLine1 && formData.city && formData.state && formData.zip);
      case 3:
        return formData.programsRequested.length > 0;
      case 4:
        const required = getRequiredDocs();
        const uploaded = uploadedFiles.map(f => f.docType);
        return required.every(d => uploaded.includes(d));
      case 5:
        return formData.agreedToTerms;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setError('Please agree to the terms to continue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/partner/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.shopName,
          dba: formData.dba,
          ein: formData.fein,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          programsRequested: formData.programsRequested,
          agreedToTerms: formData.agreedToTerms,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');

      router.push('/partner/onboarding/success');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredDocs = getRequiredDocs();

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Onboarding' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-blue-600/20 text-brand-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Partner Shop Onboarding
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Become a Partner Shop</h1>
          <p className="text-slate-400">
            Complete onboarding and upload required documents to get started.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s < step ? 'bg-brand-green-500 text-white' : s === step ? 'bg-brand-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {s < step ? <span className="text-slate-400 flex-shrink-0">•</span> : s}
              </div>
              {s < 5 && <div className={`w-8 h-1 ${s < step ? 'bg-brand-green-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Sponsorship Info */}
          <div className="mb-6">
            <SponsorshipInfoPanel variant="compact" />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-center gap-3 text-brand-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-blue-600" />
                Business Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Legal Business Name *</label>
                  <input type="text" value={formData.shopName} onChange={(e) => updateField('shopName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="ABC Barbershop LLC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">DBA (if different)</label>
                  <input type="text" value={formData.dba} onChange={(e) => updateField('dba', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="ABC Cuts" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FEIN</label>
                <input type="text" value={formData.fein} onChange={(e) => updateField('fein', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="XX-XXXXXXX" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" value={formData.ownerName} onChange={(e) => updateField('ownerName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="John Smith" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="owner@shop.com" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="(317) 314-3757" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-blue-600" />
                Shop Location
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                <input type="text" value={formData.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="123 Main Street" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input type="text" value={formData.city} onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="Indianapolis" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                  <select value={formData.state} onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                  <input type="text" value={formData.zip} onChange={(e) => updateField('zip', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="46204" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Programs */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue-600" />
                Program Selection
              </h2>
              <p className="text-slate-600 text-sm">Select the programs you want to host apprentices for.</p>
              <div className="space-y-3">
                {AVAILABLE_PROGRAMS.map(program => (
                  <label key={program.id} className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer ${
                    formData.programsRequested.includes(program.id) ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="checkbox" checked={formData.programsRequested.includes(program.id)}
                      onChange={() => toggleProgram(program.id)} className="mt-1 w-5 h-5 text-brand-blue-600 rounded" />
                    <div>
                      <p className="font-medium text-slate-900">{program.name}</p>
                      <p className="text-sm text-slate-500">{program.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-blue-600" />
                Required Documents
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>All documents are required.</strong> Your account will be activated automatically once documents are verified.
                </p>
              </div>
              <div className="space-y-4">
                {requiredDocs.map(docType => {
                  const uploaded = uploadedFiles.find(f => f.docType === docType);
                  return (
                    <div key={docType} className={`p-4 border-2 rounded-lg ${uploaded ? 'border-brand-green-500 bg-brand-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{DOCUMENT_TYPE_LABELS[docType]}</p>
                          {uploaded && <p className="text-sm text-brand-green-600">{uploaded.name}</p>}
                        </div>
                        {uploaded ? (
                          <button onClick={() => removeFile(docType)} className="text-brand-red-500 hover:text-brand-red-700">
                            <X className="w-5 h-5" />
                          </button>
                        ) : (
                          <label className="cursor-pointer bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-700">
                            Upload
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(docType, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                Review & Submit
              </h2>
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Shop Name</p><p className="font-medium">{formData.shopName}</p></div>
                  <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium">{formData.ownerName}</p></div>
                  <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{formData.email}</p></div>
                  <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{formData.phone}</p></div>
                </div>
                <div><p className="text-sm text-slate-500">Address</p><p className="font-medium">{formData.addressLine1}, {formData.city}, {formData.state} {formData.zip}</p></div>
                <div><p className="text-sm text-slate-500">Programs</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.programsRequested.map(p => (
                      <span key={p} className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm">{AVAILABLE_PROGRAMS.find(prog => prog.id === p)?.name}</span>
                    ))}
                  </div>
                </div>
                <div><p className="text-sm text-slate-500">Documents Uploaded</p><p className="font-medium text-brand-green-600">{uploadedFiles.length} of {requiredDocs.length}</p></div>
              </div>
              <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                <p className="text-brand-green-800 text-sm"><strong>No admin approval required.</strong> Your account will be activated automatically once documents are verified (typically within 24-48 hours).</p>
              </div>
              <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-brand-blue-300">
                <input type="checkbox" checked={formData.agreedToTerms} onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                  className="mt-1 w-5 h-5 text-brand-blue-600 rounded" />
                <div className="text-sm text-slate-600">
                  I agree to the <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>.
                </div>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <Link href="/programs/barber-apprenticeship" className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-5 h-5" /> Back to Program
              </Link>
            )}

            {step < 5 ? (
              <button onClick={() => {
                if (validateStep(step)) { setStep(step + 1); setError(''); }
                else { setError('Please complete all required fields.'); }
              }} className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700">
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting || !formData.agreedToTerms}
                className="flex items-center gap-2 px-8 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700 disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <>Submit Application <span className="text-slate-400 flex-shrink-0">•</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
