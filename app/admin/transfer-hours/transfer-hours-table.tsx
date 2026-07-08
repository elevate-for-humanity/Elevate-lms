'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react';

interface TransferHour {
  id: string;
  student_name: string;
  from_program: string;
  to_program: string;
  hours_requested: number;
  hours_approved?: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
}

interface TransferHoursTableProps {
  initialData?: TransferHour[];
}

export function TransferHoursTable({ initialData }: TransferHoursTableProps) {
  const [hours, setHours] = useState<TransferHour[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transfer-hours');
      if (res.ok) {
        const data = await res.json();
        setHours(data.hours || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const reviewTransfer = async (id: string, action: 'approve' | 'reject', hours?: number) => {
    try {
      await fetch(`/api/admin/transfer-hours/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, hours_approved: hours }),
      });
      setHours(hours.map(h => h.id === id ? { ...h, status: action === 'approve' ? 'approved' : 'rejected' } : h));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const filteredHours = hours.filter(h =>
    h.student_name.toLowerCase().includes(search.toLowerCase()) ||
    h.from_program.toLowerCase().includes(search.toLowerCase()) ||
    h.to_program.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredHours.map(hour => (
              <tr key={hour.id}>
                <td className="px-4 py-3 font-medium">{hour.student_name}</td>
                <td className="px-4 py-3 text-gray-600">{hour.from_program}</td>
                <td className="px-4 py-3 text-gray-600">{hour.to_program}</td>
                <td className="px-4 py-3">{hour.hours_approved || hour.hours_requested}h</td>
                <td className="px-4 py-3">
                  {hour.status === 'approved' && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Approved</span>}
                  {hour.status === 'rejected' && <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Rejected</span>}
                  {hour.status === 'pending' && <span className="text-amber-600">Pending</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{hour.submitted_at}</td>
                <td className="px-4 py-3 text-right">
                  {hour.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => reviewTransfer(hour.id, 'approve')} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                      <button onClick={() => reviewTransfer(hour.id, 'reject')} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
