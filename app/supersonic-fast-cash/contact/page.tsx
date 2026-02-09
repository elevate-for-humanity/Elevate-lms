'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle } from 'lucide-react';



export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          interest: formData.subject,
          message: formData.message,
          source: 'supersonic-fast-cash',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to send message. Please contact us at (317) 314-3757.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Contact" }]} />
      </div>
{/* Hero Section */}
      <section className="bg-slate-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-black mb-6">Contact Us</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Get in touch with Supersonic Fast Cash. We're here to help with your tax preparation needs.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-blue-600 transition">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Phone</h3>
            <a href="tel:+13173143757" className="text-blue-600 hover:text-blue-800 font-semibold text-lg">
              (317) 314-3757
            </a>
            <p className="text-gray-600 mt-2 text-sm">Contact us for immediate assistance</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-blue-600 transition">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Email</h3>
            <a href="mailto:Supersonicfastcashllc@gmail.com" className="text-blue-600 hover:text-blue-800 font-semibold break-all">
              Supersonicfastcashllc@gmail.com
            </a>
            <p className="text-gray-600 mt-2 text-sm">Email us anytime</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-blue-600 transition">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Location</h3>
            <p className="text-gray-700 font-semibold">Indianapolis, IN</p>
            <p className="text-gray-600 mt-2 text-sm">Multiple locations available</p>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-slate-700 rounded-2xl p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-black">Business Hours</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-black mb-3">Tax Season (January - April)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="font-semibold">9:00 AM - 8:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-semibold">9:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-semibold">10:00 AM - 4:00 PM</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3">Off-Season (May - December)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="font-semibold">10:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-semibold">By Appointment</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-semibold">Closed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-black">Send Us a Message</h2>
            </div>

            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-black mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-black mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-black mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-black mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">Select a subject</option>
                    <option value="tax-prep">Tax Preparation</option>
                    <option value="refund-advance">Refund Advance</option>
                    <option value="appointment">Schedule Appointment</option>
                    <option value="pricing">Pricing Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-black mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-8 text-center">Ready to Get Started?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl p-6 hover:bg-white/20 transition text-center"
            >
              <h3 className="text-xl font-bold mb-2">Book Appointment</h3>
              <p className="text-white/90 text-sm">Schedule your tax preparation appointment</p>
            </Link>
            <Link
              href="/supersonic-fast-cash/calculator"
              className="bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl p-6 hover:bg-white/20 transition text-center"
            >
              <h3 className="text-xl font-bold mb-2">Estimate Refund</h3>
              <p className="text-white/90 text-sm">Calculate your potential tax refund</p>
            </Link>
            <Link
              href="/supersonic-fast-cash/locations"
              className="bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl p-6 hover:bg-white/20 transition text-center"
            >
              <h3 className="text-xl font-bold mb-2">Find Location</h3>
              <p className="text-white/90 text-sm">Find a Supersonic Fast Cash near you</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
