'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Video, 
  Mic, 
  Sparkles, 
  Play, 
  CheckCircle, 
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  Eye,
  Save,
  Wand2,
  FileText,
  List
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  sort_order: number;
  is_preview: boolean;
  video_url?: string;
  script?: string;
  status: 'pending' | 'script_ready' | 'generating' | 'complete';
}

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  modules: Module[];
}

export default function CreateCourseContentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('professional');
  const [voiceStyle, setVoiceStyle] = useState('alloy');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/career-courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async () => {
    if (!selectedModule) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: selectedCourse?.title,
          moduleTitle: selectedModule.title,
          moduleDescription: selectedModule.description,
          duration: selectedModule.duration_minutes,
        }),
      });

      const data = await res.json();
      setScript(data.script || '');
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!selectedModule || !script) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/ai-studio/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: script,
          duration: selectedModule.duration_minutes * 60,
          style: avatarStyle,
          voice: voiceStyle,
          moduleId: selectedModule.id,
          courseId: selectedCourse?.id,
        }),
      });

      const data = await res.json();
      
      if (data.videoUrl) {
        // Update module with video URL
        await fetch(`/api/admin/career-courses/modules/${selectedModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: data.videoUrl }),
        });

        // Refresh courses
        fetchCourses();
      }
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setGenerating(false);
    }
  };

  const saveScript = async () => {
    if (!selectedModule) return;

    try {
      await fetch(`/api/admin/career-courses/modules/${selectedModule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      alert('Script saved!');
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Create" }]} />
      </div>
{/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Course Content Creator</h1>
                <p className="text-sm text-gray-600">Create video lessons with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm text-blue-600">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Course & Module Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <List className="w-5 h-5" />
                Courses & Modules
              </h2>

              {courses.length === 0 ? (
                <p className="text-sm text-gray-500">No courses found. Create courses in the database first.</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id}>
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setSelectedModule(null);
                          setScript('');
                        }}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          selectedCourse?.id === course.id
                            ? 'bg-blue-100 border-blue-300 border'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.modules?.length || 0} modules</p>
                      </button>

                      {selectedCourse?.id === course.id && course.modules && (
                        <div className="mt-2 ml-2 space-y-1">
                          {course.modules
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((module) => (
                              <button
                                key={module.id}
                                onClick={() => {
                                  setSelectedModule(module);
                                  setScript(module.script || '');
                                }}
                                className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                                  selectedModule?.id === module.id
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {module.video_url ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                )}
                                <span className="truncate">{module.title}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Creation Area */}
          <div className="lg:col-span-3">
            {!selectedModule ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Module</h3>
                <p className="text-gray-600">Choose a course and module from the left to start creating content.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Module Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedModule.title}</h2>
                      <p className="text-gray-600">{selectedModule.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {selectedModule.duration_minutes} min
                    </div>
                  </div>

                  {selectedModule.video_url && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">Video Generated</p>
                        <p className="text-sm text-green-700">This module has a video ready.</p>
                      </div>
                      <a
                        href={selectedModule.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </a>
                    </div>
                  )}
                </div>

                {/* Step 1: Generate Script */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Generate or Write Script</h3>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={generateScript}
                      disabled={generating}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      Generate Script with AI
                    </button>
                  </div>

                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Write or generate your video script here..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />

                  <div className="flex justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      {script.split(' ').length} words • ~{Math.ceil(script.split(' ').length / 150)} min read
                    </p>
                    <button
                      onClick={saveScript}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Script
                    </button>
                  </div>
                </div>

                {/* Step 2: Configure Video */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Configure Video Settings</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avatar Style
                      </label>
                      <select
                        value={avatarStyle}
                        onChange={(e) => setAvatarStyle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="professional">Professional Instructor</option>
                        <option value="casual">Casual Presenter</option>
                        <option value="corporate">Corporate Executive</option>
                        <option value="friendly">Friendly Coach</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice Style
                      </label>
                      <select
                        value={voiceStyle}
                        onChange={(e) => setVoiceStyle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="alloy">Alloy (Neutral)</option>
                        <option value="echo">Echo (Male)</option>
                        <option value="fable">Fable (British)</option>
                        <option value="onyx">Onyx (Deep Male)</option>
                        <option value="nova">Nova (Female)</option>
                        <option value="shimmer">Shimmer (Soft Female)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 3: Generate Video */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Generate Video</h3>
                  </div>

                  <p className="text-gray-600 mb-4">
                    Once your script is ready, click below to generate the AI avatar video. This may take a few minutes.
                  </p>

                  <button
                    onClick={generateVideo}
                    disabled={generating || !script.trim()}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        Generate AI Video
                      </>
                    )}
                  </button>

                  {!script.trim() && (
                    <p className="text-sm text-amber-600 mt-2">
                      Please write or generate a script first.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
