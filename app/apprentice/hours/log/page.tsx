'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Save, AlertCircle, Building, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';

export default function LogApprenticeHoursPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    type: '',
    employer: '',
    supervisor: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.hours || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setError('Please enter valid hours (between 0.5 and 24)');
      return;
    }

    if (authLoading) {
      setError('Please wait while we verify your session.');
      return;
    }

    if (!user) {
      router.push('/login?redirect=/apprentice/hours/log');
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve program_slug from active enrollment
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('program_slug')
        .eq('user_id', user.id)
        .in('status', ['active', 'enrolled', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const res = await fetch('/api/apprenticeship/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_worked: formData.date,
          hours,
          category: formData.type === 'ojt' ? 'on-the-job' : 'classroom',
          notes: [
            formData.notes,
            formData.employer ? `Employer: ${formData.employer}` : null,
            formData.supervisor ? `Supervisor: ${formData.supervisor}` : null,
          ].filter(Boolean).join(' | ') || null,
          program_slug: enrollment?.program_slug ?? 'apprenticeship',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save hours');
      }

      setSuccess(true);
      setTimeout(() => router.push('/apprentice/hours'), 1500);
    } catch (err: any) {
      logger.error('Error logging hours:', err);
      setError(err?.message || 'Failed to save hours. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Hours Logged!</h1>
          <p className="text-slate-700 mb-4">
            Your apprenticeship hours have been submitted for approval.
          </p>
          <p className="text-sm text-slate-700">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Apprentice', href: '/apprentice' },
              { label: 'Hours', href: '/apprentice/hours' },
              { label: 'Log Hours' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/apprentice/hours"
          className="inline-flex items-center text-slate-700 hover:text-brand-green-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hours
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-brand-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Log Apprenticeship Hours</h1>
              <p className="text-slate-700">Record your OJT or RTI hours</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-brand-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-brand-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Date <span className="text-brand-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Hours <span className="text-brand-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Enter hours"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Hour Type <span className="text-brand-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.type === 'ojt' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="ojt"
                    checked={formData.type === 'ojt'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="sr-only"
                  />
                  <Building
                    className={`w-6 h-6 mr-2 ${formData.type === 'ojt' ? 'text-brand-blue-600' : 'text-slate-700'}`}
                  />
                  <div className="text-left">
                    <p className="font-bold text-slate-900">OJT</p>
                    <p className="text-xs text-slate-700">On-the-Job Training</p>
                  </div>
                </label>
                <label
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.type === 'rti' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="rti"
                    checked={formData.type === 'rti'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="sr-only"
                  />
                  <Award aria-label="award"
                    className={`w-6 h-6 mr-2 ${formData.type === 'rti' ? 'text-brand-blue-600' : 'text-slate-700'}`}
                  />
                  <div className="text-left">
                    <p className="font-bold text-slate-900">RTI</p>
                    <p className="text-xs text-slate-700">Related Technical Instruction</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Employer/Training Provider
              </label>
              <input
                type="text"
                value={formData.employer}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                placeholder="e.g., ABC Barbershop"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Supervisor Name
              </label>
              <input
                type="text"
                value={formData.supervisor}
                onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                placeholder="Name of supervising journeyman or instructor"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Activities Performed
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Describe the work or training activities..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-green-500 resize-none"
              />
            </div>

            <div className="bg-brand-green-50 rounded-lg p-4 border border-brand-green-200">
              <h3 className="font-semibold text-slate-900 mb-2">Verification Required</h3>
              <p className="text-sm text-slate-900">
                Your hours will be verified by your supervisor or instructor before being credited
                to your apprenticeship record.
              </p>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Link
                href="/apprentice/hours"
                className="px-6 py-3 text-slate-900 hover:text-slate-900 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Hours
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
