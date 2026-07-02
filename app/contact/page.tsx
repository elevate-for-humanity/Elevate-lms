import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Mail, Phone, MapPin, Clock, MessageSquare, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `Contact Us | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Get in touch with Elevate for Humanity. Contact us about workforce training, apprenticeships, employer partnerships, or student enrollment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/contact' },
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'info@elevateforhumanity.org',
      href: 'mailto:info@elevateforhumanity.org',
      description: 'Send us an email and we will respond within 24 hours.',
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '(317) XXX-XXXX',
      href: 'tel:+1317XXXXXXX',
      description: 'Mon-Fri, 8am-5pm EST',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: 'Indianapolis, Indiana',
      href: 'https://maps.google.com/?q=Indianapolis+IN',
      description: 'Multiple locations across Indiana',
    },
  ];

  const departments = [
    {
      title: 'Student Enrollment',
      email: 'enroll@elevateforhumanity.org',
      description: 'Questions about programs, applications, and enrollment',
    },
    {
      title: 'Employer Partnerships',
      email: 'employers@elevateforhumanity.org',
      description: 'Hiring trained workers or sponsoring apprenticeships',
    },
    {
      title: 'Funding Assistance',
      email: 'funding@elevateforhumanity.org',
      description: 'WIOA, Workforce Ready Grant, and other funding questions',
    },
    {
      title: 'General Inquiries',
      email: 'info@elevateforhumanity.org',
      description: 'All other questions and inquiries',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Have questions about our programs, funding, or partnerships? We are here to help.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-md transition-all"
              >
                <method.icon className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{method.title}</h3>
                  <p className="text-brand-blue-600 font-medium">{method.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{method.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                    <option>General Inquiry</option>
                    <option>Program Information</option>
                    <option>Application Help</option>
                    <option>Funding Questions</option>
                    <option>Employer Partnership</option>
                    <option>Technical Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Department Contacts */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Department Contacts</h2>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.title} className="bg-white rounded-xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-1">{dept.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{dept.description}</p>
                    <a
                      href={`mailto:${dept.email}`}
                      className="inline-flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                    >
                      <Mail className="w-4 h-4" /> {dept.email}
                    </a>
                  </div>
                ))}
              </div>

              {/* Additional Resources */}
              <div className="mt-8 p-6 bg-brand-blue-50 rounded-xl border border-brand-blue-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-blue-600" />
                  Office Hours
                </h3>
                <p className="text-slate-600 text-sm">
                  Monday - Friday: 8:00 AM - 5:00 PM EST<br />
                  Saturday: By appointment<br />
                  Sunday: Closed
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  We typically respond to emails within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find WorkOne CTA */}
      <section className="py-12 bg-green-50 border-t border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Find Your Local WorkOne Center
          </h2>
          <p className="text-slate-600 mb-6">
            WorkOne centers across Indiana provide free workforce services including job search, 
            training assistance, and career counseling.
          </p>
          <Link
            href="/find-workone"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Find WorkOne Location <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
