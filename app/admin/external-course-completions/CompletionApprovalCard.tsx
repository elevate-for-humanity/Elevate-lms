'use client';

import { CheckCircle, XCircle, Clock, ExternalLink, User, Calendar } from 'lucide-react';

interface CompletionRecord {
  id: string;
  student_name: string;
  student_email: string;
  course_name: string;
  provider: string;
  completion_date: string;
  credential_id: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
}

interface CompletionApprovalCardProps {
  record: CompletionRecord;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function CompletionApprovalCard({ record, onApprove, onReject }: CompletionApprovalCardProps) {
  const getStatusBadge = () => {
    switch (record.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-slate-900">{record.student_name}</h3>
          <p className="text-sm text-slate-500">{record.student_email}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Course:</span>
          <span className="font-medium text-slate-700">{record.course_name}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Provider:</span>
          <span className="text-slate-700">{record.provider}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Completed:</span>
          <span className="text-slate-700">{record.completion_date}</span>
        </div>
        {record.credential_id && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Credential:</span>
            <span className="text-slate-700 font-mono text-xs">{record.credential_id}</span>
          </div>
        )}
      </div>

      {record.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => onApprove(record.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => onReject(record.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}

      {record.status === 'approved' && record.verified_by && (
        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
          Verified by {record.verified_by}
        </div>
      )}
    </div>
  );
}
