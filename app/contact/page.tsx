'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';
import Turnstile from '@/components/Turnstile';
import CallTextButton from '@/components/CallTextButton';
import FeedbackWidget from '@/components/FeedbackWidget';

const contactInfo = [
  { icon: Phone, title: 'Phone', value: 'Get Help Online', subtitle: 'Mon-Fri 8am-6pm EST', href: 'tel:support center' },
  { icon: Mail, title: 'Email', value: 'elevate4humanityedu@gmail.com', subtitle: 'We respond within 24 hours', href: 'mailto:elevate4humanityedu@gmail.com' },
  { icon: MapPin, title: 'Address', value: 'Indianapolis, IN', subtitle: 'Central Indiana', href: null },
  { icon: Clock, title: 'Hours', value: 'Mon-Fri 8am-6pm', subtitle: 'Sat 9am-1pm EST', href: null },
];

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const data = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || '',
      message: formData.get('message') as string,
      role: formData.get('subject') as string,
      turnstileToken,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.ok) {
        setFormState('success');
        form.reset();
      } else {
        setFormState('error');
        setErrorMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setFormState('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Contact Us' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[35vh] sm:h-[40vh] min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
        <Image
          src="/images/heroes-hq/contact-hero.jpg"
          alt="Contact Us"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Contact Us</h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90">We&apos;re here to help you start your career journey</p>
        </div>
      </div>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/orientation-guide.mp4" 
        title="Contact Us" 
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <info.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{info.title}</h2>
              {info.href ? (
                <a href={info.href} className="text-blue-600 hover:underline mt-1 block">{info.value}</a>
              ) : (
                <p className="text-gray-900 mt-1">{info.value}</p>
              )}
              <p className="text-sm text-gray-500">{info.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            {formState === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-4">
                  Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setFormState('idle')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {formState === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formState === 'submitting'}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formState === 'submitting'}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formState === 'submitting'}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={formState === 'submitting'}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={formState === 'submitting'}
                  >
                    <option value="">Select a topic...</option>
                    <option value="enrollment">Enrollment Questions</option>
                    <option value="financial">Financial Aid</option>
                    <option value="programs">Program Information</option>
                    <option value="employer">Employer Partnership</option>
                    <option value="career">Career Services</option>
                    <option value="technical">Technical Support</option>
                    <option value="donation">Donation/Philanthropy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="How can we help you?"
                    required
                    minLength={10}
                    disabled={formState === 'submitting'}
                  />
                </div>
                
                {/* Turnstile CAPTCHA */}
                <Turnstile onVerify={setTurnstileToken} />
                
                <button
                  type="submit"
                  disabled={formState === 'submitting' || !turnstileToken}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {formState === 'submitting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Visit Our Campus</h2>
            <div className="relative rounded-xl h-80 overflow-hidden mb-6">
              <Image
                src="/images/misc/contact-map.jpg"
                alt="Campus"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Elevate for Humanity</h3>
              <p className="text-gray-600">Indianapolis, Indiana</p>
              <p className="text-gray-600">Central Indiana Region</p>
              <p className="text-gray-600 mt-4">Multiple training locations available</p>
              <div className="mt-4 pt-4 border-t">
                <a
                  href="/support"
                  className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  Call Get Help Online
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Contact FAQ</h2>
        <div className="space-y-4">
          {[
            { q: 'What are your office hours?', a: 'Our team is available Monday-Friday, 9am-5pm EST. You can leave a message anytime and we\'ll respond within 1-2 business days.' },
            { q: 'How quickly will I get a response?', a: 'We typically respond to inquiries within 1-2 business days. For urgent matters, please contact us directly at Get Help Online.' },
            { q: 'Can I visit your office in person?', a: 'Yes, but please schedule an appointment first. Training locations vary by program. Contact us to arrange a visit.' },
            { q: 'Who should I contact about enrollment?', a: 'For enrollment questions, select "Enrollment Questions" in the contact form or contact us directly. Our enrollment team will assist you.' },
            { q: 'How do I check my application status?', a: 'Log into your student dashboard to check status, or contact us with your name and the program you applied for.' },
            { q: 'I\'m an employer - who do I contact?', a: 'Select "Employer Partnership" in the contact form or email us directly. Our employer relations team will reach out to discuss partnership opportunities.' },
          ].map((faq, i) => (
            <details key={i} className="bg-slate-50 rounded-xl overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                {faq.q}
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Call/Text Button */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
        <CallTextButton variant="both" size="lg" />
      </div>

      {/* Feedback Widget */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FeedbackWidget userId="" />
      </div>
    </div>
  );
}
