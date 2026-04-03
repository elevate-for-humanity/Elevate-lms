"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

interface BinderDocument {
  id: string;
  title: string;
  type: 'form' | 'certificate' | 'note' | 'assessment' | 'attendance' | 'mou' | 'handbook';
  date: string;
  status: 'complete' | 'pending' | 'missing';
  uploadedBy?: string;
  fileUrl?: string;
}

interface BinderNote {
  id: string;
  date: string;
  author: string;
  note: string;
  category: 'progress' | 'concern' | 'achievement' | 'general';
}

interface DigitalBinderProps {
  studentId?: string;
  studentName?: string;
  programName?: string;
}

export default function DigitalBinder({
  studentId,
  studentName,
  programName,
}: DigitalBinderProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'notes' | 'tracking'>('documents');
  const [newNote, setNewNote] = useState('');

  const [documents, setDocuments] = useState<BinderDocument[]>([]);
  const [notes, setNotes] = useState<BinderNote[]>([]);
  const [trackingData, setTrackingData] = useState({
    hoursCompleted: 0, hoursRequired: 0, attendanceRate: 0,
    assignmentsCompleted: 0, assignmentsTotal: 0, currentGrade: 0,
  });

  useEffect(() => {
    if (!studentId) return;
    const supabase = createClient();

    async function loadBinder() {
      const [docsRes, notesRes, enrollRes] = await Promise.all([
        supabase.from('documents').select('id, document_type, file_name, created_at, status, uploaded_by')
          .eq('user_id', studentId).order('created_at', { ascending: false }),
        supabase.from('case_notes').select('id, created_at, author_name, note, category')
          .eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('program_enrollments').select('progress, status')
          .eq('user_id', studentId).eq('status', 'active').limit(1).maybeSingle(),
      ]);

      setDocuments((docsRes.data || []).map(d => ({
        id: d.id, title: d.file_name || d.document_type, type: d.document_type || 'form',
        date: d.created_at?.split('T')[0] || '', status: d.status || 'pending', uploadedBy: d.uploaded_by || '',
      })));
      setNotes((notesRes.data || []).map(n => ({
        id: n.id, date: n.created_at?.split('T')[0] || '', author: n.author_name || '',
        note: n.note || '', category: n.category || 'progress',
      })));
      if (enrollRes.data) {
        setTrackingData(prev => ({ ...prev, hoursCompleted: enrollRes.data.progress || 0 }));
      }
    }

    loadBinder();
  }, [studentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-brand-green-100 text-brand-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'missing':
        return 'bg-brand-red-100 text-brand-red-800';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'achievement':
        return 'bg-brand-green-100 text-brand-green-800';
      case 'concern':
        return 'bg-yellow-100 text-yellow-800';
      case 'progress':
        return 'bg-brand-blue-100 text-brand-blue-800';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  // Only render for authenticated students with a real ID
  if (!studentId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="   rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Digital Binder</h2>
            <p className="text-brand-blue-100">{studentName || 'Student'} • {programName || 'Program'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-brand-blue-100">Student ID</div>
            <div className="font-mono font-semibold">{studentId.substring(0, 8)}…</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'documents'
              ? 'text-brand-blue-600 border-b-2 border-brand-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'notes'
              ? 'text-brand-blue-600 border-b-2 border-brand-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'tracking'
              ? 'text-brand-blue-600 border-b-2 border-brand-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Progress Tracking
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Required Documents</h3>
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
              Upload Document
            </button>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-black">{doc.title}</h4>
                      <span className={`px-2 py-2 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-black">
                      <span>Type: {doc.type}</span>
                      <span>Date: {new Date(doc.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {doc.uploadedBy && <span>By: {doc.uploadedBy}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.status === 'complete' && (
                      <button className="px-3 py-2 text-sm text-brand-blue-600 hover:bg-gray-50 rounded">
                        View
                      </button>
                    )}
                    <button className="px-3 py-2 text-sm text-black hover:bg-gray-50 rounded">
                      Download
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Case Notes & Progress Updates</h3>

            {/* Add Note Form */}
            <Card className="p-4 mb-4 bg-brand-blue-50 border-brand-blue-200">
              <textarea
                value={newNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewNote(e.target.value)}
                placeholder="Add a new note about this student..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>General</option>
                  <option>Progress</option>
                  <option>Concern</option>
                  <option>Achievement</option>
                </select>
                <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
                  Add Note
                </button>
              </div>
            </Card>

            {/* Notes List */}
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">{note.author}</span>
                      <span className={`px-2 py-2 rounded-full text-xs font-medium ${getCategoryColor(note.category)}`}>
                        {note.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(note.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-black">{note.note}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-black">Progress Tracking</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="text-sm text-black mb-2">Hours Completed</div>
              <div className="text-3xl font-bold text-black mb-3">
                {trackingData.hoursCompleted} / {trackingData.hoursRequired}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full"
                  style={{ width: `${(trackingData.hoursCompleted / trackingData.hoursRequired) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-black mb-2">Attendance Rate</div>
              <div className="text-3xl font-bold text-black mb-3">
                {trackingData.attendanceRate}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full"
                  style={{ width: `${trackingData.attendanceRate}%` }}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-black mb-2">Current Grade</div>
              <div className="text-3xl font-bold text-black mb-3">
                {trackingData.currentGrade}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full"
                  style={{ width: `${trackingData.currentGrade}%` }}
                />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold text-black mb-4">Assignments</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-black">Completed: {trackingData.assignmentsCompleted} / {trackingData.assignmentsTotal}</span>
              <span className="font-semibold text-black">
                {Math.round((trackingData.assignmentsCompleted / trackingData.assignmentsTotal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full"
                style={{ width: `${(trackingData.assignmentsCompleted / trackingData.assignmentsTotal) * 100}%` }}
              />
            </div>
          </Card>

          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-black mb-2">Action Items</h4>
            <ul className="space-y-2 text-sm text-black">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span>Background check pending - follow up with student</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span>Mid-program assessment due by Nov 25</span>
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
