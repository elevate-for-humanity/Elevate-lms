'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Play, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';

export default function CoursePreviewPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data: courseData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    const { data: lessonsData } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number');

    if (courseData) setCourse(courseData);
    if (lessonsData) {
      setLessons(lessonsData);
      if (lessonsData.length > 0) setActiveLesson(lessonsData[0]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Course not found</p>
      </div>
    );
  }

  const isVideo = activeLesson?.video_url && !activeLesson.video_url.endsWith('.mp3');
  const isAudio = activeLesson?.video_url?.endsWith('.mp3');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-brand-blue-400 text-sm font-medium">Course Preview</p>
            <h1 className="text-xl font-bold">{course.title || course.course_name}</h1>
          </div>
          <span className="bg-brand-blue-600/20 text-brand-blue-400 px-3 py-1 rounded-full text-sm">
            {lessons.length} Lessons
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-0">
        {/* Sidebar */}
        <aside className="lg:w-80 bg-slate-900/50 border-r border-slate-800 lg:min-h-[calc(100vh-73px)]">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Lessons</h2>
            <nav className="space-y-1">
              {lessons.map((lesson, i) => {
                const isActive = activeLesson?.id === lesson.id;
                const hasVideo = lesson.video_url && !lesson.video_url.endsWith('.mp3');
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition ${
                      isActive
                        ? 'bg-brand-blue-600/20 text-brand-blue-400 border border-brand-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-brand-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {hasVideo ? '🎬 Video' : '🎧 Audio'} · {lesson.duration_minutes || 60} min
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {activeLesson && (
            <>
              {/* Video/Audio Player */}
              {isVideo ? (
                <div className="bg-black rounded-xl overflow-hidden aspect-video mb-6">
                  <video
                    key={activeLesson.id}
                    src={activeLesson.video_url}
                    controls
                    playsInline
                    controlsList="nodownload"
                    className="w-full h-full"
                  />
                </div>
              ) : isAudio ? (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl py-12 px-6 mb-6">
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-brand-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-brand-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{activeLesson.title}</h3>
                    <p className="text-slate-400 text-sm mb-6">Listen to the audio lesson</p>
                    <audio
                      key={activeLesson.id}
                      src={activeLesson.video_url}
                      controls
                      className="w-full max-w-md mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-xl py-12 px-6 mb-6 text-center">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No media for this lesson</p>
                </div>
              )}

              {/* Lesson info */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-2">{activeLesson.title}</h2>
                <p className="text-slate-400 mb-4">
                  Lesson {lessons.findIndex((l: any) => l.id === activeLesson.id) + 1} of {lessons.length}
                </p>

                {activeLesson.content && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed">{activeLesson.content}</p>
                  </div>
                )}

                {activeLesson.topics && activeLesson.topics.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeLesson.topics.map((topic: string, i: number) => (
                        <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                {lessons.findIndex((l: any) => l.id === activeLesson.id) > 0 ? (
                  <button
                    onClick={() => {
                      const idx = lessons.findIndex((l: any) => l.id === activeLesson.id);
                      setActiveLesson(lessons[idx - 1]);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition"
                  >
                    ← Previous Lesson
                  </button>
                ) : <div />}

                {lessons.findIndex((l: any) => l.id === activeLesson.id) < lessons.length - 1 ? (
                  <button
                    onClick={() => {
                      const idx = lessons.findIndex((l: any) => l.id === activeLesson.id);
                      setActiveLesson(lessons[idx + 1]);
                    }}
                    className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 rounded-lg text-sm transition"
                  >
                    Next Lesson →
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-brand-green-600/20 text-brand-green-400 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Course Complete
                  </span>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
