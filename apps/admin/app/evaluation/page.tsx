'use client';

import { useState, useEffect } from 'react';

interface TaskDefinition {
  id: string;
  name: string;
  slug: string;
  domain: string;
  category: string;
  objective: string;
  status: string;
  createdAt: string;
}

interface QueueItem {
  id: string;
  resultId: string;
  taskId: string;
  status: string;
  priority: string;
  failureReasons: string[];
  createdAt: string;
}

export default function EvaluationStudioPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'queue' | 'reports'>('tasks');
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks') {
        const res = await fetch('/api/evaluation/tasks');
        const data = await res.json();
        setTasks(data.data || []);
      } else if (activeTab === 'queue') {
        const res = await fetch('/api/evaluation/queue');
        const data = await res.json();
        setQueue(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const domains = [
    { value: 'courses', label: 'Courses' },
    { value: 'paris', label: 'PARIS AI' },
    { value: 'admissions', label: 'Admissions' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'grants', label: 'Grants' },
    { value: 'apprenticeships', label: 'Apprenticeships' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'cfd', label: 'CFD/OpenFOAM' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Evaluation Studio</h1>
              <p className="text-sm text-gray-500 mt-1">
                Define, execute, and score AI tasks with deterministic validation
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              + New Task
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'tasks', label: 'Task Definitions', count: tasks.length },
              { id: 'queue', label: 'Review Queue', count: queue.length },
              { id: 'reports', label: 'Reports' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeTab === 'tasks' ? (
          <TasksList tasks={tasks} />
        ) : activeTab === 'queue' ? (
          <QueueList items={queue} />
        ) : (
          <ReportsView />
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} domains={domains} />
      )}
    </div>
  );
}

function TasksList({ tasks }: { tasks: TaskDefinition[] }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks defined</h3>
        <p className="mt-2 text-sm text-gray-500">Create your first evaluation task to start governing AI output quality.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{task.name}</div>
                <div className="text-sm text-gray-500">{task.objective?.slice(0, 60)}...</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{task.domain}</span>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(task.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueList({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Queue is empty</h3>
        <p className="mt-2 text-sm text-gray-500">All evaluations passed or have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <PriorityBadge priority={item.priority} />
                <span className="text-sm text-gray-500">Result: {item.resultId.slice(0, 8)}...</span>
              </div>
              <div className="mt-2 space-y-1">
                {item.failureReasons.map((reason, i) => (
                  <div key={i} className="text-sm text-red-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Reject</button>
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsView() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <h3 className="text-lg font-medium text-gray-900">Evaluation Reports</h3>
      <p className="mt-2 text-sm text-gray-500">Reports and analytics will be available here.</p>
    </div>
  );
}

function CreateTaskModal({ onClose, domains }: { onClose: () => void; domains: { value: string; label: string }[] }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: 'general',
    category: '',
    objective: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Evaluation Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {domains.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Objective</label>
            <textarea
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="What should this task accomplish?"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_validation: 'bg-yellow-100 text-yellow-800',
    pending_review: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
      {priority.toUpperCase()}
    </span>
  );
}
