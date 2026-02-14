'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  Target,
  GraduationCap,
  FileText,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface GeneratedCourse {
  courseId: string;
  outline: {
    title: string;
    description: string;
    objectives: string[];
    estimatedDuration: number;
    modules: {
      title: string;
      description: string;
      lessons: { title: string }[];
    }[];
  };
}



export default function CourseGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<GeneratedCourse | null>(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    targetAudience: '',
    difficulty: 'intermediate',
    duration: 10,
    moduleCount: 5,
    includeQuizzes: true,
    includeAssignments: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      // Build the prompt from form data
      const prompt = `
Topic: ${formData.topic}
${formData.description ? `Description: ${formData.description}` : ''}
Target Audience: ${formData.targetAudience || 'General learners'}
Difficulty: ${formData.difficulty}
Duration: ${formData.duration} hours
Number of Modules: ${formData.moduleCount}
Include Quizzes: ${formData.includeQuizzes}
Include Assignments: ${formData.includeAssignments}
      `.trim();

      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'course',
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course');
      }

      // Transform the response to match our expected format
      const output = data.output;
      setSuccess({
        courseId: 'draft-' + Date.now(),
        outline: {
          title: output.title || formData.topic,
          description: output.description || output.summary || '',
          objectives: output.objectives || [],
          estimatedDuration: formData.duration,
          modules: (output.modules || []).map((m: any, i: number) => ({
            title: m.title || `Module ${i + 1}`,
            description: m.description || '',
            lessons: (m.lessons || []).map((l: any) => ({
              title: typeof l === 'string' ? l : l.title || 'Lesson',
            })),
          })),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Course Generator" }]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-brand-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Course Generator</h1>
          </div>
          <p className="text-gray-600">Generate complete courses with modules, lessons, and quizzes using AI</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-green-900 mb-2">Course Generated Successfully!</h2>
                <p className="text-green-700 mb-4">{success.outline.title}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{success.outline.modules.length} Modules</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <FileText className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{success.outline.modules.reduce((sum, m) => sum + m.lessons.length, 0)} Lessons</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{success.outline.estimatedDuration}h Duration</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => router.push(`/admin/courses/${success.courseId}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">View Course</button>
                  <button onClick={() => router.push(`/admin/courses/${success.courseId}/edit`)} className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50">Edit Course</button>
                  <button onClick={() => setSuccess(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Generate Another</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Course Topic *</label>
                <input type="text" required value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="e.g., HVAC Fundamentals, Medical Billing Basics, CDL Test Preparation" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Course Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Describe what students will learn and achieve..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Target Audience</label>
                <input type="text" value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="e.g., Career changers, Entry-level workers, Experienced professionals" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2"><Target className="w-4 h-4 inline mr-1" />Difficulty Level</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2"><Clock className="w-4 h-4 inline mr-1" />Duration (hours)</label>
                  <input type="number" min={1} max={100} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 10 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2"><BookOpen className="w-4 h-4 inline mr-1" />Number of Modules</label>
                  <input type="number" min={1} max={20} value={formData.moduleCount} onChange={(e) => setFormData({ ...formData, moduleCount: parseInt(e.target.value) || 5 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.includeQuizzes} onChange={(e) => setFormData({ ...formData, includeQuizzes: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Include Quizzes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.includeAssignments} onChange={(e) => setFormData({ ...formData, includeAssignments: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Include Assignments</span>
                </label>
              </div>

              <button type="submit" disabled={loading || !formData.topic} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Course... (this may take 30-60 seconds)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Course with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-brand-blue-900 mb-2 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            What Gets Generated
          </h3>
          <ul className="text-brand-blue-800 space-y-1 text-sm">
            <li>• Complete course structure with modules and lessons</li>
            <li>• Detailed lesson content in markdown format</li>
            <li>• Learning objectives for each module</li>
            <li>• Quizzes with multiple choice questions and explanations</li>
            <li>• Estimated duration for each lesson</li>
            <li>• Course saved as draft for review before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
