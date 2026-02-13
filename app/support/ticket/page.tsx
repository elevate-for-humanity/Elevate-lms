'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const categories = [
  { value: 'enrollment', label: 'Enrollment & Admissions' },
  { value: 'program', label: 'Programs & Courses' },
  { value: 'billing', label: 'Billing & Financial Aid' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'general', label: 'General Question' },
  { value: 'urgent', label: 'Urgent Issue' },
];

const priorities = [
  { value: 'low', label: 'Low - General inquiry' },
  { value: 'medium', label: 'Medium - Need help soon' },
  { value: 'high', label: 'High - Affecting my training' },
  { value: 'urgent', label: 'Urgent - Critical issue' },
];



function SubmitTicketContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'general';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: initialCategory,
    priority: 'medium',
    subject: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setSuccess(true);
      setTicketNumber(data.ticket.ticket_number);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">Ticket Submitted!</h1>
            <p className="text-gray-600 mb-2">Your ticket number is:</p>
            <p className="text-2xl font-mono font-bold text-blue-600 mb-6">{ticketNumber}</p>
            <p className="text-gray-600 mb-8">
              We've received your request and will respond within 24-48 hours. 
              A confirmation email has been sent to {formData.email}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Back to Support Center
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support Center
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-black mb-2">Submit a Support Ticket</h1>
          <p className="text-gray-600 mb-8">
            Fill out the form below and our team will get back to you within 24-48 hours.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="your.email@gmail.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="(317) 555-0123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                {priorities.map((pri) => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Brief summary of your issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                minLength={20}
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black resize-none"
                placeholder="Please describe your issue in detail. Include any relevant information such as error messages, steps you've already tried, or specific questions you have."
              />
              <p className="text-sm text-gray-500 mt-1">Minimum 20 characters</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Need immediate help? Contact us at{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 font-semibold hover:underline">
                (317) 314-3757
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Support", href: "/support" }, { label: "Ticket" }]} />
      </div>
<Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );
}

export default function SubmitTicketPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubmitTicketContent />
    </Suspense>
  );
}
