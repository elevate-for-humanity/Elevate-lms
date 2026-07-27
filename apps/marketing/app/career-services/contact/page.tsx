import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Career Services',
  keywords: ["career services", "contact", "support", "questions"],
  description: 'Get in touch with our career services team. We\'re here to help with resume building, job placement, and career counseling.',
};

export default function CareerServicesContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Career Services
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Contact Career Services
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Have questions about resume building, interview prep, or job placement? Our career services team is here to help.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="tel:3173143757" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Call (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Call Us</h3>
              <p className="text-sm text-slate-600 mb-4">Speak directly with a career counselor</p>
              <a href="tel:3173143757" className="text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700">
                (317) 314-3757
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Email Us</h3>
              <p className="text-sm text-slate-600 mb-4">Send your questions anytime</p>
              <a href="mailto:careers@elevateforhumanity.org" className="text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700">
                careers@elevateforhumanity.org
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Office Hours</h3>
              <p className="text-sm text-slate-600 mb-4">Mon-Fri, 8am-5pm EST</p>
              <span className="text-brand-blue-600 font-semibold text-sm">
                Virtual appointments available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">Send Us a Message</h2>
          <p className="text-slate-600 text-center mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">How Can We Help?</label>
                <select className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white">
                  <option>Select a topic</option>
                  <option>Resume Building Help</option>
                  <option>Interview Preparation</option>
                  <option>Job Search Support</option>
                  <option>Career Counseling</option>
                  <option>Other Question</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" placeholder="Tell us how we can help..."></textarea>
              </div>
              <button type="submit" className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Visit Us</h2>
          <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
            <MapPin className="w-4 h-4" />
            Indianapolis, Indiana
          </div>
          <p className="text-sm text-slate-500">Virtual services available throughout Indiana</p>
        </div>
      </section>
    </div>
  );
}
