'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const SOP_CATEGORIES = [
  { value: 'admissions', label: 'Admissions' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'testing', label: 'Testing' },
  { value: 'instructor_duties', label: 'Instructor Duties' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'workone', label: 'WorkOne' },
  { value: 'voc_rehab', label: 'Voc Rehab' },
  { value: 'grants', label: 'Grants' },
  { value: 'billing', label: 'Billing' },
  { value: 'compliance', label: 'Compliance' },
];

interface SOPContent {
  purpose: string;
  scope: string;
  required_documents: string[];
  steps: { title: string; description: string }[];
  responsibilities: { role: string; duty: string }[];
  compliance_checklist: string[];
}

export default function SOPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sop, setSop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SOPContent>({
    purpose: '', scope: '', required_documents: [], steps: [], responsibilities: [], compliance_checklist: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', status: '' });
  const [newDoc, setNewDoc] = useState('');
  const [newStep, setNewStep] = useState({ title: '', description: '' });
  const [newResp, setNewResp] = useState({ role: '', duty: '' });
  const [newChecklist, setNewChecklist] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchSOP = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('sop_templates').select('*').eq('id', id).single();
      if (data) {
        setSop(data);
        setFormData({ title: data.title, category: data.category, description: data.description || '', status: data.status });
        if (data.content) setContent(data.content);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  const fetchEmployees = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('employees').select('*').eq('status', 'active');
      setEmployees(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('sop_assignments').select('*, assigned_user:assigned_to(first_name, last_name, email)').eq('sop_id', id);
      setAssignments(data || []);
    } catch (err) { console.error(err); }
  }, [id]);

  useEffect(() => { fetchSOP(); fetchEmployees(); fetchAssignments(); }, [fetchSOP, fetchEmployees, fetchAssignments]);

  async function saveSOP() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('sop_templates').update({
        title: formData.title, category: formData.category, description: formData.description, status: formData.status, content, updated_by: user?.id,
      }).eq('id', id);
      setEditMode(false);
      fetchSOP();
    } catch (err) { alert('Failed to save'); }
    finally { setSaving(false); }
  }

  async function assignSOP() {
    if (!selectedEmployee) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('sop_assignments').insert({
        sop_id: id, assigned_to: selectedEmployee, assigned_by: user?.id, due_date: dueDate || null, status: 'assigned',
      });
      setShowAssignModal(false);
      setSelectedEmployee('');
      setDueDate('');
      fetchAssignments();
    } catch (err) { alert('Failed to assign'); }
  }

  if (loading) return <div className="p-6 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!sop) return <div className="p-6"><div className="bg-red-50 border border-red-200 p-4 rounded-lg">SOP not found. <Link href="/admin/sops" className="underline">Back</Link></div></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/sops" className="text-blue-600 hover:underline text-sm">← Back</Link>
          <h1 className="text-2xl font-bold mt-1">{editMode ? 'Edit SOP' : sop.title}</h1>
          <p className="text-gray-600">{SOP_CATEGORIES.find(c => c.value === sop.category)?.label} • v{sop.version} • <span className={`px-2 py-0.5 rounded-full text-xs ${sop.status === 'active' ? 'bg-green-100 text-green-700' : sop.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}>{sop.status}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('AI Draft Generation - Coming Soon!')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">🤖 Generate Draft</button>
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={saveSOP} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 border rounded-lg">Assign</button>
              <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Edit</button>
            </>
          )}
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium mb-2">Assigned To</h3>
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <span key={a.id} className="bg-white px-3 py-1 rounded-full text-sm">
                {a.assigned_user?.first_name} {a.assigned_user?.last_name} <span className="text-gray-500 text-xs">({a.status})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {editMode ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg px-3 py-2">{SOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-medium">Content</h3>
            <div><label className="block text-sm font-medium mb-1">Purpose</label><textarea value={content.purpose} onChange={(e) => setContent({...content, purpose: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Why does this SOP exist?" /></div>
            <div><label className="block text-sm font-medium mb-1">Scope</label><textarea value={content.scope} onChange={(e) => setContent({...content, scope: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Who does this apply to?" /></div>
            <div>
              <label className="block text-sm font-medium mb-1">Required Documents</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={newDoc} onChange={(e) => setNewDoc(e.target.value)} placeholder="Document name" className="flex-1 border rounded-lg px-3 py-2" onKeyDown={(e) => { if (e.key === 'Enter' && newDoc.trim()) { setContent({...content, required_documents: [...content.required_documents, newDoc.trim()]}); setNewDoc(''); } }} />
                <button onClick={() => { if (newDoc.trim()) { setContent({...content, required_documents: [...content.required_documents, newDoc.trim()]}); setNewDoc(''); }}} className="px-3 py-2 border rounded-lg">Add</button>
              </div>
              <ul className="list-disc list-inside text-sm">{content.required_documents.map((doc, i) => <li key={i} className="flex justify-between">{doc}<button onClick={() => setContent({...content, required_documents: content.required_documents.filter((_, idx) => idx !== i)})} className="text-red-600 text-xs ml-2">Remove</button></li>)}</ul>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Procedure Steps</label>
              <div className="space-y-2 mb-2">{content.steps.map((step, i) => <div key={i} className="flex gap-2 items-start bg-gray-50 p-2 rounded"><span className="font-bold">{i+1}.</span><div className="flex-1"><div className="font-medium">{step.title}</div><div className="text-sm text-gray-600">{step.description}</div></div><button onClick={() => setContent({...content, steps: content.steps.filter((_, idx) => idx !== i)})} className="text-red-600 text-sm">Remove</button></div>)}</div>
              <div className="flex gap-2">
                <input type="text" value={newStep.title} onChange={(e) => setNewStep({...newStep, title: e.target.value})} placeholder="Step title" className="flex-1 border rounded-lg px-3 py-2" />
                <input type="text" value={newStep.description} onChange={(e) => setNewStep({...newStep, description: e.target.value})} placeholder="Description" className="flex-1 border rounded-lg px-3 py-2" />
                <button onClick={() => { if (newStep.title.trim()) { setContent({...content, steps: [...content.steps, newStep]}); setNewStep({title: '', description: ''}); }}} className="px-3 py-2 border rounded-lg">Add</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compliance Checklist</label>
              <div className="space-y-1 mb-2">{content.compliance_checklist.map((item, i) => <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded"><span>☐ {item}</span><button onClick={() => setContent({...content, compliance_checklist: content.compliance_checklist.filter((_, idx) => idx !== i)})} className="text-red-600 text-sm ml-auto">Remove</button></div>)}</div>
              <div className="flex gap-2">
                <input type="text" value={newChecklist} onChange={(e) => setNewChecklist(e.target.value)} placeholder="Compliance requirement" className="flex-1 border rounded-lg px-3 py-2" onKeyDown={(e) => { if (e.key === 'Enter' && newChecklist.trim()) { setContent({...content, compliance_checklist: [...content.compliance_checklist, newChecklist.trim()]}); setNewChecklist(''); } }} />
                <button onClick={() => { if (newChecklist.trim()) { setContent({...content, compliance_checklist: [...content.compliance_checklist, newChecklist.trim()]}); setNewChecklist(''); }}} className="px-3 py-2 border rounded-lg">Add</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sop.description && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-2">Description</h3><p className="text-gray-600">{sop.description}</p></div>}
          {content.purpose && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-2">Purpose</h3><p className="text-gray-600">{content.purpose}</p></div>}
          {content.scope && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-2">Scope</h3><p className="text-gray-600">{content.scope}</p></div>}
          {content.required_documents.length > 0 && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-2">Required Documents</h3><ul className="list-disc list-inside text-gray-600">{content.required_documents.map((doc, i) => <li key={i}>{doc}</li>)}</ul></div>}
          {content.steps.length > 0 && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-4">Procedure Steps</h3><ol className="space-y-4">{content.steps.map((step, i) => <li key={i} className="flex gap-4"><span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{i+1}</span><div><div className="font-medium">{step.title}</div>{step.description && <p className="text-gray-600 mt-1">{step.description}</p>}</div></li>)}</ol></div>}
          {content.compliance_checklist.length > 0 && <div className="bg-white rounded-lg shadow p-6"><h3 className="font-medium mb-2">Compliance Checklist</h3><ul className="space-y-1">{content.compliance_checklist.map((item, i) => <li key={i} className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-gray-300 rounded"></span><span className="text-gray-600">{item}</span></li>)}</ul></div>}
          {!content.purpose && !content.scope && content.steps.length === 0 && <div className="bg-gray-50 rounded-lg p-6 text-center"><p className="text-gray-600 mb-4">This SOP has no content yet.</p><button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Content</button></div>}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Assign SOP</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Employee</label><select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={assignSOP} disabled={!selectedEmployee} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
