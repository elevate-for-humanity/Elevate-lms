'use client';

import { useState } from 'react';
import { User, Calendar, Clock, CheckCircle } from 'lucide-react';

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  hours: number;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export default function AttendanceRecordForm() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff-portal/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      await fetch('/api/admin/staff-portal/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, date, status }),
      });
      setRecords(records.map(r => r.student_id === studentId ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusButton = (studentId: string, currentStatus?: string) => (
    <div className="flex gap-2">
      <button
        onClick={() => markAttendance(studentId, 'present')}
        className={`px-3 py-1 text-xs rounded ${currentStatus === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
      >
        Present
      </button>
      <button
        onClick={() => markAttendance(studentId, 'late')}
        className={`px-3 py-1 text-xs rounded ${currentStatus === 'late' ? 'bg-amber-600 text-white' : 'bg-gray-100 hover:bg-amber-100'}`}
      >
        Late
      </button>
      <button
        onClick={() => markAttendance(studentId, 'absent')}
        className={`px-3 py-1 text-xs rounded ${currentStatus === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
      >
        Absent
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" /> Attendance Record</h1>
        <div className="flex items-center gap-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2 border rounded-lg" />
          <button onClick={fetchRecords} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Load Records</button>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Mark Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map(record => (
              <tr key={record.student_id}>
                <td className="px-4 py-3 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{record.student_name}</td>
                <td className="px-4 py-3 text-gray-600">{record.check_in || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{record.check_out || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{record.hours}h</td>
                <td className="px-4 py-3">
                  {record.status === 'present' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Present</span>}
                  {record.status === 'late' && <span className="text-amber-600">Late</span>}
                  {record.status === 'absent' && <span className="text-red-600">Absent</span>}
                </td>
                <td className="px-4 py-3 text-right">{getStatusButton(record.student_id, record.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
