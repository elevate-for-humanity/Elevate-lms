'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress: number;
  at_risk: boolean;
  enrolled_at: string;
  completed_at: string | null;
  student?: { id: string; full_name: string | null; email: string } | null;
  course?: { id: string; title: string } | null;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  initialEnrollments: Enrollment[];
  users: User[];
  courses: Course[];
  stats: {
    total: number;
    active: number;
    completed: number;
    atRisk: number;
  };
}

export default function EnrollmentManagementClient({ initialEnrollments, users, courses, stats }: Props) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [showModal, setShowModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    user_id: '',
    course_id: '',
    status: 'active',
    progress: '0',
    at_risk: false,
  });

  const supabase = createClient();

  const resetForm = () => {
    setFormData({ user_id: '', course_id: '', status: 'active', progress: '0', at_risk: false });
    setEditingEnrollment(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (enrollment: Enrollment) => {
    setFormData({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      status: enrollment.status || 'active',
      progress: enrollment.progress?.toString() || '0',
      at_risk: enrollment.at_risk || false,
    });
    setEditingEnrollment(enrollment);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingEnrollment) {
        // UPDATE existing enrollment
        const { data, error: updateError } = await supabase
          .from('enrollments')
          .update({
            status: formData.status,
            progress: parseInt(formData.progress) || 0,
            at_risk: formData.at_risk,
            completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEnrollment.id)
          .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
          .single();

        if (updateError) throw updateError;
        setEnrollments(enrollments.map(e => e.id === editingEnrollment.id ? data : e));
      } else {
        // CREATE new enrollment
        // Check if already enrolled
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', formData.user_id)
          .eq('course_id', formData.course_id)
          .single();

        if (existing) {
          setError('User is already enrolled in this course');
          setLoading(false);
          return;
        }

        const { data, error: insertError } = await supabase
          .from('enrollments')
          .insert({
            user_id: formData.user_id,
            course_id: formData.course_id,
            status: formData.status,
            progress: parseInt(formData.progress) || 0,
            at_risk: formData.at_risk,
            enrolled_at: new Date().toISOString(),
          })
          .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
          .single();

        if (insertError) throw insertError;
        setEnrollments([data, ...enrollments]);
      }

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to delete this enrollment? This will also remove all progress data.')) return;

    setLoading(true);
    try {
      // Delete lesson progress first
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      if (enrollment) {
        await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', enrollment.user_id)
          .eq('course_id', enrollment.course_id);
      }

      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (deleteError) throw deleteError;
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleAtRisk = async (enrollment: Enrollment) => {
    try {
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ at_risk: !enrollment.at_risk, updated_at: new Date().toISOString() })
        .eq('id', enrollment.id);

      if (updateError) throw updateError;
      setEnrollments(enrollments.map(e => e.id === enrollment.id ? { ...e, at_risk: !e.at_risk } : e));
    } catch (err: any) {
      setError('An error occurred');
    }
  };

  const markComplete = async (enrollment: Enrollment) => {
    try {
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ 
          status: 'completed', 
          progress: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', enrollment.id);

      if (updateError) throw updateError;
      setEnrollments(enrollments.map(e => e.id === enrollment.id ? { ...e, status: 'completed', progress: 100 } : e));
    } catch (err: any) {
      setError('An error occurred');
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const studentName = enrollment.student?.full_name || enrollment.student?.email || '';
    const courseName = enrollment.course?.title || '';
    const matchesSearch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentStats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    atRisk: enrollments.filter(e => e.at_risk).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600 mt-2">Manage student course enrollments</p>
        </div>
        <button onClick={openCreateModal} className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Enrollment
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Enrollments</p>
          <p className="text-2xl font-bold text-brand-blue-600">{currentStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{currentStats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-brand-blue-600">{currentStats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">At Risk</p>
          <p className="text-2xl font-bold text-red-600">{currentStats.atRisk}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search by student or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <span className="text-sm text-gray-500">{filteredEnrollments.length} enrollments</span>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className={`hover:bg-gray-50 ${enrollment.at_risk ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{enrollment.student?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{enrollment.student?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {enrollment.course?.title || 'Unknown Course'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        enrollment.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-700' :
                        enrollment.status === 'withdrawn' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {enrollment.status || 'active'}
                      </span>
                      {enrollment.at_risk && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">At Risk</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-brand-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress || 0}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{enrollment.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(enrollment)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Edit</button>
                      {enrollment.status !== 'completed' && (
                        <button onClick={() => markComplete(enrollment)} className="px-3 py-1 text-sm text-green-600 border border-green-200 rounded hover:bg-green-50">Complete</button>
                      )}
                      <button onClick={() => toggleAtRisk(enrollment)} className={`px-3 py-1 text-sm border rounded ${enrollment.at_risk ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}>
                        {enrollment.at_risk ? 'Clear Risk' : 'Flag Risk'}
                      </button>
                      <button onClick={() => handleDelete(enrollment.id)} className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No enrollments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingEnrollment ? 'Edit Enrollment' : 'New Enrollment'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  disabled={!!editingEnrollment}
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Select a student</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  disabled={!!editingEnrollment}
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="at_risk"
                  checked={formData.at_risk}
                  onChange={(e) => setFormData({ ...formData, at_risk: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="at_risk" className="text-sm text-gray-700">Flag as at-risk</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : (editingEnrollment ? 'Update' : 'Create Enrollment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
