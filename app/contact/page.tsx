'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, Loader2 } from 'lucide-react';
import Turnstile from '@/components/Turnstile';


import FeedbackWidget from '@/components/FeedbackWidget';

const contactInfo = [
  { icon: Phone, title: 'Phone', value: 'Get Help Online', subtitle: 'Mon-Fri 8am-6pm EST', href: 'tel:support center' },
  { icon: Mail, title: 'Email', value: 'Use the form below', subtitle: 'We respond within 24 hours', href: '#contact-form' },
  { icon: MapPin, title: 'Address', value: 'Indianapolis, IN', subtitle: 'Central Indiana', href: null },
  { icon: Clock, title: 'Hours', value: 'Mon-Fri 8am-6pm', subtitle: 'Sat 9am-1pm EST', href: null },
];

export default function ContactPage() {
  const searchParams = useSearchParams();
  const prefillProgram = searchParams.get('program') || '';
  const prefillSubject = searchParams.get('subject') || '';
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
      <div className="relative h-[60vh] min-h-[400px] max-h-[720px] flex items-center justify-center">
        <Image
          src="/images/heroes-hq/contact-hero.jpg"
          alt="Contact Us"
          fill
          quality={90} className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center px-4">
            Contact Us
          </h1>
        </div>
      </div>

      {/* Avatar Guide */}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <info.icon className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{info.title}</h2>
              {info.href ? (
                <a href={info.href} className="text-brand-blue-600 hover:underline mt-1 block">{info.value}</a>
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
              <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-8 text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-4">
                  Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setFormState('idle')}
                  className="text-brand-blue-600 font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                {formState === 'error' && (
                  <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
                    <AlertCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-brand-red-700 text-sm">{errorMessage}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-brand-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      required
                      disabled={formState === 'submitting'}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-brand-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      required
                      disabled={formState === 'submitting'}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-brand-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      disabled={formState === 'submitting'}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-brand-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    required
                    disabled={formState === 'submitting'}
                    defaultValue={prefillSubject}
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
                    Message <span className="text-brand-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="How can we help you?"
                    defaultValue={prefillProgram ? `I'm interested in the ${prefillProgram.replace(/-/g, ' ')} program and would like more information.` : ''}
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
                  className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 disabled:bg-brand-blue-400 disabled:cursor-not-allowed transition-colors"
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
            {/* Schedule a Meeting */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule a Meeting</h2>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <p className="text-gray-600 mb-5">
                Pick a date and time that works for you. Once you submit, you and our team will receive a calendar invite with a Zoom link by email.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const date = fd.get('meetingDate') as string;
                  const time = fd.get('meetingTime') as string;
                  const name = fd.get('meetingName') as string;
                  const email = fd.get('meetingEmail') as string;
                  const topic = fd.get('meetingTopic') as string;

                  if (!date || !time || !name || !email) return;

                  // Create real Zoom meeting via API
                  try {
                    const res = await fetch('/api/schedule-consultation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name, email, appointment_type: topic || 'General inquiry',
                        appointment_date: date, appointment_time: time,
                      }),
                    });
                    const data = await res.json();
                    const zoomLink = data.meetingUrl || '';

                    const startDT = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
                    const endH = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
                    const endDT = `${date.replace(/-/g, '')}T${endH}${time.split(':')[1]}00`;
                    const details = `Meeting with ${name} (${email})%0A%0ATopic: ${encodeURIComponent(topic || 'General inquiry')}%0A%0AZoom Link: ${zoomLink}`;
                    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Elevate for Humanity — Meeting')}&dates=${startDT}/${endDT}&details=${details}&add=${encodeURIComponent(email)},${encodeURIComponent('info@elevateforhumanity.org')}&location=Zoom`;

                    window.open(calUrl, '_blank');
                  } catch {
                    alert('Failed to schedule meeting. Please call (317) 314-3757.');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="meetingName" className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-brand-red-500">*</span></label>
                  <input type="text" id="meetingName" name="meetingName" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                </div>
                <div>
                  <label htmlFor="meetingEmail" className="block text-sm font-medium text-gray-700 mb-1">Your Email <span className="text-brand-red-500">*</span></label>
                  <input type="email" id="meetingEmail" name="meetingEmail" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-brand-red-500">*</span></label>
                    <input type="date" id="meetingDate" name="meetingDate" required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-brand-red-500">*</span></label>
                    <select id="meetingTime" name="meetingTime" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                      <option value="">Select...</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="09:30">9:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="13:30">1:30 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="14:30">2:30 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="16:30">4:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="meetingTopic" className="block text-sm font-medium text-gray-700 mb-1">What do you need help with?</label>
                  <select id="meetingTopic" name="meetingTopic" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                    <option value="General inquiry">General inquiry</option>
                    <option value="Enrollment help">Enrollment help</option>
                    <option value="Funding and workforce grants">Funding and workforce grants</option>
                    <option value="Program information">Program information</option>
                    <option value="Employer partnership">Employer partnership</option>
                    <option value="Orientation">Orientation</option>
                    <option value="Career services">Career services</option>
                    <option value="Technical support">Technical support</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-red-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-red-700 transition-colors"
                >
                  Book Meeting via Google Calendar
                </button>
              </form>
            </div>

            {/* Zoom for Virtual Meetings */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Virtual Meetings via Zoom</h3>
              <p className="text-gray-600 mb-4">
                All scheduled meetings include a unique Zoom link sent to your email. Use the form above to book a meeting and you will receive your personal Zoom link automatically.
              </p>
              <p className="text-gray-500 text-sm">
                Questions? Call <a href="tel:+13173143757" className="text-brand-blue-600 font-medium hover:underline">(317) 314-3757</a>
              </p>
            </div>

            {/* Campus Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Elevate for Humanity</h3>
              <p className="text-gray-600">Indianapolis, Indiana</p>
              <p className="text-gray-600">Central Indiana Region</p>
              <p className="text-gray-600 mt-4">Multiple training locations available. In-person visits are by appointment only — use the calendar above to schedule.</p>
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

      {/* Email Contact */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
        <a
          href="/contact"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          <Mail className="w-5 h-5" />
          Email Us Directly
        </a>
      </div>

      {/* Feedback Widget */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FeedbackWidget userId="" />
      </div>
    </div>
  );
}
