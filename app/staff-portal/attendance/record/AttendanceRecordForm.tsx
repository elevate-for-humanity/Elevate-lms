'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, CheckCircle, XCircle, Clock, Users, Save } from 'lucide-react';

interface Student {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  program: string;
  programId: string;
  attended: boolean;
  status: string | null;
  checkIn: string | null;
}

interface Props {
  students: Student[];
  date: string;
  staffId: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

export default function AttendanceRecordForm({ students, date, staffId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'marked' | 'unmarked'>('all');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(students.map(s => [s.id, s.status as AttendanceStatus]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'marked') return matchesSearch && attendance[student.id] !== null;
    if (filter === 'unmarked') return matchesSearch && attendance[student.id] === null;
    return matchesSearch;
  });

  const markedCount = Object.values(attendance).filter(v => v !== null).length;
  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => { newAttendance[s.id] = 'present'; });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const records = students
        .filter(s => attendance[s.id] !== null)
        .map(s => ({
          student_id: s.id,
          enrollment_id: s.enrollmentId,
          date: date,
          status: attendance[s.id],
          check_in_time: attendance[s.id] === 'present' || attendance[s.id] === 'late' 
            ? new Date().toISOString() 
            : null,
          recorded_by: staffId,
        }));

      if (records.length === 0) {
        setMessage({ type: 'error', text: 'No attendance records to save' });
        return;
      }

      // Upsert attendance records
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { 
          onConflict: 'student_id,date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setMessage({ type: 'success', text: `Saved attendance for ${records.length} students` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <Users className="w-6 h-6 text-brand-blue-500 mb-1" />
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
          <p className="text-2xl font-bold">{presentCount}</p>
          <p className="text-sm text-gray-500">Present</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <XCircle className="w-6 h-6 text-red-500 mb-1" />
          <p className="text-2xl font-bold">{absentCount}</p>
          <p className="text-sm text-gray-500">Absent</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <Clock className="w-6 h-6 text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{markedCount}/{students.length}</p>
          <p className="text-sm text-gray-500">Marked</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg">
              <option value="all">All Students</option>
              <option value="marked">Marked</option>
              <option value="unmarked">Unmarked</option>
            </select>
            <button onClick={markAllPresent} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Mark All Present
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Program</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{student.program}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setStatus(student.id, 'present')}
                        className={`px-3 py-1.5 rounded text-sm ${
                          attendance[student.id] === 'present' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 hover:bg-green-100'
                        }`}>
                        Present
                      </button>
                      <button onClick={() => setStatus(student.id, 'late')}
                        className={`px-3 py-1.5 rounded text-sm ${
                          attendance[student.id] === 'late' 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-gray-100 hover:bg-yellow-100'
                        }`}>
                        Late
                      </button>
                      <button onClick={() => setStatus(student.id, 'absent')}
                        className={`px-3 py-1.5 rounded text-sm ${
                          attendance[student.id] === 'absent' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 hover:bg-red-100'
                        }`}>
                        Absent
                      </button>
                      <button onClick={() => setStatus(student.id, 'excused')}
                        className={`px-3 py-1.5 rounded text-sm ${
                          attendance[student.id] === 'excused' 
                            ? 'bg-brand-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-brand-blue-100'
                        }`}>
                        Excused
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  {students.length === 0 ? 'No active students found' : 'No students match your search'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
