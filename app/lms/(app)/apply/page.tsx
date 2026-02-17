
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, AlertCircle } from 'lucide-react';

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

export default function StudentApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    program: '',
    education: '',
    employment_status: '',
    funding_source: '',
    start_date: '',
    goals: '',
    hear_about: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/login?redirect=/lms/apply');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

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
      .single();

    if (application) {
      setExistingApplication(application);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email,
          phone: user?.phone,
          program_id: formData.program,
          notes: JSON.stringify({
            education: formData.education,
            employment_status: formData.employment_status,
            funding_source: formData.funding_source,
            preferred_start: formData.start_date,
            goals: formData.goals,
            referral_source: formData.hear_about,
          }),
        }),
      });

      if (response.ok) {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Apply" }]} />
        </div>
        <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-emerald-600"></div>
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
          <p className="text-gray-600 mb-4">
            You submitted an application on {new Date(existingApplication.submitted_at).toLocaleDateString()}
          </p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            existingApplication.status === 'approved' ? 'bg-brand-green-100 text-brand-green-800' :
            existingApplication.status === 'rejected' ? 'bg-brand-red-100 text-brand-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            Status: {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
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
          <p className="text-gray-600">Redirecting to status page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Program Application</h1>
        <p className="text-gray-600 mt-2">Complete your application to enroll in a program</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
          <p className="text-brand-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Personal Info (pre-filled) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name</span>
              <p className="font-medium">{user?.first_name} {user?.last_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Program Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a program...</option>
            <optgroup label="Healthcare">
              <option value="cna">CNA (Certified Nursing Assistant)</option>
              <option value="medical-assistant">Medical Assistant</option>
              <option value="phlebotomy">Phlebotomy</option>
            </optgroup>
            <optgroup label="Skilled Trades">
              <option value="hvac">HVAC Technician</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
            </optgroup>
            <optgroup label="Barber & Beauty">
              <option value="barber">Barber Apprenticeship</option>
              <option value="cosmetology">Cosmetology</option>
            </optgroup>
            <optgroup label="Technology">
              <option value="it-support">IT Support</option>
              <option value="cybersecurity">Cybersecurity</option>
            </optgroup>
            <optgroup label="Transportation">
              <option value="cdl">CDL (Commercial Driver License)</option>
            </optgroup>
          </select>
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highest Education Level <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Employment Status <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.employment_status}
            onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How do you plan to pay for training? <span className="text-brand-red-500">*</span>
          </label>
          <select
            required
            value={formData.funding_source}
            onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            <option value="wioa">WIOA / Next Level Jobs (Free if eligible)</option>
            <option value="employer">Employer Sponsored</option>
            <option value="self-pay">Self Pay</option>
            <option value="financial-aid">Financial Aid</option>
            <option value="not-sure">Not Sure - Need Guidance</option>
          </select>
        </div>

        {/* Preferred Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When would you like to start?
          </label>
          <select
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are your career goals?
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            rows={3}
            placeholder="Tell us about your career aspirations..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* How did you hear about us */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.hear_about}
            onChange={(e) => setFormData({ ...formData, hear_about: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
