'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Certificate = {
  id: string;
  recipient_name: string;
  template_name: string;
  issued_at: string;
  status: string;
};

export default function BulkCertificationsClient({ certificates }: { certificates: Certificate[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/certificates/${id}/revoke`, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Revoke failed:', err);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      {certificates.length === 0 ? (
        <p className="text-slate-500">No certificates found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Recipient</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Template</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Issued</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td className="px-4 py-2 text-sm text-slate-900">{cert.recipient_name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{cert.template_name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      cert.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cert.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRevoke(cert.id)}
                      disabled={loading === cert.id || cert.status !== 'active'}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading === cert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
