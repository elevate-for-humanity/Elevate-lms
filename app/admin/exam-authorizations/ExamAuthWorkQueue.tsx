'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, User, FileText, AlertCircle } from 'lucide-react';

type AuthStatus = 'pending' | 'authorized' | 'denied';

interface ExamAuthRequest {
  id: string;
  student_name: string;
  student_email: string;
  exam_name: string;
  exam_code: string;
  scheduled_date: string;
  status: AuthStatus;
  notes?: string;
  authorized_by?: string;
}

export default function ExamAuthWorkQueue() {
  const [requests, setRequests] = useState<ExamAuthRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AuthStatus | 'all'>('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/exam-authorizations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
    setLoading(false);
  };

  const handleAuth = async (id: string, action: 'authorize' | 'deny') => {
    try {
      const res = await fetch(`/api/admin/exam-authorizations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests(requests.map(r =>
          r.id === id
            ? { ...r, status: action === 'authorize' ? 'authorized' : 'denied' as AuthStatus }
            : r
        ));
      }
    } catch (err) {
      console.error('Authorization failed:', err);
    }
  };

  const getStatusBadge = (status: AuthStatus) => {
    switch (status) {
      case 'authorized':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Authorized</span>;
      case 'denied':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Denied</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Exam Authorization Work Queue</h1>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4">
        {(['all', 'pending', 'authorized', 'denied'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? 'bg-brand-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No exam authorization requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{request.student_name}</h3>
                    <p className="text-sm text-slate-500">{request.student_email}</p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Exam:</span>
                  <span className="font-medium text-slate-700">{request.exam_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Code:</span>
                  <span className="font-mono text-slate-700">{request.exam_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="text-slate-700">{request.scheduled_date}</span>
                </div>
              </div>

              {request.notes && (
                <div className="bg-slate-50 rounded p-2 mb-4">
                  <p className="text-sm text-slate-600">{request.notes}</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleAuth(request.id, 'authorize')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Authorize
                  </button>
                  <button
                    onClick={() => handleAuth(request.id, 'deny')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
