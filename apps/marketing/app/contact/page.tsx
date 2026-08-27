import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageSquare, Users, Building2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Elevate for Humanity | Workforce Development & Apprenticeship Programs',
  description: 'Get in touch with our workforce development team. We help job seekers, employers, and training partners connect to funded career programs in Indianapolis and across Indiana.',
};

export default function ContactPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-200 font-semibold mb-3 tracking-wide uppercase text-sm">Get in Touch</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Let&apos;s Build Your Workforce Together
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Whether you&apos;re an individual seeking training, an employer building a talent pipeline, 
              or a workforce agency coordinating programs — we&apos;re here to help you succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
                
                <form className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
                      I am a...
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors"
                    >
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

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                      How Can We Help?
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors"
                    >
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
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500 transition-colors resize-none"
                      placeholder="Tell us about your goals, questions, or how we can support you..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-brand-orange-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-brand-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </button>
                </form>

                <p className="text-sm text-slate-500 mt-4 text-center">
                  We typically respond within 1-2 business days. For urgent matters, call us directly.
                </p>
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Contact */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Contact</h3>
                <div className="space-y-4">
                  <a href="tel:+13173140199" className="flex items-center gap-3 text-slate-700 hover:text-brand-orange-600 transition-colors">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-semibold">(317) 314-3757</p>
                    </div>
                  </a>
                  
                  <a href="mailto:info@elevateforhumanity.org" className="flex items-center gap-3 text-slate-700 hover:text-brand-orange-600 transition-colors">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold">info@elevateforhumanity.org</p>
                    </div>
                  </a>
                  
                  <div className="flex items-start gap-3 text-slate-700">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="font-semibold">120 E Market St, Suite 930</p>
                      <p className="font-semibold">Indianapolis, IN 46204</p>
                      <p className="text-sm">Serving all of Indiana</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-slate-700">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Hours</p>
                      <p className="font-semibold">Mon - Fri: 8am - 5pm EST</p>
                      <p className="text-sm">Evening appointments available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Who We Help */}
              <div className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-800 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Who We Serve</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-brand-orange-400" />
                    <span className="text-blue-100">Job seekers and career changers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-brand-orange-400" />
                    <span className="text-blue-100">Employers building talent pipelines</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-brand-orange-400" />
                    <span className="text-blue-100">Workforce agencies and WorkOne centers</span>
                  </div>
                </div>
              </div>

              {/* Schedule Appointment CTA */}
              <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Prefer to Talk?</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Schedule a free 30-minute consultation to discuss your workforce goals.
                </p>
                <Link
                  href="/schedule-consultation"
                  className="block w-full bg-brand-orange-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-orange-700 transition-colors text-center"
                >
                  Schedule Consultation
                </Link>
              </div>

              {/* Urgent Resources */}
              <div className="bg-slate-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Need Immediate Help?</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/check-eligibility" className="text-brand-blue-700 hover:underline">
                      → Check your funding eligibility
                    </Link>
                  </li>
                  <li>
                    <Link href="/career-assessment" className="text-brand-blue-700 hover:underline">
                      → Take a free career assessment
                    </Link>
                  </li>
                  <li>
                    <a href="https://www.indianacareerconnect.com/" target="_blank" rel="noopener noreferrer" className="text-brand-blue-700 hover:underline">
                      → Indiana Career Connect (State Portal)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.in.gov/dwd/workone-centers/" target="_blank" rel="noopener noreferrer" className="text-brand-blue-700 hover:underline">
                      → Find your local WorkOne Center
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What programs do you offer?</h3>
              <p className="text-slate-600 text-sm">
                We offer DOL-registered apprenticeships in barbering and cosmetology, plus workforce training programs in healthcare, skilled trades, technology, and more.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Is training really free?</h3>
              <p className="text-slate-600 text-sm">
                Funding depends on the program and each workforce agency’s eligibility, available funds, and written authorization. Applying is free, but tuition is not guaranteed to be covered.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">How do apprenticeships work?</h3>
              <p className="text-slate-600 text-sm">
                You earn while you learn — working at a host shop while completing related instruction. Most programs take 1-2 years to complete.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Can employers partner with you?</h3>
              <p className="text-slate-600 text-sm">
                Yes. We help employers explore apprenticeship partnerships and workforce services. Any tax credit, funding, or candidate eligibility is determined by the responsible agency and applicable program rules.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/faq" className="text-brand-blue-700 font-semibold hover:underline">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
