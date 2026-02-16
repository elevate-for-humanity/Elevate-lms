
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, XCircle, ArrowLeft, User, Calendar, Building, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface PendingHour {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  hour_type: string;
  activity_type: string;
  employer_name: string | null;
  supervisor_name: string | null;
  description: string | null;
  status: string;
  created_at: string;
  student_name?: string;
  student_email?: string;
}

export default function PartnerHoursPendingPage() {
  const router = useRouter();
  const supabase = createClient();
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
      // Fetch pending hours with student info
      const { data: hours, error: hoursError } = await supabase
        .from('training_hours')
        .select(`
          id,
          user_id,
          date,
          hours,
          hour_type,
          activity_type,
          employer_name,
          supervisor_name,
          description,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (hoursError) throw hoursError;

      // Fetch student names for each hour entry
      if (hours && hours.length > 0) {
        const userIds = [...new Set(hours.map(h => h.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedHours = hours.map(h => ({
          ...h,
          student_name: profileMap.get(h.user_id)?.full_name || 'Unknown',
          student_email: profileMap.get(h.user_id)?.email || '',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading pending hours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <span className="text-slate-400 flex-shrink-0">•</span>
              {processing === 'bulk' ? 'Processing...' : 'Approve All'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {pendingHours.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600 mb-6">No pending hours to review.</p>
            <Link
              href="/partner/hours"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                          {new Date(hour.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{hour.hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hour.hour_type === 'ojt' 
                            ? 'bg-brand-blue-100 text-brand-blue-700' 
                            : 'bg-brand-blue-100 text-brand-blue-700'
                        }`}>
                          {hour.hour_type === 'ojt' ? 'OJT' : 'RTI'}
                        </span>
                      </div>
                      {hour.employer_name && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{hour.employer_name}</span>
                        </div>
                      )}
                    </div>

                    {hour.description && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{hour.description}</p>
                      </div>
                    )}

                    {hour.supervisor_name && (
                      <p className="text-sm text-gray-500">
                        Supervisor: <span className="font-medium">{hour.supervisor_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleReject(hour.id)}
                      disabled={processing === hour.id}
                      className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(hour.id)}
                      disabled={processing === hour.id}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <span className="text-slate-400 flex-shrink-0">•</span>
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
