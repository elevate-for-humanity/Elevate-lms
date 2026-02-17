"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'assignment' | 'discussion';
  duration?: number;
  content?: string;
  order: number;
}

interface DragDropBuilderProps {
  courseId: string;
  initialModules?: CourseModule[];
  onSave?: (modules: CourseModule[]) => void;
}

// Hook to load and save modules from DB
function useModulesDB(courseId: string, initialModules?: CourseModule[]) {
  const [modules, setModules] = useState<CourseModule[]>(initialModules || []);
  const supabase = createClient();

  useEffect(() => {
    async function loadModules() {
      const { data } = await supabase
        .from('course_modules')
        .select('id, title, type, duration, content, order')
        .eq('course_id', courseId)
        .order('order');
      if (data && data.length > 0) setModules(data);
    }
    if (!initialModules?.length) loadModules();
  }, [courseId, supabase, initialModules]);

  const saveModuleOrder = async (newModules: CourseModule[]) => {
    for (let i = 0; i < newModules.length; i++) {
      await supabase
        .from('course_modules')
        .update({ order: i })
        .eq('id', newModules[i].id);
    }
  };

  return { modules, setModules, saveModuleOrder };
}

function SortableItem({ module, onEdit, onDelete }: { module: CourseModule; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'reading':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'assignment':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
        );
      case 'discussion':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center text-brand-blue-600">
          {getIcon(module.type)}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-black">{module.title}</h4>
          <div className="flex items-center gap-4 text-sm text-black mt-1">
            <span className="capitalize">{module.type}</span>
            {module.duration && <span>{module.duration} min</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(module.id)}
            className="p-2 text-black hover:text-brand-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(module.id)}
            className="p-2 text-black hover:text-brand-orange-600 hover:bg-brand-red-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DragDropBuilder({ courseId, initialModules = [], onSave }: DragDropBuilderProps) {
  const [modules, setModules] = useState<CourseModule[]>(initialModules);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [newModule, setNewModule] = useState<Partial<CourseModule>>({
    title: '',
    type: 'video',
    duration: 0,
    content: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  }, []);

  const handleAddModule = () => {
    const module: CourseModule = {
      id: `module-${Date.now()}`,
      title: newModule.title || 'Untitled Module',
      type: newModule.type || 'video',
      duration: newModule.duration,
      content: newModule.content,
      order: modules.length,
    };

    setModules([...modules, module]);
    setShowAddModal(false);
    setNewModule({ title: '', type: 'video', duration: 0, content: '' });
  };

  const handleEditModule = (id: string) => {
    const module = modules.find((m) => m.id === id);
    if (module) {
      setEditingModule(module);
      setNewModule(module);
      setShowAddModal(true);
    }
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;

    setModules(modules.map((m) => (m.id === editingModule.id ? { ...m, ...newModule } : m)));
    setShowAddModal(false);
    setEditingModule(null);
    setNewModule({ title: '', type: 'video', duration: 0, content: '' });
  };

  const handleDeleteModule = (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      setModules(modules.filter((m) => m.id !== id));
    }
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(modules);
    }

    // Save to API
    try {
      await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      });
      alert('Course structure saved successfully!');
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to save course structure');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Course Builder</h2>
          <p className="text-black mt-1">Drag and drop to reorder modules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            + Add Module
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors"
          >
            Save Course
          </button>
        </div>
      </div>

      {/* Module List */}
      {modules.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="text-xl font-semibold text-black mb-2">No modules yet</h3>
          <p className="text-black mb-4">Get started by adding your first module</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Add First Module
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {modules.map((module) => (
              <SortableItem key={module.id} module={module} onEdit={handleEditModule}
onDelete={handleDeleteModule} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-black">
                {editingModule ? 'Edit Module' : 'Add New Module'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Module Title *</label>
                <input
                  type="text"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g., Introduction to HVAC Systems"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Module Type *</label>
                <select
                  value={newModule.type}
                  onChange={(e) => setNewModule({ ...newModule, type: e.target.value as CourseModule['type'] })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="video">Video Lesson</option>
                  <option value="quiz">Quiz/Assessment</option>
                  <option value="reading">Reading Material</option>
                  <option value="assignment">Assignment</option>
                  <option value="discussion">Discussion</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newModule.duration || ''}
                  onChange={(e) => setNewModule({ ...newModule, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="30"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Content/Description</label>
                <textarea
                  value={newModule.content}
                  onChange={(e) => setNewModule({ ...newModule, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="Add module description, learning objectives, or content..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingModule(null);
                  setNewModule({ title: '', type: 'video', duration: 0, content: '' });
                }}
                className="px-6 py-3 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingModule ? handleUpdateModule : handleAddModule}
                className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                {editingModule ? 'Update Module' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
