'use client';

import { useState, useEffect } from 'react';

interface Program { id: string; name: string; description: string; slug: string; status: string; }
interface Module { id: string; program_id: string; title: string; description: string; order_index: number; }
interface Course { id: string; program_id: string; title: string; description: string; slug: string; status: string; }
interface Lesson { id: string; course_id: string; title: string; order_index: number; duration_minutes: number; lesson_type: string; competency_keys: string[]; }
interface Competency { id: string; code: string; name: string; level: string; }
interface Assessment { id: string; name: string; assessment_type: string; passing_score: number; competency_ids: string[]; }
interface EnrollmentProgress { enrollment: unknown; progress: unknown[]; completedCount: number; totalLessons: number; percentage: number; }

export default function EducationWorkflowPage() {
  const [activeTab, setActiveTab] = useState<'authoring' | 'student'>('authoring');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [packet, setPacket] = useState<Record<string, unknown> | null>(null);
  const [studentProgress, setStudentProgress] = useState<EnrollmentProgress | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [testUserId, setTestUserId] = useState<string>('');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedProgram) loadProgramData(selectedProgram); }, [selectedProgram]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/education/workflow');
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data.programs || []);
        setCompetencies(data.data.competencies || []);
        setAssessments(data.data.assessments || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadProgramData = async (programId: string) => {
    const res = await fetch(`/api/admin/education/workflow?program_id=${programId}&include=modules,courses,lessons,assessments`);
    const data = await res.json();
    if (data.success) {
      setModules(data.data.modules || []);
      setCourses(data.data.courses || []);
      setLessons(data.data.lessons || []);
      setAssessments(data.data.assessments || []);
    }
  };

  const executeAction = async (action: string, payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/education/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data: payload }),
    });
    const result = await res.json();
    if (result.success) {
      if (selectedProgram) loadProgramData(selectedProgram);
      else loadData();
      if (action === 'enroll_student') setTestUserId((result.data as { enrollment: { user_id: string } }).enrollment.user_id);
    } else { alert('Error: ' + result.error); }
    return result;
  };

  const enrollStudent = async () => {
    if (!selectedProgram || !testUserId) { alert('Select program and enter user ID'); return; }
    await executeAction('enroll_student', { program_id: selectedProgram, user_id: testUserId });
  };

  const markLessonComplete = async () => {
    if (!selectedLesson || !testUserId) { alert('Select lesson and user ID'); return; }
    const result = await executeAction('update_lesson_progress', { lesson_id: selectedLesson, user_id: testUserId, status: 'completed' });
    if (result.success) checkProgress();
  };

  const checkProgress = async () => {
    if (!selectedProgram || !testUserId) return;
    const res = await fetch('/api/admin/education/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_enrollment_progress', data: { program_id: selectedProgram, user_id: testUserId } }),
    });
    const data = await res.json();
    if (data.success) setStudentProgress(data.data);
  };

  const getTranscript = async () => {
    if (!selectedProgram || !testUserId) return;
    const res = await fetch('/api/admin/education/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_student_transcript', data: { program_id: selectedProgram, user_id: testUserId } }),
    });
    const data = await res.json();
    if (data.success) setStudentProgress(data.data);
  };

  const exportPacket = async () => {
    if (!selectedProgram) return;
    const res = await fetch('/api/admin/education/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export_approval_packet', data: { program_id: selectedProgram } }),
    });
    const data = await res.json();
    if (data.success) setPacket(data.data);
  };

  const steps = [
    { id: 'program', label: 'Program', color: 'bg-blue-500' },
    { id: 'module', label: 'Module', color: 'bg-purple-500' },
    { id: 'course', label: 'Course', color: 'bg-green-500' },
    { id: 'lesson', label: 'Lesson', color: 'bg-amber-500' },
    { id: 'competency', label: 'Competency', color: 'bg-red-500' },
    { id: 'assessment', label: 'Assessment', color: 'bg-cyan-500' },
  ];

  const counts = [programs.length, modules.length, courses.length, lessons.length, competencies.length, assessments.length];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold">Education E2E Workflow</h1>
        <p className="text-sm text-gray-500">Program → Course → Module → Lesson → Competency → Assessment → Student → Completion</p>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('authoring')} className={`px-4 py-2 rounded ${activeTab === 'authoring' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Course Authoring</button>
          <button onClick={() => setActiveTab('student')} className={`px-4 py-2 rounded ${activeTab === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Student Lifecycle</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {activeTab === 'authoring' ? (
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">1. Select Program</h2>
            <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select a program...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => executeAction('create_program', { name: 'New Program', description: '' })} className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm">+ New Program</button>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">2. Modules ({modules.length})</h2>
            {modules.length === 0 ? <p className="text-gray-400 text-sm">No modules yet</p> : modules.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>{m.title}</span><span className="text-xs text-gray-500">Order: {m.order_index}</span>
              </div>
            ))}
            {selectedProgram && <button onClick={() => executeAction('add_module', { program_id: selectedProgram, title: `Module ${modules.length + 1}`, order_index: modules.length })} className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm">+ Add Module</button>}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">3. Courses ({courses.length})</h2>
            {courses.length === 0 ? <p className="text-gray-400 text-sm">No courses yet</p> : courses.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>{c.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{c.status}</span>
              </div>
            ))}
            {selectedProgram && <button onClick={() => executeAction('add_course', { program_id: selectedProgram, title: `Course ${courses.length + 1}` })} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm">+ Add Course</button>}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">4. Lessons ({lessons.length})</h2>
            {lessons.length === 0 ? <p className="text-gray-400 text-sm">No lessons yet</p> : lessons.map(l => (
              <div key={l.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <div><span>{l.title}</span><span className="ml-2 text-xs text-gray-500">{l.duration_minutes}m • {l.lesson_type}</span></div>
                {l.competency_keys?.length > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{l.competency_keys.length} competencies</span>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">5. Competencies ({competencies.length})</h2>
            {competencies.length === 0 ? <p className="text-gray-400 text-sm">No competencies defined</p> : (
              <div className="flex flex-wrap gap-2">{competencies.map(c => (
                <span key={c.id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{c.code}: {c.name}</span>
              ))}</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">6. Assessments ({assessments.length})</h2>
            {assessments.length === 0 ? <p className="text-gray-400 text-sm">No assessments defined</p> : assessments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>{a.name}</span><span className="text-xs text-gray-500">{a.assessment_type} • Pass: {a.passing_score}%</span>
              </div>
            ))}
          </div>
        </div>
        ) : (
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Student Enrollment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Select Program</label>
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select a program...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Student User ID</label>
                <input type="text" value={testUserId} onChange={e => setTestUserId(e.target.value)} placeholder="Enter user UUID..." className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <button onClick={enrollStudent} disabled={!selectedProgram || !testUserId} className="mt-3 px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300">Enroll Student</button>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Lesson Progress</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Select Lesson</label>
                <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select a lesson...</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={markLessonComplete} disabled={!selectedLesson || !testUserId} className="px-4 py-2 bg-amber-600 text-white rounded disabled:bg-gray-300">Mark Complete</button>
                <button onClick={checkProgress} disabled={!testUserId} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">Check Progress</button>
              </div>
            </div>
          </div>

          {studentProgress && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Student Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1"><span>Overall Progress</span><span>{studentProgress.percentage}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${studentProgress.percentage}%` }} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
              <div className="bg-gray-50 p-3 rounded"><div className="text-2xl font-bold">{studentProgress.completedCount}</div><div className="text-xs text-gray-500">Completed</div></div>
              <div className="bg-gray-50 p-3 rounded"><div className="text-2xl font-bold">{studentProgress.totalLessons}</div><div className="text-xs text-gray-500">Total Lessons</div></div>
              <div className="bg-gray-50 p-3 rounded"><div className="text-2xl font-bold">{studentProgress.totalLessons - studentProgress.completedCount}</div><div className="text-xs text-gray-500">Remaining</div></div>
            </div>
            <button onClick={getTranscript} className="mt-4 w-full px-4 py-2 bg-cyan-600 text-white rounded">Generate Transcript</button>
          </div>
          )}
        </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Export Approval Packet</h2>
            <button onClick={exportPacket} disabled={!selectedProgram} className="w-full py-2 bg-cyan-600 text-white rounded disabled:bg-gray-300">Generate Approval Packet</button>
            {packet && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                <p className="font-medium">Packet Generated:</p>
                <p>Modules: {(packet.summary as Record<string,number>)?.total_modules || 0}</p>
                <p>Courses: {(packet.summary as Record<string,number>)?.total_courses || 0}</p>
                <p>Lessons: {(packet.summary as Record<string,number>)?.total_lessons || 0}</p>
                <p>Competencies: {(packet.summary as Record<string,number>)?.total_competencies || 0}</p>
                <p>Assessments: {(packet.summary as Record<string,number>)?.total_assessments || 0}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Workflow Status</h2>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${counts[i] > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">{step.label}: {counts[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">E2E Test</h2>
            <div className={`p-3 rounded text-sm ${selectedProgram && modules.length > 0 && courses.length > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500'}`}>
              {selectedProgram ? '✓ Program selected' : '○ No program selected'}<br/>
              {modules.length > 0 ? '✓ Modules created' : '○ No modules'}<br/>
              {courses.length > 0 ? '✓ Courses created' : '○ No courses'}<br/>
              {lessons.length > 0 ? '✓ Lessons linked' : '○ No lessons'}<br/>
              {competencies.length > 0 ? '✓ Competencies defined' : '○ No competencies'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
