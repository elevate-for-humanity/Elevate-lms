'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, Users, MapPin, Clock, DollarSign,
  CheckCircle, ChevronRight, Building, ArrowLeft
} from 'lucide-react';

const industries = [
  'Healthcare',
  'Skilled Trades',
  'Transportation/Logistics',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Technology',
  'Construction',
  'Other',
];

const positionTypes = [
  { id: 'full-time', label: 'Full-time', description: '40+ hours/week' },
  { id: 'part-time', label: 'Part-time', description: 'Less than 40 hours/week' },
  { id: 'contract', label: 'Contract', description: 'Fixed-term employment' },
  { id: 'apprentice', label: 'Apprenticeship', description: 'Training + employment' },
];

const hiringTimelines = [
  { id: 'immediate', label: 'Immediately', description: 'Ready to hire now' },
  { id: '1-month', label: 'Within 1 month', description: 'Actively recruiting' },
  { id: '3-months', label: 'Within 3 months', description: 'Planning ahead' },
  { id: 'ongoing', label: 'Ongoing needs', description: 'Continuous hiring' },
];

export default function HiringNeedsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    industry: '',
    positionTypes: [] as string[],
    positionsCount: '',
    timeline: '',
    locations: '',
    salaryRange: '',
    benefits: [] as string[],
    additionalInfo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePositionTypeToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      positionTypes: prev.positionTypes.includes(id)
        ? prev.positionTypes.filter(t => t !== id)
        : [...prev.positionTypes, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to next step
    router.push('/onboarding/employer?step=portal-access');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding' },
            { label: 'Employer', href: '/onboarding/employer' },
            { label: 'Hiring Needs' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link 
            href="/onboarding/employer" 
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tell Us About Your Hiring Needs</h1>
              <p className="text-blue-100 mt-1">
                Help us match you with qualified candidates from our programs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Industry */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Industry
            </h2>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select your industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Position Types */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Position Types
            </h2>
            <p className="text-gray-600 text-sm mb-4">Select all that apply</p>
            <div className="grid md:grid-cols-2 gap-4">
              {positionTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handlePositionTypeToggle(type.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.positionTypes.includes(type.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                    {formData.positionTypes.includes(type.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Positions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              How Many Positions?
            </h2>
            <select
              value={formData.positionsCount}
              onChange={(e) => setFormData({ ...formData, positionsCount: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select number of positions</option>
              <option value="1-5">1-5 positions</option>
              <option value="6-10">6-10 positions</option>
              <option value="11-25">11-25 positions</option>
              <option value="26-50">26-50 positions</option>
              <option value="50+">50+ positions</option>
            </select>
          </div>

          {/* Hiring Timeline */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Hiring Timeline
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {hiringTimelines.map(timeline => (
                <button
                  key={timeline.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, timeline: timeline.id })}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.timeline === timeline.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{timeline.label}</div>
                      <div className="text-sm text-gray-500">{timeline.description}</div>
                    </div>
                    {formData.timeline === timeline.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Work Location(s)
            </h2>
            <input
              type="text"
              value={formData.locations}
              onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
              placeholder="e.g., Indianapolis, IN; Remote; Multiple locations"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Salary Range */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Salary Range (Optional)
            </h2>
            <select
              value={formData.salaryRange}
              onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Prefer not to say</option>
              <option value="under-30k">Under $30,000/year</option>
              <option value="30k-40k">$30,000 - $40,000/year</option>
              <option value="40k-50k">$40,000 - $50,000/year</option>
              <option value="50k-60k">$50,000 - $60,000/year</option>
              <option value="60k-75k">$60,000 - $75,000/year</option>
              <option value="75k+">$75,000+/year</option>
              <option value="hourly">Hourly (varies)</option>
            </select>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Tell us more about your ideal candidates, specific skills needed, or any other requirements..."
              rows={4}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              href="/onboarding/employer"
              className="px-6 py-3 text-gray-600 hover:text-gray-900"
            >
              Save & Exit
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
