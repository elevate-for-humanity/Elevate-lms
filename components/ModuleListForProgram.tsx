"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Video, FileText, BookOpen, HelpCircle, Users, 
  Eye, EyeOff, GripVertical, Loader2, Plus, 
  ExternalLink, Clock 
} from 'lucide-react';

interface CourseModule {
  id: string;
  program_id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'scorm' | 'quiz' | 'live' | 'lesson';
  order_index: number;
  duration_minutes?: number;
  is_published: boolean;
  scorm_package_id?: string;
  content_url?: string;
  created_at: string;
  updated_at?: string;
}

interface Props {
  programId: string;
  modules?: CourseModule[];
  editable?: boolean;
  onModuleUpdate?: (module: CourseModule) => void;
}

const TYPE_ICONS = {
  video: Video,
  pdf: FileText,
  scorm: BookOpen,
  quiz: HelpCircle,
  live: Users,
  lesson: BookOpen,
};

const TYPE_LABELS = {
  video: 'Video',
  pdf: 'PDF/Handout',
  scorm: 'SCORM Package',
  quiz: 'Quiz',
  live: 'Live Session',
  lesson: 'Lesson',
};

export function ModuleListForProgram({ 
  programId, 
  modules: initialModules,
  editable = false,
  onModuleUpdate 
}: Props) {
  const [modules, setModules] = useState<CourseModule[]>(initialModules || []);
  const [loading, setLoading] = useState(!initialModules);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch modules from database
  const fetchModules = useCallback(async () => {
    if (initialModules) {
      setModules(initialModules);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { data, error: fetchError } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      setModules(data || []);
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [programId, initialModules]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Toggle publish status
  const togglePublish = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    setSaving(moduleId);
    const supabase = createClient();

    try {
      const newStatus = !module.is_published;

      const { error: updateError } = await supabase
        .from('program_modules')
        .update({ 
          is_published: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

      if (updateError) throw updateError;

      // Update local state
      const updatedModule = { ...module, is_published: newStatus };
      setModules(prev => prev.map(m => m.id === moduleId ? updatedModule : m));
      onModuleUpdate?.(updatedModule);

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          user_id: user.id,
          action: newStatus ? 'module_published' : 'module_unpublished',
          entity_type: 'program_module',
          entity_id: moduleId,
          metadata: { program_id: programId, module_title: module.title },
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error updating module:', err);
      setError('Failed to update module');
    } finally {
      setSaving(null);
    }
  };

  // Reorder modules (drag and drop would be implemented with a library)
  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const index = modules.findIndex(m => m.id === moduleId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newModules = [...modules];
    const [removed] = newModules.splice(index, 1);
    newModules.splice(newIndex, 0, removed);

    // Update order indices
    const updatedModules = newModules.map((m, i) => ({ ...m, order_index: i + 1 }));
    setModules(updatedModules);

    // Save to database
    const supabase = createClient();
    for (const m of updatedModules) {
      await supabase
        .from('program_modules')
        .update({ order_index: m.order_index })
        .eq('id', m.id)
        .catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">
            No modules defined for this program yet.
          </p>
          {editable && (
            <Link
              href={`/admin/programs/${programId}/modules/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add First Module
            </Link>
          )}
        </div>
      ) : (
        <ol className="space-y-3">
          {modules.map((module, index) => {
            const Icon = TYPE_ICONS[module.type] || BookOpen;
            const isSaving = saving === module.id;

            return (
              <li
                key={module.id}
                className={`rounded-lg border p-4 transition-all ${
                  module.is_published 
                    ? 'bg-white border-slate-200' 
                    : 'bg-slate-50 border-slate-300 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  {editable && (
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => moveModule(module.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <button
                        onClick={() => moveModule(module.id, 'down')}
                        disabled={index === modules.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  )}

                  {/* Module Icon */}
                  <div className={`p-3 rounded-lg ${
                    module.is_published ? 'bg-brand-blue-100' : 'bg-slate-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      module.is_published ? 'text-brand-blue-600' : 'text-slate-500'
                    }`} />
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">
                        Module {module.order_index}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        module.is_published 
                          ? 'bg-brand-green-100 text-brand-green-700' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {module.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{module.title}</h4>
                    {module.description && (
                      <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {TYPE_LABELS[module.type]}
                      </span>
                      {module.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {editable && (
                      <button
                        onClick={() => togglePublish(module.id)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          module.is_published
                            ? 'bg-brand-green-600 text-white hover:bg-brand-green-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        } disabled:opacity-50`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : module.is_published ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        {module.is_published ? 'Published' : 'Draft'}
                      </button>
                    )}

                    {module.type === 'scorm' && module.scorm_package_id && (
                      <Link
                        href={`/student/scorm/${module.scorm_package_id}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Preview SCORM
                      </Link>
                    )}

                    {editable && (
                      <Link
                        href={`/admin/programs/${programId}/modules/${module.id}/edit`}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Edit Module
                      </Link>
                    )}
                  </div>
                </div>

                {/* Module Details (expandable in future) */}
                {editable && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-slate-700 mb-1">Teaching Notes</p>
                      <p className="text-slate-500">
                        Add instructor guidance for this module.
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-slate-700 mb-1">Attachments</p>
                      <p className="text-slate-500">
                        {module.content_url ? '1 file attached' : 'No files attached'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-slate-700 mb-1">Completion</p>
                      <p className="text-slate-500">
                        Track student progress here.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {editable && modules.length > 0 && (
        <Link
          href={`/admin/programs/${programId}/modules/new`}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-blue-500 hover:text-brand-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </Link>
      )}

      <p className="text-xs text-slate-500 mt-4">
        {modules.length} module{modules.length !== 1 ? 's' : ''} • 
        {modules.filter(m => m.is_published).length} published
      </p>
    </div>
  );
}

export default ModuleListForProgram;
