'use client';

import { useState } from 'react';
import { Bot, Plus, Play, Pause, Trash2, Settings, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'stopped';
  last_run?: string;
  created_at: string;
  config: Record<string, unknown>;
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const toggleAgent = async (id: string) => {
    try {
      await fetch(`/api/admin/studio/agents/${id}/toggle`, { method: 'POST' });
      setAgents(agents.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    try {
      await fetch(`/api/admin/studio/agents/${id}`, { method: 'DELETE' });
      setAgents(agents.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6" /> AI Agents</h1>
        <div className="flex gap-2">
          <button onClick={fetchAgents} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Agent
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Agents</p>
          <p className="text-2xl font-bold">{agents.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{agents.filter(a => a.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Paused</p>
          <p className="text-2xl font-bold text-amber-600">{agents.filter(a => a.status === 'paused').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {agents.map(agent => (
              <tr key={agent.id}>
                <td className="px-4 py-3 font-medium">{agent.name}</td>
                <td className="px-4 py-3 text-gray-600">{agent.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agent.status === 'active' ? 'bg-green-100 text-green-800' :
                    agent.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{agent.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{agent.last_run || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => toggleAgent(agent.id)} className="p-1 text-gray-400 hover:text-blue-600">
                      {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => deleteAgent(agent.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
