'use client';

import { useState } from 'react';
import { 
  FolderOpen, 
  File, 
  Component, 
  Link2, 
  ChevronRight, 
  ChevronDown,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Bot,
  Zap,
  Plus,
  MoreVertical
} from 'lucide-react';
import type { 
  ProjectState, 
  PageState, 
  ComponentState,
  WorkerState,
  TaskState,
  TaskStatus,
  STATUS_COLORS,
  WORKER_COLORS
} from './types';

interface RightPanelProps {
  project?: ProjectState;
  workers: WorkerState[];
  tasks: TaskState[];
  onSelectPage?: (page: PageState) => void;
  onSelectComponent?: (component: ComponentState) => void;
}

export function RightPanel({
  project,
  workers,
  tasks,
  onSelectPage,
  onSelectComponent,
}: RightPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workers: true,
    tasks: true,
    pages: true,
    components: true,
    integrations: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calculate progress
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalProgress = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Project
          </h2>
          <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        {project ? (
          <div>
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-slate-500 mt-1">{project.description}</p>
            )}
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Overall Progress</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-red-600 to-brand-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No project open</p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Workers */}
        <Section
          title="AI Workers"
          icon={<Bot className="w-4 h-4" />}
          count={workers.length}
          expanded={expandedSections.workers}
          onToggle={() => toggleSection('workers')}
        >
          <WorkersList workers={workers} />
        </Section>

        {/* Tasks */}
        <Section
          title="Tasks"
          icon={<Zap className="w-4 h-4" />}
          count={`${completedTasks}/${tasks.length}`}
          expanded={expandedSections.tasks}
          onToggle={() => toggleSection('tasks')}
        >
          <TasksList tasks={tasks} />
        </Section>

        {/* Pages */}
        <Section
          title="Pages"
          icon={<File className="w-4 h-4" />}
          count={project?.pages.length || 0}
          expanded={expandedSections.pages}
          onToggle={() => toggleSection('pages')}
        >
          <PagesList 
            pages={project?.pages || []} 
            onSelect={onSelectPage}
          />
        </Section>

        {/* Components */}
        <Section
          title="Components"
          icon={<Component className="w-4 h-4" />}
          count={project?.components.length || 0}
          expanded={expandedSections.components}
          onToggle={() => toggleSection('components')}
        >
          <ComponentsList 
            components={project?.components || []} 
            onSelect={onSelectComponent}
          />
        </Section>

        {/* Integrations */}
        <Section
          title="Integrations"
          icon={<Link2 className="w-4 h-4" />}
          count={project?.integrations.length || 0}
          expanded={expandedSections.integrations}
          onToggle={() => toggleSection('integrations')}
        >
          <IntegrationsList integrations={project?.integrations || []} />
        </Section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 transition-colors font-medium text-sm">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
    </div>
  );
}

// Section Component
function Section({
  title,
  icon,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: string | number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-slate-700">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {expanded && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// Workers List
function WorkersList({ workers }: { workers: WorkerState[] }) {
  if (workers.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No active workers</p>;
  }

  return (
    <div className="space-y-2">
      {workers.map(worker => (
        <WorkerItem key={worker.id} worker={worker} />
      ))}
    </div>
  );
}

// Worker Item
function WorkerItem({ worker }: { worker: WorkerState }) {
  const statusColors: Record<string, string> = {
    idle: 'bg-slate-200',
    working: 'bg-blue-500 animate-pulse',
    waiting: 'bg-yellow-500',
    completed: 'bg-emerald-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
        <span className="text-lg">{worker.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 text-sm">{worker.name}</span>
          <div className={`w-2 h-2 rounded-full ${statusColors[worker.status]}`} />
        </div>
        {worker.currentTask && (
          <p className="text-xs text-slate-500 truncate">{worker.currentTask}</p>
        )}
      </div>
      <span className="text-xs font-medium text-slate-500">{worker.progress}%</span>
    </div>
  );
}

// Tasks List
function TasksList({ tasks }: { tasks: TaskState[] }) {
  if (tasks.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No tasks</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

// Task Item
function TaskItem({ task }: { task: TaskState }) {
  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-slate-400" />,
    in_progress: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    completed: <Check className="w-4 h-4 text-emerald-500" />,
    failed: <AlertCircle className="w-4 h-4 text-red-500" />,
    blocked: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  };

  const priorityColors: Record<string, string> = {
    low: 'border-l-slate-300',
    medium: 'border-l-blue-500',
    high: 'border-l-orange-500',
    critical: 'border-l-red-500',
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 border-l-4 ${priorityColors[task.priority]}`}>
      <div className="flex-shrink-0 mt-0.5">
        {statusIcons[task.status]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {task.title}
        </p>
        {task.subtasks && task.subtasks.length > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length} subtasks
          </p>
        )}
      </div>
      {task.status === 'in_progress' && (
        <div className="flex-shrink-0 w-12">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Pages List
function PagesList({ 
  pages, 
  onSelect 
}: { 
  pages: PageState[]; 
  onSelect?: (page: PageState) => void;
}) {
  if (pages.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No pages created yet</p>;
  }

  return (
    <div className="space-y-1">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => onSelect?.(page)}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
        >
          <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">{page.name}</p>
            <p className="text-xs text-slate-400">{page.route}</p>
          </div>
          <span className="text-xs text-slate-400">{page.elementCount}</span>
        </button>
      ))}
    </div>
  );
}

// Components List
function ComponentsList({ 
  components, 
  onSelect 
}: { 
  components: ComponentState[]; 
  onSelect?: (component: ComponentState) => void;
}) {
  if (components.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No components created yet</p>;
  }

  return (
    <div className="space-y-1">
      {components.map(component => (
        <button
          key={component.id}
          onClick={() => onSelect?.(component)}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
        >
          <Component className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">{component.name}</p>
            <p className="text-xs text-slate-400">{component.type}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// Integrations List
function IntegrationsList({ 
  integrations 
}: { 
  integrations: { id: string; name: string; type: string; status: TaskStatus }[] 
}) {
  if (integrations.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No integrations added yet</p>;
  }

  const statusColors: Record<TaskStatus, string> = {
    pending: 'text-slate-400',
    in_progress: 'text-blue-500',
    completed: 'text-emerald-500',
    failed: 'text-red-500',
    blocked: 'text-yellow-500',
  };

  return (
    <div className="space-y-1">
      {integrations.map(integration => (
        <div
          key={integration.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"
        >
          <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">{integration.name}</p>
            <p className="text-xs text-slate-400">{integration.type}</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            integration.status === 'completed' ? 'bg-emerald-500' : 
            integration.status === 'in_progress' ? 'bg-blue-500' : 
            integration.status === 'failed' ? 'bg-red-500' : 'bg-slate-300'
          }`} />
        </div>
      ))}
    </div>
  );
}

export default RightPanel;
