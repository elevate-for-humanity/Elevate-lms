import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Search,
  User,
  Calendar,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tasks | Staff Portal',
  description: 'Manage your staff tasks and to-do items.',
};

export const dynamic = 'force-dynamic';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string | null;
  student_name?: string;
  created_at: string;
}

export default async function StaffTasksPage() {
  const { user, profile } = await requireRole(['staff', 'admin', 'super_admin']);
  const supabase = await createClient();

  // For demo, show placeholder tasks
  // In production, this would query tasks table
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Review new student applications',
      description: '3 new applications need review',
      status: 'pending',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      assigned_to: profile?.full_name || 'Staff',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Update enrollment records',
      description: 'Verify 5 enrollment completions',
      status: 'in_progress',
      priority: 'medium',
      due_date: new Date(Date.now() + 172800000).toISOString(),
      assigned_to: profile?.full_name || 'Staff',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Schedule student orientations',
      description: '2 students pending orientation',
      status: 'completed',
      priority: 'low',
      due_date: null,
      assigned_to: profile?.full_name || 'Staff',
      created_at: new Date().toISOString(),
    },
  ];

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
              <p className="text-slate-600 mt-1">Manage your staff tasks and to-do items</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-slate-600">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-slate-600">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option>All Status</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option>All Priority</option>
                <option>Urgent</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div className="divide-y">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-4">
                  <div className={`w-5 h-5 rounded border-2 mt-0.5 ${
                    task.status === 'completed' 
                      ? 'bg-green-500 border-green-500' 
                      : task.status === 'in_progress'
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${
                          task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority}
                        </span>
                        <button className="p-1 hover:bg-slate-200 rounded">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
