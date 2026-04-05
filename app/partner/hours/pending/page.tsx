'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, XCircle, ArrowLeft, User, Calendar, Building, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface PendingHour {
  id: string;
  user_id: string;
  work_date: string;
  hours_claimed: number;
  source_type: string;
  category: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  student_name?: string;
  student_email?: string;
}

export default function PartnerHoursPendingPage() {
  const router = useRouter();
  const [pendingHours, setPendingHours] = useState<PendingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingHours();
  }, []);

  const fetchPendingHours = async () => {
    setLoading(true);
    try {
      // Use API route (admin client + role checks) instead of direct Supabase query
      const res = await fetch('/api/partner/hours?status=pending');
      if (!res.ok) throw new Error('Failed to load pending hours');
      const data = await res.json();
      const hours = data.hours || [];

      if (hours.length > 0) {
        const enrichedHours = hours.map((h: any) => ({
          ...h,
          student_name: h.user_profiles
            ? `${h.user_profiles.first_name || ''} ${h.user_profiles.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown',
          student_email: h.user_profiles?.email || '',
        }));

        setPendingHours(enrichedHours);
      } else {
        setPendingHours([]);
      }
    } catch (err: any) {
      console.error('Error fetching pending hours:', err);
      setError('Failed to load pending hours');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (hourId: string) => {
    setProcessing(hourId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/apprenticeship/hours/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_id: hourId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve hours');
      }

      setSuccess('Hours approved successfully');
      setPendingHours(prev => prev.filter(h => h.id !== hourId));
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (hourId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessing(hourId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/apprenticeship/hours/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_id: hourId, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject hours');
      }

      setSuccess('Hours rejected');
      setPendingHours(prev => prev.filter(h => h.id !== hourId));
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (pendingHours.length === 0) return;
    
    const confirmed = confirm(`Approve all ${pendingHours.length} pending hours entries?`);
    if (!confirmed) return;

    setProcessing('bulk');
    setError(null);
    setSuccess(null);

    try {
      const hourIds = pendingHours.map(h => h.id);
      
      const response = await fetch('/api/apprenticeship/hours/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_ids: hourIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve hours');
      }

      setSuccess(`${hourIds.length} hours entries approved`);
      setPendingHours([]);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading pending hours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-7.jpg" alt="Pending hours" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Partner', href: '/partner' },
            { label: 'Hours', href: '/partner/hours' },
            { label: 'Pending Review' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/partner/hours" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Hours Review</h1>
              <p className="text-gray-600 mt-1">
                {pendingHours.length} {pendingHours.length === 1 ? 'entry' : 'entries'} awaiting approval
              </p>
            </div>
          </div>
          {pendingHours.length > 1 && (
            <button
              onClick={handleBulkApprove}
              disabled={processing === 'bulk'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
            >
              <span className="text-slate-500 flex-shrink-0">•</span>
              {processing === 'bulk' ? 'Processing...' : 'Approve All'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-600" />
            <p className="text-brand-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3">
            <span className="text-slate-500 flex-shrink-0">•</span>
            <p className="text-brand-green-800">{success}</p>
          </div>
        )}

        {pendingHours.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <span className="text-slate-500 flex-shrink-0">•</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600 mb-6">No pending hours to review.</p>
            <Link
              href="/partner/hours"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hours
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingHours.map((hour) => (
              <div key={hour.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{hour.student_name}</h3>
                        <p className="text-sm text-gray-500">{hour.student_email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {new Date(hour.work_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{hour.hours_claimed} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hour.source_type === 'ojt' 
                            ? 'bg-brand-blue-100 text-brand-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {hour.source_type === 'ojt' ? 'OJT' : hour.source_type === 'rti' ? 'RTI' : hour.source_type?.toUpperCase()}
                        </span>
                      </div>
                      {hour.category && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{hour.category}</span>
                        </div>
                      )}
                    </div>

                    {hour.notes && (
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{hour.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleReject(hour.id)}
                      disabled={processing === hour.id}
                      className="inline-flex items-center gap-1 px-3 py-2 text-brand-red-600 hover:bg-brand-red-50 rounded-lg disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(hour.id)}
                      disabled={processing === hour.id}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
                    >
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      {processing === hour.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
