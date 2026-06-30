'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Application {
  id: string;
  status: string;
  program_id: string;
  submitted_at: string;
}

interface Program { id: string; title: string; slug: string }

export default function StudentApplicationPage({ programs = [] }: { programs?: Program[] }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [qualificationMessage, setQualificationMessage] = useState('');

  const [formData, setFormData] = useState({
    program: '',
    education: '',
    employment_status: '',
    funding_source: '',
    funding_readiness: '',
    workone_center: '',
    workone_appointment_date: '',
    start_date: '',
    goals: '',
    hear_about: '',
  });

  const [workoneChecklist, setWorkoneChecklist] = useState({
    icc_account_created: false,
    profile_completed: false,
    docs_uploaded: false,
    appointment_booked: false,
    met_advisor: false,
  });

  const isFundedFlow = ['wioa', 'wrg', 'fssa'].includes(formData.funding_source);
  const needsWorkOnePath = ['wioa', 'wrg'].includes(formData.funding_source);

  const getQualification = () => {
    if (formData.funding_source === 'self-pay' || formData.funding_source === 'employer') {
      return {
        status: 'qualified',
        headline: 'You are ready to proceed',
        message: 'Your application can move directly to admin review and enrollment follow-up.',
      };
    }

    if (isFundedFlow && formData.funding_readiness === 'not-started') {
      return {
        status: 'action_required',
        headline: 'Action required before enrollment',
        message:
          'You must complete an Indiana Career Connect / agency appointment before final funding approval.',
      };
    }

    if (isFundedFlow && ['in-progress', 'approved'].includes(formData.funding_readiness)) {
      return {
        status: 'pending_verification',
        headline: 'Conditionally qualified',
        message: 'Your application will move to funding verification and admin review.',
      };
    }

    return {
      status: 'review',
      headline: 'Application will be reviewed',
      message: 'Our team will review your answers and contact you with next steps.',
    };
  };

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/login?redirect=/lms/apply');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profile) {
      setUser(profile);
    }

    // Check for existing application
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('email', authUser.email)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (application) {
      setExistingApplication(application);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (isFundedFlow && !formData.funding_readiness) {
      setError('Please complete the funding eligibility progress section before submitting.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user?.first_name,
          lastName: user?.last_name,
          email: user?.email,
          phone: user?.phone,
          program: formData.program,
          source: 'lms_portal',
          fundingType: formData.funding_source || null,
          fundingEligibilityStatus:
            formData.funding_readiness === 'not-started'
              ? 'needs_appointment'
              : formData.funding_readiness === 'approved'
                ? 'approved'
                : formData.funding_readiness === 'in-progress'
                  ? 'in_process'
                  : null,
          notes: JSON.stringify({
            education: formData.education,
            employment_status: formData.employment_status,
            funding_source: formData.funding_source,
            funding_readiness: formData.funding_readiness,
            workone_center: formData.workone_center,
            workone_appointment_date: formData.workone_appointment_date,
            workone_checklist: Object.entries(workoneChecklist)
              .filter(([, done]) => done)
              .map(([key]) => key),
            qualification: getQualification(),
            preferred_start: formData.start_date,
            goals: formData.goals,
            referral_source: formData.hear_about,
          }),
        }),
      });

      if (response.ok) {
        setQualificationMessage(getQualification().headline);
        setSuccess(true);
        setTimeout(() => {
          router.push('/lms/apply/status');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit application');
      }
    } catch (error) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: 'My Programs', href: '/lms/courses' }, { label: 'Apply' }]} />
        </div>
        <div className="max-w-3xl mx-auto px-4" aria-live="polite" role="status">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <span className="sr-only">Loading your application…</span>
            <div className="space-y-3 mb-4">
              <div className="h-5 w-48 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-72 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center mb-4">
            {existingApplication.status === 'approved' ? (
              <span className="text-slate-400 flex-shrink-0">•</span>
            ) : existingApplication.status === 'rejected' ? (
              <AlertCircle className="w-16 h-16 text-brand-red-500" />
            ) : (
              <FileText className="w-16 h-16 text-brand-blue-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Already Submitted</h1>
          <p className="text-slate-700 mb-4">
            You submitted an application on{' '}
            {new Date(existingApplication.submitted_at).toLocaleDateString('en-US', {
              timeZone: 'UTC',
            })}
          </p>
          <div
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              existingApplication.status === 'approved'
                ? 'bg-brand-green-100 text-brand-green-800'
                : existingApplication.status === 'rejected'
                  ? 'bg-brand-red-100 text-brand-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            Status:{' '}
            {existingApplication.status.charAt(0).toUpperCase() +
              existingApplication.status.slice(1)}
          </div>

          {existingApplication.status === 'approved' && (
            <div className="mt-6">
              <a
                href="/lms/enroll"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
              >
                Proceed to Enrollment
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          {qualificationMessage ? <p className="text-emerald-700 font-medium mb-2">{qualificationMessage}</p> : null}
          <p className="text-slate-700">Redirecting to status page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Program Application</h1>
        <p className="text-slate-700 mt-2">Complete your application to enroll in a program</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
          <p className="text-brand-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Personal Info (pre-filled) */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-700">Name</span>
              <p className="font-medium">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div>
              <span className="text-slate-700">Email</span>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Program Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Program <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a program...</option>
            {programs.map((p) => (
              <option key={p.id} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Highest Education Level <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="less-than-hs">Less than High School</option>
            <option value="hs-diploma">High School Diploma / GED</option>
            <option value="some-college">Some College</option>
            <option value="associates">Associate's Degree</option>
            <option value="bachelors">Bachelor's Degree</option>
            <option value="masters-plus">Master's or Higher</option>
          </select>
        </div>

        {/* Employment Status */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Current Employment Status <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.employment_status}
            onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="unemployed">Unemployed</option>
            <option value="part-time">Employed Part-Time</option>
            <option value="full-time">Employed Full-Time</option>
            <option value="self-employed">Self-Employed</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Funding Source */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            How do you plan to pay for training? <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.funding_source}
            onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="wioa">WIOA / Next Level Jobs (Free if eligible)</option>
            <option value="wrg">Workforce Ready Grant (Free if eligible)</option>
            <option value="fssa">FSSA (Family &amp; Social Services Administration)</option>
            <option value="employer">Employer Sponsored</option>
            <option value="self-pay">Self Pay</option>
            <option value="financial-aid">Financial Aid</option>
            <option value="not-sure">Not Sure - Need Guidance</option>
          </select>
        </div>

        {isFundedFlow && (
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Funding Eligibility Progress <span className="text-brand-red-500">*</span>
            </label>
            <select
              required={isFundedFlow}
              value={formData.funding_readiness}
              onChange={(e) => setFormData({ ...formData, funding_readiness: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select...</option>
              <option value="not-started">I have not started Indiana Career Connect / agency intake</option>
              <option value="in-progress">I started and I am waiting for funding determination</option>
              <option value="approved">I already have funding approval</option>
            </select>
          </div>
        )}

        {needsWorkOnePath && (
          <div className="rounded-lg border border-brand-blue-200 bg-brand-blue-50 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-brand-blue-900">WorkOne Appointment Instructions</p>
            <ol className="list-decimal list-inside text-sm text-brand-blue-900 space-y-1">
              <li>Create your Indiana Career Connect account</li>
              <li>Complete your profile and upload your resume</li>
              <li>Schedule a WorkOne appointment with a career advisor</li>
              <li>Request funding determination (WIOA/WRG)</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 rounded-md bg-brand-blue-700 text-white text-sm font-medium hover:bg-brand-blue-800"
              >
                Open Indiana Career Connect
              </a>
              <a
                href="https://www.in.gov/dwd/find-a-workone-center/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 rounded-md border border-brand-blue-300 text-brand-blue-900 text-sm font-medium hover:bg-brand-blue-100"
              >
                Find a WorkOne Center
              </a>
            </div>
          </div>
        )}

        {needsWorkOnePath && formData.funding_readiness === 'in-progress' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Post-WorkOne Progress Checklist</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                ['icc_account_created', 'ICC account created'],
                ['profile_completed', 'Profile completed'],
                ['docs_uploaded', 'Documents uploaded'],
                ['appointment_booked', 'Appointment booked'],
                ['met_advisor', 'Met WorkOne advisor'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={workoneChecklist[key as keyof typeof workoneChecklist]}
                    onChange={(e) =>
                      setWorkoneChecklist((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">WorkOne center</label>
                <input
                  type="text"
                  value={formData.workone_center}
                  onChange={(e) => setFormData({ ...formData, workone_center: e.target.value })}
                  placeholder="Example: WorkOne Indy East"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Appointment date</label>
                <input
                  type="date"
                  value={formData.workone_appointment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, workone_appointment_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Qualification Preview</p>
          <p className="text-sm text-slate-700 mt-1">{getQualification().headline}</p>
          <p className="text-xs text-slate-600 mt-1">{getQualification().message}</p>
        </div>

        {/* Preferred Start Date */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            When would you like to start?
          </label>
          <select
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="asap">As soon as possible</option>
            <option value="1-month">Within 1 month</option>
            <option value="2-3-months">2-3 months</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            What are your career goals?
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            rows={3}
            placeholder="Tell us about your career aspirations..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* How did you hear about us */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.hear_about}
            onChange={(e) => setFormData({ ...formData, hear_about: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="google">Google Search</option>
            <option value="social-media">Social Media</option>
            <option value="friend-family">Friend or Family</option>
            <option value="employer">Employer</option>
            <option value="workforce-agency">Workforce Agency</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
