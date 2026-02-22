'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen, ArrowLeft, Save, Image as ImageIcon,
  Clock, DollarSign, Users, FileText, Plus, X,
  CheckCircle, ChevronRight, Loader2,
} from 'lucide-react';

const categories = [
  'Healthcare', 'Skilled Trades', 'Transportation',
  'Business', 'Technology', 'Professional Development', 'Other',
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    duration_weeks: '',
    tuition_cost: '',
    max_students: '',
    prerequisites: '',
    learning_outcomes: [''],
    is_active: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') } : {}),
    }));
  };

  const addOutcome = () => {
    setFormData(prev => ({ ...prev, learning_outcomes: [...prev.learning_outcomes, ''] }));
  };

  const removeOutcome = (index: number) => {
    setFormData(prev => ({ ...prev, learning_outcomes: prev.learning_outcomes.filter((_, i) => i !== index) }));
  };

  const updateOutcome = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, learning_outcomes: prev.learning_outcomes.map((o, i) => i === index ? value : o) }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/staff-portal/courses/create');
        return;
      }

      const { error: insertError } = await supabase.from('training_courses').insert({
        course_name: formData.name,
        slug: formData.slug || null,
        description: formData.description,
        category: formData.category,
        duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : null,
        tuition_cost: formData.tuition_cost ? parseFloat(formData.tuition_cost) : null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        prerequisites: formData.prerequisites || null,
        learning_outcomes: formData.learning_outcomes.filter(Boolean),
        is_active: isDraft ? false : formData.is_active,
        created_by: user.id,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/staff-portal/courses');
    } catch {
      setError('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Staff Portal', href: '/staff-portal' },
            { label: 'Courses', href: '/staff-portal/courses' },
            { label: 'Create Course' },
          ]} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/staff-portal/courses" className="inline-flex items-center gap-2 text-purple-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create New Course</h1>
              <p className="text-purple-100 mt-1">Set up a new training program or course</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">{error}</div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Basic Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  placeholder="e.g., Certified Nursing Assistant Training"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/courses/</span>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="cna-training"
                    className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required
                  placeholder="Describe what students will learn in this course..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" /> Course Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (weeks)</label>
                <input type="number" name="duration_weeks" value={formData.duration_weeks} onChange={handleChange} min="1" placeholder="e.g., 8"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Cost</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="number" name="tuition_cost" value={formData.tuition_cost} onChange={handleChange} min="0" step="0.01" placeholder="e.g., 2500"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                <input type="number" name="max_students" value={formData.max_students} onChange={handleChange} min="1" placeholder="e.g., 25"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                <input type="text" name="prerequisites" value={formData.prerequisites} onChange={handleChange}
                  placeholder="e.g., High school diploma, 18+ years"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" /> Learning Outcomes
            </h2>
            <p className="text-sm text-gray-600 mb-4">What will students be able to do after completing this course?</p>
            <div className="space-y-3">
              {formData.learning_outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={outcome} onChange={(e) => updateOutcome(index, e.target.value)}
                    placeholder={`Outcome ${index + 1}`}
                    className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  {formData.learning_outcomes.length > 1 && (
                    <button type="button" onClick={() => removeOutcome(index)} className="p-3 text-gray-400 hover:text-brand-red-500">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOutcome} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Another Outcome
              </button>
            </div>
          </div>

          {/* Publish Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Publish Settings</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <div>
                <div className="font-medium text-gray-900">Publish immediately</div>
                <div className="text-sm text-gray-500">Make this course visible to students right away</div>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/staff-portal/courses" className="px-6 py-3 text-gray-600 hover:text-gray-900">Cancel</Link>
            <div className="flex gap-4">
              <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50">
                Save as Draft
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSubmitting ? 'Creating...' : 'Create Course'}
                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
