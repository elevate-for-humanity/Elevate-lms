'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, DollarSign, Clock, CheckCircle } from 'lucide-react';



export default function CreatorNewCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    level: 'beginner'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const { courseId } = await response.json();
        setSuccess(true);
        setTimeout(() => router.push(`/creator/courses/${courseId}`), 2000);
      }
    } catch (error) { /* Error handled silently */ } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Course Created!</h2>
          <p className="text-black">Redirecting to course editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Creator", href: "/creator" }, { label: "New" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Create New Course</h1>
      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Introduction to Web Development"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (hours) *
              </label>
              <input
                type="number"
                required
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Price (USD) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="299.00"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="">Select category</option>
                <option value="healthcare">Healthcare</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="trades">Skilled Trades</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Level *
              </label>
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400 font-semibold transition"
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
