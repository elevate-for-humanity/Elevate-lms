"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CourseOutline {
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'discussion';
  content: string;
  duration: number;
  objectives: string[];
}

export default function AutomaticCourseBuilder() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Log course generation to DB
  const logCourseGeneration = async (status: 'started' | 'completed' | 'failed', courseData?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('ai_course_generation_log')
      .insert({
        user_id: user?.id,
        prompt,
        status,
        course_outline: courseData,
        generated_at: new Date().toISOString()
      });
  };

  const generateCourse = async () => {
    if (!prompt.trim()) {
      alert('Please enter a course topic or description');
      return;
    }

    await logCourseGeneration('started');
    setGenerating(true);
    setProgress(0);
    setCurrentStep('Analyzing your request...');

    try {
      // Step 1: Generate course outline
      setProgress(20);
      setCurrentStep('Creating course structure...');

      const outlineResponse = await fetch('/api/ai/generate-course-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!outlineResponse.ok) throw new Error('Failed to generate outline');
      const courseOutline: CourseOutline = await outlineResponse.json();
      setOutline(courseOutline);

      // Step 2: Generate module content
      setProgress(40);
      setCurrentStep('Generating module content...');

      for (let i = 0; i < courseOutline.modules.length; i++) {
        setProgress(40 + (i / courseOutline.modules.length) * 30);
        setCurrentStep(`Creating module ${i + 1} of ${courseOutline.modules.length}...`);

        const moduleResponse = await fetch('/api/ai/generate-module-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseTitle: courseOutline.title,
            moduleTitle: courseOutline.modules[i].title,
            moduleDescription: courseOutline.modules[i].description,
          }),
        });

        if (moduleResponse.ok) {
          const moduleContent = await moduleResponse.json();
          courseOutline.modules[i].lessons = moduleContent.lessons;
        }
      }

      // Step 3: Generate assessments
      setProgress(70);
      setCurrentStep('Creating quizzes and assessments...');

      const assessmentResponse = await fetch('/api/ai/generate-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOutline }),
      });

      if (assessmentResponse.ok) {
        const assessments = await assessmentResponse.json();
        // Add assessments to modules
        courseOutline.modules.forEach((module, index) => {
          if (assessments[index]) {
            module.lessons.push(assessments[index]);
          }
        });
      }

      // Step 4: Generate video scripts
      setProgress(85);
      setCurrentStep('Creating video scripts...');

      const scriptsResponse = await fetch('/api/ai/generate-video-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOutline }),
      });

      if (scriptsResponse.ok) {
        const scripts = await scriptsResponse.json();
        // Attach scripts to video lessons
        courseOutline.modules.forEach((module) => {
          module.lessons.forEach((lesson) => {
            if (lesson.type === 'video' && scripts[lesson.id]) {
              lesson.content = scripts[lesson.id];
            }
          });
        });
      }

      // Step 5: Finalize and save
      setProgress(95);
      setCurrentStep('Finalizing course...');

      // Generate slug from title
      const slug = courseOutline.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const saveResponse = await fetch('/api/admin/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: courseOutline.title,
          description: courseOutline.description || '',
          modules: courseOutline.modules || [],
        }),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save course');
      }
      const savedCourse = await saveResponse.json();

      setProgress(100);
      setCurrentStep('Course created successfully!');
      setShowPreview(true);

      // Redirect to course editor after 2 seconds
      setTimeout(() => {
        router.push(`/admin/courses/${savedCourse.id}/edit`);
      }, 2000);

    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to generate course. Please try again.');
      setGenerating(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const examplePrompts = [
    'Create a comprehensive HVAC technician training course covering basics to advanced troubleshooting',
    'Build a CNA certification prep course with clinical skills and exam preparation',
    'Design a CDL training program with safety, regulations, and practical driving skills',
    'Develop a barber apprenticeship course with cutting techniques and business management',
    'Create a medical assistant training program with clinical and administrative skills',
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2 text-2xl md:text-3xl lg:text-4xl">
          AI Course Builder
        </h1>
        <p className="text-lg text-black">
          Describe your course and let AI create a complete curriculum in minutes
        </p>
      </div>

      {/* Main Input */}
      {!generating && !showPreview && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <label className="block text-lg font-semibold text-black mb-4">
            What course would you like to create?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-lg"
            placeholder="Example: Create a comprehensive HVAC technician training course that covers system basics, installation, maintenance, troubleshooting, and EPA 608 certification preparation. Include hands-on exercises and real-world scenarios."
          />

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-black">
              Be specific about topics, skills, and learning outcomes you want to include
            </div>
            <button
              onClick={generateCourse}
              disabled={!prompt.trim()}
              className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Generate Course with AI
            </button>
          </div>
        </div>
      )}

      {/* Example Prompts */}
      {!generating && !showPreview && (
        <div className="bg-slate-50 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-black mb-4">Example Prompts:</h3>
          <div className="space-y-3">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="w-full text-left p-4 bg-white rounded-lg hover:bg-gray-50 hover:border-brand-blue-300 border-2 border-slate-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">{example}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {generating && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-brand-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Creating Your Course...
            </h2>
            <p className="text-lg text-black">{currentStep}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-black mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {[
              { step: 1, label: 'Analyzing request', progress: 20 },
              { step: 2, label: 'Creating structure', progress: 40 },
              { step: 3, label: 'Generating content', progress: 70 },
              { step: 4, label: 'Creating assessments', progress: 85 },
              { step: 5, label: 'Finalizing course', progress: 100 },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    progress >= item.progress
                      ? 'bg-brand-green-500 text-white'
                      : progress >= item.progress - 20
                      ? 'bg-brand-blue-500 text-white'
                      : 'bg-slate-200 text-black'
                  }`}
                >
                  {progress >= item.progress ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    item.step
                  )}
                </div>
                <span
                  className={`font-medium ${
                    progress >= item.progress - 20 ? 'text-black' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && outline && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-brand-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Course Created Successfully!
            </h2>
            <p className="text-lg text-black">
              Your course has been generated and saved. Redirecting to editor...
            </p>
          </div>

          {/* Course Summary */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold text-black mb-2">{outline.title}</h3>
            <p className="text-black mb-4">{outline.description}</p>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-black">{outline.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-black">{outline.modules.length} modules</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-black capitalize">{outline.level}</span>
              </div>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-4">
            {outline.modules.map((module, index) => (
              <div key={module.id} className="border-2 border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-brand-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-black mb-1">{module.title}</h4>
                    <p className="text-sm text-black mb-2">{module.description}</p>
                    <div className="text-xs text-slate-500">
                      {module.lessons.length} lessons • {module.duration} minutes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {!generating && !showPreview && (
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-black mb-2">Lightning Fast</h3>
            <p className="text-black text-sm">
              Generate complete courses in minutes, not weeks. AI creates structure, content, and assessments automatically.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-black mb-2">Industry Standards</h3>
            <p className="text-black text-sm">
              Courses follow best practices and include learning objectives, assessments, and proper sequencing.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-bold text-black mb-2">Fully Editable</h3>
            <p className="text-black text-sm">
              AI creates the foundation. You can edit, customize, and refine every aspect to match your needs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
