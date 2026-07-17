'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Clock, Plus, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      const newStatus = task?.status === 'completed' ? 'pending' : 'completed';
      await fetch(`/api/admin/studio/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/admin/studio/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">High</span>;
      case 'medium': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Medium</span>;
      case 'low': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Low</span>;
      default: return priority;
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">Tasks</h1>
        <div className="flex gap-2">
          <button onClick={fetchTasks} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg">Refresh</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingTasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">High Priority</p>
          <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map(task => (
              <tr key={task.id} className={`hover:bg-gray-50 ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <button onClick={() => toggleTask(task.id)} className="text-gray-400 hover:text-green-600">
                    {task.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</p>
                  {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                </td>
                <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                <td className="px-4 py-3 text-gray-600 flex items-center gap-1">
                  {task.due_date && <Clock className="w-4 h-4" />}{task.due_date || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
