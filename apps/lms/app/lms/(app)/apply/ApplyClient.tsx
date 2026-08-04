'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ApplicationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  educationLevel: string;
  employmentStatus: string;
  goals: string;
}

export default function StudentApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ApplicationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    program: '',
    educationLevel: '',
    employmentStatus: '',
    goals: '',
  });

  const programs = [
    'Medical Assistant',
    'Phlebotomy',
    'EKG Technician',
    'Pharmacy Technician',
    'HVAC Technician',
    'Barber Apprenticeship',
    'Cosmetology Apprenticeship',
    'CPR/First Aid',
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/apply/success');
      }
    } catch (err) {
      console.error('Application failed:', err);
    }
    setLoading(false);
  };

  const updateForm = (field: keyof ApplicationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {s}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Program Selection</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select value={form.program} onChange={(e) => updateForm('program', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select a program</option>
              {programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
            <select value={form.educationLevel} onChange={(e) => updateForm('educationLevel', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select education level</option>
              <option value="high_school">High School</option>
              <option value="ged">GED</option>
              <option value="some_college">Some College</option>
              <option value="associate">Associate Degree</option>
              <option value="bachelor">Bachelor's Degree</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
            <select value={form.employmentStatus} onChange={(e) => updateForm('employmentStatus', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select employment status</option>
              <option value="employed">Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="underemployed">Underemployed</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-200 rounded-lg">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Goals</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are your career goals?</label>
            <textarea value={form.goals} onChange={(e) => updateForm('goals', e.target.value)} rows={5} className="w-full px-4 py-2 border rounded-lg" placeholder="Tell us about your career aspirations..." />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Application Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Name: {form.firstName} {form.lastName}</p>
              <p>Email: {form.email}</p>
              <p>Program: {form.program}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-200 rounded-lg">Back</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
