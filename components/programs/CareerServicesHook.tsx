'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Users, Calendar, ArrowRight, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CareerServicesHookProps {
  programName: string;
  programSlug: string;
}

export function CareerServicesHook({ programName, programSlug }: CareerServicesHookProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const services = [
    {
      id: 'resume',
      icon: FileText,
      title: 'Resume Review',
      description: 'Get expert feedback on your resume to stand out to employers',
      href: '/career-services/resume-building',
      color: 'blue',
    },
    {
      id: 'employer',
      icon: Users,
      title: 'Employer Info Session',
      description: 'Learn about hiring partners and job opportunities',
      href: '/career-services/networking-events',
      color: 'green',
    },
    {
      id: 'placement',
      icon: Calendar,
      title: 'Job Placement Support',
      description: 'Connect with employers actively hiring program graduates',
      href: '/career-services/job-placement',
      color: 'purple',
    },
  ];

  const handleRequestService = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowModal(true);
  };

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert into customer_service_tickets table
      const { error: insertError } = await supabase
        .from('customer_service_tickets')
        .insert({
          user_id: user?.id || null,
          subject: `Career Services Request: ${services.find(s => s.id === selectedService)?.title}`,
          description: `
Program: ${programName}
Service Requested: ${services.find(s => s.id === selectedService)?.title}
Name: ${formData.get('name')}
Email: ${formData.get('email')}
Phone: ${formData.get('phone') || 'Not provided'}
Notes: ${formData.get('notes') || 'None'}
          `.trim(),
          category: 'career_services',
          priority: 'medium',
          status: 'open',
        });

      if (insertError) {
        console.error('Failed to submit request:', insertError);
        setError('Failed to submit request. Please try again or contact us directly.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setSelectedService(null);
      }, 2000);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('An error occurred. Please try again.');
    }
    
    setSubmitting(false);
  };

  return (
    <>
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Career Services</h3>
        <p className="text-slate-600 mb-6">
          Get support finding employment after completing {programName}
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => handleRequestService(service.id)}
                className={`text-left p-4 bg-white rounded-xl border-2 border-transparent hover:border-${service.color}-300 hover:shadow-md transition group`}
              >
                <div className={`w-10 h-10 bg-${service.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 text-${service.color}-600`} />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">{service.title}</h4>
                <p className="text-sm text-slate-500">{service.description}</p>
                <span className={`inline-flex items-center gap-1 text-sm text-${service.color}-600 mt-2 group-hover:gap-2 transition-all`}>
                  Request <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <Link
            href="/career-services"
            className="text-brand-blue-600 hover:text-brand-blue-700 font-medium inline-flex items-center gap-2"
          >
            View All Career Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
                <p className="text-slate-600">
                  Our career services team will contact you within 1-2 business days.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Request {services.find(s => s.id === selectedService)?.title}
                </h3>
                <p className="text-slate-600 mb-6">
                  Fill out this form and our career services team will reach out to schedule your session.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-center gap-2 text-brand-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="(317) 314-3757"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Program
                    </label>
                    <input
                      type="text"
                      name="program"
                      value={programName}
                      readOnly
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="Any specific questions or needs?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
