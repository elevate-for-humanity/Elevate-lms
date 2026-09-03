'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';

const PRODUCT_NAMES: Record<string, string> = {
  'ai-instructor-pack': 'AI Instructor Pack',
  'ai-tutor-license': 'AI Tutor License',
  'grants-gov-navigator': 'Grants.gov Navigator',
  'capital-readiness-guide': 'Elevate Capital Readiness Guide',
  'tax-toolkit': 'Start a Tax Business Toolkit',
  'grant-guide': 'Grant Readiness Guide',
  'workforce-compliance': 'Workforce Compliance Checklist',
  'community-hub-license': 'Community Hub License',
  'crm-hub-license': 'CRM Hub License',
};

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get('product');
    const course = params.get('course');
    const topic = params.get('topic');
    if (product) {
      const productName = PRODUCT_NAMES[product] || product.replaceAll('-', ' ');
      setSubject('other');
      setMessage(`I would like availability, delivery, and pricing information for ${productName}.`);
    } else if (course) {
      const courseName = course.replaceAll('-', ' ');
      setSubject('enrollment');
      setMessage(`I would like current availability, credential details, access period, and final pricing for ${courseName}.`);
    } else if (topic) {
      setSubject(topic === 'platform-licensing' ? 'employer-partnership' : 'other');
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        role: form.get('role'),
        program: form.get('subject'),
        message: form.get('message'),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      setError(data?.error || 'Your message could not be sent. Please call (317) 314-3757.');
      setStatus('error');
      return;
    }

    setStatus('success');
    event.currentTarget.reset();
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-900" role="status">
        <h3 className="text-xl font-bold">Message received</h3>
        <p className="mt-2">Thank you. Our team will review your request and follow up using the email you provided.</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
        <input type="text" id="name" name="name" required minLength={2} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors" placeholder="Enter your full name" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
        <input type="email" id="email" name="email" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors" placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">I am a...</label>
        <select id="role" name="role" required defaultValue="" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors">
          <option value="">Select your role</option>
          <option value="job-seeker">Job Seeker / Career Changer</option>
          <option value="student">Current Student</option>
          <option value="graduate">Program Graduate</option>
          <option value="employer">Employer / Business Owner</option>
          <option value="agency">Workforce Agency Staff</option>
          <option value="training-partner">Training Provider / School</option>
          <option value="government">Government / Policy</option>
          <option value="media">Media / Press</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">How Can We Help?</label>
        <select id="subject" name="subject" required value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors">
          <option value="">Select a topic</option>
          <option value="enrollment">Program Enrollment & Eligibility</option>
          <option value="funding">WIOA / Funding Questions</option>
          <option value="apprenticeship">Apprenticeship Opportunities</option>
          <option value="employer-partnership">Employer Partnership Inquiry</option>
          <option value="host-shop">Host Shop / Training Site</option>
          <option value="job-placement">Job Placement Services</option>
          <option value="technical">Technical Support</option>
          <option value="feedback">Program Feedback</option>
          <option value="media">Media / Press Inquiry</option>
          <option value="other">Product or Other Inquiry</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
        <textarea id="message" name="message" rows={5} required minLength={10} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors resize-none" placeholder="Tell us about your goals, questions, or how we can support you..." />
      </div>
      {status === 'error' && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button type="submit" disabled={status === 'sending'} className="w-full bg-brand-orange-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-brand-orange-700 disabled:cursor-wait disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
        <MessageSquare className="w-5 h-5" />
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
