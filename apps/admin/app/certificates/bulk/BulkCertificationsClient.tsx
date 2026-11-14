'use client';

import toast from 'react-hot-toast';
import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';

interface CertProfile {
  full_name: string | null;
  email: string | null;
}

interface PendingCert {
  id: string;
  user_id: string;
  certification_type_id: string;
  status: string;
  earned_date: string | null;
  profiles: CertProfile | null;
}

interface Props {
  pendingCertifications: PendingCert[];
  certificationTypes: { id: string; name: string }[];
  pendingCount: number;
}

export default function BulkCertificationsClient({
  pendingCertifications,
  certificationTypes,
  pendingCount,
}: Props) {
  const [certs, setCerts] = useState(pendingCertifications);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const filtered = certs.filter((c) => {
    if (filterType && c.certification_type_id !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)),
    );
  };

  const reviewCert = async (certId: string, action: 'approve' | 'reject') => {
    setLoading(certId);
    try {
      const res = await fetch('/api/admin/certifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: certId, action }),
      });
      if (res.ok) {
        setCerts((prev) => prev.filter((c) => c.id !== certId));
        setSelected((prev) => { const next = new Set(prev); next.delete(certId); return next; });
        toast.success(action === 'approve' ? 'Certification approved' : 'Certification rejected');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Action failed');
      }
    } catch {
      toast.error('Network error — try again');
    } finally {
      setLoading(null);
    }
  };

  const approveSelected = async () => {
    for (const id of [...selected]) await reviewCert(id, 'approve');
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType)   params.set('type_id', filterType);
      const res = await fetch(`/api/admin/certifications/export?${params}`);
      if (!res.ok) { toast.error('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certifications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/certifications/import', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Import failed'); return; }
      const msg = `Imported ${data.imported} record${data.imported !== 1 ? 's' : ''}${data.skipped ? `, skipped ${data.skipped}` : ''}`;
      data.errors?.length ? toast.error(`${msg}. ${data.errors[0]}`) : toast.success(msg);
      if (data.imported > 0) window.location.reload();
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <>
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              {certificationTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={approveSelected}
              disabled={selected.size === 0}
              className="bg-brand-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve Selected ({selected.size})
            </button>
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <label className={`flex items-center gap-1.5 border px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-50 ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {importing ? 'Importing…' : 'Import CSV'}
              <input
                ref={importRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importCSV}
                disabled={importing}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
        </div>
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
          <p className="text-sm text-brand-green-800">Showing</p>
          <p className="text-2xl font-bold text-brand-green-900">{filtered.length}</p>
        </div>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <p className="text-sm text-brand-blue-800">Selected</p>
          <p className="text-2xl font-bold text-brand-blue-900">{selected.size}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">Types</p>
          <p className="text-2xl font-bold text-slate-900">{certificationTypes.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Certifications</h2>
            <p className="text-sm text-slate-500">Review and approve certification records</p>
          </div>
          <button onClick={toggleAll} className="text-sm text-brand-blue-600 hover:text-brand-blue-800">
            {selected.size === filtered.length && filtered.length > 0 ? 'Clear' : 'Select All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="w-4 h-4 rounded"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Participant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Certification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Earned Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length > 0 ? filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="w-4 h-4 rounded"
                      checked={selected.has(cert.id)} onChange={() => toggleSelect(cert.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{cert.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{cert.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {certificationTypes.find((t) => t.id === cert.certification_type_id)?.name ?? cert.certification_type_id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cert.earned_date ? new Date(cert.earned_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'active'  ? 'bg-green-100 text-green-800' :
                      cert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      cert.status === 'expired' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-100 text-red-800'
                    }`}>{cert.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => reviewCert(cert.id, 'approve')} disabled={loading === cert.id}
                        className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50">
                        {loading === cert.id ? '…' : 'Approve'}
                      </button>
                      <button onClick={() => reviewCert(cert.id, 'reject')} disabled={loading === cert.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No certifications match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
