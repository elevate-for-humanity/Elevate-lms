'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  ArrowLeft,
  Upload,
} from 'lucide-react';

const positions = [
  { id: 'body-sculpting-tech', name: 'Body Sculpting Technician' },
  { id: 'esthetician', name: 'Licensed Esthetician' },
  { id: 'wellness-consultant', name: 'Wellness Consultant' },
  { id: 'apprentice', name: 'Esthetician Apprentice' },
];

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const positionParam = searchParams.get('position') || '';
  
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: positionParam,
    experience: '',
    license: '',
    elevateGraduate: '',
    availability: '',
    coverLetter: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to an API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to Curvature Body Sculpting. We'll review your application 
            and contact you at <strong>{formData.email}</strong> within 3-5 business days.
          </p>
          <Link
            href="/curvature-body-sculpting/careers"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/curvature-body-sculpting/careers" className="text-pink-200 hover:text-white text-sm mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Careers
          </Link>
          <h1 className="text-3xl font-bold">Apply Now</h1>
          <p className="text-pink-100 mt-2">Join the Curvature Body Sculpting team</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Applying For *
              </label>
              <select
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a position</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select experience level</option>
                <option value="none">No experience (willing to learn)</option>
                <option value="0-1">Less than 1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Do you have an Esthetician License?
              </label>
              <select
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select</option>
                <option value="yes">Yes, I have a valid license</option>
                <option value="in-progress">Currently in school/training</option>
                <option value="no">No, but interested in training</option>
              </select>
            </div>

            {/* Elevate Graduate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Are you an Elevate for Humanity graduate or student?
              </label>
              <select
                value={formData.elevateGraduate}
                onChange={(e) => setFormData({ ...formData, elevateGraduate: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select</option>
                <option value="graduate">Yes, I'm a graduate</option>
                <option value="current">Yes, I'm currently enrolled</option>
                <option value="interested">No, but interested in their programs</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability *
              </label>
              <select
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select availability</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tell us about yourself
              </label>
              <textarea
                rows={4}
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                placeholder="Why are you interested in this position? What makes you a great fit?"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Resume Upload Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop your resume or{' '}
                  <span className="text-purple-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX up to 5MB</p>
              </div>
            </div>

            {/* Elevate Training CTA */}
            {formData.license === 'no' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Need training?</strong> Elevate for Humanity offers FREE esthetician 
                  training through WIOA funding.{' '}
                  <Link href="/programs/esthetician-apprenticeship" className="underline font-medium">
                    Learn more →
                  </Link>
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition"
            >
              Submit Application
            </button>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you agree to our privacy policy and consent to be contacted about employment opportunities.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
