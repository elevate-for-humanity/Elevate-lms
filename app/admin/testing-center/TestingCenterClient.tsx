'use client';

import { useState } from 'react';
import { ClipboardCheck, Calendar, Users, CheckCircle, Clock, RefreshCw, FileText } from 'lucide-react';

interface TestSession {
  id: string;
  test_name: string;
  candidate_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: number;
  proctor?: string;
}

interface Test {
  id: string;
  name: string;
  type: string;
  duration_minutes: number;
  questions_count: number;
  sessions_today: number;
  status: 'active' | 'inactive';
}

export default function TestingCenterClient() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sesRes, testRes] = await Promise.all([
        fetch(`/api/admin/testing-center/sessions?date=${dateFilter}`),
        fetch('/api/admin/testing-center/tests'),
      ]);
      if (sesRes.ok) {
        const data = await sesRes.json();
        setSessions(data.sessions || []);
      }
      if (testRes.ok) {
        const data = await testRes.json();
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'in_progress': return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'scheduled': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Scheduled</span>;
      case 'cancelled': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Cancelled</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="w-6 h-6" /> Testing Center</h1>
        <div className="flex gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border rounded-lg" />
          <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Sessions Today</p>
          <p className="text-2xl font-bold">{sessions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'completed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{sessions.filter(s => s.status === 'in_progress').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Avg Score</p>
          <p className="text-2xl font-bold">
            {sessions.filter(s => s.score).length ? Math.round(sessions.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / sessions.filter(s => s.score).length) : '-'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tests.map(test => (
          <div key={test.id} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{test.name}</h3>
              <span className={`px-2 py-1 text-xs rounded ${test.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{test.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{test.type}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600"><Clock className="w-4 h-4 inline" /> {test.duration_minutes} min</span>
              <span className="text-gray-600"><FileText className="w-4 h-4 inline" /> {test.questions_count} Q</span>
              <span className="text-gray-600"><Users className="w-4 h-4 inline" /> {test.sessions_today}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Today's Sessions</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proctor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.map(session => (
              <tr key={session.id}>
                <td className="px-4 py-3 font-medium">{session.test_name}</td>
                <td className="px-4 py-3 text-gray-600">{session.candidate_name}</td>
                <td className="px-4 py-3 text-gray-600">{session.scheduled_at}</td>
                <td className="px-4 py-3 text-gray-600">{session.proctor || '-'}</td>
                <td className="px-4 py-3">{session.score ? `${session.score}%` : '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(session.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
