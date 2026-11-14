'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

type ProgramOption = { id: string; title: string; slug: string };

type Props = { programs?: ProgramOption[] };

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

export default function StudentApplicationPage({ programs = [] }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ApplicationForm>({ firstName: '', lastName: '', email: '', phone: '', program: '', educationLevel: '', employmentStatus: '', goals: '' });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push('/apply/success');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ApplicationForm, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8"><div className="mb-4 flex items-center justify-center gap-4">{[1, 2, 3].map((value) => <div key={value} className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= value ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{value}</div>)}</div><p className="text-center text-gray-600">Step {step} of 3</p></div>
      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">First Name<input type="text" value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2" /></label>
            <label className="text-sm font-medium text-gray-700">Last Name<input type="text" value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2" /></label>
          </div>
          <label className="block text-sm font-medium text-gray-700">Email<input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2" /></label>
          <label className="block text-sm font-medium text-gray-700">Phone<input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2" /></label>
          <button type="button" onClick={() => setStep(2)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-white">Continue <ArrowRight className="h-4 w-4" /></button>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Program Selection</h2>
          <label className="block text-sm font-medium text-gray-700">Program<select value={form.program} onChange={(e) => updateForm('program', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2"><option value="">Select a program</option>{programs.map((program) => <option key={program.id} value={program.slug}>{program.title}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Education Level<select value={form.educationLevel} onChange={(e) => updateForm('educationLevel', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2"><option value="">Select education level</option><option value="high_school">High School</option><option value="ged">GED</option><option value="some_college">Some College</option><option value="associate">Associate Degree</option><option value="bachelor">Bachelor's Degree</option></select></label>
          <label className="block text-sm font-medium text-gray-700">Employment Status<select value={form.employmentStatus} onChange={(e) => updateForm('employmentStatus', e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2"><option value="">Select employment status</option><option value="employed">Employed</option><option value="unemployed">Unemployed</option><option value="underemployed">Underemployed</option><option value="student">Student</option></select></label>
          <div className="flex gap-2"><button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg bg-gray-200 py-3">Back</button><button type="button" onClick={() => setStep(3)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-white">Continue <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Goals</h2>
          <label className="block text-sm font-medium text-gray-700">What are your career goals?<textarea value={form.goals} onChange={(e) => updateForm('goals', e.target.value)} rows={5} className="mt-1 w-full rounded-lg border px-4 py-2" /></label>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700"><p>Name: {form.firstName} {form.lastName}</p><p>Email: {form.email}</p><p>Program: {programs.find((program) => program.slug === form.program)?.title || form.program}</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="flex-1 rounded-lg bg-gray-200 py-3">Back</button><button type="button" onClick={() => void handleSubmit()} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-white">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}{loading ? 'Submitting...' : 'Submit Application'}</button></div>
        </div>
      ) : null}
    </div>
  );
}
