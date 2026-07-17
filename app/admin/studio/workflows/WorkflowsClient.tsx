'use client';

import { useState } from 'react';
import { GitBranch, Plus, Play, Pause, Trash2, Settings, RefreshCw } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  steps_count: number;
  last_run?: string;
  created_at: string;
}

export default function WorkflowsClient() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const toggleWorkflow = async (id: string) => {
    try {
      await fetch(`/api/admin/studio/workflows/${id}/toggle`, { method: 'POST' });
      setWorkflows(workflows.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch(`/api/admin/studio/workflows/${id}`, { method: 'DELETE' });
      setWorkflows(workflows.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case 'paused': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Paused</span>;
      case 'draft': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="w-6 h-6" /> Workflows</h1>
        <div className="flex gap-2">
          <button onClick={fetchWorkflows} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Workflows</p>
          <p className="text-2xl font-bold">{workflows.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{workflows.filter(w => w.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Paused</p>
          <p className="text-2xl font-bold text-amber-600">{workflows.filter(w => w.status === 'paused').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steps</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {workflows.map(workflow => (
              <tr key={workflow.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{workflow.name}</p>
                  {workflow.description && <p className="text-sm text-gray-500">{workflow.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-sm">{workflow.trigger}</td>
                <td className="px-4 py-3 text-gray-600">{workflow.steps_count}</td>
                <td className="px-4 py-3">{getStatusBadge(workflow.status)}</td>
                <td className="px-4 py-3 text-gray-600">{workflow.last_run || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => toggleWorkflow(workflow.id)} className="p-1 text-gray-400 hover:text-blue-600">
                      {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => deleteWorkflow(workflow.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
