'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Video,
  FlaskConical,
  ClipboardList,
  MessageSquare,
  CheckCircle,
  Clock,
  Menu,
  X,
  GraduationCap,
  Download,
} from 'lucide-react';
import { COURSE_DEFINITIONS } from '@/lib/courses/definitions';

const course = COURSE_DEFINITIONS.find((c) => c.slug === 'hvac-technician')!;

// Flatten all lessons with module context
const allLessons = course.modules.flatMap((mod, mi) =>
  mod.lessons.map((lesson, li) => ({
    ...lesson,
    moduleTitle: mod.title,
    moduleIndex: mi,
    lessonIndex: li,
    globalIndex: 0,
  }))
);
allLessons.forEach((l, i) => (l.globalIndex = i));

const typeConfig: Record<string, { icon: typeof Video; label: string; color: string; bgColor: string }> = {
  video: { icon: Video, label: 'Video Lesson', color: 'text-brand-blue-600', bgColor: 'bg-brand-blue-50' },
  reading: { icon: FileText, label: 'Reading', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  quiz: { icon: ClipboardList, label: 'Quiz', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  lab: { icon: FlaskConical, label: 'Lab Exercise', color: 'text-brand-green-600', bgColor: 'bg-brand-green-50' },
};

function getLessonContent(lesson: (typeof allLessons)[0]) {
  if (lesson.type === 'video') {
    return (
      <div className="bg-slate-900 aspect-video rounded-xl flex items-center justify-center relative group">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition cursor-pointer">
            <Video className="w-10 h-10 text-white ml-1" />
          </div>
          <p className="text-white/80 text-sm">Video content — {lesson.durationMinutes || 15} minutes</p>
          <p className="text-white/50 text-xs mt-1">Preview mode — video playback available in enrolled LMS</p>
        </div>
        <div className="absolute top-4 left-4 bg-slate-900/70 text-white px-3 py-1.5 rounded text-xs">
          Lesson {lesson.globalIndex + 1} of {allLessons.length}
        </div>
      </div>
    );
  }

  if (lesson.type === 'lab') {
    return (
      <div className="bg-gradient-to-br from-brand-green-50 to-emerald-50 rounded-xl p-8 border border-brand-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-brand-green-600" />
          </div>
          <div>
            <p className="font-semibold text-brand-green-900">Hands-On Lab</p>
            <p className="text-sm text-brand-green-700">{lesson.durationMinutes || 60} minutes</p>
          </div>
        </div>
        <p className="text-brand-green-800 mb-4">{lesson.description}</p>
        <div className="bg-white/60 rounded-lg p-4 text-sm text-brand-green-700">
          <p className="font-medium mb-2">Lab Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Complete prerequisite reading/video lessons</li>
            <li>Access to lab equipment and workspace</li>
            <li>Instructor supervision required</li>
            <li>Document results in lab worksheet</li>
          </ul>
        </div>
      </div>
    );
  }

  if (lesson.type === 'quiz') {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-purple-900">Knowledge Check</p>
            <p className="text-sm text-purple-700">{lesson.durationMinutes || 15} minutes &middot; 70% passing score</p>
          </div>
        </div>
        <p className="text-purple-800 mb-4">{lesson.description}</p>
        <div className="bg-white/60 rounded-lg p-4 text-sm text-purple-700">
          <p className="font-medium mb-2">Quiz Details:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Multiple choice and short answer questions</li>
            <li>Covers material from this module</li>
            <li>Unlimited retakes allowed</li>
            <li>Must pass to unlock next module</li>
          </ul>
        </div>
      </div>
    );
  }

  // Reading
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <BookOpen className="w-4 h-4" />
        <span>Reading &middot; Lesson {lesson.globalIndex + 1} of {allLessons.length}</span>
      </div>
      <div className="prose max-w-none">
        <p className="text-slate-700 text-lg leading-relaxed">{lesson.description}</p>
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-500 italic">
            Full lesson content available in the enrolled LMS. This preview shows the course structure and lesson descriptions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HVACClassroomPreview() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lesson = allLessons[currentLessonIndex];
  const config = typeConfig[lesson.type] || typeConfig.reading;
  const Icon = config.icon;

  const completedCount = completedIds.size;
  const progressPct = Math.round((completedCount / allLessons.length) * 100);

  const currentModule = course.modules[lesson.moduleIndex];

  const toggleComplete = () => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lesson.id)) {
        next.delete(lesson.id);
      } else {
        next.add(lesson.id);
      }
      return next;
    });
  };

  const goTo = (index: number) => {
    setCurrentLessonIndex(index);
    setSidebarOpen(false);
    setActiveTab('overview');
  };

  const moduleGroups = useMemo(() => {
    const groups: { module: (typeof course.modules)[0]; lessons: typeof allLessons; startIndex: number }[] = [];
    let idx = 0;
    for (const mod of course.modules) {
      groups.push({
        module: mod,
        lessons: allLessons.slice(idx, idx + mod.lessons.length),
        startIndex: idx,
      });
      idx += mod.lessons.length;
    }
    return groups;
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-brand-orange-500 text-white text-center py-1.5 text-sm font-medium">
        <GraduationCap className="w-4 h-4 inline mr-2" />
        Course Preview — This is how enrolled students experience the HVAC Technician program
        <Link href="/apply?program=hvac-technician" className="ml-3 underline hover:no-underline">
          Apply Now
        </Link>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-12 left-4 z-50 bg-white p-2.5 rounded-lg shadow-lg"
        aria-label="Toggle lesson list"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 w-80 bg-white border-r overflow-y-auto transition-transform duration-300 fixed md:relative h-full z-40 pt-10`}
      >
        <div className="p-5 border-b">
          <Link
            href="/programs/hvac-technician"
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold mb-3 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Program
          </Link>
          <h2 className="font-bold text-lg text-slate-900">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>{completedCount} of {allLessons.length} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="p-3" aria-label="Course lessons">
          {moduleGroups.map((group, gi) => (
            <div key={group.module.id} className="mb-4">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Module {gi + 1}: {group.module.title}
              </div>
              {group.lessons.map((l) => {
                const isActive = l.globalIndex === currentLessonIndex;
                const isDone = completedIds.has(l.id);
                const LIcon = typeConfig[l.type]?.icon || FileText;
                return (
                  <button
                    key={l.id}
                    onClick={() => goTo(l.globalIndex)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition text-left ${
                      isActive
                        ? 'bg-brand-blue-50 border-l-4 border-brand-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone
                          ? 'bg-brand-green-100 text-brand-green-600'
                          : isActive
                            ? 'bg-brand-blue-100 text-brand-blue-600'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <LIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm truncate ${
                          isActive ? 'font-semibold text-brand-blue-900' : isDone ? 'text-slate-500' : 'text-slate-800'
                        }`}
                      >
                        {l.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {l.durationMinutes ? `${l.durationMinutes}m` : '~15m'} &middot; {l.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-10">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <span>Module {lesson.moduleIndex + 1}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="truncate">{currentModule.title}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Lesson {lesson.lessonIndex + 1}</span>
          </div>

          {/* Lesson Content */}
          <div className="mb-6">
            {getLessonContent(lesson)}
          </div>

          {/* Title + Mark Complete */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
                {lesson.durationMinutes && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.durationMinutes} min
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{lesson.title}</h1>
            </div>
            <button
              onClick={toggleComplete}
              className={`px-6 py-3 rounded-lg font-semibold transition flex-shrink-0 ${
                completedIds.has(lesson.id)
                  ? 'bg-brand-green-100 text-brand-green-700 border-2 border-brand-green-600'
                  : 'bg-brand-green-600 hover:bg-brand-green-700 text-white'
              }`}
            >
              {completedIds.has(lesson.id) ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Completed
                </span>
              ) : (
                'Mark as Complete'
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview', icon: BookOpen },
                { key: 'resources', label: 'Resources', icon: FileText },
                { key: 'notes', label: 'Notes', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 font-semibold whitespace-nowrap flex items-center gap-2 text-sm ${
                    activeTab === tab.key
                      ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'overview' && (
              <div className="prose max-w-none">
                <p className="text-slate-700 text-lg leading-relaxed">{lesson.description}</p>
                <div className="mt-6 grid sm:grid-cols-2 gap-4 not-prose">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Module</p>
                    <p className="text-sm font-semibold text-slate-800">{currentModule.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{currentModule.description}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Credentials Earned</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {course.outcomes.slice(0, 3).map((o, i) => (
                        <span key={i} className="text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded">
                          {o.replace(/^(Pass|Earn|Complete) /, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-brand-blue-300 transition cursor-pointer">
                  <Download className="w-5 h-5 text-brand-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Lesson Worksheet</p>
                    <p className="text-xs text-slate-500">PDF — Available after enrollment</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-brand-blue-300 transition cursor-pointer">
                  <Download className="w-5 h-5 text-brand-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Study Guide</p>
                    <p className="text-xs text-slate-500">PDF — Available after enrollment</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Downloadable resources are available to enrolled students.
                </p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <textarea
                  className="w-full h-40 border border-slate-200 rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Take notes on this lesson... (preview mode — notes are saved in the enrolled LMS)"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Notes are saved per-lesson in the enrolled LMS with your Digital Binder.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 pb-12">
            <button
              onClick={() => currentLessonIndex > 0 && goTo(currentLessonIndex - 1)}
              disabled={currentLessonIndex === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                currentLessonIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-sm text-slate-400">
              {currentLessonIndex + 1} / {allLessons.length}
            </span>
            <button
              onClick={() => currentLessonIndex < allLessons.length - 1 && goTo(currentLessonIndex + 1)}
              disabled={currentLessonIndex === allLessons.length - 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                currentLessonIndex === allLessons.length - 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
