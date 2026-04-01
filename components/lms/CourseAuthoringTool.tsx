
'use client';

import React from 'react';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Save,
  Video,
  FileText,
  Image,
  CheckSquare,
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'quiz';
  content: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  blocks: ContentBlock[];
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

// Sortable Module Component
function SortableModule(data: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-black">{module.title}</h3>
          <p className="text-sm text-black">
            {module.lessons.length} lessons
          </p>
        </div>
        <button
          onClick={() => onEdit(module)}
          className="p-2 text-brand-blue-600 hover:bg-gray-50 rounded"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(module.id)}
          className="p-2 text-brand-orange-600 hover:bg-brand-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Sortable Lesson Component
function SortableLesson(data: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-black">{lesson.title}</h4>
          <p className="text-xs text-black">
            {lesson.blocks.length} content blocks
          </p>
        </div>
        <button
          onClick={() => onEdit(lesson)}
          className="p-1 text-brand-blue-600 hover:bg-gray-50 rounded"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1 text-brand-orange-600 hover:bg-brand-red-50 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function CourseAuthoringTool() {
  const [course, setCourse] = useState<Course>({
    id: 'course-1',
    title: 'New Course',
    description: '',
    modules: [],
  });

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add new module
  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: 'New Module',
      description: '',
      lessons: [],
      order: course.modules.length,
    };
    setCourse({ ...course, modules: [...course.modules, newModule] });
    setEditingModule(newModule);
    setShowModuleForm(true);
  };

  // Add new lesson to module
  const addLesson = (moduleId: string) => {
    const module = course.modules.find((m) => m.id === moduleId);
    if (!module) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      description: '',
      blocks: [],
      order: module.lessons.length,
    };

    setCourse({
      ...course,
      modules: course.modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      ),
    });
    setEditingLesson(newLesson);
    setShowLessonForm(true);
  };

  // Handle module drag end
  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = course.modules.findIndex((m) => m.id === active.id);
    const newIndex = course.modules.findIndex((m) => m.id === over.id);

    setCourse({
      ...course,
      modules: arrayMove(course.modules, oldIndex, newIndex),
    });
  };

  // Handle lesson drag end
  const handleLessonDragEnd = (moduleId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const module = course.modules.find((m) => m.id === moduleId);
    if (!module) return;

    const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l) => l.id === over.id);

    setCourse({
      ...course,
      modules: course.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: arrayMove(m.lessons, oldIndex, newIndex) }
          : m
      ),
    });
  };

  // Save module
  const saveModule = (module: Module) => {
    setCourse({
      ...course,
      modules: course.modules.map((m) => (m.id === module.id ? module : m)),
    });
    setShowModuleForm(false);
    setEditingModule(null);
  };

  // Delete module
  const deleteModule = (moduleId: string) => {
    if (confirm('Delete this module and all its lessons?')) {
      setCourse({
        ...course,
        modules: course.modules.filter((m) => m.id !== moduleId),
      });
    }
  };

  // Delete lesson
  const deleteLesson = (moduleId: string, lessonId: string) => {
    if (confirm('Delete this lesson?')) {
      setCourse({
        ...course,
        modules: course.modules.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
            : m
        ),
      });
    }
  };

  // Save course to database
  const saveCourse = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });

      if (response.ok) {
        alert('Course saved successfully!');
      } else {
        alert('Failed to save course');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Error saving course');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={course.course_name}
                onChange={(
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >
                ) => setCourse({ ...course, title: e.target.value })}
                className="text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500 rounded px-2"
                placeholder="Course Title"
              />
              <input
                type="text"
                value={course.description}
                onChange={(
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >
                ) => setCourse({ ...course, description: e.target.value })}
                className="text-black border-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500 rounded px-2 mt-1 w-full"
                placeholder="Course Description"
              />
            </div>
            <button
              onClick={saveCourse}
              className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Save className="w-4 h-4" />
              Save Course
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Course Structure */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Course Structure</h2>
                <button
                  onClick={addModule}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {course.modules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No modules yet</p>
                  <p className="text-sm">Click "Add Module" to start</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleModuleDragEnd}
                >
                  <SortableContext
                    items={course.modules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {course.modules.map((module) => (
                      <div key={module.id} className="mb-4">
                        <SortableModule
                          module={module}
                          onEdit={(m: Module) => {
                            setEditingModule(m);
                            setShowModuleForm(true);
                          }}
                          onDelete={deleteModule}
                        />

                        {/* Lessons in Module */}
                        {module.lessons.length > 0 && (
                          <div className="ml-8 mt-2">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleLessonDragEnd(module.id)}
                            >
                              <SortableContext
                                items={module.lessons.map((l) => l.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {module.lessons.map((lesson) => (
                                  <SortableLesson
                                    key={module.id}
                                    lesson={lesson}
                                    onEdit={(l: Lesson) => {
                                      setEditingLesson(l);
                                      setShowLessonForm(true);
                                    }}
                                    onDelete={(id: string) =>
                                      deleteLesson(module.id, id)
                                    }
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          </div>
                        )}

                        <button
                          onClick={() => addLesson(module.id)}
                          className="ml-8 mt-2 flex items-center gap-2 px-3 py-2 text-sm text-brand-blue-600 hover:bg-gray-50 rounded"
                        >
                          <Plus className="w-3 h-3" />
                          Add Lesson
                        </button>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Right Content - Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {showModuleForm && editingModule ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Edit Module</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Module Title
                      </label>
                      <input
                        type="text"
                        value={editingModule.title}
                        onChange={(e) =>
                          setEditingModule({
                            ...editingModule,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingModule.description}
                        onChange={(e) =>
                          setEditingModule({
                            ...editingModule,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => saveModule(editingModule)}
                        className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                      >
                        Save Module
                      </button>
                      <button
                        onClick={() => {
                          setShowModuleForm(false);
                          setEditingModule(null);
                        }}
                        className="px-6 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : showLessonForm && editingLesson ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Edit Lesson</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Lesson Title
                      </label>
                      <input
                        type="text"
                        value={editingLesson.title}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingLesson.description}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Content Blocks
                      </label>
                      <div className="space-y-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-full">
                          <FileText className="w-4 h-4" />
                          Add Text Block
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-full">
                          <Video className="w-4 h-4" />
                          Add Video
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-full">
                          <Image className="w-4 h-4" />
                          Add Image
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-full">
                          <CheckSquare className="w-4 h-4" />
                          Add Quiz
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          // Save lesson logic here
                          setShowLessonForm(false);
                          setEditingLesson(null);
                        }}
                        className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                      >
                        Save Lesson
                      </button>
                      <button
                        onClick={() => {
                          setShowLessonForm(false);
                          setEditingLesson(null);
                        }}
                        className="px-6 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">Select a module or lesson to edit</p>
                  <p className="text-sm mt-2">
                    Or add a new module to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
