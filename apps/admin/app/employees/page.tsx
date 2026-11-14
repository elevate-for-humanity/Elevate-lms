'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'staff', department: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from('employees').select('*').order('last_name');
      setEmployees(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function createEmployee() {
    if (!form.first_name || !form.last_name || !form.email) return;
    try {
      const supabase = createClient();
      await supabase.from('employees').insert({ ...form, status: 'active' });
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', role: 'staff', department: '' });
      fetchEmployees();
    } catch (err) { alert('Failed to create'); }
  }

  const filtered = filter === 'all' ? employees : employees.filter(e => e.status === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Employees</h1><p className="text-gray-600">{employees.length} total</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+ Add Employee</button>
      </div>

      <div className="mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      : filtered.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-600">No employees found</p></div>
      : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Department</th><th className="px-4 py-3 text-left">Status</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{emp.first_name} {emp.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{emp.role}</span></td>
                  <td className="px-4 py-3 text-gray-600">{emp.department || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-sm ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{emp.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">First Name</label><input type="text" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Last Name</label><input type="text" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="staff">Staff</option><option value="instructor">Instructor</option><option value="admin">Admin</option><option value="coordinator">Coordinator</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Department</label><input type="text" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={createEmployee} disabled={!form.first_name || !form.last_name || !form.email} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
