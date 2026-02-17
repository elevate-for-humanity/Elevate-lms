'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Video, ArrowLeft, Send } from 'lucide-react';
import { ROUTES } from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';



export default function SchedulePage() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    role: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Meet URL for demos
  const meetUrl = process.env.NEXT_PUBLIC_GOOGLE_MEET_URL || 'https://meet.google.com/bbu-sojc-qkg';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'demo-schedule',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Non-blocking - continue even if storage fails
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Schedule' }]} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-lg font-bold text-slate-900 hover:text-brand-orange-600 transition">
              Elevate for Humanity
            </Link>
            <Link href={ROUTES.license} className="text-slate-600 hover:text-brand-orange-600 transition flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Licensing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-brand-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Schedule a Live Demo</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We'll walk you through the LMS, workforce workflows, and licensing options in a live session. Demos are hosted via Google Meet.
            </p>
          </div>

          {/* Form + Join Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {!submitted ? (
              <>
                {/* Optional Info Form */}
                <div className="p-8 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Tell us about yourself (optional)</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition"
                          placeholder="Your name" />
                      </div>
                      <div>
                        <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                        <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition"
                          placeholder="Your organization" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition"
                          placeholder="you@organization.com" />
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition">
                          <option value="">Select your role</option>
                          <option value="executive">Executive / Director</option>
                          <option value="program-manager">Program Manager</option>
                          <option value="it-admin">IT / Administrator</option>
                          <option value="employer">Employer Partner</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50">
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Saving...' : 'Save & Continue'}
                    </button>
                  </form>
                </div>

                {/* Join Demo Section */}
                <div className="p-8 bg-slate-50">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Ready to join?</h2>
                  {meetUrl ? (
                    <a href={meetUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-orange-700 transition text-lg">
                      <Video className="w-6 h-6" />
                      Join Demo via Google Meet
                    </a>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800">
                        Demo link is being prepared. Please <Link href="/contact" className="underline font-medium">contact us</Link> to schedule.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mt-4">You can join the demo now or wait for a follow-up email.</p>
                </div>
              </>
            ) : (
              /* Post-Submit View */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Thanks! You're all set.</h2>
                <p className="text-slate-600 mb-8">You can join the demo now or wait for a follow-up.</p>
                {meetUrl ? (
                  <a href={meetUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-orange-700 transition text-lg">
                    <Video className="w-6 h-6" />
                    Join Demo via Google Meet
                  </a>
                ) : (
                  <p className="text-slate-600">We'll be in touch shortly to schedule your demo.</p>
                )}
              </div>
            )}
          </div>

          {/* What to Expect */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 text-center">What to expect in your demo</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Learner Experience</h4>
                <p className="text-sm text-slate-600">See how participants navigate programs and track progress</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-green-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Admin Dashboard</h4>
                <p className="text-sm text-slate-600">Manage programs, enrollments, and reporting</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Employer Portal</h4>
                <p className="text-sm text-slate-600">Connect with candidates and manage hiring pipelines</p>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link href={ROUTES.demo} className="text-brand-orange-600 hover:text-brand-orange-700 font-medium">
              Or explore the demo pages on your own →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Elevate for Humanity. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
