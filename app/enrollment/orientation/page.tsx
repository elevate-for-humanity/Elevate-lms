
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Clock, CheckSquare, Users, ArrowRight } from 'lucide-react';

interface OrientationSection {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ORIENTATION_SECTIONS: OrientationSection[] = [
  {
    icon: <BookOpen className="w-6 h-6 text-brand-blue-600" />,
    title: 'What you\'re enrolling in',
    description: 'This is a program-based enrollment that leads to your credential or licensure pathway.',
  },
  {
    icon: <Clock className="w-6 h-6 text-brand-blue-600" />,
    title: 'How it works',
    description: 'You\'ll complete required learning, tracked progress, and required activities as part of your program.',
  },
  {
    icon: <CheckSquare className="w-6 h-6 text-brand-blue-600" />,
    title: 'Your responsibilities',
    description: 'Attend consistently. Complete required tasks. Keep your documents current.',
  },
  {
    icon: <Users className="w-6 h-6 text-brand-blue-600" />,
    title: 'What we handle',
    description: 'We manage enrollment tracking, compliance steps, and program access.',
  },
];

export default function OrientationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkEnrollment() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, enrollment_state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        router.push('/programs');
        return;
      }

      // Redirect based on state
      if (data.enrollment_state === 'applied' || data.enrollment_state === 'approved') {
        router.push('/enrollment/confirmed');
        return;
      }
      if (data.enrollment_state === 'orientation_complete') {
        router.push('/enrollment/documents');
        return;
      }
      if (data.enrollment_state === 'documents_complete' || data.enrollment_state === 'active') {
        router.push('/dashboard');
        return;
      }

      setEnrollmentId(data.id);
      setLoading(false);
    }

    checkEnrollment();
  }, [router]);

  async function handleComplete() {
    if (!agreed || !enrollmentId) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/enrollment/orientation/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete orientation');
      }

      router.push('/enrollment/documents');
    } catch (err: any) {
      setError('An error occurred');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orientation</h1>
          <p className="text-gray-600 mt-2">
            This takes about 10 minutes. Complete it once to unlock your program.
          </p>
        </div>

        {/* Orientation Sections */}
        <div className="space-y-4 mb-8">
          {ORIENTATION_SECTIONS.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  {section.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-gray-700">
              I understand my responsibilities and agree to continue.
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleComplete}
          disabled={!agreed || submitting}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-colors ${
            agreed && !submitting
              ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              Continue to Program
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
